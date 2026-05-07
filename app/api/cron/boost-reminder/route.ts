import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendBoostEndingSoon } from '@/lib/email/sendBoostEndingSoon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/cron/boost-reminder
 *
 * Cron job déclenché par Vercel (vercel.json) une fois par jour.
 * Détecte les chefs dont le boost se termine dans 6-8 jours et qui n'ont
 * pas encore été notifiés (boostEndingNotifiedAt manquant ou antérieur au
 * boost en cours), envoie l'email de rappel et marque la notif comme
 * envoyée.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 * Vercel envoie ce header automatiquement pour les crons définis dans
 * vercel.json à condition que la variable d'env CRON_SECRET soit settée.
 */
export async function GET(req: Request) {
  // Auth
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';

  if (!expected) {
    console.error('[cron/boost-reminder] CRON_SECRET missing');
    return NextResponse.json(
      { error: 'CRON_SECRET_NOT_CONFIGURED' },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();

    // Scan tous les chef_profiles. Pas d'index sur profile->boostedUntil donc
    // on récupère tout et filtre côté code.
    const { data, error } = await admin
      .from('chef_profiles')
      .select('user_id, email, profile')
      .limit(5000);

    if (error) {
      console.error('[cron/boost-reminder] read error', error);
      return NextResponse.json(
        { error: 'READ_FAIL', detail: error.message },
        { status: 500 },
      );
    }

    const now = Date.now();
    const minMs = now + 6 * DAY_MS;
    const maxMs = now + 8 * DAY_MS;

    let scanned = 0;
    let candidates = 0;
    let sent = 0;
    let failed = 0;

    for (const row of data ?? []) {
      scanned++;
      const profile = (row.profile && typeof row.profile === 'object'
        ? row.profile
        : {}) as any;

      const boostedUntilRaw = profile.boostedUntil;
      if (!boostedUntilRaw) continue;

      const boostedUntilDate = new Date(String(boostedUntilRaw));
      const boostedUntilMs = boostedUntilDate.getTime();
      if (Number.isNaN(boostedUntilMs)) continue;

      // Boost déjà expiré → skip
      if (boostedUntilMs <= now) continue;

      // Hors fenêtre J-6 à J-8 → skip
      if (boostedUntilMs < minMs || boostedUntilMs > maxMs) continue;

      // Déjà notifié pour ce boost ? Le notifiedAt doit être antérieur au
      // boost en cours pour qu'on renotifie ; sinon, déjà fait.
      const notifiedRaw = profile.boostEndingNotifiedAt;
      if (notifiedRaw) {
        const notifiedMs = new Date(String(notifiedRaw)).getTime();
        // Si la notif a été faite dans les 30 derniers jours, c'était pour
        // ce boost (ou un boost avant non finalisé), on skip
        if (!Number.isNaN(notifiedMs) && now - notifiedMs < 30 * DAY_MS) {
          continue;
        }
      }

      candidates++;

      const email = String(row.email || profile.email || '').trim();
      if (!email) continue;

      const daysLeft = Math.max(
        0,
        Math.ceil((boostedUntilMs - now) / DAY_MS),
      );
      const locale =
        profile.preferredLocale === 'en' ||
        profile.preferredLocale === 'es' ||
        profile.preferredLocale === 'fr'
          ? profile.preferredLocale
          : 'fr';

      try {
        await sendBoostEndingSoon({
          email,
          firstName: profile.firstName,
          boostedUntil: boostedUntilDate.toISOString(),
          daysLeft,
          locale,
        });
        sent++;

        // Marque la notif envoyée
        await admin
          .from('chef_profiles')
          .update({
            profile: {
              ...profile,
              boostEndingNotifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          })
          .eq('user_id', row.user_id);
      } catch (e: any) {
        failed++;
        console.error(
          '[cron/boost-reminder] send failed for',
          email,
          e?.message,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      scanned,
      candidates,
      sent,
      failed,
    });
  } catch (e: any) {
    console.error('[cron/boost-reminder] unexpected error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}

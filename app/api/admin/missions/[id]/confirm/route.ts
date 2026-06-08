// app/api/admin/missions/[id]/confirm/route.ts
//
// PATCH /api/admin/missions/[id]/confirm
//   - Passe la mission en status='confirmed'
//   - Envoie un mail au chef en français avec TOUS les détails du contrat
//     (lieu, période complète, rythme, jour repos, logement, véhicule,
//     approvisionnements, rémunération avec acompte/solde)
//   - Source des détails : missions.contracts_data.chef (JSONB) si dispo,
//     sinon fallback sur les colonnes missions.* + valeurs CGV par défaut
//
// L'objectif : le mail est aligné sur le contrat chef qui sera signé via YouSign.

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { chefNotificationsEnabled, logChefNotificationSkipped } from '@/lib/email/chefNotifications';

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtEur(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return String(iso);
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function dateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—';
  if (start && end && start !== end) return `du ${fmtDate(start)} au ${fmtDate(end)}`;
  return fmtDate(start || end);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const missionId = decodeURIComponent((await ctx.params).id || '').trim();
    const body = await req.json().catch(() => ({} as any));
    const { contractUrl } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: mission, error: fetchErr } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (fetchErr || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Update statut → confirmed
    await supabase
      .from('missions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        contract_url: contractUrl || mission.contract_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId);

    // ─── Construction du contenu email aligné sur le contrat chef ───
    const chefContract = (mission.contracts_data?.chef ?? {}) as any;

    const firstName = (mission.chef_name || 'Chef').split(' ')[0];
    const locationFull = chefContract.lieu || mission.location || '—';
    const period = dateRange(mission.start_date, mission.end_date);
    const rythme = chefContract.rythme || '6 jours travaillés sur 7';
    const jourRepos = chefContract.jourRepos || '1 jour par semaine, à convenir avec le Client en début de mission';
    const logement = chefContract.logement || '—';
    const vehicule = chefContract.vehicule || '—';
    const approvisionnements = chefContract.approvisionnements || 'Gérés directement par le Client, le Chef n\'avance aucun frais';

    const chefAmount = chefContract.amountHt != null ? Number(chefContract.amountHt) : (mission.chef_amount ?? null);
    const depositPct = Number.isFinite(Number(chefContract.depositPct)) ? Number(chefContract.depositPct) : 15;
    const balancePct = 100 - depositPct;
    const balanceDays = Number.isFinite(Number(chefContract.balanceDays)) ? Number(chefContract.balanceDays) : 4;

    const depositAmount = chefAmount != null ? Math.round(chefAmount * depositPct) / 100 : null;
    const balanceAmount = chefAmount != null ? Math.round(chefAmount * balancePct) / 100 : null;

    const finalContractUrl = contractUrl || mission.contract_url;

    // ⚠️ Kill switch global — voir lib/email/chefNotifications.ts
    if (!chefNotificationsEnabled()) {
      logChefNotificationSkipped('missions/confirm', mission.chef_email);
      // On retourne quand même OK : la mission est passée en 'confirmed'
      // côté DB, seul l'email au chef est skippé.
    } else {
    try {
      await resend.emails.send({
        from: 'Thomas — Chefs Talents <contact@chefstalents.com>',
        to: mission.chef_email,
        replyTo: 'Chefs Talents <contact@chefstalents.com>',
        subject: `Mission confirmée — ${esc(mission.location || 'Mission privée')}`,
        html: `
<!doctype html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia, 'Times New Roman', serif;color:#161616;">
  <div style="max-width:600px;margin:0 auto;padding:40px 28px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 32px;">CHEFS TALENTS · MISSION CONFIRMÉE</p>

    <h1 style="font-size:26px;font-weight:normal;color:#161616;margin:0 0 12px;line-height:1.25;">Bonjour ${esc(firstName)},</h1>
    <p style="font-size:15px;line-height:1.7;color:#59544d;margin:0 0 28px;">
      Ta mission est confirmée. Voici le récapitulatif détaillé pour bien préparer ton intervention.
      ${finalContractUrl ? 'Le <strong>contrat chef</strong> te sera envoyé en parallèle via YouSign pour signature électronique.' : 'Tu recevras prochainement le contrat chef pour signature électronique.'}
    </p>

    <!-- Bloc 1 : Mission ────────────────────────────────────── -->
    <div style="background:#161616;border-radius:14px;padding:24px 28px;margin:0 0 20px;">
      <p style="color:#B08D57;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 18px;">✓ Détails de la mission</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;width:140px;vertical-align:top;">Lieu</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(locationFull)}</td></tr>
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Période</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(period)}</td></tr>
        ${mission.guest_count ? `<tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Couverts moyens</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(String(mission.guest_count))}</td></tr>` : ''}
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Rythme</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(rythme)}</td></tr>
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Jour de repos</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(jourRepos)}</td></tr>
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Logement</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(logement)}</td></tr>
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Véhicule</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(vehicule)}</td></tr>
        <tr><td style="color:#8a7f73;font-size:12px;padding:7px 0;vertical-align:top;">Approvisionnements</td><td style="color:#fff;font-size:14px;padding:7px 0;">${esc(approvisionnements)}</td></tr>
      </table>
    </div>

    <!-- Bloc 2 : Rémunération ──────────────────────────────── -->
    ${chefAmount != null ? `
    <div style="background:#fff;border:1px solid #d8d1c7;border-radius:14px;padding:22px 28px;margin:0 0 20px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 14px;">Ta rémunération</p>
      <div style="font-size:22px;color:#B08D57;font-weight:bold;margin:0 0 14px;">${esc(fmtEur(chefAmount))} HT</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="color:#59544d;padding:5px 0;width:140px;">Acompte ${depositPct} %</td><td style="color:#161616;padding:5px 0;font-weight:600;">${esc(fmtEur(depositAmount))}</td><td style="color:#8a7f73;padding:5px 0;font-size:12px;">à la signature du contrat chef</td></tr>
        <tr><td style="color:#59544d;padding:5px 0;">Solde ${balancePct} %</td><td style="color:#161616;padding:5px 0;font-weight:600;">${esc(fmtEur(balanceAmount))}</td><td style="color:#8a7f73;padding:5px 0;font-size:12px;">sous ${balanceDays} jours ouvrés après fin de mission</td></tr>
      </table>
    </div>` : ''}

    <!-- Bloc 3 : Contrat (CTA) ─────────────────────────────── -->
    ${finalContractUrl ? `
    <div style="background:#fff;border:1px solid #d8d1c7;border-radius:14px;padding:22px 28px;margin:0 0 20px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 10px;">Contrat chef</p>
      <p style="color:#161616;font-size:14px;line-height:1.6;margin:0 0 14px;">Vérifie et signe ton contrat de mission. La signature électronique te sera envoyée séparément via YouSign.</p>
      <a href="${esc(finalContractUrl)}" style="display:inline-block;background:#161616;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;border-radius:30px;">
        Voir le contrat →
      </a>
    </div>` : ''}

    <!-- Bloc 4 : Prochaines étapes ────────────────────────── -->
    <div style="background:#f4efe8;border:1px solid #d8d1c7;border-radius:14px;padding:22px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">Prochaines étapes</p>
      <ol style="color:#161616;font-size:14px;line-height:1.8;margin:0;padding-left:18px;">
        <li>Signer le contrat chef (envoyé via YouSign)</li>
        <li>Préparer ton intervention (menus, équipement, déplacement)</li>
        <li>Confirmer ton arrivée 48h avant le début</li>
        <li>Toute question : réponds directement à cet email</li>
      </ol>
    </div>

    <!-- Signature ─────────────────────────────────────────── -->
    <div style="border-top:1px solid #d8d1c7;padding-top:24px;">
      <p style="font-size:14px;color:#59544d;margin:0 0 4px;">À très vite,</p>
      <p style="font-size:16px;color:#161616;font-weight:bold;margin:0 0 4px;">Thomas Delcroix</p>
      <p style="font-size:12px;color:#8a7f73;margin:0;">Chefs Talents · contact@chefstalents.com · +33 7 56 82 76 12</p>
    </div>
  </div>
</body>
</html>`,
        text: [
          `Bonjour ${firstName},`,
          ``,
          `Ta mission est confirmée. Voici le récap :`,
          ``,
          `Lieu : ${locationFull}`,
          `Période : ${period}`,
          mission.guest_count ? `Couverts : ${mission.guest_count}` : '',
          `Rythme : ${rythme}`,
          `Jour de repos : ${jourRepos}`,
          `Logement : ${logement}`,
          `Véhicule : ${vehicule}`,
          `Approvisionnements : ${approvisionnements}`,
          ``,
          chefAmount != null ? `Rémunération : ${fmtEur(chefAmount)} HT` : '',
          chefAmount != null ? `  • Acompte ${depositPct}% à la signature : ${fmtEur(depositAmount)}` : '',
          chefAmount != null ? `  • Solde ${balancePct}% sous ${balanceDays}j ouvrés post-mission : ${fmtEur(balanceAmount)}` : '',
          ``,
          finalContractUrl ? `Contrat : ${finalContractUrl}` : '',
          finalContractUrl ? 'Signature électronique envoyée séparément via YouSign.' : 'Contrat envoyé prochainement via YouSign.',
          ``,
          `Toute question : réponds à cet email.`,
          ``,
          `Thomas Delcroix`,
          `Chefs Talents · contact@chefstalents.com · +33 7 56 82 76 12`,
        ].filter(Boolean).join('\n'),
      });

      await supabase
        .from('missions')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', missionId);

      console.log('[admin/missions/confirm] chef confirmation email sent to', mission.chef_email);
    } catch (e: any) {
      console.error('[admin/missions/confirm] email error', e?.message || e);
    }
    } // end else (chefNotificationsEnabled)

    return NextResponse.json({ ok: true, status: 'confirmed' });
  } catch (err: any) {
    console.error('[admin/missions/confirm] server error', err?.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

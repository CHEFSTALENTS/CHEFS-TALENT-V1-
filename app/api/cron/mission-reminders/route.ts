// app/api/cron/mission-reminders/route.ts
//
// GET /api/cron/mission-reminders
//
// Cron quotidien (vercel.json) qui scan les missions confirmées et envoie
// les rappels chef à J-30, J-7 et J0 selon la date de début.
//
// Tracking : 3 colonnes sur missions (reminder_30d_sent_at /
// reminder_7d_sent_at / reminder_dday_sent_at) garantissent qu'un rappel
// donné n'est envoyé qu'une seule fois par mission.
//
// Tolérance ±1 jour pour rattraper les missions oubliées en cas de
// downtime Vercel.
//
// Auth : Bearer ${CRON_SECRET}.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendMissionReminder, type MissionReminderVariant } from '@/lib/email/sendMissionReminder';

const DAY_MS = 24 * 60 * 60 * 1000;

type MissionRow = {
  id: string;
  chef_id: string | null;
  chef_email: string | null;
  chef_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  guest_count: number | null;
  service_level: string | null;
  notes: string | null;
  status: string | null;
  reminder_30d_sent_at: string | null;
  reminder_7d_sent_at: string | null;
  reminder_dday_sent_at: string | null;
};

function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function parseDateAsUtcMs(iso: string | null): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Pour une mission donnée, déduit quels rappels doivent être envoyés
 * aujourd'hui (en tenant compte de la tolérance ±1 jour et du flag déjà
 * envoyé). Renvoie la liste des variants à envoyer (généralement 0 ou 1).
 */
function pickVariantsToSend(
  m: MissionRow,
  todayMs: number,
): MissionReminderVariant[] {
  const startMs = parseDateAsUtcMs(m.start_date);
  if (startMs === null) return [];

  const daysUntil = Math.round((startMs - todayMs) / DAY_MS);
  const out: MissionReminderVariant[] = [];

  if (!m.reminder_30d_sent_at && daysUntil >= 29 && daysUntil <= 31) out.push('30d');
  if (!m.reminder_7d_sent_at && daysUntil >= 6 && daysUntil <= 8) out.push('7d');
  if (!m.reminder_dday_sent_at && daysUntil === 0) out.push('d_day');

  return out;
}

function variantToColumn(v: MissionReminderVariant): keyof MissionRow {
  if (v === '30d') return 'reminder_30d_sent_at';
  if (v === '7d') return 'reminder_7d_sent_at';
  return 'reminder_dday_sent_at';
}

export async function GET(req: Request) {
  // Auth
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';

  if (!expected) {
    console.error('[cron/mission-reminders] CRON_SECRET missing');
    return NextResponse.json({ error: 'CRON_SECRET_NOT_CONFIGURED' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const todayMs = startOfTodayUtc();
    // Fenêtre : aujourd'hui à aujourd'hui+32j (couvre J-30 et J-7 avec marge)
    const fromIso = new Date(todayMs).toISOString().slice(0, 10);
    const toIso = new Date(todayMs + 32 * DAY_MS).toISOString().slice(0, 10);

    const { data, error } = await admin
      .from('missions')
      .select('*')
      .eq('status', 'confirmed')
      .gte('start_date', fromIso)
      .lte('start_date', toIso)
      .limit(1000);

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('column') || msg.includes('does not exist')) {
        console.warn('[cron/mission-reminders] reminder columns missing, run migration first');
        return NextResponse.json({ ok: true, skipped: 'migration_needed' });
      }
      console.error('[cron/mission-reminders] read error', error);
      return NextResponse.json({ error: 'READ_FAIL', detail: error.message }, { status: 500 });
    }

    const missions = (data ?? []) as MissionRow[];
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const m of missions) {
      if (!m.chef_email) {
        skipped++;
        continue;
      }
      const variants = pickVariantsToSend(m, todayMs);
      if (variants.length === 0) {
        skipped++;
        continue;
      }

      for (const variant of variants) {
        try {
          // Récupère le prénom chef (best-effort, pas critique)
          let chefFirstName: string | null = null;
          if (m.chef_name) {
            chefFirstName = String(m.chef_name).split(' ')[0] || null;
          }

          await sendMissionReminder({
            to: m.chef_email,
            variant,
            chefFirstName,
            location: m.location,
            startDate: m.start_date,
            endDate: m.end_date,
            guestCount: m.guest_count,
            serviceLevel: m.service_level,
            notes: m.notes,
            missionId: m.id,
          });

          // Marque la colonne correspondante (idempotence)
          const col = variantToColumn(variant);
          const { error: updErr } = await admin
            .from('missions')
            .update({ [col]: new Date().toISOString() })
            .eq('id', m.id);

          if (updErr) {
            console.error('[cron/mission-reminders] mark-sent error', { missionId: m.id, variant, err: updErr.message });
          }
          sent++;
        } catch (e: any) {
          console.error('[cron/mission-reminders] send failed', { missionId: m.id, variant, err: e?.message });
          failed++;
        }
      }
    }

    console.log('[cron/mission-reminders] done', { scanned: missions.length, sent, failed, skipped });

    return NextResponse.json({ ok: true, scanned: missions.length, sent, failed, skipped });
  } catch (e: any) {
    console.error('[cron/mission-reminders] fatal', e?.message);
    return NextResponse.json({ error: 'SERVER_ERROR', detail: e?.message }, { status: 500 });
  }
}

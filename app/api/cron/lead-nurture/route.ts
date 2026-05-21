// app/api/cron/lead-nurture/route.ts
//
// Cron Vercel quotidien : envoie les emails de séquence nurture aux leads.
//
// Logique :
//   - Pour chaque lead status='active' :
//     - Si nurture_step=0 (welcome envoyé) ET created_at < now() - 3 jours → envoie step 1
//     - Si nurture_step=1                  ET last_email_at < now() - 4 jours → envoie step 2 (J+7 total)
//     - Si nurture_step=2                  ET last_email_at < now() - 7 jours → envoie step 3 (J+14 total)
//     - Si nurture_step=3 → fin de séquence, on update à nurture_step=4 ('end')
//
// Limites :
//   - Max 50 emails envoyés par run (pour ne pas dépasser le quota Resend)
//   - Si le lead a converti (status='converted') ou unsubscribed, on ignore.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLeadNurture } from '@/lib/email/sendLeadNurture';

const MAX_BATCH = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

// Nombre de jours minimum entre la dernière interaction email et l'étape suivante
const DELAY_AFTER_PREVIOUS_DAYS: Record<number, number> = {
  0: 3,  // step 0 → 1 : 3 jours après welcome
  1: 4,  // step 1 → 2 : 4 jours après step 1 (J+7 total depuis welcome)
  2: 7,  // step 2 → 3 : 7 jours après step 2 (J+14 total)
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET_NOT_CONFIGURED' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Récupère les leads actifs qui ne sont pas en fin de séquence
  const { data: leads, error: readErr } = await supabase
    .from('leads')
    .select('id, email, name, nurture_step, last_email_at, created_at')
    .eq('status', 'active')
    .lt('nurture_step', 4)
    .order('last_email_at', { ascending: true, nullsFirst: true })
    .limit(MAX_BATCH * 4); // marge pour filtrage côté code

  if (readErr) {
    console.error('[cron/lead-nurture] read error', readErr);
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const now = Date.now();
  const results: Array<{
    leadId: string;
    email: string;
    step: number;
    status: 'sent' | 'failed' | 'too_early';
    error?: string;
  }> = [];

  let sentCount = 0;

  for (const lead of leads || []) {
    if (sentCount >= MAX_BATCH) break;

    const currentStep = lead.nurture_step as number;
    const nextStep = currentStep + 1;
    if (nextStep > 3) {
      // Marque la fin de séquence
      await supabase.from('leads').update({ nurture_step: 4 }).eq('id', lead.id);
      continue;
    }

    const lastInteractionAt = lead.last_email_at
      ? new Date(lead.last_email_at).getTime()
      : new Date(lead.created_at).getTime();
    const delayDays = DELAY_AFTER_PREVIOUS_DAYS[currentStep] || 3;
    const dueAt = lastInteractionAt + delayDays * DAY_MS;

    if (now < dueAt) {
      // Pas encore l'heure
      continue;
    }

    // Envoie le step
    try {
      const firstName = lead.name ? String(lead.name).split(' ')[0] : undefined;
      await sendLeadNurture({
        to: lead.email,
        firstName,
        step: nextStep as 1 | 2 | 3,
      });

      await supabase
        .from('leads')
        .update({
          nurture_step: nextStep,
          last_email_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      sentCount++;
      results.push({ leadId: lead.id, email: lead.email, step: nextStep, status: 'sent' });
    } catch (e: any) {
      console.error('[cron/lead-nurture] send failed', { email: lead.email, step: nextStep, error: e?.message });
      results.push({
        leadId: lead.id,
        email: lead.email,
        step: nextStep,
        status: 'failed',
        error: e?.message?.slice(0, 200),
      });
    }
  }

  console.log('[cron/lead-nurture] done', {
    candidates: leads?.length || 0,
    sent: sentCount,
    failed: results.filter((r) => r.status === 'failed').length,
  });

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
}

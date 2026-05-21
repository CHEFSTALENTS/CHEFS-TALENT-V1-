// app/api/leads/submit/route.ts
//
// POST /api/leads/submit
// Capture un email depuis un lead magnet (page /guide, etc.) et déclenche
// l'email de welcome immédiatement.
//
// Body :
//   { email: string, name?, phone?, source?, utm_source?, utm_medium?, utm_campaign?, referrer? }
//
// Pas d'auth — endpoint public, mais on protège contre les abus via :
//   1. Validation basique de l'email
//   2. Unicité (email, source) en DB
//   3. Rate limit (5 req / 10 min par IP) — TODO si abus

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLeadMagnetWelcome } from '@/lib/email/sendLeadMagnetWelcome';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const name = body?.name ? String(body.name).trim().slice(0, 100) : null;
  const phone = body?.phone ? String(body.phone).trim().slice(0, 40) : null;
  const source = String(body?.source || 'guide').trim().slice(0, 40);

  const supabase = getSupabase();

  // Upsert : si l'email existe déjà pour cette source, on ne re-déclenche pas
  // l'email de welcome (pour éviter le spam). On renvoie ok=true pour ne pas
  // exposer la liste des emails existants.
  const { data: existing } = await supabase
    .from('leads')
    .select('id, status, nurture_step')
    .eq('email', email)
    .eq('source', source)
    .maybeSingle();

  if (existing) {
    // L'utilisateur a déjà soumis ce form. Pas de nouvel email.
    return NextResponse.json({
      ok: true,
      alreadyRegistered: true,
      guidePath: '/guide/chef-prive',
    });
  }

  // Insert
  const { data: inserted, error: insertErr } = await supabase
    .from('leads')
    .insert({
      email,
      name,
      phone,
      source,
      utm_source: body?.utm_source || null,
      utm_medium: body?.utm_medium || null,
      utm_campaign: body?.utm_campaign || null,
      referrer: body?.referrer || null,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
      status: 'active',
      nurture_step: 0,
    })
    .select('id, email, name')
    .single();

  if (insertErr) {
    console.error('[leads/submit] insert error', insertErr);
    return NextResponse.json(
      { ok: false, error: 'submit_failed' },
      { status: 500 },
    );
  }

  // Envoie l'email de welcome immédiatement.
  // Si Resend échoue, on log mais on renvoie OK (le lead est en DB, on
  // pourra rejouer le welcome via un mécanisme de rattrapage).
  const firstName = name ? name.split(' ')[0] : undefined;
  try {
    await sendLeadMagnetWelcome({
      to: email,
      firstName,
      guidePath: '/guide/chef-prive',
    });
    // Marque last_email_at pour que le cron nurture compte les J+3/J+7/J+14 depuis maintenant
    await supabase
      .from('leads')
      .update({ last_email_at: new Date().toISOString() })
      .eq('id', inserted.id);
  } catch (e: any) {
    console.error('[leads/submit] welcome email failed', { email, error: e?.message });
  }

  return NextResponse.json({
    ok: true,
    guidePath: '/guide/chef-prive',
  });
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Tolérance aux différents payloads front
    const email = body.email;
    const firstName =
      body.firstName ||
      (typeof body.fullName === 'string' ? body.fullName.split(' ')[0] : null) ||
      null;

    // matchType attendu: 'fast' | 'concierge'
    const matchType =
      body.matchType ||
      body.mode || // si tu envoies mode=fast/concierge
      (body?.type === 'instant_match' ? 'fast' : body?.type) ||
      'fast';

    const message =
      body.message ||
      body.notes ||
      body.cuisinePreferences ||
      '';

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1) Insert + get ID
    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        email,
        first_name: firstName,
        match_type: matchType,
        message,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('DB error:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const requestId = data.id;

    // 2) Email client (avec logs)
    try {
      console.log('📧 Sending confirmation to:', email, 'type:', matchType);

      await sendClientConfirmation({
  email: body.email,
  firstName: body.fullName,
  type: body.mode === 'fast' ? 'fast' : 'concierge',
});
      
console.log("EMAIL PAYLOAD", {
  email: body.email,
  fullName: body.fullName,
  mode: body.mode,
});
      // 3) Mark sent
      await supabase
        .from('client_requests')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', requestId);

      return NextResponse.json({ ok: true, requestId, emailSent: true });
    } catch (e) {
      console.error('EMAIL ERROR:', e);

      // On garde la demande créée, mais on remonte clairement l’erreur
      return NextResponse.json(
        { ok: true, requestId, emailSent: false, emailError: String(e) },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

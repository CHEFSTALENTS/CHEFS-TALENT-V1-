export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.email || !body?.matchType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Insert DB
    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        email: body.email,
        first_name: body.firstName,
        match_type: body.matchType, // 'fast' | 'concierge'
        message: body.message,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('DB insert error', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const requestId = data.id;

    // 2) Send email
    try {
      const result = await sendClientConfirmation({
        email: body.email,
        firstName: body.firstName,
        type: body.matchType,
      });

      console.log('RESEND RESULT', result);

      // 3) Mark email sent
      await supabase
        .from('client_requests')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', requestId);
    } catch (e) {
      // 👇 si tu veux que l'API échoue quand l'email échoue, remplace par return 500
      console.error('EMAIL SEND ERROR', e);
      // on continue quand même pour ne pas bloquer la création de demande
    }

    return NextResponse.json({ ok: true, requestId });
  } catch (err) {
    console.error('Server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

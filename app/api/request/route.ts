export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Enregistrement de la demande + récupération de l’ID
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
      console.error(error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const requestId = data.id;

    // 2. Email de confirmation client
    await sendClientConfirmation({
      email: body.email,
      firstName: body.firstName,
      type: body.matchType,
    });

    // 3. Marquer l’email comme envoyé
    await supabase
      .from('client_requests')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', requestId);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Connexion Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Enregistrement de la demande
    const { error } = await supabase
      .from('client_requests')
      .insert({
        email: body.email,
        first_name: body.firstName,
        match_type: body.matchType, // 'fast' | 'concierge'
        message: body.message,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // 3. ✅ EMAIL DE CONFIRMATION CLIENT
    await sendClientConfirmation({
      email: body.email,
      firstName: body.firstName,
      type: body.matchType,
    });

    // 4. Réponse OK
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

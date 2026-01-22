export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';
import { sendInternalNewRequest } from '@/lib/sendInternalNewRequest';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Insert + récupérer l’ID
    const createdAtISO = new Date().toISOString();

  const { data, error } = await supabase
  .from('client_requests')
  .insert({
    email: body.email,
    first_name: body.firstName,
    match_type: body.matchType,
    message: body.message,

    // ✅ IMPORTANT : sinon invisible dans l’admin
    status: 'new',

    // ✅ Colonnes affichées par l’admin
    client_type: body.clientType ?? null,
    company_name: body.companyName ?? null,
    location: body.location ?? null,
    start_date: body.startDate ?? null,
    end_date: body.endDate ?? null,
    guest_count: body.guestCount ?? null,
    budget_range: body.budgetRange ?? null,
    assignment_type: body.assignmentType ?? null,
  })
  .select('id')
  .single();

    if (error || !data) {
      console.error(error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const requestId = data.id as string;

    // 2) Email client
    await sendClientConfirmation({
      email: body.email,
      firstName: body.firstName,
      type: body.matchType,
    });

    // 3) Email interne (toi / équipe)
    await sendInternalNewRequest({
      requestId,
      matchType: body.matchType,
      email: body.email,
      firstName: body.firstName,
      message: body.message,
      createdAtISO,
    });

    // 4) Log en DB
    await supabase
      .from('client_requests')
      .update({
        email_sent_at: new Date().toISOString(),
        internal_email_sent_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ ok: true, requestId });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

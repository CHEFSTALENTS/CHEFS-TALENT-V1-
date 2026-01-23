export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';
import { sendInternalNewRequest } from '@/lib/sendInternalNewRequest';

const asStrOrNull = (v: any) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};

const asIntOrNull = (v: any) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const createdAtISO = new Date().toISOString();

    // ✅ IMPORTANT: pour les colonnes "date" -> jamais ""
    const start_date = asStrOrNull(body.startDate);
    const end_date = asStrOrNull(body.endDate);

    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        email: asStrOrNull(body.email),
        first_name: asStrOrNull(body.firstName),
        match_type: body.matchType, // 'fast' | 'concierge'
        message: asStrOrNull(body.message),

        status: 'new',

        client_type: asStrOrNull(body.clientType),
        company_name: asStrOrNull(body.companyName),
        location: asStrOrNull(body.location),

        start_date, // ✅ colonne DB
        end_date,   // ✅ colonne DB

        guest_count: asIntOrNull(body.guestCount),
        budget_range: asStrOrNull(body.budgetRange),
        assignment_type: asStrOrNull(body.assignmentType),
        phone: asStrOrNull(body.phone),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[client_requests insert error]', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requestId = data.id as string;

    // Emails (non bloquants)
    try {
      await sendClientConfirmation({
        email: body.email,
        firstName: body.firstName,
        type: body.matchType,
      });
    } catch (e) {
      console.error('[sendClientConfirmation error]', e);
    }

    try {
      await sendInternalNewRequest({
        requestId,
        matchType: body.matchType,
        email: body.email,
        firstName: body.firstName,
        message: body.message,
        createdAtISO,
      });
    } catch (e) {
      console.error('[sendInternalNewRequest error]', e);
    }

    await supabase
      .from('client_requests')
      .update({
        email_sent_at: new Date().toISOString(),
        internal_email_sent_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ ok: true, requestId });
  } catch (err) {
    console.error('[api/request] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

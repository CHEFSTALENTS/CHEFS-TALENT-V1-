export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefEnquiryConfirmation } from '@/lib/sendChefEnquiryConfirmation';
import { sendInternalChefEnquiry } from '@/lib/sendInternalChefEnquiry';

const strOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = strOrNull(body.email);
    const fullName = strOrNull(body.fullName);
    const firstName = fullName ? fullName.split(' ')[0] : null;
    const background = strOrNull(body.background);
    const destinations = strOrNull(body.destinations);
    const type = strOrNull(body.type) ?? 'integration_programme';
    const lang = strOrNull(body.lang) ?? 'en';

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // 1. Stocker dans Supabase
    const { data, error } = await supabase
      .from('chef_enquiries')
      .insert({
        full_name: fullName,
        first_name: firstName,
        email,
        background,
        destinations,
        type,
        lang,
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[chef_enquiries insert error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enquiryId = data.id as string;

    let clientEmailOk = false;
    let internalEmailOk = false;

    // 2. Email de confirmation au chef
    try {
      await sendChefEnquiryConfirmation({
        email,
        firstName: firstName ?? undefined,
        lang,
      });
      clientEmailOk = true;
    } catch (e) {
      console.error('[sendChefEnquiryConfirmation error]', e);
    }

    // 3. Notification interne
    try {
      await sendInternalChefEnquiry({
        enquiryId,
        email,
        fullName: fullName ?? undefined,
        background: background ?? undefined,
        destinations: destinations ?? undefined,
        lang,
        createdAtISO: new Date().toISOString(),
      });
      internalEmailOk = true;
    } catch (e) {
      console.error('[sendInternalChefEnquiry error]', e);
    }

    // 4. Mettre à jour les timestamps d'envoi
    const patch: Record<string, any> = {};
    if (clientEmailOk) patch.email_sent_at = new Date().toISOString();
    if (internalEmailOk) patch.internal_email_sent_at = new Date().toISOString();
    if (Object.keys(patch).length) {
      await supabase.from('chef_enquiries').update(patch).eq('id', enquiryId);
    }

    return NextResponse.json({
      ok: true,
      enquiryId,
      emailClientSent: clientEmailOk,
      emailInternalSent: internalEmailOk,
    });

  } catch (err) {
    console.error('[api/chef-enquiry] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

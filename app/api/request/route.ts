export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';
import { sendInternalNewRequest } from '@/lib/sendInternalNewRequest';

const strOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

const joinIfArray = (v: any): string | null => {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    const cleaned = v.map(x => String(x ?? '').trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : null;
  }
  return strOrNull(v);
};

const intOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const dateOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  // Supabase column type = date => attend YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // champs normalisés (existants)
    const email = strOrNull(body.email);
    const firstName = strOrNull(body.firstName);
    const matchType = strOrNull(body.matchType); // 'fast' | 'concierge'
    const message = strOrNull(body.message);

    const phone = strOrNull(body.phone);
    const clientType = strOrNull(body.clientType);
    const companyName = strOrNull(body.companyName);
    const location = strOrNull(body.location);

    const start_date = dateOrNull(body.startDate);
    const end_date = dateOrNull(body.endDate);

    const guest_count = intOrNull(body.guestCount);
    const budget_range = strOrNull(body.budgetRange);
    const assignment_type = strOrNull(body.assignmentType);

    // ✅ NOUVEAUX champs (tolérant sur la forme du payload)
    const preferred_language = joinIfArray(
      body.preferredLanguage ??
        body.preferred_language ??
        body.language ??
        body.lang ??
        body.preferences?.language ??
        body.preferences?.languages
    );

    const dietary_restrictions = joinIfArray(
      body.dietaryRestrictions ??
        body.dietary_restrictions ??
        body.restrictions ??
        body.allergies ??
        body.preferences?.dietaryRestrictions ??
        body.preferences?.dietary_restrictions ??
        body.preferences?.allergies
    );

    const cuisine_preferences = joinIfArray(
      body.cuisinePreferences ??
        body.cuisine_preferences ??
        body.cuisineStyle ??
        body.cuisine_style ??
        body.cuisine ??
        body.preferences?.cuisine ??
        body.preferences?.cuisines
    );

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    if (matchType !== 'fast' && matchType !== 'concierge') {
      return NextResponse.json({ error: 'Invalid matchType' }, { status: 400 });
    }

    // 1) Insert
    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        email,
        first_name: firstName,
        match_type: matchType,
        message,
        status: 'new',

        client_type: clientType,
        company_name: companyName,
        location,

        start_date,
        end_date,

        guest_count,
        budget_range,
        assignment_type,
        phone,

        // ✅ insert des champs manquants
        preferred_language,
        dietary_restrictions,
        cuisine_preferences,
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

    // 2) Emails (non bloquants) + timestamps only if success
    let clientEmailOk = false;
    let internalEmailOk = false;

    try {
      await sendClientConfirmation({
        email,
        firstName: firstName ?? undefined,
        type: matchType as any,
      });
      clientEmailOk = true;
    } catch (e) {
      console.error('[sendClientConfirmation error]', e);
    }

    try {
      await sendInternalNewRequest({
        requestId,
        matchType: matchType as any,
        email,
        firstName: firstName ?? undefined,
        message: message ?? undefined,
        createdAtISO: new Date().toISOString(),
      });
      internalEmailOk = true;
    } catch (e) {
      console.error('[sendInternalNewRequest error]', e);
    }

    // 3) Update logs (seulement si ok)
    const patch: Record<string, any> = {};
    if (clientEmailOk) patch.email_sent_at = new Date().toISOString();
    if (internalEmailOk) patch.internal_email_sent_at = new Date().toISOString();

    if (Object.keys(patch).length) {
      await supabase.from('client_requests').update(patch).eq('id', requestId);
    }

    return NextResponse.json({
      ok: true,
      requestId,
      emailClientSent: clientEmailOk,
      emailInternalSent: internalEmailOk,
    });
  } catch (err) {
    console.error('[api/request] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';
import { sendInternalNewRequest } from '@/lib/sendInternalNewRequest';

const strOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

const toStr = (x: any) => {
  if (x === null || x === undefined) return '';
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  if (typeof x === 'object') return String(x.label ?? x.value ?? x.name ?? '').trim();
  return String(x).trim();
};

const joinIfArray = (v: any): string | null => {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    const cleaned = v.map(toStr).map((s) => s.trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : null;
  }
  const s = toStr(v).trim();
  return s ? s : null;
};

const intOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const numberOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const dateOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
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

    const email = strOrNull(body.email);
    const firstName = strOrNull(body.firstName);
    const fullName = strOrNull(body.fullName);

    const matchType = strOrNull(body.matchType ?? body.mode);
    const message = strOrNull(body.message);
    const notes = strOrNull(body.notes);

    const phone = strOrNull(body.phone);
    const clientType = strOrNull(body.clientType);
    const companyName = strOrNull(body.companyName);
    const location = strOrNull(body.location);

    const start_date = dateOrNull(body.startDate);
    const end_date = dateOrNull(body.endDate);
    const date_mode = strOrNull(body.dateMode);

    const guest_count = intOrNull(body.guestCount);

    const budget_range = strOrNull(body.budgetRange);
    const budget_amount = numberOrNull(body.budgetAmount);
    const budget_unit = strOrNull(body.budgetUnit);

    const assignment_type = strOrNull(body.assignmentType);
    const service_expectations = strOrNull(body.serviceExpectations);
    const service_rhythm = strOrNull(body.serviceRhythm);

    const mission_category = strOrNull(body.missionCategory);
    const meal_plan = strOrNull(body.mealPlan);
    const replacement_needed = strOrNull(body.replacementNeeded);

    const preferred_language = joinIfArray(
      body.preferredLanguage ??
        body.preferred_language ??
        body.language ??
        body.lang ??
        body.preferences?.preferredLanguage ??
        body.preferences?.preferred_language ??
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
        body.preferences?.restrictions ??
        body.preferences?.allergies
    );

    const cuisine_preferences = joinIfArray(
      body.cuisinePreferences ??
        body.cuisine_preferences ??
        body.cuisineStyle ??
        body.cuisine_style ??
        body.cuisine ??
        body.preferences?.cuisinePreferences ??
        body.preferences?.cuisine_preferences ??
        body.preferences?.cuisine ??
        body.preferences?.cuisines
    );

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    if (matchType !== 'fast' && matchType !== 'concierge') {
      return NextResponse.json({ error: 'Invalid matchType' }, { status: 400 });
    }

    const insertRow = {
      email,
      first_name: firstName,
      full_name: fullName,

      match_type: matchType,
      status: 'new',

      message,
      notes,

      phone,
      client_type: clientType,
      company_name: companyName,
      location,

      start_date,
      end_date,
      date_mode,

      guest_count,

      budget_range,
      budget_amount,
      budget_unit,

      assignment_type,
      service_expectations,
      service_rhythm,

      mission_category,
      meal_plan,
      replacement_needed,

      preferred_language,
      dietary_restrictions,
      cuisine_preferences,
    };

    const { data, error } = await supabase
      .from('client_requests')
      .insert(insertRow)
      .select('id')
      .single();

    if (error) {
      console.error('[client_requests insert error]', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
        insertRow,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requestId = data.id as string;

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
        message: message ?? notes ?? undefined,
        createdAtISO: new Date().toISOString(),
      });
      internalEmailOk = true;
    } catch (e) {
      console.error('[sendInternalNewRequest error]', e);
    }

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

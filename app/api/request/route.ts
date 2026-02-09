export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendClientConfirmation } from '@/lib/sendClientConfirmation';
import { sendInternalNewRequest } from '@/lib/sendInternalNewRequest';

/* ---------------- helpers ---------------- */

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
    const cleaned = v.map(toStr).map(s => s.trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : null;
  }
  const s = toStr(v).trim();
  return s ? s : null;
};

const intOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const dateOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  // Supabase column type = date => YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
};

function buildPrefs(body: any) {
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

  return { preferred_language, dietary_restrictions, cuisine_preferences };
}

/* ---------------- route ---------------- */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase env vars', missing: { supabaseUrl: !supabaseUrl, serviceKey: !serviceKey } },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

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

    const { preferred_language, dietary_restrictions, cuisine_preferences } = buildPrefs(body);

    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    if (matchType !== 'fast' && matchType !== 'concierge') {
      return NextResponse.json({ error: 'Invalid matchType' }, { status: 400 });
    }

    const insertPayload: Record<string, any> = {
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

      preferred_language,
      dietary_restrictions,
      cuisine_preferences,

      // debug utile (si colonne existe)
      debug_payload: body,
    };

    // 1) Insert (avec fallback si debug_payload n'existe pas)
    let data: any = null;

    {
      const res = await supabase
        .from('client_requests')
        .insert(insertPayload)
        .select('id')
        .single();

      if (res.error) {
        // Si la colonne debug_payload n'existe pas, on réessaie sans
        const msg = String(res.error.message || '');
        const looksLikeMissingDebug =
          msg.toLowerCase().includes('debug_payload') &&
          (msg.toLowerCase().includes('column') || msg.toLowerCase().includes('schema'));

        if (looksLikeMissingDebug) {
          delete insertPayload.debug_payload;

          const res2 = await supabase
            .from('client_requests')
            .insert(insertPayload)
            .select('id')
            .single();

          if (res2.error) {
            console.error('[client_requests insert error #2]', res2.error, insertPayload);
            return NextResponse.json({ error: res2.error.message, details: (res2.error as any).details }, { status: 500 });
          }

          data = res2.data;
        } else {
          console.error('[client_requests insert error]', res.error, insertPayload);
          return NextResponse.json({ error: res.error.message, details: (res.error as any).details }, { status: 500 });
        }
      } else {
        data = res.data;
      }
    }

    const requestId = data.id as string;

    // 2) Emails (non bloquants)
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
      const up = await supabase.from('client_requests').update(patch).eq('id', requestId);
      if (up.error) console.error('[client_requests update logs error]', up.error);
    }

    return NextResponse.json({
      ok: true,
      requestId,
      saved: {
        preferred_language,
        dietary_restrictions,
        cuisine_preferences,
      },
      emailClientSent: clientEmailOk,
      emailInternalSent: internalEmailOk,
    });
  } catch (err: any) {
    console.error('[api/request] server error', err);
    // IMPORTANT : on renvoie l’erreur réelle pour debug (tu peux resserrer après)
    return NextResponse.json(
      { error: err?.message ?? 'Server error', hint: err?.hint, details: err?.details },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // important sur Vercel

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return bad('Missing SUPABASE env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).', 500);
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase();
    const company = String(body?.company || '').trim() || null;
    const role = String(body?.role || '').trim() || null;
    const source = String(body?.source || '').trim() || 'access_gate';

    if (!email || !isValidEmail(email)) {
      return bad('Invalid email');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // meta
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    const userAgent = req.headers.get('user-agent') || null;

    /**
     * ✅ Upsert sur email (passe même si déjà inscrit)
     * - Tu as déjà un unique index sur email => parfait
     */
    const { data, error } = await supabase
      .from('waitlist')
      .upsert(
        [{ email, company, role, source, ip, user_agent: userAgent }],
        { onConflict: 'email' }
      )
      .select('id,email')
      .single();

    if (error) {
      console.error('[waitlist] supabase error', error);
      return bad(error.message || 'Supabase insert failed', 500);
    }

    return NextResponse.json({ success: true, id: data?.id, email: data?.email });
  } catch (e: any) {
    console.error('[waitlist] fatal', e);
    return bad(e?.message || 'Server error', 500);
  }
}

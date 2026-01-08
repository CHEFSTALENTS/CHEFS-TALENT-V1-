import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, {
        success: false,
        error: 'SUPABASE_ENV_MISSING',
        message:
          'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env vars.',
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const company = String(body?.company || '').trim() || null;
    const role = String(body?.role || 'concierge').trim();
    const source = String(body?.source || 'access_gate').trim();

    if (!email || !email.includes('@')) {
      return json(400, { success: false, error: 'INVALID_EMAIL' });
    }

    // Supabase server client (service role => bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Upsert by email (requires unique constraint on email in DB)
    const { data, error } = await supabase
      .from('waitlist')
      .upsert(
        [
          {
            email,
            company,
            role,
            source,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      )
      .select('email')
      .single();

    if (error) {
      return json(500, {
        success: false,
        error: 'SUPABASE_INSERT_FAILED',
        message: error.message,
      });
    }

    return json(200, { success: true, email: data?.email || email });
  } catch (e: any) {
    return json(500, { success: false, error: 'SERVER_ERROR', message: e?.message || String(e) });
  }
}

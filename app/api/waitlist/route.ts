// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // important si jamais tu es en edge par défaut

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const company = String(body?.company || '').trim() || null;
    const role = String(body?.role || '').trim() || null;
    const source = String(body?.source || 'access_gate').trim();

    if (!email || !email.includes('@')) {
      return json({ success: false, error: 'EMAIL_INVALID' }, 400);
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return json(
        {
          success: false,
          error: 'SUPABASE_ENV_MISSING',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceKey,
          },
        },
        500
      );
    }

    // Service role => bypass RLS
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Table: public.waitlist (email unique)
    const { data, error } = await supabase
      .from('waitlist')
      .upsert(
        {
          email,
          company,
          role,
          source,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id,email,company,role,source,created_at')
      .single();

    if (error) {
      return json(
        {
          success: false,
          error: 'SUPABASE_INSERT_FAIL',
          details: {
            message: error.message,
            code: (error as any).code,
            hint: (error as any).hint,
          },
        },
        500
      );
    }

    return json({ success: true, row: data }, 200);
  } catch (e: any) {
    return json(
      {
        success: false,
        error: 'UNEXPECTED',
        details: String(e?.message || e),
      },
      500
    );
  }
}

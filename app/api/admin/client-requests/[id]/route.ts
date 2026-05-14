// app/api/admin/client-requests/[id]/route.ts
//
// PATCH /api/admin/client-requests/[id]
// Edit des données contact du client (fullName, email, phone, companyName)
// depuis la page mission /admin/missions/[id]. Auth admin via Bearer.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const TABLE = 'client_requests';

function strOrNull(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s || null;
}

function isValidEmail(v: string): boolean {
  return /^\S+@\S+\.\S+$/.test(v);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    // fullName : permet de modifier full_name + first_name (premier mot)
    if (body.fullName !== undefined) {
      const fn = strOrNull(body.fullName);
      patch.full_name = fn;
      patch.first_name = fn ? fn.split(' ')[0] : null;
    }

    if (body.email !== undefined) {
      const e = strOrNull(body.email);
      if (e && !isValidEmail(e)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      patch.email = e;
    }

    if (body.phone !== undefined) {
      patch.phone = strOrNull(body.phone);
    }

    if (body.companyName !== undefined) {
      patch.company_name = strOrNull(body.companyName);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid field to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select('id, email, full_name, first_name, phone, company_name, client_type')
      .single();

    if (error) {
      console.error('[admin/client-requests PATCH]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Renvoie au format attendu par le frontend (camelCase)
    return NextResponse.json({
      ok: true,
      client: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        firstName: data.first_name,
        phone: data.phone,
        companyName: data.company_name,
        clientType: data.client_type,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'PATCH /api/admin/client-requests/[id] failed' },
      { status: 500 },
    );
  }
}

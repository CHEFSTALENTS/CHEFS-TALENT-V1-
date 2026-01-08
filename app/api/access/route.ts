import { NextRequest, NextResponse } from 'next/server';

type Area = 'admin' | 'public' | 'chef';

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const areaRaw = String(body?.area || 'public').toLowerCase();
  const area: Area =
    areaRaw === 'admin' || areaRaw === 'chef' || areaRaw === 'public'
      ? (areaRaw as Area)
      : 'public';

  const code = String(body?.code || '').trim();

  const ADMIN_CODE = process.env.CT_ADMIN_CODE || '';
  const PUBLIC_CODE = process.env.CT_PUBLIC_CODE || '';
  const CHEF_CODE = process.env.CT_CHEF_CODE || PUBLIC_CODE;

  const expected =
    area === 'admin' ? ADMIN_CODE :
    area === 'chef' ? CHEF_CODE :
    PUBLIC_CODE;

  if (!expected) {
    return NextResponse.json(
      { success: false, error: `Code ${area} non configuré (env manquante).` },
      { status: 500 }
    );
  }

  if (!code || code !== expected) {
    return NextResponse.json(
      { success: false, error: 'Code invalide.' },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ success: true });

  const cookie = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  };

  if (area === 'admin') {
    res.cookies.set('ct_gate_admin', '1', cookie);
  } else if (area === 'chef') {
    res.cookies.set('ct_gate_chef', '1', cookie);
    res.cookies.set('ct_gate_public', '1', cookie);
  } else {
    res.cookies.set('ct_gate_public', '1', cookie);
  }

  return res;
}

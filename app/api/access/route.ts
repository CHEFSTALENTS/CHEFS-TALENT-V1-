import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Area = 'admin' | 'chef' | 'public';

function isValid(area: Area, code: string) {
  const c = (code || '').trim();
  if (!c) return false;

  if (area === 'admin') return c === process.env.ADMIN_CODE;
  if (area === 'chef') return c === process.env.CHEF_CODE;
  return c === process.env.PUBLIC_CODE;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const area = (body?.area || '') as Area;
  const code = String(body?.code || '');
  const next = String(body?.next || '/');

  if (!['admin', 'chef', 'public'].includes(area)) {
    return NextResponse.json({ error: 'Bad area' }, { status: 400 });
  }

  if (!isValid(area, code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next });

  const cookieName =
    area === 'admin'
      ? 'ct_gate_admin'
      : area === 'chef'
      ? 'ct_gate_chef'
      : 'ct_gate_public';

  res.cookies.set(cookieName, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  return res;
}

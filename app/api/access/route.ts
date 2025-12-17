import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: '' }));
  const expected = process.env.SITE_ACCESS_CODE || '';

  if (!expected || code !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Cookie 7 jours (ajuste si tu veux)
  res.cookies.set('ct_access', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

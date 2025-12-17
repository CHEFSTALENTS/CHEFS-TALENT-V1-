import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: '' }));

  const expected = (process.env.SITE_ACCESS_CODE || '').trim();
  const entered = String(code || '').trim();

  if (!expected) {
    return NextResponse.json({ ok: false, error: 'SITE_ACCESS_CODE manquant' }, { status: 500 });
  }

  if (entered !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('ct_access', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
  return res;
}

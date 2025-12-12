import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  // Mot de passe simple (tu peux le changer)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'chef123';

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // Cookie simple (7 jours)
  res.cookies.set('admin_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

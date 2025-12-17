import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code } = await req.json();
const expected = (process.env.SITE_ACCESS_CODE || '').trim();
const entered = (code || '').trim();

if (entered !== expected) {
  // erreur
}

  if (!expected || code !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ct_access", expected, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessCode = process.env.SITE_ACCESS_CODE;
  const cookie = req.cookies.get("ct_access")?.value;

  // sécurité : si pas de code défini, on bloque rien
  if (!accessCode) return NextResponse.next();

  // autorisé si cookie OK
  if (cookie === accessCode) return NextResponse.next();

  // autoriser la page d’accès
  if (req.nextUrl.pathname === "/access") return NextResponse.next();

  // sinon → redirect
  const url = req.nextUrl.clone();
  url.pathname = "/access";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

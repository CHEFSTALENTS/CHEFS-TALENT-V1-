import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/chef/login",
  "/chef/signup",
  "/chef/forgot-password",
  "/chef/reset-password",
  "/auth/callback",
];

function redirectToAccess(req: NextRequest, area: "admin" | "public") {
  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;

  url.pathname = "/access";
  url.searchParams.set("area", area);
  url.searchParams.set("next", next);

  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer la page d'accès + assets + next internals
 if (
  pathname.startsWith('/access') ||
  pathname.startsWith('/auth/callback') || // ✅ important
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.startsWith('/robots.txt') ||
  pathname.startsWith('/sitemap')
) {
  return NextResponse.next();
}


  // ✅ Autoriser les APIs gate / waitlist (sinon le fetch est redirigé)
  if (pathname.startsWith("/api/access")) return NextResponse.next();
  if (pathname.startsWith("/api/waitlist")) return NextResponse.next();

  const hasAdmin = req.cookies.get("ct_gate_admin")?.value === "1";

  // ✅ Admin protégé
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (hasAdmin) return NextResponse.next();
    return redirectToAccess(req, "admin");
  }

  // ✅ Chefs : ON LAISSE PASSER (middleware ne bloque pas)
  if (pathname.startsWith("/chef") || pathname.startsWith("/api/chef")) {
    return NextResponse.next();
  }

  // ✅ PUBLIC GATE
  const hasPublic = req.cookies.get("ct_gate_public")?.value === "1";
  if (!hasPublic) return redirectToAccess(req, "public");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

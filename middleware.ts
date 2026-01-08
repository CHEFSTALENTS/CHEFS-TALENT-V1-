// middleware.ts (à la racine du projet, pas dans /app)
import { NextRequest, NextResponse } from 'next/server';

type Area = 'admin' | 'public';

function redirectToAccess(req: NextRequest, area: Area) {
  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;

  url.pathname = '/access';
  url.searchParams.set('area', area);
  url.searchParams.set('next', next);

  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer la page d'accès + assets + next internals
  if (
    pathname.startsWith('/access') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // Autoriser l’API access
  if (pathname.startsWith('/api/access')) return NextResponse.next();

  const hasAdmin = req.cookies.get('ct_gate_admin')?.value === '1';
  const hasPublic = req.cookies.get('ct_gate_public')?.value === '1';

  // ✅ Admin protégé
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (hasAdmin) return NextResponse.next();
    return redirectToAccess(req, 'admin');
  }

  // ✅ (Option) Chefs : laisse passer
  if (pathname.startsWith('/chef') || pathname.startsWith('/api/chef')) {
    return NextResponse.next();
  }

  // ✅ PUBLIC GATE : bloque TOUT le reste (dont "/")
  if (!hasPublic) {
    return redirectToAccess(req, 'public');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

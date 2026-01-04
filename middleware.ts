import { NextRequest, NextResponse } from 'next/server';

function redirectToAccess(req: NextRequest, area: 'admin' | 'chef' | 'public') {
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
  const hasChef = req.cookies.get('ct_gate_chef')?.value === '1';
  const hasPublic = req.cookies.get('ct_gate_public')?.value === '1';

  // ✅ Admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (hasAdmin) return NextResponse.next();
    return redirectToAccess(req, 'admin');
  }

  // ✅ Chefs
  if (pathname.startsWith('/chef') || pathname.startsWith('/api/chef')) {
    if (hasChef) return NextResponse.next();
    return redirectToAccess(req, 'chef');
  }

  // ✅ Public (tout le reste)
  // Si tu veux cacher la page publique pendant le lancement → on la bloque aussi.
  // Et surtout : un chef ne pourra pas y accéder s’il n’a pas ct_gate_public.
  if (!hasPublic) {
    return redirectToAccess(req, 'public');
  }

  return NextResponse.next();
}

// Matcher: on applique au site + api (sauf _next)
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

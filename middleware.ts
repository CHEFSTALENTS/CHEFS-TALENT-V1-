// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Toujours laisser passer
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/chef') ||          // 🔥 IMPORTANT
    pathname.startsWith('/api/chef')          // 🔥 IMPORTANT
  ) {
    return NextResponse.next();
  }

  // 🔐 Admin uniquement
  if (pathname.startsWith('/admin')) {
    const hasAdmin = req.cookies.get('ct_gate_admin')?.value === '1';
    if (!hasAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/access';
      url.searchParams.set('area', 'admin');
      return NextResponse.redirect(url);
    }
  }

  // 🌍 Public (si tu veux le garder fermé)
  const hasPublic = req.cookies.get('ct_gate_public')?.value === '1';
  if (!hasPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/access';
    url.searchParams.set('area', 'public');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

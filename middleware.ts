import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Autoriser Next internals + assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Autoriser la page d'accès + l'API
  if (pathname === '/access' || pathname.startsWith('/api/access')) {
    return NextResponse.next();
  }

  // Si cookie OK => accès
  const hasAccess = req.cookies.get('ct_access')?.value === '1';
  if (hasAccess) return NextResponse.next();

  // Sinon => redirect vers /access
  const url = req.nextUrl.clone();
  url.pathname = '/access';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!robots.txt|sitemap.xml).*)'],
};

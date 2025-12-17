import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const expected = (process.env.SITE_ACCESS_CODE || '').trim();

  // si pas de code défini, on ne bloque pas (évite de te lock out)
  if (!expected) return NextResponse.next();

  const path = req.nextUrl.pathname;

  // autoriser la page d'accès, l'API et les assets
  if (
    path.startsWith('/access') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const hasAccess = req.cookies.get('ct_access')?.value === '1';
  if (hasAccess) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/access';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

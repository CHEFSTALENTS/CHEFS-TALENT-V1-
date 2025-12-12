import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // On protège uniquement /admin (et ses sous-pages)
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // On laisse passer la page de login et l'API de login
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('admin_auth')?.value;

  // Si pas authentifié -> redirect vers /admin/login
  if (cookie !== '1') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

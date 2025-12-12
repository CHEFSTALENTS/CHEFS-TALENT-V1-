import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // On protège toutes les routes /admin/*
  if (pathname.startsWith('/admin')) {
    const isLoggedIn = request.cookies.get('ct_admin')?.value

    // Si pas connecté, on renvoie vers /admin (page login)
    if (!isLoggedIn && pathname !== '/admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

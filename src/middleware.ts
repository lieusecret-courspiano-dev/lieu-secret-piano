import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'ls_admin_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protéger toutes les routes /admin sauf /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
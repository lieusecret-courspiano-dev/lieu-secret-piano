import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('ls_admin_session')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const eleveProtected = ['/espace-eleve/dashboard', '/espace-eleve/reservations', '/espace-eleve/pack', '/espace-eleve/progression', '/espace-eleve/ressources', '/espace-eleve/notes', '/espace-eleve/certificats', '/espace-eleve/notifications', '/espace-eleve/temoignage', '/espace-eleve/reserver', '/espace-eleve/acheter-pack']
  if (eleveProtected.some(p => pathname.startsWith(p))) {
    const token = request.cookies.get('ls_eleve_session')?.value
    if (!token) return NextResponse.redirect(new URL('/espace-eleve/login', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/espace-eleve/:path*'] }

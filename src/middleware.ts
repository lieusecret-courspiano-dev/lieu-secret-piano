import { NextRequest, NextResponse } from 'next/server'

// Pages publiques de l'espace élève (pas besoin d'être connecté)
const ELEVE_PUBLIC = [
  '/espace-eleve/login',
  '/espace-eleve/setup',
  '/espace-eleve/reset',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Protection admin ──────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('ls_admin_session')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // ── Protection espace élève — TOUTES les routes sauf les pages publiques ──
  if (pathname.startsWith('/espace-eleve')) {
    const isPublic = ELEVE_PUBLIC.some(p => pathname.startsWith(p))
    if (!isPublic) {
      const token = request.cookies.get('ls_eleve_session')?.value
      if (!token) {
        const loginUrl = new URL('/espace-eleve/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/espace-eleve/:path*'] }

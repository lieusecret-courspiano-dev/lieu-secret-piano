import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Protection admin ──────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('ls_admin_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // ── Protection espace élève : bloquer l'accès aux créneaux ──
  // L'API /api/availability/slots ne doit être accessible que si
  // le code d'accès est fourni en header ou query param côté serveur.
  // Le vrai verrou est côté client (page réservation), mais on ajoute
  // une couche de protection sur la route API.
  if (pathname === '/api/availability/slots') {
    // On laisse passer — la vérification du code se fait dans la route API
    // (voir api/availability/slots/route.ts)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/availability/slots',
  ],
}
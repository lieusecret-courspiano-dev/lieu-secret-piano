import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, getSessionCookieName, getSessionCookieOptions } from '@/lib/auth'
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/rate-limit'

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@lieusecret-courspiano.fr'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'

export async function POST(req: NextRequest) {
  // Rate limiting strict: 3 tentatives par IP par 30 minutes
  const ip = getClientIP(req)
  const rl = checkRateLimit(`admin_login:${ip}`, 3, 30 * 60 * 1000)
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.resetIn / 60000)
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  const { email, password } = await req.json()

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }
  resetRateLimit(`admin_login:${ip}`)

  const token = await createAdminSession()

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions())
  return response
}
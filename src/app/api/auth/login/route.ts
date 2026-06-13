import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, getSessionCookieName, getSessionCookieOptions } from '@/lib/auth'

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@lieusecret-courspiano.fr'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  const token = await createAdminSession()

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions())
  return response
}
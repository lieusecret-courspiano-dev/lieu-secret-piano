import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'

const COOKIE_NAME = 'ls_admin_session'
const SESSION_DURATION_HOURS = 24

export async function createAdminSession(): Promise<string> {
  const array = new Uint8Array(32)
  // Génération côté serveur Node.js
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

  await supabaseAdmin.from('admin_sessions').insert({
    token,
    expires_at: expiresAt.toISOString(),
  })

  return token
}

export async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return false

    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, expires_at')
      .eq('token', token)
      .single()

    if (error || !data) return false

    if (new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from('admin_sessions').delete().eq('token', token)
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function deleteAdminSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (token) {
      await supabaseAdmin.from('admin_sessions').delete().eq('token', token)
    }
  } catch {
    // ignore
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}

export function getSessionCookieOptions(maxAge: number = SESSION_DURATION_HOURS * 3600) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path:     '/',
  }
}
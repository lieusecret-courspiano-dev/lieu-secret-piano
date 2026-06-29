import { NextResponse } from 'next/server'
import { deleteAdminSession, getSessionCookieName } from '@/lib/auth'

export async function POST() {
  await deleteAdminSession()

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  })
  return response
}
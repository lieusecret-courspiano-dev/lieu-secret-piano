import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY manquante dans les variables Vercel' }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const from   = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'

  try {
    const result = await resend.emails.send({
      from,
      to:      email,
      subject: 'Test email Lieu Secret',
      html:    '<p>Ceci est un email de test. Si vous recevez ceci, les emails fonctionnent correctement.</p>',
    })
    return NextResponse.json({ success: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
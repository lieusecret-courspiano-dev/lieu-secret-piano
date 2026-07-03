import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Vérifie si un achat a été créé pour une session Stripe donnée
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id requis' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('id, token_acces, statut')
    .eq('stripe_session_id', sessionId)
    .eq('statut', 'confirme')
    .single()

  if (!data) return NextResponse.json({ pending: true })
  return NextResponse.json({ token: data.token_acces, statut: data.statut })
}
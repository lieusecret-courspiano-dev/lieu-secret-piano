import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 })
  try {
    const { data: card, error } = await supabaseAdmin.from('gift_cards').select('id, code, montant, montant_restant, status, expires_at, destinataire_nom').eq('code', code.trim().toUpperCase()).single()
    if (error || !card) return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 404 })
    if (card.status !== 'active') return NextResponse.json({ valid: false, error: 'Ce bon cadeau a déjà été utilisé ou est désactivé' }, { status: 400 })
    if (new Date(card.expires_at) < new Date()) return NextResponse.json({ valid: false, error: 'Ce bon cadeau a expiré' }, { status: 400 })
    if (card.montant_restant <= 0) return NextResponse.json({ valid: false, error: 'Ce bon cadeau a été entièrement utilisé' }, { status: 400 })
    return NextResponse.json({ valid: true, montant: card.montant, montant_restant: card.montant_restant, destinataire: card.destinataire_nom, code: card.code })
  } catch { return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 }) }
}

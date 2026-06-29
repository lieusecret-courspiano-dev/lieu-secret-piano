import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('id, acheteur_nom, acheteur_email, statut, ressources_premium(titre, description, type, youtube_url, zoom_url, fichier_url, duree_minutes, date_coaching)')
    .eq('token_acces', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Accès invalide' }, { status: 404 })
  if (data.statut !== 'confirme') return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 403 })

  return NextResponse.json(data)
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { achat_id } = await req.json()
  if (!achat_id) return NextResponse.json({ error: 'achat_id requis' }, { status: 400 })

  // Récupérer l'achat
  const { data: achat } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('*, ressources_premium(titre, youtube_url, zoom_url, fichier_url, type)')
    .eq('id', achat_id).single()

  if (!achat) return NextResponse.json({ error: 'Achat introuvable' }, { status: 404 })
  if (achat.statut === 'confirme') return NextResponse.json({ error: 'Déjà confirmé' }, { status: 400 })

  // Confirmer l'achat
  await supabaseAdmin
    .from('ressources_premium_achats')
    .update({ statut: 'confirme', confirmed_at: new Date().toISOString() })
    .eq('id', achat_id)

  

  return NextResponse.json({ success: true, token: achat.token_acces })
}
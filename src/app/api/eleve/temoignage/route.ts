import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { note, commentaire } = await req.json()
  if (!note || !commentaire) return NextResponse.json({ error: 'Note et commentaire requis' }, { status: 400 })

  // Insérer dans medias avec les champs disponibles
  const { error } = await supabaseAdmin.from('medias').insert({
    type:        'temoignage',
    auteur:      `${eleve.prenom} ${eleve.nom}`,
    description: commentaire,
    url:         '#',
    titre:       `Témoignage — Note: ${note}/5`,
    is_active:   false, // En attente de validation
  })

  if (error) {
    console.error('Temoignage error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

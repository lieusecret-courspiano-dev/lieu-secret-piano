import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Récupérer les ressources premium achetées par cet élève
  // Deux cas : achat lié via eleve_id OU via email
  const { data, error } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select(`
      id,
      token_acces,
      statut,
      created_at,
      ressources_premium (
        id, titre, description, type,
        fichier_url, youtube_url, zoom_url,
        duree_minutes, nb_pages, image_url
      )
    `)
    .or(`eleve_id.eq.${eleve.id},acheteur_email.eq.${eleve.email}`)
    .eq('statut', 'confirme')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur ressources premium élève:', error)
    return NextResponse.json([])
  }

  // Dédupliquer par ressource_id (au cas où même ressource achetée deux fois)
  const seen = new Set<string>()
  const unique = (data || []).filter(a => {
    const rid = (a.ressources_premium as unknown as { id: string } | null)?.id
    if (!rid || seen.has(rid)) return false
    seen.add(rid)
    return true
  })

  return NextResponse.json(unique)
}
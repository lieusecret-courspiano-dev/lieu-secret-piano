import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Les témoignages sont stockés dans la table medias avec type='temoignage'
    const { data, error } = await supabase
      .from('medias')
      .select('id, auteur, description, titre, created_at, is_active')
      .eq('type', 'temoignage')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Temoignages error:', error)
      return NextResponse.json([])
    }

    // Transformer les données pour correspondre au format attendu par la page d'accueil
    const temoignages = (data || []).map(item => {
      // Extraire la note depuis le titre (format: "Témoignage — Note: 5/5" ou "⭐⭐⭐⭐⭐ — Cours de piano")
      let note = 5
      if (item.titre) {
        const noteMatch = item.titre.match(/Note:\s*(\d)/i)
        if (noteMatch) {
          note = parseInt(noteMatch[1])
        } else {
          // Compter les étoiles dans le titre
          const stars = (item.titre.match(/⭐/g) || []).length
          if (stars > 0) note = stars
        }
      }

      return {
        id: item.id,
        nom: item.auteur || 'Élève',
        note: Math.min(5, Math.max(1, note)),
        commentaire: item.description || '',
        created_at: item.created_at,
        est_publie: item.is_active,
      }
    }).filter(t => t.commentaire.length > 0)

    return NextResponse.json(temoignages)
  } catch (err) {
    console.error('Temoignages GET error:', err)
    return NextResponse.json([])
  }
}
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    const temoignages = (data || []).map(item => {
      // Extraire la note depuis le titre
      let note = 5
      if (item.titre) {
        const noteMatch = item.titre.match(/Note:\s*(\d)/i)
        if (noteMatch) {
          note = parseInt(noteMatch[1])
        } else {
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
    })

    return NextResponse.json(temoignages)
  } catch (err) {
    console.error('Temoignages GET error:', err)
    return NextResponse.json([])
  }
}
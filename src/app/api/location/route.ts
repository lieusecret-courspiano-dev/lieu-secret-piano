export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — liste les articles publiés et disponibles (côté public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('location_articles')
    .select('id, nom, slug, description_courte, photos, prix_jour, prix_weekend, prix_semaine, prix_mois, caution, categorie, accessoires_inclus, disponible, stock, publie')
    .eq('publie', true)
    .eq('disponible', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [], {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
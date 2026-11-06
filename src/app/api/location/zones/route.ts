export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — liste les zones de livraison actives (côté public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('location_zones_livraison')
    .select('id, nom, distance_min, distance_max, tarif, sur_devis')
    .eq('actif', true)
    .order('position', { ascending: true })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}
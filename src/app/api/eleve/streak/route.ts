import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('eleves').select('streak_semaines, streak_derniere_semaine, total_heures_pratique').eq('id', eleve.id).single()
  return NextResponse.json(data || { streak_semaines: 0, total_heures_pratique: 0 })
}

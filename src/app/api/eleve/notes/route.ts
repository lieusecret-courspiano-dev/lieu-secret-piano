import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('notes_cours').select('id, date_cours, resume, notions, exercices, objectifs, commentaires, created_at').eq('eleve_id', eleve.id).order('date_cours', { ascending: false })
  return NextResponse.json(data || [])
}

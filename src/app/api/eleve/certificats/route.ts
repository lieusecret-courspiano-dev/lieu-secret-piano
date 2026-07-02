import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('certificats').select('id, numero, nom_certificat, niveau, date_obtention, commentaire, verset, created_at').eq('eleve_id', eleve.id).order('date_obtention', { ascending: false })
  return NextResponse.json(data || [])
}

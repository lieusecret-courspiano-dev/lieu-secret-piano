import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('ressources').select('id, titre, description, type, url, categorie, created_at').or(`eleve_id.eq.${eleve.id},is_public.eq.true`).order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

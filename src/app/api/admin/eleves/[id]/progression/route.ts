import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const [compRes, progRes] = await Promise.all([
    supabaseAdmin.from('competences').select('*').eq('is_active', true).order('categorie').order('ordre'),
    supabaseAdmin.from('eleve_progression').select('*').eq('eleve_id', params.id),
  ])
  return NextResponse.json({ competences: compRes.data || [], progression: progRes.data || [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { competence, categorie, validee } = await req.json()
  const { data: existing } = await supabaseAdmin.from('eleve_progression').select('id').eq('eleve_id', params.id).eq('competence', competence).single()
  if (existing) {
    await supabaseAdmin.from('eleve_progression').update({ validee, validee_at: validee ? new Date().toISOString() : null }).eq('id', existing.id)
  } else {
    await supabaseAdmin.from('eleve_progression').insert({ eleve_id: params.id, competence, categorie, validee, validee_at: validee ? new Date().toISOString() : null })
  }
  return NextResponse.json({ success: true })
}

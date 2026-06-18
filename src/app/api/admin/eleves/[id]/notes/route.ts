import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data } = await supabaseAdmin.from('notes_cours').select('*').eq('eleve_id', params.id).order('date_cours', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('notes_cours').insert({ ...body, eleve_id: params.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseAdmin.from('eleve_notifications').insert({ eleve_id: params.id, type: 'note_cours', titre: 'Nouvelles notes de cours disponibles', message: `Notes du ${new Date(body.date_cours).toLocaleDateString('fr-FR')} ajoutées par votre professeur.`, lien: '/espace-eleve/notes' })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id: noteId, ...fields } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'ID note manquant' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('notes_cours')
    .update({ ...fields, updated_at: new Date().toISOString(), updated_by: 'admin' })
    .eq('id', noteId)
    .eq('eleve_id', params.id)
    .select().single()
  if (error) {
    // Fallback sans updated_at si colonne absente
    const { data: d2, error: e2 } = await supabaseAdmin
      .from('notes_cours').update(fields).eq('id', noteId).eq('eleve_id', params.id).select().single()
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    return NextResponse.json(d2)
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id: noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'ID note manquant' }, { status: 400 })
  await supabaseAdmin.from('notes_cours').delete().eq('id', noteId).eq('eleve_id', params.id)
  return NextResponse.json({ success: true })
}

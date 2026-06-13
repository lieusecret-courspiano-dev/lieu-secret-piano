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

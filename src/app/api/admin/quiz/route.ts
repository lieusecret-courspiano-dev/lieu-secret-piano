import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — liste des quiz avec leurs questions
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const { data: quiz } = await supabaseAdmin.from('quiz').select('*').eq('id', id).single()
    const { data: questions } = await supabaseAdmin.from('quiz_questions').select('*').eq('quiz_id', id).order('position')
    return NextResponse.json({ ...quiz, questions: questions || [] })
  }

  const { data: rawData } = await supabaseAdmin.from('quiz').select('*, quiz_questions(count)').order('created_at', { ascending: true })
  const niveauOrder: Record<string, number> = { fondamentaux: 0, comprehension: 1, expression: 2 }
  const data = (rawData || []).sort((a, b) => (niveauOrder[a.niveau] ?? 9) - (niveauOrder[b.niveau] ?? 9))
  return NextResponse.json(data || [])
}

// POST — créer un quiz
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  
}

// PATCH — modifier un quiz
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  
}

// DELETE — supprimer un quiz
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json()
  await supabaseAdmin.from('quiz').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
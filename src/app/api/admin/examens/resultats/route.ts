import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — résultats d'un examen
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const examen_id = req.nextUrl.searchParams.get('examen_id')
  if (!examen_id) return NextResponse.json({ error: 'examen_id requis' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('examen_sessions')
    .select('*, eleve:eleves(prenom, nom, email)')
    .eq('examen_id', examen_id)
    .order('submitted_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST — autoriser une nouvelle tentative
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { examen_id, eleve_id } = await req.json()

  // Réinitialiser le compteur de tentatives
  await supabaseAdmin.from('examen_eleves')
    .update({ tentatives: 0 })
    .eq('examen_id', examen_id)
    .eq('eleve_id', eleve_id)

  return NextResponse.json({ success: true })
}

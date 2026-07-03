import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — liste des examens
export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('examens')
    .select('*, examen_eleves(count), examen_sessions(count)')
    .order('date_examen', { ascending: false })
  return NextResponse.json(data || [])
}

// POST — créer un examen
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { titre, description, categorie, quiz_id, score_min, duree_minutes, date_examen, nb_tentatives, eleve_ids } = body
  if (!titre || !categorie || !date_examen) return NextResponse.json({ error: 'Titre, catégorie et date requis' }, { status: 400 })

  const { data: examen, error } = await supabaseAdmin.from('examens').insert({
    titre, description: description || null, categorie,
    quiz_id: quiz_id || null, score_min: score_min ?? 75,
    duree_minutes: duree_minutes ?? 60, date_examen,
    nb_tentatives: nb_tentatives ?? 1, est_actif: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ajouter les élèves autorisés
  if (Array.isArray(eleve_ids) && eleve_ids.length > 0) {
    await supabaseAdmin.from('examen_eleves').insert(
      eleve_ids.map((eleve_id: string) => ({ examen_id: examen.id, eleve_id }))
    )
  }

  return NextResponse.json(examen)
}

// PATCH — modifier un examen
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id, eleve_ids, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('examens').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour les élèves si fournis
  if (Array.isArray(eleve_ids)) {
    await supabaseAdmin.from('examen_eleves').delete().eq('examen_id', id)
    if (eleve_ids.length > 0) {
      await supabaseAdmin.from('examen_eleves').insert(
        eleve_ids.map((eleve_id: string) => ({ examen_id: id, eleve_id }))
      )
    }
  }

  return NextResponse.json(data)
}

// DELETE — supprimer un examen
export async function DELETE(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('examens').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

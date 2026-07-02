import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH — mettre à jour le profil élève (avatar, etc.)
export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { avatar } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('eleves').update({ avatar }).eq('id', eleve.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const [resaRes, packRes, certRes, notifRes] = await Promise.all([
    supabaseAdmin.from('reservations').select('id, slot_start, status').or(`eleve_id.eq.${eleve.id},student_email.eq.${eleve.email}`).order('slot_start', { ascending: false }),
    supabaseAdmin.from('course_packs').select('id, pack_label, heures_restantes, heures_total, status, code').or(`eleve_id.eq.${eleve.id},acheteur_email.eq.${eleve.email}`).eq('status', 'active').limit(1),
    supabaseAdmin.from('certificats').select('id').eq('eleve_id', eleve.id),
    supabaseAdmin.from('eleve_notifications').select('id').eq('eleve_id', eleve.id).eq('lu', false),
  ])
  const reservations = resaRes.data || []
  const prochainCours = reservations.find(r => r.status === 'confirmed' && new Date(r.slot_start) > new Date())
  const coursPassés = reservations.filter(r => new Date(r.slot_start) < new Date()).length
  return NextResponse.json({ ...eleve, prochain_cours: prochainCours || null, pack_actif: packRes.data?.[0] || null, nb_certificats: certRes.data?.length || 0, nb_cours_total: reservations.length, nb_notifs_non_lues: notifRes.data?.length || 0, cours_passes: coursPassés })
}

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { generateToken, sendEleveWelcomeEmail } from '@/lib/eleve-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  // Récupérer l'élève d'abord pour avoir son email
  const eleveRes = await supabaseAdmin.from('eleves').select('*').eq('id', params.id).single()
  const eleveEmail = eleveRes.data?.email?.toLowerCase() || ''

  // Chercher les données par eleve_id ET par email (pour les données créées avant la liaison)
  const [resaRes, packRes, certRes, notesRes] = await Promise.all([
    supabaseAdmin.from('reservations').select('id, slot_start, slot_end, status, payment_method')
      .or(`eleve_id.eq.${params.id},student_email.eq.${eleveEmail}`)
      .order('slot_start', { ascending: false }),
    supabaseAdmin.from('course_packs').select('id, code, pack_label, heures_restantes, heures_total, status')
      .or(`eleve_id.eq.${params.id},acheteur_email.eq.${eleveEmail}`)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('certificats').select('id, numero, nom_certificat, niveau, date_obtention').eq('eleve_id', params.id),
    supabaseAdmin.from('notes_cours').select('id, date_cours, resume').eq('eleve_id', params.id).order('date_cours', { ascending: false }),
  ])
  // Enrichir chaque pack avec son historique
  const packs = packRes.data || []
  const packsWithHistory = await Promise.all(packs.map(async (pack: { id: string; code: string; pack_label: string; heures_restantes: number; heures_total: number; status: string }) => {
    const { data: history } = await supabaseAdmin
      .from('pack_history')
      .select('id, type, delta, note, commentaire, created_at')
      .eq('pack_id', pack.id)
      .order('created_at', { ascending: false })
    return { ...pack, history: history || [] }
  }))
  return NextResponse.json({ eleve: eleveRes.data, reservations: resaRes.data || [], packs: packsWithHistory, certificats: certRes.data || [], notes: notesRes.data || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { resend_welcome, ...updateFields } = body
  if (resend_welcome) {
    const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom').eq('id', params.id).single()
    if (eleve) {
      const setupToken = generateToken()
      const setupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await supabaseAdmin.from('eleves').update({ setup_token: setupToken, setup_expires: setupExpires.toISOString() }).eq('id', params.id)
      await sendEleveWelcomeEmail(eleve.email, eleve.prenom, setupToken)
    }
    return NextResponse.json({ success: true })
  }
  const { data, error } = await supabaseAdmin.from('eleves').update(updateFields).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  await Promise.all([
    supabaseAdmin.from('eleve_sessions').delete().eq('eleve_id', params.id),
    supabaseAdmin.from('eleve_progression').delete().eq('eleve_id', params.id),
    supabaseAdmin.from('eleve_notifications').delete().eq('eleve_id', params.id),
    supabaseAdmin.from('notes_cours').delete().eq('eleve_id', params.id),
    supabaseAdmin.from('certificats').delete().eq('eleve_id', params.id),
  ])
  await supabaseAdmin.from('eleves').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}

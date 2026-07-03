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
  const { titre, description, categorie, quiz_id, score_min, duree_minutes, date_examen, nb_tentatives, eleve_ids, questions_examen } = body
  if (!titre || !categorie || !date_examen) return NextResponse.json({ error: 'Titre, catégorie et date requis' }, { status: 400 })

  const { data: examen, error } = await supabaseAdmin.from('examens').insert({
    titre, description: description || null, categorie,
    quiz_id: quiz_id || null, score_min: score_min ?? 75,
    duree_minutes: duree_minutes ?? 60, date_examen,
    nb_tentatives: nb_tentatives ?? 1, est_actif: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ajouter les questions propres à l'examen
  if (Array.isArray(questions_examen) && questions_examen.length > 0) {
    await supabaseAdmin.from('examen_questions').insert(
      questions_examen.map((q: any, i: number) => ({
        examen_id: examen.id, type: q.type || 'qcm', question: q.question,
        options: q.options?.filter((o: string) => o.trim()) || null,
        bonne_reponse: q.bonne_reponse || null, explication: q.explication || null,
        audio_url: q.audio_url || null, image_url: q.image_url || null, video_url: q.video_url || null,
        points: q.points || 1, position: i,
      }))
    )
  }

  // Ajouter les élèves autorisés et envoyer emails de convocation
  if (Array.isArray(eleve_ids) && eleve_ids.length > 0) {
    await supabaseAdmin.from('examen_eleves').insert(
      eleve_ids.map((eleve_id: string) => ({ examen_id: examen.id, eleve_id }))
    )
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      const { data: elevesData } = await supabaseAdmin.from('eleves').select('email, prenom').in('id', eleve_ids)
      const dateFormatted = new Date(date_examen).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      for (const eleve of (elevesData || [])) {
        await resend.emails.send({ from: FROM, to: eleve.email, subject: `Examen programmé — ${titre}`,
          html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;text-align:center;">Examen programmé</h2><p>Bonjour <strong>${eleve.prenom}</strong>,</p><p>Un examen final a été programmé pour vous :</p><div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:16px;margin:16px 0;"><p style="margin:0;font-size:18px;font-weight:bold;color:#f59e0b;">${titre}</p><p style="margin:8px 0 0;color:#a0a0c0;">Catégorie : ${categorie}</p><p style="margin:4px 0 0;color:#a0a0c0;">Date : ${dateFormatted}</p><p style="margin:4px 0 0;color:#a0a0c0;">Durée : ${duree_minutes} minutes · Score minimum : ${score_min ?? 75}%</p></div><div style="text-align:center;margin:24px 0;"><a href="${APP_URL}/espace-eleve/examens" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mes examens</a></div></div>`,
        }).catch(() => {})
      }
    } catch {}
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

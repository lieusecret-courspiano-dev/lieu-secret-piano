import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

const SYLLABUS_ORDER = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']

const CERT_CONFIG: Record<string, { titre: string; niveau: string; type: string }> = {
  'Fondamentaux': {
    titre: 'Fondamentaux du piano',
    niveau: 'Niveau 1 — Fondamentaux',
    type: 'fondamentaux',
  },
  'Compréhension et autonomie': {
    titre: 'Compréhension et autonomie',
    niveau: 'Niveau 2 — Compréhension et autonomie',
    type: 'comprehension',
  },
  'Expression et maîtrise': {
    titre: 'Expression et maîtrise',
    niveau: 'Niveau 3 — Expression et maîtrise',
    type: 'expression',
  },
}

async function generateCertifAutoIfNeeded(eleveId: string, categorie: string) {
  const certConf = CERT_CONFIG[categorie]
  if (!certConf) return

  // Vérifier si toutes les compétences de cette catégorie sont validées
  const { data: comps } = await supabaseAdmin
    .from('competences').select('nom').eq('categorie', categorie)
  if (!comps || comps.length === 0) return

  const { data: progs } = await supabaseAdmin
    .from('eleve_progression').select('competence, validee')
    .eq('eleve_id', eleveId).eq('categorie', categorie)

  const validees = (progs || []).filter(p => p.validee).map(p => p.competence)
  const allValidated = comps.every(c => validees.includes(c.nom))
  if (!allValidated) return

  // Vérifier si le certificat existe déjà
  const { data: existing } = await supabaseAdmin
    .from('certificats').select('id').eq('eleve_id', eleveId).eq('type_certificat', certConf.type).single()
  if (existing) return

  // Générer le numéro de certificat
  const { count } = await supabaseAdmin.from('certificats').select('*', { count: 'exact', head: true })
  const year = new Date().getFullYear()
  const num = String((count || 0) + 1).padStart(3, '0')
  const numero = `LS-${year}-${num}`

  // Créer le certificat
  const { data: cert, error: certError } = await supabaseAdmin.from('certificats').insert({
    eleve_id: eleveId,
    nom_certificat: certConf.titre,
    niveau: certConf.niveau,
    date_obtention: new Date().toISOString().split('T')[0],
    numero,
    type_certificat: certConf.type,
    commentaire: `Certificat généré automatiquement — toutes les compétences "${categorie}" validées.`,
  }).select().single()
  if (certError) { console.error('Cert insert error:', certError.message); return }

  if (!cert) return

  // Notification élève
  try {
    await supabaseAdmin.from('eleve_notifications').insert({
      eleve_id: eleveId,
      type: 'certificat',
      titre: `Certificat obtenu : ${certConf.titre}`,
      message: `Félicitations ! Vous avez validé toutes les compétences "${categorie}". Votre certificat est disponible.`,
      lien: '/espace-eleve/certificats',
    })
  } catch {}

  // Email de félicitations
  try {
    const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom, nom').eq('id', eleveId).single()
    if (eleve) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: eleve.email,
        subject: `Félicitations ! Certificat "${certConf.titre}" obtenu`,
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Félicitations ${eleve.prenom} !</h2>
          <p>Vous avez validé toutes les compétences du niveau <strong style="color:#f59e0b;">${categorie}</strong>.</p>
          <div style="background:#252540;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <p style="color:#f59e0b;font-size:18px;font-weight:bold;margin:0 0 8px;">Certificat obtenu</p>
            <p style="color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 8px;">${certConf.titre}</p>
            <p style="color:#a0a0c0;font-size:12px;margin:0;">N° ${numero}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${baseUrl}/espace-eleve/certificats" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mon certificat</a>
          </div>
          <p style="color:#7070a0;font-size:12px;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
        </div>`,
      }).catch(console.error)
    }
  } catch {}

  // Vérifier si toutes les 3 catégories sont complètes → diplôme final
  await checkDiplomeFinal(eleveId)
}

async function checkDiplomeFinal(eleveId: string) {
  // Vérifier si les 3 certificats de catégorie existent
  const types = ['fondamentaux', 'comprehension', 'expression']
  const { data: certs } = await supabaseAdmin
    .from('certificats').select('type_certificat').eq('eleve_id', eleveId).in('type_certificat', types)

  if (!certs || certs.length < 3) return

  // Vérifier si le diplôme final existe déjà
  const { data: existing } = await supabaseAdmin
    .from('certificats').select('id').eq('eleve_id', eleveId).eq('type_certificat', 'diplome_final').single()
  if (existing) return

  // Générer le diplôme final
  const { count } = await supabaseAdmin.from('certificats').select('*', { count: 'exact', head: true })
  const year = new Date().getFullYear()
  const num = String((count || 0) + 1).padStart(3, '0')
  const numero = `LS-${year}-DIPLOME-${num}`

  await supabaseAdmin.from('certificats').insert({
    eleve_id: eleveId,
    nom_certificat: 'Diplôme de maîtrise de l\'accompagnement au piano',
    niveau: 'Formation complète — Lieu Secret',
    date_obtention: new Date().toISOString().split('T')[0],
    numero,
    type_certificat: 'diplome_final',
    commentaire: 'Diplôme final — Formation complète validée.',
  })

  // Notification
  try {
    await supabaseAdmin.from('eleve_notifications').insert({
      eleve_id: eleveId,
      type: 'certificat',
      titre: 'Diplôme final obtenu !',
      message: 'Félicitations ! Vous avez complété l\'intégralité de la formation Lieu Secret. Votre diplôme est disponible.',
      lien: '/espace-eleve/certificats',
    })
  } catch {}

  // Email diplôme final
  try {
    const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom').eq('id', eleveId).single()
    if (eleve) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: eleve.email,
        subject: 'Félicitations ! Diplôme de maîtrise obtenu — Lieu Secret',
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Félicitations ${eleve.prenom} !</h2>
          <p>Vous avez complété l'intégralité de la formation Lieu Secret.</p>
          <div style="background:linear-gradient(135deg,#252540,#1a1a2e);border:2px solid #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
            <p style="color:#f59e0b;font-size:14px;letter-spacing:2px;margin:0 0 12px;">LIEU SECRET</p>
            <p style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 8px;">Diplôme de maîtrise</p>
            <p style="color:#d0d0e8;font-size:16px;margin:0 0 12px;">de l'accompagnement au piano</p>
            <p style="color:#a0a0c0;font-size:12px;margin:0;">N° ${numero}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${baseUrl}/espace-eleve/certificats" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mon diplôme</a>
          </div>
        </div>`,
      }).catch(console.error)
    }
  } catch {}
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [compRes, progRes] = await Promise.all([
    supabaseAdmin.from('competences').select('*').order('niveau').order('ordre'),
    supabaseAdmin.from('eleve_progression').select('*').eq('eleve_id', params.id),
  ])

  const competences = compRes.data || []
  const progression = progRes.data || []

  // Organiser par catégorie dans l'ordre du syllabus
  const categoriesMap: Record<string, { competence: string; categorie: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const comp of competences) {
    if (!categoriesMap[comp.categorie]) categoriesMap[comp.categorie] = []
    const prog = progression.find(p => p.competence === comp.nom)
    categoriesMap[comp.categorie].push({
      competence: comp.nom,
      categorie: comp.categorie,
      validee: prog?.validee || false,
      validee_at: prog?.validee_at || null,
    })
  }

  const allCats = Array.from(new Set(competences.map((c: { categorie: string }) => c.categorie)))
  const sortedCats = [...SYLLABUS_ORDER.filter(c => allCats.includes(c)), ...allCats.filter(c => !SYLLABUS_ORDER.includes(c))]
  const categories: Record<string, { competence: string; categorie: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const cat of sortedCats) { if (categoriesMap[cat]) categories[cat] = categoriesMap[cat] }

  const total = competences.length
  const validees = progression.filter(p => p.validee).length

  return NextResponse.json({ categories, total, validees, pourcentage: total > 0 ? Math.round((validees / total) * 100) : 0 })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { competence, categorie, validee } = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('eleve_progression').select('id').eq('eleve_id', params.id).eq('competence', competence).single()

  if (existing) {
    await supabaseAdmin.from('eleve_progression')
      .update({ validee, validee_at: validee ? new Date().toISOString() : null })
      .eq('id', existing.id)
  } else {
    await supabaseAdmin.from('eleve_progression')
      .insert({ eleve_id: params.id, competence, categorie, validee, validee_at: validee ? new Date().toISOString() : null })
  }

  // Vérifier si un certificat automatique doit être généré
  if (validee && categorie) {
    await generateCertifAutoIfNeeded(params.id, categorie)
  }

  return NextResponse.json({ success: true })
}
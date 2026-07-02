import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { generateInscriptionPDF } from '@/lib/pdf'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

function baseTemplate(content: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Lieu Secret</title></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#252540;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e,#252540);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">
<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>
<div style="font-size:12px;color:#a0a0c0;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="background:#1a1a2e;padding:20px;text-align:center;border-top:1px solid #3a3a5c;">
<p style="margin:0;font-size:12px;color:#505080;">Lieu Secret &mdash; École de Piano en Ligne<br/>
<a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;text-decoration:none;">${ADMIN_EMAIL}</a></p>
</td></tr></table></td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  let prenom = '', nom = '', email = '', telephone = '', adresse = '', ville = '',
      code_postal = '', pays = 'France', niveau = '', annees_pratique = '',
      rythme = '', frequence = '', objectifs = '', message = ''

  if (body.answers) {
    const a = body.answers
    prenom          = a['Prénom']              || a['Prenom']              || ''
    nom             = a['Nom']                                              || ''
    email           = a['Email']                                            || ''
    telephone       = a['Téléphone']           || a['Telephone']           || ''
    adresse         = a['Adresse']                                          || ''
    ville           = a['Ville']                                            || ''
    code_postal     = a['Code postal']                                      || ''
    pays            = a['Pays']                                             || 'France'
    niveau          = a['Niveau actuel']       || a['Niveau']              || ''
    annees_pratique = a['Années de pratique']  || a['Annees de pratique']  || ''
    rythme          = a['Disponibilités']      || a['Disponibilites']      || ''
    frequence       = a['Fréquence souhaitée'] || a['Frequence souhaitee'] || ''
    objectifs       = a['Objectifs']                                        || ''
    message         = a['Message']                                          || ''
  } else {
    prenom          = body.prenom          || ''
    nom             = body.nom             || ''
    email           = body.email           || ''
    telephone       = body.telephone       || ''
    adresse         = body.adresse         || ''
    ville           = body.ville           || ''
    code_postal     = body.code_postal     || ''
    pays            = body.pays            || 'France'
    niveau          = body.niveau          || ''
    annees_pratique = body.annees_pratique || ''
    rythme          = Array.isArray(body.rythme)    ? body.rythme.join(', ')    : (body.rythme    || '')
    frequence       = Array.isArray(body.frequence) ? body.frequence.join(', ') : (body.frequence || '')
    objectifs       = body.objectifs       || ''
    message         = body.message         || ''
  }

  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  if (!prenom && !nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const studentName = [prenom, nom].filter(Boolean).join(' ')

  // Sauvegarder dans Supabase
  try {
    await supabaseAdmin.from('inscriptions').insert({
      prenom, nom, email,
      telephone:       telephone       || null,
      adresse:         adresse         || null,
      ville:           ville           || null,
      pays:            pays            || 'France',
      niveau:          niveau          || 'Non renseigné',
      annees_pratique: annees_pratique || null,
      rythme:          rythme          || null,
      frequence:       frequence       || null,
      objectifs:       objectifs       || null,
      message:         message         || null,
      status:          'en_attente',
    })
  } catch (dbErr) {
    console.error('Erreur DB inscription:', dbErr)
  }

  // Tableau HTML pour les emails
  const fields = [
    ['Nom complet',          studentName],
    ['Email',                email],
    ['Téléphone',            telephone],
    ['Adresse',              [adresse, code_postal, ville, pays].filter(Boolean).join(', ')],
    ['Niveau actuel',        niveau],
    ['Années de pratique',   annees_pratique],
    ['Disponibilités',       rythme],
    ['Fréquence souhaitée',  frequence],
    ['Objectifs',            objectifs],
    ['Message',              message],
  ].filter(([, v]) => v && v.trim())

  const rows = fields.map(([k, v]) =>
    `<tr><td style="padding:8px 0;color:#a0a0c0;font-size:13px;width:180px;vertical-align:top;">${k}</td>` +
    `<td style="padding:8px 0;color:#f0f0f0;font-size:13px;">${v}</td></tr>`
  ).join('')

  // Générer le vrai PDF
  let pdfAttachment = null
  try {
    const pdfBuffer = await generateInscriptionPDF({
      studentName, email, telephone, adresse, ville, code_postal, pays,
      niveau, annees_pratique, rythme, frequence, objectifs, message,
    })
    pdfAttachment = {
      filename:     `inscription-lieu-secret-${studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      content:      pdfBuffer.toString('base64'),
      content_type: 'application/pdf',
    }
  } catch (pdfErr) {
    console.error('Erreur génération PDF:', pdfErr)
  }

  // Email élève
  const studentContent = `
    <h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Demande d'inscription reçue !</h2>
    <p style="color:#a0a0c0;font-size:14px;margin:0 0 24px;">Bonjour ${prenom || studentName},</p>
    <p style="color:#d0d0e8;font-size:14px;line-height:1.7;margin-bottom:20px;">
      Merci pour votre demande d'inscription à Lieu Secret. Nous avons bien reçu vos informations et vous contacterons rapidement.
    </p>
    <div style="background:#1a1a2e;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:4px;margin-bottom:16px;">
      <p style="margin:0 0 12px;color:#f59e0b;font-size:15px;font-weight:bold;">Récapitulatif de votre demande</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>
    ${pdfAttachment ? `<div style="background:#2a2a45;border:1px solid #f59e0b;border-radius:8px;padding:14px;margin-top:16px;"><p style="margin:0;color:#a0a0c0;font-size:12px;">📎 Le récapitulatif complet de votre inscription est joint en PDF.</p></div>` : ''}
    <p style="color:#7070a0;font-size:13px;margin-top:24px;">À très bientôt,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>
  `

  // Email admin
  const adminContent = `
    <h2 style="color:#f59e0b;font-size:20px;margin:0 0 16px;">Nouvelle demande d'inscription</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    ${pdfAttachment ? `<div style="background:#2a2a45;border:1px solid #f59e0b;border-radius:8px;padding:14px;margin-top:16px;"><p style="margin:0;color:#a0a0c0;font-size:12px;">📎 Le récapitulatif complet est joint en PDF.</p></div>` : ''}
  `

  try {
    const emailOptions = pdfAttachment ? { attachments: [pdfAttachment] } : {}
    await Promise.all([
      resend.emails.send({ from: FROM, to: email, subject: "Demande d'inscription reçue — Lieu Secret", html: baseTemplate(studentContent), ...emailOptions }),
      resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: 'Nouvelle inscription — ' + studentName, html: baseTemplate(adminContent), ...emailOptions }),
    ])
    // Créer/lier compte élève automatiquement
  try {
    const { findOrCreateEleve, sendEleveWelcomeEmail, generateToken } = await import('@/lib/eleve-auth')
    const nameParts = (prenom + ' ' + nom).trim().split(' ')
    const { id: eleveId, isNew } = await findOrCreateEleve(email, prenom || nameParts[0], nom || nameParts.slice(1).join(' ') || '')
    
    if (isNew) {
      // Nouveau compte : générer un token et envoyer email pour créer le mot de passe
      const setupToken = generateToken()
      const setupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await supabaseAdmin.from('eleves').update({ setup_token: setupToken, setup_expires: setupExpires.toISOString() }).eq('id', eleveId)
      await sendEleveWelcomeEmail(email, prenom || nameParts[0], setupToken)
      console.log(`[inscription] Email bienvenue envoyé à ${email}`)
    }
  } catch (eleveErr) { console.error('Eleve creation error:', eleveErr) }

  return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
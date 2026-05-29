import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

function baseTemplate(content: string): string {
  return [
    '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Lieu Secret</title></head>',
    '<body style="margin:0;padding:0;background:#080808;font-family:Georgia,serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">',
    '<tr><td align="center">',
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">',
    '<tr><td style="background:linear-gradient(135deg,#1a1a1a,#111111);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">',
    '<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>',
    '<div style="font-size:12px;color:#a8a8a8;margin-top:6px;letter-spacing:2px;">ECOLE DE PIANO EN LIGNE</div>',
    '</td></tr>',
    '<tr><td style="padding:32px;">' + content + '</td></tr>',
    '<tr><td style="background:#0a0a0a;padding:20px;text-align:center;border-top:1px solid #282828;">',
    '<p style="margin:0;font-size:12px;color:#404040;">Lieu Secret &mdash; Ecole de Piano en Ligne<br/>',
    '<a href="mailto:' + ADMIN_EMAIL + '" style="color:#f59e0b;text-decoration:none;">' + ADMIN_EMAIL + '</a></p>',
    '</td></tr></table></td></tr></table></body></html>',
  ].join('')
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Support both old format (answers object) and new format (direct form fields)
  let prenom = '', nom = '', email = '', telephone = '', adresse = '', ville = '',
      code_postal = '', pays = 'France', niveau = '', annees_pratique = '',
      rythme = '', frequence = '', objectifs = '', message = ''

  if (body.answers) {
    // Format dynamique (answers object)
    const a = body.answers
    prenom          = a['Prenom']              || ''
    nom             = a['Nom']                 || ''
    email           = a['Email']               || ''
    telephone       = a['Telephone']           || ''
    adresse         = a['Adresse']             || ''
    ville           = a['Ville']               || ''
    code_postal     = a['Code postal']         || ''
    pays            = a['Pays']                || 'France'
    niveau          = a['Niveau actuel']       || a['Niveau'] || ''
    annees_pratique = a['Annees de pratique']  || ''
    rythme          = a['Disponibilites']      || ''
    frequence       = a['Frequence souhaitee'] || ''
    objectifs       = a['Objectifs']           || ''
    message         = a['Message']             || ''
  } else {
    // Format direct
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
    rythme          = Array.isArray(body.rythme)    ? body.rythme.join(', ')    : (body.rythme || '')
    frequence       = Array.isArray(body.frequence) ? body.frequence.join(', ') : (body.frequence || '')
    objectifs       = body.objectifs       || ''
    message         = body.message         || ''
  }

  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  if (!prenom && !nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const studentName = [prenom, nom].filter(Boolean).join(' ')

  // Sauvegarder dans Supabase avec les bonnes colonnes
  try {
    await supabaseAdmin.from('inscriptions').insert({
      prenom,
      nom,
      email,
      telephone:       telephone || null,
      adresse:         adresse   || null,
      ville:           ville     || null,
      pays:            pays      || 'France',
      niveau:          niveau    || 'Non renseigne',
      annees_pratique: annees_pratique || null,
      rythme:          rythme    || null,
      frequence:       frequence || null,
      objectifs:       objectifs || null,
      message:         message   || null,
      status:          'en_attente',
    })
  } catch (dbErr) {
    console.error('Erreur DB inscription:', dbErr)
  }

  // Construire le tableau HTML
  const fields = [
    ['Nom complet',       studentName],
    ['Email',             email],
    ['Telephone',         telephone],
    ['Adresse',           [adresse, code_postal, ville, pays].filter(Boolean).join(', ')],
    ['Niveau',            niveau],
    ['Annees pratique',   annees_pratique],
    ['Disponibilites',    rythme],
    ['Frequence',         frequence],
    ['Objectifs',         objectifs],
    ['Message',           message],
  ].filter(([, v]) => v && v.trim())

  const rows = fields.map(([k, v]) =>
    '<tr><td style="padding:6px 0;color:#a8a8a8;font-size:13px;width:160px;vertical-align:top;">' + k + '</td>' +
    '<td style="padding:6px 0;color:#e8e8e8;font-size:13px;">' + v + '</td></tr>'
  ).join('')

  const studentContent = [
    '<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Demande d\'inscription recue</h2>',
    '<p style="color:#a8a8a8;font-size:14px;margin:0 0 24px;">Bonjour ' + (prenom || studentName) + ',</p>',
    '<p style="color:#d0d0d0;font-size:14px;line-height:1.7;margin-bottom:20px;">Merci pour votre demande d\'inscription a Lieu Secret. Nous avons bien recu vos informations et vous contacterons rapidement.</p>',
    '<div style="background:#1a1a1a;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:4px;margin-bottom:16px;">',
    '<p style="margin:0 0 12px;color:#f59e0b;font-size:15px;font-weight:bold;">Recapitulatif</p>',
    '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>',
    '</div>',
    '<p style="color:#707070;font-size:13px;margin-top:24px;">A tres bientot,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>',
  ].join('')

  const adminContent = [
    '<h2 style="color:#f59e0b;font-size:20px;margin:0 0 16px;">Nouvelle demande d\'inscription</h2>',
    '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>',
  ].join('')

  try {
    await Promise.all([
      resend.emails.send({ from: FROM, to: email, subject: "Demande d'inscription recue — Lieu Secret", html: baseTemplate(studentContent) }),
      resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: 'Nouvelle inscription — ' + studentName, html: baseTemplate(adminContent) }),
    ])
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
export const dynamic = 'force-dynamic'
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = 'REF-'
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return c
}

// GET: récupérer le code parrainage d'un élève
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eleve_id = searchParams.get('eleve_id')
  const email    = searchParams.get('email')
  if (!eleve_id && !email) return NextResponse.json({ error: 'eleve_id ou email requis' }, { status: 400 })
  let query = supabaseAdmin.from('parrainages').select('*')
  if (eleve_id) query = query.eq('parrain_id', eleve_id)
  else if (email) query = query.eq('parrain_email', email?.toLowerCase())
  const { data } = await query.single()
  return NextResponse.json(data || null)
}

// POST: créer ou récupérer le code parrainage
export async function POST(req: NextRequest) {
  const { eleve_id, email, prenom, nom } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  // Vérifier si déjà un code
  const { data: existing } = await supabaseAdmin.from('parrainages').select('*').eq('parrain_email', email.toLowerCase()).single()
  if (existing) return NextResponse.json(existing)
  // Créer un nouveau code
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: ex } = await supabaseAdmin.from('parrainages').select('id').eq('code', code).single()
    if (!ex) break
    code = genCode()
  }
  const { data, error } = await supabaseAdmin.from('parrainages').insert({
    code, parrain_id: eleve_id || null, parrain_email: email.toLowerCase(),
    parrain_nom: `${prenom || ''} ${nom || ''}`.trim() || email,
    filleuls_count: 0, heures_offertes: 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH: utiliser un code parrainage (lors d'une inscription)
export async function PATCH(req: NextRequest) {
  const { code, filleul_email, filleul_nom } = await req.json()
  if (!code || !filleul_email) return NextResponse.json({ error: 'Code et email requis' }, { status: 400 })
  const { data: parrainage } = await supabaseAdmin.from('parrainages').select('*').eq('code', code.toUpperCase()).single()
  if (!parrainage) return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
  if (parrainage.parrain_email === filleul_email.toLowerCase()) return NextResponse.json({ error: 'Vous ne pouvez pas utiliser votre propre code' }, { status: 400 })

  // ── PROTECTION 1: Limite de 10 filleuls max ──
  const maxFilleuls = 10
  if (parrainage.filleuls_count >= maxFilleuls) {
    return NextResponse.json({ error: `Ce code a atteint la limite de ${maxFilleuls} parrainages` }, { status: 429 })
  }

  // Vérifier si déjà utilisé par ce filleul
  const { data: alreadyUsed } = await supabaseAdmin.from('parrainage_filleuls').select('id').eq('parrainage_id', parrainage.id).eq('filleul_email', filleul_email.toLowerCase()).single()
  if (alreadyUsed) return NextResponse.json({ error: 'Ce code a déjà été utilisé par cet email' }, { status: 409 })

  // Enregistrer le filleul avec statut "pending" (en attente de validation)
  await supabaseAdmin.from('parrainage_filleuls').insert({
    parrainage_id: parrainage.id,
    filleul_email: filleul_email.toLowerCase(),
    filleul_nom: filleul_nom || filleul_email,
    status: 'pending',  // Sera validé après 24h + 1 réservation
    created_at: new Date().toISOString(),
  })

  // Mettre à jour le compteur (filleuls inscrits, pas encore validés)
  await supabaseAdmin.from('parrainages').update({ filleuls_count: parrainage.filleuls_count + 1 }).eq('id', parrainage.id)

  // Email au parrain pour l'informer (sans créditer l'heure tout de suite)
  try {
    await resend.emails.send({ from: FROM, to: parrainage.parrain_email,
      subject: `Nouveau filleul inscrit — En attente de validation`,
      html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
        <h2 style="color:#f59e0b;text-align:center;">Nouveau filleul inscrit !</h2>
        <p>Bonjour ${parrainage.parrain_nom},</p>
        <p><strong>${filleul_nom || filleul_email}</strong> vient de s'inscrire avec votre code de parrainage.</p>
        <div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px;">Validation en cours</p>
          <p style="margin:0;font-size:14px;">Votre heure bonus sera créditée automatiquement dès que votre filleul aura :</p>
          <ul style="margin:8px 0;font-size:14px;">
            <li>Réservé et effectué son premier cours</li>
            <li>Attendu 24h après ce premier cours</li>
            <li>Le cours ne doit pas avoir été annulé</li>
          </ul>
        </div>
        <p>Continuez à partager votre code <strong style="color:#f59e0b;">${code}</strong> !</p>
        <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
      </div>` })
  } catch (emailErr) { console.error('Email parrain pending error:', emailErr) }

  // Email au filleul
  try {
    await resend.emails.send({ from: FROM, to: filleul_email,
      subject: `Parrainage pris en compte — Lieu Secret`,
      html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
        <h2 style="color:#f59e0b;text-align:center;">Parrainage confirmé !</h2>
        <p>Bonjour ${filleul_nom || ''},</p>
        <p>Votre inscription via le code de parrainage de <strong>${parrainage.parrain_nom}</strong> a bien été prise en compte.</p>
        <p>Bienvenue dans la communauté Lieu Secret !</p>
        <div style="text-align:center;margin:20px 0;">
          <a href="${APP_URL}/reservation" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Réserver mon premier cours</a>
        </div>
        <p style="color:#7070a0;font-size:12px;text-align:center;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
      </div>` })
  } catch (emailErr) { console.error('Email filleul error:', emailErr) }

  return NextResponse.json({ success: true, parrain_nom: parrainage.parrain_nom, status: 'pending' })
}


import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

async function generateNumero(): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabaseAdmin.from('certificats').select('*', { count: 'exact', head: true })
  const num = String((count || 0) + 1).padStart(3, '0')
  return `LS-${year}-${num}`
}

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data } = await supabaseAdmin.from('certificats').select('*, eleves(prenom, nom, email)').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { eleve_id, nom_certificat, niveau, date_obtention, commentaire, verset } = await req.json()
  if (!eleve_id || !nom_certificat || !date_obtention) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  const numero = await generateNumero()
  const { data: cert, error } = await supabaseAdmin.from('certificats').insert({ eleve_id, numero, nom_certificat, niveau, date_obtention, commentaire, verset }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseAdmin.from('eleve_notifications').insert({ eleve_id, type: 'certificat', titre: 'Nouveau certificat disponible !', message: `Félicitations ! Votre certificat "${nom_certificat}" est disponible dans votre espace élève.`, lien: '/espace-eleve/certificats' })
  const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom').eq('id', eleve_id).single()
  if (eleve) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
    await resend.emails.send({ from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>', to: eleve.email, subject: `Félicitations ! Votre certificat "${nom_certificat}" — Lieu Secret`, html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;"><h2 style="color:#f59e0b;text-align:center;">Félicitations, ${eleve.prenom} !</h2><p>Votre certificat <strong style="color:#f59e0b;">${nom_certificat}</strong> est disponible dans votre espace élève.</p><div style="text-align:center;margin:24px 0;"><a href="${baseUrl}/espace-eleve/certificats" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mon certificat</a></div><p style="color:#7070a0;font-size:12px;text-align:center;">Numéro : ${numero}</p></div>` }).catch(console.error)
  }
  // Badge selon le niveau du certificat
  try {
    const { attribuerBadge, BADGES } = await import('@/lib/badges')
    const niveauLower = (niveau || '').toLowerCase()
    if (niveauLower.includes('fondamentaux') || niveauLower.includes('fondamental')) {
      await attribuerBadge(eleve_id, BADGES.CERT_FONDAMENTAUX)
    } else if (niveauLower.includes('comprehension') || niveauLower.includes('compréhension') || niveauLower.includes('autonomie')) {
      await attribuerBadge(eleve_id, BADGES.CERT_COMPREHENSION)
    } else if (niveauLower.includes('expression') || niveauLower.includes('maitrise') || niveauLower.includes('maîtrise')) {
      await attribuerBadge(eleve_id, BADGES.CERT_EXPRESSION)
    }
    const { count: nbCerts } = await supabaseAdmin
      .from('certificats').select('*', { count: 'exact', head: true }).eq('eleve_id', eleve_id)
    if ((nbCerts || 0) >= 3) await attribuerBadge(eleve_id, BADGES.DIPLOME_FINAL)
  } catch {}
  return NextResponse.json(cert)
}

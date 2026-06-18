import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — messages de la conversation
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('eleve_messages')
    .select('*')
    .eq('eleve_id', eleve.id)
    .order('created_at', { ascending: true })

  // Marquer les messages admin comme lus
  await supabaseAdmin
    .from('eleve_messages')
    .update({ lu: true })
    .eq('eleve_id', eleve.id)
    .eq('expediteur', 'admin')
    .eq('lu', false)

  return NextResponse.json(data || [])
}

// POST — envoyer un message (élève → professeur)
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { contenu } = await req.json()
  if (!contenu?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('eleve_messages')
    .insert({ eleve_id: eleve.id, expediteur: 'eleve', contenu: contenu.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier l'admin par email
  try {
    const { getSiteSettings } = await import('@/lib/settings')
    const settings = await getSiteSettings()
    const adminEmail = settings.contact_email || 'contact@lieusecret-courspiano.fr'
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'

    await resend.emails.send({
      from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
      to: adminEmail,
      subject: `Nouveau message de ${eleve.prenom} ${eleve.nom}`,
      html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
        <h2 style="color:#f59e0b;">Nouveau message élève</h2>
        <p>De : <strong>${eleve.prenom} ${eleve.nom}</strong> (${eleve.email})</p>
        <div style="background:#252540;border-left:3px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;white-space:pre-wrap;">${contenu}</p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${baseUrl}/admin/eleve-messages" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Répondre dans l'admin</a>
        </div>
      </div>`,
    }).catch(console.error)
  } catch {}

  return NextResponse.json(data)
}
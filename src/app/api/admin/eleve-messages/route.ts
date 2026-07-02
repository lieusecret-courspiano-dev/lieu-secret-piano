import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — toutes les conversations (groupées par élève)
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eleveId = searchParams.get('eleve_id')

  if (eleveId) {
    // Messages d'un élève spécifique
    const { data } = await supabaseAdmin
      .from('eleve_messages')
      .select('*')
      .eq('eleve_id', eleveId)
      .order('created_at', { ascending: true })

    // Marquer les messages élève comme lus
    await supabaseAdmin
      .from('eleve_messages')
      .update({ lu: true })
      .eq('eleve_id', eleveId)
      .eq('expediteur', 'eleve')
      .eq('lu', false)

    return NextResponse.json(data || [])
  }

  // Liste des conversations (dernier message par élève)
  const { data: messages } = await supabaseAdmin
    .from('eleve_messages')
    .select('*, eleves(id, prenom, nom, email)')
    .order('created_at', { ascending: false })

  if (!messages) return NextResponse.json([])

  // Grouper par élève
  const conversations: Record<string, {
    eleve_id: string; prenom: string; nom: string; email: string
    dernier_message: string; dernier_at: string; nb_non_lus: number
  }> = {}

  for (const msg of messages) {
    const eleve = msg.eleves as { id: string; prenom: string; nom: string; email: string } | null
    if (!eleve) continue
    if (!conversations[msg.eleve_id]) {
      conversations[msg.eleve_id] = {
        eleve_id: msg.eleve_id,
        prenom: eleve.prenom,
        nom: eleve.nom,
        email: eleve.email,
        dernier_message: msg.contenu,
        dernier_at: msg.created_at,
        nb_non_lus: 0,
      }
    }
    if (msg.expediteur === 'eleve' && !msg.lu) {
      conversations[msg.eleve_id].nb_non_lus++
    }
  }

  return NextResponse.json(Object.values(conversations))
}

// POST — répondre à un élève (admin → élève)
export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { eleve_id, contenu } = await req.json()
  if (!eleve_id || !contenu?.trim()) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('eleve_messages')
    .insert({ eleve_id, expediteur: 'admin', contenu: contenu.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notification à l'élève
  try {
    const { data: eleve } = await supabaseAdmin.from('eleves').select('email, prenom').eq('id', eleve_id).single()
    if (eleve) {
      await supabaseAdmin.from('eleve_notifications').insert({
        eleve_id,
        type: 'message',
        titre: 'Nouveau message de votre professeur',
        message: contenu.substring(0, 100) + (contenu.length > 100 ? '...' : ''),
        lien: '/espace-eleve/messages',
      })

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
      await resend.emails.send({
        from: 'Lieu Secret <noreply@lieusecret-courspiano.fr>',
        to: eleve.email,
        subject: 'Nouveau message de votre professeur — Lieu Secret',
        html: `<div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:500px;margin:0 auto;border-radius:12px;">
          <h2 style="color:#f59e0b;">Nouveau message</h2>
          <p>Bonjour ${eleve.prenom},</p>
          <p>Votre professeur vous a envoyé un message :</p>
          <div style="background:#252540;border-left:3px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;white-space:pre-wrap;">${contenu}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${baseUrl}/espace-eleve/messages" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir et répondre</a>
          </div>
          <p style="color:#7070a0;font-size:12px;">Vérifiez votre dossier Spam si vous ne recevez pas nos emails.</p>
        </div>`,
      }).catch(console.error)
    }
  } catch {}

  return NextResponse.json(data)
}
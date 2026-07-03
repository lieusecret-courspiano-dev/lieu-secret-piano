import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { support_id } = await req.json()
  if (!support_id) return NextResponse.json({ error: 'support_id manquant' }, { status: 400 })

  const { data: support } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('id, titre, prix, est_publie')
    .eq('id', support_id)
    .single()

  if (!support) return NextResponse.json({ error: 'Support non trouvé' }, { status: 404 })
  if (!support.est_publie) return NextResponse.json({ error: 'Support non disponible' }, { status: 400 })

  // Vérifier si déjà acheté
  const { data: existing } = await supabaseAdmin
    .from('supports_achats')
    .select('id, statut')
    .eq('support_id', support_id)
    .eq('eleve_id', eleve.id)
    .eq('statut', 'actif')
    .single()

  if (existing) return NextResponse.json({ error: 'Vous avez déjà accès à ce support.' }, { status: 409 })

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: eleve.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(support.prix * 100),
          product_data: {
            name: `${support.titre} — Lieu Secret`,
            description: 'Support de cours de piano en ligne',
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'support',
        support_id: support.id,
        eleve_id: eleve.id,
        eleve_email: eleve.email,
        eleve_nom: `${eleve.prenom} ${eleve.nom}`,
        montant: String(support.prix),
      },
      success_url: `${APP_URL}/espace-eleve/mes-supports?success=1`,
      cancel_url: `${APP_URL}/bibliotheque-pedagogique`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 })
  }
}
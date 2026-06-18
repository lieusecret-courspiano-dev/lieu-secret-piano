import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'
const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPaypalToken() {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { support_id } = await req.json()
  if (!support_id) return NextResponse.json({ error: 'support_id manquant' }, { status: 400 })

  const { data: support } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('id, titre, prix')
    .eq('id', support_id)
    .single()

  if (!support) return NextResponse.json({ error: 'Support non trouvé' }, { status: 404 })

  try {
    const token = await getPaypalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: support.prix.toFixed(2) },
          description: `${support.titre} — Lieu Secret`,
          custom_id: JSON.stringify({ type: 'support', support_id: support.id, eleve_id: eleve.id }),
        }],
        application_context: {
          return_url: `${APP_URL}/espace-eleve/mes-supports?success=1`,
          cancel_url: `${APP_URL}/bibliotheque-pedagogique`,
        },
      }),
    })
    const order = await res.json()
    const approveUrl = order.links?.find((l: any) => l.rel === 'approve')?.href
    if (!approveUrl) return NextResponse.json({ error: 'Erreur PayPal' }, { status: 500 })
    return NextResponse.json({ approveUrl, orderId: order.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur PayPal' }, { status: 500 })
  }
}
// Utilitaires PayPal
const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export async function getPayPalAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('PayPal auth failed: ' + JSON.stringify(data))
  return data.access_token
}

export async function createPayPalOrder(params: {
  amount: number
  currency?: string
  description: string
  customId: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approveUrl: string }> {
  const token = await getPayPalAccessToken()
  const { amount, currency = 'EUR', description, customId, returnUrl, cancelUrl } = params

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description: description.substring(0, 127),
        custom_id: customId,
      }],
      application_context: {
        brand_name: 'Lieu Secret',
        locale: 'fr-FR',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  })
  const data = await res.json()
  if (!data.id) throw new Error('PayPal order creation failed: ' + JSON.stringify(data))
  const approveUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href
  if (!approveUrl) throw new Error('PayPal approve URL not found')
  return { id: data.id, approveUrl }
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; customId: string; amount: number }> {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (data.status !== 'COMPLETED') throw new Error('PayPal capture failed: ' + JSON.stringify(data))
  const unit = data.purchase_units?.[0]
  const customId = unit?.custom_id || ''
  const amount   = parseFloat(unit?.payments?.captures?.[0]?.amount?.value || '0')
  return { status: data.status, customId, amount }
}

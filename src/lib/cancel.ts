import { createHmac } from 'crypto'

export function generateCancelUrl(reservationId: string): string {
  const secret = process.env.CANCEL_SECRET || 'lieu-secret-cancel-key'
  const token  = createHmac('sha256', secret).update(reservationId).digest('hex').slice(0, 32)
  const base   = process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr'
  return `${base}/reservation/annuler?id=${reservationId}&token=${token}`
}

export function generateCancelToken(reservationId: string): string {
  const secret = process.env.CANCEL_SECRET || 'lieu-secret-cancel-key'
  return createHmac('sha256', secret).update(reservationId).digest('hex').slice(0, 32)
}
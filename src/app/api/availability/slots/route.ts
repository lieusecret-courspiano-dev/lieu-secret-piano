import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots } from '@/lib/slots'
import { DateTime } from 'luxon'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from     = searchParams.get('from') || DateTime.now().toFormat('yyyy-MM-dd')
  const to       = searchParams.get('to')   || DateTime.now().plus({ days: 30 }).toFormat('yyyy-MM-dd')
  const timezone = searchParams.get('tz')   || 'Europe/Paris'

  try {
    const slots = await generateAvailableSlots(from, to, timezone)
    return NextResponse.json(slots)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
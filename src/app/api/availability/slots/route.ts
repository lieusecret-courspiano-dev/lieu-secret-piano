import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots } from '@/lib/slots'
import { DateTime } from 'luxon'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from     = searchParams.get('from') || DateTime.now().toFormat('yyyy-MM-dd')
  const to       = searchParams.get('to')   || DateTime.now().plus({ days: 30 }).toFormat('yyyy-MM-dd')
  const timezone = searchParams.get('tz')   || 'Europe/Paris'
  const code     = searchParams.get('code') || ''

  try {
    // ── Vérification du code d'accès côté serveur ──────────
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('cours_access_code')
      .eq('id', 1)
      .single()

    const validCode = (settings?.cours_access_code || '').trim().toLowerCase()

    // Si un code est défini et que le code fourni ne correspond pas → refus
    if (validCode && code.trim().toLowerCase() !== validCode) {
      return NextResponse.json({ error: 'Code d\'accès invalide' }, { status: 401 })
    }

    const slots = await generateAvailableSlots(from, to, timezone)
    return NextResponse.json(slots)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
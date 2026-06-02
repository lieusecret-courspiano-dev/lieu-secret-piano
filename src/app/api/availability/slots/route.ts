import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots } from '@/lib/slots'
import { DateTime } from 'luxon'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from     = searchParams.get('from') || DateTime.now().toFormat('yyyy-MM-dd')
  const to       = searchParams.get('to')   || DateTime.now().plus({ days: 30 }).toFormat('yyyy-MM-dd')
  const timezone = searchParams.get('tz')   || 'Europe/Paris'
  const code     = (searchParams.get('code') || '').trim().toLowerCase()

  try {
    // ── Récupération du code d'accès depuis Supabase ──────
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .select('cours_access_code')
      .eq('id', 1)
      .single()

    // Si erreur Supabase → refus par sécurité (fail closed)
    if (settingsError) {
      console.error('Erreur lecture site_settings:', settingsError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const validCode = (settings?.cours_access_code || '').trim().toLowerCase()

    // Si un code est défini → vérification stricte
    if (validCode) {
      if (!code || code !== validCode) {
        return NextResponse.json({ error: 'Code d\'accès invalide' }, { status: 401 })
      }
    }
    // Si aucun code défini en admin → accès libre (cours publics)

    const slots = await generateAvailableSlots(from, to, timezone)
    return NextResponse.json(slots)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    console.error('Erreur slots:', message)
    // Fail closed : en cas d'erreur inattendue, refuser l'accès
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
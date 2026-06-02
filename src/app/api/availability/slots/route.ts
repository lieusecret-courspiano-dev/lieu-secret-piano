import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots } from '@/lib/slots'
import { DateTime } from 'luxon'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from     = searchParams.get('from') || DateTime.now().toFormat('yyyy-MM-dd')
  const to       = searchParams.get('to')   || DateTime.now().plus({ days: 30 }).toFormat('yyyy-MM-dd')
  const timezone = searchParams.get('tz')   || 'Europe/Paris'
  const code     = (searchParams.get('code') || '').trim().toLowerCase()

  try {
    // ── Récupération du code d'accès depuis Supabase (service role) ──
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .select('cours_access_code')
      .eq('id', 1)
      .single()

    // Si erreur Supabase → refus par sécurité (fail closed)
    if (settingsError) {
      console.error('[slots] Erreur lecture site_settings:', settingsError.message)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500, headers: { 'x-ls-version': 'v3.2' } }
      )
    }

    const validCode = (settings?.cours_access_code || '').trim().toLowerCase()

    // Si un code est défini → vérification stricte obligatoire
    if (validCode) {
      if (!code) {
        return NextResponse.json(
          { error: 'Code d\'accès requis' },
          { status: 401, headers: { 'x-ls-version': 'v3.2' } }
        )
      }
      if (code !== validCode) {
        return NextResponse.json(
          { error: 'Code d\'accès invalide' },
          { status: 401, headers: { 'x-ls-version': 'v3.2' } }
        )
      }
    }
    // Si aucun code défini en admin → accès libre

    const slots = await generateAvailableSlots(from, to, timezone)
    return NextResponse.json(slots, {
      headers: { 'x-ls-version': 'v3.2' }
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    console.error('[slots] Erreur inattendue:', message)
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'x-ls-version': 'v3.2' } }
    )
  }
}
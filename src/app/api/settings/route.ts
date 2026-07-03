import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, updateSiteSettings } from '@/lib/settings'
import { validateAdminSession } from '@/lib/auth'

// GET — paramètres publics (cache 60s)
export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}

// PATCH — mettre à jour les paramètres (admin)
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  try {
    await updateSiteSettings(body)
    const updated = await getSiteSettings()
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — prochain cours de l'élève avec lien Kmeet
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const now = new Date().toISOString()

  // Chercher le prochain cours confirmé dans les 24h
  const { data: cours } = await supabaseAdmin
    .from('reservations')
    .select('id, slot_start, status, type, kmeet_url')
    .eq('email', eleve.email)
    .eq('status', 'confirmed')
    .gte('slot_start', now)
    .order('slot_start', { ascending: true })
    .limit(1)
    .single()

  if (!cours) return NextResponse.json({ cours: null })

  const coursData = cours as Record<string, unknown>
  return NextResponse.json({
    cours: {
      id:         coursData.id,
      slot_start: coursData.slot_start,
      kmeet_url:  coursData.kmeet_url || coursData.zoom_link || null,
      type:       coursData.type,
      status:     coursData.status,
    }
  })
}
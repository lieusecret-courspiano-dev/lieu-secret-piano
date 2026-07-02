import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 })

  try {
    const { data: pack, error } = await supabaseAdmin
      .from('course_packs')
      .select('id, code, pack_label, heures_total, heures_restantes, status, expires_at, acheteur_nom, acheteur_email')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error || !pack) return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 404 })
    if (pack.status !== 'active') return NextResponse.json({ valid: false, error: 'Ce pack est épuisé ou désactivé' }, { status: 400 })
    if (new Date(pack.expires_at) < new Date()) return NextResponse.json({ valid: false, error: 'Ce pack a expiré' }, { status: 400 })
    if (pack.heures_restantes <= 0) return NextResponse.json({ valid: false, error: 'Ce pack est épuisé' }, { status: 400 })

    return NextResponse.json({
      valid:            true,
      code:             pack.code,
      pack_label:       pack.pack_label,
      heures_total:     pack.heures_total,
      heures_restantes: pack.heures_restantes,
      acheteur_nom:     pack.acheteur_nom,
    })
  } catch { return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 }) }
}
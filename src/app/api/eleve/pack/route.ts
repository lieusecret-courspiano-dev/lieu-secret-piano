import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data: packs } = await supabaseAdmin.from('course_packs').select('id, code, pack_label, heures_total, heures_restantes, heures_utilisees, montant, status, expires_at, created_at, payment_method').or(`eleve_id.eq.${eleve.id},acheteur_email.eq.${eleve.email}`).order('created_at', { ascending: false })
  const activePack = packs?.find(p => p.status === 'active')
  let history: { id: string; type: string; delta: number; note: string | null; commentaire: string | null; created_at: string }[] = []
  if (activePack) {
    const { data: h } = await supabaseAdmin.from('pack_history').select('id, type, delta, note, commentaire, created_at').eq('pack_id', activePack.id).order('created_at', { ascending: false })
    history = h || []
  }
  return NextResponse.json({ packs: packs || [], history })
}

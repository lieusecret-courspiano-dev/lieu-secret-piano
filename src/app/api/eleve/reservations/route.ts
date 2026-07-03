import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('reservations').select('id, slot_start, slot_end, type, status, payment_method, amount, created_at').or(`eleve_id.eq.${eleve.id},student_email.eq.${eleve.email}`).order('slot_start', { ascending: false })
  return NextResponse.json(data || [])
}

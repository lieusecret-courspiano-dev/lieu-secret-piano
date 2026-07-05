import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — élèves autorisés pour un examen
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const examen_id = req.nextUrl.searchParams.get('examen_id')
  if (!examen_id) return NextResponse.json({ error: 'examen_id requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('examen_eleves')
    .select('eleve_id')
    .eq('examen_id', examen_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

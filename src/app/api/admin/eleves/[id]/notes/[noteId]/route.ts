import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  await supabaseAdmin.from('notes_cours').delete().eq('id', params.noteId).eq('eleve_id', params.id)
  return NextResponse.json({ success: true })
}

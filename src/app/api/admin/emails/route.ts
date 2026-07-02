import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('email_logs').select('*, reservation:reservations(student_name, student_email, slot_start, student_timezone)').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

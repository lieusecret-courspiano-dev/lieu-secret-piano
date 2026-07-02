import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('inscription_questions')
    .select('*')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await req.json()
  const { label, type, options, required, position, is_active } = body

  if (!label) return NextResponse.json({ error: 'Libelle requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('inscription_questions')
    .insert({ label, type: type || 'text', options: options || null, required: required ?? true, position: position || 0, is_active: is_active ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
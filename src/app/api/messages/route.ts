import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

// GET — messages (admin)
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — envoyer un message (public)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, subject, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Nom, email et message sont requis' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ name, email, subject: subject || null, message })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — marquer comme lu (admin)
export async function PATCH(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, is_read } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ is_read })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('inscription_questions')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  // Si la table n'existe pas encore, retourner un tableau vide (pas d'erreur)
  if (error) {
    console.error('inscription_questions error:', error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}
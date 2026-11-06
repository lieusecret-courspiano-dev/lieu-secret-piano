export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — détail d'un article par slug (côté public)
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('location_articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('publie', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  }

  return NextResponse.json(data)
}

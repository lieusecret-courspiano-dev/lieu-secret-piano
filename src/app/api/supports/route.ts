import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'

// GET — supports publiés (public)
export async function GET() {
  const { data } = await supabaseAdmin
    .from('supports_pedagogiques')
    .select('id, titre, description, niveau, type, fichier_url, apercu_url, est_gratuit, prix, nb_pages')
    .eq('est_publie', true)
    .order('niveau').order('created_at')
  return NextResponse.json(data || [])
}
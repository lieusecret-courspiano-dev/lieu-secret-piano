import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — travaux assignés à l'élève connecté
export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('travaux_eleves')
    .select('id, termine, termine_at, travaux_a_faire(id, titre, description, consignes, ressource_url, echeance, created_at)')
    .eq('eleve_id', eleve.id)
    .order('created_at', { ascending: false })

  // Aplatir la structure pour que la page puisse lire .titre directement
  const flattened = (data || []).map((item: Record<string, unknown>) => {
    const travail = item.travaux_a_faire as Record<string, unknown> | null
    return {
      id: item.id,
      travail_eleve_id: item.id, // pour le PATCH
      termine: item.termine,
      termine_at: item.termine_at,
      titre: travail?.titre || '',
      description: travail?.description || null,
      consignes: travail?.consignes || null,
      fichier_url: travail?.ressource_url || null,
      echeance: travail?.echeance || null,
      created_at: travail?.created_at || item.created_at,
    }
  })

  return NextResponse.json(flattened)
}

// PATCH — marquer un travail comme terminé ou non
export async function PATCH(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const body = await req.json()
  const travail_eleve_id = body.travail_eleve_id || body.id // compatibilité
  const { termine } = body
  if (!travail_eleve_id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('travaux_eleves')
    .update({
      termine,
      termine_at: termine ? new Date().toISOString() : null,
    })
    .eq('id', travail_eleve_id)
    .eq('eleve_id', eleve.id) // sécurité : l'élève ne peut modifier que ses propres travaux
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
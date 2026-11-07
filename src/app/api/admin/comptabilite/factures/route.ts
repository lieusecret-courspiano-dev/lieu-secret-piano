import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { creerFacture } from '@/lib/facturation'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste des factures avec filtres
export async function GET(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { searchParams } = new URL(req.url)
  const annee   = searchParams.get('annee')
  const statut  = searchParams.get('statut')
  const source  = searchParams.get('source')
  const search  = searchParams.get('search')
  const page    = parseInt(searchParams.get('page') || '1')
  const limit   = parseInt(searchParams.get('limit') || '50')
  const offset  = (page - 1) * limit

  let query = supabaseAdmin
    .from('comptabilite_factures')
    .select('*, comptabilite_factures_lignes(*)', { count: 'exact' })
    .order('date_facture', { ascending: false })
    .range(offset, offset + limit - 1)

  if (annee)  query = query.eq('annee', parseInt(annee))
  if (statut) query = query.eq('statut_paiement', statut)
  if (source) query = query.eq('source', source)
  if (search) query = query.or(`numero.ilike.%${search}%,client_nom.ilike.%${search}%,client_email.ilike.%${search}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ factures: data || [], total: count || 0, page, limit })
}

// POST — créer une facture manuellement
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()

  if (!body.client_nom || !body.lignes?.length) {
    return NextResponse.json({ error: 'Client et lignes requis.' }, { status: 400 })
  }

  const factureId = await creerFacture({
    source:          'manuel',
    source_id:       null as unknown as string,
    client_nom:      body.client_nom,
    client_email:    body.client_email || null,
    client_telephone: body.client_telephone || null,
    client_adresse:  body.client_adresse || null,
    date_facture:    body.date_facture || new Date().toISOString().split('T')[0],
    moyen_paiement:  body.moyen_paiement || null,
    statut_paiement: body.statut_paiement || 'paye',
    lignes:          body.lignes,
    notes:           body.notes || null,
  })

  if (!factureId) {
    return NextResponse.json({ error: 'Erreur lors de la création de la facture.' }, { status: 500 })
  }

  // Récupérer la facture créée
  const { data } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('*')
    .eq('id', factureId)
    .single()

  return NextResponse.json(data)
}

// PATCH — modifier une facture
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('comptabilite_factures')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — annuler une facture (pas de suppression physique)
export async function DELETE(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('comptabilite_factures')
    .update({ statut: 'annulee', statut_paiement: 'annule' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
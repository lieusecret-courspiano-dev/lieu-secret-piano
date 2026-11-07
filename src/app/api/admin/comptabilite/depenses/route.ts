import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste des dépenses
export async function GET(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { searchParams } = new URL(req.url)
  const annee     = searchParams.get('annee')
  const categorie = searchParams.get('categorie')
  const search    = searchParams.get('search')

  let query = supabaseAdmin
    .from('comptabilite_depenses')
    .select('*', { count: 'exact' })
    .order('date_depense', { ascending: false })

  if (annee) {
    query = query
      .gte('date_depense', `${annee}-01-01`)
      .lte('date_depense', `${annee}-12-31`)
  }
  if (categorie) query = query.eq('categorie', categorie)
  if (search)    query = query.or(`designation.ilike.%${search}%,fournisseur.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ depenses: data || [], total: count || 0 })
}

// POST — créer une dépense
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()

  if (!body.designation || !body.montant_ttc) {
    return NextResponse.json({ error: 'Désignation et montant requis.' }, { status: 400 })
  }

  const montant_ttc = parseFloat(body.montant_ttc) || 0
  const taux_tva    = parseFloat(body.taux_tva) || 0
  const montant_tva = taux_tva > 0
    ? Math.round(montant_ttc * (taux_tva / (100 + taux_tva)) * 100) / 100
    : 0
  const montant_ht  = Math.round((montant_ttc - montant_tva) * 100) / 100

  const { data, error } = await supabaseAdmin
    .from('comptabilite_depenses')
    .insert({
      date_depense:    body.date_depense || new Date().toISOString().split('T')[0],
      categorie:       body.categorie || 'autre',
      designation:     body.designation,
      fournisseur:     body.fournisseur || null,
      montant_ht,
      taux_tva,
      montant_tva,
      montant_ttc,
      moyen_paiement:  body.moyen_paiement || null,
      numero_piece:    body.numero_piece || null,
      justificatif_url: body.justificatif_url || null,
      notes:           body.notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — modifier une dépense
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  // Recalculer les montants si montant_ttc change
  if (updates.montant_ttc) {
    const montant_ttc = parseFloat(updates.montant_ttc)
    const taux_tva    = parseFloat(updates.taux_tva) || 0
    updates.montant_tva = taux_tva > 0
      ? Math.round(montant_ttc * (taux_tva / (100 + taux_tva)) * 100) / 100
      : 0
    updates.montant_ht = Math.round((montant_ttc - updates.montant_tva) * 100) / 100
  }

  const { data, error } = await supabaseAdmin
    .from('comptabilite_depenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer une dépense
export async function DELETE(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('comptabilite_depenses')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
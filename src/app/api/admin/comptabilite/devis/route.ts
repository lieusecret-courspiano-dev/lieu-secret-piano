import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — liste des devis
export async function GET(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { searchParams } = new URL(req.url)
  const annee  = searchParams.get('annee')
  const statut = searchParams.get('statut')
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('comptabilite_devis')
    .select('*, comptabilite_devis_lignes(*)', { count: 'exact' })
    .order('date_devis', { ascending: false })

  if (annee)  query = query.eq('annee', parseInt(annee))
  if (statut) query = query.eq('statut', statut)
  if (search) query = query.or(`numero.ilike.%${search}%,client_nom.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ devis: data || [], total: count || 0 })
}

// POST — créer un devis
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()

  if (!body.client_nom || !body.lignes?.length) {
    return NextResponse.json({ error: 'Client et lignes requis.' }, { status: 400 })
  }

  const now   = new Date()
  const annee = now.getFullYear()

  // Générer le numéro de devis
  const { data: numero } = await supabaseAdmin
    .rpc('get_next_numero', { p_type: 'devis', p_annee: annee })

  // Calculer les totaux
  let montant_ht = 0, montant_tva = 0, montant_ttc = 0
  const lignesCalc = body.lignes.map((l: {
    designation: string; description?: string; quantite: number
    unite: string; prix_unitaire: number; taux_tva: number
  }, i: number) => {
    const ht  = Math.round(l.quantite * l.prix_unitaire * 100) / 100
    const tva = Math.round(ht * (l.taux_tva / 100) * 100) / 100
    const ttc = Math.round((ht + tva) * 100) / 100
    montant_ht  += ht
    montant_tva += tva
    montant_ttc += ttc
    return { ...l, montant_ht: ht, montant_tva: tva, montant_ttc: ttc, position: i }
  })

  montant_ht  = Math.round(montant_ht * 100) / 100
  montant_tva = Math.round(montant_tva * 100) / 100
  montant_ttc = Math.round(montant_ttc * 100) / 100

  // Créer le devis
  const { data: devis, error } = await supabaseAdmin
    .from('comptabilite_devis')
    .insert({
      numero:           numero || `DEV-${annee}-0001`,
      annee,
      client_nom:       body.client_nom,
      client_email:     body.client_email || null,
      client_telephone: body.client_telephone || null,
      client_adresse:   body.client_adresse || null,
      date_devis:       body.date_devis || now.toISOString().split('T')[0],
      date_validite:    body.date_validite || null,
      montant_ht,
      taux_tva:         0,
      montant_tva,
      montant_ttc,
      statut:           'brouillon',
      objet:            body.objet || null,
      notes:            body.notes || null,
      conditions:       body.conditions || 'Devis valable 30 jours à compter de sa date d\'émission.',
    })
    .select('id')
    .single()

  if (error || !devis) {
    return NextResponse.json({ error: error?.message || 'Erreur création devis' }, { status: 500 })
  }

  // Créer les lignes
  await supabaseAdmin.from('comptabilite_devis_lignes').insert(
    lignesCalc.map((l: {
      designation: string; description?: string; quantite: number
      unite: string; prix_unitaire: number; taux_tva: number
      montant_ht: number; montant_tva: number; montant_ttc: number; position: number
    }) => ({
      devis_id:      devis.id,
      position:      l.position,
      designation:   l.designation,
      description:   l.description || null,
      quantite:      l.quantite,
      unite:         l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva:      l.taux_tva,
      montant_ht:    l.montant_ht,
      montant_tva:   l.montant_tva,
      montant_ttc:   l.montant_ttc,
    }))
  )

  const { data: full } = await supabaseAdmin
    .from('comptabilite_devis')
    .select('*, comptabilite_devis_lignes(*)')
    .eq('id', devis.id)
    .single()

  return NextResponse.json(full)
}

// PATCH — modifier un devis
export async function PATCH(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('comptabilite_devis')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer un devis
export async function DELETE(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('comptabilite_devis')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
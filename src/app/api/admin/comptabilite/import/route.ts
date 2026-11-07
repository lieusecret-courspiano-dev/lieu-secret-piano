import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// Interface explicite pour éviter les erreurs TypeScript
interface LigneNormalisee {
  numero_odoo: string
  client_nom: string
  client_email: string
  date_facture: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  taux_tva: number
  statut_paiement: string
  designation: string
  description: string | null
  moyen_paiement: string
  quantite: number
  unite: string
  notes: string | null
}

// GET — historique des imports
export async function GET() {
  const err = await checkAdmin()
  if (err) return err

  const { data, error } = await supabaseAdmin
    .from('comptabilite_imports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — importer des factures depuis CSV
export async function POST(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const body = await req.json()
  const { lignes, source, nom_fichier } = body

  if (!lignes?.length) {
    return NextResponse.json({ error: 'Aucune ligne à importer.' }, { status: 400 })
  }

  // Créer l'entrée d'import
  const { data: importEntry } = await supabaseAdmin
    .from('comptabilite_imports')
    .insert({
      source:      source || 'csv',
      nom_fichier: nom_fichier || 'import.csv',
      nb_lignes:   lignes.length,
      statut:      'en_cours',
    })
    .select('id')
    .single()

  const importId = importEntry?.id
  let nb_importees = 0
  let nb_erreurs   = 0
  const erreurs: { ligne: number; erreur: string; data: unknown }[] = []

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i]
    try {
      const normalized: LigneNormalisee | null = normaliserLigne(ligne, source)
      if (!normalized) {
        erreurs.push({ ligne: i + 1, erreur: 'Ligne ignorée (vide ou en-tête)', data: ligne })
        continue
      }

      // Vérifier si la facture existe déjà
      if (normalized.numero_odoo) {
        const { data: existing } = await supabaseAdmin
          .from('comptabilite_factures')
          .select('id')
          .eq('numero_odoo', normalized.numero_odoo)
          .single()

        if (existing) {
          erreurs.push({ ligne: i + 1, erreur: `Facture ${normalized.numero_odoo} déjà importée`, data: ligne })
          nb_erreurs++
          continue
        }
      }

      const annee = normalized.date_facture
        ? new Date(normalized.date_facture).getFullYear()
        : new Date().getFullYear()

      const { data: numero } = await supabaseAdmin
        .rpc('get_next_numero', { p_type: 'facture', p_annee: annee })

      const { data: facture, error: factErr } = await supabaseAdmin
        .from('comptabilite_factures')
        .insert({
          numero:           numero || `FAC-${annee}-IMP-${i}`,
          annee,
          type:             'import',
          source:           'import',
          client_nom:       normalized.client_nom || 'Client inconnu',
          client_email:     normalized.client_email || null,
          date_facture:     normalized.date_facture || new Date().toISOString().split('T')[0],
          montant_ht:       normalized.montant_ht || 0,
          taux_tva:         normalized.taux_tva || 0,
          montant_tva:      normalized.montant_tva || 0,
          montant_ttc:      normalized.montant_ttc || 0,
          moyen_paiement:   normalized.moyen_paiement || null,
          statut_paiement:  normalized.statut_paiement || 'paye',
          statut:           'emise',
          notes:            normalized.notes,
          numero_odoo:      normalized.numero_odoo || null,
        })
        .select('id')
        .single()

      if (factErr || !facture) {
        erreurs.push({ ligne: i + 1, erreur: factErr?.message || 'Erreur insertion', data: ligne })
        nb_erreurs++
        continue
      }

      if (normalized.designation) {
        await supabaseAdmin.from('comptabilite_factures_lignes').insert({
          facture_id:    facture.id,
          position:      0,
          designation:   normalized.designation,
          description:   normalized.description,
          quantite:      normalized.quantite || 1,
          unite:         normalized.unite || 'unité',
          prix_unitaire: normalized.montant_ht || normalized.montant_ttc || 0,
          taux_tva:      normalized.taux_tva || 0,
          montant_ht:    normalized.montant_ht || 0,
          montant_tva:   normalized.montant_tva || 0,
          montant_ttc:   normalized.montant_ttc || 0,
        })
      }

      nb_importees++
    } catch (e: unknown) {
      erreurs.push({ ligne: i + 1, erreur: e instanceof Error ? e.message : 'Erreur inconnue', data: ligne })
      nb_erreurs++
    }
  }

  if (importId) {
    await supabaseAdmin
      .from('comptabilite_imports')
      .update({
        nb_importees,
        nb_erreurs,
        erreurs: erreurs.slice(0, 50),
        statut: nb_erreurs === lignes.length ? 'erreur' : 'termine',
      })
      .eq('id', importId)
  }

  return NextResponse.json({ success: true, nb_importees, nb_erreurs, erreurs: erreurs.slice(0, 10) })
}

// ── Normalisation ────────────────────────────────────────────
function normaliserLigne(ligne: Record<string, string>, source: string): LigneNormalisee | null {
  const values = Object.values(ligne).filter(v => v?.trim())
  if (values.length === 0) return null
  if (source === 'odoo') return normaliserOdoo(ligne)
  return normaliserCSVGenerique(ligne)
}

function normaliserOdoo(ligne: Record<string, string>): LigneNormalisee | null {
  const numero_odoo   = ligne['Numéro'] || ligne['Number'] || ligne['name'] || ''
  const client_nom    = ligne['Client'] || ligne['Partner'] || ligne['customer'] || ''
  const date_str      = ligne['Date de facturation'] || ligne['Invoice Date'] || ligne['date'] || ''
  const montant_ht    = parseFloat((ligne['Montant HT'] || ligne['Amount Untaxed'] || ligne['amount_untaxed'] || '0').replace(',', '.').replace(/\s/g, '')) || 0
  const montant_tva   = parseFloat((ligne['Montant TVA'] || ligne['Tax Amount'] || ligne['amount_tax'] || '0').replace(',', '.').replace(/\s/g, '')) || 0
  const montant_ttc   = parseFloat((ligne['Montant TTC'] || ligne['Total'] || ligne['amount_total'] || '0').replace(',', '.').replace(/\s/g, '')) || 0
  const statut_odoo   = ligne['État'] || ligne['Status'] || ligne['state'] || ''
  const designation   = ligne['Produit'] || ligne['Product'] || ligne['Description'] || 'Prestation de services'
  const client_email  = ligne['Email client'] || ligne['Customer Email'] || ligne['partner_email'] || ''
  const paiement      = ligne['Mode de paiement'] || ligne['Payment Method'] || ''

  if (!client_nom && !montant_ttc) return null

  let date_facture = ''
  if (date_str) {
    if (date_str.includes('/')) {
      const parts = date_str.split('/')
      if (parts.length === 3) {
        date_facture = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    } else {
      date_facture = date_str.split('T')[0]
    }
  }

  const statut_paiement = statut_odoo.toLowerCase().includes('payé') || statut_odoo.toLowerCase().includes('paid')
    ? 'paye'
    : statut_odoo.toLowerCase().includes('annul') || statut_odoo.toLowerCase().includes('cancel')
    ? 'annule'
    : 'paye'

  const taux_tva = montant_ht > 0 && montant_tva > 0
    ? Math.round((montant_tva / montant_ht) * 100)
    : 0

  return {
    numero_odoo,
    client_nom,
    client_email,
    date_facture,
    montant_ht,
    montant_tva,
    montant_ttc: montant_ttc || (montant_ht + montant_tva),
    taux_tva,
    statut_paiement,
    designation,
    description:   null,
    moyen_paiement: paiement ? normaliserPaiement(paiement) : 'virement',
    quantite:      1,
    unite:         'forfait',
    notes:         null,
  }
}

function normaliserCSVGenerique(ligne: Record<string, string>): LigneNormalisee | null {
  const getVal = (patterns: string[]) => {
    for (const p of patterns) {
      const key = Object.keys(ligne).find(k => k.toLowerCase().includes(p))
      if (key && ligne[key]?.trim()) return ligne[key].trim()
    }
    return ''
  }

  const client_nom  = getVal(['client', 'customer', 'nom', 'name'])
  const montant_str = getVal(['ttc', 'total', 'montant', 'amount', 'prix'])
  const montant_ttc = parseFloat(montant_str.replace(',', '.').replace(/\s/g, '')) || 0
  const date_str    = getVal(['date'])
  const designation = getVal(['designation', 'description', 'produit', 'product', 'libelle', 'objet'])
  const numero_odoo = getVal(['numero', 'number', 'ref', 'facture'])

  if (!client_nom && !montant_ttc) return null

  let date_facture = ''
  if (date_str) {
    if (date_str.includes('/')) {
      const parts = date_str.split('/')
      if (parts.length === 3) {
        const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`
        date_facture = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    } else {
      date_facture = date_str.split('T')[0]
    }
  }

  return {
    numero_odoo,
    client_nom,
    client_email:    getVal(['email', 'mail']),
    date_facture,
    montant_ht:      montant_ttc,
    montant_tva:     0,
    montant_ttc,
    taux_tva:        0,
    statut_paiement: 'paye',
    designation:     designation || 'Prestation de services',
    description:     null,
    moyen_paiement:  normaliserPaiement(getVal(['paiement', 'payment', 'reglement'])),
    quantite:        1,
    unite:           'forfait',
    notes:           null,
  }
}

function normaliserPaiement(val: string): string {
  const v = val.toLowerCase()
  if (v.includes('virement') || v.includes('transfer')) return 'virement'
  if (v.includes('carte') || v.includes('card') || v.includes('stripe') || v.includes('cb')) return 'stripe'
  if (v.includes('paypal')) return 'paypal'
  if (v.includes('espece') || v.includes('cash')) return 'especes'
  if (v.includes('cheque') || v.includes('check')) return 'cheque'
  return 'virement'
}
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return null
}

// GET — données pour l'export
export async function GET(req: NextRequest) {
  const err = await checkAdmin()
  if (err) return err

  const { searchParams } = new URL(req.url)
  const annee  = parseInt(searchParams.get('annee') || new Date().getFullYear().toString())
  const format = searchParams.get('format') || 'json' // json | csv

  const debut = `${annee}-01-01`
  const fin   = `${annee}-12-31`

  // Factures
  const { data: factures } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('*, comptabilite_factures_lignes(*)')
    .gte('date_facture', debut)
    .lte('date_facture', fin)
    .neq('statut', 'annulee')
    .order('date_facture', { ascending: true })

  // Dépenses
  const { data: depenses } = await supabaseAdmin
    .from('comptabilite_depenses')
    .select('*')
    .gte('date_depense', debut)
    .lte('date_depense', fin)
    .order('date_depense', { ascending: true })

  // Paramètres
  const { data: params } = await supabaseAdmin
    .from('comptabilite_parametres')
    .select('*')
    .eq('id', 1)
    .single()

  const facturesList = factures || []
  const depensesList = depenses || []

  // ── Calculs ──────────────────────────────────────────────
  const caTotal      = facturesList.reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const caHT         = facturesList.reduce((s, f) => s + (f.montant_ht || 0), 0)
  const tvaCollectee = facturesList.reduce((s, f) => s + (f.montant_tva || 0), 0)
  const caEncaisse   = facturesList.filter(f => f.statut_paiement === 'paye').reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalDepenses = depensesList.reduce((s, d) => s + (d.montant_ttc || 0), 0)
  const totalDepensesHT = depensesList.reduce((s, d) => s + (d.montant_ht || 0), 0)
  const tvaDeduc     = depensesList.reduce((s, d) => s + (d.montant_tva || 0), 0)
  const resultat     = caEncaisse - totalDepenses
  const SEUIL_AE     = 77700

  // Par trimestre
  const trimestres = [1, 2, 3, 4].map(t => {
    const moisDebut = (t - 1) * 3 + 1
    const moisFin   = t * 3
    const mF = facturesList.filter(f => {
      const m = new Date(f.date_facture).getMonth() + 1
      return m >= moisDebut && m <= moisFin && f.statut_paiement === 'paye'
    })
    const mD = depensesList.filter(d => {
      const m = new Date(d.date_depense).getMonth() + 1
      return m >= moisDebut && m <= moisFin
    })
    return {
      trimestre: t,
      label: `T${t} ${annee}`,
      ca:       Math.round(mF.reduce((s, f) => s + (f.montant_ttc || 0), 0) * 100) / 100,
      depenses: Math.round(mD.reduce((s, d) => s + (d.montant_ttc || 0), 0) * 100) / 100,
      tva:      Math.round(mF.reduce((s, f) => s + (f.montant_tva || 0), 0) * 100) / 100,
    }
  })

  // Par source
  const parSource: Record<string, { nb: number; montant: number }> = {}
  for (const f of facturesList) {
    const src = f.source || 'autre'
    if (!parSource[src]) parSource[src] = { nb: 0, montant: 0 }
    parSource[src].nb++
    parSource[src].montant += f.montant_ttc || 0
  }

  // Par catégorie dépenses
  const parCategorie: Record<string, number> = {}
  for (const d of depensesList) {
    const cat = d.categorie || 'autre'
    parCategorie[cat] = (parCategorie[cat] || 0) + (d.montant_ttc || 0)
  }

  const bilan = {
    annee,
    entreprise: {
      nom:      params?.nom_proprietaire || 'Claudine Yombo',
      siret:    params?.siret || '98246654200015',
      adresse:  `${params?.adresse || ''} ${params?.code_postal || ''} ${params?.ville || ''}`.trim(),
      email:    params?.email || '',
      telephone: params?.telephone || '',
    },
    revenus: {
      ca_total:       Math.round(caTotal * 100) / 100,
      ca_ht:          Math.round(caHT * 100) / 100,
      ca_encaisse:    Math.round(caEncaisse * 100) / 100,
      tva_collectee:  Math.round(tvaCollectee * 100) / 100,
      nb_factures:    facturesList.length,
    },
    charges: {
      total_ttc:      Math.round(totalDepenses * 100) / 100,
      total_ht:       Math.round(totalDepensesHT * 100) / 100,
      tva_deductible: Math.round(tvaDeduc * 100) / 100,
      nb_depenses:    depensesList.length,
    },
    resultat: {
      benefice_net:   Math.round(resultat * 100) / 100,
      tva_nette:      Math.round((tvaCollectee - tvaDeduc) * 100) / 100,
    },
    seuil_ae: {
      seuil:          SEUIL_AE,
      ca_encaisse:    Math.round(caEncaisse * 100) / 100,
      pourcentage:    Math.round((caEncaisse / SEUIL_AE) * 100),
      reste:          Math.round((SEUIL_AE - caEncaisse) * 100) / 100,
    },
    trimestres,
    par_source:    parSource,
    par_categorie: parCategorie,
    factures:      facturesList,
    depenses:      depensesList,
  }

  if (format === 'csv') {
    // Export CSV journal des ventes
    const rows = [
      ['Date', 'Numéro', 'Client', 'Email', 'Source', 'Désignation', 'Montant HT', 'TVA', 'Montant TTC', 'Mode paiement', 'Statut'],
      ...facturesList.map(f => [
        f.date_facture,
        f.numero,
        f.client_nom,
        f.client_email || '',
        f.source || '',
        (f.comptabilite_factures_lignes?.[0]?.designation || ''),
        f.montant_ht.toFixed(2),
        f.montant_tva.toFixed(2),
        f.montant_ttc.toFixed(2),
        f.moyen_paiement || '',
        f.statut_paiement,
      ])
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="journal-ventes-${annee}.csv"`,
      },
    })
  }

  if (format === 'csv-depenses') {
    const rows = [
      ['Date', 'Catégorie', 'Désignation', 'Fournisseur', 'N° pièce', 'Montant HT', 'TVA', 'Montant TTC', 'Mode paiement'],
      ...depensesList.map(d => [
        d.date_depense,
        d.categorie,
        d.designation,
        d.fournisseur || '',
        d.numero_piece || '',
        d.montant_ht.toFixed(2),
        d.montant_tva.toFixed(2),
        d.montant_ttc.toFixed(2),
        d.moyen_paiement || '',
      ])
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="journal-achats-${annee}.csv"`,
      },
    })
  }

  return NextResponse.json(bilan)
}
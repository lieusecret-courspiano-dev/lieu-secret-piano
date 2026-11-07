import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { DateTime } from 'luxon'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const annee = parseInt(searchParams.get('annee') || new Date().getFullYear().toString())

  const debut = `${annee}-01-01`
  const fin   = `${annee}-12-31`

  try {
    // ── Factures de l'année ──────────────────────────────────
    const { data: factures } = await supabaseAdmin
      .from('comptabilite_factures')
      .select('*')
      .gte('date_facture', debut)
      .lte('date_facture', fin)
      .neq('statut', 'annulee')
      .order('date_facture', { ascending: true })

    // ── Dépenses de l'année ──────────────────────────────────
    const { data: depenses } = await supabaseAdmin
      .from('comptabilite_depenses')
      .select('*')
      .gte('date_depense', debut)
      .lte('date_depense', fin)
      .order('date_depense', { ascending: true })

    // ── Calculs globaux ──────────────────────────────────────
    const facturesList = factures || []
    const depensesList = depenses || []

    const caTotal       = facturesList.reduce((s, f) => s + (f.montant_ttc || 0), 0)
    const tvaCollectee  = facturesList.reduce((s, f) => s + (f.montant_tva || 0), 0)
    const totalDepenses = depensesList.reduce((s, d) => s + (d.montant_ttc || 0), 0)
    const resultat      = caTotal - totalDepenses

    // Factures par statut
    const facturesPayees    = facturesList.filter(f => f.statut_paiement === 'paye')
    const facturesAttente   = facturesList.filter(f => f.statut_paiement === 'en_attente')
    const caEncaisse        = facturesPayees.reduce((s, f) => s + (f.montant_ttc || 0), 0)
    const caAttente         = facturesAttente.reduce((s, f) => s + (f.montant_ttc || 0), 0)

    // CA par source
    const caParSource: Record<string, number> = {}
    for (const f of facturesList) {
      const src = f.source || 'autre'
      caParSource[src] = (caParSource[src] || 0) + (f.montant_ttc || 0)
    }

    // CA par moyen de paiement
    const caParPaiement: Record<string, number> = {}
    for (const f of facturesPayees) {
      const mp = f.moyen_paiement || 'autre'
      caParPaiement[mp] = (caParPaiement[mp] || 0) + (f.montant_ttc || 0)
    }

    // Dépenses par catégorie
    const depensesParCategorie: Record<string, number> = {}
    for (const d of depensesList) {
      const cat = d.categorie || 'autre'
      depensesParCategorie[cat] = (depensesParCategorie[cat] || 0) + (d.montant_ttc || 0)
    }

    // ── Données mensuelles ───────────────────────────────────
    const mois = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const label = DateTime.fromObject({ year: annee, month: i + 1 })
        .setLocale('fr').toFormat('MMM')

      const mFactures  = facturesList.filter(f => f.date_facture?.startsWith(`${annee}-${m}`))
      const mDepenses  = depensesList.filter(d => d.date_depense?.startsWith(`${annee}-${m}`))

      const mCA        = mFactures.reduce((s, f) => s + (f.montant_ttc || 0), 0)
      const mEncaisse  = mFactures.filter(f => f.statut_paiement === 'paye').reduce((s, f) => s + (f.montant_ttc || 0), 0)
      const mDepTotal  = mDepenses.reduce((s, d) => s + (d.montant_ttc || 0), 0)
      const mResultat  = mEncaisse - mDepTotal

      return {
        mois: `${annee}-${m}`,
        label,
        ca: Math.round(mCA * 100) / 100,
        encaisse: Math.round(mEncaisse * 100) / 100,
        depenses: Math.round(mDepTotal * 100) / 100,
        resultat: Math.round(mResultat * 100) / 100,
        nb_factures: mFactures.length,
      }
    })

    // ── Dernières factures ───────────────────────────────────
    const dernieresFactures = facturesList
      .sort((a, b) => new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime())
      .slice(0, 5)

    // ── Seuil auto-entrepreneur ──────────────────────────────
    // Seuil 2024/2025/2026 : 77 700 € pour prestations de services
    const SEUIL_AE = 77700
    const pourcentageSeuil = Math.round((caTotal / SEUIL_AE) * 100)

    return NextResponse.json({
      annee,
      resume: {
        ca_total:        Math.round(caTotal * 100) / 100,
        ca_encaisse:     Math.round(caEncaisse * 100) / 100,
        ca_attente:      Math.round(caAttente * 100) / 100,
        tva_collectee:   Math.round(tvaCollectee * 100) / 100,
        total_depenses:  Math.round(totalDepenses * 100) / 100,
        resultat:        Math.round(resultat * 100) / 100,
        nb_factures:     facturesList.length,
        nb_factures_payees: facturesPayees.length,
        nb_factures_attente: facturesAttente.length,
        seuil_ae:        SEUIL_AE,
        pourcentage_seuil: pourcentageSeuil,
      },
      ca_par_source:    caParSource,
      ca_par_paiement:  caParPaiement,
      depenses_par_categorie: depensesParCategorie,
      mensuel:          mois,
      dernieres_factures: dernieresFactures,
    })
  } catch (e: unknown) {
    console.error('Erreur dashboard comptabilité:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
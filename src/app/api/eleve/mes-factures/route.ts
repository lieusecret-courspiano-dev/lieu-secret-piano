import { NextResponse } from 'next/server'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — factures de l'élève connecté
export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Récupérer les factures par email de l'élève
  const { data: factures, error } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('id, numero, date_facture, montant_ttc, montant_ht, source, statut_paiement, moyen_paiement, pdf_url, comptabilite_factures_lignes(designation, quantite, unite, prix_unitaire, montant_ttc)')
    .eq('client_email', eleve.email.toLowerCase())
    .neq('statut', 'annulee')
    .order('date_facture', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(factures || [])
}
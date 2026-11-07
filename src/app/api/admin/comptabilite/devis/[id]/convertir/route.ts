import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { creerFacture } from '@/lib/facturation'

export const dynamic = 'force-dynamic'

// POST — convertir un devis en facture
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Récupérer le devis avec ses lignes
  const { data: devis, error } = await supabaseAdmin
    .from('comptabilite_devis')
    .select('*, comptabilite_devis_lignes(*)')
    .eq('id', params.id)
    .single()

  if (error || !devis) {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 })
  }

  if (devis.statut === 'facture') {
    return NextResponse.json({ error: 'Ce devis a déjà été converti en facture.' }, { status: 400 })
  }

  const lignes = (devis.comptabilite_devis_lignes || [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

  // Créer la facture depuis le devis
  const factureId = await creerFacture({
    source:          'devis',
    source_id:       devis.id,
    client_nom:      devis.client_nom,
    client_email:    devis.client_email,
    client_telephone: devis.client_telephone,
    client_adresse:  devis.client_adresse,
    statut_paiement: 'en_attente',
    notes:           devis.notes,
    lignes:          lignes.map((l: {
      designation: string; description: string | null
      quantite: number; unite: string; prix_unitaire: number; taux_tva: number
    }) => ({
      designation:   l.designation,
      description:   l.description || undefined,
      quantite:      l.quantite,
      unite:         l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva:      l.taux_tva,
    })),
  })

  if (!factureId) {
    return NextResponse.json({ error: 'Erreur lors de la création de la facture.' }, { status: 500 })
  }

  // Mettre à jour le devis
  await supabaseAdmin
    .from('comptabilite_devis')
    .update({ statut: 'facture', facture_id: factureId })
    .eq('id', params.id)

  // Récupérer la facture créée
  const { data: facture } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('id, numero')
    .eq('id', factureId)
    .single()

  return NextResponse.json({ success: true, facture_id: factureId, numero: facture?.numero })
}
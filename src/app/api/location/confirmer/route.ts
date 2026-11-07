import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { factureDepuisLocation, factureExistePour } from '@/lib/facturation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reservation_id, session_id } = body

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id manquant' }, { status: 400 })
    }

    const { data: resa, error } = await supabaseAdmin
      .from('location_reservations')
      .select('id, statut, paiement_statut, stripe_session_id')
      .eq('id', reservation_id)
      .single()

    if (error || !resa) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (session_id && resa.stripe_session_id && resa.stripe_session_id !== session_id) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 400 })
    }

    await supabaseAdmin
      .from('location_reservations')
      .update({ paiement_statut: 'complet', statut: 'validee' })
      .eq('id', reservation_id)

    // Générer la facture automatiquement
    try {
      const { data: resa } = await supabaseAdmin
        .from('location_reservations')
        .select('*')
        .eq('id', reservation_id)
        .single()

      if (resa && !(await factureExistePour('location', reservation_id))) {
        await factureDepuisLocation({
          id:              resa.id,
          article_nom:     resa.article_nom,
          montant_total:   resa.montant_total,
          montant_acompte: resa.montant_acompte,
          est_acompte:     resa.est_acompte,
          moyen_paiement:  resa.moyen_paiement,
          locataire_nom:   resa.locataire_nom,
          locataire_email: resa.locataire_email,
          date_debut:      resa.date_debut,
          date_fin:        resa.date_fin,
          nb_jours:        resa.nb_jours,
          created_at:      resa.created_at,
        })
      }
    } catch (fe) { console.error('Erreur facture location:', fe) }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Erreur confirmation paiement location:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
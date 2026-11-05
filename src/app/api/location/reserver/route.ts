import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Vérifications de base
    if (!body.article_id || !body.locataire_nom || !body.locataire_email) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (!body.date_debut || !body.date_fin) {
      return NextResponse.json({ error: 'Les dates de location sont requises.' }, { status: 400 })
    }
    if (new Date(body.date_fin) < new Date(body.date_debut)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début.' }, { status: 400 })
    }

    // Vérifier que l'article existe et est disponible
    const { data: article, error: artErr } = await supabaseAdmin
      .from('location_articles')
      .select('id, nom, disponible, stock, publie')
      .eq('id', body.article_id)
      .single()

    if (artErr || !article) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })
    }
    if (!article.disponible || article.stock < 1) {
      return NextResponse.json({ error: 'Cet article n\'est plus disponible à la location.' }, { status: 400 })
    }

    // Créer la réservation
    const { data: reservation, error: resaErr } = await supabaseAdmin
      .from('location_reservations')
      .insert({
        article_id:            body.article_id,
        article_nom:           body.article_nom,
        article_valeur:        body.article_valeur || null,
        locataire_nom:         body.locataire_nom,
        locataire_email:       body.locataire_email,
        locataire_telephone:   body.locataire_telephone || null,
        locataire_adresse:     body.locataire_adresse || null,
        locataire_ville:       body.locataire_ville || null,
        locataire_code_postal: body.locataire_code_postal || null,
        date_debut:            body.date_debut,
        date_fin:              body.date_fin,
        duree_type:            body.duree_type,
        nb_jours:              body.nb_jours || null,
        mode_remise:           body.mode_remise || 'retrait',
        adresse_livraison:     body.adresse_livraison || null,
        zone_livraison_id:     body.zone_livraison_id || null,
        frais_livraison:       body.frais_livraison || 0,
        montant_location:      body.montant_location,
        montant_acompte:       body.montant_acompte || null,
        montant_total:         body.montant_total,
        est_acompte:           body.est_acompte || false,
        caution_montant:       body.caution_montant || 0,
        caution_type:          body.caution_type || 'cheque',
        moyen_paiement:        body.moyen_paiement || 'virement',
        paiement_statut:       'en_attente',
        contrat_signe:         body.contrat_signe || false,
        contrat_signe_le:      body.contrat_signe_le || null,
        signature_nom:         body.signature_nom || null,
        note_client:           body.note_client || null,
        statut:                'en_attente',
      })
      .select()
      .single()

    if (resaErr || !reservation) {
      return NextResponse.json({ error: 'Erreur lors de la création de la réservation.' }, { status: 500 })
    }

    // Envoyer un email de notification à l'admin
    try {
      const { sendEmail } = await import('@/lib/email')
      await sendEmail({
        to: 'lieusecret-courspiano@outlook.fr',
        subject: `[Location] Nouvelle demande — ${body.article_nom}`,
        html: `
          <h2>Nouvelle demande de location</h2>
          <p><strong>Article :</strong> ${body.article_nom}</p>
          <p><strong>Locataire :</strong> ${body.locataire_nom} (${body.locataire_email})</p>
          <p><strong>Période :</strong> du ${body.date_debut} au ${body.date_fin} (${body.nb_jours} jour(s))</p>
          <p><strong>Montant total :</strong> ${body.montant_total} €</p>
          <p><strong>Paiement :</strong> ${body.moyen_paiement}</p>
          <p><strong>Remise :</strong> ${body.mode_remise}</p>
          <p><a href="https://www.lieusecret-courspiano.fr/admin/location/${reservation.id}">Voir la réservation →</a></p>
        `,
      })
    } catch { /* Email non bloquant */ }

    // Envoyer un email de confirmation au client
    try {
      const { sendEmail } = await import('@/lib/email')
      const montantDu = body.est_acompte ? body.montant_acompte : body.montant_total
      await sendEmail({
        to: body.locataire_email,
        subject: `Votre demande de location — ${body.article_nom}`,
        html: `
          <h2>Demande de location reçue</h2>
          <p>Bonjour ${body.locataire_nom},</p>
          <p>Votre demande de location a bien été reçue. Voici le récapitulatif :</p>
          <ul>
            <li><strong>Article :</strong> ${body.article_nom}</li>
            <li><strong>Période :</strong> du ${new Date(body.date_debut).toLocaleDateString('fr-FR')} au ${new Date(body.date_fin).toLocaleDateString('fr-FR')}</li>
            <li><strong>Durée :</strong> ${body.nb_jours} jour(s)</li>
            <li><strong>Montant total :</strong> ${body.montant_total} €</li>
            ${body.est_acompte ? `<li><strong>Acompte à régler (50%) :</strong> ${body.montant_acompte} €</li>` : ''}
            <li><strong>Caution :</strong> ${body.caution_montant} € (${body.caution_type === 'cheque' ? 'chèque à remettre lors de la remise du matériel' : body.caution_type})</li>
          </ul>
          ${body.moyen_paiement === 'virement' ? `
            <p><strong>Paiement par virement :</strong> Vous recevrez les coordonnées bancaires dans un second email après validation de votre demande.</p>
          ` : ''}
          <p>Nous vous contacterons rapidement pour confirmer votre réservation.</p>
          <p>Cordialement,<br/>Lieu Secret — École de Piano</p>
        `,
      })
    } catch { /* Email non bloquant */ }

    return NextResponse.json(reservation)
  } catch (e: unknown) {
    console.error('Erreur réservation location:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
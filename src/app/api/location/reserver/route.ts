import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend    = new Resend(process.env.RESEND_API_KEY!)
const FROM      = 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
const BASE_URL  = 'https://www.lieusecret-courspiano.fr'

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fMontant(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

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
      console.error('Erreur création réservation:', resaErr)
      return NextResponse.json({ error: 'Erreur lors de la création de la réservation.' }, { status: 500 })
    }

    const cautionLabel: Record<string, string> = {
      cheque:      'Chèque remis à la livraison',
      virement:    'Virement bancaire',
      especes:     'Espèces',
      stripe_hold: 'Empreinte carte (Stripe)',
    }

    // Email de notification à l'admin
    resend.emails.send({
      from: FROM,
      to:   ADMIN_EMAIL,
      subject: `[Location] Nouvelle demande — ${body.article_nom}`,
      html: `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
            <div style="font-size:11px;color:#7070a0;margin-top:4px;letter-spacing:2px;">LOCATION DE MATÉRIEL</div>
          </div>
          <h2 style="color:#f59e0b;margin:0 0 16px;">Nouvelle demande de location</h2>
          <table style="width:100%;border-collapse:collapse;background:#252540;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Article</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.article_nom}</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Locataire</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.locataire_nom} — ${body.locataire_email}</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Période</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${fDate(body.date_debut)} → ${fDate(body.date_fin)} (${body.nb_jours} jour(s))</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Montant total</td><td style="padding:8px 12px;color:#f59e0b;font-size:13px;font-weight:bold;border-bottom:1px solid #3a3a5c;">${fMontant(body.montant_total)}</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Paiement</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.moyen_paiement}</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Remise</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.mode_remise === 'livraison' ? 'Livraison' : 'Retrait sur place'}</td></tr>
            <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;">Caution</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;">${fMontant(body.caution_montant)} — ${cautionLabel[body.caution_type] || body.caution_type}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${BASE_URL}/admin/location/${reservation.id}" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Voir la réservation →
            </a>
          </div>
        </div>
      `,
    }).catch(console.error)

    // Email de confirmation au client
    resend.emails.send({
      from:    FROM,
      to:      body.locataire_email,
      subject: `Votre demande de location — ${body.article_nom}`,
      html: `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
            <div style="font-size:11px;color:#7070a0;margin-top:4px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
          </div>
          <h2 style="color:#f59e0b;margin:0 0 16px;">Demande de location reçue !</h2>
          <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${body.locataire_nom},</p>
          <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
            Votre demande de location a bien été reçue. Nous vous contacterons rapidement pour confirmer votre réservation.
          </p>
          <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="color:#a0a0c0;font-size:12px;margin:0 0 12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Récapitulatif</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Article</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.article_nom}</td></tr>
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Période</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${fDate(body.date_debut)} → ${fDate(body.date_fin)}</td></tr>
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Durée</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.nb_jours} jour(s)</td></tr>
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Montant total</td><td style="padding:6px 0;color:#f59e0b;font-size:13px;font-weight:bold;text-align:right;">${fMontant(body.montant_total)}</td></tr>
              ${body.est_acompte ? `<tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Acompte (50%)</td><td style="padding:6px 0;color:#fbbf24;font-size:13px;text-align:right;">${fMontant(body.montant_acompte)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Caution</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${fMontant(body.caution_montant)}</td></tr>
              <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Mode de remise</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne'}</td></tr>
            </table>
          </div>
          ${body.moyen_paiement === 'virement' ? `
            <div style="background:#2a2010;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0 0 6px;">Paiement par virement</p>
              <p style="color:#d0b060;font-size:13px;margin:0;">
                Vous recevrez les coordonnées bancaires dans un second email après validation de votre demande.
              </p>
            </div>
          ` : ''}
          <p style="color:#a0a0c0;font-size:13px;line-height:1.6;">
            En cas de question, contactez-nous à
            <a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;text-decoration:none;">${ADMIN_EMAIL}</a>
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${BASE_URL}/location" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Voir le catalogue
            </a>
          </div>
          <p style="color:#505080;font-size:12px;text-align:center;margin-top:24px;">
            Vérifiez votre dossier Spam si vous ne recevez pas de réponse.
          </p>
        </div>
      `,
    }).catch(console.error)

    return NextResponse.json(reservation)
  } catch (e: unknown) {
    console.error('Erreur réservation location:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
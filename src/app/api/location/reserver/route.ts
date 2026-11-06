import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { generateContratLocationPDF } from '@/lib/location-pdf'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = 'Lieu Secret <noreply@lieusecret-courspiano.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'
const BASE_URL    = 'https://www.lieusecret-courspiano.fr'

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fMontant(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function genContratHTML(body: Record<string, unknown>, article: { nom: string; accessoires_inclus?: string }) {
  const cautionLabel: Record<string, string> = {
    cheque: 'Chèque non encaissé', virement: 'Virement bancaire',
    especes: 'Espèces', stripe_hold: 'Empreinte carte (Stripe)',
  }
  const paiementLabel: Record<string, string> = {
    stripe: 'Carte bancaire (Stripe)', paypal: 'PayPal', virement: 'Virement bancaire',
  }
  const now = new Date()
  const dateSignature = now.toLocaleDateString('fr-FR')
  const heureSignature = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; font-size: 12px; line-height: 1.6; }
  .page { max-width: 700px; margin: 0 auto; padding: 40px 48px; }
  .header { text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 28px; }
  .logo { font-size: 20px; color: #f59e0b; letter-spacing: 4px; font-weight: bold; }
  .logo-sub { font-size: 10px; color: #888; letter-spacing: 2px; margin-top: 4px; }
  h1 { font-size: 15px; margin: 14px 0 4px; color: #1a1a1a; }
  .subtitle { font-size: 10px; color: #888; }
  h2 { font-size: 12px; color: #c47f00; border-bottom: 1px solid #eee; padding-bottom: 4px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 1px; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  table.info td { padding: 3px 6px; font-size: 11px; }
  table.info td:first-child { color: #666; width: 180px; }
  p.clause { font-size: 11px; color: #333; margin-bottom: 10px; }
  .signature-block { border-top: 2px solid #f59e0b; padding-top: 20px; margin-top: 28px; }
  table.sig { width: 100%; border-collapse: collapse; }
  table.sig td { border: 1px solid #ccc; padding: 12px; width: 50%; vertical-align: top; font-size: 11px; }
  .sig-label { font-weight: bold; margin-bottom: 4px; }
  .sig-sub { color: #888; font-size: 10px; }
  .legal-note { font-size: 10px; color: #999; margin-top: 12px; }
  .amount { color: #c47f00; font-weight: bold; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">LIEU SECRET</div>
    <div class="logo-sub">ÉCOLE DE PIANO EN LIGNE</div>
    <h1>CONTRAT DE LOCATION DE MATÉRIEL MUSICAL</h1>
    <div class="subtitle">Signé électroniquement le ${dateSignature} à ${heureSignature} par ${body.signature_nom}</div>
  </div>

  <h2>1. Identification des parties</h2>
  <table class="info">
    <tr><td>Loueur</td><td>Claudine Yombo — EI (SIRET 98246654200015)</td></tr>
    <tr><td>Adresse du loueur</td><td>106F rue de la Richelandière — 42100 Saint-Étienne</td></tr>
    <tr><td>Locataire</td><td>${body.locataire_nom}</td></tr>
    <tr><td>Email</td><td>${body.locataire_email}</td></tr>
    ${body.locataire_telephone ? `<tr><td>Téléphone</td><td>${body.locataire_telephone}</td></tr>` : ''}
    ${body.locataire_adresse ? `<tr><td>Adresse</td><td>${body.locataire_adresse}, ${body.locataire_ville || ''}</td></tr>` : ''}
  </table>

  <h2>2. Matériel loué</h2>
  <table class="info">
    <tr><td>Matériel</td><td>${article.nom}</td></tr>
    ${article.accessoires_inclus ? `<tr><td>Accessoires remis</td><td>${article.accessoires_inclus}</td></tr>` : ''}
    <tr><td>Date de remise</td><td>${fDate(body.date_debut as string)}</td></tr>
    <tr><td>Date de retour prévue</td><td>${fDate(body.date_fin as string)}</td></tr>
    <tr><td>Durée</td><td>${body.nb_jours} jour(s)</td></tr>
    <tr><td>Mode de remise</td><td>${body.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne'}</td></tr>
  </table>

  <h2>3. Conditions financières</h2>
  <table class="info">
    <tr><td>Montant de la location</td><td>${fMontant(body.montant_location as number)}</td></tr>
    ${(body.frais_livraison as number) > 0 ? `<tr><td>Frais de livraison</td><td>${fMontant(body.frais_livraison as number)}</td></tr>` : ''}
    <tr><td>Montant total</td><td class="amount">${fMontant(body.montant_total as number)}</td></tr>
    ${body.est_acompte ? `<tr><td>Acompte (50%)</td><td>${fMontant(body.montant_acompte as number)}</td></tr>` : ''}
    <tr><td>Mode de paiement</td><td>${paiementLabel[body.moyen_paiement as string] || body.moyen_paiement}</td></tr>
  </table>

  <h2>4. Caution</h2>
  <table class="info">
    <tr><td>Montant</td><td>${fMontant(body.caution_montant as number)}</td></tr>
    <tr><td>Type</td><td>${cautionLabel[body.caution_type as string] || body.caution_type}</td></tr>
  </table>
  <p class="clause">La caution peut être retenue totalement ou partiellement en cas de dommage, perte, vol ou non-restitution. Elle est restituée dans les 5 jours ouvrés après retour du matériel en bon état. Si le préjudice dépasse la caution, le locataire s'engage à indemniser intégralement le loueur.</p>

  <h2>5. Obligations du locataire</h2>
  <p class="clause">Le locataire est responsable du matériel dès sa remise jusqu'à sa restitution. Il s'interdit de le prêter, sous-louer, démonter ou modifier. Il doit protéger le matériel contre les chocs, liquides, humidité et mauvais usage.</p>

  <h2>6. Vol, perte et détérioration</h2>
  <p class="clause">En cas de vol, perte ou détérioration, le locataire prend en charge le coût réel de réparation ou de remplacement. En cas de vol, un dépôt de plainte doit être transmis sous 48 heures.</p>

  <h2>7. Restitution et retard</h2>
  <p class="clause">Pénalité de retard : 10 € par jour commencé. Au-delà de 10 jours, une mise en demeure puis toute procédure judiciaire utile pourra être engagée.</p>

  <h2>8. Données personnelles</h2>
  <p class="clause">Le locataire autorise la conservation des documents d'identification nécessaires à la gestion du contrat et d'éventuels litiges.</p>

  <h2>9. Litiges</h2>
  <p class="clause">Le contrat est soumis au droit français. Les tribunaux du ressort de Saint-Étienne sont compétents sauf disposition légale contraire.</p>

  <div class="signature-block">
    <h2 style="margin-top:0;">Signatures</h2>
    <table class="sig">
      <tr>
        <td>
          <div class="sig-label">Loueur : Claudine Yombo</div>
          <div class="sig-sub">Lieu Secret — Saint-Étienne</div>
        </td>
        <td>
          <div class="sig-label">Locataire : ${body.signature_nom}</div>
          <div class="sig-sub">Signé électroniquement le ${dateSignature} à ${heureSignature}</div>
        </td>
      </tr>
    </table>
    <p class="legal-note">Ce contrat a été signé électroniquement conformément au règlement eIDAS (UE) n°910/2014. La signature par saisie du nom complet constitue une acceptation légalement valable.</p>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.article_id || !body.locataire_nom || !body.locataire_email) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (!body.date_debut || !body.date_fin) {
      return NextResponse.json({ error: 'Les dates de location sont requises.' }, { status: 400 })
    }
    if (new Date(body.date_fin) < new Date(body.date_debut)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début.' }, { status: 400 })
    }

    // Vérifier l'article
    const { data: article, error: artErr } = await supabaseAdmin
      .from('location_articles')
      .select('id, nom, disponible, stock, publie, accessoires_inclus')
      .eq('id', body.article_id)
      .single()

    if (artErr || !article) {
      return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })
    }
    if (!article.disponible || article.stock < 1) {
      return NextResponse.json({ error: 'Cet article n\'est plus disponible à la location.' }, { status: 400 })
    }

    // Récupérer IBAN depuis les paramètres
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('virement_iban, virement_nom, virement_info')
      .eq('id', 1)
      .single()

    const iban     = settings?.virement_iban || ''
    const nomBenef = settings?.virement_nom  || 'Lieu Secret'
    const infoVir  = settings?.virement_info || ''

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

    // Retourner immédiatement la réservation pour ne pas bloquer le paiement
    const response = NextResponse.json(reservation)

    // Générer le PDF et envoyer les emails en arrière-plan (non bloquant)
    ;(async () => {
      // Générer le contrat PDF avec pdfkit
      const now = new Date()
      const dateSignature = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) +
        ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

      let contratBase64: string | null = null
      const contratFilename = `contrat-location-${(body.article_nom as string).toLowerCase().replace(/\s+/g, '-')}.pdf`

      try {
        const contratBuffer = await generateContratLocationPDF({
            locataire_nom:             body.locataire_nom as string,
            locataire_email:         body.locataire_email as string,
            locataire_telephone:   (body.locataire_telephone as string) || null,
            locataire_adresse:       (body.locataire_adresse as string) || null,
            locataire_ville:         (body.locataire_ville as string) || null,
            article_nom:               body.article_nom as string,
            accessoires_inclus:      article.accessoires_inclus || null,
            date_debut:                  body.date_debut as string,
            date_fin:                    body.date_fin as string,
            nb_jours:                    (body.nb_jours as number) || 0,
            mode_remise:               (body.mode_remise as string) || 'retrait',
            montant_location:        body.montant_location as number,
            frais_livraison:         (body.frais_livraison as number) || 0,
            montant_total:             body.montant_total as number,
            est_acompte:               (body.est_acompte as boolean) || false,
            montant_acompte:         (body.montant_acompte as number) || null,
            moyen_paiement:            (body.moyen_paiement as string) || 'virement',
            caution_montant:         (body.caution_montant as number) || 0,
            caution_type:              (body.caution_type as string) || 'cheque',
            signature_nom:             (body.signature_nom as string) || (body.locataire_nom as string),
            date_signature:            dateSignature,
        })
        contratBase64 = contratBuffer.toString('base64')
        console.log('✅ Contrat PDF généré:', contratBuffer.length, 'bytes')

        // Upload sur Cloudinary
        try {
            const { cloudinary } = await import('@/lib/cloudinary')
            const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                  { folder: `location-contrats/${reservation.id}`, resource_type: 'raw', public_id: `contrat-${reservation.id}` },
                  (error, result) => { if (error || !result) reject(error); else resolve(result as { secure_url: string }) }
              ).end(contratBuffer)
            })
            await supabaseAdmin
              .from('location_reservations')
              .update({ contrat_genere: true, contrat_url: uploadResult.secure_url })
              .eq('id', reservation.id)
            console.log('✅ Contrat uploadé sur Cloudinary')
        } catch (uploadErr) {
            console.error('⚠️ Upload Cloudinary échoué (non bloquant):', uploadErr)
        }
      } catch (pdfErr) {
        console.error('❌ Erreur génération PDF:', pdfErr)
        // Fallback HTML
        try {
            const htmlContrat = genContratHTML(body, article)
            contratBase64 = Buffer.from(htmlContrat).toString('base64')
            console.log('✅ Contrat HTML généré en fallback')
        } catch (htmlErr) {
            console.error('❌ Erreur génération HTML:', htmlErr)
        }
      }

            const cautionLabel: Record<string, string> = {
        cheque: 'Chèque remis à la livraison', virement: 'Virement bancaire',
        especes: 'Espèces', stripe_hold: 'Empreinte carte (Stripe)',
      }

      // Email client
      const clientHtml = `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:22px;color:#f59e0b;letter-spacing:4px;">LIEU SECRET</div>
              <div style="font-size:11px;color:#7070a0;margin-top:4px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>
            </div>
            <h2 style="color:#f59e0b;margin:0 0 16px;">Demande de location reçue !</h2>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">Bonjour ${body.locataire_nom},</p>
            <p style="color:#d0d0e8;font-size:14px;line-height:1.7;">
              Votre demande de location a bien été reçue. Votre contrat de location signé est joint à cet email en pièce jointe.
            </p>
            <div style="background:#252540;border:1px solid #3a3a5c;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#a0a0c0;font-size:12px;margin:0 0 12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Récapitulatif</p>
              <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Article</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.article_nom}</td></tr>
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Période</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${fDate(body.date_debut)} → ${fDate(body.date_fin)}</td></tr>
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Durée</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.nb_jours} jour(s)</td></tr>
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Montant total</td><td style="padding:6px 0;color:#f59e0b;font-size:13px;font-weight:bold;text-align:right;">${fMontant(body.montant_total)}</td></tr>
                  ${body.est_acompte ? `<tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Acompte (50%)</td><td style="padding:6px 0;color:#fbbf24;font-size:13px;text-align:right;">${fMontant(body.montant_acompte)}</td></tr>` : ''}
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Caution</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${fMontant(body.caution_montant)} (${cautionLabel[body.caution_type] || body.caution_type})</td></tr>
                  <tr><td style="padding:6px 0;color:#a0a0c0;font-size:13px;">Mode de remise</td><td style="padding:6px 0;color:#f0f0f0;font-size:13px;text-align:right;">${body.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne'}</td></tr>
              </table>
            </div>
            ${body.moyen_paiement === 'virement' ? `
              <div style="background:#2a2010;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0 0 12px;">Coordonnées bancaires pour le virement</p>
                  ${iban ? `<div style="margin-bottom:8px;"><span style="color:#a0a0c0;font-size:11px;display:block;">IBAN</span><span style="color:#f0f0f0;font-size:14px;font-family:monospace;">${iban}</span></div>` : ''}
                  <div style="margin-bottom:8px;"><span style="color:#a0a0c0;font-size:11px;display:block;">Bénéficiaire</span><span style="color:#f0f0f0;font-size:14px;">${nomBenef}</span></div>
                  <div style="margin-bottom:8px;"><span style="color:#a0a0c0;font-size:11px;display:block;">Montant à virer</span><span style="color:#f59e0b;font-size:16px;font-weight:bold;">${fMontant(body.est_acompte ? body.montant_acompte : body.montant_total)}</span></div>
                  <div><span style="color:#a0a0c0;font-size:11px;display:block;">Référence à indiquer</span><span style="color:#f0f0f0;font-size:13px;">Location ${body.article_nom} — ${body.locataire_nom}</span></div>
                  ${infoVir ? `<p style="margin:10px 0 0;color:#a0a0c0;font-size:11px;">${infoVir}</p>` : ''}
              </div>
            ` : ''}
            <div style="background:#1a2a1a;border:1px solid #22c55e;border-radius:8px;padding:14px;margin:16px 0;">
              <p style="color:#22c55e;font-size:13px;font-weight:bold;margin:0 0 4px;">📄 Contrat joint à cet email</p>
              <p style="color:#a0d0a0;font-size:12px;margin:0;">Votre contrat de location signé électroniquement est joint en pièce jointe. Conservez-le précieusement.</p>
            </div>
            <p style="color:#a0a0c0;font-size:13px;line-height:1.6;">
              Nous vous contacterons rapidement pour confirmer votre réservation.<br/>
              En cas de question : <a href="mailto:${ADMIN_EMAIL}" style="color:#f59e0b;text-decoration:none;">${ADMIN_EMAIL}</a>
            </p>
            <p style="color:#505080;font-size:12px;text-align:center;margin-top:24px;">Vérifiez votre dossier Spam si vous ne recevez pas de réponse.</p>
        </div>
      `

      // Email admin
      const adminHtml = `
        <div style="font-family:Arial;background:#1a1a2e;padding:32px;color:#f0f0f0;max-width:600px;margin:0 auto;border-radius:12px;">
            <h2 style="color:#f59e0b;margin:0 0 16px;">[Location] Nouvelle demande — ${body.article_nom}</h2>
            <table style="width:100%;border-collapse:collapse;background:#252540;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Article</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.article_nom}</td></tr>
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Locataire</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.locataire_nom} — ${body.locataire_email}</td></tr>
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Période</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${fDate(body.date_debut)} → ${fDate(body.date_fin)} (${body.nb_jours} j.)</td></tr>
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Montant</td><td style="padding:8px 12px;color:#f59e0b;font-size:13px;font-weight:bold;border-bottom:1px solid #3a3a5c;">${fMontant(body.montant_total)}</td></tr>
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;border-bottom:1px solid #3a3a5c;">Paiement</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;border-bottom:1px solid #3a3a5c;">${body.moyen_paiement}</td></tr>
              <tr><td style="padding:8px 12px;color:#a0a0c0;font-size:13px;">Caution</td><td style="padding:8px 12px;color:#f0f0f0;font-size:13px;">${fMontant(body.caution_montant)} — ${cautionLabel[body.caution_type] || body.caution_type}</td></tr>
            </table>
            <div style="text-align:center;margin:24px 0;">
              <a href="${BASE_URL}/admin/location/${reservation.id}" style="background:#f59e0b;color:#1a1a2e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir la réservation →</a>
            </div>
        </div>
      `

      // Envoyer les emails
      await Promise.all([
        resend.emails.send({
            from: FROM,
            to:   body.locataire_email,
            subject: `Votre contrat de location — ${body.article_nom}`,
            html: clientHtml,
            attachments: contratBase64 ? [{
              filename: contratFilename,
              content:  contratBase64,
            }] : undefined,
        }),
        resend.emails.send({
            from: FROM,
            to:   ADMIN_EMAIL,
            subject: `[Location] Nouvelle demande — ${body.article_nom}`,
            html: adminHtml,
            attachments: contratBase64 ? [{
              filename: contratFilename,
              content:  contratBase64,
            }] : undefined,
        }),
      ]).catch(console.error)

    })().catch(e => console.error('Erreur arrière-plan PDF/email:', e))

    return response

  } catch (e: unknown) {
    console.error('Erreur réservation location:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
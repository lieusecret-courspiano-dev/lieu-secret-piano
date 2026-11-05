import PDFDocument from 'pdfkit'

interface ContratParams {
  locataire_nom: string
  locataire_email: string
  locataire_telephone?: string | null
  locataire_adresse?: string | null
  locataire_ville?: string | null
  article_nom: string
  accessoires_inclus?: string | null
  date_debut: string
  date_fin: string
  nb_jours: number
  mode_remise: string
  montant_location: number
  frais_livraison: number
  montant_total: number
  est_acompte: boolean
  montant_acompte?: number | null
  moyen_paiement: string
  caution_montant: number
  caution_type: string
  signature_nom: string
  date_signature: string
}

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fMontant(n: number) {
  return n.toFixed(2).replace('.', ',') + ' \u20ac'
}

const PAIEMENT_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire (Stripe)',
  paypal: 'PayPal',
  virement: 'Virement bancaire',
}
const CAUTION_LABELS: Record<string, string> = {
  cheque: 'Chèque non encaissé',
  virement: 'Virement bancaire',
  especes: 'Espèces',
  stripe_hold: 'Empreinte carte (Stripe)',
}

export async function generateContratLocationPDF(params: ContratParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const GOLD   = '#c47f00'
    const BLACK  = '#1a1a1a'
    const GRAY   = '#555555'
    const LGRAY  = '#888888'
    const WHITE  = '#ffffff'
    const pageW  = doc.page.width
    const margin = 50

    // ── En-tête ──────────────────────────────────────────────
    doc.rect(0, 0, pageW, 90).fill('#1a1a2e')

    doc.fontSize(20).fillColor('#f59e0b')
      .text('LIEU SECRET', margin, 22, { characterSpacing: 5 })

    doc.fontSize(9).fillColor('#a0a0c0')
      .text('ÉCOLE DE PIANO EN LIGNE', margin, 46, { characterSpacing: 2 })

    doc.fontSize(13).fillColor(WHITE)
      .text('CONTRAT DE LOCATION DE MATÉRIEL MUSICAL', margin, 62)

    doc.fontSize(8).fillColor('#7070a0')
      .text(`Signé électroniquement le ${params.date_signature} par ${params.signature_nom}`,
        margin, 78)

    // ── Ligne dorée ───────────────────────────────────────────
    doc.moveTo(margin, 100).lineTo(pageW - margin, 100)
      .lineWidth(1.5).stroke(GOLD)

    let y = 115

    // ── Fonction utilitaire : section ─────────────────────────
    function section(title: string) {
      doc.rect(margin, y, pageW - margin * 2, 18).fill('#f5f0e8')
      doc.fontSize(9).fillColor(GOLD)
        .text(title.toUpperCase(), margin + 6, y + 5, { characterSpacing: 1 })
      y += 24
    }

    // ── Fonction utilitaire : ligne de tableau ─────────────────
    function row(label: string, value: string, bold = false) {
      doc.fontSize(9).fillColor(LGRAY).text(label, margin + 4, y, { width: 160 })
      doc.fontSize(9).fillColor(bold ? GOLD : BLACK)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, margin + 170, y, { width: pageW - margin * 2 - 170 })
      doc.font('Helvetica')
      y += 16
    }

    function separator() {
      doc.moveTo(margin, y).lineTo(pageW - margin, y)
        .lineWidth(0.3).stroke('#dddddd')
      y += 6
    }

    // ── 1. Identification des parties ─────────────────────────
    section('1. Identification des parties')
    row('Loueur', 'Claudine Yombo — EI (SIRET 98246654200015)')
    separator()
    row('Adresse du loueur', '106F rue de la Richelandière — 42100 Saint-Étienne')
    separator()
    row('Locataire', params.locataire_nom)
    separator()
    row('Email', params.locataire_email)
    if (params.locataire_telephone) { separator(); row('Téléphone', params.locataire_telephone) }
    if (params.locataire_adresse) {
      separator()
      row('Adresse', `${params.locataire_adresse}${params.locataire_ville ? ', ' + params.locataire_ville : ''}`)
    }
    y += 8

    // ── 2. Matériel loué ──────────────────────────────────────
    section('2. Matériel loué')
    row('Matériel', params.article_nom)
    if (params.accessoires_inclus) { separator(); row('Accessoires remis', params.accessoires_inclus) }
    separator()
    row('Date de remise', fDate(params.date_debut))
    separator()
    row('Date de retour prévue', fDate(params.date_fin))
    separator()
    row('Durée', `${params.nb_jours} jour(s)`)
    separator()
    row('Mode de remise', params.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne')
    y += 8

    // ── 3. Conditions financières ─────────────────────────────
    section('3. Conditions financières')
    row('Montant de la location', fMontant(params.montant_location))
    if (params.frais_livraison > 0) { separator(); row('Frais de livraison', fMontant(params.frais_livraison)) }
    separator()
    row('Montant total', fMontant(params.montant_total), true)
    if (params.est_acompte && params.montant_acompte) {
      separator()
      row('Acompte à la réservation (50%)', fMontant(params.montant_acompte))
      separator()
      row('Solde à la remise', fMontant(params.montant_total - params.montant_acompte))
    }
    separator()
    row('Mode de paiement', PAIEMENT_LABELS[params.moyen_paiement] || params.moyen_paiement)
    y += 8

    // ── 4. Caution ────────────────────────────────────────────
    section('4. Caution')
    row('Montant', fMontant(params.caution_montant))
    separator()
    row('Type', CAUTION_LABELS[params.caution_type] || params.caution_type)
    y += 4
    doc.fontSize(8).fillColor(GRAY)
      .text('La caution peut être retenue totalement ou partiellement en cas de dommage, perte, vol ou non-restitution. Elle est restituée dans les 5 jours ouvrés après retour du matériel en bon état. Si le préjudice dépasse la caution, le locataire s\'engage à indemniser intégralement le loueur.',
        margin, y, { width: pageW - margin * 2 })
    y += 30

    // ── 5–9. Clauses ──────────────────────────────────────────
    const clauses = [
      {
        title: '5. Obligations du locataire',
        text: 'Le locataire est responsable du matériel dès sa remise jusqu\'à sa restitution. Il s\'interdit de le prêter, sous-louer, démonter ou modifier. Il doit protéger le matériel contre les chocs, liquides, humidité et mauvais usage.',
      },
      {
        title: '6. Vol, perte et détérioration',
        text: 'En cas de vol, perte ou détérioration, le locataire prend en charge le coût réel de réparation ou de remplacement. En cas de vol, un dépôt de plainte doit être transmis sous 48 heures.',
      },
      {
        title: '7. Restitution et retard',
        text: 'Pénalité de retard : 10 € par jour commencé. Au-delà de 10 jours, une mise en demeure puis toute procédure judiciaire utile pourra être engagée.',
      },
      {
        title: '8. Données personnelles',
        text: 'Le locataire autorise la conservation des documents d\'identification nécessaires à la gestion du contrat et d\'éventuels litiges.',
      },
      {
        title: '9. Litiges',
        text: 'Le contrat est soumis au droit français. Les tribunaux du ressort de Saint-Étienne sont compétents sauf disposition légale contraire.',
      },
    ]

    for (const clause of clauses) {
      // Nouvelle page si nécessaire
      if (y > 680) { doc.addPage(); y = 50 }
      section(clause.title)
      doc.fontSize(8).fillColor(GRAY)
        .text(clause.text, margin, y, { width: pageW - margin * 2 })
      y += doc.heightOfString(clause.text, { width: pageW - margin * 2 }) + 12
    }

    // ── Signatures ────────────────────────────────────────────
    if (y > 640) { doc.addPage(); y = 50 }

    doc.moveTo(margin, y).lineTo(pageW - margin, y)
      .lineWidth(1.5).stroke(GOLD)
    y += 12

    doc.fontSize(10).fillColor(GOLD).text('SIGNATURES', margin, y, { characterSpacing: 2 })
    y += 20

    const colW = (pageW - margin * 2 - 20) / 2

    // Loueur
    doc.rect(margin, y, colW, 70).lineWidth(0.5).stroke('#cccccc')
    doc.fontSize(8).fillColor(LGRAY).text('Loueur', margin + 8, y + 8)
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('Claudine Yombo', margin + 8, y + 22)
    doc.font('Helvetica').fontSize(8).fillColor(LGRAY)
      .text('Lieu Secret — Saint-Étienne', margin + 8, y + 36)

    // Locataire
    const col2X = margin + colW + 20
    doc.rect(col2X, y, colW, 70).lineWidth(0.5).stroke('#cccccc')
    doc.fontSize(8).fillColor(LGRAY).text('Locataire', col2X + 8, y + 8)
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text(params.signature_nom, col2X + 8, y + 22)
    doc.font('Helvetica').fontSize(8).fillColor(LGRAY)
      .text(`Signé électroniquement le ${params.date_signature}`, col2X + 8, y + 36)
    doc.fontSize(7).fillColor(LGRAY)
      .text('Mention : Lu et approuvé', col2X + 8, y + 50)

    y += 85

    // Note légale
    doc.fontSize(7).fillColor(LGRAY)
      .text('Ce contrat a été signé électroniquement conformément au règlement eIDAS (UE) n°910/2014. La signature par saisie du nom complet constitue une acceptation légalement valable.',
        margin, y, { width: pageW - margin * 2 })

    doc.end()
  })
}
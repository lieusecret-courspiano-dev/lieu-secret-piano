// Génération PDF contrat de location avec pdfkit
// Utilise uniquement les polices intégrées (Helvetica) — fonctionne sur Vercel

import PDFDocument from 'pdfkit'

export interface ContratParams {
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

function fDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fMontant(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' \u20ac'
}

const CAUTION_LABELS: Record<string, string> = {
  cheque: 'Chèque non encaissé',
  virement: 'Virement bancaire',
  especes: 'Espèces',
  stripe_hold: 'Empreinte carte (Stripe)',
}

const PAIEMENT_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire (Stripe)',
  paypal: 'PayPal',
  virement: 'Virement bancaire',
}

export function generateContratLocationPDF(params: ContratParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Contrat de Location de Matériel Musical',
          Author: 'Lieu Secret',
          Subject: `Location ${params.article_nom}`,
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const W = doc.page.width - 100 // largeur utile
      const GOLD = '#c47f00'
      const DARK = '#1a1a1a'
      const GRAY = '#555555'
      const LGRAY = '#888888'

      // ── En-tête ──────────────────────────────────────────
      doc.rect(50, 40, W, 70).fill('#1a1a2e')

      doc.font('Helvetica-Bold').fontSize(18).fillColor('#f59e0b')
        .text('LIEU SECRET', 50, 55, { width: W, align: 'center', characterSpacing: 4 })

      doc.font('Helvetica').fontSize(9).fillColor('#a0a0c0')
        .text('ÉCOLE DE PIANO EN LIGNE', 50, 76, { width: W, align: 'center', characterSpacing: 2 })

      doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
        .text('CONTRAT DE LOCATION DE MATÉRIEL MUSICAL', 50, 92, { width: W, align: 'center' })

      // Ligne dorée
      doc.moveTo(50, 120).lineTo(50 + W, 120).lineWidth(1.5).stroke(GOLD)

      let y = 132

      // ── Fonctions utilitaires ─────────────────────────────
      const section = (title: string) => {
        doc.rect(50, y, W, 16).fill('#f5f0e8')
        doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD)
          .text(title.toUpperCase(), 56, y + 4, { characterSpacing: 0.8 })
        y += 22
      }

      const row = (label: string, value: string, bold = false) => {
        doc.font('Helvetica').fontSize(9).fillColor(LGRAY)
          .text(label, 56, y, { width: 160 })
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
          .fillColor(bold ? GOLD : DARK)
          .text(value, 220, y, { width: W - 170 })
        y += 15
      }

      const sep = () => {
        doc.moveTo(56, y - 2).lineTo(50 + W - 6, y - 2).lineWidth(0.3).stroke('#dddddd')
      }

      const clause = (text: string) => {
        doc.font('Helvetica').fontSize(8).fillColor(GRAY)
          .text(text, 56, y, { width: W - 12 })
        y += doc.heightOfString(text, { width: W - 12 }) + 8
      }

      const checkPage = () => {
        if (y > 700) { doc.addPage(); y = 50 }
      }

      // ── 1. Identification des parties ─────────────────────
      section('1. Identification des parties')
      row('Loueur', 'Claudine Yombo — EI (SIRET 98246654200015)')
      sep(); row('Adresse du loueur', '106F rue de la Richelandière — 42100 Saint-Étienne')
      sep(); row('Locataire', params.locataire_nom)
      sep(); row('Email', params.locataire_email)
      if (params.locataire_telephone) { sep(); row('Téléphone', params.locataire_telephone) }
      if (params.locataire_adresse) {
        sep()
        row('Adresse', `${params.locataire_adresse}${params.locataire_ville ? ', ' + params.locataire_ville : ''}`)
      }
      y += 6

      // ── 2. Matériel loué ──────────────────────────────────
      checkPage()
      section('2. Matériel loué')
      row('Matériel', params.article_nom)
      if (params.accessoires_inclus) { sep(); row('Accessoires remis', params.accessoires_inclus) }
      sep(); row('Date de remise', fDate(params.date_debut))
      sep(); row('Date de retour prévue', fDate(params.date_fin))
      sep(); row('Durée', `${params.nb_jours} jour(s)`)
      sep(); row('Mode de remise', params.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne')
      y += 6

      // ── 3. Conditions financières ─────────────────────────
      checkPage()
      section('3. Conditions financières')
      row('Montant de la location', fMontant(params.montant_location))
      if (params.frais_livraison > 0) { sep(); row('Frais de livraison', fMontant(params.frais_livraison)) }
      sep(); row('Montant total', fMontant(params.montant_total), true)
      if (params.est_acompte && params.montant_acompte) {
        sep(); row('Acompte à la réservation (50%)', fMontant(params.montant_acompte))
        sep(); row('Solde à la remise', fMontant(params.montant_total - params.montant_acompte))
      }
      sep(); row('Mode de paiement', PAIEMENT_LABELS[params.moyen_paiement] || params.moyen_paiement)
      y += 6

      // ── 4. Caution ────────────────────────────────────────
      checkPage()
      section('4. Caution')
      row('Montant', fMontant(params.caution_montant))
      sep(); row('Type', CAUTION_LABELS[params.caution_type] || params.caution_type)
      y += 4
      clause("La caution peut être retenue totalement ou partiellement en cas de dommage, perte, vol ou non-restitution. Elle est restituée dans les 5 jours ouvrés après retour du matériel en bon état. Si le préjudice dépasse la caution, le locataire s'engage à indemniser intégralement le loueur.")

      // ── 5–9. Clauses ──────────────────────────────────────
      const clauses = [
        { title: '5. Obligations du locataire', text: "Le locataire est responsable du matériel dès sa remise jusqu'à sa restitution. Il s'interdit de le prêter, sous-louer, démonter ou modifier. Il doit protéger le matériel contre les chocs, liquides, humidité et mauvais usage." },
        { title: '6. Vol, perte et détérioration', text: "En cas de vol, perte ou détérioration, le locataire prend en charge le coût réel de réparation ou de remplacement. En cas de vol, un dépôt de plainte doit être transmis sous 48 heures." },
        { title: '7. Restitution et retard', text: "Pénalité de retard : 10 € par jour commencé. Au-delà de 10 jours, une mise en demeure puis toute procédure judiciaire utile pourra être engagée." },
        { title: '8. Données personnelles', text: "Le locataire autorise la conservation des documents d'identification nécessaires à la gestion du contrat et d'éventuels litiges." },
        { title: '9. Litiges', text: "Le contrat est soumis au droit français. Les tribunaux du ressort de Saint-Étienne sont compétents sauf disposition légale contraire." },
      ]

      for (const c of clauses) {
        checkPage()
        section(c.title)
        clause(c.text)
      }

      // ── Signatures ────────────────────────────────────────
      checkPage()
      if (y > 620) { doc.addPage(); y = 50 }

      doc.moveTo(50, y).lineTo(50 + W, y).lineWidth(1.5).stroke(GOLD)
      y += 12

      doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD)
        .text('SIGNATURES', 50, y, { characterSpacing: 2 })
      y += 18

      const colW = (W - 20) / 2

      // Loueur
      doc.rect(50, y, colW, 65).lineWidth(0.5).stroke('#cccccc')
      doc.font('Helvetica').fontSize(8).fillColor(LGRAY).text('Loueur', 58, y + 8)
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text('Claudine Yombo', 58, y + 22)
      doc.font('Helvetica').fontSize(8).fillColor(LGRAY).text('Lieu Secret — Saint-Étienne', 58, y + 36)

      // Locataire
      const col2X = 50 + colW + 20
      doc.rect(col2X, y, colW, 65).lineWidth(0.5).stroke('#cccccc')
      doc.font('Helvetica').fontSize(8).fillColor(LGRAY).text('Locataire', col2X + 8, y + 8)
      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(params.signature_nom, col2X + 8, y + 22)
      doc.font('Helvetica').fontSize(8).fillColor(LGRAY)
        .text(`Signé le ${params.date_signature}`, col2X + 8, y + 36)
        .text('Mention : Lu et approuvé', col2X + 8, y + 48)

      y += 80

      doc.font('Helvetica').fontSize(7).fillColor(LGRAY)
        .text("Ce contrat a été signé électroniquement conformément au règlement eIDAS (UE) n°910/2014. La signature par saisie du nom complet constitue une acceptation légalement valable.", 50, y, { width: W })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
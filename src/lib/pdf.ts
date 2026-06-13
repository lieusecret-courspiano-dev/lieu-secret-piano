import PDFDocument from 'pdfkit'

// Générer un PDF du bon cadeau
export async function generateGiftCardPDF(params: {
  code: string
  montant: number
  acheteur_nom: string
  destinataire_nom: string
  message: string
  expires_at: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const expiresDate = new Date(params.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const createdDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

    // Fond
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e')

    // Bordure dorée
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(2).stroke('#f59e0b')

    // En-tête
    doc.rect(20, 20, doc.page.width - 40, 80).fill('#252540')

    doc.fontSize(28).fillColor('#f59e0b')
      .text('LIEU SECRET', 0, 40, { align: 'center', characterSpacing: 6 })

    doc.fontSize(10).fillColor('#a0a0c0')
      .text('ÉCOLE DE PIANO EN LIGNE', 0, 72, { align: 'center', characterSpacing: 3 })

    // Titre bon cadeau
    doc.fontSize(16).fillColor('#f0f0f0')
      .text('🎁 BON CADEAU', 0, 120, { align: 'center' })

    // Montant
    doc.rect(100, 145, doc.page.width - 200, 80)
      .fill('#252540').stroke('#f59e0b')

    doc.fontSize(48).fillColor('#f59e0b')
      .text(`${params.montant} €`, 0, 158, { align: 'center' })

    doc.fontSize(11).fillColor('#a0a0c0')
      .text('de cours de piano en ligne', 0, 210, { align: 'center' })

    // Code cadeau
    doc.rect(80, 245, doc.page.width - 160, 70)
      .dash(5, { space: 3 }).stroke('#f59e0b').undash()

    doc.fontSize(11).fillColor('#a0a0c0')
      .text('CODE À UTILISER LORS DE LA RÉSERVATION', 0, 255, { align: 'center', characterSpacing: 1 })

    doc.fontSize(28).fillColor('#f59e0b')
      .text(params.code, 0, 272, { align: 'center', characterSpacing: 8 })

    // Informations
    const infoY = 340
    const lineH = 28

    const infos = [
      ['Offert par',        params.acheteur_nom],
      ['Pour',              params.destinataire_nom],
      ['Valeur',            `${params.montant} €`],
      ["Date d'émission",   createdDate],
      ["Date d'expiration", expiresDate],
    ]

    infos.forEach(([label, value], i) => {
      const y = infoY + i * lineH
      doc.rect(50, y, doc.page.width - 100, lineH - 2).fill(i % 2 === 0 ? '#252540' : '#1e1e38')
      doc.fontSize(11).fillColor('#a0a0c0').text(label, 60, y + 8)
      doc.fontSize(11).fillColor('#f0f0f0').text(value, 250, y + 8)
    })

    // Message personnel
    if (params.message) {
      const msgY = infoY + infos.length * lineH + 20
      doc.rect(50, msgY, doc.page.width - 100, 60).fill('#252540')
      doc.rect(50, msgY, 4, 60).fill('#f59e0b')
      doc.fontSize(11).fillColor('#a0a0c0').text('Message personnel :', 62, msgY + 8)
      doc.fontSize(12).fillColor('#d0d0e8').font('Helvetica-Oblique')
        .text(`"${params.message}"`, 62, msgY + 24, { width: doc.page.width - 130 })
      doc.font('Helvetica')
    }

    // Instructions
    const instrY = 590
    doc.rect(50, instrY, doc.page.width - 100, 110).fill('#252540')
    doc.fontSize(12).fillColor('#f59e0b').text('Comment utiliser ce bon cadeau ?', 62, instrY + 10)
    doc.fontSize(10).fillColor('#a0a0c0')
      .text(`1. Rendez-vous sur lieusecret-courspiano.fr/reservation`, 62, instrY + 28)
      .text(`2. Saisissez votre code d'accès élève`, 62, instrY + 44)
      .text(`3. Choisissez un créneau disponible`, 62, instrY + 60)
      .text(`4. Dans la modale, saisissez le code cadeau : ${params.code}`, 62, instrY + 76)
      .text(`5. Le montant sera déduit automatiquement`, 62, instrY + 92)

    // Footer
    doc.fontSize(9).fillColor('#505080')
      .text('Lieu Secret — École de Piano en Ligne — Ce bon cadeau est valable 1 an.', 0, 720, { align: 'center' })

    doc.end()
  })
}

// Générer un PDF du récapitulatif d'inscription
export async function generateInscriptionPDF(params: {
  studentName: string; email: string; telephone: string; adresse: string
  ville: string; code_postal: string; pays: string; niveau: string
  annees_pratique: string; rythme: string; frequence: string
  objectifs: string; message: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

    // Fond blanc
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff')

    // En-tête dorée
    doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e')
    doc.fontSize(24).fillColor('#f59e0b')
      .text('LIEU SECRET', 50, 20, { characterSpacing: 4 })
    doc.fontSize(10).fillColor('#a0a0c0')
      .text('ÉCOLE DE PIANO EN LIGNE', 50, 50, { characterSpacing: 2 })
    doc.fontSize(10).fillColor('#a0a0c0')
      .text(`Demande d'inscription du ${date}`, 0, 55, { align: 'right' })

    // Titre
    doc.rect(0, 80, doc.page.width, 4).fill('#f59e0b')
    doc.fontSize(18).fillColor('#1a1a1a')
      .text("Récapitulatif de la demande d'inscription", 50, 100)
    doc.rect(50, 122, 60, 3).fill('#f59e0b')

    // Champs
    const fields = [
      ['Nom complet',          params.studentName],
      ['Email',                params.email],
      ['Téléphone',            params.telephone],
      ['Adresse',              [params.adresse, params.code_postal, params.ville, params.pays].filter(Boolean).join(', ')],
      ['Niveau actuel',        params.niveau],
      ['Années de pratique',   params.annees_pratique],
      ['Disponibilités',       params.rythme],
      ['Fréquence souhaitée',  params.frequence],
      ['Objectifs',            params.objectifs],
      ['Message',              params.message],
    ].filter(([, v]) => v && v.trim())

    let y = 140
    fields.forEach(([label, value], i) => {
      const bgColor = i % 2 === 0 ? '#f8f8f8' : '#ffffff'
      doc.rect(50, y, doc.page.width - 100, 28).fill(bgColor)
      doc.rect(50, y, 3, 28).fill('#f59e0b')
      doc.fontSize(10).fillColor('#777777').text(label, 60, y + 9)
      doc.fontSize(11).fillColor('#1a1a1a').text(value, 220, y + 9, { width: doc.page.width - 280 })
      y += 30
    })

    // Footer
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill('#1a1a2e')
    doc.fontSize(9).fillColor('#a0a0c0')
      .text('Lieu Secret — École de Piano en Ligne', 0, doc.page.height - 30, { align: 'center' })

    doc.end()
  })
}
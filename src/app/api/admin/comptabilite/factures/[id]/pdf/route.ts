import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import PDFDocument from 'pdfkit'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' \u20ac' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Récupérer la facture et ses lignes
  const { data: facture, error } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('*, comptabilite_factures_lignes(*)')
    .eq('id', params.id)
    .single()

  if (error || !facture) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })

  // Récupérer les paramètres comptables
  const { data: p } = await supabaseAdmin
    .from('comptabilite_parametres')
    .select('*')
    .eq('id', 1)
    .single()

  const lignes = (facture.comptabilite_factures_lignes || [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

  // Générer le PDF
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W    = doc.page.width - 100
    const GOLD = '#c47f00'
    const DARK = '#1a1a1a'
    const GRAY = '#555555'
    const LGRAY = '#888888'

    // ── En-tête ──────────────────────────────────────────────
    doc.rect(50, 40, W, 80).fill('#1a1a2e')

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#f59e0b')
      .text(p?.nom_entreprise || 'LIEU SECRET', 65, 55, { characterSpacing: 3 })

    doc.font('Helvetica').fontSize(9).fillColor('#a0a0c0')
      .text(p?.nom_proprietaire || 'Claudine Yombo', 65, 78)
      .text(`SIRET : ${p?.siret || '98246654200015'}`, 65, 90)
      .text(`${p?.adresse || '106F rue de la Richelandière'} — ${p?.code_postal || '42100'} ${p?.ville || 'Saint-Étienne'}`, 65, 102)

    // Numéro facture à droite
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#f59e0b')
      .text('FACTURE', 350, 55, { width: W - 300, align: 'right' })
    doc.font('Helvetica').fontSize(10).fillColor('#ffffff')
      .text(facture.numero, 350, 73, { width: W - 300, align: 'right' })
    doc.font('Helvetica').fontSize(9).fillColor('#a0a0c0')
      .text(`Date : ${fDate(facture.date_facture)}`, 350, 90, { width: W - 300, align: 'right' })

    // Ligne dorée
    doc.moveTo(50, 130).lineTo(50 + W, 130).lineWidth(1.5).stroke(GOLD)

    let y = 145

    // ── Infos émetteur / client ──────────────────────────────
    // Émetteur
    doc.font('Helvetica-Bold').fontSize(8).fillColor(LGRAY)
      .text('ÉMETTEUR', 50, y, { characterSpacing: 1 })
    y += 14
    doc.font('Helvetica').fontSize(9).fillColor(DARK)
      .text(p?.nom_proprietaire || 'Claudine Yombo', 50, y)
    y += 13
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
      .text(`${p?.adresse || '106F rue de la Richelandière'}`, 50, y)
    y += 11
    doc.text(`${p?.code_postal || '42100'} ${p?.ville || 'Saint-Étienne'}`, 50, y)
    y += 11
    if (p?.telephone) doc.text(`Tél : ${p.telephone}`, 50, y), y += 11
    doc.text(p?.email || 'lieusecret-courspiano@outlook.fr', 50, y)

    // Client
    const clientX = 300
    let clientY = 145
    doc.font('Helvetica-Bold').fontSize(8).fillColor(LGRAY)
      .text('FACTURÉ À', clientX, clientY, { characterSpacing: 1 })
    clientY += 14
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
      .text(facture.client_nom, clientX, clientY)
    clientY += 14
    if (facture.client_email) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(facture.client_email, clientX, clientY)
      clientY += 11
    }
    if (facture.client_telephone) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(facture.client_telephone, clientX, clientY)
      clientY += 11
    }
    if (facture.client_adresse) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(facture.client_adresse, clientX, clientY)
    }

    y = Math.max(y, clientY) + 25

    // ── Tableau des lignes ───────────────────────────────────
    // En-tête tableau
    doc.rect(50, y, W, 20).fill('#f5f0e8')
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD)
    doc.text('DÉSIGNATION', 56, y + 6)
    doc.text('QTÉ', 340, y + 6, { width: 40, align: 'right' })
    doc.text('P.U. HT', 385, y + 6, { width: 60, align: 'right' })
    doc.text('TOTAL HT', 450, y + 6, { width: 60, align: 'right' })
    y += 24

    // Lignes
    for (const ligne of lignes) {
      if (y > 680) { doc.addPage(); y = 50 }

      doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
        .text(ligne.designation, 56, y, { width: 275 })

      const lineH = doc.heightOfString(ligne.designation, { width: 275 })

      if (ligne.description) {
        doc.font('Helvetica').fontSize(7.5).fillColor(GRAY)
          .text(ligne.description, 56, y + lineH, { width: 275 })
      }

      doc.font('Helvetica').fontSize(9).fillColor(DARK)
        .text(`${ligne.quantite} ${ligne.unite}`, 340, y, { width: 40, align: 'right' })
        .text(fmt(ligne.prix_unitaire), 385, y, { width: 60, align: 'right' })
        .text(fmt(ligne.montant_ht), 450, y, { width: 60, align: 'right' })

      const totalH = ligne.description
        ? lineH + doc.heightOfString(ligne.description, { width: 275 }) + 4
        : lineH + 4

      y += Math.max(totalH, 20)

      doc.moveTo(50, y - 2).lineTo(50 + W, y - 2).lineWidth(0.3).stroke('#dddddd')
    }

    y += 10

    // ── Totaux ───────────────────────────────────────────────
    const totauxX = 380
    const totauxW = W - 330

    const totauxRows = [
      { label: 'Total HT', value: fmt(facture.montant_ht) },
      ...(facture.taux_tva > 0 ? [
        { label: `TVA (${facture.taux_tva}%)`, value: fmt(facture.montant_tva) },
      ] : []),
    ]

    for (const row of totauxRows) {
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
        .text(row.label, totauxX, y, { width: totauxW / 2 })
        .text(row.value, totauxX + totauxW / 2, y, { width: totauxW / 2, align: 'right' })
      y += 16
    }

    // Total TTC
    doc.rect(totauxX - 5, y - 3, totauxW + 10, 24).fill('#1a1a2e')
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#f59e0b')
      .text('TOTAL TTC', totauxX, y + 4, { width: totauxW / 2 })
      .text(fmt(facture.montant_ttc), totauxX + totauxW / 2, y + 4, { width: totauxW / 2, align: 'right' })
    y += 35

    // ── Paiement ─────────────────────────────────────────────
    if (facture.moyen_paiement) {
      const paiementLabels: Record<string, string> = {
        stripe: 'Carte bancaire (Stripe)', paypal: 'PayPal',
        virement: 'Virement bancaire', especes: 'Espèces', cheque: 'Chèque',
      }
      doc.font('Helvetica').fontSize(8).fillColor(LGRAY)
        .text(`Mode de règlement : ${paiementLabels[facture.moyen_paiement] || facture.moyen_paiement}`, 50, y)
      y += 12
    }

    if (facture.notes) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(facture.notes, 50, y, { width: W })
      y += doc.heightOfString(facture.notes, { width: W }) + 8
    }

    // ── Pied de page ─────────────────────────────────────────
    const footerY = doc.page.height - 60
    doc.moveTo(50, footerY).lineTo(50 + W, footerY).lineWidth(0.5).stroke(GOLD)

    doc.font('Helvetica').fontSize(7.5).fillColor(LGRAY)
      .text(p?.mention_tva || 'TVA non applicable — Art. 293 B du CGI', 50, footerY + 8, { width: W, align: 'center' })

    if (p?.iban) {
      doc.text(`IBAN : ${p.iban}${p.bic ? ' — BIC : ' + p.bic : ''}`, 50, footerY + 20, { width: W, align: 'center' })
    }

    doc.text(
      `${p?.nom_proprietaire || 'Claudine Yombo'} — SIRET ${p?.siret || '98246654200015'} — ${p?.email || 'lieusecret-courspiano@outlook.fr'}`,
      50, footerY + 32, { width: W, align: 'center' }
    )

    doc.end()
  })

  // Sauvegarder l'URL du PDF si pas encore fait
  if (!facture.pdf_url) {
    try {
      const { cloudinary } = await import('@/lib/cloudinary')
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'lieu-secret/factures', resource_type: 'raw', public_id: `facture-${facture.numero}`, format: 'pdf' },
          (error, result) => { if (error || !result) reject(error); else resolve(result as { secure_url: string }) }
        ).end(pdfBuffer)
      })
      await supabaseAdmin
        .from('comptabilite_factures')
        .update({ pdf_url: uploadResult.secure_url })
        .eq('id', params.id)
    } catch (e) {
      console.error('Upload PDF facture Cloudinary:', e)
    }
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${facture.numero}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  })
}
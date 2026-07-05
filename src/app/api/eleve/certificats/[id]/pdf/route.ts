import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data: cert, error } = await supabaseAdmin
    .from('certificats')
    .select('*, eleve:eleves(prenom, nom, email)')
    .eq('id', params.id)
    .eq('eleve_id', eleve.id)
    .single()

  if (error || !cert) return NextResponse.json({ error: 'Certificat non trouvé' }, { status: 404 })

  const eleve_data = cert.eleve as any
  const nom_complet = `${eleve_data?.prenom || ''} ${eleve_data?.nom || ''}`.trim()
  const date_fr = new Date(cert.date_obtention).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const numero = cert.numero || 'LS-2025-001'
  const nom_cert = cert.nom_certificat || 'Formation Piano'

  try {
    const PDFDocument = (await import('pdfkit')).default
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0,
      info: { Title: `Certificat — ${nom_complet}`, Author: 'Lieu Secret', Subject: nom_cert }
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    await new Promise<void>((resolve) => {
      doc.on('end', resolve)
      const W = 841.89; const H = 595.28
      const sideW = 72; const contentX = sideW + 40; const contentW = W - sideW - 80

      // Fond crème
      doc.rect(0, 0, W, H).fill('#faf8f4')
      // Bande latérale
      doc.rect(0, 0, sideW, H).fill('#1a1a2e')
      doc.moveTo(sideW - 1, 30).lineTo(sideW - 1, H - 30).strokeColor('#c9a84c').lineWidth(0.5).stroke()
      // Texte vertical
      doc.save().translate(sideW / 2, H / 2).rotate(-90)
      doc.fontSize(7).fillColor('#c9a84c').fillOpacity(0.6).font('Helvetica')
        .text('LIEU SECRET — ÉCOLE DE PIANO EN LIGNE', -130, -4, { width: 260, align: 'center' })
      doc.restore().fillOpacity(1)
      // Bordure
      const m = 20
      doc.rect(sideW + m, m, W - sideW - m * 2, H - m * 2).strokeColor('#c9a84c').lineWidth(0.4).stroke()
      // Filigrane
      doc.save().translate(W * 0.62, H * 0.5).rotate(-15)
      doc.fontSize(120).fillColor('#1a1a2e').fillOpacity(0.035).font('Helvetica-Bold').text('LS', -60, -60)
      doc.restore().fillOpacity(1)

      let y = 45
      // En-tête
      doc.fontSize(13).fillColor('#1a1a2e').font('Helvetica-Bold')
        .text('LIEU SECRET', contentX, y, { width: contentW, align: 'left', characterSpacing: 3 })
      doc.fontSize(7).fillColor('#999').font('Helvetica')
        .text('ÉCOLE DE PIANO EN LIGNE', contentX, y + 18, { characterSpacing: 2 })
      doc.fontSize(7).fillColor('#bbb').font('Courier')
        .text(`N° ${numero}`, contentX, y + 5, { width: contentW, align: 'right' })
      y += 42
      // Ligne dorée
      doc.moveTo(contentX, y).lineTo(contentX + contentW, y).strokeColor('#c9a84c').lineWidth(0.4).stroke()
      y += 22
      // Corps
      doc.fontSize(8).fillColor('#999').font('Helvetica')
        .text('CERTIFICAT DE RÉUSSITE', contentX, y, { characterSpacing: 2.5 })
      y += 16
      doc.fontSize(20).fillColor('#1a1a2e').font('Helvetica-Bold').text('Formation Piano', contentX, y)
      y += 26
      doc.fontSize(8).fillColor('#999').font('Helvetica')
        .text('DÉCERNÉ À', contentX, y, { characterSpacing: 2 })
      y += 14
      doc.fontSize(28).fillColor('#c9a84c').font('Helvetica-Oblique').text(nom_complet, contentX, y)
      y += 38
      doc.fontSize(8).fillColor('#999').font('Helvetica')
        .text('POUR AVOIR VALIDÉ AVEC SUCCÈS', contentX, y, { characterSpacing: 2 })
      y += 14
      doc.fontSize(13).fillColor('#1a1a2e').font('Helvetica-Bold').text(nom_cert, contentX, y)

      // Footer
      doc.moveTo(contentX, H - 65).lineTo(contentX + contentW, H - 65)
        .strokeColor('#c9a84c').lineWidth(0.3).strokeOpacity(0.3).stroke().strokeOpacity(1)
      const fY = H - 55
      doc.fontSize(6).fillColor('#bbb').font('Helvetica')
        .text("DATE D'OBTENTION", contentX, fY, { characterSpacing: 1.5 })
      doc.fontSize(9).fillColor('#444').font('Helvetica').text(date_fr, contentX, fY + 10)
      const sigX = contentX + contentW / 2 - 60
      doc.moveTo(sigX, fY + 8).lineTo(sigX + 120, fY + 8).strokeColor('#ccc').lineWidth(0.5).stroke()
      doc.fontSize(6).fillColor('#bbb').font('Helvetica')
        .text('SIGNATURE', sigX, fY + 11, { width: 120, align: 'center', characterSpacing: 1.5 })
      doc.fontSize(9).fillColor('#555').font('Helvetica-Oblique')
        .text('Lieu Secret', sigX, fY + 21, { width: 120, align: 'center' })
      doc.fontSize(6).fillColor('#bbb').font('Helvetica')
        .text('DÉLIVRÉ PAR', contentX, fY, { width: contentW, align: 'right', characterSpacing: 1.5 })
      doc.fontSize(9).fillColor('#444').font('Helvetica')
        .text('lieusecret-courspiano.fr', contentX, fY + 10, { width: contentW, align: 'right' })
      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificat-${nom_cert.replace(/\s+/g, '-')}-${numero}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[PDF] Erreur pdfkit:', err)
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 })
  }
}

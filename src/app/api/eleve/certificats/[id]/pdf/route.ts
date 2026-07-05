import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

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
  const date_fr = new Date(cert.date_obtention).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const medailleColor = cert.niveau?.includes('Or') ? '#f59e0b' : cert.niveau?.includes('Argent') ? '#9ca3af' : cert.niveau?.includes('Bronze') ? '#cd7c2f' : '#f59e0b'
  const medailleIcon = cert.niveau?.includes('Or') ? '🥇' : cert.niveau?.includes('Argent') ? '🥈' : cert.niveau?.includes('Bronze') ? '🥉' : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 297mm; height: 210mm; background: #0a0a1a; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; }
  .page { width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .border-outer { position: absolute; inset: 8mm; border: 2px solid rgba(245,158,11,0.4); border-radius: 4px; }
  .border-inner { position: absolute; inset: 11mm; border: 1px solid rgba(245,158,11,0.2); border-radius: 3px; }
  .corner { position: absolute; width: 20px; height: 20px; border-color: #f59e0b; border-style: solid; }
  .corner-tl { top: 7mm; left: 7mm; border-width: 2px 0 0 2px; }
  .corner-tr { top: 7mm; right: 7mm; border-width: 2px 2px 0 0; }
  .corner-bl { bottom: 7mm; left: 7mm; border-width: 0 0 2px 2px; }
  .corner-br { bottom: 7mm; right: 7mm; border-width: 0 2px 2px 0; }
  .content { position: relative; z-index: 10; text-align: center; padding: 0 30mm; }
  .logo { font-family: 'Cormorant Garamond', serif; font-size: 11pt; color: #f59e0b; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 4mm; }
  .logo-sub { font-size: 7pt; color: rgba(245,158,11,0.6); letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 8mm; }
  .divider { width: 60mm; height: 1px; background: linear-gradient(to right, transparent, #f59e0b, transparent); margin: 0 auto 8mm; }
  .title { font-family: 'Cormorant Garamond', serif; font-size: 28pt; color: #ffffff; font-weight: 700; margin-bottom: 6mm; line-height: 1.1; }
  .subtitle { font-size: 9pt; color: rgba(255,255,255,0.5); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 10mm; }
  .certifie { font-size: 9pt; color: rgba(255,255,255,0.6); margin-bottom: 4mm; }
  .nom { font-family: 'Cormorant Garamond', serif; font-size: 26pt; color: #f59e0b; font-style: italic; margin-bottom: 8mm; }
  .pour { font-size: 9pt; color: rgba(255,255,255,0.6); margin-bottom: 3mm; }
  .niveau { font-family: 'Cormorant Garamond', serif; font-size: 16pt; color: #ffffff; font-weight: 600; margin-bottom: 3mm; }
  .medaille { font-size: 14pt; margin-bottom: 8mm; color: ${medailleColor}; }
  .divider2 { width: 40mm; height: 1px; background: linear-gradient(to right, transparent, rgba(245,158,11,0.4), transparent); margin: 0 auto 8mm; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6mm; }
  .footer-item { text-align: center; }
  .footer-label { font-size: 6pt; color: rgba(255,255,255,0.3); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 2mm; }
  .footer-value { font-size: 8pt; color: rgba(255,255,255,0.7); }
  .numero { font-family: monospace; font-size: 7pt; color: rgba(245,158,11,0.5); letter-spacing: 0.1em; }
  .signature-line { width: 40mm; height: 1px; background: rgba(255,255,255,0.2); margin: 0 auto 2mm; }
  .bg-deco { position: absolute; inset: 0; opacity: 0.03; background: radial-gradient(ellipse at center, #f59e0b 0%, transparent 70%); }
</style>
</head>
<body>
<div class="page">
  <div class="bg-deco"></div>
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>
  <div class="content">
    <div class="logo">Lieu Secret</div>
    <div class="logo-sub">École de Piano en Ligne</div>
    <div class="divider"></div>
    <div class="title">Certificat de Réussite</div>
    <div class="subtitle">Formation Piano</div>
    <div class="certifie">Ce certificat est décerné à</div>
    <div class="nom">${nom_complet}</div>
    <div class="pour">pour avoir validé avec succès</div>
    <div class="niveau">${cert.nom_certificat || cert.niveau || 'Formation Piano'}</div>
    ${medailleIcon ? `<div class="medaille">${medailleIcon} ${cert.niveau?.split('—')[1]?.trim() || ''}</div>` : ''}
    ${cert.commentaire ? `<div style="font-size:8pt;color:rgba(255,255,255,0.5);margin-bottom:6mm;font-style:italic;">${cert.commentaire}</div>` : ''}
    <div class="divider2"></div>
    <div class="footer">
      <div class="footer-item">
        <div class="footer-label">Date d'obtention</div>
        <div class="footer-value">${date_fr}</div>
      </div>
      <div class="footer-item">
        <div class="signature-line"></div>
        <div class="footer-label">Signature du professeur</div>
        <div class="footer-value" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:10pt;color:rgba(255,255,255,0.6);">Lieu Secret</div>
      </div>
      <div class="footer-item">
        <div class="footer-label">Numéro de certificat</div>
        <div class="numero">${cert.numero || 'LS-2025-001'}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  // Essayer wkhtmltopdf
  const tmpHtml = join(tmpdir(), `cert-${params.id}.html`)
  const tmpPdf  = join(tmpdir(), `cert-${params.id}.pdf`)

  try {
    await writeFile(tmpHtml, html, 'utf8')
    await execAsync(
      `wkhtmltopdf --page-width 297mm --page-height 210mm --orientation Landscape --no-background --enable-local-file-access --quiet "${tmpHtml}" "${tmpPdf}"`,
      { timeout: 30000 }
    )
    const pdfBuffer = await readFile(tmpPdf)
    await unlink(tmpHtml).catch(() => {})
    await unlink(tmpPdf).catch(() => {})

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificat-${(cert.nom_certificat || 'Lieu-Secret').replace(/\s+/g, '-')}-${cert.numero || ''}.pdf"`,
      },
    })
  } catch {
    // Fallback : retourner le HTML
    await unlink(tmpHtml).catch(() => {})
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Certificat-${cert.numero || 'LS'}.html"`,
      },
    })
  }
}
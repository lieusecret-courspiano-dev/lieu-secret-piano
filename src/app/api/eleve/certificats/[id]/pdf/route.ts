import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { data: cert, error } = await supabaseAdmin
    .from('certificats')
    .select('*')
    .eq('id', params.id)
    .eq('eleve_id', eleve.id)
    .single()

  if (error || !cert) return NextResponse.json({ error: 'Certificat non trouvé' }, { status: 404 })

  const dateStr = new Date(cert.date_obtention).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #fff;
    width: 297mm;
    height: 210mm;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .page {
    width: 297mm;
    height: 210mm;
    background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1f 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 20mm;
  }
  .border-outer {
    position: absolute;
    inset: 8mm;
    border: 2px solid rgba(245,158,11,0.4);
    border-radius: 4mm;
  }
  .border-inner {
    position: absolute;
    inset: 11mm;
    border: 1px solid rgba(245,158,11,0.15);
    border-radius: 3mm;
  }
  .corner {
    position: absolute;
    width: 12mm;
    height: 12mm;
    border-color: #f59e0b;
    border-style: solid;
    opacity: 0.7;
  }
  .corner-tl { top: 7mm; left: 7mm; border-width: 2px 0 0 2px; border-radius: 2mm 0 0 0; }
  .corner-tr { top: 7mm; right: 7mm; border-width: 2px 2px 0 0; border-radius: 0 2mm 0 0; }
  .corner-bl { bottom: 7mm; left: 7mm; border-width: 0 0 2px 2px; border-radius: 0 0 0 2mm; }
  .corner-br { bottom: 7mm; right: 7mm; border-width: 0 2px 2px 0; border-radius: 0 0 2mm 0; }
  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
    max-width: 220mm;
  }
  .logo-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 6mm;
  }
  .logo-bar { width: 40px; height: 1px; background: #f59e0b; opacity: 0.6; }
  .logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 11pt;
    letter-spacing: 0.4em;
    color: #f59e0b;
    text-transform: uppercase;
  }
  .cert-label {
    font-size: 8pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(245,158,11,0.7);
    margin-bottom: 4mm;
  }
  .cert-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28pt;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 5mm;
  }
  .divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 4mm 0;
  }
  .divider-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(245,158,11,0.4), transparent); max-width: 60mm; }
  .divider-dot { width: 4px; height: 4px; background: #f59e0b; border-radius: 50%; }
  .awarded-to {
    font-size: 9pt;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 3mm;
  }
  .student-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22pt;
    font-style: italic;
    color: #f59e0b;
    margin-bottom: 4mm;
  }
  .cert-desc {
    font-size: 9pt;
    color: rgba(255,255,255,0.6);
    line-height: 1.6;
    margin-bottom: 5mm;
    max-width: 160mm;
    margin-left: auto;
    margin-right: auto;
  }
  .niveau-badge {
    display: inline-block;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.3);
    color: #f59e0b;
    font-size: 8pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 2mm 6mm;
    border-radius: 20px;
    margin-bottom: 6mm;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 5mm;
    padding-top: 4mm;
    border-top: 1px solid rgba(245,158,11,0.15);
  }
  .footer-item { text-align: center; }
  .footer-label { font-size: 7pt; color: rgba(255,255,255,0.3); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 1mm; }
  .footer-value { font-size: 8pt; color: rgba(255,255,255,0.6); }
  .footer-num { font-size: 8pt; color: #f59e0b; font-family: 'Cormorant Garamond', serif; }
  .verset {
    font-size: 8pt;
    color: rgba(255,255,255,0.35);
    font-style: italic;
    margin-top: 3mm;
    font-family: 'Cormorant Garamond', serif;
  }
</style>
</head>
<body>
<div class="page">
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>

  <div class="content">
    <div class="logo-line">
      <div class="logo-bar"></div>
      <span class="logo-text">Lieu Secret</span>
      <div class="logo-bar"></div>
    </div>

    <p class="cert-label">Certificat de réussite</p>

    <h1 class="cert-title">${cert.nom_certificat || 'Certificat'}</h1>

    <div class="divider">
      <div class="divider-line"></div>
      <div class="divider-dot"></div>
      <div class="divider-line"></div>
    </div>

    <p class="awarded-to">Décerné à</p>
    <p class="student-name">${eleve.prenom} ${eleve.nom}</p>

    <p class="cert-desc">
      Pour avoir validé avec succès l'ensemble des compétences requises
      et démontré une maîtrise exemplaire dans le cadre de la formation
      <em>Lieu Secret — École de Piano en Ligne</em>.
    </p>

    ${cert.niveau ? `<div class="niveau-badge">${cert.niveau}</div>` : ''}

    ${cert.commentaire ? `<p class="cert-desc" style="font-style:italic;color:rgba(255,255,255,0.5)">"${cert.commentaire}"</p>` : ''}

    <div class="footer">
      <div class="footer-item">
        <p class="footer-label">Date d'obtention</p>
        <p class="footer-value">${dateStr}</p>
      </div>
      <div class="footer-item">
        <p class="footer-label">Numéro de certificat</p>
        <p class="footer-num">${cert.numero || cert.id.slice(0, 8).toUpperCase()}</p>
      </div>
      <div class="footer-item">
        <p class="footer-label">Délivré par</p>
        <p class="footer-value">Lieu Secret Piano</p>
      </div>
    </div>

    ${cert.verset ? `<p class="verset">${cert.verset}</p>` : ''}
  </div>
</div>
</body>
</html>`

  // Générer le PDF via le module centralisé
  const { generatePdfFromHtml, safePdfFilename } = await import('@/lib/pdf-generator')

  try {
    const { buffer, contentType, isHtml } = await generatePdfFromHtml(html, {
      pageWidth: '297mm',
      pageHeight: '210mm',
      orientation: 'Landscape',
    })

    const nomFichier = safePdfFilename([
      'Certificat',
      cert.nom_certificat || 'Lieu-Secret',
      eleve.prenom,
      eleve.nom,
    ])

    if (isHtml) {
      return new NextResponse(buffer.toString('utf8'), {
        headers: { 'Content-Type': contentType }
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${nomFichier}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (err: any) {
    console.error('[cert PDF]', err)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}
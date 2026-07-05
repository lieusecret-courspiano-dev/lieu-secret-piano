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

  const niveauLabel = cert.niveau?.includes('Or') ? 'Mention Or'
    : cert.niveau?.includes('Argent') ? 'Mention Argent'
    : cert.niveau?.includes('Bronze') ? 'Mention Bronze' : ''
  const niveauColor = cert.niveau?.includes('Or') ? '#c9a84c'
    : cert.niveau?.includes('Argent') ? '#9ca3af'
    : cert.niveau?.includes('Bronze') ? '#b87333' : '#c9a84c'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=EB+Garamond:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  html, body { width:297mm; height:210mm; background:#faf8f4; }
  .page {
    width:297mm; height:210mm;
    background:#faf8f4;
    display:flex; align-items:stretch;
    font-family:'EB Garamond', Georgia, serif;
    position:relative; overflow:hidden;
  }
  .sidebar {
    width:26mm; background:#1a1a2e;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:12mm 0; flex-shrink:0;
  }
  .sidebar-text {
    writing-mode:vertical-rl; transform:rotate(180deg);
    font-family:'Cormorant Garamond',serif;
    font-size:7.5pt; letter-spacing:0.3em;
    text-transform:uppercase; color:rgba(201,168,76,0.65);
  }
  .sidebar-line { width:0.5pt; background:rgba(201,168,76,0.25); flex:1; margin:5mm 0; }
  .main { flex:1; display:flex; flex-direction:column; padding:13mm 16mm 11mm 14mm; position:relative; }
  .watermark {
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    font-family:'Cormorant Garamond',serif;
    font-size:80pt; font-weight:700;
    color:rgba(26,26,46,0.035);
    letter-spacing:0.08em; white-space:nowrap;
    pointer-events:none; z-index:0;
  }
  .border-deco {
    position:absolute; top:7mm; right:7mm; bottom:7mm; left:33mm;
    border:0.4pt solid rgba(201,168,76,0.2);
    pointer-events:none; z-index:0;
  }
  .content { position:relative; z-index:1; flex:1; display:flex; flex-direction:column; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:7mm; }
  .school-name {
    font-family:'Cormorant Garamond',serif;
    font-size:12.5pt; font-weight:700;
    color:#1a1a2e; letter-spacing:0.22em; text-transform:uppercase;
  }
  .school-sub { font-size:6.5pt; color:#999; letter-spacing:0.18em; text-transform:uppercase; margin-top:1.5mm; }
  .numero-cert { text-align:right; font-size:6.5pt; color:#bbb; letter-spacing:0.08em; font-family:'Courier New',monospace; }
  .gold-line { height:0.4pt; background:linear-gradient(to right,#c9a84c,rgba(201,168,76,0.08)); margin-bottom:7mm; }
  .body { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .certifie-label { font-size:7.5pt; color:#999; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:2.5mm; }
  .cert-title {
    font-family:'Cormorant Garamond',serif;
    font-size:20pt; font-weight:600; color:#1a1a2e;
    margin-bottom:5mm; line-height:1.2;
  }
  .recipient-label { font-size:7.5pt; color:#999; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:2mm; }
  .recipient-name {
    font-family:'Cormorant Garamond',serif;
    font-size:26pt; font-style:italic; color:#c9a84c;
    margin-bottom:5mm; line-height:1.1;
  }
  .competence-label { font-size:7.5pt; color:#999; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:2mm; }
  .competence-name {
    font-family:'Cormorant Garamond',serif;
    font-size:13pt; font-weight:600; color:#1a1a2e;
    margin-bottom:${niveauLabel ? '3mm' : '0'};
  }
  .niveau-badge {
    display:inline-block; font-size:7.5pt;
    color:${niveauColor}; border:0.4pt solid ${niveauColor};
    padding:1mm 4mm; letter-spacing:0.15em;
    text-transform:uppercase; margin-bottom:5mm;
  }
  .footer {
    display:flex; justify-content:space-between; align-items:flex-end;
    padding-top:5mm; border-top:0.4pt solid rgba(201,168,76,0.18);
  }
  .footer-label { font-size:6pt; color:#bbb; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.5mm; }
  .footer-value { font-size:8.5pt; color:#444; }
  .signature-area { text-align:center; }
  .signature-line { width:42mm; height:0.4pt; background:#ccc; margin:0 auto 1.5mm; }
  .signature-name { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:9.5pt; color:#555; }
</style>
</head>
<body>
<div class="page">
  <div class="sidebar">
    <div class="sidebar-line"></div>
    <div class="sidebar-text">Lieu Secret — École de Piano</div>
    <div class="sidebar-line"></div>
  </div>
  <div class="main">
    <div class="watermark">LS</div>
    <div class="border-deco"></div>
    <div class="content">
      <div class="header">
        <div>
          <div class="school-name">Lieu Secret</div>
          <div class="school-sub">École de Piano en Ligne</div>
        </div>
        <div class="numero-cert">N° ${cert.numero || 'LS-2025-001'}</div>
      </div>
      <div class="gold-line"></div>
      <div class="body">
        <div class="certifie-label">Certificat de réussite</div>
        <div class="cert-title">Formation Piano<br>Lieu Secret</div>
        <div class="recipient-label">Décerné à</div>
        <div class="recipient-name">${nom_complet}</div>
        <div class="competence-label">Pour avoir validé avec succès</div>
        <div class="competence-name">${cert.nom_certificat || 'Formation Piano'}</div>

      </div>
      <div class="footer">
        <div>
          <div class="footer-label">Date d'obtention</div>
          <div class="footer-value">${date_fr}</div>
        </div>
        <div class="signature-area">
          <div class="signature-line"></div>
          <div class="footer-label">Signature</div>
          <div class="signature-name">Lieu Secret</div>
        </div>
        <div style="text-align:right">
          <div class="footer-label">Délivré par</div>
          <div class="footer-value">lieusecret-courspiano.fr</div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  const printHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Certificat</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  @media print { html, body { width:297mm; height:210mm; margin:0; padding:0; } .no-print { display:none !important; } }
  body { margin:0; padding:0; }
  .print-btn {
    position:fixed; top:12px; right:12px; z-index:9999;
    background:#1a1a2e; color:#c9a84c;
    border:1px solid #c9a84c; padding:8px 20px;
    font-family:Georgia,serif; font-size:13px;
    cursor:pointer; border-radius:4px; letter-spacing:0.1em;
  }
  .print-btn:hover { background:#c9a84c; color:#1a1a2e; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Enregistrer en PDF</button>
${html}
</body>
</html>`

  return new NextResponse(printHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

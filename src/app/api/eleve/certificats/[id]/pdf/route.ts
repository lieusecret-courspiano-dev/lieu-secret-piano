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

  // HTML optimisé pour impression PDF (Ctrl+P → Enregistrer en PDF)
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Certificat — ${nom_complet}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4 landscape; margin: 0; }
  html { width:297mm; height:210mm; }
  body { width:297mm; height:210mm; background:#faf8f4; font-family:'Cormorant Garamond',Georgia,serif; overflow:hidden; }

  /* Bouton impression — masqué à l'impression */
  .print-bar {
    position:fixed; top:0; left:0; right:0; z-index:9999;
    background:#1a1a2e; padding:10px 20px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .print-bar span { color:#c9a84c; font-family:Georgia,serif; font-size:14px; letter-spacing:0.1em; }
  .print-btn {
    background:#c9a84c; color:#1a1a2e; border:none;
    padding:8px 24px; font-family:Georgia,serif; font-size:13px;
    cursor:pointer; letter-spacing:0.1em; font-weight:bold;
  }
  .print-btn:hover { background:#d4b05a; }
  @media print { .print-bar { display:none !important; } }

  /* Certificat */
  .cert {
    width:297mm; height:210mm;
    display:flex; position:relative; overflow:hidden;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }

  /* Bande latérale */
  .sidebar {
    width:26mm; background:#1a1a2e; flex-shrink:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    position:relative;
  }
  .sidebar::after {
    content:''; position:absolute; right:0; top:25mm; bottom:25mm;
    width:0.5px; background:rgba(201,168,76,0.3);
  }
  .sidebar-text {
    writing-mode:vertical-rl; transform:rotate(180deg);
    font-family:Georgia,serif; font-size:7pt; letter-spacing:0.3em;
    text-transform:uppercase; color:rgba(201,168,76,0.65);
  }

  /* Contenu principal */
  .main {
    flex:1; padding:13mm 16mm 11mm 14mm;
    display:flex; flex-direction:column; position:relative;
  }

  /* Filigrane */
  .watermark {
    position:absolute; top:50%; left:55%;
    transform:translate(-50%,-50%) rotate(-15deg);
    font-size:100pt; font-weight:700; color:rgba(26,26,46,0.04);
    letter-spacing:0.1em; pointer-events:none; user-select:none;
  }

  /* Bordure décorative */
  .border-deco {
    position:absolute; top:7mm; right:7mm; bottom:7mm; left:33mm;
    border:0.4pt solid rgba(201,168,76,0.22); pointer-events:none;
  }

  .content { position:relative; z-index:1; flex:1; display:flex; flex-direction:column; }

  /* En-tête */
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:7mm; }
  .school-name { font-size:13pt; font-weight:700; color:#1a1a2e; letter-spacing:0.22em; text-transform:uppercase; }
  .school-sub { font-size:6.5pt; color:#999; letter-spacing:0.18em; text-transform:uppercase; margin-top:2mm; font-family:Georgia,serif; }
  .cert-num { font-size:6.5pt; color:#bbb; letter-spacing:0.08em; font-family:'Courier New',monospace; text-align:right; }

  /* Ligne dorée */
  .gold-line { height:0.4pt; background:linear-gradient(to right,#c9a84c,rgba(201,168,76,0.05)); margin-bottom:7mm; }

  /* Corps */
  .body { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .label-sm { font-size:7.5pt; color:#999; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:2.5mm; font-family:Georgia,serif; }
  .cert-title { font-size:20pt; font-weight:700; color:#1a1a2e; margin-bottom:5mm; line-height:1.2; }
  .recipient { font-size:26pt; font-style:italic; color:#c9a84c; margin-bottom:5mm; line-height:1.1; }
  .competence { font-size:13pt; font-weight:600; color:#1a1a2e; }

  /* Footer */
  .footer {
    display:flex; justify-content:space-between; align-items:flex-end;
    padding-top:5mm; border-top:0.4pt solid rgba(201,168,76,0.18);
    margin-top:auto;
  }
  .footer-label { font-size:6pt; color:#bbb; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:1.5mm; font-family:Georgia,serif; }
  .footer-value { font-size:8.5pt; color:#444; }
  .sig-line { width:42mm; height:0.4pt; background:#ccc; margin:0 auto 1.5mm; }
  .sig-name { font-size:9.5pt; font-style:italic; color:#555; text-align:center; }
</style>
</head>
<body>
<div class="print-bar">
  <span>Certificat — ${nom_complet}</span>
  <button class="print-btn" onclick="window.print()">Enregistrer en PDF</button>
</div>
<div class="cert">
  <div class="sidebar">
    <div class="sidebar-text">Lieu Secret — École de Piano en Ligne</div>
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
        <div class="cert-num">N° ${numero}</div>
      </div>
      <div class="gold-line"></div>
      <div class="body">
        <div class="label-sm">Certificat de réussite</div>
        <div class="cert-title">Formation Piano<br>Lieu Secret</div>
        <div class="label-sm">Décerné à</div>
        <div class="recipient">${nom_complet}</div>
        <div class="label-sm">Pour avoir validé avec succès</div>
        <div class="competence">${nom_cert}</div>
      </div>
      <div class="footer">
        <div>
          <div class="footer-label">Date d'obtention</div>
          <div class="footer-value">${date_fr}</div>
        </div>
        <div style="text-align:center">
          <div class="sig-line"></div>
          <div class="footer-label">Signature</div>
          <div class="sig-name">Lieu Secret</div>
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

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' \u20ac' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const PAIEMENT_LABELS: Record<string, string> = {
  stripe: 'Carte bancaire (Stripe)', paypal: 'PayPal',
  virement: 'Virement bancaire', especes: 'Espèces', cheque: 'Chèque',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: facture, error } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('*, comptabilite_factures_lignes(*)')
    .eq('id', params.id)
    .single()

  if (error || !facture) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })

  const { data: p } = await supabaseAdmin
    .from('comptabilite_parametres')
    .select('*')
    .eq('id', 1)
    .single()

  const lignes = (facture.comptabilite_factures_lignes || [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>${facture.numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; font-size: 12px; }
  .page { max-width: 780px; margin: 0 auto; padding: 32px; border: 1.5px solid #c47f00; }

  /* En-tête */
  .header { background: #1a1a2e; border-radius: 8px; padding: 22px 28px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo-text { font-size: 22px; color: #f59e0b; letter-spacing: 5px; font-weight: bold; }
  .logo-sub { font-size: 9px; color: #a0a0c0; letter-spacing: 3px; text-transform: uppercase; margin-top: 3px; }
  .header-contact { margin-top: 12px; font-size: 10px; color: #c0c0d0; line-height: 1.8; }
  .header-right { text-align: right; }
  .facture-label { font-size: 9px; color: #a0a0c0; letter-spacing: 2px; text-transform: uppercase; }
  .facture-num { font-size: 18px; color: #f59e0b; font-weight: bold; margin-top: 4px; }
  .facture-date { font-size: 10px; color: #d0d0e0; margin-top: 5px; }

  /* Parties émetteur / client */
  .parties { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 24px; }
  .partie { flex: 1; }
  .partie-label { font-size: 9px; color: #c47f00; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; }
  .partie-nom { font-size: 13px; font-weight: bold; color: #1a1a1a; }
  .partie-info { font-size: 10px; color: #555; line-height: 1.8; margin-top: 3px; }

  /* Séparateur */
  .sep { border: none; border-top: 1.5px solid #f59e0b; margin: 16px 0; }

  /* Tableau */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f5f0e0; }
  th { padding: 8px 10px; text-align: left; font-size: 9px; color: #c47f00; text-transform: uppercase; letter-spacing: 0.8px; font-weight: bold; }
  th:last-child, td:last-child { text-align: right; }
  td { padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #f0ece0; vertical-align: top; }
  .designation-main { font-weight: bold; }
  .designation-desc { font-size: 10px; color: #888; margin-top: 2px; }

  /* Totaux */
  .totaux-wrapper { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .totaux { width: 280px; }
  .totaux-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #555; }
  .totaux-tva { font-size: 10px; color: #999; padding: 3px 0; font-style: italic; }
  .total-ttc-bar { background: #1a1a2e; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
  .total-ttc-label { color: #a0a0c0; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
  .total-ttc-amount { color: #f59e0b; font-size: 16px; font-weight: bold; }
  .paiement-info { font-size: 10px; color: #888; margin-top: 6px; text-align: right; }

  /* Notes */
  .notes { background: #fafaf5; border-left: 3px solid #f59e0b; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; color: #555; border-radius: 0 4px 4px 0; }

  /* Décoration musicale */
  .music-deco { text-align: center; font-size: 22px; color: #f0ece0; letter-spacing: 10px; margin: 20px 0 12px; }

  /* Pied de page */
  .footer { border-top: 1.5px solid #f59e0b; padding-top: 10px; text-align: center; font-size: 10px; color: #888; line-height: 1.8; margin-top: 8px; }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { border: 1.5px solid #c47f00; margin: 0; }
    @page { margin: 10mm; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- En-tête : logo + infos émetteur à gauche, numéro facture à droite -->
  <div class="header">
    <div>
      <div class="logo-text">${p?.nom_entreprise || 'LIEU SECRET'}</div>
      <div class="logo-sub">École de Piano en Ligne</div>
      <div class="header-contact">
        ${p?.nom_proprietaire || 'Claudine Yombo'}<br/>
        ${p?.adresse || '106F rue de la Richelandière'}, ${p?.code_postal || '42100'} ${p?.ville || 'Saint-Étienne'}<br/>
        ${p?.telephone || '+33695346598'} &nbsp;|&nbsp; ${p?.email || 'lieusecret-courspiano@outlook.fr'}
      </div>
    </div>
    <div class="header-right">
      <div class="facture-label">Facture</div>
      <div class="facture-num">${facture.numero}</div>
      <div class="facture-date">Date : ${fDate(facture.date_facture)}</div>
      ${facture.date_echeance ? `<div class="facture-date">Échéance : ${fDate(facture.date_echeance)}</div>` : ''}
    </div>
  </div>

  <!-- Client aligné à droite (pas à l'extrême) -->
  <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
    <div style="text-align:left; max-width:280px;">
      <div class="partie-label">Facturé à</div>
      <div class="partie-nom">${facture.client_nom}</div>
      <div class="partie-info">
        ${facture.client_email ? facture.client_email + '<br/>' : ''}
        ${facture.client_telephone ? facture.client_telephone + '<br/>' : ''}
        ${facture.client_adresse ? facture.client_adresse : ''}
      </div>
    </div>
  </div>

  <hr class="sep"/>

  <!-- Tableau -->
  <table>
    <thead>
      <tr>
        <th style="width:55%">Désignation</th>
        <th style="width:10%;text-align:center">Qté</th>
        <th style="width:15%">P.U. HT</th>
        <th style="width:20%">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${lignes.map((l: { designation: string; description?: string; quantite: number; unite: string; prix_unitaire: number; montant_ht: number }) => `
      <tr>
        <td>
          <div class="designation-main">${l.designation}</div>
          ${l.description ? `<div class="designation-desc">${l.description}</div>` : ''}
        </td>
        <td style="text-align:center">${l.quantite} ${l.unite}</td>
        <td>${fmt(l.prix_unitaire)}</td>
        <td>${fmt(l.montant_ht)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- Totaux -->
  <div class="totaux-wrapper">
    <div class="totaux">
      ${facture.montant_ht !== facture.montant_ttc ? `
      <div class="totaux-row"><span>Total HT</span><span>${fmt(facture.montant_ht)}</span></div>` : ''}
      ${facture.taux_tva > 0 ? `
      <div class="totaux-row"><span>TVA (${facture.taux_tva}%)</span><span>${fmt(facture.montant_tva)}</span></div>` : `
      <div class="totaux-tva">TVA non applicable — Art. 293 B du CGI</div>`}
      <div class="total-ttc-bar">
        <span class="total-ttc-label">Total TTC</span>
        <span class="total-ttc-amount">${fmt(facture.montant_ttc)}</span>
      </div>
      ${facture.moyen_paiement ? `<div class="paiement-info">Règlement : ${PAIEMENT_LABELS[facture.moyen_paiement] || facture.moyen_paiement}</div>` : ''}
    </div>
  </div>

  ${facture.notes ? `<div class="notes">${facture.notes}</div>` : ''}

  <!-- Décoration musicale -->
  <div class="music-deco">♩ ♪ ♫ ♬ ♩ ♪ ♫</div>

  <!-- Pied de page : SIRET uniquement -->
  <div class="footer">
    ${p?.nom_proprietaire || 'Claudine Yombo'} &mdash; SIRET ${p?.siret || '98246654200015'}
    ${p?.iban ? '<br/>IBAN : ' + p.iban : ''}
  </div>

</div>
<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 400); }
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${facture.numero}.html"`,
    },
  })
}
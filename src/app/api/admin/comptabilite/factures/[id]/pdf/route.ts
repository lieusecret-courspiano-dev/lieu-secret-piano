import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; font-size: 12px; line-height: 1.6; }
  .page { max-width: 750px; margin: 0 auto; padding: 40px; }
  .header { background: #1a1a2e; color: #f59e0b; padding: 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 22px; letter-spacing: 4px; font-weight: bold; }
  .logo-sub { font-size: 10px; color: #a0a0c0; letter-spacing: 2px; margin-top: 4px; }
  .header-info { color: #a0a0c0; font-size: 10px; line-height: 1.8; }
  .header-right { text-align: right; }
  .facture-num { color: #f59e0b; font-size: 18px; font-weight: bold; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .partie h3 { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .partie p { font-size: 11px; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f5f0e8; }
  th { padding: 8px 10px; text-align: left; font-size: 10px; color: #c47f00; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #eee; }
  .totaux { margin-left: auto; width: 280px; }
  .totaux-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
  .total-ttc { background: #1a1a2e; color: #f59e0b; padding: 10px 12px; border-radius: 6px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f59e0b; text-align: center; font-size: 10px; color: #888; line-height: 1.8; }
  .mention { font-size: 10px; color: #888; margin-top: 8px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">${p?.nom_entreprise || 'LIEU SECRET'}</div>
      <div class="logo-sub">ÉCOLE DE PIANO EN LIGNE</div>
      <div class="header-info" style="margin-top:12px">
        ${p?.nom_proprietaire || 'Claudine Yombo'}<br/>
        SIRET : ${p?.siret || '98246654200015'}<br/>
        ${p?.adresse || '106F rue de la Richelandière'}<br/>
        ${p?.code_postal || '42100'} ${p?.ville || 'Saint-Étienne'}<br/>
        ${p?.telephone || '+33695346598'}<br/>
        ${p?.email || 'lieusecret-courspiano@outlook.fr'}
      </div>
    </div>
    <div class="header-right">
      <div class="facture-num">${facture.numero}</div>
      <div class="header-info" style="margin-top:8px">
        Date : ${fDate(facture.date_facture)}<br/>
        ${facture.date_echeance ? 'Échéance : ' + fDate(facture.date_echeance) : ''}
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="partie">
      <h3>Émetteur</h3>
      <p>
        <strong>${p?.nom_proprietaire || 'Claudine Yombo'}</strong><br/>
        Auto-entrepreneur<br/>
        ${p?.adresse || '106F rue de la Richelandière'}<br/>
        ${p?.code_postal || '42100'} ${p?.ville || 'Saint-Étienne'}
      </p>
    </div>
    <div class="partie">
      <h3>Facturé à</h3>
      <p>
        <strong>${facture.client_nom}</strong><br/>
        ${facture.client_email ? facture.client_email + '<br/>' : ''}
        ${facture.client_telephone ? facture.client_telephone + '<br/>' : ''}
        ${facture.client_adresse ? facture.client_adresse : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Désignation</th>
        <th>Qté</th>
        <th>P.U. HT</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${lignes.map((l: { designation: string; description?: string; quantite: number; unite: string; prix_unitaire: number; montant_ht: number }) => `
      <tr>
        <td>
          <strong>${l.designation}</strong>
          ${l.description ? '<br/><span style="color:#888;font-size:10px">' + l.description + '</span>' : ''}
        </td>
        <td>${l.quantite} ${l.unite}</td>
        <td>${fmt(l.prix_unitaire)}</td>
        <td>${fmt(l.montant_ht)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totaux">
    <div class="totaux-row"><span style="color:#888">Total HT</span><span>${fmt(facture.montant_ht)}</span></div>
    ${facture.taux_tva > 0 ? `<div class="totaux-row"><span style="color:#888">TVA (${facture.taux_tva}%)</span><span>${fmt(facture.montant_tva)}</span></div>` : '<div class="mention">TVA non applicable — Art. 293 B du CGI</div>'}
    <div class="total-ttc"><span>TOTAL TTC</span><span>${fmt(facture.montant_ttc)}</span></div>
    ${facture.moyen_paiement ? `<div class="totaux-row" style="margin-top:8px"><span style="color:#888">Règlement</span><span>${facture.moyen_paiement}</span></div>` : ''}
  </div>

  ${facture.notes ? `<p style="margin-top:16px;font-size:11px;color:#555">${facture.notes}</p>` : ''}

  <div class="footer">
    ${p?.nom_proprietaire || 'Claudine Yombo'} — SIRET ${p?.siret || '98246654200015'}<br/>
    ${p?.email || 'lieusecret-courspiano@outlook.fr'} — ${p?.telephone || '+33695346598'}<br/>
    ${p?.mention_tva || 'TVA non applicable — Art. 293 B du CGI'}
    ${p?.iban ? '<br/>IBAN : ' + p.iban : ''}
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${facture.numero}.html"`,
    },
  })
}

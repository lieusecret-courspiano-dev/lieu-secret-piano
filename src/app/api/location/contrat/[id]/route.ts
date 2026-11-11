import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Route publique — affiche le contrat de location imprimable
// Accessible via le lien dans l'email du client
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: resa, error } = await supabaseAdmin
    .from('location_reservations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !resa) {
    return new NextResponse('<p>Contrat introuvable.</p>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 404,
    })
  }

  const cautionLabel: Record<string, string> = {
    cheque: 'Chèque non encaissé', virement: 'Virement bancaire',
    especes: 'Espèces', stripe_hold: 'Empreinte carte (Stripe)',
  }
  const paiementLabel: Record<string, string> = {
    stripe: 'Carte bancaire (Stripe)', paypal: 'PayPal', virement: 'Virement bancaire',
  }

  function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' \u20ac' }
  function fDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const dateSignature = resa.contrat_signe_le
    ? new Date(resa.contrat_signe_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const heureSignature = resa.contrat_signe_le
    ? new Date(resa.contrat_signe_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/>
<title>Contrat de location — ${resa.article_nom}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; font-size: 12px; }
.page { max-width: 780px; margin: 0 auto; padding: 32px; border: 1.5px solid #c47f00; }
.header { background: #1a1a2e; border-radius: 8px; padding: 22px 28px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
.logo-text { font-size: 22px; color: #f59e0b; letter-spacing: 5px; font-weight: bold; }
.logo-sub { font-size: 9px; color: #a0a0c0; letter-spacing: 3px; text-transform: uppercase; margin-top: 3px; }
.header-contact { margin-top: 12px; font-size: 10px; color: #c0c0d0; line-height: 1.8; }
.header-right { text-align: right; }
.contrat-title { font-size: 13px; color: #f59e0b; font-weight: bold; margin-top: 4px; }
.contrat-date { font-size: 10px; color: #d0d0e0; margin-top: 5px; }
.sep { border: none; border-top: 1.5px solid #f59e0b; margin: 16px 0; }
h2 { font-size: 11px; color: #c47f00; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #f0ece0; }
table.info { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
table.info td { padding: 4px 6px; font-size: 11px; }
table.info td:first-child { color: #666; width: 180px; }
p.clause { font-size: 11px; color: #333; margin-bottom: 8px; line-height: 1.6; }
.amount { color: #c47f00; font-weight: bold; }
.sig-block { border-top: 1.5px solid #f59e0b; padding-top: 16px; margin-top: 24px; }
table.sig { width: 100%; border-collapse: collapse; }
table.sig td { border: 1px solid #ddd; padding: 12px; width: 50%; vertical-align: top; font-size: 11px; }
.music-deco { text-align: center; font-size: 20px; color: #f0ece0; letter-spacing: 8px; margin: 20px 0 12px; }
.footer { border-top: 1.5px solid #f59e0b; padding-top: 10px; text-align: center; font-size: 10px; color: #888; line-height: 1.8; margin-top: 8px; }
.print-btn { display: block; text-align: center; margin: 0 auto 20px; padding: 10px 28px; background: #f59e0b; color: #1a1a2e; border: none; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; font-family: Georgia, serif; }
.legal { font-size: 10px; color: #999; margin-top: 10px; }
@media print { .print-btn { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } @page { margin: 10mm; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo-text">LIEU SECRET</div>
      <div class="logo-sub">École de Piano en Ligne</div>
      <div class="header-contact">
        Claudine Yombo — Auto-entrepreneur<br/>
        106F rue de la Richelandière, 42100 Saint-Étienne<br/>
        +33695346598 | lieusecret-courspiano@outlook.fr
      </div>
    </div>
    <div class="header-right">
      <div style="font-size:9px;color:#a0a0c0;letter-spacing:2px;text-transform:uppercase">Contrat de location</div>
      <div class="contrat-title">MATÉRIEL MUSICAL</div>
      <div class="contrat-date">Signé le ${dateSignature}${heureSignature ? ' à ' + heureSignature : ''}</div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>

  <h2>1. Identification des parties</h2>
  <table class="info">
    <tr><td>Loueur</td><td>Claudine Yombo — EI (SIRET 98246654200015)</td></tr>
    <tr><td>Adresse du loueur</td><td>106F rue de la Richelandière — 42100 Saint-Étienne</td></tr>
    <tr><td>Locataire</td><td><strong>${resa.locataire_nom}</strong></td></tr>
    <tr><td>Email</td><td>${resa.locataire_email || ''}</td></tr>
    ${resa.locataire_telephone ? `<tr><td>Téléphone</td><td>${resa.locataire_telephone}</td></tr>` : ''}
    ${resa.locataire_adresse ? `<tr><td>Adresse</td><td>${resa.locataire_adresse}${resa.locataire_ville ? ', ' + resa.locataire_ville : ''}</td></tr>` : ''}
  </table>

  <h2>2. Matériel loué</h2>
  <table class="info">
    <tr><td>Matériel</td><td><strong>${resa.article_nom}</strong></td></tr>
    <tr><td>Date de remise</td><td>${fDate(resa.date_debut)}</td></tr>
    <tr><td>Date de retour prévue</td><td>${fDate(resa.date_fin)}</td></tr>
    <tr><td>Durée</td><td>${resa.nb_jours || '?'} jour(s)</td></tr>
    <tr><td>Mode de remise</td><td>${resa.mode_remise === 'livraison' ? 'Livraison à domicile' : 'Retrait à Saint-Étienne'}</td></tr>
  </table>

  <h2>3. Conditions financières</h2>
  <table class="info">
    <tr><td>Montant de la location</td><td>${fmt(resa.montant_location)}</td></tr>
    ${resa.frais_livraison > 0 ? `<tr><td>Frais de livraison</td><td>${fmt(resa.frais_livraison)}</td></tr>` : ''}
    <tr><td>Montant total</td><td class="amount">${fmt(resa.montant_total)}</td></tr>
    ${resa.est_acompte && resa.montant_acompte ? `<tr><td>Acompte (50%)</td><td>${fmt(resa.montant_acompte)}</td></tr>` : ''}
    <tr><td>Mode de paiement</td><td>${paiementLabel[resa.moyen_paiement] || resa.moyen_paiement || '—'}</td></tr>
  </table>

  <h2>4. Caution</h2>
  <table class="info">
    <tr><td>Montant</td><td>${fmt(resa.caution_montant)}</td></tr>
    <tr><td>Type</td><td>${cautionLabel[resa.caution_type] || resa.caution_type || '—'}</td></tr>
  </table>
  <p class="clause">La caution peut être retenue totalement ou partiellement en cas de dommage, perte, vol ou non-restitution. Elle est restituée dans les 5 jours ouvrés après retour du matériel en bon état.</p>

  <h2>5. Obligations du locataire</h2>
  <p class="clause">Le locataire est responsable du matériel dès sa remise jusqu'à sa restitution. Il s'interdit de le prêter, sous-louer, démonter ou modifier. Il doit protéger le matériel contre les chocs, liquides, humidité et mauvais usage.</p>

  <h2>6. Vol, perte et détérioration</h2>
  <p class="clause">En cas de vol, perte ou détérioration, le locataire prend en charge le coût réel de réparation ou de remplacement. En cas de vol, un dépôt de plainte doit être transmis sous 48 heures.</p>

  <h2>7. Restitution et retard</h2>
  <p class="clause">Pénalité de retard : 10 € par jour commencé. Au-delà de 10 jours, une mise en demeure puis toute procédure judiciaire utile pourra être engagée.</p>

  <h2>8. Données personnelles</h2>
  <p class="clause">Le locataire autorise la conservation des documents d'identification nécessaires à la gestion du contrat et d'éventuels litiges.</p>

  <h2>9. Litiges</h2>
  <p class="clause">Le contrat est soumis au droit français. Les tribunaux du ressort de Saint-Étienne sont compétents sauf disposition légale contraire.</p>

  <div class="sig-block">
    <h2 style="margin-top:0;border:none">Signatures</h2>
    <table class="sig">
      <tr>
        <td><strong>Loueur : Claudine Yombo</strong><br/><span style="color:#888;font-size:10px">Lieu Secret — Saint-Étienne</span></td>
        <td>
          <strong>Locataire : ${resa.signature_nom || resa.locataire_nom}</strong><br/>
          <span style="color:#888;font-size:10px">Signé électroniquement le ${dateSignature}${heureSignature ? ' à ' + heureSignature : ''}</span><br/>
          <span style="color:#888;font-size:10px">Mention : Lu et approuvé</span>
        </td>
      </tr>
    </table>
    <p class="legal">Ce contrat a été signé électroniquement conformément au règlement eIDAS (UE) n°910/2014.</p>
  </div>

  <div class="music-deco">♩ ♪ ♫ ♬ ♩ ♪ ♫</div>

  <div class="footer">
    Claudine Yombo — SIRET 98246654200015
  </div>
</div>
<script>
  if (window.location.search.includes('print=1')) {
    setTimeout(function() { window.print(); }, 400);
  }
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
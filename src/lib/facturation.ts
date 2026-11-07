// ============================================================
// Librairie centrale de facturation — Lieu Secret
// Génère les factures automatiquement depuis toutes les sources
// ============================================================

import { supabaseAdmin } from './supabase'

export interface LigneFacture {
  designation: string
  description?: string
  quantite: number
  unite: string
  prix_unitaire: number
  taux_tva: number
}

export interface CreerFactureParams {
  source: string
  source_id?: string
  client_nom: string
  client_email?: string
  client_telephone?: string
  client_adresse?: string
  date_facture?: string
  moyen_paiement?: string
  statut_paiement?: string
  lignes: LigneFacture[]
  notes?: string
}

// Récupérer les paramètres comptables
async function getParams() {
  const { data } = await supabaseAdmin
    .from('comptabilite_parametres')
    .select('*')
    .eq('id', 1)
    .single()
  return data
}

// Générer le prochain numéro de facture
async function getNextNumero(annee: number): Promise<string> {
  const { data, error } = await supabaseAdmin
    .rpc('get_next_numero', { p_type: 'facture', p_annee: annee })

  if (error || !data) {
    // Fallback manuel si la fonction RPC échoue
    const { data: seq } = await supabaseAdmin
      .from('comptabilite_sequences')
      .select('dernier_num')
      .eq('type', 'facture')
      .eq('annee', annee)
      .single()

    const num = (seq?.dernier_num || 0) + 1
    await supabaseAdmin
      .from('comptabilite_sequences')
      .upsert({ type: 'facture', annee, dernier_num: num })

    return `FAC-${annee}-${String(num).padStart(4, '0')}`
  }

  return data as string
}

// Calculer les montants d'une ligne
function calculerLigne(ligne: LigneFacture) {
  const montant_ht  = Math.round(ligne.quantite * ligne.prix_unitaire * 100) / 100
  const montant_tva = Math.round(montant_ht * (ligne.taux_tva / 100) * 100) / 100
  const montant_ttc = Math.round((montant_ht + montant_tva) * 100) / 100
  return { montant_ht, montant_tva, montant_ttc }
}

// ── Fonction principale : créer une facture ──────────────────
export async function creerFacture(params: CreerFactureParams): Promise<string | null> {
  try {
    const now    = new Date()
    const annee  = now.getFullYear()
    const params_compta = await getParams()
    const taux_tva = params_compta?.tva_active ? (params_compta?.taux_tva || 20) : 0

    // Calculer les totaux
    let montant_ht  = 0
    let montant_tva = 0
    let montant_ttc = 0

    const lignesCalculees = params.lignes.map((l, i) => {
      const tva = params_compta?.tva_active ? (l.taux_tva || taux_tva) : 0
      const calc = calculerLigne({ ...l, taux_tva: tva })
      montant_ht  += calc.montant_ht
      montant_tva += calc.montant_tva
      montant_ttc += calc.montant_ttc
      return { ...l, taux_tva: tva, ...calc, position: i }
    })

    montant_ht  = Math.round(montant_ht * 100) / 100
    montant_tva = Math.round(montant_tva * 100) / 100
    montant_ttc = Math.round(montant_ttc * 100) / 100

    // Générer le numéro
    const numero = await getNextNumero(annee)

    // Créer la facture
    const { data: facture, error: factureErr } = await supabaseAdmin
      .from('comptabilite_factures')
      .insert({
        numero,
        annee,
        type:             'vente',
        source:           params.source,
        source_id:        params.source_id || null,
        client_nom:       params.client_nom,
        client_email:     params.client_email || null,
        client_telephone: params.client_telephone || null,
        client_adresse:   params.client_adresse || null,
        date_facture:     params.date_facture || now.toISOString().split('T')[0],
        montant_ht,
        taux_tva,
        montant_tva,
        montant_ttc,
        moyen_paiement:   params.moyen_paiement || null,
        statut_paiement:  params.statut_paiement || 'paye',
        statut:           'emise',
        notes:            params.notes || null,
      })
      .select('id')
      .single()

    if (factureErr || !facture) {
      console.error('Erreur création facture:', factureErr)
      return null
    }

    // Créer les lignes
    const lignesInsert = lignesCalculees.map(l => ({
      facture_id:    facture.id,
      position:      l.position,
      designation:   l.designation,
      description:   l.description || null,
      quantite:      l.quantite,
      unite:         l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva:      l.taux_tva,
      montant_ht:    l.montant_ht,
      montant_tva:   l.montant_tva,
      montant_ttc:   l.montant_ttc,
    }))

    await supabaseAdmin.from('comptabilite_factures_lignes').insert(lignesInsert)

    return facture.id
  } catch (e) {
    console.error('Erreur creerFacture:', e)
    return null
  }
}

// ── Facture depuis achat pack ────────────────────────────────
export async function factureDepuisPack(pack: {
  id: string
  code: string
  pack_label: string
  montant: number
  heures_total: number
  acheteur_nom?: string
  acheteur_email?: string
  payment_method?: string
  eleve_nom?: string
  eleve_email?: string
  created_at?: string
}) {
  const client_nom   = pack.acheteur_nom || pack.eleve_nom || 'Client'
  const client_email = pack.acheteur_email || pack.eleve_email

  return creerFacture({
    source:          'pack',
    source_id:       pack.id,
    client_nom,
    client_email,
    date_facture:    pack.created_at?.split('T')[0],
    moyen_paiement:  pack.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   `${pack.pack_label || 'Pack de cours de piano'}`,
      description:   `${pack.heures_total}h de cours de piano en ligne — Code : ${pack.code}`,
      quantite:      1,
      unite:         'forfait',
      prix_unitaire: pack.montant,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis bon cadeau ────────────────────────────────
export async function factureDepuisCadeau(cadeau: {
  id: string
  code: string
  montant: number
  acheteur_nom: string
  acheteur_email: string
  destinataire_nom: string
  formule_label?: string
  payment_method?: string
  created_at?: string
}) {
  return creerFacture({
    source:          'cadeau',
    source_id:       cadeau.id,
    client_nom:      cadeau.acheteur_nom,
    client_email:    cadeau.acheteur_email,
    date_facture:    cadeau.created_at?.split('T')[0],
    moyen_paiement:  cadeau.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   `Bon cadeau — ${cadeau.formule_label || 'Cours de piano'}`,
      description:   `Pour : ${cadeau.destinataire_nom} — Code : ${cadeau.code}`,
      quantite:      1,
      unite:         'forfait',
      prix_unitaire: cadeau.montant,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis cours payant (sans pack) ──────────────────
export async function factureDepuisCours(reservation: {
  id: string
  slot_start: string
  amount: number
  payment_method?: string
  eleve_nom?: string
  eleve_email?: string
  client_nom?: string
  client_email?: string
}) {
  const date = new Date(reservation.slot_start)
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return creerFacture({
    source:          'cours',
    source_id:       reservation.id,
    client_nom:      reservation.eleve_nom || reservation.client_nom || 'Client',
    client_email:    reservation.eleve_email || reservation.client_email,
    date_facture:    reservation.slot_start?.split('T')[0],
    moyen_paiement:  reservation.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   'Cours de piano individuel — 1 heure',
      description:   `Cours du ${dateStr} via Zoom`,
      quantite:      1,
      unite:         'heure',
      prix_unitaire: reservation.amount,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis événement ─────────────────────────────────
export async function factureDepuisEvenement(resa: {
  id: string
  event_title?: string
  amount: number
  payment_method?: string
  nom?: string
  email?: string
  created_at?: string
}) {
  return creerFacture({
    source:          'evenement',
    source_id:       resa.id,
    client_nom:      resa.nom || 'Client',
    client_email:    resa.email,
    date_facture:    resa.created_at?.split('T')[0],
    moyen_paiement:  resa.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   resa.event_title || 'Événement musical',
      description:   'Participation à un atelier ou masterclass en ligne',
      quantite:      1,
      unite:         'forfait',
      prix_unitaire: resa.amount,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis support pédagogique ───────────────────────
export async function factureDepuisSupport(achat: {
  id: string
  montant: number
  payment_method?: string
  acheteur_nom?: string
  acheteur_email?: string
  support_titre?: string
  created_at?: string
}) {
  return creerFacture({
    source:          'support',
    source_id:       achat.id,
    client_nom:      achat.acheteur_nom || 'Client',
    client_email:    achat.acheteur_email,
    date_facture:    achat.created_at?.split('T')[0],
    moyen_paiement:  achat.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   achat.support_titre || 'Support pédagogique',
      description:   'Ressource pédagogique numérique',
      quantite:      1,
      unite:         'unité',
      prix_unitaire: achat.montant,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis ressource premium ────────────────────────
export async function factureDepuisRessource(achat: {
  id: string
  montant: number
  payment_method?: string
  acheteur_nom?: string
  acheteur_email?: string
  ressource_titre?: string
  created_at?: string
}) {
  return creerFacture({
    source:          'ressource',
    source_id:       achat.id,
    client_nom:      achat.acheteur_nom || 'Client',
    client_email:    achat.acheteur_email,
    date_facture:    achat.created_at?.split('T')[0],
    moyen_paiement:  achat.payment_method || 'stripe',
    statut_paiement: 'paye',
    lignes: [{
      designation:   achat.ressource_titre || 'Ressource premium',
      description:   'Accès à une ressource pédagogique premium',
      quantite:      1,
      unite:         'unité',
      prix_unitaire: achat.montant,
      taux_tva:      0,
    }],
  })
}

// ── Facture depuis location ──────────────────────────────────
export async function factureDepuisLocation(resa: {
  id: string
  article_nom: string
  montant_total: number
  montant_acompte?: number
  est_acompte?: boolean
  moyen_paiement?: string
  locataire_nom: string
  locataire_email?: string
  date_debut: string
  date_fin: string
  nb_jours?: number
  created_at?: string
}) {
  const montant = resa.est_acompte && resa.montant_acompte
    ? resa.montant_acompte
    : resa.montant_total

  const designation = resa.est_acompte
    ? `Acompte 50% — Location ${resa.article_nom}`
    : `Location ${resa.article_nom}`

  return creerFacture({
    source:          'location',
    source_id:       resa.id,
    client_nom:      resa.locataire_nom,
    client_email:    resa.locataire_email,
    date_facture:    resa.created_at?.split('T')[0],
    moyen_paiement:  resa.moyen_paiement || 'virement',
    statut_paiement: 'paye',
    lignes: [{
      designation,
      description:   `Du ${new Date(resa.date_debut).toLocaleDateString('fr-FR')} au ${new Date(resa.date_fin).toLocaleDateString('fr-FR')} (${resa.nb_jours || '?'} jour(s))`,
      quantite:      1,
      unite:         'forfait',
      prix_unitaire: montant,
      taux_tva:      0,
    }],
  })
}

// ── Vérifier si une facture existe déjà pour une source ──────
export async function factureExistePour(source: string, source_id: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('id')
    .eq('source', source)
    .eq('source_id', source_id)
    .single()
  return !!data
}
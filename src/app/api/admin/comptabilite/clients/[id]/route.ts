import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — fiche client complète
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const email = decodeURIComponent(params.id)

  // Chercher l'élève par email
  const { data: eleve } = await supabaseAdmin
    .from('eleves')
    .select('*')
    .eq('email', email)
    .single()

  // Chercher les inscriptions
  const { data: inscriptions } = await supabaseAdmin
    .from('inscriptions')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })

  // Chercher les factures
  const { data: factures } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('id, numero, date_facture, montant_ttc, source, statut_paiement, moyen_paiement, client_nom, client_telephone, client_adresse')
    .eq('client_email', email)
    .neq('statut', 'annulee')
    .order('date_facture', { ascending: false })

  // Chercher les packs
  const { data: packs } = await supabaseAdmin
    .from('course_packs')
    .select('id, code, pack_label, heures_total, heures_restantes, montant, status, created_at, acheteur_nom, acheteur_email')
    .eq('acheteur_email', email)
    .order('created_at', { ascending: false })

  // Chercher les locations
  const { data: locations } = await supabaseAdmin
    .from('location_reservations')
    .select('id, article_nom, date_debut, date_fin, montant_total, statut, paiement_statut, created_at')
    .eq('locataire_email', email)
    .order('created_at', { ascending: false })

  // Chercher les réservations de cours
  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('id, slot_start, amount, status, payment_method, type, student_phone, student_name')
    .eq('email', email)
    .order('slot_start', { ascending: false })
    .limit(10)

  // Calculer les stats
  const caTotal = (factures || []).reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const nbFactures = (factures || []).length

  // Récupérer infos depuis reservations si pas dans eleves
  const resaInfos = (reservations || [])[0]
  const packInfos = (packs || [])[0]

  // Construire la fiche client — chercher dans toutes les sources
  const fiche = {
    email,
    nom:         eleve ? `${eleve.prenom || ''} ${eleve.nom || ''}`.trim()
                 : (factures?.[0]?.client_nom || packInfos?.acheteur_nom || resaInfos?.student_name || email),
    telephone:   eleve?.telephone || factures?.[0]?.client_telephone || resaInfos?.student_phone || null,
    adresse:     eleve?.adresse || factures?.[0]?.client_adresse || null,
    ville:       eleve?.ville || null,
    code_postal: eleve?.code_postal || null,
    est_eleve:   !!eleve,
    eleve_id:    eleve?.id || null,
    is_active:   eleve?.is_active || false,
    created_at:  eleve?.created_at || inscriptions?.[0]?.created_at || factures?.[0]?.date_facture,
    stats: {
      ca_total:    Math.round(caTotal * 100) / 100,
      nb_factures: nbFactures,
      nb_packs:    (packs || []).length,
      nb_locations: (locations || []).length,
      nb_cours:    (reservations || []).length,
    },
    eleve,
    inscriptions: inscriptions || [],
    factures:     factures || [],
    packs:        packs || [],
    locations:    locations || [],
    reservations: reservations || [],
  }

  return NextResponse.json(fiche)
}

// PATCH — modifier la fiche client (infos élève)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const email = decodeURIComponent(params.id)
  const body  = await req.json()

  // Mettre à jour l'élève si existant
  const { data: eleve } = await supabaseAdmin
    .from('eleves')
    .select('id')
    .eq('email', email)
    .single()

  if (eleve) {
    const { error } = await supabaseAdmin
      .from('eleves')
      .update({
        prenom:      body.prenom || null,
        nom:         body.nom || null,
        telephone:   body.telephone || null,
        adresse:     body.adresse || null,
        ville:       body.ville || null,
        code_postal: body.code_postal || null,
      })
      .eq('id', eleve.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mettre à jour le nom dans les factures si changé
  if (body.nom_complet) {
    await supabaseAdmin
      .from('comptabilite_factures')
      .update({ client_nom: body.nom_complet, client_telephone: body.telephone || null })
      .eq('client_email', email)
  }

  return NextResponse.json({ success: true })
}
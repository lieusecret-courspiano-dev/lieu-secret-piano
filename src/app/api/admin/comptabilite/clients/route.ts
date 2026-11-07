import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — liste consolidée des clients depuis élèves + factures
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  // 1. Récupérer les élèves
  const { data: eleves } = await supabaseAdmin
    .from('eleves')
    .select('id, prenom, nom, email, telephone, created_at, is_active')
    .order('nom', { ascending: true })

  // 2. Récupérer les factures groupées par email client
  const { data: factures } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('id, client_nom, client_email, montant_ttc, date_facture, statut_paiement, source')
    .neq('statut', 'annulee')
    .order('date_facture', { ascending: false })

  // 3. Consolider les clients
  const clientsMap = new Map<string, {
    id: string
    nom: string
    email: string
    telephone: string | null
    est_eleve: boolean
    eleve_id: string | null
    is_active: boolean
    nb_factures: number
    ca_total: number
    derniere_facture: string | null
    sources: string[]
    created_at: string
  }>()

  // Ajouter les élèves
  for (const e of eleves || []) {
    const email = e.email?.toLowerCase() || `eleve-${e.id}`
    clientsMap.set(email, {
      id:               email,
      nom:              `${e.prenom || ''} ${e.nom || ''}`.trim() || e.email,
      email:            e.email || '',
      telephone:        e.telephone || null,
      est_eleve:        true,
      eleve_id:         e.id,
      is_active:        e.is_active || false,
      nb_factures:      0,
      ca_total:         0,
      derniere_facture: null,
      sources:          [],
      created_at:       e.created_at,
    })
  }

  // Enrichir avec les factures
  for (const f of factures || []) {
    const email = f.client_email?.toLowerCase() || ''
    if (!email) continue

    if (clientsMap.has(email)) {
      const c = clientsMap.get(email)!
      c.nb_factures++
      c.ca_total += f.montant_ttc || 0
      if (!c.derniere_facture || f.date_facture > c.derniere_facture) {
        c.derniere_facture = f.date_facture
      }
      if (f.source && !c.sources.includes(f.source)) c.sources.push(f.source)
    } else {
      // Client sans espace élève
      clientsMap.set(email, {
        id:               email,
        nom:              f.client_nom || email,
        email,
        telephone:        null,
        est_eleve:        false,
        eleve_id:         null,
        is_active:        false,
        nb_factures:      1,
        ca_total:         f.montant_ttc || 0,
        derniere_facture: f.date_facture,
        sources:          f.source ? [f.source] : [],
        created_at:       f.date_facture,
      })
    }
  }

  let clients = Array.from(clientsMap.values())
    .sort((a, b) => b.ca_total - a.ca_total)

  // Filtrer par recherche
  if (search) {
    const q = search.toLowerCase()
    clients = clients.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  }

  // Stats globales
  const stats = {
    total_clients:  clients.length,
    total_eleves:   clients.filter(c => c.est_eleve).length,
    ca_total:       Math.round(clients.reduce((s, c) => s + c.ca_total, 0) * 100) / 100,
    nb_factures:    clients.reduce((s, c) => s + c.nb_factures, 0),
  }

  return NextResponse.json({ clients, stats })
}
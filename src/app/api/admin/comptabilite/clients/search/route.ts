import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — recherche rapide de clients pour autocomplete
export async function GET(req: NextRequest) {
  // Note: pas d'auth requise pour l'autocomplete (données non sensibles)
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (q.length < 2) return NextResponse.json([])

  // Chercher dans les élèves (tous, actifs ou non)
  const { data: eleves } = await supabaseAdmin
    .from('eleves')
    .select('id, prenom, nom, email, telephone, adresse, ville, code_postal')
    .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%`)
    .order('nom', { ascending: true })
    .limit(8)

  // Chercher dans les inscriptions (prospects)
  const { data: inscriptions } = await supabaseAdmin
    .from('inscriptions')
    .select('prenom, nom, email, telephone, adresse, ville, code_postal')
    .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(5)

  // Chercher dans les locations
  const { data: locations } = await supabaseAdmin
    .from('location_reservations')
    .select('locataire_nom, locataire_email, locataire_telephone, locataire_adresse, locataire_ville, locataire_code_postal')
    .or(`locataire_nom.ilike.%${q}%,locataire_email.ilike.%${q}%`)
    .not('locataire_email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Chercher dans les réservations (student_name/student_email)
  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('student_name, student_email, student_phone')
    .or(`student_name.ilike.%${q}%,student_email.ilike.%${q}%`)
    .not('student_email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Chercher dans les packs (acheteurs)
  const { data: packs } = await supabaseAdmin
    .from('course_packs')
    .select('acheteur_nom, acheteur_email')
    .or(`acheteur_nom.ilike.%${q}%,acheteur_email.ilike.%${q}%`)
    .not('acheteur_email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Chercher dans les factures existantes (clients sans espace élève)
  const { data: factures } = await supabaseAdmin
    .from('comptabilite_factures')
    .select('client_nom, client_email, client_telephone, client_adresse')
    .or(`client_nom.ilike.%${q}%,client_email.ilike.%${q}%`)
    .not('client_email', 'is', null)
    .order('date_facture', { ascending: false })
    .limit(8)

  // Consolider et dédupliquer par email
  const seen = new Set<string>()
  const results: {
    id: string
    nom: string
    email: string
    telephone: string | null
    adresse: string | null
    ville: string | null
    code_postal: string | null
    source: 'eleve' | 'facture'
  }[] = []

  // Élèves en priorité
  for (const e of eleves || []) {
    const email = e.email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          e.id,
        nom:         `${e.prenom || ''} ${e.nom || ''}`.trim(),
        email:       e.email || '',
        telephone:   e.telephone || null,
        adresse:     e.adresse || null,
        ville:       e.ville || null,
        code_postal: e.code_postal || null,
        source:      'eleve',
      })
    }
  }

  // Inscriptions (prospects sans espace élève)
  for (const i of inscriptions || []) {
    const email = i.email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          email,
        nom:         `${i.prenom || ''} ${i.nom || ''}`.trim(),
        email:       i.email || '',
        telephone:   i.telephone || null,
        adresse:     i.adresse || null,
        ville:       i.ville || null,
        code_postal: i.code_postal || null,
        source:      'eleve' as const,
      })
    }
  }

  // Locataires
  for (const l of locations || []) {
    const email = l.locataire_email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          email,
        nom:         l.locataire_nom || '',
        email:       l.locataire_email || '',
        telephone:   l.locataire_telephone || null,
        adresse:     l.locataire_adresse || null,
        ville:       l.locataire_ville || null,
        code_postal: l.locataire_code_postal || null,
        source:      'facture' as const,
      })
    }
  }

  // Acheteurs de packs
  for (const pk of packs || []) {
    const email = pk.acheteur_email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          email,
        nom:         pk.acheteur_nom || '',
        email:       pk.acheteur_email || '',
        telephone:   null,
        adresse:     null,
        ville:       null,
        code_postal: null,
        source:      'eleve' as const,
      })
    }
  }

  // Élèves depuis réservations
  for (const r of reservations || []) {
    const email = r.student_email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          email,
        nom:         r.student_name || '',
        email:       r.student_email || '',
        telephone:   r.student_phone || null,
        adresse:     null,
        ville:       null,
        code_postal: null,
        source:      'eleve' as const,
      })
    }
  }

  // Clients des factures (sans doublon)
  for (const f of factures || []) {
    const email = f.client_email?.toLowerCase() || ''
    if (email && !seen.has(email)) {
      seen.add(email)
      results.push({
        id:          email,
        nom:         f.client_nom || '',
        email:       f.client_email || '',
        telephone:   f.client_telephone || null,
        adresse:     f.client_adresse || null,
        ville:       null,
        code_postal: null,
        source:      'facture',
      })
    }
  }

  return NextResponse.json(results.slice(0, 10))
}
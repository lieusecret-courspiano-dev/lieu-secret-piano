import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET — recherche rapide de clients pour autocomplete
export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json([]) // Retourner vide si non connecté

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
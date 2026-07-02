import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: eleves } = await supabaseAdmin.from('eleves').select('id, email, prenom, nom, telephone, is_active, created_at, setup_token').order('created_at', { ascending: false })
  
  // Enrichir avec le nombre de packs et réservations par email
  const data = await Promise.all((eleves || []).map(async (eleve) => {
    const email = eleve.email?.toLowerCase() || ''
    const [{ count: nbPacks }, { count: nbResa }] = await Promise.all([
      supabaseAdmin.from('course_packs').select('*', { count: 'exact', head: true }).or(`eleve_id.eq.${eleve.id},acheteur_email.eq.${email}`).eq('status', 'active'),
      supabaseAdmin.from('reservations').select('*', { count: 'exact', head: true }).or(`eleve_id.eq.${eleve.id},student_email.eq.${email}`).eq('status', 'confirmed'),
    ])
    return { ...eleve, nb_packs_actifs: nbPacks || 0, nb_reservations: nbResa || 0, compte_cree: !eleve.setup_token }
  }))
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { prenom, nom, email, telephone } = await req.json()
    if (!prenom || !nom || !email) return NextResponse.json({ error: 'Prénom, nom et email requis' }, { status: 400 })

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabaseAdmin
      .from('eleves')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      // Compte déjà existant — renvoyer l'email de bienvenue
      const { generateToken, sendEleveWelcomeEmail } = await import('@/lib/eleve-auth')
      const setupToken = generateToken()
      const setupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await supabaseAdmin.from('eleves').update({ setup_token: setupToken, setup_expires: setupExpires.toISOString() }).eq('id', existing.id)
      await sendEleveWelcomeEmail(email.toLowerCase().trim(), prenom, setupToken)
      return NextResponse.json({ success: true, id: existing.id, message: 'Email de bienvenue renvoyé' })
    }

    // Créer le nouveau compte
    const { generateToken, sendEleveWelcomeEmail } = await import('@/lib/eleve-auth')
    const setupToken = generateToken()
    const setupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { data: newEleve, error } = await supabaseAdmin.from('eleves').insert({
      email: email.toLowerCase().trim(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone?.trim() || null,
      setup_token: setupToken,
      setup_expires: setupExpires.toISOString(),
      is_active: true,
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Envoyer l'email de bienvenue
    try {
      await sendEleveWelcomeEmail(email.toLowerCase().trim(), prenom.trim(), setupToken)
      console.log(`[admin/eleves POST] Email bienvenue envoyé à ${email}`)
    } catch (emailErr) {
      console.error('[admin/eleves POST] Erreur email:', emailErr)
      // Le compte est créé même si l'email échoue — on retourne un avertissement
      return NextResponse.json({ success: true, id: newEleve.id, message: 'Compte créé mais erreur email: ' + (emailErr instanceof Error ? emailErr.message : 'Erreur inconnue'), emailError: true })
    }

    return NextResponse.json({ success: true, id: newEleve.id, message: 'Compte créé et email envoyé' })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}

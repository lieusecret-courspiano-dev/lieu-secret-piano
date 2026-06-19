import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const results: { type: string; label: string; sub?: string; href: string; icon?: string }[] = []

  try {
    // Recherche élèves
    const { data: eleves } = await supabaseAdmin
      .from('eleves')
      .select('id, prenom, nom, email')
      .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5)

    if (eleves) {
      eleves.forEach(e => results.push({
        type: 'Élève',
        label: `${e.prenom} ${e.nom}`,
        sub: e.email,
        href: `/admin/eleves/${e.id}`,
        icon: '👤',
      }))
    }

    // Recherche réservations
    const { data: reservations } = await supabaseAdmin
      .from('reservations')
      .select('id, student_name, student_email, type, created_at')
      .or(`student_name.ilike.%${q}%,student_email.ilike.%${q}%`)
      .limit(5)

    if (reservations) {
      reservations.forEach(r => results.push({
        type: 'Réservation',
        label: r.student_name,
        sub: r.student_email,
        href: `/admin/reservations`,
        icon: '📅',
      }))
    }

    // Recherche packs
    const { data: packs } = await supabaseAdmin
      .from('packs_cours')
      .select('id, code_pk, eleve_email, eleve_nom, formule')
      .or(`code_pk.ilike.%${q}%,eleve_email.ilike.%${q}%,eleve_nom.ilike.%${q}%`)
      .limit(5)

    if (packs) {
      packs.forEach(p => results.push({
        type: 'Pack',
        label: `${p.code_pk} — ${p.eleve_nom || p.eleve_email}`,
        sub: p.formule,
        href: `/admin/packs`,
        icon: '📦',
      }))
    }

    // Recherche bons cadeaux
    const { data: cadeaux } = await supabaseAdmin
      .from('bons_cadeaux')
      .select('id, code, acheteur_email, acheteur_nom')
      .or(`code.ilike.%${q}%,acheteur_email.ilike.%${q}%,acheteur_nom.ilike.%${q}%`)
      .limit(3)

    if (cadeaux) {
      cadeaux.forEach(c => results.push({
        type: 'Bon cadeau',
        label: `${c.code} — ${c.acheteur_nom || c.acheteur_email}`,
        sub: c.acheteur_email,
        href: `/admin/cadeaux`,
        icon: '🎁',
      }))
    }

    // Recherche quiz
    const { data: quiz } = await supabaseAdmin
      .from('quiz')
      .select('id, titre, niveau')
      .ilike('titre', `%${q}%`)
      .limit(3)

    if (quiz) {
      quiz.forEach(qz => results.push({
        type: 'Quiz',
        label: qz.titre,
        sub: qz.niveau,
        href: `/admin/quiz`,
        icon: '❓',
      }))
    }

    // Recherche supports pédagogiques
    const { data: supports } = await supabaseAdmin
      .from('supports_pedagogiques')
      .select('id, titre, niveau')
      .ilike('titre', `%${q}%`)
      .limit(3)

    if (supports) {
      supports.forEach(s => results.push({
        type: 'Support',
        label: s.titre,
        sub: s.niveau,
        href: `/admin/supports`,
        icon: '📚',
      }))
    }

  } catch (err) {
    console.error('Search error:', err)
  }

  return NextResponse.json(results.slice(0, 15))
}
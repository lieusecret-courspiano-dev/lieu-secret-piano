import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

const SYLLABUS_ORDER = ['Fondamentaux', 'Compréhension et autonomie', 'Expression et maîtrise']

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const [compRes, progRes, certRes] = await Promise.all([
    supabaseAdmin.from('competences').select('*').order('niveau').order('ordre'),
    supabaseAdmin.from('eleve_progression').select('*').eq('eleve_id', eleve.id),
    supabaseAdmin.from('certificats').select('type_certificat, nom, numero, created_at').eq('eleve_id', eleve.id),
  ])

  const competences = compRes.data || []
  const progression = progRes.data || []
  const certificats = certRes.data || []

  // Organiser par catégorie dans l'ordre du syllabus
  const categoriesMap: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const comp of competences) {
    if (!categoriesMap[comp.categorie]) categoriesMap[comp.categorie] = []
    const prog = progression.find(p => p.competence === comp.nom)
    categoriesMap[comp.categorie].push({
      competence: comp.nom,
      validee: prog?.validee || false,
      validee_at: prog?.validee_at || null,
    })
  }

  const allCats = Array.from(new Set(competences.map((c: { categorie: string }) => c.categorie)))
  const sortedCats = [...SYLLABUS_ORDER.filter(c => allCats.includes(c)), ...allCats.filter(c => !SYLLABUS_ORDER.includes(c))]
  const categories: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const cat of sortedCats) { if (categoriesMap[cat]) categories[cat] = categoriesMap[cat] }

  // Stats par catégorie
  const statsParCategorie: Record<string, { total: number; validees: number; pourcentage: number; certificat: boolean }> = {}
  for (const cat of sortedCats) {
    const items = categoriesMap[cat] || []
    const v = items.filter(i => i.validee).length
    const t = items.length
    const hasCert = certificats.some(c =>
      (cat === 'Fondamentaux' && c.type_certificat === 'fondamentaux') ||
      (cat === 'Compréhension et autonomie' && c.type_certificat === 'comprehension') ||
      (cat === 'Expression et maîtrise' && c.type_certificat === 'expression')
    )
    statsParCategorie[cat] = { total: t, validees: v, pourcentage: t > 0 ? Math.round((v / t) * 100) : 0, certificat: hasCert }
  }

  const total = competences.length
  const validees = progression.filter(p => p.validee).length
  const diplome = certificats.find(c => c.type_certificat === 'diplome_final') || null

  return NextResponse.json({
    categories,
    statsParCategorie,
    total,
    validees,
    pourcentage: total > 0 ? Math.round((validees / total) * 100) : 0,
    certificats,
    diplome,
  })
}
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const [compRes, progRes] = await Promise.all([
    supabaseAdmin.from('competences').select('*').eq('is_active', true).order('categorie').order('ordre'),
    supabaseAdmin.from('eleve_progression').select('*').eq('eleve_id', eleve.id),
  ])
  const competences = compRes.data || []
  const progression = progRes.data || []
  const ORDRE = ['Fondamentaux', 'Accompagnement', 'Oreille musicale', 'Improvisation']
  const categoriesMap: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const comp of competences) {
    if (!categoriesMap[comp.categorie]) categoriesMap[comp.categorie] = []
    const prog = progression.find(p => p.competence === comp.nom)
    categoriesMap[comp.categorie].push({ competence: comp.nom, validee: prog?.validee || false, validee_at: prog?.validee_at || null })
  }
  const allCats = Array.from(new Set(competences.map(c => c.categorie)))
  const sortedCats = [...ORDRE.filter(c => allCats.includes(c)), ...allCats.filter(c => !ORDRE.includes(c))]
  const categories: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]> = {}
  for (const cat of sortedCats) { if (categoriesMap[cat]) categories[cat] = categoriesMap[cat] }
  const total = competences.length
  const validees = progression.filter(p => p.validee).length
  return NextResponse.json({ categories, total, validees, pourcentage: total > 0 ? Math.round((validees / total) * 100) : 0 })
}

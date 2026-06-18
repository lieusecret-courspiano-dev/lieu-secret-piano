import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { data } = await supabaseAdmin.from('eleve_journal').select('*').eq('eleve_id', eleve.id).order('date_pratique', { ascending: false }).limit(90)
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const body = await req.json()
  if (!body.duree_min || body.duree_min < 1) return NextResponse.json({ error: 'Durée invalide' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('eleve_journal').insert({ ...body, eleve_id: eleve.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour le total d'heures et le streak
  try {
    const { data: eleve_data } = await supabaseAdmin.from('eleves').select('total_heures_pratique, streak_semaines, streak_derniere_semaine').eq('id', eleve.id).single()
    const totalMin = (eleve_data?.total_heures_pratique || 0) * 60 + body.duree_min
    const now = new Date()
    const weekNum = `${now.getFullYear()}-${String(Math.ceil((now.getDate() - now.getDay() + 1) / 7)).padStart(2, '0')}`
    const lastWeek = eleve_data?.streak_derniere_semaine
    let streak = eleve_data?.streak_semaines || 0
    if (lastWeek !== weekNum) {
      const lastWeekDate = lastWeek ? new Date(lastWeek.split('-')[0] + '-01-01') : null
      const isConsecutive = lastWeekDate && (now.getTime() - lastWeekDate.getTime()) < 14 * 24 * 60 * 60 * 1000
      streak = isConsecutive ? streak + 1 : 1
    }
    await supabaseAdmin.from('eleves').update({ total_heures_pratique: Math.floor(totalMin / 60), streak_semaines: streak, streak_derniere_semaine: weekNum }).eq('id', eleve.id)

    // Vérifier badges
    await checkAndAwardBadges(eleve.id, Math.floor(totalMin / 60), streak)
  } catch {}

  return NextResponse.json(data)
}

async function checkAndAwardBadges(eleveId: string, totalHeures: number, streak: number) {
  const badgesToCheck = [
    { key: 'premier_journal', nom: 'Premier pas', desc: 'Première entrée dans le journal de pratique', icon: '📝' },
    { key: 'pratique_10h', nom: '10 heures de pratique', desc: 'Vous avez pratiqué 10 heures au total', icon: '⏱️', condition: totalHeures >= 10 },
    { key: 'pratique_50h', nom: '50 heures de pratique', desc: 'Vous avez pratiqué 50 heures au total', icon: '🎯', condition: totalHeures >= 50 },
    { key: 'pratique_100h', nom: '100 heures de pratique', desc: 'Vous avez pratiqué 100 heures au total', icon: '🏆', condition: totalHeures >= 100 },
    { key: 'streak_4', nom: 'Régularité 1 mois', desc: '4 semaines consécutives de pratique', icon: '🔥', condition: streak >= 4 },
    { key: 'streak_12', nom: 'Régularité 3 mois', desc: '12 semaines consécutives de pratique', icon: '⚡', condition: streak >= 12 },
  ]

  for (const badge of badgesToCheck) {
    if (badge.condition === false) continue
    const { data: existing } = await supabaseAdmin.from('eleve_badges').select('id').eq('eleve_id', eleveId).eq('badge_key', badge.key).single()
    if (!existing) {
      await supabaseAdmin.from('eleve_badges').insert({ eleve_id: eleveId, badge_key: badge.key, badge_nom: badge.nom, badge_desc: badge.desc, badge_icon: badge.icon })
      await supabaseAdmin.from('eleve_notifications').insert({ eleve_id: eleveId, type: 'badge', titre: `Badge obtenu : ${badge.nom}`, message: badge.desc, lien: '/espace-eleve/badges' })
    }
  }
}

export async function DELETE(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const { id } = await req.json()
  await supabaseAdmin.from('eleve_journal').delete().eq('id', id).eq('eleve_id', eleve.id)
  return NextResponse.json({ success: true })
}

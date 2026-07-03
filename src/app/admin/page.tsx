'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

interface MonthlyData {
  month: string; label: string; reservations: number; inscriptions: number
  revenus: number; revenus_cours: number; revenus_cadeaux: number; revenus_packs: number
}
interface PopularHour { hour: number; label: string; count: number }
interface Totals {
  reservations: number; revenus: number; inscriptions: number
  gift_cards: number; packs: number; taux_conversion: number; total_cours: number
  eleves_total?: number; eleves_actifs?: number; essais_attente?: number
  parrainages_attente?: number; evenements?: number; temoignages_attente?: number
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-noir-900 border border-noir-700 rounded-lg p-3 shadow-xl">
      <p className="text-gold-400 text-xs font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name} : {typeof p.value === 'number' && p.name.includes('€') ? p.value.toFixed(2) + ' €' : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const pathname = usePathname()
  const [data, setData]       = useState<{ monthlyData: MonthlyData[]; popularHours: PopularHour[]; paymentMethods: Record<string, number>; totals: Totals } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'reservations' | 'revenus' | 'inscriptions'>('reservations')
  const [periode, setPeriode] = useState<'3m' | '6m' | '12m' | 'custom'>('6m')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1)
    return d.toISOString().split('T')[0].substring(0, 7) // yyyy-MM
  })
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0].substring(0, 7))

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Filtrer les données selon la période
  const filteredMonthlyData: MonthlyData[] = (() => {
    const all = data?.monthlyData || []
    if (periode === 'custom') {
      return all.filter(m => m.month >= customFrom && m.month <= customTo)
    }
    return all.slice(-(periode === '3m' ? 3 : periode === '6m' ? 6 : 12))
  })()

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="p-8 text-center text-noir-400">Erreur de chargement des données</div>
  )

  const { monthlyData, popularHours, paymentMethods, totals } = data

  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'virement' ? 'Virement' : name === 'stripe' ? 'Carte' : name === 'cadeau' ? 'Bon cadeau' : name === 'pack' ? 'Pack' : name === 'gratuit' ? 'Gratuit' : name,
    value,
  }))

  // Totaux calculés sur la période filtrée
  const filteredTotals = {
    reservations: filteredMonthlyData.reduce((s, m) => s + m.reservations, 0),
    revenus: filteredMonthlyData.reduce((s, m) => s + m.revenus, 0),
    inscriptions: filteredMonthlyData.reduce((s, m) => s + m.inscriptions, 0),
  }
  const periodeLabel = periode === '3m' ? '3 derniers mois' : periode === '6m' ? '6 derniers mois' : periode === '12m' ? '12 derniers mois' : `${customFrom} → ${customTo}`

  const statsCards = [
    { label: 'Cours réservés', value: filteredTotals.reservations, sub: periodeLabel, color: 'text-gold-400' },
    { label: 'Inscriptions', value: filteredTotals.inscriptions, sub: periodeLabel, color: 'text-blue-400' },
    { label: 'Élèves actifs', value: totals.eleves_actifs ?? 0, sub: `${totals.eleves_total ?? 0} au total`, color: 'text-green-400' },
    { label: 'Packs actifs', value: totals.packs, sub: 'créés sur la période', color: 'text-orange-400' },
    { label: 'Bons cadeaux', value: totals.gift_cards, sub: 'vendus sur la période', color: 'text-purple-400' },
    { label: 'Essais en attente', value: totals.essais_attente ?? 0, sub: 'à contacter', color: 'text-yellow-400' },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-white">Tableau de bord</h1>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Activité</a>
        <a href="/admin/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/dashboard' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Finances</a>
        </div>
        <p className="text-noir-400 text-sm mt-1">Vue d&apos;ensemble — {periodeLabel}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statsCards.map((s, i) => (
          <div key={i} className="card">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-white text-sm font-medium">{s.label}</div>
            <div className="text-noir-500 text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-white font-medium text-sm">Statistiques</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-noir-800 border border-noir-700 rounded-lg p-1">
            {(['3m', '6m', '12m', 'custom'] as const).map(p => (
              <button key={p} onClick={() => setPeriode(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${periode === p ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {p === '3m' ? '3 mois' : p === '6m' ? '6 mois' : p === '12m' ? '12 mois' : 'Période'}
              </button>
            ))}
          </div>
          {periode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="input py-1 px-2 text-xs w-36"
                max={customTo}
              />
              <span className="text-noir-500 text-xs">→</span>
              <input
                type="month"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="input py-1 px-2 text-xs w-36"
                min={customFrom}
                max={new Date().toISOString().split('T')[0].substring(0, 7)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Graphique principal */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-medium">Évolution mensuelle</h2>
          <div className="flex gap-1 bg-noir-800 rounded-lg p-1">
            {[
              { key: 'reservations', label: 'Cours' },
              { key: 'revenus', label: 'Revenus' },
              { key: 'inscriptions', label: 'Inscriptions' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveChart(tab.key as typeof activeChart)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === tab.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5c" />
            <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7070a0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={activeChart}
              name={activeChart === 'revenus' ? 'Revenus €' : activeChart === 'reservations' ? 'Cours' : 'Inscriptions'}
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#colorGold)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Revenus détaillés */}
        <div className="card">
          <h2 className="text-white font-medium mb-4">Revenus par source</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData.slice(-6)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5c" />
              <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7070a0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#a0a0c0' }} />
              <Bar dataKey="revenus_cours"   name="Cours €"   fill="#f59e0b" radius={[3,3,0,0]} />
              <Bar dataKey="revenus_packs"   name="Packs €"   fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="revenus_cadeaux" name="Cadeaux €" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Méthodes de paiement */}
        <div className="card">
          <h2 className="text-white font-medium mb-4">Méthodes de paiement</h2>
          {paymentData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-noir-500 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v + ' cours', '']} contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#a0a0c0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Heures populaires */}
      <div className="card mb-6">
        <h2 className="text-white font-medium mb-4">Créneaux les plus demandés</h2>
        {popularHours.length === 0 ? (
          <div className="text-center py-8 text-noir-500 text-sm">Aucune réservation pour le moment</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={popularHours} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5c" />
              <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7070a0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Cours" fill="#f59e0b" radius={[4,4,0,0]}>
                {popularHours.map((_, i) => <Cell key={i} fill={i === 0 ? '#f59e0b' : i === 1 ? '#fbbf24' : '#d97706'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/reservations', label: 'Réservations', count: totals.reservations },
          { href: '/admin/inscriptions', label: 'Inscriptions', count: totals.inscriptions },
          { href: '/admin/packs', label: 'Packs', count: totals.packs },
          { href: '/admin/cadeaux', label: 'Bons cadeaux', count: totals.gift_cards },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="card hover:border-gold-500/40 transition-colors text-center">
            <div className="text-xl font-bold text-gold-400 mb-1">{item.count}</div>
            <div className="text-noir-400 text-xs">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
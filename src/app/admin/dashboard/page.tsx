'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'
import { Download } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

interface DashboardData {
  periode: { from: string; to: string }
  revenus: { total: number; packs: number; cadeaux: number; events: number; cb_direct: number; supports?: number; par_stripe: number; par_paypal: number; par_carte: number; par_virement: number }
  activite: { cours_confirmes: number; cours_avec_pack: number; heures_consommees: number; heures_restantes: number; eleves_actifs: number; inscriptions: number }
  comptabilite: { nb_transactions: number; nb_packs_vendus: number; nb_cadeaux_vendus: number; nb_events_vendus: number; montant_stripe: number; montant_paypal: number; montant_carte: number; montant_virement: number }
  monthlyData: { month: string; label: string; revenus: number; revenus_packs: number; revenus_cadeaux: number; revenus_events: number; revenus_cb: number; cours: number; packs_vendus: number; cadeaux_vendus: number }[]
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']

const SHORTCUTS = [
  { label: "Aujourd'hui",     getRange: () => { const d = DateTime.now().toFormat('yyyy-MM-dd'); return { from: d, to: d } } },
  { label: 'Cette semaine',   getRange: () => ({ from: DateTime.now().startOf('week').toFormat('yyyy-MM-dd'), to: DateTime.now().endOf('week').toFormat('yyyy-MM-dd') }) },
  { label: 'Ce mois',        getRange: () => ({ from: DateTime.now().startOf('month').toFormat('yyyy-MM-dd'), to: DateTime.now().endOf('month').toFormat('yyyy-MM-dd') }) },
  { label: 'Mois précédent', getRange: () => ({ from: DateTime.now().minus({ months: 1 }).startOf('month').toFormat('yyyy-MM-dd'), to: DateTime.now().minus({ months: 1 }).endOf('month').toFormat('yyyy-MM-dd') }) },
  { label: 'Ce trimestre',   getRange: () => ({ from: DateTime.now().startOf('quarter').toFormat('yyyy-MM-dd'), to: DateTime.now().endOf('quarter').toFormat('yyyy-MM-dd') }) },
  { label: 'Cette année',    getRange: () => ({ from: DateTime.now().startOf('year').toFormat('yyyy-MM-dd'), to: DateTime.now().endOf('year').toFormat('yyyy-MM-dd') }) },
  { label: 'Année préc.',    getRange: () => ({ from: DateTime.now().minus({ years: 1 }).startOf('year').toFormat('yyyy-MM-dd'), to: DateTime.now().minus({ years: 1 }).endOf('year').toFormat('yyyy-MM-dd') }) },
  { label: '30 derniers j.', getRange: () => ({ from: DateTime.now().minus({ days: 30 }).toFormat('yyyy-MM-dd'), to: DateTime.now().toFormat('yyyy-MM-dd') }) },
  { label: '90 derniers j.', getRange: () => ({ from: DateTime.now().minus({ days: 90 }).toFormat('yyyy-MM-dd'), to: DateTime.now().toFormat('yyyy-MM-dd') }) },
]

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => DateTime.now().minus({ days: 90 }).toFormat('yyyy-MM-dd'))
  const [to, setTo]     = useState(() => DateTime.now().toFormat('yyyy-MM-dd'))
  const [activeShortcut, setActiveShortcut] = useState<string>('90 derniers j.')
  const [activeChart, setActiveChart] = useState<'revenus' | 'cours'>('revenus')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/dashboard?from=${from}&to=${to}`)
      const d = await res.json()
      setData(d)
    } catch {}
    finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { fetchData() }, [fetchData])

  function applyShortcut(s: typeof SHORTCUTS[0]) {
    const range = s.getRange()
    setFrom(range.from); setTo(range.to); setActiveShortcut(s.label)
  }

  function exportCSV() {
    if (!data) return
    const rows = [
      ['Période', `${from} → ${to}`], [''],
      ['REVENUS'], ['CA Total', data.revenus.total], ['Packs', data.revenus.packs],
      ['Bons cadeaux', data.revenus.cadeaux], ['Événements', data.revenus.events],
      ['CB direct', data.revenus.cb_direct], ['Par Stripe', data.revenus.par_stripe], ['Par PayPal', data.revenus.par_paypal],
      ['Par virement', data.revenus.par_virement], [''],
      ['ACTIVITÉ'], ['Cours confirmés', data.activite.cours_confirmes],
      ['Heures consommées', data.activite.heures_consommees],
      ['Heures restantes', data.activite.heures_restantes],
      ['Élèves actifs', data.activite.eleves_actifs], [''],
      ['COMPTABILITÉ'], ['Transactions', data.comptabilite.nb_transactions],
      ['Packs vendus', data.comptabilite.nb_packs_vendus],
      ['Bons cadeaux vendus', data.comptabilite.nb_cadeaux_vendus],
      ['Montant Stripe', data.comptabilite.montant_stripe], ['Montant PayPal', data.comptabilite.montant_paypal],
      ['Montant virement', data.comptabilite.montant_virement],
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `dashboard-${from}-${to}.csv`; a.click()
  }

  function exportExcel() {
    import('xlsx').then(XLSX => {
      if (!data) return
      const wb = XLSX.utils.book_new()
      const wsData = [
        ['Période', `${from} → ${to}`], [''],
        ['REVENUS', ''], ['CA Total', data.revenus.total], ['Packs', data.revenus.packs],
        ['Bons cadeaux', data.revenus.cadeaux], ['Événements', data.revenus.events],
        ['CB direct', data.revenus.cb_direct], ['Par Stripe', data.revenus.par_stripe], ['Par PayPal', data.revenus.par_paypal],
        ['Par virement', data.revenus.par_virement], [''],
        ['ACTIVITÉ', ''], ['Cours confirmés', data.activite.cours_confirmes],
        ['Heures consommées', data.activite.heures_consommees],
        ['Heures restantes', data.activite.heures_restantes],
        ['Élèves actifs', data.activite.eleves_actifs], [''],
        ['ÉVOLUTION MENSUELLE', ''],
        ['Mois', 'Revenus', 'Cours', 'Packs vendus', 'Cadeaux vendus'],
        ...data.monthlyData.map(m => [m.label, m.revenus, m.cours, m.packs_vendus, m.cadeaux_vendus]),
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard')
      XLSX.writeFile(wb, `dashboard-${from}-${to}.xlsx`)
    })
  }

  const pieData = data ? [
    { name: 'Packs', value: data.revenus.packs },
    { name: 'Bons cadeaux', value: data.revenus.cadeaux },
    { name: 'Événements', value: data.revenus.events },
    { name: 'CB direct', value: data.revenus.cb_direct },
    { name: 'Supports', value: data.revenus.supports || 0 },
  ].filter(d => d.value > 0) : []

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Dashboard financier</h1>
          <p className="text-noir-400 text-sm mt-1">Statistiques sans double comptabilisation</p>
        </div>
        {/* ── Onglets ── */}
        <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6 w-fit tab-switcher-admin">
          <a href="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Activité</a>
        <a href="/admin/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === '/admin/dashboard' ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>Finances</a>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> CSV</button>
          <button onClick={exportExcel} className="btn-outline text-sm flex items-center gap-1 px-3 py-2"><Download size={14} /> Excel</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <h2 className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-3">Période</h2>
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
          {SHORTCUTS.map(s => (
            <button key={s.label} onClick={() => applyShortcut(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeShortcut === s.label ? 'bg-gold-500 text-noir-950' : 'bg-noir-800 text-noir-400 hover:text-white hover:bg-noir-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <label className="text-noir-400 text-xs">Du</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setActiveShortcut('Personnalisé') }} className="input py-1.5 px-3 text-sm w-full sm:w-40" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-noir-400 text-xs">Au</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setActiveShortcut('Personnalisé') }} className="input py-1.5 px-3 text-sm w-full sm:w-40" min={from} />
          </div>
          <button onClick={fetchData} className="btn-gold px-4 py-1.5 text-sm">Appliquer</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : data ? (
        <>
          {/* Revenus */}
          <div className="mb-6">
            <h2 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-500 inline-block" /> Revenus encaissés
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
              {[
                { label: "Chiffre d'affaires", value: fmt(data.revenus.total), color: 'text-gold-400', border: 'border-gold-500/30' },
                { label: 'Packs vendus', value: fmt(data.revenus.packs), color: 'text-blue-400', border: '' },
                { label: 'Bons cadeaux', value: fmt(data.revenus.cadeaux), color: 'text-purple-400', border: '' },
                { label: 'Événements', value: fmt(data.revenus.events), color: 'text-green-400', border: '' },
              ].map((s, i) => (
                <div key={i} className={`card ${s.border}`}>
                  <div className={`text-xl font-bold ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-noir-500 text-xs uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="card"><div className="text-lg font-bold text-blue-400 mb-1">{fmt(data.revenus.par_stripe)}</div><div className="text-noir-500 text-xs uppercase">Stripe (carte)</div></div>
              <div className="card"><div className="text-lg font-bold text-indigo-400 mb-1">{fmt(data.revenus.par_paypal)}</div><div className="text-noir-500 text-xs uppercase">PayPal</div></div>
              <div className="card"><div className="text-lg font-bold text-green-400 mb-1">{fmt(data.revenus.par_virement)}</div><div className="text-noir-500 text-xs uppercase">Virement bancaire</div></div>
            </div>
          </div>

          {/* Activité pédagogique */}
          <div className="mb-6">
            <h2 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Activité pédagogique
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Cours confirmés', value: data.activite.cours_confirmes, color: 'text-gold-400' },
                { label: 'Heures consommées', value: data.activite.heures_consommees + 'h', color: 'text-blue-400' },
                { label: 'Heures restantes', value: data.activite.heures_restantes + 'h', color: 'text-green-400' },
                { label: 'Élèves actifs', value: data.activite.eleves_actifs, color: 'text-purple-400' },
              ].map((s, i) => (
                <div key={i} className="card">
                  <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-noir-500 text-xs uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé comptable */}
          <div className="card border-gold-500/20 mb-6">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Résumé comptable — URSSAF</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[
                { label: 'CA total', value: fmt(data.revenus.total) },
                { label: 'Transactions', value: data.comptabilite.nb_transactions },
                { label: 'Packs vendus', value: data.comptabilite.nb_packs_vendus },
                { label: 'Bons cadeaux vendus', value: data.comptabilite.nb_cadeaux_vendus },
                { label: 'Encaissé Stripe', value: fmt(data.comptabilite.montant_stripe) },
                { label: 'Encaissé PayPal', value: fmt(data.comptabilite.montant_paypal) },
                { label: 'Encaissé virement', value: fmt(data.comptabilite.montant_virement) },
              ].map((s, i) => (
                <div key={i} className="bg-noir-800 rounded-xl p-3">
                  <p className="text-noir-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-white font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Graphiques */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Évolution mensuelle</h2>
              <div className="flex gap-1 bg-noir-800 rounded-lg p-1">
                {[{ key: 'revenus', label: 'Revenus' }, { key: 'cours', label: 'Cours' }].map(tab => (
                  <button key={tab.key} onClick={() => setActiveChart(tab.key as typeof activeChart)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === tab.key ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
                <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#7070a0', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: 8 }} labelStyle={{ color: '#f59e0b' }} />
                <Area type="monotone" dataKey={activeChart === 'revenus' ? 'revenus' : 'cours'} stroke="#f59e0b" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="card">
                <h2 className="text-white font-medium mb-4">Répartition des revenus</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-white font-medium mb-4">Revenus par source</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.monthlyData.slice(-6)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
                    <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#7070a0', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: 8 }} />
                    <Bar dataKey="revenus_packs" name="Packs" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="revenus_cadeaux" name="Cadeaux" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="revenus_events" name="Événements" fill="#10b981" stackId="a" />
                    <Bar dataKey="revenus_cb" name="CB direct" fill="#8b5cf6" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-noir-400">Erreur de chargement</div>
      )}
    </div>
  )
}

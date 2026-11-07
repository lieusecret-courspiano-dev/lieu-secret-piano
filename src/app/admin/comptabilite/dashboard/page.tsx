'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, FileText, AlertCircle,
  CheckCircle, Clock, Euro, Download
} from 'lucide-react'

interface DashboardData {
  annee: number
  resume: {
    ca_total: number
    ca_encaisse: number
    ca_attente: number
    tva_collectee: number
    total_depenses: number
    resultat: number
    nb_factures: number
    nb_factures_payees: number
    nb_factures_attente: number
    seuil_ae: number
    pourcentage_seuil: number
  }
  ca_par_source: Record<string, number>
  ca_par_paiement: Record<string, number>
  depenses_par_categorie: Record<string, number>
  mensuel: {
    mois: string
    label: string
    ca: number
    encaisse: number
    depenses: number
    resultat: number
    nb_factures: number
  }[]
  dernieres_factures: {
    id: string
    numero: string
    client_nom: string
    montant_ttc: number
    date_facture: string
    statut_paiement: string
    source: string
  }[]
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4']

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Packs d\'heures',
  cours: 'Cours individuels',
  evenement: 'Événements',
  cadeau: 'Bons cadeaux',
  support: 'Supports péda.',
  ressource: 'Ressources premium',
  location: 'Location matériel',
  manuel: 'Saisie manuelle',
  import: 'Import Odoo',
  autre: 'Autre',
}

const PAIEMENT_LABELS: Record<string, string> = {
  stripe: 'Carte (Stripe)',
  paypal: 'PayPal',
  virement: 'Virement',
  especes: 'Espèces',
  cheque: 'Chèque',
  autre: 'Autre',
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ComptaDashboardPage() {
  const currentYear = new Date().getFullYear()
  const [annee, setAnnee] = useState(currentYear)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/comptabilite/dashboard?annee=${annee}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [annee])

  const annees = [currentYear, currentYear - 1, currentYear - 2].filter(a => a >= 2024)

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="p-8 text-center text-noir-400">Erreur de chargement</div>
  )

  const { resume, mensuel, ca_par_source, ca_par_paiement, dernieres_factures } = data

  const sourceData = Object.entries(ca_par_source)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  const paiementData = Object.entries(ca_par_paiement)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: PAIEMENT_LABELS[k] || k, value: Math.round(v * 100) / 100 }))

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Tableau de bord comptable</h1>
          <p className="text-noir-400 text-sm mt-1">Vue d'ensemble financière — {annee}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur année */}
          <div className="flex gap-1 bg-noir-900 border border-noir-800 rounded-xl p-1">
            {annees.map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  annee === a ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white'
                }`}>
                {a}
              </button>
            ))}
          </div>
          <Link href="/admin/comptabilite/export"
            className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
            <Download size={14} /> Export
          </Link>
        </div>
      </div>

      {/* Alerte seuil auto-entrepreneur */}
      {resume.pourcentage_seuil >= 80 && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl p-4 border ${
          resume.pourcentage_seuil >= 100
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              {resume.pourcentage_seuil >= 100
                ? '⚠️ Seuil auto-entrepreneur dépassé !'
                : `Attention — ${resume.pourcentage_seuil}% du seuil auto-entrepreneur atteint`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              CA {annee} : {fmt(resume.ca_total)} / Seuil : {fmt(resume.seuil_ae)}
              {resume.pourcentage_seuil < 100 && ` — Reste : ${fmt(resume.seuil_ae - resume.ca_total)}`}
            </p>
          </div>
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Chiffre d\'affaires',
            value: fmt(resume.ca_total),
            sub: `${resume.nb_factures} facture${resume.nb_factures > 1 ? 's' : ''}`,
            color: 'text-gold-400',
            border: 'border-gold-500/30',
            icon: <TrendingUp size={18} className="text-gold-400" />,
          },
          {
            label: 'Encaissé',
            value: fmt(resume.ca_encaisse),
            sub: `${resume.nb_factures_payees} payée${resume.nb_factures_payees > 1 ? 's' : ''}`,
            color: 'text-green-400',
            border: '',
            icon: <CheckCircle size={18} className="text-green-400" />,
          },
          {
            label: 'En attente',
            value: fmt(resume.ca_attente),
            sub: `${resume.nb_factures_attente} facture${resume.nb_factures_attente > 1 ? 's' : ''}`,
            color: 'text-amber-400',
            border: '',
            icon: <Clock size={18} className="text-amber-400" />,
          },
          {
            label: 'Résultat net',
            value: fmt(resume.resultat),
            sub: `Charges : ${fmt(resume.total_depenses)}`,
            color: resume.resultat >= 0 ? 'text-blue-400' : 'text-red-400',
            border: '',
            icon: resume.resultat >= 0
              ? <TrendingUp size={18} className="text-blue-400" />
              : <TrendingDown size={18} className="text-red-400" />,
          },
        ].map((kpi, i) => (
          <div key={i} className={`card ${kpi.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-noir-500 text-xs uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className={`text-2xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
            <div className="text-noir-600 text-xs">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Jauge seuil AE */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-medium text-sm">Seuil auto-entrepreneur {annee}</h2>
          <span className={`text-sm font-bold ${
            resume.pourcentage_seuil >= 100 ? 'text-red-400'
            : resume.pourcentage_seuil >= 80 ? 'text-amber-400'
            : 'text-green-400'
          }`}>
            {resume.pourcentage_seuil}%
          </span>
        </div>
        <div className="w-full bg-noir-800 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              resume.pourcentage_seuil >= 100 ? 'bg-red-500'
              : resume.pourcentage_seuil >= 80 ? 'bg-amber-500'
              : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(resume.pourcentage_seuil, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-noir-500">
          <span>{fmt(resume.ca_total)} encaissé</span>
          <span>Seuil : {fmt(resume.seuil_ae)}</span>
        </div>
      </div>

      {/* Graphique mensuel */}
      <div className="card mb-6">
        <h2 className="text-white font-medium mb-4">Évolution mensuelle {annee}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={mensuel} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
            <XAxis dataKey="label" tick={{ fill: '#7070a0', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7070a0', fontSize: 10 }} width={50} axisLine={false} tickLine={false}
              tickFormatter={v => v.toFixed(0) + '€'} />
            <Tooltip
              contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [fmt(Number(v) || 0), '']}
              labelStyle={{ color: '#f59e0b' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0c0' }} />
            <Bar dataKey="encaisse" name="Encaissé" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="resultat" name="Résultat" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* CA par source */}
        {sourceData.length > 0 && (
          <div className="card">
            <h2 className="text-white font-medium mb-4">CA par activité</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v) || 0)}
                  contentStyle={{ background: '#252540', border: '1px solid #3a3a5c', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#a0a0c0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CA par moyen de paiement */}
        {paiementData.length > 0 && (
          <div className="card">
            <h2 className="text-white font-medium mb-4">Encaissements par moyen de paiement</h2>
            <div className="space-y-3">
              {paiementData.sort((a, b) => b.value - a.value).map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-noir-300">{p.name}</span>
                    <span className="text-white font-medium">{fmt(p.value)}</span>
                  </div>
                  <div className="w-full bg-noir-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.round((p.value / resume.ca_encaisse) * 100)}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dernières factures */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Dernières factures</h2>
          <Link href="/admin/comptabilite/factures" className="text-gold-400 hover:text-gold-300 text-xs transition-colors">
            Voir toutes →
          </Link>
        </div>
        {dernieres_factures.length === 0 ? (
          <p className="text-noir-500 text-sm text-center py-4">Aucune facture pour {annee}</p>
        ) : (
          <div className="space-y-2">
            {dernieres_factures.map(f => (
              <Link key={f.id} href={`/admin/comptabilite/factures/${f.id}`}
                className="flex items-center justify-between gap-4 p-3 bg-noir-800 rounded-xl hover:bg-noir-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{f.numero}</p>
                    <p className="text-noir-400 text-xs">{f.client_nom} · {fDate(f.date_facture)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-semibold text-sm">{fmt(f.montant_ttc)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    f.statut_paiement === 'paye'
                      ? 'text-green-400 border-green-500/30 bg-green-500/10'
                      : f.statut_paiement === 'en_attente'
                      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : 'text-noir-400 border-noir-700'
                  }`}>
                    {f.statut_paiement === 'paye' ? 'Payée' : f.statut_paiement === 'en_attente' ? 'En attente' : f.statut_paiement}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/comptabilite/factures', label: 'Factures', icon: <FileText size={18} />, color: 'text-gold-400' },
          { href: '/admin/comptabilite/devis', label: 'Devis', icon: <FileText size={18} />, color: 'text-blue-400' },
          { href: '/admin/comptabilite/depenses', label: 'Dépenses', icon: <TrendingDown size={18} />, color: 'text-red-400' },
          { href: '/admin/comptabilite/export', label: 'Export', icon: <Download size={18} />, color: 'text-green-400' },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            className="card hover:border-gold-500/30 transition-colors text-center py-4">
            <div className={`${item.color} flex justify-center mb-2`}>{item.icon}</div>
            <div className="text-noir-300 text-sm">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

interface CatStats { total: number; validees: number; pourcentage: number; certificat: boolean }
interface ProgData {
  categories: Record<string, { competence: string; validee: boolean; validee_at: string | null }[]>
  statsParCategorie: Record<string, CatStats>
  total: number; validees: number; pourcentage: number
  certificats: { type_certificat: string; nom: string; numero: string; created_at: string }[]
  diplome: { nom: string; numero: string; created_at: string } | null
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  'Fondamentaux': <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="9" y="3" width="7" height="7" rx="1"/><rect x="2" y="10" width="7" height="7" rx="1"/><rect x="9" y="10" width="7" height="7" rx="1"/></svg>,
  'Compréhension et autonomie': <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  'Expression et maîtrise': <svg width="22" height="22" fill="none" stroke="#22c55e" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
}

const CAT_COLORS: Record<string, { bar: string; badge: string }> = {
  'Fondamentaux':                  { bar: '#3b82f6', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'   },
  'Compréhension et autonomie':    { bar: '#f59e0b', badge: 'bg-gold-500/10 text-gold-400 border-gold-500/20'   },
  'Expression et maîtrise':        { bar: '#22c55e', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
}

function ProgressBar({ value, color, height = 'h-3' }: { value: number; color: string; height?: string }) {
  return (
    <div className={`w-full bg-noir-800 rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full transition-all duration-700`} style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  )
}

export default function ProgressionPage() {
  const router = useRouter()
  const [data, setData] = useState<ProgData | null>(null)
  const [prenom, setPrenom] = useState('')
  const [nbMedias, setNbMedias] = useState(0)
  const [nbRessources, setNbRessources] = useState(0)
  const [nbTravaux, setNbTravaux] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openCat, setOpenCat] = useState<string | null>('Fondamentaux')

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/progression').then(r => r.json()),
      fetch('/api/partitions').then(r => r.json()),
      fetch('/api/eleve/ressources').then(r => r.json()),
      fetch('/api/eleve/travaux').then(r => r.json()),
    ]).then(([me, prog, medias, res, travaux]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setData(prog)
      setNbMedias(Array.isArray(medias) ? medias.length : 0)
      setNbRessources(Array.isArray(res) ? res.length : 0)
      setNbTravaux(Array.isArray(travaux) ? travaux.filter((t: { termine: boolean }) => !t.termine).length : 0)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const globalPct = data?.pourcentage || 0
  const globalColor = globalPct >= 66 ? '#22c55e' : globalPct >= 33 ? '#f59e0b' : '#3b82f6'

  return (
    <EleveLayout prenom={prenom} nbNotifs={0} nbMedias={nbMedias} nbRessources={nbRessources} nbTravaux={nbTravaux}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">

        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-white mb-1 animate-fade-in-up">Ma Progression</h1>
          <p className="text-noir-400 text-sm">Suivez votre avancement dans la formation Lieu Secret</p>
        </div>

        {/* Barre globale */}
        <div className="card border-gold-500/20 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">Progression générale</p>
              <p className="text-noir-400 text-sm">{data?.validees || 0} / {data?.total || 0} compétences validées</p>
            </div>
            <span className="text-4xl font-bold" style={{ color: globalColor }}>{globalPct}%</span>
          </div>
          <ProgressBar value={globalPct} color={globalColor} height="h-4" />

          {/* Stats par catégorie sous la barre globale */}
          {data?.statsParCategorie && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(data.statsParCategorie).map(([cat, stats]) => {
                const cfg = CAT_COLORS[cat] || { bar: '#f59e0b', badge: '', icon: 'notes' }
                return (
                  <div key={cat} className="bg-noir-800/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-noir-400 font-medium truncate">{cat}</span>
                      <span className="text-xs font-bold ml-2 shrink-0" style={{ color: cfg.bar }}>{stats.pourcentage}%</span>
                    </div>
                    <ProgressBar value={stats.pourcentage} color={cfg.bar} height="h-1.5" />
                    {stats.certificat && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-xs text-gold-400">Certificat obtenu</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Diplôme final */}
        {data?.diplome && (
          <div className="card border-gold-500 bg-gold-500/5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center shrink-0">
              <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
              <div>
                <p className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">Diplôme obtenu</p>
                <p className="text-white font-bold text-lg leading-tight">{data.diplome.nom}</p>
                <p className="text-noir-400 text-xs mt-0.5">N° {data.diplome.numero} — {new Date(data.diplome.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Catégories avec compétences */}
        <div className="space-y-4">
          {data?.categories && Object.entries(data.categories).map(([cat, items]) => {
            const cfg = CAT_COLORS[cat] || { bar: '#f59e0b', badge: 'bg-gold-500/10 text-gold-400 border-gold-500/20', icon: 'notes' }
            const stats = data.statsParCategorie?.[cat]
            const isOpen = openCat === cat
            const validees = items.filter(i => i.validee).length

            return (
              <div key={cat} className="card overflow-hidden">
                {/* Header catégorie */}
                <button
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{CAT_ICONS[cat] || <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-base leading-tight">{cat}</p>
                      <p className="text-noir-400 text-xs mt-0.5">{validees} / {items.length} compétences</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {stats?.certificat && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                        Certifié
                      </span>
                    )}
                    <span className="text-lg font-bold" style={{ color: cfg.bar }}>{stats?.pourcentage || 0}%</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      className={`text-noir-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                {/* Barre de progression catégorie */}
                <div className="mt-3">
                  <ProgressBar value={stats?.pourcentage || 0} color={cfg.bar} height="h-2" />
                </div>

                {/* Certificat obtenu */}
                {stats?.certificat && (
                  <div className="mt-3 flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-2">
                    <span className="text-gold-400 text-sm">Certificat "{cat}" obtenu</span>
                  </div>
                )}

                {/* Liste des compétences (dépliable) */}
                {isOpen && (
                  <div className="mt-4 space-y-1.5 border-t border-noir-800 pt-4">
                    {items.map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${item.validee ? 'bg-green-500/5' : 'hover:bg-noir-800/40'}`}>
                        <input type="checkbox" checked={item.validee} readOnly
                          className="mt-0.5 w-5 h-5 cursor-default" style={{accentColor: '#22c55e', pointerEvents: 'none'}} />
                        <span className={`text-sm flex-1 ${item.validee ? 'text-white' : 'text-noir-400'}`}>
                          {item.competence}
                        </span>
                        {item.validee && item.validee_at && (
                          <span className="text-xs text-noir-600 shrink-0">
                            {new Date(item.validee_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Message encouragement */}
        {globalPct < 100 && (
          <div className="mt-6 card border-dashed border-gold-500/20 text-center py-6">
            <p className="text-noir-400 text-sm">
              {globalPct === 0
                ? 'Votre parcours commence ici. Votre professeur validera vos compétences au fil des cours.'
                : globalPct < 50
                ? `Vous progressez bien ! Continuez sur cette lancée.`
                : `Excellent travail ! Vous êtes à ${globalPct}% de la formation complète.`
              }
            </p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
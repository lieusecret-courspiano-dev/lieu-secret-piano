'use client'
import { useState, useEffect } from 'react'
import { FileText, Video, Music, Link as LinkIcon, ExternalLink, ShoppingCart, Lock, ArrowLeft } from 'lucide-react'

interface Support {
  id: string; titre: string; description: string | null; niveau: string
  type: string; fichier_url: string | null; apercu_url: string | null
  est_gratuit: boolean; prix: number; nb_pages: number | null
}

const TYPE_ICONS: Record<string, any> = { pdf: FileText, video: Video, audio: Music, lien: LinkIcon }
const TYPE_LABELS: Record<string, string> = { pdf: 'PDF', video: 'Vidéo', audio: 'Audio', lien: 'Lien' }
const NIVEAU_LABELS: Record<string, string> = {
  fondamentaux: 'Fondamentaux', comprehension: 'Compréhension', expression: 'Expression', tous: 'Tous niveaux'
}

export default function BibliothequePage() {
  const [supports, setSupports] = useState<Support[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [typeFilter, setTypeFilter] = useState('tous')
  const [eleveConnecte, setEleveConnecte] = useState(false)

  useEffect(() => {
    // Vérifier si l'élève est connecté
    fetch('/api/eleve/me').then(r => {
      if (r.ok) setEleveConnecte(true)
    }).catch(() => {})

    fetch('/api/supports').then(r => r.json()).then(d => {
      setSupports(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = supports.filter(s => {
    const niveauOk = filter === 'tous' || s.niveau === filter || s.niveau === 'tous'
    const typeOk = typeFilter === 'tous' || s.type === typeFilter
    return niveauOk && typeOk
  })

  // Lien retour selon connexion
  const retourHref = eleveConnecte ? '/espace-eleve/dashboard' : '/'
  const retourLabel = eleveConnecte ? '← Mon espace élève' : '← Accueil'

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      {/* Header */}
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-px h-5 bg-gold-500" />
            <span className="font-serif text-lg text-gold-400 tracking-widest">LIEU SECRET</span>
          </a>
          <a href={retourHref} className="flex items-center gap-1.5 text-sm text-noir-400 hover:text-gold-400 transition-colors">
            <ArrowLeft size={14} /> {retourLabel}
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-3">Bibliothèque pédagogique</h1>
          <p className="text-noir-400 text-base max-w-xl mx-auto">
            Accédez à nos supports de cours, partitions et ressources musicales
          </p>
        </div>

        {/* Filtres niveau */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs text-noir-500 self-center mr-1">Niveau :</span>
          {(['tous', 'fondamentaux', 'comprehension', 'expression'] as const).map(n => (
            <button key={n} onClick={() => setFilter(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === n ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
              {NIVEAU_LABELS[n] || 'Tous'}
            </button>
          ))}
        </div>

        {/* Filtres type */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-noir-500 self-center mr-1">Type :</span>
          {(['tous', 'pdf', 'video', 'audio', 'lien'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${typeFilter === t ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'border-noir-700 text-noir-400 hover:border-noir-600'}`}>
              {t === 'tous' ? 'Tous' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-noir-400 text-lg">Aucun support disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const Icon = TYPE_ICONS[s.type] || FileText
              return (
                <div key={s.id} className="card hover:border-gold-500/20 transition-all flex flex-col">
                  {s.apercu_url && (
                    <div className="h-36 rounded-xl overflow-hidden mb-3 bg-noir-800 -mx-1">
                      <img src={s.apercu_url} alt={s.titre} className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">{s.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-noir-500">{TYPE_LABELS[s.type]}</span>
                        <span className="text-xs text-noir-600">·</span>
                        <span className="text-xs text-noir-500">{NIVEAU_LABELS[s.niveau] || s.niveau}</span>
                        {s.nb_pages && <><span className="text-xs text-noir-600">·</span><span className="text-xs text-noir-500">{s.nb_pages}p</span></>}
                      </div>
                      {s.description && <p className="text-noir-500 text-xs mt-1 line-clamp-2">{s.description}</p>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-noir-800 flex items-center justify-between">
                    <span className={`text-sm font-bold ${s.est_gratuit ? 'text-green-400' : 'text-gold-400'}`}>
                      {s.est_gratuit ? 'Gratuit' : `${s.prix} €`}
                    </span>
                    {s.est_gratuit && s.fichier_url ? (
                      <a href={s.fichier_url} target="_blank" rel="noopener noreferrer" className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <ExternalLink size={12} /> Accéder
                      </a>
                    ) : !s.est_gratuit ? (
                      eleveConnecte ? (
                        <a href={`/espace-eleve/acheter-support?id=${s.id}`} className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1.5">
                          <ShoppingCart size={12} /> Acheter — {s.prix} €
                        </a>
                      ) : (
                        <a href="/espace-eleve/login?redirect=/bibliotheque-pedagogique" className="btn-gold text-xs px-3 py-1.5 flex items-center gap-1.5">
                          <ShoppingCart size={12} /> Acheter — {s.prix} €
                        </a>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-noir-600">
                        <Lock size={12} /> Réservé aux élèves
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-noir-800 bg-noir-900 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-serif text-gold-400 tracking-widest text-sm mb-1">LIEU SECRET</p>
          <p className="text-noir-500 text-xs">École de Piano en Ligne</p>
        </div>
      </footer>
    </div>
  )
}
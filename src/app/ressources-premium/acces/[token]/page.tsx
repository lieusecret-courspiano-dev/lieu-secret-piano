'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

interface AchatAvecRessource {
  id: string; acheteur_nom: string; acheteur_email: string; statut: string
  ressources_premium: {
    titre: string; description: string; type: string
    youtube_url: string | null; zoom_url: string | null; fichier_url: string | null
    duree_minutes: number | null; date_coaching: string | null
  }
}

export default function AccesRessourcePage() {
  const params = useParams()
  const token = params?.token as string
  const [data, setData] = useState<AchatAvecRessource | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/ressources-premium/acces?token=${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.statut === 'confirme') setData(d); else setNotFound(true) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !data) return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="pt-32 pb-24 px-4 text-center">
        <h1 className="font-serif text-3xl text-white mb-4">Accès non disponible</h1>
        <p className="text-noir-400 mb-8">Ce lien est invalide, expiré ou le paiement n'a pas encore été confirmé.</p>
        <Link href="/ressources-premium" className="btn-gold">Voir les ressources</Link>
      </div>
      <PublicFooter />
    </div>
  )

  const r = data.ressources_premium

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <section className="pt-28 sm:pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header accès */}
            <div className="bg-gradient-to-br from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-2xl p-6 mb-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white mb-2">{r.titre}</h1>
              <p className="text-noir-400 text-sm">Bonjour {data.acheteur_nom} — votre accès est actif</p>
            </div>

            {/* Contenu selon le type */}
            <div className="space-y-5">
              {/* Vidéo YouTube */}
              {r.youtube_url && (
                <div className="card">
                  <h2 className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-4">Votre vidéo</h2>
                  <div className="aspect-video rounded-xl overflow-hidden bg-noir-800">
                    {r.youtube_url.includes('youtube.com') || r.youtube_url.includes('youtu.be') ? (
                      <iframe
                        src={r.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                        className="w-full h-full" allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <a href={r.youtube_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center h-full text-gold-400 hover:text-gold-300 transition-colors gap-2">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Accéder à la vidéo
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Lien Zoom coaching */}
              {r.zoom_url && (
                <div className="card border-blue-500/20 bg-blue-500/5">
                  <h2 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Votre lien Zoom</h2>
                  {r.date_coaching && (
                    <p className="text-white text-sm mb-3">
                      <span className="text-noir-400">Date : </span>
                      {new Date(r.date_coaching).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <a href={r.zoom_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 px-5 py-3 rounded-xl text-sm font-medium transition-all">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>
                    Rejoindre le coaching Zoom
                  </a>
                  <p className="text-noir-500 text-xs mt-3">Conservez ce lien — il est personnel et permanent.</p>
                </div>
              )}

              {/* Fichier PDF/doc */}
              {r.fichier_url && (
                <div className="card">
                  <h2 className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-3">Votre ressource</h2>
                  <a href={r.fichier_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 btn-gold">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Télécharger / Accéder
                  </a>
                </div>
              )}

              {/* Description */}
              {r.description && (
                <div className="card">
                  <h2 className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-3">À propos</h2>
                  <p className="text-noir-300 leading-relaxed text-sm">{r.description}</p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Link href="/ressources-premium" className="text-noir-500 hover:text-gold-400 text-sm transition-colors">
                Voir d'autres ressources
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
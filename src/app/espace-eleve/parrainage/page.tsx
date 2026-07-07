'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface ParrainageData {
  code: string
  nb_filleuls: number
  credits_gagnes: number
  filleuls?: { filleul_email: string; status: string; created_at: string }[]
}

interface Me { id: string; email: string; prenom: string; nom: string }

export default function ParrainagePage() {
  const router = useRouter()
  const [data, setData] = useState<ParrainageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/eleve/me')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(async (me: Me | null) => {
        if (!me) return
        // Récupérer le code parrainage existant
        const res = await fetch(`/api/parrainage?email=${encodeURIComponent(me.email)}`)
        const d = await res.json()
        if (d && d.code) {
          setData({ code: d.code, nb_filleuls: d.nb_filleuls || 0, credits_gagnes: d.credits_gagnes || 0, filleuls: d.filleuls || [] })
        } else {
          // Créer automatiquement un code parrainage
          setCreating(true)
          const createRes = await fetch('/api/parrainage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eleve_id: me.id, email: me.email, prenom: me.prenom, nom: me.nom }),
          })
          const created = await createRes.json()
          if (created && created.code) {
            setData({ code: created.code, nb_filleuls: 0, credits_gagnes: 0, filleuls: [] })
          }
          setCreating(false)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  function copyCode() {
    if (!data?.code) return
    navigator.clipboard.writeText(data.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = `https://www.lieusecret-courspiano.fr/inscription?ref=${data?.code}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading || creating) return (
    <EleveLayout>
      <div className="p-4 md:p-6 space-y-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-32" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-serif text-white mb-1">Parrainage</h1>
          <p className="text-noir-400 text-sm">Invitez vos amis et gagnez des heures de cours</p>
        </div>

        {/* Comment ça marche */}
        <div className="card mb-6">
          <h2 className="text-white font-semibold text-sm mb-4">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, text: 'Partagez votre code' },
              { step: '2', icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, text: "Votre ami s'inscrit" },
              { step: '3', icon: <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, text: 'Vous gagnez 1h offerte' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-2">
                  {s.icon}
                </div>
                <p className="text-xs text-noir-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {data?.code ? (
          <>
            {/* Code parrainage */}
            <div className="card mb-4 border-gold-500/20 bg-gold-500/5">
              <p className="text-noir-400 text-xs mb-2 uppercase tracking-wider label">Votre code de parrainage</p>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-white font-mono text-2xl font-bold flex-1 tracking-widest">{data.code}</p>
                <button onClick={copyCode}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
                    copied ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-gold-500/30 text-gold-400 hover:bg-gold-500/10'
                  }`}>
                  {copied ? (
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      Copié !
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copier le code
                    </span>
                  )}
                </button>
              </div>

              {/* Lien complet avec bouton copier */}
              <div className="border-t border-gold-500/10 pt-4">
                <p className="text-noir-400 text-xs mb-2 uppercase tracking-wider label">Votre lien de parrainage</p>
                <div className="flex items-center gap-2 bg-noir-800/60 border border-noir-700 rounded-xl px-3 py-2.5">
                  <p className="text-noir-300 text-xs flex-1 truncate font-mono">{shareUrl}</p>
                  <button onClick={copyLink}
                    className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      copiedLink ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-noir-600 text-noir-400 hover:border-gold-500/40 hover:text-gold-400'
                    }`}>
                    {copiedLink ? (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        Copié !
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copier le lien
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-white">{data.nb_filleuls}</p>
                <p className="text-xs text-noir-400 mt-1">Filleul{data.nb_filleuls > 1 ? 's' : ''} parrainé{data.nb_filleuls > 1 ? 's' : ''}</p>
              </div>
              <div className="card text-center py-4">
                <p className="text-3xl font-bold text-gold-400">{data.credits_gagnes}h</p>
                <p className="text-xs text-noir-400 mt-1">Crédit{data.credits_gagnes > 1 ? 's' : ''} gagné{data.credits_gagnes > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Partager */}
            <div className="card mb-6">
              <p className="text-white font-semibold text-sm mb-3">Partager mon code</p>
              <div className="flex gap-2 flex-wrap">
                <a href={`https://wa.me/?text=Rejoins%20Lieu%20Secret%20Piano%20avec%20mon%20code%20${data.code}%20!%20${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-4 py-2 rounded-xl hover:bg-green-500/20 transition-all">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="flex items-center gap-2 bg-noir-800 border border-noir-700 text-noir-300 text-xs px-4 py-2 rounded-xl hover:border-noir-600 transition-all">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Copier le lien
                </button>
              </div>
            </div>

            {/* Filleuls */}
            {data.filleuls && data.filleuls.length > 0 && (
              <div className="card">
                <p className="text-white font-semibold text-sm mb-3">Mes filleuls ({data.filleuls.length})</p>
                <div className="space-y-2">
                  {data.filleuls.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-noir-800 last:border-0">
                      <p className="text-noir-300 text-sm">{f.filleul_email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        f.status === 'validated' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {f.status === 'validated' ? 'Validé' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-noir-800 border border-noir-700 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" stroke="#707070" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            </div>
            <p className="text-white font-medium">Parrainage non disponible</p>
            <p className="text-noir-400 text-sm mt-1">Contactez votre professeur pour activer le parrainage</p>
          </div>
        )}
      </div>
    </EleveLayout>
  )
}
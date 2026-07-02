'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Eleve { id: string; email: string; prenom: string; nom: string; telephone: string | null; is_active: boolean; created_at: string; nb_packs_actifs?: number; nb_reservations?: number; compte_cree?: boolean }

export default function AdminElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ prenom: '', nom: '', email: '', telephone: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  useEffect(() => {
    fetch('/api/admin/eleves').then(r => r.json()).then(d => setEleves(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.prenom || !createForm.nom || !createForm.email) { setCreateError('Prénom, nom et email requis'); return }
    setCreateLoading(true); setCreateError(''); setCreateSuccess('')
    try {
      const res = await fetch('/api/admin/eleves', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (data.emailError) {
        setCreateError(`Compte créé mais erreur email : ${data.message}. Vérifiez la variable RESEND_API_KEY dans Vercel.`)
      } else {
        setCreateSuccess(`Compte créé ! Un email de bienvenue a été envoyé à ${createForm.email}`)
      }
      setCreateForm({ prenom: '', nom: '', email: '', telephone: '' })
      // Rafraîchir la liste
      fetch('/api/admin/eleves').then(r => r.json()).then(d => setEleves(Array.isArray(d) ? d : []))
      setTimeout(() => { setShowCreate(false); setCreateSuccess('') }, 3000)
    } catch (e: unknown) { setCreateError(e instanceof Error ? e.message : 'Erreur') }
    finally { setCreateLoading(false) }
  }

  async function handleResendWelcome(id: string, email: string, prenom: string) {
    if (!confirm(`Renvoyer l'email de bienvenue à ${email} ?`)) return
    try {
      const res = await fetch('/api/admin/eleves', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom: '', email }),
      })
      const data = await res.json()
      if (data.emailError) alert(`Erreur email : ${data.message}`)
      else alert(`Email de bienvenue renvoyé à ${email}`)
    } catch { alert('Erreur lors de l\'envoi') }
  }

  const filtered = eleves.filter(e => `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-white">Espace Élèves</h1>
          <p className="text-noir-400 text-sm mt-1">Gérez les comptes et espaces personnels de vos élèves</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Créer un compte élève
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center"><div className="text-2xl font-bold text-gold-400 mb-1">{eleves.length}</div><div className="text-xs text-noir-500 uppercase">Total élèves</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-green-400 mb-1">{eleves.filter(e => e.compte_cree).length}</div><div className="text-xs text-noir-500 uppercase">Comptes finalisés</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-yellow-400 mb-1">{eleves.filter(e => !e.compte_cree).length}</div><div className="text-xs text-noir-500 uppercase">En attente</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-blue-400 mb-1">{eleves.filter(e => e.is_active).length}</div><div className="text-xs text-noir-500 uppercase">Actifs</div></div>
      </div>
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="input w-full pl-9 max-w-sm" />
      </div>
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-noir-800">{['Élève','Email','Téléphone','Compte','Statut','Inscrit le',''].map(h => <th key={h} className="text-left text-xs text-noir-400 uppercase tracking-wider py-3 px-4">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-noir-800/50 hover:bg-noir-800/30 transition-colors">
                  <td className="py-3 px-4"><p className="text-white font-medium">{e.prenom} {e.nom}</p></td>
                  <td className="py-3 px-4 text-noir-300 text-sm">{e.email}</td>
                  <td className="py-3 px-4 text-noir-400 text-sm">{e.telephone || '-'}</td>
                  <td className="py-3 px-4">
                    {e.compte_cree
                      ? <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Finalisé
                        </span>
                      : <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/40 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />En attente
                        </span>
                    }
                  </td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full border ${e.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{e.is_active ? 'Actif' : 'Inactif'}</span></td>
                  <td className="py-3 px-4 text-center">
                  {e.nb_packs_actifs ? <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">{e.nb_packs_actifs} pack{e.nb_packs_actifs > 1 ? 's' : ''}</span> : <span className="text-noir-700 text-xs">—</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {e.nb_reservations ? <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{e.nb_reservations}</span> : <span className="text-noir-700 text-xs">—</span>}
                </td>
                <td className="py-3 px-4 text-noir-500 text-xs">{new Date(e.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/eleves/${e.id}`} className="text-gold-400 hover:text-gold-300 text-sm font-medium">Gérer →</Link>
                      <Link href={`/admin/eleves/${e.id}#progression`} title="Valider les compétences"
                        className="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded hover:bg-purple-500/10">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </Link>
                      {!e.compte_cree && (
                        <button onClick={() => handleResendWelcome(e.id, e.email, e.prenom)}
                          title="Renvoyer l'email de bienvenue"
                          className="text-orange-400 hover:text-orange-300 transition-colors p-1 rounded hover:bg-orange-500/10">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-noir-400">Aucun élève trouvé</div>}
        </div>
      )}

      {/* Modale création compte élève */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800">
              <h2 className="text-white font-serif text-xl">Créer un compte élève</h2>
              <button onClick={() => { setShowCreate(false); setCreateError(''); setCreateSuccess('') }} className="text-noir-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <p className="text-noir-400 text-sm">L&apos;élève recevra automatiquement un email de bienvenue lui demandant de définir son mot de passe.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Prénom *</label><input value={createForm.prenom} onChange={e => setCreateForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Prénom" className="input w-full" required /></div>
                <div><label className="label mb-1 block">Nom *</label><input value={createForm.nom} onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom" className="input w-full" required /></div>
              </div>
              <div><label className="label mb-1 block">Email *</label><input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="eleve@exemple.com" className="input w-full" required /></div>
              <div><label className="label mb-1 block">Téléphone (optionnel)</label><input value={createForm.telephone} onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+33 6 00 00 00 00" className="input w-full" /></div>
              {createError && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3">{createError}</div>}
              {createSuccess && <div className="bg-green-900/30 border border-green-500/50 text-green-300 text-sm rounded-xl px-4 py-3">{createSuccess}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(''); setCreateSuccess('') }} className="btn-outline flex-1">Annuler</button>
                <button type="submit" disabled={createLoading} className="btn-gold flex-1">{createLoading ? 'Création...' : "Créer et envoyer l'email"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

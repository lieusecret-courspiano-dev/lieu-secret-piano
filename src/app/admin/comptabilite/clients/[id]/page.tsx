'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, User, FileText, Package, Truck,
  Calendar, TrendingUp, Pencil, Save, X, ExternalLink,
  CheckCircle, Clock, XCircle, UserCheck
} from 'lucide-react'

interface Fiche {
  email: string
  nom: string
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  est_eleve: boolean
  eleve_id: string | null
  is_active: boolean
  created_at: string | null
  stats: {
    ca_total: number
    nb_factures: number
    nb_packs: number
    nb_locations: number
    nb_cours: number
  }
  eleve: Record<string, unknown> | null
  factures: { id: string; numero: string; date_facture: string; montant_ttc: number; source: string; statut_paiement: string }[]
  packs: { id: string; code: string; pack_label: string; heures_total: number; heures_restantes: number; montant: number; status: string; created_at: string }[]
  locations: { id: string; article_nom: string; date_debut: string; date_fin: string; montant_total: number; statut: string; created_at: string }[]
  reservations: { id: string; slot_start: string; amount: number; status: string; type: string }[]
}

const SOURCE_LABELS: Record<string, string> = {
  pack: 'Pack', cours: 'Cours', evenement: 'Événement', cadeau: 'Cadeau',
  support: 'Support', ressource: 'Ressource', location: 'Location', manuel: 'Manuel',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [fiche, setFiche] = useState<Fiche | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    prenom: '', nom: '', telephone: '', adresse: '', ville: '', code_postal: '',
  })

  useEffect(() => {
    fetch(`/api/admin/comptabilite/clients/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setFiche(d)
        // Pré-remplir le formulaire d'édition
        const parts = (d.nom || '').split(' ')
        setEditForm({
          prenom:      parts[0] || '',
          nom:         parts.slice(1).join(' ') || '',
          telephone:   d.telephone || '',
          adresse:     d.adresse || '',
          ville:       d.ville || '',
          code_postal: d.code_postal || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/comptabilite/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        nom_complet: `${editForm.prenom} ${editForm.nom}`.trim(),
      }),
      credentials: 'include',
    })
    // Recharger la fiche
    const res = await fetch(`/api/admin/comptabilite/clients/${id}`, { credentials: 'include' })
    const data = await res.json()
    setFiche(data)
    setEditing(false)
    setSaving(false)
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!fiche) return <div className="p-8 text-center text-noir-400">Client introuvable</div>

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link href="/admin/comptabilite/clients"
            className="text-noir-500 hover:text-gold-400 transition-colors text-sm inline-flex items-center gap-1 mb-2">
            <ChevronLeft size={14} /> Retour aux clients
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              fiche.est_eleve ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-noir-800 border border-noir-700 text-noir-400'
            }`}>
              {fiche.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white">{fiche.nom}</h1>
              <p className="text-noir-400 text-sm">{fiche.email}</p>
            </div>
            {fiche.est_eleve && (
              <span className="text-xs px-2 py-1 rounded-full border text-blue-400 border-blue-500/30 bg-blue-500/10 flex items-center gap-1">
                <UserCheck size={12} /> Élève {fiche.is_active ? 'actif' : 'inactif'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {fiche.eleve_id && (
            <Link href={`/admin/eleves/${fiche.eleve_id}`}
              className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
              <ExternalLink size={14} /> Fiche élève
            </Link>
          )}
          <Link href={`/admin/comptabilite/factures?search=${encodeURIComponent(fiche.email)}`}
            className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
            <FileText size={14} /> Ses factures
          </Link>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-gold flex items-center gap-2 text-sm">
              <Pencil size={14} /> Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-outline text-sm flex items-center gap-2 px-3 py-2">
                <X size={14} /> Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-gold flex items-center gap-2 text-sm">
                <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">

          {/* Informations personnelles */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-gold-400" />
              <h2 className="text-white font-semibold">Informations personnelles</h2>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block text-xs">Prénom</label>
                    <input value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                      className="input w-full" placeholder="Prénom" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block text-xs">Nom</label>
                    <input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                      className="input w-full" placeholder="Nom" />
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block text-xs">Téléphone</label>
                  <input value={editForm.telephone} onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                    className="input w-full" placeholder="06 00 00 00 00" />
                </div>
                <div>
                  <label className="label mb-1.5 block text-xs">Adresse</label>
                  <input value={editForm.adresse} onChange={e => setEditForm(f => ({ ...f, adresse: e.target.value }))}
                    className="input w-full" placeholder="Numéro et nom de rue" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block text-xs">Code postal</label>
                    <input value={editForm.code_postal} onChange={e => setEditForm(f => ({ ...f, code_postal: e.target.value }))}
                      className="input w-full" placeholder="42000" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block text-xs">Ville</label>
                    <input value={editForm.ville} onChange={e => setEditForm(f => ({ ...f, ville: e.target.value }))}
                      className="input w-full" placeholder="Saint-Étienne" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Email', value: fiche.email, href: `mailto:${fiche.email}` },
                  { label: 'Téléphone', value: fiche.telephone || '—', href: fiche.telephone ? `tel:${fiche.telephone}` : undefined },
                  { label: 'Adresse', value: fiche.adresse || '—' },
                  { label: 'Ville', value: [fiche.code_postal, fiche.ville].filter(Boolean).join(' ') || '—' },
                  { label: 'Client depuis', value: fiche.created_at ? fDate(fiche.created_at) : '—' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-noir-500 text-xs mb-0.5">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} className="text-gold-400 hover:text-gold-300 transition-colors">{item.value}</a>
                    ) : (
                      <div className="text-white">{item.value}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Factures */}
          {fiche.factures.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gold-400" />
                  <h2 className="text-white font-semibold">Factures ({fiche.factures.length})</h2>
                </div>
                <Link href={`/admin/comptabilite/factures?search=${encodeURIComponent(fiche.email)}`}
                  className="text-gold-400 hover:text-gold-300 text-xs transition-colors">
                  Voir toutes →
                </Link>
              </div>
              <div className="space-y-2">
                {fiche.factures.slice(0, 5).map(f => (
                  <Link key={f.id} href={`/admin/comptabilite/factures/${f.id}`}
                    className="flex items-center justify-between gap-3 p-3 bg-noir-800 rounded-xl hover:bg-noir-700 transition-colors">
                    <div>
                      <span className="text-white text-sm font-medium">{f.numero}</span>
                      <span className="text-noir-500 text-xs ml-2">{SOURCE_LABELS[f.source] || f.source}</span>
                      <p className="text-noir-500 text-xs">{fDate(f.date_facture)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{fmt(f.montant_ttc)}</p>
                      <span className={`text-xs ${f.statut_paiement === 'paye' ? 'text-green-400' : 'text-amber-400'}`}>
                        {f.statut_paiement === 'paye' ? '✓ Payée' : '⏳ En attente'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Packs */}
          {fiche.packs.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">Packs d'heures ({fiche.packs.length})</h2>
              </div>
              <div className="space-y-2">
                {fiche.packs.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-noir-800 rounded-xl">
                    <div>
                      <p className="text-white text-sm font-medium">{p.pack_label}</p>
                      <p className="text-noir-500 text-xs font-mono">{p.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{p.heures_restantes}h / {p.heures_total}h</p>
                      <span className={`text-xs ${p.status === 'active' ? 'text-green-400' : 'text-noir-500'}`}>
                        {p.status === 'active' ? 'Actif' : p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {fiche.locations.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={16} className="text-teal-400" />
                <h2 className="text-white font-semibold">Locations ({fiche.locations.length})</h2>
              </div>
              <div className="space-y-2">
                {fiche.locations.map(l => (
                  <Link key={l.id} href={`/admin/location/${l.id}`}
                    className="flex items-center justify-between gap-3 p-3 bg-noir-800 rounded-xl hover:bg-noir-700 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{l.article_nom}</p>
                      <p className="text-noir-500 text-xs">{fDate(l.date_debut)} → {fDate(l.date_fin)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{fmt(l.montant_total)}</p>
                      <span className={`text-xs ${
                        l.statut === 'terminee' ? 'text-green-400'
                        : l.statut === 'en_cours' ? 'text-blue-400'
                        : 'text-amber-400'
                      }`}>
                        {l.statut}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cours réservés */}
          {fiche.reservations.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-purple-400" />
                <h2 className="text-white font-semibold">Cours récents ({fiche.reservations.length})</h2>
              </div>
              <div className="space-y-2">
                {fiche.reservations.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-noir-800 rounded-xl">
                    <div>
                      <p className="text-white text-sm">{fDate(r.slot_start)}</p>
                      <p className="text-noir-500 text-xs capitalize">{r.type}</p>
                    </div>
                    <div className="text-right">
                      {r.amount > 0 && <p className="text-white text-sm">{fmt(r.amount)}</p>}
                      <span className={`text-xs ${r.status === 'confirmed' ? 'text-green-400' : 'text-noir-500'}`}>
                        {r.status === 'confirmed' ? '✓ Confirmé' : r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne stats */}
        <div className="space-y-5">
          {/* KPIs */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">Statistiques</h2>
            <div className="space-y-3">
              {[
                { label: 'CA total', value: fmt(fiche.stats.ca_total), color: 'text-gold-400', icon: <TrendingUp size={14} className="text-gold-400" /> },
                { label: 'Factures', value: fiche.stats.nb_factures.toString(), color: 'text-white', icon: <FileText size={14} className="text-noir-400" /> },
                { label: 'Packs achetés', value: fiche.stats.nb_packs.toString(), color: 'text-blue-400', icon: <Package size={14} className="text-blue-400" /> },
                { label: 'Locations', value: fiche.stats.nb_locations.toString(), color: 'text-teal-400', icon: <Truck size={14} className="text-teal-400" /> },
                { label: 'Cours réservés', value: fiche.stats.nb_cours.toString(), color: 'text-purple-400', icon: <Calendar size={14} className="text-purple-400" /> },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <span className="text-noir-400 text-sm">{s.label}</span>
                  </div>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card">
            <h2 className="text-white font-semibold mb-3">Actions rapides</h2>
            <div className="space-y-2">
              <Link href={`/admin/comptabilite/factures?search=${encodeURIComponent(fiche.email)}`}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors text-sm">
                <FileText size={14} /> Voir toutes les factures
              </Link>
              {fiche.eleve_id && (
                <Link href={`/admin/eleves/${fiche.eleve_id}`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors text-sm">
                  <UserCheck size={14} /> Fiche élève complète
                </Link>
              )}
              <Link href={`/admin/comptabilite/factures`}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-noir-700 text-noir-400 hover:text-white hover:bg-noir-800 transition-colors text-sm">
                <FileText size={14} /> Créer une facture
              </Link>
            </div>
          </div>

          {/* Infos techniques */}
          <div className="card text-xs space-y-2 text-noir-500">
            <div className="flex justify-between">
              <span>Email</span>
              <span className="text-noir-300 truncate max-w-32">{fiche.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Type</span>
              <span className="text-noir-300">{fiche.est_eleve ? 'Élève inscrit' : 'Client externe'}</span>
            </div>
            {fiche.eleve_id && (
              <div className="flex justify-between">
                <span>ID élève</span>
                <span className="font-mono text-noir-600">{fiche.eleve_id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeProvider'
import PublicNav from '@/components/PublicNav'

interface PackOption { label: string; heures: number; montant: number; desc: string; popular?: boolean }

export default function PacksPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<PackOption[]>([])
  const [packsLoaded, setPacksLoaded] = useState(false)
  const [selected, setSelected] = useState<PackOption | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cb' | 'paypal' | 'virement'>('cb')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [virementSuccess, setVirementSuccess] = useState(false)
  const [virementInfo, setVirementInfo] = useState({ iban: '', nom: 'Lieu Secret', info: '' })
  const [pageTexts, setPageTexts] = useState({ titre: 'Acheter un pack de cours', sous_titre: "Achetez un pack d'heures et réservez vos cours au fur et à mesure.", label: 'Packs de cours' })
  const [form, setForm] = useState({ nom: '', email: '' })

  useEffect(() => {
    // Si l'élève est connecté, rediriger vers la page interne
    fetch('/api/eleve/me').then(r => r.ok ? r.json() : null).then(me => {
      if (me?.id) router.replace('/espace-eleve/acheter-pack')
    }).catch(() => {})
    fetch('/api/settings').then(r => r.json()).then((d: Record<string, string>) => {
      function parseH(label: string, desc: string): number { const m = (label + ' ' + desc).match(/(\d+)\s*h/i); return m ? parseInt(m[1]) : 5 }
      const loaded: PackOption[] = []
      for (let i = 1; i <= 10; i++) {
        const lbl = d[`tarif_pack_label${i}`]; const prix = d[`tarif_pack_prix${i}`]; const desc = d[`tarif_pack_desc${i}`] || ''
        if (lbl && prix && parseFloat(prix) > 0) loaded.push({ label: lbl, heures: parseH(lbl, desc), montant: parseFloat(prix), desc, popular: i === 2 })
      }
      if (loaded.length === 0) loaded.push({ label: 'Pack 5h', heures: 5, montant: 100, desc: '5 heures de cours' }, { label: 'Pack 8h', heures: 8, montant: 165, desc: '8 heures de cours', popular: true }, { label: 'Pack 12h', heures: 12, montant: 250, desc: '12 heures de cours' }, { label: 'Pack 20h', heures: 20, montant: 420, desc: '20 heures de cours' })
      setPacks(loaded); setPacksLoaded(true)
      setVirementInfo({ iban: d.virement_iban || '', nom: d.virement_nom || 'Lieu Secret', info: d.virement_info || '' })
      setPageTexts({
        titre: d.packs_titre || 'Acheter un pack de cours',
        sous_titre: d.packs_sous_titre || "Achetez un pack d'heures et réservez vos cours au fur et à mesure.",
        label: d.packs_label || 'Packs de cours',
      })
    }).catch(() => { setPacks([{ label: 'Pack 5h', heures: 5, montant: 100, desc: '5 heures' }, { label: 'Pack 8h', heures: 8, montant: 165, desc: '8 heures', popular: true }, { label: 'Pack 12h', heures: 12, montant: 250, desc: '12 heures' }, { label: 'Pack 20h', heures: 20, montant: 420, desc: '20 heures' }]); setPacksLoaded(true) })
  }, [])

  async function handleAchatCB() {
    if (!selected || !form.nom.trim() || !form.email.trim()) { setError('Veuillez renseigner votre nom et email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pack', pack_label: selected.label, heures: selected.heures, montant: selected.montant, acheteur_nom: form.nom, acheteur_email: form.email }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (data.url) window.location.href = data.url
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
  }

  async function handleAchatPayPal() {
    if (!selected || !form.nom.trim() || !form.email.trim()) { setError('Veuillez renseigner votre nom et email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/paypal/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pack', pack_label: selected.label, heures: selected.heures, montant: selected.montant, acheteur_nom: form.nom, acheteur_email: form.email }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur PayPal')
      if (data.approveUrl) window.location.href = data.approveUrl
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
  }

  async function handleAchatVirement() {
    if (!selected || !form.nom.trim() || !form.email.trim()) { setError('Veuillez renseigner votre nom et email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/pack/checkout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack_label: selected.label, heures: selected.heures, montant: selected.montant, acheteur_nom: form.nom, acheteur_email: form.email }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setVirementSuccess(true)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
  }

  if (virementSuccess && selected) return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full card border-gold-500/30 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4"><svg width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2 className="font-serif text-2xl text-white mb-3">Demande enregistrée !</h2>
        <p className="text-noir-300 text-sm mb-4">Votre demande de <strong className="text-gold-400">{selected.label}</strong> a bien été reçue.</p>
        {virementInfo.iban && (<div className="bg-noir-800 rounded-xl p-4 mb-4 text-left"><p className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-3">Coordonnées bancaires</p><div className="space-y-2"><div className="flex justify-between"><span className="text-noir-400 text-xs">Bénéficiaire</span><span className="text-white text-xs font-medium">{virementInfo.nom}</span></div><div className="flex justify-between"><span className="text-noir-400 text-xs">IBAN</span><span className="text-gold-400 text-xs font-mono font-bold">{virementInfo.iban}</span></div>{virementInfo.info && <div className="flex justify-between"><span className="text-noir-400 text-xs">Référence</span><span className="text-white text-xs">{virementInfo.info}</span></div>}<div className="flex justify-between border-t border-noir-700 pt-2"><span className="text-noir-400 text-xs">Montant</span><span className="text-white text-sm font-bold">{selected.montant} €</span></div></div></div>)}
        <p className="text-noir-400 text-xs mb-4">Dès réception de votre virement, votre pack sera activé et vous recevrez votre code PK par email.</p>
        <Link href="/espace-eleve/dashboard" className="btn-gold w-full text-center block">Retour à mon espace élève</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 pt-28 sm:pt-32 pb-8 md:pb-12">
        <div className="text-center mb-6 md:mb-10"><div className="text-gold-500 text-xs tracking-widest uppercase mb-3">{pageTexts.label}</div><h1 className="font-serif text-3xl md:text-4xl text-white mb-4 animate-fade-in-up">{pageTexts.titre}</h1><p className="text-noir-400 max-w-xl mx-auto">{pageTexts.sous_titre}</p></div>
        {!packsLoaded ? (<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>) : (
          <div className={`grid gap-4 mb-10 ${packs.length <= 2 ? 'md:grid-cols-2' : packs.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
            {packs.map((pack, i) => (
              <div key={i} onClick={() => setSelected(pack)} className={`card cursor-pointer transition-all relative ${selected?.label === pack.label ? 'border-gold-500 bg-gold-500/5' : 'hover:border-gold-500/50'} ${pack.popular ? 'border-gold-500/40' : ''}`}>
                {pack.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-noir-950 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Populaire</div>}
                <div className="text-center pt-2"><h3 className="font-serif text-xl text-white mb-1">{pack.label}</h3><div className="text-3xl font-bold text-gold-400 mb-1">{pack.montant} €</div><div className="text-noir-400 text-sm mb-2">{pack.heures} heures de cours</div>{pack.desc && <div className="text-noir-500 text-xs">{pack.desc}</div>}</div>
                {selected?.label === pack.label && <div className="mt-3 flex justify-center"><span className="text-xs bg-gold-500 text-noir-950 font-bold px-3 py-1 rounded-full">Sélectionné</span></div>}
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div className="max-w-lg mx-auto card border-gold-500/30">
            <h2 className="font-serif text-xl text-white mb-4">Finaliser l&apos;achat — {selected.label}</h2>
            <div className="space-y-4">
              <div><label className="label mb-1 block">Votre nom *</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Prénom Nom" className="input w-full" /></div>
              <div><label className="label mb-1 block">Votre email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.com" className="input w-full" /></div>
              <div><label className="label mb-2 block">Mode de paiement</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => setPaymentMethod('cb')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'cb' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Carte bancaire
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('paypal')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'paypal' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
                    PayPal
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('virement')} className={'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ' + (paymentMethod === 'virement' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Virement
                  </button>
                </div>
              </div>
              <div className="bg-noir-800 rounded-xl p-4"><div className="flex justify-between items-center mb-2"><span className="text-noir-400 text-sm">{selected.label}</span><span className="text-white font-bold">{selected.montant} €</span></div><div className="flex justify-between items-center"><span className="text-noir-400 text-sm">Heures incluses</span><span className="text-gold-400 font-bold">{selected.heures}h</span></div></div>
              {paymentMethod === 'virement' && virementInfo.iban && (<div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4"><p className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">Coordonnées bancaires</p><div className="space-y-1"><div className="flex justify-between"><span className="text-noir-400 text-xs">Bénéficiaire</span><span className="text-white text-xs">{virementInfo.nom}</span></div><div className="flex justify-between"><span className="text-noir-400 text-xs">IBAN</span><span className="text-gold-400 text-xs font-mono font-bold">{virementInfo.iban}</span></div>{virementInfo.info && <div className="flex justify-between"><span className="text-noir-400 text-xs">Référence</span><span className="text-white text-xs">{virementInfo.info}</span></div>}</div></div>)}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={paymentMethod === 'cb' ? handleAchatCB : paymentMethod === 'paypal' ? handleAchatPayPal : handleAchatVirement} disabled={loading} className="btn-gold w-full disabled:opacity-50">
                {loading ? <span className="w-5 h-5 border-2 border-noir-900 border-t-transparent rounded-full animate-spin inline-block" /> : paymentMethod === 'cb' ? `Payer ${selected.montant} € par carte` : paymentMethod === 'paypal' ? `Payer ${selected.montant} € via PayPal` : 'Confirmer la demande par virement'}
              </button>
              <p className="text-noir-500 text-xs text-center">Vous ne voyez pas l&apos;email ? Vérifiez votre dossier <strong className="text-noir-400">Spam</strong>.</p>
            </div>
          </div>
        )}
        <div className="text-center mt-8"><p className="text-noir-500 text-sm mb-3">Vous avez déjà un pack ?</p><Link href="/mon-pack" className="btn-outline text-sm px-6">Consulter mes heures</Link></div>
      </div>
    </div>
  )
}

'use client'
import SiteHeader from '@/components/SiteHeader'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeProvider'

interface Formule {
 label: string
 desc: string
 prix: number
}

export default function CadeauPage() {
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 const [paymentMethod, setPaymentMethod] = useState<'cb' | 'paypal' | 'virement'>('cb')
 const [virementSuccess, setVirementSuccess] = useState(false)
 const [formules, setFormules] = useState<Formule[]>([
 { label: 'Bon Découverte', desc: '1 cours de piano', prix: 22 },
 { label: 'Bon Progression', desc: '3 cours de piano', prix: 60 },
 { label: 'Bon Immersion', desc: '5 cours de piano', prix: 90 },
 ])
 const [virementInfo, setVirementInfo] = useState({ iban: '', nom: 'Lieu Secret', info: '' })

 const [form, setForm] = useState({
 acheteur_nom: '',
 acheteur_email: '',
 destinataire_nom: '',
 message: '',
 montant: 60,
 formule_label: 'Bon Progression',
 formule_desc: '3 cours de piano',
 })

 useEffect(() => {
 fetch('/api/settings').then(r => r.json()).then(data => {
 const f: Formule[] = []
 if (data.cadeau_formule1_label && data.cadeau_formule1_prix) f.push({ label: data.cadeau_formule1_label, desc: data.cadeau_formule1_desc || '', prix: parseFloat(data.cadeau_formule1_prix) })
 if (data.cadeau_formule2_label && data.cadeau_formule2_prix) f.push({ label: data.cadeau_formule2_label, desc: data.cadeau_formule2_desc || '', prix: parseFloat(data.cadeau_formule2_prix) })
 if (data.cadeau_formule3_label && data.cadeau_formule3_prix) f.push({ label: data.cadeau_formule3_label, desc: data.cadeau_formule3_desc || '', prix: parseFloat(data.cadeau_formule3_prix) })
 if (f.length > 0) {
 setFormules(f)
 setForm(prev => ({ ...prev, montant: f[1]?.prix || f[0].prix, formule_label: f[1]?.label || f[0].label, formule_desc: f[1]?.desc || f[0].desc }))
 }
 setVirementInfo({ iban: data.virement_iban || '', nom: data.virement_nom || 'Lieu Secret', info: data.virement_info || '' })
 }).catch(() => {})
 }, [])

 function selectFormule(f: Formule) {
 setForm(prev => ({ ...prev, montant: f.prix, formule_label: f.label, formule_desc: f.desc }))
 }

 function handleChange(key: string, value: string | number) {
 setForm(f => ({ ...f, [key]: value }))
 }

 async function handlePayPalCadeau(e: React.FormEvent) {
  e.preventDefault()
  if (!form.acheteur_nom || !form.acheteur_email || !form.destinataire_nom) { setError('Veuillez remplir tous les champs obligatoires.'); return }
  setLoading(true); setError('')
  try {
    const res = await fetch('/api/paypal/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cadeau', acheteur_nom: form.acheteur_nom, acheteur_email: form.acheteur_email, destinataire_nom: form.destinataire_nom, message: form.message || null, montant: form.montant }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur PayPal')
    if (data.approveUrl) window.location.href = data.approveUrl
  } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
 }

 async function handleSubmitCB(e: React.FormEvent) {
 e.preventDefault()
 if (!form.acheteur_nom || !form.acheteur_email || !form.destinataire_nom) { setError('Veuillez remplir tous les champs obligatoires.'); return }
 setLoading(true); setError('')
 try {
 const res = await fetch('/api/cadeau/checkout', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(form),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Erreur')
 window.location.href = data.url
 } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue') }
 finally { setLoading(false) }
 }

 async function handleSubmitVirement(e: React.FormEvent) {
 e.preventDefault()
 if (!form.acheteur_nom || !form.acheteur_email || !form.destinataire_nom) { setError('Veuillez remplir tous les champs obligatoires.'); return }
 setLoading(true); setError('')
 try {
 const res = await fetch('/api/cadeau/virement', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(form),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Erreur')
 setVirementSuccess(true)
 } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur inconnue') }
 finally { setLoading(false) }
 }

 if (virementSuccess) {
 return (
 <div className="min-h-screen bg-noir-950 flex items-center justify-center p-4">
 <div className="max-w-md w-full text-center">
 <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
 <svg width="28" height="28" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
 </div>
 <h1 className="font-serif text-3xl text-white mb-4">Demande enregistrée !</h1>
 <p className="text-noir-300 mb-4">Votre demande de bon cadeau a bien été reçue.</p>
 <div className="bg-noir-900 border border-gold-500/30 rounded-xl p-5 mb-6 text-left">
 <p className="text-gold-400 text-sm font-medium mb-3">Coordonnées pour le virement</p>
 {virementInfo.iban && <p className="text-white text-sm mb-1"><span className="text-noir-400">IBAN :</span> {virementInfo.iban}</p>}
 <p className="text-white text-sm mb-1"><span className="text-noir-400">Bénéficiaire :</span> {virementInfo.nom}</p>
 <p className="text-white text-sm mb-1"><span className="text-noir-400">Montant :</span> {form.montant} €</p>
 <p className="text-white text-sm"><span className="text-noir-400">Référence :</span> Bon cadeau {form.destinataire_nom}</p>
 {virementInfo.info && <p className="text-noir-400 text-xs mt-2">{virementInfo.info}</p>}
 </div>
 <p className="text-noir-400 text-sm mb-6">Dès réception du virement, vous recevrez le code cadeau par email.</p>
 <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 mb-6">
 <p className="text-gold-400 text-xs">Pensez à vérifier votre dossier Spam si vous ne recevez pas l&apos;email de confirmation.</p>
 </div>
 <Link href="/" className="btn-gold inline-block">Retour à l&apos;accueil</Link>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-noir-950 text-noir-100">
 <SiteHeader />

 <div className="max-w-lg mx-auto px-4 py-12">
 <div className="text-center mb-10">
 <div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Offrir la musique</div>
 <h1 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">Bon cadeau</h1>
 <p className="text-noir-400 leading-relaxed">Offrez un cours de piano à quelqu&apos;un que vous aimez.</p>
 </div>

 <form onSubmit={paymentMethod === 'cb' ? handleSubmitCB : paymentMethod === 'paypal' ? handlePayPalCadeau : handleSubmitVirement} className="space-y-6">

 {/* Formules */}
 <div className="card">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Choisissez une formule</h2>
 <div className="space-y-3">
 {formules.map(f => (
 <button key={f.label} type="button" onClick={() => selectFormule(f)}
 className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${form.formule_label === f.label ? 'bg-gold-500/10 border-gold-500 text-white' : 'border-noir-700 text-noir-300 hover:border-gold-500/50'}`}>
 <div className="text-left">
 <div className="font-medium text-sm">{f.label}</div>
 <div className="text-xs text-noir-500 mt-0.5">{f.desc}</div>
 </div>
 <div className={`text-lg font-bold ${form.formule_label === f.label ? 'text-gold-400' : 'text-noir-400'}`}>{f.prix} €</div>
 </button>
 ))}
 </div>
 <div className="mt-4">
 <label className="label mb-1 block">Ou saisissez un montant personnalisé (€)</label>
 <input type="number" min="10" max="500" value={form.montant}
 onChange={e => handleChange('montant', parseInt(e.target.value) || 22)}
 className="input w-full" />
 </div>
 </div>

 {/* Acheteur */}
 <div className="card">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Vos informations</h2>
 <div className="space-y-4">
 <div><label className="label mb-1 block">Votre nom *</label><input value={form.acheteur_nom} onChange={e => handleChange('acheteur_nom', e.target.value)} placeholder="Prénom Nom" className="input w-full" required /></div>
 <div><label className="label mb-1 block">Votre email *</label><input type="email" value={form.acheteur_email} onChange={e => handleChange('acheteur_email', e.target.value)} placeholder="vous@exemple.com" className="input w-full" required /><p className="text-xs text-noir-600 mt-1">Le bon cadeau vous sera envoyé par email.</p></div>
 </div>
 </div>

 {/* Destinataire */}
 <div className="card">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Pour qui est ce cadeau ?</h2>
 <div className="space-y-4">
 <div><label className="label mb-1 block">Nom du destinataire *</label><input value={form.destinataire_nom} onChange={e => handleChange('destinataire_nom', e.target.value)} placeholder="Prénom du bénéficiaire" className="input w-full" required /></div>
 <div><label className="label mb-1 block">Message personnel (optionnel)</label><textarea value={form.message} onChange={e => handleChange('message', e.target.value)} placeholder="Ex : Joyeux anniversaire !" rows={3} className="input w-full resize-none" /></div>
 </div>
 </div>

 {/* Mode de paiement */}
 <div className="card">
 <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">Mode de paiement</h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
 <button type="button" onClick={() => setPaymentMethod('cb')}
 className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${paymentMethod === 'cb' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500'}`}>
 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
 Carte bancaire
 </button>
 <button type="button" onClick={() => setPaymentMethod('paypal')}
 className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${paymentMethod === 'paypal' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500'}`}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
 PayPal
 </button>
 <button type="button" onClick={() => setPaymentMethod('virement')}
 className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${paymentMethod === 'virement' ? 'bg-gold-500 text-noir-950 border-gold-500' : 'border-noir-700 text-noir-300 hover:border-gold-500'}`}>
 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
 Virement
 </button>
 </div>
 {paymentMethod === 'virement' && (
 <div className="mt-3 bg-gold-500/10 border border-gold-500/20 rounded-lg p-3">
 <p className="text-gold-400 text-xs font-medium mb-1">Paiement par virement</p>
 <p className="text-noir-400 text-xs">Après validation, vous recevrez les coordonnées bancaires. Le code cadeau sera envoyé dès réception du virement.</p>
 </div>
 )}
 </div>

 {/* Récap */}
 <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
 <div className="flex justify-between items-center mb-1">
 <span className="text-noir-300 text-sm">{form.formule_label} pour {form.destinataire_nom || '...'}</span>
 <span className="text-gold-400 font-bold text-lg">{form.montant} €</span>
 </div>
 <p className="text-noir-500 text-xs">Valable 1 an.</p>
 </div>

 {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

 <button type="submit" className="btn-gold w-full text-base py-3.5" disabled={loading}>
 {loading ? 'Traitement en cours...' : paymentMethod === 'cb' ? `Payer ${form.montant} € par carte` : `Valider ma commande (${form.montant} €)`}
 </button>

 <p className="text-center text-xs text-noir-600">
 Les champs marqués d&apos;un <span className="text-red-400">*</span> sont obligatoires.
 </p>
 </form>
 </div>
 </div>
 )
}
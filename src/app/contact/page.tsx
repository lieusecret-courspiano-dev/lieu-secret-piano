'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [sending, setSending] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    // Cache-busting pour avoir le téléphone à jour
    fetch('/api/settings', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d?.phone) setPhone(d.phone)
    }).catch(() => {})
  }, [])
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true); setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSent(true); setForm({ nom: '', email: '', sujet: '', message: '' }) }
      else setError('Une erreur est survenue. Veuillez réessayer.')
    } catch { setError('Une erreur est survenue. Veuillez réessayer.') }
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />

      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.05),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Contact</span>
            <h1 className="font-serif text-5xl md:text-6xl text-white mt-4 mb-6">
              Parlons <span className="text-gold-400">musique</span>
            </h1>
            <p className="text-noir-300 text-lg leading-relaxed">
              Une question sur nos cours ? Envie de commencer ? Nous sommes là pour vous accompagner.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4 pb-24">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <FadeUp>
              <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6">
                <h2 className="font-serif text-xl text-white mb-6">Nous trouver</h2>
                <div className="space-y-5">
                  {([
                    { label: 'Email', value: 'lieusecret-courspiano@outlook.fr', href: 'mailto:lieusecret-courspiano@outlook.fr', svg: <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    
                    { label: 'Réponse', value: 'Sous 24-48h ouvrées', href: null as string | null, svg: <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    { label: 'Disponibilité', value: 'Lun–Sam, 9h–20h', href: null as string | null, svg: <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  ] as { label: string; value: string; href: string | null; svg: React.ReactNode }[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">{item.svg}</div>
                      <div>
                        <div className="text-noir-500 text-xs mb-0.5">{item.label}</div>
                        {item.href
                          ? <a href={item.href} className="text-white text-sm hover:text-gold-400 transition-colors">{item.value}</a>
                          : <div className="text-white text-sm">{item.value}</div>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="bg-gradient-to-br from-gold-500/10 to-noir-900 border border-gold-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-2">Cours d'essai gratuit</h3>
                <p className="text-noir-400 text-sm mb-4">La meilleure façon de commencer est de réserver votre cours d'essai gratuit d'une heure.</p>
                <a href="/essai" className="btn-gold text-sm w-full text-center block">Réserver maintenant</a>
              </div>
            </FadeUp>
          </div>

          <div className="lg:col-span-3">
            <FadeUp delay={0.15}>
              <div className="bg-noir-900 border border-noir-800 rounded-2xl p-8">
                <h2 className="font-serif text-2xl text-white mb-6">Envoyer un message</h2>
                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Message envoyé !</h3>
                    <p className="text-noir-400 text-sm">Nous vous répondrons dans les 24-48h ouvrées.</p>
                    <button onClick={() => setSent(false)} className="mt-6 text-gold-400 hover:text-gold-300 text-sm underline">
                      Envoyer un autre message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">Nom complet *</label>
                        <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                          className="input" placeholder="Prénom Nom" required />
                      </div>
                      <div>
                        <label className="label mb-1.5 block">Email *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          className="input" placeholder="vous@exemple.com" required />
                      </div>
                    </div>
                    <div>
                      <label className="label mb-1.5 block">Sujet</label>
                      <select value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} className="input">
                        <option value="">Choisir un sujet...</option>
                        <option value="cours">Renseignements sur les cours</option>
                        <option value="tarifs">Questions sur les tarifs</option>
                        <option value="essai">Cours d'essai gratuit</option>
                        <option value="pack">Achat d'un pack</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="label mb-1.5 block">Message *</label>
                      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        className="input h-32 resize-none" placeholder="Votre message..." required />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" disabled={sending} className="btn-gold w-full py-3">
                      {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                    </button>
                    <p className="text-noir-600 text-xs text-center">
                      Vos données sont traitées conformément à notre{' '}
                      <a href="/confidentialite" className="text-noir-500 hover:text-gold-400 underline">politique de confidentialité</a>.
                    </p>
                  </form>
                )}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
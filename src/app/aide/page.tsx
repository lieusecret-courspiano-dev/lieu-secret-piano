'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeProvider'
import SiteHeader from '@/components/SiteHeader'

const FAQ = [
  // ── Cours d'essai ──
  { cat: "Cours d'essai", q: "Comment fonctionne le cours d'essai gratuit ?", a: "Le cours d'essai est une séance individuelle d'1 heure offerte, sans engagement et sans carte bancaire requise. Remplissez le formulaire sur la page 'Cours d'essai gratuit', indiquez votre niveau et vos disponibilités. Nous vous contacterons pour convenir d'un créneau." },
  { cat: "Cours d'essai", q: "Le cours d'essai est-il vraiment gratuit ?", a: "Oui, totalement gratuit. Aucune carte bancaire n'est demandée. C'est une invitation à découvrir notre approche pédagogique sans aucun engagement de votre part." },
  { cat: "Cours d'essai", q: "Que se passe-t-il après le cours d'essai ?", a: "Après votre cours d'essai, vous pouvez choisir de continuer avec un cours à l'unité (22 €/h) ou un pack d'heures. Aucune obligation, vous décidez librement." },

  // ── Espace élève ──
  { cat: 'Espace élève', q: "Comment accéder à mon espace élève ?", a: "Cliquez sur 'Espace Élève' dans le menu. Connectez-vous avec votre email et mot de passe. Si c'est votre première connexion, vous avez reçu un email de bienvenue avec un lien pour créer votre mot de passe." },
  { cat: 'Espace élève', q: "Je n'ai pas reçu l'email de bienvenue.", a: "Vérifiez votre dossier Spam. Sinon, allez sur la page de connexion, cliquez sur 'Créer un compte' et inscrivez-vous directement avec votre email. Votre historique (packs, réservations) sera automatiquement rattaché à votre compte." },
  { cat: 'Espace élève', q: "J'ai oublié mon mot de passe.", a: "Sur la page de connexion, cliquez sur 'Mot de passe oublié ?'. Saisissez votre email et vous recevrez un lien valable 2 heures. Vérifiez aussi votre dossier Spam." },
  { cat: 'Espace élève', q: "Que puis-je faire dans mon espace élève ?", a: "Votre espace élève vous permet de : réserver vos cours directement, consulter vos réservations à venir et passées, gérer votre pack d'heures, suivre votre progression, accéder aux ressources pédagogiques, consulter vos notes de cours, télécharger vos certificats, parrainer des proches et recevoir des notifications." },
  { cat: 'Espace élève', q: "Comment réserver un cours depuis mon espace élève ?", a: "Dans votre espace élève, cliquez sur 'Réserver un cours'. Le système connaît déjà votre identité et vos packs actifs. Choisissez simplement votre créneau, sélectionnez votre mode de paiement (pack, CB ou bon cadeau) et confirmez. Vous restez dans votre espace tout au long du processus." },
  { cat: 'Espace élève', q: "Puis-je annuler un cours depuis mon espace élève ?", a: "Oui. Dans 'Mes réservations', cliquez sur 'Annuler ce cours' pour les cours à venir. Si vous avez utilisé un code pack, votre heure est automatiquement remise sur votre solde. L'annulation apparaît dans l'historique de votre pack." },

  // ── Pack de cours ──
  { cat: 'Pack de cours', q: "Qu'est-ce qu'un code PK ?", a: "Un code PK (ex: PK-ABCD-1234) est votre code pack de cours. Il vous est envoyé par email dès que votre pack est activé. Il vous permet de réserver des cours en débitant automatiquement 1 heure de votre solde." },
  { cat: 'Pack de cours', q: "Comment acheter un pack de cours ?", a: "Rendez-vous sur la page 'Acheter un pack' (accessible depuis le menu ou votre espace élève). Choisissez votre formule, puis payez par carte bancaire (activation immédiate) ou par virement bancaire (activation après réception du paiement)." },
  { cat: 'Pack de cours', q: "Comment réserver un cours avec mon code PK ?", a: "Depuis votre espace élève, cliquez sur 'Réserver un cours' — votre pack est sélectionné automatiquement. Depuis la page publique, choisissez votre créneau, sélectionnez 'Déjà payé', saisissez votre code PK et confirmez. 1 heure est débitée automatiquement." },
  { cat: 'Pack de cours', q: "Comment consulter mes heures restantes et l'historique ?", a: "Dans votre espace élève, cliquez sur 'Mon pack'. Vous verrez vos heures restantes, utilisées, et l'historique complet de tous les mouvements (achats, cours, ajustements, parrainages, annulations)." },
  { cat: 'Pack de cours', q: "Mon pack expire-t-il ?", a: "Oui, les packs ont une durée de validité d'un an à partir de la date d'activation. Vous recevrez un rappel automatique par email quand il vous reste 2 heures ou 1 heure, ainsi qu'une alerte si votre pack approche de sa date d'expiration." },
  { cat: 'Pack de cours', q: "Que se passe-t-il si mon pack est épuisé ?", a: "Quand votre solde atteint 0 heure, votre pack passe en statut 'Épuisé'. Vous recevez un email de rappel. Vous pouvez recharger votre pack depuis votre espace élève ou la page 'Acheter un pack'." },
  { cat: 'Pack de cours', q: "Puis-je payer un pack par virement bancaire ?", a: "Oui. Choisissez 'Virement bancaire' lors de l'achat. Vous recevrez les coordonnées bancaires par email. Votre pack sera activé et votre code PK généré automatiquement dès réception du virement." },

  // ── Réservation ──
  { cat: 'Réservation', q: "Quels sont les modes de paiement disponibles ?", a: "Trois modes : (1) Carte bancaire via Stripe — paiement immédiat et sécurisé, (2) Code pack PK — déduction automatique d'une heure, (3) Bon cadeau avec code LS — déduction du montant disponible." },
  { cat: 'Réservation', q: "Je n'ai pas reçu l'email de confirmation.", a: "Vérifiez votre dossier Spam. Si vous avez choisi le virement, l'email de confirmation avec le lien Zoom sera envoyé après réception de votre paiement. Pour un paiement CB ou pack, l'email est envoyé immédiatement." },
  { cat: 'Réservation', q: "Comment se déroule le cours en ligne ?", a: "Tous les cours se déroulent en ligne via Zoom. Le lien de connexion vous est envoyé par email dans votre confirmation de réservation. Assurez-vous d'avoir un piano ou clavier accessible." },
  { cat: 'Réservation', q: "Les créneaux affichés sont-ils dans mon fuseau horaire ?", a: "Oui. Sur la page de réservation, sélectionnez votre fuseau horaire dans le sélecteur en haut. Tous les créneaux s'affichent automatiquement dans votre heure locale." },

  // ── Bons cadeaux ──
  { cat: 'Bons cadeaux', q: "Comment offrir un bon cadeau ?", a: "Rendez-vous sur la page 'Bon cadeau'. Choisissez le montant, renseignez vos coordonnées et celles du bénéficiaire, puis payez par CB ou virement. Le bénéficiaire reçoit son code LS-XXXX-XXXX par email." },
  { cat: 'Bons cadeaux', q: "Comment utiliser un bon cadeau ?", a: "Sur la page de réservation, sélectionnez 'Bon cadeau', saisissez votre code LS-XXXX-XXXX et cliquez sur 'Vérifier'. Si le bon couvre entièrement le cours, la réservation est confirmée gratuitement. S'il reste un solde insuffisant, vous payez la différence par CB." },
  { cat: 'Bons cadeaux', q: "Le bon cadeau a-t-il une date d'expiration ?", a: "Oui, les bons cadeaux ont une durée de validité. La date d'expiration est indiquée dans l'email de confirmation. Pensez à l'utiliser avant cette date." },

  // ── Parrainage ──
  { cat: 'Parrainage', q: "Comment fonctionne le système de parrainage ?", a: "Depuis votre espace élève, cliquez sur 'Parrainage' pour obtenir votre code unique REF-XXXXXX. Partagez votre lien de parrainage à vos proches. Quand ils s'inscrivent et réservent leur premier cours, vous recevez automatiquement 1 heure offerte sur votre pack." },
  { cat: 'Parrainage', q: "Quand est-ce que je reçois mon heure de parrainage ?", a: "L'heure est créditée automatiquement après validation du parrainage, c'est-à-dire 48h après l'inscription de votre filleul ET après qu'il ait réservé son premier cours. Vous recevrez un email de confirmation." },
  { cat: 'Parrainage', q: "Je n'ai pas encore de pack — est-ce que je perds mon heure de parrainage ?", a: "Non, votre heure est conservée en crédit. Dès que vous achetez un pack (par CB ou virement confirmé), les heures en attente sont automatiquement ajoutées à votre solde." },
  { cat: 'Parrainage', q: "Y a-t-il une limite au nombre de parrainages ?", a: "Vous pouvez parrainer jusqu'à 10 personnes. Chaque parrainage validé vous rapporte 1 heure offerte, soit jusqu'à 10 heures gratuites au total." },

  { cat: 'Progression & Certificats', q: "Comment fonctionne le suivi de progression ?", a: "La formation est organisée en 3 niveaux (Fondamentaux, Compréhension et autonomie, Expression et maîtrise) avec 48 compétences au total. Votre professeur valide chaque compétence après les cours. Consultez votre progression dans 'Ma progression' — les barres de progression par niveau et le pourcentage global sont mis à jour en temps réel." },
  { cat: 'Progression & Certificats', q: "Où trouver mes notes de cours ?", a: "Dans votre espace élève, cliquez sur 'Notes de cours'. Votre professeur y dépose après chaque séance : le résumé du cours, les notions travaillées, les exercices à faire et les objectifs de la semaine." },
  { cat: 'Progression & Certificats', q: "Comment accéder aux partitions et ressources pédagogiques ?", a: "Dans votre espace élève, cliquez sur 'Partitions' pour accéder à la bibliothèque. Vous pouvez filtrer par niveau et style musical, télécharger les PDF et écouter les fichiers audio associés." },

  { cat: 'Progression & Certificats', q: "Comment obtenir un certificat ?", a: "Les certificats sont générés automatiquement quand toutes les compétences d'un niveau sont validées par votre professeur. Vous recevrez une notification et un email de félicitations. Téléchargez votre certificat en PDF depuis 'Mes certificats' dans votre espace élève. Il existe 3 certificats de niveau + 1 diplôme final." },
  { cat: 'Progression & Certificats', q: "Mes certificats sont-ils officiels ?", a: "Les certificats Lieu Secret attestent de votre progression et des compétences validées par votre professeur. Ils portent un numéro unique (ex: LS-2026-001) et peuvent être partagés ou imprimés." },

  // ── Travaux à faire ──
  { cat: 'Travaux à faire', q: "Qu'est-ce que la section 'Travail à faire' ?", a: "Votre professeur peut vous assigner des exercices à réaliser entre les cours. Vous les retrouvez dans votre espace élève sous 'Travail à faire'. Chaque exercice peut avoir une description, des consignes détaillées, un lien vers une ressource et une date d'échéance." },
  { cat: 'Travaux à faire', q: "Comment marquer un travail comme terminé ?", a: "Dans votre espace élève, cliquez sur 'Travail à faire'. Cliquez sur le cercle à gauche de l'exercice pour le cocher comme terminé. Vous pouvez aussi le décocher si vous souhaitez y revenir." },
  { cat: 'Travaux à faire', q: "Que signifie 'En retard' sur un travail ?", a: "Si la date d'échéance d'un exercice est dépassée et qu'il n'est pas encore coché comme terminé, il apparaît en rouge avec la mention 'En retard'. Contactez votre professeur si vous avez besoin d'un délai supplémentaire." },
  { cat: 'Travaux à faire', q: "Suis-je notifié quand un nouveau travail est assigné ?", a: "Oui. Vous recevez automatiquement un email et une notification dans votre espace élève dès que votre professeur vous assigne un nouvel exercice." },

  // ── Progression & Certificats ──
  { cat: 'Progression & Certificats', q: "Comment est organisée ma progression ?", a: "La formation Lieu Secret est structurée en 3 niveaux : (1) Fondamentaux — 17 compétences (notes, gammes, accords de base), (2) Compréhension et autonomie — 17 compétences (renversements, oreille musicale, playback), (3) Expression et maîtrise — 14 compétences (accords enrichis, improvisation, arrangements). Votre professeur valide chaque compétence au fil des cours." },
  { cat: 'Progression & Certificats', q: "Comment sont générés les certificats ?", a: "Les certificats sont générés automatiquement quand toutes les compétences d'un niveau sont validées par votre professeur. Vous recevez alors un email de félicitations et une notification dans votre espace élève. Le certificat est téléchargeable en PDF depuis 'Mes certificats'." },
  { cat: 'Progression & Certificats', q: "Qu'est-ce que le Diplôme final ?", a: "Quand les 3 niveaux sont entièrement validés (48 compétences au total), vous obtenez automatiquement le 'Diplôme de maîtrise de l'accompagnement au piano — Lieu Secret'. C'est la reconnaissance de la formation complète." },
  { cat: 'Progression & Certificats', q: "Puis-je voir quelles compétences ont été validées ?", a: "Oui. Dans votre espace élève, cliquez sur 'Ma progression'. Chaque catégorie est dépliable et affiche la liste complète des compétences avec une coche verte pour celles validées et la date de validation." },

  // ── Avatar & Profil ──
  { cat: 'Mon profil', q: "Comment personnaliser mon avatar ?", a: "Dans votre tableau de bord élève, cliquez sur l'icône en haut à gauche de votre nom. Un sélecteur s'ouvre avec 6 avatars au choix (Piano, Notes, Clé de sol, Étoile, Cœur, Couronne). Votre choix est sauvegardé automatiquement." },

  // ── Technique ──
  { cat: 'Technique', q: "De quel matériel ai-je besoin ?", a: "Un piano ou clavier (au moins 61 touches recommandées), une connexion internet stable, et Zoom installé. Un casque audio est conseillé pour une meilleure qualité sonore." },
  { cat: 'Technique', q: "Comment changer mon fuseau horaire ?", a: "Sur la page de réservation, utilisez le sélecteur de fuseau horaire. Dans votre espace élève, le fuseau est détecté automatiquement. Vous pouvez le modifier à tout moment." },
  { cat: 'Technique', q: "Comment supprimer mon compte ?", a: "Dans votre espace élève, allez dans les paramètres de votre profil et cliquez sur 'Supprimer mon compte'. Cette action est irréversible. Vos données seront effacées conformément au RGPD." },
]

const CATS = Array.from(new Set(FAQ.map(f => f.cat)))

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setError('')
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, subject: 'Question depuis la FAQ', message: form.message }) })
      if (!res.ok) throw new Error('Erreur')
      setSent(true)
    } catch { setError("Erreur lors de l'envoi. Réessayez.") }
    finally { setSending(false) }
  }

  if (sent) return <div className="text-center py-4"><svg className="mx-auto mb-3 text-green-400" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p className="text-green-400 font-medium">Message envoyé !</p><p className="text-noir-400 text-sm mt-1">Votre professeur vous répondra dans les plus brefs délais.</p></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label mb-1 block">Votre nom *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" className="input w-full" required /></div>
        <div><label className="label mb-1 block">Votre email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vous@exemple.com" className="input w-full" required /></div>
      </div>
      <div><label className="label mb-1 block">Votre question *</label><textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez votre question..." className="input w-full h-24 resize-none" required /></div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={sending} className="btn-gold w-full">{sending ? 'Envoi...' : 'Envoyer ma question'}</button>
    </form>
  )
}

export default function AidePage() {
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [activeCat, setActiveCat] = useState('Tous')
  const [search, setSearch] = useState('')

  const filtered = FAQ.filter(item => {
    const matchCat = activeCat === 'Tous' || item.cat === activeCat
    const matchSearch = !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10"><div className="text-gold-500 text-xs tracking-widest uppercase mb-3">Centre d&apos;aide</div><h1 className="font-serif text-4xl text-white mb-4 animate-fade-in-up">Questions fréquentes</h1><p className="text-noir-400 max-w-xl mx-auto">Trouvez rapidement les réponses à vos questions sur l&apos;utilisation de votre espace élève et des services Lieu Secret.</p></div>
        <div className="relative mb-8"><svg className="absolute left-4 top-1/2 -translate-y-1/2 text-noir-400" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une question..." className="input w-full pl-12 py-4 text-base" /></div>
        <div className="flex flex-wrap gap-2 mb-8">{['Tous', ...CATS].map(cat => (<button key={cat} onClick={() => setActiveCat(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCat === cat ? 'bg-gold-500 text-noir-950' : 'bg-noir-800 text-noir-400 hover:text-white hover:bg-noir-700'}`}>{cat}</button>))}</div>
        <div className="space-y-3">
          {filtered.length === 0 ? <div className="card text-center py-12"><p className="text-noir-400">Aucune question trouvée. <button onClick={() => { setSearch(''); setActiveCat('Tous') }} className="text-gold-400 hover:text-gold-300">Réinitialiser</button></p></div> : filtered.map((item, i) => (
            <div key={i} className={`card transition-all cursor-pointer ${openItem === i ? 'border-gold-500/30' : 'hover:border-noir-700'}`} onClick={() => setOpenItem(openItem === i ? null : i)}>
              <div className="flex items-start justify-between gap-4"><div className="flex-1"><span className="text-xs text-gold-500 uppercase tracking-wider mb-1 block">{item.cat}</span><p className={`font-medium text-sm ${openItem === i ? 'text-white' : 'text-noir-200'}`}>{item.q}</p></div><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`shrink-0 mt-1 text-noir-400 transition-transform ${openItem === i ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg></div>
              {openItem === i && <div className="mt-4 pt-4 border-t border-noir-800"><p className="text-noir-300 text-sm leading-relaxed">{item.a}</p></div>}
            </div>
          ))}
        </div>
        <div className="mt-12 card border-gold-500/20"><h3 className="font-serif text-xl text-white mb-2 text-center">Vous n&apos;avez pas trouvé votre réponse ?</h3><p className="text-noir-400 text-sm mb-6 text-center">Envoyez-nous un message directement.</p><ContactForm /></div>
      </div>
    </div>
  )
}

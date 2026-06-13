'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle } from 'lucide-react'

interface Settings {
  [key: string]: string
  site_title: string
  site_description: string
  contact_email: string
  phone: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  virement_iban: string
  virement_nom: string
  virement_info: string
  hero_title: string
  hero_title2: string
  hero_subtitle: string
  hero_btn1: string
  hero_btn2: string
  apropos_titre: string
  apropos_texte1: string
  apropos_texte2: string
  apropos_point1: string
  apropos_point2: string
  apropos_point3: string
  apropos_point4: string
  offres_titre: string
  offres_sous_titre: string
  offre1_titre: string
  offre1_sous: string
  offre1_desc: string
  offre1_btn: string
  offre1_f1: string
  offre1_f2: string
  offre1_f3: string
  offre1_f4: string
  offre2_titre: string
  offre2_sous: string
  offre2_desc: string
  offre2_btn: string
  offre2_f1: string
  offre2_f2: string
  offre2_f3: string
  offre2_f4: string
  offre3_titre: string
  offre3_sous: string
  offre3_desc: string
  offre3_btn: string
  offre3_f1: string
  offre3_f2: string
  offre3_f3: string
  offre3_f4: string
  steps_label: string
  steps_titre: string
  cta_titre: string
  cta_sous_titre: string
  stats_label1: string
  stats_label2: string
  stats_label3: string
  stats_label4: string
  zoom_cours: string
  zoom_atelier: string
  zoom_masterclass: string
  zoom_evenement: string
  stripe_public_key: string
  cours_access_code: string
  // Professeur
  prof_nom: string
  prof_titre: string
  prof_photo: string
  prof_bio: string
  prof_vision: string
  prof_pedagogie: string
  tab_cours_label: string
  tab_events_label: string
  espace_eleves_title: string
  espace_eleves_desc: string
  reservation_titre: string
  reservation_no_slot: string
  reservation_select_date: string
  reservation_code_placeholder: string
  reservation_code_btn: string
  reservation_contact_link: string
  banner_actif: string
  banner_message: string
  banner_type: string
  tarif_cours_1h: string
  tarif_pack_label1: string
  tarif_pack_prix1: string
  tarif_pack_desc1: string
  tarif_pack_label2: string
  tarif_pack_prix2: string
  tarif_pack_desc2: string
  tarif_pack_label3: string
  tarif_pack_prix3: string
  tarif_pack_desc3: string
  tarif_pack_label4: string
  tarif_pack_prix4: string
  tarif_pack_desc4: string
}

const EMPTY: Settings = {
  site_title: '', site_description: '', contact_email: '', phone: '',
  instagram: '', facebook: '', youtube: '', tiktok: '',
  virement_iban: '', virement_nom: '', virement_info: '',
  hero_title: '', hero_title2: '', hero_subtitle: '', hero_btn1: '', hero_btn2: '',
  apropos_titre: '', apropos_texte1: '', apropos_texte2: '',
  apropos_point1: '', apropos_point2: '', apropos_point3: '', apropos_point4: '',
  offres_titre: '', offres_sous_titre: '',
  offre1_titre: '', offre1_sous: '', offre1_desc: '', offre1_btn: '',
  offre1_f1: '', offre1_f2: '', offre1_f3: '', offre1_f4: '',
  offre2_titre: '', offre2_sous: '', offre2_desc: '', offre2_btn: '',
  offre2_f1: '', offre2_f2: '', offre2_f3: '', offre2_f4: '',
  offre3_titre: '', offre3_sous: '', offre3_desc: '', offre3_btn: '',
  offre3_f1: '', offre3_f2: '', offre3_f3: '', offre3_f4: '',
  steps_label: '', steps_titre: '',
  cta_titre: '', cta_sous_titre: '',
  stats_label1: '', stats_label2: '', stats_label3: '', stats_label4: '',
  zoom_cours: '', zoom_atelier: '', zoom_masterclass: '', zoom_evenement: '',
  stripe_public_key: '', cours_access_code: '',
  prof_nom: '', prof_titre: '', prof_photo: '', prof_bio: '', prof_vision: '', prof_pedagogie: '',
  tab_cours_label: '', tab_events_label: '',
  espace_eleves_title: '', espace_eleves_desc: '',
  reservation_titre: '', reservation_no_slot: '',
  reservation_select_date: '', reservation_code_placeholder: '', reservation_code_btn: '', reservation_contact_link: '',
  banner_actif: 'false', banner_message: '', banner_type: 'info',
  tarif_cours_1h: '22', tarif_pack_label1: 'Pack 5h', tarif_pack_prix1: '100', tarif_pack_desc1: '5 heures de cours',
  tarif_pack_label2: '', tarif_pack_prix2: '', tarif_pack_desc2: '',
  tarif_pack_label3: '', tarif_pack_prix3: '', tarif_pack_desc3: '',
  tarif_pack_label4: '', tarif_pack_prix4: '', tarif_pack_desc4: '',
}

type Section = {
  title: string
  fields: { key: string; label: string; type: string; placeholder: string; options?: string[] }[]
}

const SECTIONS: Section[] = [
  {
    title: 'Informations générales',
    fields: [
      { key: 'site_title',       label: 'Titre du site',    type: 'text',     placeholder: 'Lieu Secret — École de Piano' },
      { key: 'site_description', label: 'Description',      type: 'textarea', placeholder: 'Description du site...' },
      { key: 'contact_email',    label: 'Email de contact', type: 'email',    placeholder: 'contact@lieusecret-courspiano.fr' },
      { key: 'phone',            label: 'Téléphone',        type: 'text',     placeholder: '+33 6 00 00 00 00' },
    ],
  },
  {
    title: 'Hero — Titre et sous-titre',
    fields: [
      { key: 'hero_title',    label: 'Titre principal (ligne 1)', type: 'text',     placeholder: "L'art du piano," },
      { key: 'hero_title2',   label: 'Titre ligne 2 (en doré)',   type: 'text',     placeholder: 'à votre rythme' },
      { key: 'hero_subtitle', label: 'Sous-titre',                type: 'textarea', placeholder: 'Cours individuels, ateliers...' },
      { key: 'hero_btn1',     label: 'Bouton principal (doré)',   type: 'text',     placeholder: 'Réserver un créneau' },
      { key: 'hero_btn2',     label: 'Bouton secondaire',         type: 'text',     placeholder: 'Découvrir les offres' },
    ],
  },
  {
    title: 'Hero — Statistiques (bas du hero)',
    fields: [
      { key: 'stats_label1', label: 'Stat 1 (format: Valeur Description)', type: 'text', placeholder: '100% En ligne' },
      { key: 'stats_label2', label: 'Stat 2', type: 'text', placeholder: '1h Cours individuel' },
      { key: 'stats_label3', label: 'Stat 3', type: 'text', placeholder: 'Monde entier Fuseaux horaires' },
      { key: 'stats_label4', label: 'Stat 4', type: 'text', placeholder: 'Tous niveaux Débutant à avancé' },
    ],
  },
  {
    title: 'Votre professeur',
    fields: [
      { key: 'prof_nom',       label: 'Nom complet',          type: 'text',     placeholder: 'Prénom Nom' },
      { key: 'prof_titre',     label: 'Titre / Spécialité',   type: 'text',     placeholder: 'Pianiste & Pédagogue' },
      { key: 'prof_photo',     label: 'URL de la photo',      type: 'text',     placeholder: 'https://... (lien direct vers votre photo)' },
      { key: 'prof_bio',       label: 'Biographie',           type: 'textarea', placeholder: 'Présentez-vous en quelques lignes...' },
      { key: 'prof_vision',    label: 'Vision',             type: 'textarea', placeholder: 'Vos études, diplômes, expériences...' },
      { key: 'prof_pedagogie', label: 'Pédagogie',            type: 'textarea', placeholder: 'Votre approche pédagogique, vos méthodes...' },
    ],
  },
  {
    title: 'Section À propos',
    fields: [
      { key: 'apropos_titre',  label: 'Titre',         type: 'text',     placeholder: 'Un espace musical unique et bienveillant' },
      { key: 'apropos_texte1', label: 'Paragraphe 1',  type: 'textarea', placeholder: 'Lieu Secret est une école...' },
      { key: 'apropos_texte2', label: 'Paragraphe 2',  type: 'textarea', placeholder: 'Chaque cours est une invitation...' },
      { key: 'apropos_point1', label: 'Point clé 1',   type: 'text',     placeholder: 'Cours 100% en ligne via Zoom' },
      { key: 'apropos_point2', label: 'Point clé 2',   type: 'text',     placeholder: 'Créneaux flexibles' },
      { key: 'apropos_point3', label: 'Point clé 3',   type: 'text',     placeholder: 'Gestion fuseaux horaires' },
      { key: 'apropos_point4', label: 'Point clé 4',   type: 'text',     placeholder: 'Confirmation par email avec .ics' },
    ],
  },
  {
    title: 'Section Nos offres',
    fields: [
      { key: 'offres_titre',      label: 'Titre de la section', type: 'text', placeholder: 'Choisissez votre formule' },
      { key: 'offres_sous_titre', label: 'Sous-titre',          type: 'text', placeholder: 'Des cours adaptés à chaque profil...' },
    ],
  },
  {
    title: 'Carte Offre 1 (Cours individuel)',
    fields: [
      { key: 'offre1_titre', label: 'Titre',       type: 'text',     placeholder: 'Cours individuel' },
      { key: 'offre1_sous',  label: 'Sous-titre',  type: 'text',     placeholder: 'Sur mesure' },
      { key: 'offre1_desc',  label: 'Description', type: 'textarea', placeholder: 'Un cours dédié entièrement à vous...' },
      { key: 'offre1_btn',   label: 'Bouton',      type: 'text',     placeholder: 'Réserver un créneau' },
      { key: 'offre1_f1',    label: 'Point 1',     type: 'text',     placeholder: '1h de cours en tête-à-tête' },
      { key: 'offre1_f2',    label: 'Point 2',     type: 'text',     placeholder: 'Créneau flexible' },
      { key: 'offre1_f3',    label: 'Point 3',     type: 'text',     placeholder: 'Suivi personnalisé' },
      { key: 'offre1_f4',    label: 'Point 4',     type: 'text',     placeholder: 'Lien Zoom envoyé par email' },
    ],
  },
  {
    title: 'Carte Offre 2 (Atelier de groupe)',
    fields: [
      { key: 'offre2_titre', label: 'Titre',       type: 'text',     placeholder: 'Atelier de groupe' },
      { key: 'offre2_sous',  label: 'Sous-titre',  type: 'text',     placeholder: 'Collectif' },
      { key: 'offre2_desc',  label: 'Description', type: 'textarea', placeholder: 'Apprenez en groupe...' },
      { key: 'offre2_btn',   label: 'Bouton',      type: 'text',     placeholder: 'Voir les ateliers' },
      { key: 'offre2_f1',    label: 'Point 1',     type: 'text',     placeholder: "Jusqu'à 8 participants" },
      { key: 'offre2_f2',    label: 'Point 2',     type: 'text',     placeholder: "Thème défini à l'avance" },
      { key: 'offre2_f3',    label: 'Point 3',     type: 'text',     placeholder: 'Échanges et partage' },
      { key: 'offre2_f4',    label: 'Point 4',     type: 'text',     placeholder: 'Gratuit ou payant' },
    ],
  },
  {
    title: 'Carte Offre 3 (Masterclass)',
    fields: [
      { key: 'offre3_titre', label: 'Titre',       type: 'text',     placeholder: 'Masterclass' },
      { key: 'offre3_sous',  label: 'Sous-titre',  type: 'text',     placeholder: 'Perfectionnement' },
      { key: 'offre3_desc',  label: 'Description', type: 'textarea', placeholder: 'Poussez votre technique...' },
      { key: 'offre3_btn',   label: 'Bouton',      type: 'text',     placeholder: 'Voir les masterclass' },
      { key: 'offre3_f1',    label: 'Point 1',     type: 'text',     placeholder: 'Niveau intermédiaire/avancé' },
      { key: 'offre3_f2',    label: 'Point 2',     type: 'text',     placeholder: 'Technique approfondie' },
      { key: 'offre3_f3',    label: 'Point 3',     type: 'text',     placeholder: 'Petits groupes (6 max)' },
      { key: 'offre3_f4',    label: 'Point 4',     type: 'text',     placeholder: 'Enregistrement disponible' },
    ],
  },
  {
    title: 'Section Comment ça marche',
    fields: [
      { key: 'steps_label', label: 'Label',  type: 'text', placeholder: 'Simple et rapide' },
      { key: 'steps_titre', label: 'Titre',  type: 'text', placeholder: 'Comment ça marche ?' },
    ],
  },
  {
    title: 'Bandeau Prêt à commencer',
    fields: [
      { key: 'cta_titre',      label: 'Titre',      type: 'text', placeholder: 'Prêt(e) à commencer ?' },
      { key: 'cta_sous_titre', label: 'Sous-titre', type: 'text', placeholder: 'Réservez votre premier cours...' },
    ],
  },
  {
    title: 'Page de réservation — Textes',
    fields: [
      { key: 'tab_cours_label',              label: 'Onglet Cours individuels',    type: 'text',     placeholder: 'Cours individuels' },
      { key: 'tab_events_label',             label: 'Onglet Ateliers/Événements',  type: 'text',     placeholder: 'Ateliers & Événements' },
      { key: 'espace_eleves_title',          label: 'Titre espace élèves',         type: 'text',     placeholder: 'Espace élèves' },
      { key: 'espace_eleves_desc',           label: 'Description espace élèves',   type: 'textarea', placeholder: 'Les cours individuels sont réservés...' },
      { key: 'reservation_code_placeholder', label: 'Placeholder code accès',      type: 'text',     placeholder: "Votre code d'accès" },
      { key: 'reservation_code_btn',         label: 'Bouton accès créneaux',       type: 'text',     placeholder: 'Accéder aux créneaux' },
      { key: 'reservation_contact_link',     label: 'Texte lien contact',          type: 'text',     placeholder: 'Pas encore élève ?' },
      { key: 'reservation_select_date',      label: 'Message sélection date',      type: 'text',     placeholder: 'Sélectionnez une date pour voir les créneaux' },
      { key: 'reservation_no_slot',          label: 'Message aucun créneau',       type: 'text',     placeholder: 'Aucun créneau disponible ce jour.' },
    ],
  },
  {
    title: 'Formules bons cadeaux',
    fields: [
      { key: 'cadeau_formule1_label', label: 'Formule 1 - Nom',         type: 'text', placeholder: 'Bon Découverte' },
      { key: 'cadeau_formule1_desc',  label: 'Formule 1 - Description', type: 'text', placeholder: '1 cours de piano' },
      { key: 'cadeau_formule1_prix',  label: 'Formule 1 - Prix (EUR)',  type: 'text', placeholder: '22' },
      { key: 'cadeau_formule2_label', label: 'Formule 2 - Nom',         type: 'text', placeholder: 'Bon Progression' },
      { key: 'cadeau_formule2_desc',  label: 'Formule 2 - Description', type: 'text', placeholder: '3 cours de piano' },
      { key: 'cadeau_formule2_prix',  label: 'Formule 2 - Prix (EUR)',  type: 'text', placeholder: '60' },
      { key: 'cadeau_formule3_label', label: 'Formule 3 - Nom',         type: 'text', placeholder: 'Bon Immersion' },
      { key: 'cadeau_formule3_desc',  label: 'Formule 3 - Description', type: 'text', placeholder: '5 cours de piano' },
      { key: 'cadeau_formule3_prix',  label: 'Formule 3 - Prix (EUR)',  type: 'text', placeholder: '90' },
    ],
  },
  {
    title: 'Message en vedette (banniere)',
    fields: [
      { key: 'banner_actif',   label: 'Activer la banniere', type: 'toggle',   placeholder: '' },
      { key: 'banner_message', label: 'Message a afficher',                 type: 'textarea', placeholder: 'Ex : Fermeture du 20 au 27 juillet...' },
      { key: 'banner_type',    label: 'Type de banniere',                   type: 'select',   placeholder: 'info', options: ['info', 'urgent', 'success'] },
    ],
  },
  {
    title: "Page Cours d'essai gratuit",
    fields: [
      { key: 'essai_label',      label: 'Label (ex: SANS ENGAGEMENT)',    type: 'text',     placeholder: 'SANS ENGAGEMENT' },
      { key: 'essai_titre',      label: 'Titre principal',                type: 'text',     placeholder: "Cours d'essai gratuit" },
      { key: 'essai_sous_titre', label: 'Sous-titre',                     type: 'textarea', placeholder: '30 minutes offertes...' },
      { key: 'essai_duree',      label: 'Carte 1 — Titre (ex: 1h offerte)', type: 'text',   placeholder: '1h offerte' },
      { key: 'essai_duree_desc', label: 'Carte 1 — Description',          type: 'text',     placeholder: 'Cours individuel' },
      { key: 'essai_format',     label: 'Carte 2 — Titre (ex: En ligne)', type: 'text',     placeholder: 'En ligne' },
      { key: 'essai_format_desc',label: 'Carte 2 — Description',          type: 'text',     placeholder: 'Via Zoom' },
      { key: 'essai_form_titre', label: 'Titre du formulaire',            type: 'text',     placeholder: "Réservez votre cours d'essai" },
      { key: 'essai_btn_label',  label: 'Texte du bouton',                type: 'text',     placeholder: "Demander mon cours d'essai gratuit" },
    ],
  },
  {
    title: 'Page Acheter un Pack',
    fields: [
      { key: 'packs_label',      label: 'Label (ex: Packs de cours)',    type: 'text',     placeholder: 'Packs de cours' },
      { key: 'packs_titre',      label: 'Titre principal',               type: 'text',     placeholder: 'Acheter un pack de cours' },
      { key: 'packs_sous_titre', label: 'Sous-titre',                    type: 'textarea', placeholder: "Achetez un pack d'heures..." },
    ],
  },
  {
    title: 'Tarifs cours individuels',
    fields: [
      { key: 'tarif_cours_1h',    label: 'Tarif 1h de cours (EUR)',  type: 'text', placeholder: '22' },
      { key: 'tarif_pack_label1', label: 'Pack 1 - Nom',             type: 'text', placeholder: 'Pack 5h' },
      { key: 'tarif_pack_prix1',  label: 'Pack 1 - Prix (EUR)',      type: 'text', placeholder: '100' },
      { key: 'tarif_pack_desc1',  label: 'Pack 1 - Description',     type: 'text', placeholder: '5 heures de cours' },
      { key: 'tarif_pack_label2', label: 'Pack 2 - Nom (optionnel)', type: 'text', placeholder: '' },
      { key: 'tarif_pack_prix2',  label: 'Pack 2 - Prix (EUR)',      type: 'text', placeholder: '' },
      { key: 'tarif_pack_desc2',  label: 'Pack 2 - Description',     type: 'text', placeholder: '' },
      { key: 'tarif_pack_label3', label: 'Pack 3 - Nom (optionnel)', type: 'text', placeholder: '' },
      { key: 'tarif_pack_prix3',  label: 'Pack 3 - Prix (EUR)',      type: 'text', placeholder: '' },
      { key: 'tarif_pack_desc3',  label: 'Pack 3 - Description',     type: 'text', placeholder: '' },
    ],
  },
  {
    title: 'Reseaux sociaux',
    fields: [
      { key: 'instagram', label: 'Instagram (URL)', type: 'url', placeholder: 'https://instagram.com/lieusecret' },
      { key: 'facebook',  label: 'Facebook (URL)',  type: 'url', placeholder: 'https://facebook.com/lieusecret' },
      { key: 'youtube',   label: 'YouTube (URL)',   type: 'url', placeholder: 'https://youtube.com/@lieusecret' },
      { key: 'tiktok',    label: 'TikTok (URL)',    type: 'url', placeholder: 'https://tiktok.com/@lieusecret' },
    ],
  },
  {
    title: 'Virement bancaire',
    fields: [
      { key: 'virement_nom',  label: 'Nom du bénéficiaire', type: 'text',     placeholder: 'Lieu Secret' },
      { key: 'virement_iban', label: 'IBAN',                type: 'text',     placeholder: 'FR76 ...' },
      { key: 'virement_info', label: 'Instructions',        type: 'textarea', placeholder: 'Précisez votre nom...' },
    ],
  },
]

export default function AdminParametres() {
  const [settings, setSettings]   = useState<Settings>(EMPTY)
  const [loading, setSaving]      = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [fetching, setFetching]   = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testMsg, setTestMsg]     = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { setSettings(s => ({ ...s, ...data })); setFetching(false) })
      .catch(() => setFetching(false))
  }, [])

  function handleChange(key: string, value: string) {
    setSettings(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  async function handleTestEmail() {
    if (!testEmail) return
    setTestMsg('Envoi en cours...')
    try {
      const res  = await fetch('/api/test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail }) })
      const data = await res.json()
      setTestMsg(res.ok ? 'Email envoyé avec succès !' : 'Erreur : ' + data.error)
    } catch { setTestMsg('Erreur réseau') }
  }

  if (fetching) {
    return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Paramètres</h1>
        <p className="text-noir-400 text-sm mt-1">Personnalisez tous les textes et paramètres de votre site</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Toutes les sections de textes */}
        {SECTIONS.map(section => (
          <div key={section.title} className="card">
            <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="label mb-1 block">{field.label}</label>
                  {field.type === 'toggle' ? (
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => handleChange(field.key, settings[field.key] === 'true' ? 'false' : 'true')}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings[field.key] === 'true' ? 'bg-gold-500' : 'bg-noir-700'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[field.key] === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-sm font-medium ${settings[field.key] === 'true' ? 'text-gold-400' : 'text-noir-500'}`}>
                        {settings[field.key] === 'true' ? 'Activée' : 'Désactivée'}
                      </span>
                    </div>
                  ) : field.type === 'select' ? (
                    <select value={settings[field.key] || field.placeholder} onChange={e => handleChange(field.key, e.target.value)} className="input w-full">
                      {(field.options || []).map(opt => <option key={opt} value={opt}>{opt === 'info' ? 'Info (doré)' : opt === 'urgent' ? 'Urgent (rouge)' : opt === 'success' ? 'Succès (vert)' : opt}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={settings[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)} placeholder={field.placeholder} rows={3} className="input w-full resize-none" />
                  ) : (
                    <input type={field.type} value={settings[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)} placeholder={field.placeholder} className="input w-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Liens Zoom */}
        <div className="card border-gold-500/30">
          <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-2">Liens Zoom</h2>
          <p className="text-noir-500 text-xs mb-4">Un lien par type de cours. Inclus automatiquement dans les emails de confirmation.</p>
          <div className="space-y-4">
            {[
              { key: 'zoom_cours',       label: 'Cours individuel' },
              { key: 'zoom_atelier',     label: 'Atelier de groupe' },
              { key: 'zoom_masterclass', label: 'Masterclass' },
              { key: 'zoom_evenement',   label: 'Événement / Autre' },
            ].map(item => (
              <div key={item.key}>
                <label className="label mb-1 block">{item.label}</label>
                <input type="url" value={settings[item.key] || ''} onChange={e => handleChange(item.key, e.target.value)} placeholder="https://zoom.us/j/..." className="input w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Stripe + Code accès */}
        <div className="card border-gold-500/20">
          <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-2">Paiement Stripe + Accès élèves</h2>
          <div className="space-y-4">
            <div>
              <label className="label mb-1 block">Clé publique Stripe (pk_live_...)</label>
              <input type="text" value={settings.stripe_public_key || ''} onChange={e => handleChange('stripe_public_key', e.target.value)} placeholder="pk_live_..." className="input w-full font-mono text-xs" />
              <p className="text-xs text-noir-600 mt-1">La clé secrète doit être dans les variables Vercel : STRIPE_SECRET_KEY</p>
            </div>
            <div>
              <label className="label mb-1 block">Code d&apos;accès cours individuels</label>
              <input type="text" value={settings.cours_access_code || ''} onChange={e => handleChange('cours_access_code', e.target.value)} placeholder="ex: piano2025" className="input w-full" />
              <p className="text-xs text-noir-500 mt-1">Lien à envoyer aux élèves : lieusecret-courspiano.fr/reservation?code=VOTRE-CODE</p>
            </div>
          </div>
        </div>

        {/* Test email */}
        <div className="card border-noir-700">
          <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-3">Tester les emails</h2>
          <p className="text-noir-500 text-xs mb-3">Vérifiez que Resend est bien configuré.</p>
          <div className="flex gap-2">
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="votre@email.fr" className="input flex-1" />
            <button type="button" onClick={handleTestEmail} className="btn-gold px-4 text-sm">Tester</button>
          </div>
          {testMsg && <p className={`text-xs mt-2 ${testMsg.includes('succès') ? 'text-green-400' : 'text-red-400'}`}>{testMsg}</p>}
        </div>

        {/* Accès admin */}
        <div className="card border-noir-700">
          <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-3">Accès administrateur</h2>
          <p className="text-noir-400 text-sm leading-relaxed">
            Les identifiants admin sont définis via les variables Vercel :<br />
            <code className="text-gold-300 text-xs bg-noir-800 px-1.5 py-0.5 rounded mt-1 inline-block">ADMIN_EMAIL</code>{' '}
            <code className="text-gold-300 text-xs bg-noir-800 px-1.5 py-0.5 rounded">ADMIN_PASSWORD</code>
          </p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

        <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2" disabled={loading}>
          {saved ? (
            <><CheckCircle size={16} /> Enregistré !</>
          ) : loading ? (
            <><span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
          ) : (
            <><Save size={16} /> Enregistrer les modifications</>
          )}
        </button>
      </form>
    </div>
  )
}
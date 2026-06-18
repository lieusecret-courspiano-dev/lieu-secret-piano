'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, Globe, User, Layout, ShoppingBag, Settings, Mail, CreditCard } from 'lucide-react'

interface Settings { [key: string]: string
  site_title: string; site_description: string; contact_email: string; phone: string
  instagram: string; facebook: string; youtube: string; tiktok: string
  virement_iban: string; virement_nom: string; virement_info: string
  hero_title: string; hero_title2: string; hero_subtitle: string; hero_btn1: string; hero_btn2: string
  apropos_titre: string; apropos_texte1: string; apropos_texte2: string
  apropos_point1: string; apropos_point2: string; apropos_point3: string; apropos_point4: string
  offres_titre: string; offres_sous_titre: string
  offre1_titre: string; offre1_sous: string; offre1_desc: string; offre1_btn: string
  offre1_f1: string; offre1_f2: string; offre1_f3: string; offre1_f4: string
  offre2_titre: string; offre2_sous: string; offre2_desc: string; offre2_btn: string
  offre2_f1: string; offre2_f2: string; offre2_f3: string; offre2_f4: string
  offre3_titre: string; offre3_sous: string; offre3_desc: string; offre3_btn: string
  offre3_f1: string; offre3_f2: string; offre3_f3: string; offre3_f4: string
  steps_label: string; steps_titre: string; cta_titre: string; cta_sous_titre: string
  stats_label1: string; stats_label2: string; stats_label3: string; stats_label4: string
  zoom_cours: string; zoom_atelier: string; zoom_masterclass: string; zoom_evenement: string
  stripe_public_key: string; cours_access_code: string
  prof_nom: string; prof_titre: string; prof_photo: string; prof_bio: string; prof_vision: string; prof_pedagogie: string
  tab_cours_label: string; tab_events_label: string
  espace_eleves_title: string; espace_eleves_desc: string
  reservation_titre: string; reservation_no_slot: string
  reservation_select_date: string; reservation_code_placeholder: string; reservation_code_btn: string; reservation_contact_link: string
  banner_actif: string; banner_message: string; banner_type: string
  tarif_cours_1h: string
  tarif_pack_label1: string; tarif_pack_prix1: string; tarif_pack_desc1: string
  tarif_pack_label2: string; tarif_pack_prix2: string; tarif_pack_desc2: string
  tarif_pack_label3: string; tarif_pack_prix3: string; tarif_pack_desc3: string
  tarif_pack_label4: string; tarif_pack_prix4: string; tarif_pack_desc4: string
  cadeau_formule1_label: string; cadeau_formule1_prix: string; cadeau_formule1_desc: string
  cadeau_formule2_label: string; cadeau_formule2_prix: string; cadeau_formule2_desc: string
  cadeau_formule3_label: string; cadeau_formule3_prix: string; cadeau_formule3_desc: string
  essai_titre: string; essai_sous_titre: string; essai_btn_label: string
  packs_titre: string; packs_sous_titre: string; packs_label: string
}

const EMPTY: Settings = {
  site_title: '', site_description: '', contact_email: '', phone: '',
  instagram: '', facebook: '', youtube: '', tiktok: '',
  virement_iban: '', virement_nom: 'Lieu Secret', virement_info: '',
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
  steps_label: '', steps_titre: '', cta_titre: '', cta_sous_titre: '',
  stats_label1: '', stats_label2: '', stats_label3: '', stats_label4: '',
  zoom_cours: '', zoom_atelier: '', zoom_masterclass: '', zoom_evenement: '',
  stripe_public_key: '', cours_access_code: '',
  prof_nom: '', prof_titre: '', prof_photo: '', prof_bio: '', prof_vision: '', prof_pedagogie: '',
  tab_cours_label: '', tab_events_label: '',
  espace_eleves_title: '', espace_eleves_desc: '',
  reservation_titre: '', reservation_no_slot: '',
  reservation_select_date: '', reservation_code_placeholder: '', reservation_code_btn: '', reservation_contact_link: '',
  banner_actif: 'false', banner_message: '', banner_type: 'info',
  tarif_cours_1h: '22',
  tarif_pack_label1: 'Pack 5h', tarif_pack_prix1: '100', tarif_pack_desc1: '5 heures de cours',
  tarif_pack_label2: '', tarif_pack_prix2: '', tarif_pack_desc2: '',
  tarif_pack_label3: '', tarif_pack_prix3: '', tarif_pack_desc3: '',
  tarif_pack_label4: '', tarif_pack_prix4: '', tarif_pack_desc4: '',
  cadeau_formule1_label: 'Bon Découverte', cadeau_formule1_prix: '22', cadeau_formule1_desc: '1 cours de piano',
  cadeau_formule2_label: 'Bon Progression', cadeau_formule2_prix: '60', cadeau_formule2_desc: '3 cours de piano',
  cadeau_formule3_label: 'Bon Immersion', cadeau_formule3_prix: '90', cadeau_formule3_desc: '5 cours de piano',
  essai_titre: '', essai_sous_titre: '', essai_btn_label: '',
  packs_titre: '', packs_sous_titre: '', packs_label: '',
}

// ── Onglets principaux ────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',    label: 'Général',       icon: Globe },
  { id: 'site',       label: 'Site web',       icon: Layout },
  { id: 'prof',       label: 'Professeur',     icon: User },
  { id: 'tarifs',     label: 'Tarifs',         icon: ShoppingBag },
  { id: 'reservation',label: 'Réservation',    icon: Settings },
  { id: 'technique',  label: 'Technique',      icon: CreditCard },
  { id: 'emails',     label: 'Emails',         icon: Mail },
]

type Field = { key: string; label: string; type: string; placeholder: string; options?: string[]; hint?: string }
type SubSection = { title: string; fields: Field[] }

const TAB_CONTENT: Record<string, SubSection[]> = {
  general: [
    {
      title: 'Informations du site',
      fields: [
        { key: 'site_title',       label: 'Nom du site',          type: 'text',  placeholder: 'Lieu Secret' },
        { key: 'site_description', label: 'Description',          type: 'textarea', placeholder: 'École de piano en ligne...' },
        { key: 'contact_email',    label: 'Email de contact',     type: 'email', placeholder: 'contact@lieusecret-courspiano.fr', hint: 'Utilisé pour recevoir les notifications admin' },
        { key: 'phone',            label: 'Téléphone (optionnel)',type: 'text',  placeholder: '+33 6 00 00 00 00' },
      ],
    },
    {
      title: 'Réseaux sociaux',
      fields: [
        { key: 'instagram', label: 'Instagram (URL)', type: 'url', placeholder: 'https://instagram.com/lieusecret' },
        { key: 'facebook',  label: 'Facebook (URL)',  type: 'url', placeholder: 'https://facebook.com/lieusecret' },
        { key: 'youtube',   label: 'YouTube (URL)',   type: 'url', placeholder: 'https://youtube.com/@lieusecret' },
        { key: 'tiktok',    label: 'TikTok (URL)',    type: 'url', placeholder: 'https://tiktok.com/@lieusecret' },
      ],
    },
    {
      title: 'Message en vedette (bannière)',
      fields: [
        { key: 'banner_actif',   label: 'Activer la bannière', type: 'toggle', placeholder: '' },
        { key: 'banner_message', label: 'Message',             type: 'text',   placeholder: 'Inscris-toi à l\'atelier gratuit du 15 juin !' },
        { key: 'banner_type',    label: 'Style',               type: 'select', placeholder: 'info', options: ['info', 'urgent', 'success'] },
      ],
    },
  ],

  site: [
    {
      title: 'Hero — Titre principal',
      fields: [
        { key: 'hero_title',    label: 'Titre ligne 1',    type: 'text',     placeholder: 'Apprenez le piano' },
        { key: 'hero_title2',   label: 'Titre ligne 2 (doré)', type: 'text', placeholder: 'en ligne' },
        { key: 'hero_subtitle', label: 'Sous-titre',       type: 'textarea', placeholder: 'Cours individuels, ateliers...' },
        { key: 'hero_btn1',     label: 'Bouton 1 (principal)', type: 'text', placeholder: 'Cours d\'essai gratuit' },
        { key: 'hero_btn2',     label: 'Bouton 2 (secondaire)', type: 'text', placeholder: 'Découvrir les offres' },
      ],
    },
    {
      title: 'Hero — Statistiques',
      fields: [
        { key: 'stats_label1', label: 'Stat 1', type: 'text', placeholder: '100% En ligne' },
        { key: 'stats_label2', label: 'Stat 2', type: 'text', placeholder: '1h Cours individuel' },
        { key: 'stats_label3', label: 'Stat 3', type: 'text', placeholder: 'Monde entier' },
        { key: 'stats_label4', label: 'Stat 4', type: 'text', placeholder: 'Tous niveaux' },
      ],
    },
    {
      title: 'Section À propos',
      fields: [
        { key: 'apropos_titre',  label: 'Titre',       type: 'text',     placeholder: 'Un espace musical unique' },
        { key: 'apropos_texte1', label: 'Paragraphe 1',type: 'textarea', placeholder: '' },
        { key: 'apropos_texte2', label: 'Paragraphe 2',type: 'textarea', placeholder: '' },
        { key: 'apropos_point1', label: 'Point 1',     type: 'text',     placeholder: 'Cours 100% en ligne via Zoom' },
        { key: 'apropos_point2', label: 'Point 2',     type: 'text',     placeholder: 'Créneaux flexibles' },
        { key: 'apropos_point3', label: 'Point 3',     type: 'text',     placeholder: 'Gestion automatique des fuseaux' },
        { key: 'apropos_point4', label: 'Point 4',     type: 'text',     placeholder: 'Confirmation instantanée' },
      ],
    },
    {
      title: 'Section Nos offres',
      fields: [
        { key: 'offres_titre',      label: 'Titre section',    type: 'text',     placeholder: 'Choisissez votre formule' },
        { key: 'offres_sous_titre', label: 'Sous-titre',       type: 'textarea', placeholder: '' },
        { key: 'offre1_titre', label: 'Offre 1 — Titre',  type: 'text', placeholder: 'Cours individuel' },
        { key: 'offre1_sous',  label: 'Offre 1 — Badge',  type: 'text', placeholder: 'Sur mesure' },
        { key: 'offre1_desc',  label: 'Offre 1 — Desc.',  type: 'textarea', placeholder: '' },
        { key: 'offre1_btn',   label: 'Offre 1 — Bouton', type: 'text', placeholder: 'Réserver un créneau' },
        { key: 'offre1_f1',    label: 'Offre 1 — Point 1',type: 'text', placeholder: '1h de cours en tête-à-tête' },
        { key: 'offre1_f2',    label: 'Offre 1 — Point 2',type: 'text', placeholder: 'Créneau flexible' },
        { key: 'offre1_f3',    label: 'Offre 1 — Point 3',type: 'text', placeholder: 'Suivi personnalisé' },
        { key: 'offre1_f4',    label: 'Offre 1 — Point 4',type: 'text', placeholder: 'Lien Zoom envoyé par email' },
        { key: 'offre2_titre', label: 'Offre 2 — Titre',  type: 'text', placeholder: 'Atelier de groupe' },
        { key: 'offre2_sous',  label: 'Offre 2 — Badge',  type: 'text', placeholder: 'Collectif' },
        { key: 'offre2_desc',  label: 'Offre 2 — Desc.',  type: 'textarea', placeholder: '' },
        { key: 'offre2_btn',   label: 'Offre 2 — Bouton', type: 'text', placeholder: 'Voir les ateliers' },
        { key: 'offre2_f1',    label: 'Offre 2 — Point 1',type: 'text', placeholder: "Jusqu'à 8 participants" },
        { key: 'offre2_f2',    label: 'Offre 2 — Point 2',type: 'text', placeholder: 'Thème défini à l\'avance' },
        { key: 'offre2_f3',    label: 'Offre 2 — Point 3',type: 'text', placeholder: 'Échanges et partage' },
        { key: 'offre2_f4',    label: 'Offre 2 — Point 4',type: 'text', placeholder: 'Gratuit ou payant' },
        { key: 'offre3_titre', label: 'Offre 3 — Titre',  type: 'text', placeholder: 'Masterclass' },
        { key: 'offre3_sous',  label: 'Offre 3 — Badge',  type: 'text', placeholder: 'Perfectionnement' },
        { key: 'offre3_desc',  label: 'Offre 3 — Desc.',  type: 'textarea', placeholder: '' },
        { key: 'offre3_btn',   label: 'Offre 3 — Bouton', type: 'text', placeholder: 'Voir les masterclass' },
        { key: 'offre3_f1',    label: 'Offre 3 — Point 1',type: 'text', placeholder: 'Niveau intermédiaire/avancé' },
        { key: 'offre3_f2',    label: 'Offre 3 — Point 2',type: 'text', placeholder: 'Technique approfondie' },
        { key: 'offre3_f3',    label: 'Offre 3 — Point 3',type: 'text', placeholder: 'Petits groupes (6 max)' },
        { key: 'offre3_f4',    label: 'Offre 3 — Point 4',type: 'text', placeholder: 'Enregistrement disponible' },
      ],
    },
    {
      title: 'Section Comment ça marche',
      fields: [
        { key: 'steps_label', label: 'Badge',  type: 'text', placeholder: 'Simple et rapide' },
        { key: 'steps_titre', label: 'Titre',  type: 'text', placeholder: 'Comment ça marche ?' },
      ],
    },
    {
      title: 'Bandeau Prêt à commencer',
      fields: [
        { key: 'cta_titre',      label: 'Titre',      type: 'text',     placeholder: 'Prêt(e) à commencer ?' },
        { key: 'cta_sous_titre', label: 'Sous-titre', type: 'textarea', placeholder: 'Réservez votre premier cours dès maintenant.' },
      ],
    },
  ],

  prof: [
    {
      title: 'Votre professeur',
      fields: [
        { key: 'prof_nom',       label: 'Nom complet',    type: 'text',     placeholder: 'Claudine Yombo' },
        { key: 'prof_titre',     label: 'Titre / Rôle',   type: 'text',     placeholder: 'Professeure de piano' },
        { key: 'prof_photo',     label: 'URL de la photo',type: 'url',      placeholder: 'https://...', hint: 'Lien direct vers une image (Supabase Storage, Cloudinary, etc.)' },
        { key: 'prof_bio',       label: 'Biographie',     type: 'textarea', placeholder: 'Votre parcours musical...' },
        { key: 'prof_vision',    label: 'Vision',         type: 'textarea', placeholder: 'Votre vision de l\'enseignement...' },
        { key: 'prof_pedagogie', label: 'Pédagogie',      type: 'textarea', placeholder: 'Votre approche pédagogique...' },
      ],
    },
  ],

  tarifs: [
    {
      title: 'Cours à l\'unité',
      fields: [
        { key: 'tarif_cours_1h', label: 'Prix 1 heure (€)', type: 'text', placeholder: '22', hint: 'Affiché sur la page Tarifs et dans la réservation' },
      ],
    },
    {
      title: 'Packs de cours',
      fields: [
        { key: 'tarif_pack_label1', label: 'Pack 1 — Nom',         type: 'text', placeholder: 'Pack 5h' },
        { key: 'tarif_pack_prix1',  label: 'Pack 1 — Prix (€)',    type: 'text', placeholder: '100' },
        { key: 'tarif_pack_desc1',  label: 'Pack 1 — Description', type: 'text', placeholder: '5 heures de cours' },
        { key: 'tarif_pack_label2', label: 'Pack 2 — Nom',         type: 'text', placeholder: '' },
        { key: 'tarif_pack_prix2',  label: 'Pack 2 — Prix (€)',    type: 'text', placeholder: '' },
        { key: 'tarif_pack_desc2',  label: 'Pack 2 — Description', type: 'text', placeholder: '' },
        { key: 'tarif_pack_label3', label: 'Pack 3 — Nom',         type: 'text', placeholder: '' },
        { key: 'tarif_pack_prix3',  label: 'Pack 3 — Prix (€)',    type: 'text', placeholder: '' },
        { key: 'tarif_pack_desc3',  label: 'Pack 3 — Description', type: 'text', placeholder: '' },
        { key: 'tarif_pack_label4', label: 'Pack 4 — Nom',         type: 'text', placeholder: '' },
        { key: 'tarif_pack_prix4',  label: 'Pack 4 — Prix (€)',    type: 'text', placeholder: '' },
        { key: 'tarif_pack_desc4',  label: 'Pack 4 — Description', type: 'text', placeholder: '' },
      ],
    },
    {
      title: 'Page Acheter un pack',
      fields: [
        { key: 'packs_titre',      label: 'Titre de la page',  type: 'text',     placeholder: 'Acheter un pack de cours' },
        { key: 'packs_sous_titre', label: 'Sous-titre',        type: 'textarea', placeholder: 'Achetez un pack d\'heures...' },
        { key: 'packs_label',      label: 'Badge / Label',     type: 'text',     placeholder: 'Packs de cours' },
      ],
    },
    {
      title: 'Bons cadeaux — Formules',
      fields: [
        { key: 'cadeau_formule1_label', label: 'Formule 1 — Nom',         type: 'text', placeholder: 'Bon Découverte' },
        { key: 'cadeau_formule1_prix',  label: 'Formule 1 — Prix (€)',    type: 'text', placeholder: '22' },
        { key: 'cadeau_formule1_desc',  label: 'Formule 1 — Description', type: 'text', placeholder: '1 cours de piano' },
        { key: 'cadeau_formule2_label', label: 'Formule 2 — Nom',         type: 'text', placeholder: 'Bon Progression' },
        { key: 'cadeau_formule2_prix',  label: 'Formule 2 — Prix (€)',    type: 'text', placeholder: '60' },
        { key: 'cadeau_formule2_desc',  label: 'Formule 2 — Description', type: 'text', placeholder: '3 cours de piano' },
        { key: 'cadeau_formule3_label', label: 'Formule 3 — Nom',         type: 'text', placeholder: 'Bon Immersion' },
        { key: 'cadeau_formule3_prix',  label: 'Formule 3 — Prix (€)',    type: 'text', placeholder: '90' },
        { key: 'cadeau_formule3_desc',  label: 'Formule 3 — Description', type: 'text', placeholder: '5 cours de piano' },
      ],
    },
    {
      title: 'Page Cours d\'essai gratuit',
      fields: [
        { key: 'essai_titre',      label: 'Titre',       type: 'text',     placeholder: 'Cours d\'essai gratuit' },
        { key: 'essai_sous_titre', label: 'Sous-titre',  type: 'textarea', placeholder: '1 heure offerte, sans engagement...' },
        { key: 'essai_btn_label',  label: 'Bouton',      type: 'text',     placeholder: 'Demander mon cours d\'essai' },
      ],
    },
  ],

  reservation: [
    {
      title: 'Page de réservation — Textes',
      fields: [
        { key: 'reservation_titre',            label: 'Titre de la page',          type: 'text',     placeholder: 'Réservez votre cours de piano' },
        { key: 'tab_cours_label',              label: 'Onglet Cours individuels',  type: 'text',     placeholder: 'Cours individuels' },
        { key: 'tab_events_label',             label: 'Onglet Ateliers',           type: 'text',     placeholder: 'Ateliers & Événements' },
        { key: 'reservation_select_date',      label: 'Message sélection date',    type: 'text',     placeholder: 'Sélectionnez une date pour voir les créneaux' },
        { key: 'reservation_no_slot',          label: 'Message aucun créneau',     type: 'text',     placeholder: 'Aucun créneau disponible ce jour.' },
        { key: 'reservation_code_placeholder', label: 'Placeholder code accès',    type: 'text',     placeholder: 'Votre code d\'accès' },
        { key: 'reservation_code_btn',         label: 'Bouton code accès',         type: 'text',     placeholder: 'Accéder aux créneaux' },
        { key: 'reservation_contact_link',     label: 'Texte lien contact',        type: 'text',     placeholder: 'Pas encore élève ?' },
      ],
    },
    {
      title: 'Espace élèves — Textes',
      fields: [
        { key: 'espace_eleves_title', label: 'Titre espace élèves', type: 'text',     placeholder: 'Espace élèves' },
        { key: 'espace_eleves_desc',  label: 'Description',         type: 'textarea', placeholder: 'Les cours individuels sont réservés aux élèves inscrits.' },
        { key: 'cours_access_code',   label: 'Code d\'accès cours', type: 'text',     placeholder: 'ex: piano2025', hint: 'Lien : lieusecret-courspiano.fr/reservation?code=VOTRE-CODE' },
      ],
    },
  ],

  technique: [
    {
      title: 'Liens Zoom',
      fields: [
        { key: 'zoom_cours',       label: 'Cours individuel',    type: 'url', placeholder: 'https://zoom.us/j/...' },
        { key: 'zoom_atelier',     label: 'Atelier de groupe',   type: 'url', placeholder: 'https://zoom.us/j/...' },
        { key: 'zoom_masterclass', label: 'Masterclass',         type: 'url', placeholder: 'https://zoom.us/j/...' },
        { key: 'zoom_evenement',   label: 'Événement / Autre',   type: 'url', placeholder: 'https://zoom.us/j/...' },
      ],
    },
    {
      title: 'Virement bancaire',
      fields: [
        { key: 'virement_nom',  label: 'Nom du bénéficiaire', type: 'text',     placeholder: 'Lieu Secret' },
        { key: 'virement_iban', label: 'IBAN',                type: 'text',     placeholder: 'FR76 ...' },
        { key: 'virement_info', label: 'Instructions',        type: 'textarea', placeholder: 'Précisez votre nom en référence...' },
      ],
    },
    {
      title: 'Paiement Stripe',
      fields: [
        { key: 'stripe_public_key', label: 'Clé publique Stripe (pk_live_...)', type: 'text', placeholder: 'pk_live_...', hint: 'La clé secrète doit être dans les variables Vercel : STRIPE_SECRET_KEY' },
      ],
    },
    {
      title: 'Accès administrateur',
      fields: [],
    },
  ],

  emails: [
    {
      title: 'Configuration email',
      fields: [],
    },
  ],
}

function FieldInput({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  if (field.type === 'toggle') {
    return (
      <div className="flex items-center gap-3 mt-1">
        <button type="button" onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          className={`relative w-12 h-6 rounded-full transition-colors ${value === 'true' ? 'bg-gold-500' : 'bg-noir-700'}`}>
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${value === 'true' ? 'text-gold-400' : 'text-noir-500'}`}>
          {value === 'true' ? 'Activée' : 'Désactivée'}
        </span>
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <select value={value || field.placeholder} onChange={e => onChange(e.target.value)} className="input w-full">
        {(field.options || []).map(opt => (
          <option key={opt} value={opt}>
            {opt === 'info' ? 'Info (doré)' : opt === 'urgent' ? 'Urgent (rouge)' : opt === 'success' ? 'Succès (vert)' : opt}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'textarea') {
    return <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className="input w-full resize-none" />
  }
  return <input type={field.type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} className="input w-full" />
}

export default function AdminParametres() {
  const [settings, setSettings] = useState<Settings>(EMPTY)
  const [loading, setSaving]    = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [testEmail, setTestEmail] = useState('')
  const [testMsg, setTestMsg]   = useState('')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings(s => ({ ...s, ...data }))
      setFetching(false)
    }).catch(() => setFetching(false))
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

  if (fetching) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const currentSections = TAB_CONTENT[activeTab] || []

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Paramètres</h1>
        <p className="text-noir-400 text-sm mt-1">Personnalisez tous les textes et paramètres de votre site</p>
      </div>

      {/* Onglets de navigation */}
      <div className="flex gap-1 flex-wrap bg-noir-900 border border-noir-800 rounded-xl p-1 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-gold-500 text-noir-950' : 'text-noir-400 hover:text-white hover:bg-noir-800/60'
              }`}>
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Sections de l'onglet actif */}
        {currentSections.map(section => {
          if (section.fields.length === 0) {
            // Sections spéciales sans champs
            if (activeTab === 'technique' && section.title === 'Accès administrateur') {
              return (
                <div key={section.title} className="card border-noir-700">
                  <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-3">{section.title}</h2>
                  <p className="text-noir-400 text-sm leading-relaxed">
                    Les identifiants admin sont définis via les variables Vercel :<br />
                    <code className="text-gold-300 text-xs bg-noir-800 px-1.5 py-0.5 rounded mt-1 inline-block">ADMIN_EMAIL</code>{' '}
                    <code className="text-gold-300 text-xs bg-noir-800 px-1.5 py-0.5 rounded">ADMIN_PASSWORD</code>
                  </p>
                </div>
              )
            }
            if (activeTab === 'emails' && section.title === 'Configuration email') {
              return (
                <div key={section.title} className="space-y-4">
                  <div className="card border-gold-500/20">
                    <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-3">Tester les emails</h2>
                    <p className="text-noir-500 text-xs mb-3">Vérifiez que Resend est bien configuré.</p>
                    <div className="flex gap-2">
                      <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="votre@email.fr" className="input flex-1" />
                      <button type="button" onClick={handleTestEmail} className="btn-gold px-4 text-sm">Tester</button>
                    </div>
                    {testMsg && <p className={`text-xs mt-2 ${testMsg.includes('succès') ? 'text-green-400' : 'text-red-400'}`}>{testMsg}</p>}
                  </div>
                  <div className="card border-noir-700">
                    <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-3">Variables Vercel requises</h2>
                    <div className="space-y-2">
                      {[
                        { key: 'RESEND_API_KEY', desc: 'Clé API Resend pour l\'envoi d\'emails' },
                        { key: 'STRIPE_SECRET_KEY', desc: 'Clé secrète Stripe' },
                        { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'URL de votre projet Supabase' },
                        { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clé service Supabase' },
                        { key: 'PAYPAL_CLIENT_ID', desc: 'Client ID PayPal' },
                        { key: 'PAYPAL_CLIENT_SECRET', desc: 'Secret PayPal' },
                        { key: 'ADMIN_EMAIL', desc: 'Email administrateur' },
                        { key: 'ADMIN_PASSWORD', desc: 'Mot de passe administrateur' },
                        { key: 'NEXT_PUBLIC_APP_URL', desc: 'URL de votre site (ex: https://lieusecret-courspiano.fr)' },
                      ].map(v => (
                        <div key={v.key} className="flex items-start gap-3 py-1.5 border-b border-noir-800 last:border-0">
                          <code className="text-gold-300 text-xs bg-noir-800 px-1.5 py-0.5 rounded shrink-0">{v.key}</code>
                          <span className="text-noir-400 text-xs">{v.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }

          return (
            <div key={section.title} className="card">
              <h2 className="text-gold-400 font-medium text-sm uppercase tracking-wider mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="label mb-1 block">{field.label}</label>
                    <FieldInput field={field} value={settings[field.key] || ''} onChange={v => handleChange(field.key, v)} />
                    {field.hint && <p className="text-xs text-noir-600 mt-1">{field.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* Bouton sauvegarder — sticky en bas */}
        {activeTab !== 'emails' && (
          <div className="sticky bottom-4 md:bottom-6">
            <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2 shadow-2xl" disabled={loading}>
              {saved ? (
                <><CheckCircle size={16} /> Enregistré !</>
              ) : loading ? (
                <><span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
              ) : (
                <><Save size={16} /> Enregistrer les modifications</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
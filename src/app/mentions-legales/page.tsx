import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Lieu Secret',
  description: 'Mentions légales de Lieu Secret, école de piano en ligne via Zoom. Éditeur, hébergement, propriété intellectuelle et droit applicable.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/mentions-legales' },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Légal</span>
            <h1 className="font-serif text-4xl md:text-5xl text-white mt-3">Mentions légales</h1>
            <p className="text-noir-500 text-sm mt-3">Dernière mise à jour : juin 2026</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-10">
            {[
              {
                titre: '1. Éditeur du site',
                contenu: `Le site www.lieusecret-courspiano.fr est édité par :\n\nLieu Secret — École de Piano en Ligne\nActivité d'enseignement musical en ligne\nContact : contact@lieusecret-courspiano.fr`,
              },
              {
                titre: '2. Hébergement',
                contenu: `Le site est hébergé par :\n\nVercel Inc.\n340 Pine Street, Suite 900\nSan Francisco, CA 94104, États-Unis\nSite : https://vercel.com`,
              },
              {
                titre: '3. Propriété intellectuelle',
                contenu: `L'ensemble du contenu de ce site (textes, images, vidéos, supports pédagogiques, logos, etc.) est protégé par le droit d'auteur et appartient à Lieu Secret ou à ses partenaires.\n\nToute reproduction, distribution, modification ou utilisation de ces contenus sans autorisation écrite préalable est strictement interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.\n\nLes supports pédagogiques mis à disposition des élèves sont réservés à un usage strictement personnel. Toute reproduction ou vente est formellement interdite.`,
              },
              {
                titre: '4. Responsabilité',
                contenu: `Lieu Secret s'efforce de maintenir les informations publiées sur ce site à jour et exactes. Cependant, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité des informations diffusées.\n\nLieu Secret ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation de ce site ou de l'impossibilité d'y accéder.`,
              },
              {
                titre: '5. Liens hypertextes',
                contenu: `Ce site peut contenir des liens vers des sites tiers. Lieu Secret n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.`,
              },
              {
                titre: '6. Droit applicable',
                contenu: `Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.`,
              },
              {
                titre: '7. Contact',
                contenu: `Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :\ncontact@lieusecret-courspiano.fr`,
              },
            ].map((section, i) => (
              <section key={i} className="bg-noir-900/50 border border-noir-800 rounded-2xl p-6">
                <h2 className="font-serif text-xl text-white mb-4">{section.titre}</h2>
                <div className="text-noir-300 text-sm leading-relaxed whitespace-pre-line">{section.contenu}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
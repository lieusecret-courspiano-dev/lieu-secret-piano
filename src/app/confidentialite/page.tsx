import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Lieu Secret',
  description: 'Politique de confidentialité et protection des données personnelles de Lieu Secret, école de piano en ligne. RGPD, cookies, droits des utilisateurs.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.lieusecret-courspiano.fr/confidentialite' },
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-noir-950 text-noir-100">
      <PublicNav />
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="text-gold-500 text-xs font-semibold uppercase tracking-widest">Légal</span>
            <h1 className="font-serif text-4xl md:text-5xl text-white mt-3">Politique de confidentialité</h1>
            <p className="text-noir-500 text-sm mt-3">Dernière mise à jour : juin 2026</p>
          </div>

          <div className="space-y-6">
            {[
              {
                titre: '1. Responsable du traitement',
                contenu: `Lieu Secret — École de Piano en Ligne est responsable du traitement de vos données personnelles.\nContact : contact@lieusecret-courspiano.fr`,
              },
              {
                titre: '2. Données collectées',
                contenu: `Nous collectons les données suivantes :\n\n• Données d'identification : nom, prénom, adresse email\n• Données de contact : numéro de téléphone (optionnel)\n• Données de paiement : traitées par Stripe ou PayPal (nous ne stockons pas vos coordonnées bancaires)\n• Données de navigation : cookies techniques et analytiques\n• Données pédagogiques : progression, notes de cours, certificats`,
              },
              {
                titre: '3. Finalités du traitement',
                contenu: `Vos données sont utilisées pour :\n\n• Gérer votre compte élève et vos réservations\n• Traiter vos paiements\n• Vous envoyer des confirmations et rappels de cours\n• Suivre votre progression pédagogique\n• Vous informer de nos actualités (avec votre consentement)\n• Améliorer nos services`,
              },
              {
                titre: '4. Base légale',
                contenu: `Le traitement de vos données repose sur :\n\n• L'exécution du contrat (réservations, paiements)\n• Votre consentement (newsletter, cookies non essentiels)\n• Notre intérêt légitime (amélioration des services, sécurité)`,
              },
              {
                titre: '5. Conservation des données',
                contenu: `Vos données sont conservées :\n\n• Données de compte : pendant la durée de votre inscription + 3 ans\n• Données de paiement : 5 ans (obligations légales)\n• Données de navigation : 13 mois maximum`,
              },
              {
                titre: '6. Partage des données',
                contenu: `Vos données peuvent être partagées avec :\n\n• Stripe / PayPal : pour le traitement des paiements\n• Vercel : hébergement du site\n• Supabase : base de données\n• Resend / services email : envoi des emails\n\nNous ne vendons jamais vos données à des tiers.`,
              },
              {
                titre: '7. Vos droits',
                contenu: `Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d'accès à vos données\n• Droit de rectification\n• Droit à l'effacement (droit à l'oubli)\n• Droit à la portabilité\n• Droit d'opposition\n• Droit à la limitation du traitement\n\nPour exercer ces droits, contactez-nous à : contact@lieusecret-courspiano.fr`,
              },
              {
                titre: '8. Cookies',
                contenu: `Nous utilisons des cookies techniques nécessaires au fonctionnement du site (session, authentification) et des cookies analytiques pour améliorer nos services.\n\nVous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités pourraient ne plus fonctionner correctement.`,
              },
              {
                titre: '9. Sécurité',
                contenu: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou destruction.`,
              },
              {
                titre: '10. Contact & réclamations',
                contenu: `Pour toute question relative à vos données personnelles :\ncontact@lieusecret-courspiano.fr\n\nVous avez également le droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
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
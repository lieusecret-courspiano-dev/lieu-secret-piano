import { MetadataRoute } from 'next'

const SITE_URL = 'https://www.lieusecret-courspiano.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Règle principale — tous les robots
        userAgent: '*',
        allow: [
          '/',
          '/cours',
          '/essai',
          '/tarifs',
          '/packs',
          '/cadeau',
          '/blog',
          '/blog/',
          '/contact',
          '/aide',
          '/inscription',
          '/mon-pack',
          '/mentions-legales',
          '/confidentialite',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/espace-eleve',
          '/espace-eleve/',
          '/api/',
          '/reservation',        // Page transactionnelle
          '/reservation/',
          '/pack/confirmation',
          '/cadeau/confirmation',
          '/reservation/confirmation',
          '/reservation/annuler',
          '/espace-eleve/login',
          '/espace-eleve/setup',
          '/espace-eleve/reset',
        ],
      },
      {
        // Bloquer les bots d'IA agressifs
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
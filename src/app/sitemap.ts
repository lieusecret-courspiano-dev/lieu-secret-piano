import { MetadataRoute } from 'next'

const SITE_URL = 'https://www.lieusecret-courspiano.fr'

// Récupère les articles de blog publiés pour les inclure dans le sitemap
async function getBlogArticles(): Promise<{ slug: string; updated_at?: string; created_at: string }[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/blog?limit=100`, {
      next: { revalidate: 3600 }, // Revalide toutes les heures
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  // ── Pages statiques principales ──────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/cours`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/essai`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tarifs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/packs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/cadeau`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/aide`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${SITE_URL}/inscription`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/mon-pack`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Pages légales — priorité basse
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // ── Articles de blog dynamiques ───────────────────────────────────────────
  const articles = await getBlogArticles()
  const blogPages: MetadataRoute.Sitemap = articles.map(article => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: article.updated_at || article.created_at || now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  return [...staticPages, ...blogPages]
}
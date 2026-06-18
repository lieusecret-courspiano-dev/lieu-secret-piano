/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts', expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'gstatic-fonts', expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
    {
      // Cache les pages statiques
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'next-static', expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
    {
      // Cache les images
      urlPattern: /\/_next\/image\?.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-image', expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 } },
    },
    {
      // Page métronome en cache pour mode hors-ligne
      urlPattern: /\/espace-eleve\/metronome/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'metronome-page', expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 } },
    },
    {
      // Page bibliothèque en cache
      urlPattern: /\/espace-eleve\/bibliotheque/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'bibliotheque-page', expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 } },
    },
  ],
})

const nextConfig = {
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = withPWA(nextConfig)
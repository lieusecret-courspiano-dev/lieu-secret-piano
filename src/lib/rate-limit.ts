import { NextRequest } from 'next/server'

// Rate limiting en mémoire (par IP)
// Sur Vercel, chaque instance a sa propre mémoire — suffisant pour limiter les abus
const attempts = new Map<string, { count: number; resetAt: number }>()

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

/**
 * Vérifie si l'IP a dépassé la limite de tentatives
 * @param key Clé unique (ex: `login:${ip}`)
 * @param maxAttempts Nombre max de tentatives
 * @param windowMs Fenêtre de temps en ms
 * @returns { allowed: boolean; remaining: number; resetIn: number }
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    // Nouvelle fenêtre
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count, resetIn: entry.resetAt - now }
}

/**
 * Réinitialise le compteur après un succès
 */
export function resetRateLimit(key: string): void {
  attempts.delete(key)
}

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
  const now = Date.now()
  const keys = Array.from(attempts.keys())
  for (const key of keys) {
    const entry = attempts.get(key)
    if (entry && entry.resetAt < now) attempts.delete(key)
  }
}, 5 * 60 * 1000) // toutes les 5 minutes

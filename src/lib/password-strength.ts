/**
 * Validation de la force du mot de passe — Lieu Secret
 * Règles : 8+ caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
 */

export interface PasswordValidation {
  valid: boolean
  errors: string[]
  strength: 'faible' | 'moyen' | 'fort' | 'très fort'
  score: number // 0-4
}

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  if (!password || password.length < PASSWORD_RULES.minLength) {
    errors.push(`Au moins ${PASSWORD_RULES.minLength} caractères`)
  } else {
    score++
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une lettre majuscule (A-Z)')
  } else {
    score++
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une lettre minuscule (a-z)')
  } else {
    score++
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Au moins un chiffre (0-9)')
  } else {
    score++
  }

  if (!SPECIAL_CHARS.test(password)) {
    errors.push('Au moins un caractère spécial (!@#$%^&*...)')
  } else {
    score++
  }

  // Bonus longueur
  if (password.length >= 12) score = Math.min(score + 1, 5)

  const strength =
    score <= 1 ? 'faible' :
    score <= 2 ? 'moyen' :
    score <= 3 ? 'fort' : 'très fort'

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 4),
  }
}

/** Message d'erreur unique pour les APIs */
export function getPasswordError(password: string): string | null {
  const { valid, errors } = validatePassword(password)
  if (valid) return null
  return `Mot de passe trop faible : ${errors.join(', ')}.`
}

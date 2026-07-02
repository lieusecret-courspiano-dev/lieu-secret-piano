'use client'
import { validatePassword } from '@/lib/password-strength'

interface Props {
  password: string
  className?: string
}

const STRENGTH_COLORS = {
  'faible':    { bar: 'bg-red-500',    text: 'text-red-400',    label: 'Faible' },
  'moyen':     { bar: 'bg-orange-500', text: 'text-orange-400', label: 'Moyen' },
  'fort':      { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Fort' },
  'très fort': { bar: 'bg-green-500',  text: 'text-green-400',  label: 'Très fort' },
}

export default function PasswordStrengthIndicator({ password, className = '' }: Props) {
  if (!password) return null

  const { valid, errors, strength, score } = validatePassword(password)
  const colors = STRENGTH_COLORS[strength]

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barre de force */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= score ? colors.bar : 'bg-noir-700'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${colors.text} shrink-0`}>
          {colors.label}
        </span>
      </div>

      {/* Liste des règles */}
      <ul className="space-y-0.5">
        {[
          { test: password.length >= 8,                label: '8 caractères minimum' },
          { test: /[A-Z]/.test(password),              label: 'Une majuscule (A-Z)' },
          { test: /[a-z]/.test(password),              label: 'Une minuscule (a-z)' },
          { test: /[0-9]/.test(password),              label: 'Un chiffre (0-9)' },
          { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password), label: 'Un caractère spécial (!@#$...)' },
        ].map(({ test, label }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs">
            {test ? (
              <svg width="12" height="12" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="12" height="12" fill="none" stroke="#6060a0" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            )}
            <span className={test ? 'text-green-400' : 'text-noir-500'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

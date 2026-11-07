/**
 * Intégration Kmeet (Infomaniak) — Remplacement de Zoom
 * Format des salles : https://kmeet.infomaniak.com/lieusecret-[prenom]-[date]-[code]
 */

/**
 * Génère un code aléatoire court
 */
function genCode(length = 4): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Normalise un prénom pour l'URL (sans accents, minuscules, sans espaces)
 */
function normaliserPrenom(prenom: string): string {
  return prenom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
}

/**
 * Génère une URL de salle Kmeet unique
 * Format : lieusecret-[prenom]-[YYYYMMDD]-[code4]
 */
export function genererSalleKmeet(params: {
  prenom?: string | null
  date?: string | Date | null
  type?: 'cours' | 'atelier' | 'masterclass' | 'evenement' | 'essai'
}): string {
  const { prenom, date, type = 'cours' } = params

  // Prénom normalisé
  const prenomNorm = prenom ? normaliserPrenom(prenom) : type

  // Date au format YYYYMMDD
  const d = date ? new Date(date) : new Date()
  const dateStr = d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')

  // Code unique
  const code = genCode(4)

  const nomSalle = `lieusecret-${prenomNorm}-${dateStr}-${code}`
  return `https://kmeet.infomaniak.com/${nomSalle}`
}

/**
 * Génère une URL Kmeet pour un cours individuel
 */
export function kmeetCours(params: {
  prenom?: string | null
  dateHeure: string | Date
}): string {
  return genererSalleKmeet({
    prenom: params.prenom,
    date:   params.dateHeure,
    type:   'cours',
  })
}

/**
 * Génère une URL Kmeet pour un atelier/événement
 */
export function kmeetEvenement(params: {
  titre?: string | null
  dateHeure: string | Date
  type?: 'atelier' | 'masterclass' | 'evenement'
}): string {
  return genererSalleKmeet({
    prenom: params.titre ? normaliserPrenom(params.titre) : params.type,
    date:   params.dateHeure,
    type:   params.type || 'evenement',
  })
}

/**
 * Génère une URL Kmeet pour un cours d'essai
 */
export function kmeetEssai(params: {
  prenom?: string | null
  dateHeure: string | Date
}): string {
  return genererSalleKmeet({
    prenom: params.prenom,
    date:   params.dateHeure,
    type:   'essai',
  })
}

/**
 * Extrait le nom de la salle depuis une URL Kmeet
 */
export function getNomSalle(url: string): string {
  return url.replace('https://kmeet.infomaniak.com/', '')
}

/**
 * Vérifie si une URL est une URL Kmeet valide
 */
export function isKmeetUrl(url: string): boolean {
  return url.startsWith('https://kmeet.infomaniak.com/')
}
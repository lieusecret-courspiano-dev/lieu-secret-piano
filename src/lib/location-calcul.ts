/**
 * Calcul des montants de location
 * Logique : chaque unité (week-end, semaine, mois) se multiplie
 * en fonction du nombre d'unités dans la période sélectionnée.
 *
 * Exemples :
 *  - 2 jours à 15€/j = 30€
 *  - 1 week-end (2j) à 55€ = 55€ | 2 week-ends (9j) à 55€ = 110€
 *  - 1 semaine (7j) à 80€ = 80€ | 10j à 80€ = 160€ (2 semaines)
 *  - 1 mois (30j) à 500€ = 500€ | 45j à 500€ = 1000€ (2 mois)
 */

export type DureeType = 'jours' | 'weekend' | 'semaine' | 'mois'

export interface PrixArticle {
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
}

/**
 * Compte le nombre de week-ends (paires sam-dim) dans une période
 */
export function countWeekends(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 0
  const start = new Date(dateDebut)
  const end   = new Date(dateFin)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (cur.getDay() === 6) { // Samedi
      const nextDay = new Date(cur)
      nextDay.setDate(nextDay.getDate() + 1)
      if (nextDay <= end && nextDay.getDay() === 0) { // Dimanche suivant dans la période
        count++
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  return Math.max(1, count) // Au moins 1 si le type est weekend
}

/**
 * Nombre de jours entre deux dates (inclus)
 */
export function nbJours(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 0
  const d1 = new Date(dateDebut)
  const d2 = new Date(dateFin)
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * Nombre de semaines (arrondi au supérieur)
 */
export function nbSemaines(dateDebut: string, dateFin: string): number {
  const jours = nbJours(dateDebut, dateFin)
  return Math.max(1, Math.ceil(jours / 7))
}

/**
 * Nombre de mois (arrondi au supérieur, base 30 jours)
 */
export function nbMois(dateDebut: string, dateFin: string): number {
  const jours = nbJours(dateDebut, dateFin)
  return Math.max(1, Math.ceil(jours / 30))
}

/**
 * Calcule le montant de location selon le type de durée
 */
export function calculMontantLocation(
  article: PrixArticle,
  dureeType: DureeType,
  dateDebut: string,
  dateFin: string
): number {
  if (!dateDebut || !dateFin) return 0

  switch (dureeType) {
    case 'jours':
      return (article.prix_jour || 0) * nbJours(dateDebut, dateFin)

    case 'weekend':
      return (article.prix_weekend || 0) * countWeekends(dateDebut, dateFin)

    case 'semaine':
      return (article.prix_semaine || 0) * nbSemaines(dateDebut, dateFin)

    case 'mois':
      return (article.prix_mois || 0) * nbMois(dateDebut, dateFin)

    default:
      return 0
  }
}

/**
 * Retourne le détail du calcul pour affichage
 */
export function detailCalcul(
  article: PrixArticle,
  dureeType: DureeType,
  dateDebut: string,
  dateFin: string
): { quantite: number; prixUnitaire: number; label: string } {
  if (!dateDebut || !dateFin) return { quantite: 0, prixUnitaire: 0, label: '' }

  switch (dureeType) {
    case 'jours': {
      const q = nbJours(dateDebut, dateFin)
      return { quantite: q, prixUnitaire: article.prix_jour || 0, label: `${q} jour${q > 1 ? 's' : ''}` }
    }
    case 'weekend': {
      const q = countWeekends(dateDebut, dateFin)
      return { quantite: q, prixUnitaire: article.prix_weekend || 0, label: `${q} week-end${q > 1 ? 's' : ''}` }
    }
    case 'semaine': {
      const q = nbSemaines(dateDebut, dateFin)
      return { quantite: q, prixUnitaire: article.prix_semaine || 0, label: `${q} semaine${q > 1 ? 's' : ''}` }
    }
    case 'mois': {
      const q = nbMois(dateDebut, dateFin)
      return { quantite: q, prixUnitaire: article.prix_mois || 0, label: `${q} mois` }
    }
    default:
      return { quantite: 0, prixUnitaire: 0, label: '' }
  }
}
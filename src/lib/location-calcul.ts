/**
 * Calcul des montants de location
 * Logique :
 *  - Jours : prix_jour × nb_jours
 *  - Week-end : prix_weekend × quantite (choisie par l'utilisateur)
 *  - Mois : prix_mois × quantite (choisie par l'utilisateur)
 *
 * Exemples :
 *  - 3 jours à 15€/j = 45€
 *  - 2 week-ends à 55€ = 110€ (2 × 55€, PAS 4 × 55€)
 *  - 2 mois à 500€ = 1000€ (2 × 500€)
 */

export type DureeType = 'jours' | 'weekend' | 'mois'

export interface PrixArticle {
  prix_jour: number | null
  prix_weekend: number | null
  prix_semaine: number | null
  prix_mois: number | null
}

/**
 * Nombre de jours entre deux dates (inclus)
 */
export function nbJours(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 0
  const d1 = new Date(dateDebut + 'T12:00:00')
  const d2 = new Date(dateFin + 'T12:00:00')
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * Nombre de mois calendaires réels
 * Basé sur calcDateFin qui génère : debut + N mois - 1 jour
 */
export function nbMois(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 1
  const d1 = new Date(dateDebut + 'T12:00:00')
  const d2 = new Date(dateFin + 'T12:00:00')
  const d2p1 = new Date(d2)
  d2p1.setDate(d2p1.getDate() + 1)
  const annees = d2p1.getFullYear() - d1.getFullYear()
  const mois   = d2p1.getMonth() - d1.getMonth()
  let total    = annees * 12 + mois
  if (d2p1.getDate() < d1.getDate()) total -= 1
  return Math.max(1, total)
}

/**
 * Calcule le montant de location
 * quantite = nombre de week-ends ou de mois choisis par l'utilisateur
 */
export function calculMontantLocation(
  article: PrixArticle,
  dureeType: DureeType,
  dateDebut: string,
  dateFin: string,
  quantite: number = 1
): number {
  if (!dateDebut || !dateFin) return 0

  switch (dureeType) {
    case 'jours':
      // Pour les jours : calculer depuis les dates
      return (article.prix_jour || 0) * nbJours(dateDebut, dateFin)

    case 'weekend':
      // Pour les week-ends : quantite × prix_weekend
      // Ex: 2 week-ends = 2 × 55€ = 110€
      return (article.prix_weekend || 0) * quantite

    case 'mois':
      // Pour les mois : quantite × prix_mois
      // Ex: 2 mois = 2 × 500€ = 1000€
      return (article.prix_mois || 0) * quantite

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
  dateFin: string,
  quantite: number = 1
): { quantite: number; prixUnitaire: number; label: string } {
  if (!dateDebut || !dateFin) return { quantite: 0, prixUnitaire: 0, label: '' }

  switch (dureeType) {
    case 'jours': {
      const q = nbJours(dateDebut, dateFin)
      return {
        quantite: q,
        prixUnitaire: article.prix_jour || 0,
        label: `${q} jour${q > 1 ? 's' : ''}`,
      }
    }
    case 'weekend':
      return {
        quantite,
        prixUnitaire: article.prix_weekend || 0,
        label: `${quantite} week-end${quantite > 1 ? 's' : ''}`,
      }
    case 'mois':
      return {
        quantite,
        prixUnitaire: article.prix_mois || 0,
        label: `${quantite} mois`,
      }
    default:
      return { quantite: 0, prixUnitaire: 0, label: '' }
  }
}

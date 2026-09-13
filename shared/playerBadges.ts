export type PlayerBadge = {
  id: string
  label: string
  description?: string
  icon?: string
  imagePath?: string
}

export const FIRST_VERSION_BADGE_ID = 'first-version'

export const playerBadges: readonly PlayerBadge[] = [
  {
    id: FIRST_VERSION_BADGE_ID,
    label: 'Premier jour',
    description: 'Là dès le début de l’aventure, le 11 septembre 2026.',
    imagePath: '/badges/premier-jour.svg',
  },
]

export function badgesForPlayer(badgeIds: readonly string[] = []): PlayerBadge[] {
  return playerBadges.filter((badge) => badgeIds.includes(badge.id))
}

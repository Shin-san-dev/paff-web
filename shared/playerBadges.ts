export type PlayerBadge = {
  id: string
  label: string
  description?: string
  icon?: string
}

export const FIRST_VERSION_BADGE_ID = 'first-version'

export const playerBadges: readonly PlayerBadge[] = [
  {
    id: FIRST_VERSION_BADGE_ID,
    label: 'Présent depuis la première version',
    description: 'Dans l’aventure PAFF depuis ses premiers pas, le 11 septembre 2026.',
    icon: '✦',
  },
]

export const DEFAULT_PLAYER_AVATAR = '/art/sentinel-engraving.webp'

export function badgesForPlayer(badgeIds: readonly string[] = []): PlayerBadge[] {
  return playerBadges.filter((badge) => badgeIds.includes(badge.id))
}

export const playerAvatars = [
  { faction: 'gobelins', path: '/cards/gobelins/gobelins-shaman-gobelin.webp', label: 'Gobelins' },
  { faction: 'sephosi', path: '/cards/sephosi/sephosi-anges-protecteurs-de-la-sephosi.webp', label: 'Sephosi' },
] as const

export const DEFAULT_PLAYER_AVATAR = playerAvatars[0].path

export function isPlayerAvatar(path: string) {
  return playerAvatars.some((avatar) => avatar.path === path)
}

export function resolvePlayerAvatar(path?: string) {
  if (path && isPlayerAvatar(path)) return path
  // Keep the faction for avatars selected from the earlier, larger gallery.
  return playerAvatars.find((avatar) => path?.startsWith(`/cards/${avatar.faction}/`))?.path ?? DEFAULT_PLAYER_AVATAR
}

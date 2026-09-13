import { useState } from 'react'
import { DEFAULT_PLAYER_AVATAR } from '../../../shared/playerBadges'
import './PlayerAvatar.css'

export function PlayerAvatar({ displayName, avatarPath = DEFAULT_PLAYER_AVATAR, size = 'small' }: {
  displayName: string
  avatarPath?: string
  size?: 'small' | 'large'
}) {
  const [failedPath, setFailedPath] = useState<string | null>(null)
  return <span className={`player-avatar player-avatar--${size}`} role="img" aria-label={`Avatar de ${displayName}`}>
    {failedPath === avatarPath
      ? <span aria-hidden="true">{displayName.trim().slice(0, 1).toLocaleUpperCase('fr')}</span>
      : <img src={avatarPath} alt="" onError={() => setFailedPath(avatarPath)} />}
  </span>
}

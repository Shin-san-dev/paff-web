import { useState } from 'react'
import { resolvePlayerAvatar } from '../../../shared/playerAvatars'
import './PlayerAvatar.css'

export function PlayerAvatar({ displayName, avatarPath, size = 'small' }: {
  displayName: string
  avatarPath?: string
  size?: 'small' | 'large'
}) {
  const [failedPath, setFailedPath] = useState<string | null>(null)
  const imagePath = resolvePlayerAvatar(avatarPath)
  return <span className={`player-avatar player-avatar--${size}`} role="img" aria-label={`Avatar de ${displayName}`}>
    {failedPath === imagePath
      ? <span aria-hidden="true">{displayName.trim().slice(0, 1).toLocaleUpperCase('fr')}</span>
      : <img src={imagePath} alt="" onError={() => setFailedPath(imagePath)} />}
  </span>
}

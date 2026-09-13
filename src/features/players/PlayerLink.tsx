import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PlayerLink({ userId, displayName, children, className }: {
  userId: string
  displayName: string
  children?: ReactNode
  className?: string
}) {
  return <Link className={className} to={`/players/${encodeURIComponent(userId)}`} aria-label={`Profil de ${displayName}`}>
    {children ?? displayName}
  </Link>
}

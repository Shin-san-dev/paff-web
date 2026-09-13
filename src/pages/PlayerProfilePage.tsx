import { useQuery } from 'convex/react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { SiteHeader } from '../components/SiteHeader'
import { PlayerAvatar } from '../features/players/PlayerAvatar'
import './CommunityPages.css'

export function PlayerProfilePage() {
  const { userId = '' } = useParams()
  const profile = useQuery(api.players.getProfile, { userId })
  return <>
    <SiteHeader />
    <main className="community-page page-shell">
      <Link className="community-back" to="/lobby">← Retour au lobby</Link>
      {profile === undefined ? <p className="community-message" role="status">Chargement du profil…</p>
        : profile === null ? <div className="community-heading community-message">
          <h1>Profil indisponible</h1><p>Ce joueur n’est pas disponible dans le groupe PAFF.</p>
        </div>
          : <article className="player-profile" aria-labelledby="player-name">
            <PlayerAvatar displayName={profile.displayName} avatarPath={profile.avatarPath} size="large" />
            <header className="community-heading">
              <p className="eyebrow">Autour de la table PAFF</p>
              <h1 id="player-name">{profile.displayName}</h1>
            </header>
            {profile.badges.length > 0 && <section className="player-badges" aria-labelledby="badges-heading">
              <h2 id="badges-heading">Les petits signes de l’aventure</h2>
              <ul>{profile.badges.map((badge) => <li className="player-badge" key={badge.id}>
                {badge.icon && <span className="player-badge__icon" aria-hidden="true">{badge.icon}</span>}
                <div><h3>{badge.label}</h3>{badge.description && <p>{badge.description}</p>}</div>
              </li>)}</ul>
            </section>}
          </article>}
    </main>
  </>
}

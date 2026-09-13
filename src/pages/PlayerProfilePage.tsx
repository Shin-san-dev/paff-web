import { useQuery } from 'convex/react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { SiteHeader } from '../components/SiteHeader'
import { PlayerAvatar } from '../features/players/PlayerAvatar'
import { AvatarPicker } from '../features/players/AvatarPicker'
import { useAuthSession } from '../auth/authSession'
import './CommunityPages.css'

export function PlayerProfilePage() {
  const { userId = '' } = useParams()
  const profile = useQuery(api.players.getProfile, { userId })
  const { player } = useAuthSession()
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const isOwnProfile = profile && profile.userId === player?.userId
  function closeAvatarPicker() {
    setEditingAvatar(false)
    avatarButtonRef.current?.focus()
  }
  return <>
    <SiteHeader />
    <main className="community-page player-profile-page page-shell">
      {profile === undefined ? <p className="community-message" role="status">Chargement du profil…</p>
        : profile === null ? <div className="community-heading community-message">
          <h1>Profil indisponible</h1><p>Ce joueur n’est pas disponible dans le groupe PAFF.</p>
        </div>
          : <article className="player-profile" aria-labelledby="player-name">
            <header className="player-profile__identity">
              <PlayerAvatar displayName={profile.displayName} avatarPath={profile.avatarPath} size="large" />
              <div className="player-profile__name">
                <p className="eyebrow">Autour de la table PAFF</p>
                <h1 id="player-name">{profile.displayName}</h1>
                {isOwnProfile && <div className="player-profile__actions">
                  <button ref={avatarButtonRef} className="ui-button ui-button--quiet" type="button" aria-haspopup="dialog" onClick={() => { setEditingAvatar(true); setSaved(false) }}>Modifier l’avatar</button>
                  {saved && <p className="avatar-feedback" role="status">Avatar modifié.</p>}
                </div>}
              </div>
            </header>
            {isOwnProfile && editingAvatar && <AvatarPicker key={profile.userId} currentPath={profile.avatarPath} onCancel={closeAvatarPicker} onSaved={() => { closeAvatarPicker(); setSaved(true) }} />}
            <div className="player-profile__sections">
            <section className="player-decks" aria-labelledby="player-decks-heading">
              <div className="player-decks__heading">
                <h2 id="player-decks-heading">Les decks</h2>
                <p className="player-decks__total"><strong>{profile.deckSummary.total}</strong> {profile.deckSummary.total === 1 ? 'deck' : 'decks'} au total</p>
              </div>
              {profile.deckSummary.total === 0 ? <p className="player-decks__empty">Aucun deck pour le moment.</p>
                : <dl className="player-decks__factions">{profile.deckSummary.byFaction.map((faction) => <div key={faction.factionStableId ?? 'unassigned'}>
                  <dt>{faction.name}</dt><dd>{faction.count} {faction.count === 1 ? 'deck' : 'decks'}</dd>
                </div>)}</dl>}
            </section>
            {profile.badges.length > 0 && <section className="player-badges" aria-labelledby="badges-heading">
              <h2 id="badges-heading">Badges</h2>
              <ul>{profile.badges.map((badge) => <li className="player-badge" key={badge.id}>
                {badge.imagePath ? <img className="player-badge__illustration" src={badge.imagePath} alt="" width="72" height="84" /> : badge.icon && <span className="player-badge__icon" aria-hidden="true">{badge.icon}</span>}
                <div><h3>{badge.label}</h3>{badge.description && <p>{badge.description}</p>}</div>
              </li>)}</ul>
            </section>}
            </div>
          </article>}
    </main>
  </>
}

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from 'convex/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthSessionContext, type AuthSessionValue } from '../auth/authSession'
import { playerBadges } from '../../shared/playerBadges'
import { PlayerProfilePage } from './PlayerProfilePage'
import type { Id } from '../../convex/_generated/dataModel'
import { DEFAULT_PLAYER_AVATAR, playerAvatars } from '../../shared/playerAvatars'

const updateAvatar = vi.hoisted(() => vi.fn())
vi.mock('convex/react', () => ({ useQuery: vi.fn(), useMutation: () => updateAvatar }))
const session: AuthSessionValue = { status: 'authenticated', player: null, signIn: vi.fn(), signOut: vi.fn() }
const profile = { userId: 'user-1', displayName: 'Nicolas', avatarPath: DEFAULT_PLAYER_AVATAR, badges: playerBadges, deckSummary: { total: 3, byFaction: [
  { factionStableId: 'gobelins', name: 'Gobelins', count: 2 }, { factionStableId: 'sephosi', name: 'Sephosi', count: 1 },
] } }
function renderProfile(ownProfile = false) {
  const value: AuthSessionValue = ownProfile ? { ...session, player: { userId: 'user-1' as Id<'users'>, displayName: 'Nicolas', loginId: 'nicolas', role: 'player' } } : session
  return render(<AuthSessionContext.Provider value={value}><MemoryRouter initialEntries={['/players/user-1']}><Routes>
    <Route path="/players/:userId" element={<PlayerProfilePage />} />
  </Routes></MemoryRouter></AuthSessionContext.Provider>)
}

beforeEach(() => {
  vi.mocked(useQuery).mockReset()
  updateAvatar.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})

describe('player identity page', () => {
  it('lets the owner choose and save an avatar, with cancellation and no badge controls', async () => {
    vi.mocked(useQuery).mockReturnValue(profile)
    renderProfile(true)
    await userEvent.click(screen.getByRole('button', { name: 'Modifier l’avatar' }))
    expect(screen.getByRole('dialog', { name: 'Choisis ton avatar' })).toBeVisible()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: 'Gobelins' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Enregistrer l’avatar' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: 'Sephosi' }))
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(updateAvatar).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Modifier l’avatar' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Sephosi' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’avatar' }))
    expect(updateAvatar).toHaveBeenCalledWith({ avatarPath: playerAvatars[1].path })
    expect(screen.getByRole('status')).toHaveTextContent('Avatar modifié.')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('closes the avatar dialog on cancellation without saving', async () => {
    vi.mocked(useQuery).mockReturnValue(profile)
    renderProfile(true)
    await userEvent.click(screen.getByRole('button', { name: 'Modifier l’avatar' }))
    fireEvent(screen.getByRole('dialog', { name: 'Choisis ton avatar' }), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier l’avatar' })).toHaveFocus()
    expect(updateAvatar).not.toHaveBeenCalled()
  })

  it('keeps a failed save retryable and hides editing on another member’s profile', async () => {
    vi.mocked(useQuery).mockReturnValue(profile)
    updateAvatar.mockRejectedValueOnce(new Error('Offline'))
    const view = renderProfile(true)
    await userEvent.click(screen.getByRole('button', { name: 'Modifier l’avatar' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Sephosi' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’avatar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('n’a pas pu être enregistré')
    expect(screen.getByRole('button', { name: 'Enregistrer l’avatar' })).toBeEnabled()
    view.unmount()
    renderProfile()
    expect(screen.queryByRole('button', { name: 'Modifier l’avatar' })).not.toBeInTheDocument()
  })

  it('shows the total and faction counts on a member’s profile', () => {
    vi.mocked(useQuery).mockReturnValue(profile)
    renderProfile()
    const section = screen.getByRole('region', { name: 'Les decks' })
    const decks = within(section)
    expect(section).toHaveTextContent('3 decks au total')
    expect(decks.getByText('Gobelins').parentElement).toHaveTextContent('Gobelins2 decks')
    expect(decks.getByText('Sephosi').parentElement).toHaveTextContent('Sephosi1 deck')
    expect(decks.queryByRole('link')).not.toBeInTheDocument()
  })
  it.each(['Nicolas', 'Adrien', 'Bru', 'Pierre', 'Quentin'])('shows the avatar, name and community badge of %s', (displayName) => {
    vi.mocked(useQuery).mockReturnValue({ ...profile, displayName })
    const { container } = renderProfile()
    expect(screen.getByRole('heading', { level: 1, name: displayName })).toBeVisible()
    expect(screen.getByRole('img', { name: `Avatar de ${displayName}` })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Premier jour' })).toBeVisible()
    expect(container.querySelector('main')).not.toHaveTextContent(/winrate|victoires|défaites|classement|\bElo\b|nombre de parties|faction préférée|carte préférée|decks publics/i)
  })

  it('handles loading and unavailable profiles separately', () => {
    const view = renderProfile()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du profil')
    vi.mocked(useQuery).mockReturnValue(null)
    view.rerender(<AuthSessionContext.Provider value={session}><MemoryRouter><PlayerProfilePage /></MemoryRouter></AuthSessionContext.Provider>)
    expect(screen.getByRole('heading', { name: 'Profil indisponible' })).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Retour au lobby/ })).not.toBeInTheDocument()
  })

  it('keeps an avatar if the image fails and omits empty badge sections', () => {
    vi.mocked(useQuery).mockReturnValue({ ...profile, badges: [], deckSummary: { total: 0, byFaction: [] } })
    renderProfile()
    const avatar = screen.getByRole('img', { name: 'Avatar de Nicolas' })
    fireEvent.error(avatar.querySelector('img')!)
    expect(avatar).toHaveTextContent('N')
    expect(screen.queryByRole('heading', { name: 'Badges' })).not.toBeInTheDocument()
    expect(screen.getByText('Aucun deck pour le moment.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Les decks' })).toHaveTextContent('0 decks au total')
  })
})

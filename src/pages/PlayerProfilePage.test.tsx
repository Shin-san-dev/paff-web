import { fireEvent, render, screen } from '@testing-library/react'
import { useQuery } from 'convex/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthSessionContext, type AuthSessionValue } from '../auth/authSession'
import { DEFAULT_PLAYER_AVATAR, playerBadges } from '../../shared/playerBadges'
import { PlayerProfilePage } from './PlayerProfilePage'

vi.mock('convex/react', () => ({ useQuery: vi.fn() }))
const session: AuthSessionValue = { status: 'authenticated', player: null, signIn: vi.fn(), signOut: vi.fn() }
const profile = { userId: 'user-1', displayName: 'Nicolas', avatarPath: DEFAULT_PLAYER_AVATAR, badges: playerBadges }
function renderProfile() {
  return render(<AuthSessionContext.Provider value={session}><MemoryRouter initialEntries={['/players/user-1']}><Routes>
    <Route path="/players/:userId" element={<PlayerProfilePage />} />
  </Routes></MemoryRouter></AuthSessionContext.Provider>)
}

beforeEach(() => vi.mocked(useQuery).mockReset())

describe('player identity page', () => {
  it.each(['Nicolas', 'Adrien', 'Bru', 'Pierre', 'Quentin'])('shows the avatar, name and community badge of %s', (displayName) => {
    vi.mocked(useQuery).mockReturnValue({ ...profile, displayName })
    const { container } = renderProfile()
    expect(screen.getByRole('heading', { level: 1, name: displayName })).toBeVisible()
    expect(screen.getByRole('img', { name: `Avatar de ${displayName}` })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Présent depuis la première version' })).toBeVisible()
    expect(container.querySelector('main')).not.toHaveTextContent(/winrate|victoires|défaites|classement|\bElo\b|nombre de parties|faction préférée|carte préférée|decks publics/i)
  })

  it('handles loading and unavailable profiles separately', () => {
    const view = renderProfile()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du profil')
    vi.mocked(useQuery).mockReturnValue(null)
    view.rerender(<AuthSessionContext.Provider value={session}><MemoryRouter><PlayerProfilePage /></MemoryRouter></AuthSessionContext.Provider>)
    expect(screen.getByRole('heading', { name: 'Profil indisponible' })).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour au lobby/ })).toHaveAttribute('href', '/lobby')
  })

  it('keeps an avatar if the image fails and omits empty badge sections', () => {
    vi.mocked(useQuery).mockReturnValue({ ...profile, badges: [] })
    renderProfile()
    const avatar = screen.getByRole('img', { name: 'Avatar de Nicolas' })
    fireEvent.error(avatar.querySelector('img')!)
    expect(avatar).toHaveTextContent('N')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})

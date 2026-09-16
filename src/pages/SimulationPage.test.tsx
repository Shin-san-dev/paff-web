import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from 'convex/react'
import { getFunctionName } from 'convex/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthSessionContext, type AuthSessionValue } from '../auth/authSession'
import { SimulationPage } from './SimulationPage'
import report from '../../data/simulation/report.json'
import examples from '../../data/simulation/examples.json'
import type { Id } from '../../convex/_generated/dataModel'

vi.mock('convex/react', () => ({ useQuery: vi.fn() }))
// A cross-faction row and two mirror rows exercise filtering without rendering
// the complete campaign in jsdom; the campaign verifies the generated dataset.
const sampleReport = { ...report, count: 3, replayed: 3, runs: [report.runs[0], ...report.runs.filter((r) => r.mirror).slice(0, 2)] }
const session = (allowed: boolean): AuthSessionValue => ({ status: 'authenticated', player: {
  userId: 'user-1' as Id<'users'>, loginId: 'nicolas', displayName: 'Nicolas', role: 'player', canUseSimulations: allowed,
}, signIn: vi.fn(), signOut: vi.fn() })
const show = (allowed: boolean) => render(<AuthSessionContext.Provider value={session(allowed)}><MemoryRouter><SimulationPage /></MemoryRouter></AuthSessionContext.Provider>)
beforeEach(() => { vi.mocked(useQuery).mockReset() })
describe('atelier privé des simulations', () => {
  it('ne demande aucune donnée et ne montre aucun lien admin sans capacité serveur', () => {
    show(false)
    expect(screen.getByRole('heading', { name: 'Accès réservé' })).toBeVisible()
    expect(useQuery).not.toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: 'Équilibrage' })).toBeNull()
  })
  it('présente les limites, filtre les résultats et parcourt une partie', async () => {
    vi.mocked(useQuery).mockImplementation((ref, args?) => args === 'skip' ? undefined : getFunctionName(ref) === 'simulations:getReport' ? sampleReport : examples[0])
    show(true)
    await userEvent.selectOptions(screen.getByLabelText('Campagne'), 'reference')
    expect(screen.getByText('Campagne de calibration')).toBeVisible()
    expect(screen.getByText(/ne démontrent pas qu’une faction/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Équilibrage' })).toBeVisible()
    await userEvent.selectOptions(screen.getByLabelText('Afficher'), 'gobelins-0-skrans / gobelins-0-skrans')
    expect(screen.getByText(/2 parties affichées/)).toBeVisible()
    await userEvent.selectOptions(screen.getByLabelText('Exemple'), report.examples[0])
    expect(screen.getByLabelText('Plateau : Déploiement')).toBeVisible()
    const piece = screen.getAllByRole('button', { name: /R · case/ })[0]
    await userEvent.click(piece)
    expect(screen.getByRole('status')).toHaveTextContent(/R · camp/)
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(screen.getByText('Tour 1 · Combat')).toBeVisible()
  })
  it('affiche le chargement du rapport', () => {
    show(true)
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des simulations')
  })
  it('indique le vrai gagnant et vide la sélection lors du changement de campagne', async () => {
    vi.mocked(useQuery).mockImplementation((ref, args?) => args === 'skip' ? undefined : getFunctionName(ref) === 'simulations:getReport' ? sampleReport : examples[0])
    show(true)
    await userEvent.selectOptions(screen.getByLabelText('Campagne'), 'reference')
    await userEvent.selectOptions(screen.getByLabelText('Exemple'), 'partie-001')
    expect(screen.getByText(/Victoire Sephosi · camp nord/)).toBeVisible()
    await userEvent.selectOptions(screen.getByLabelText('Étape'), String(examples[0].frames.length - 1))
    expect(screen.getByText(/La Base Centre sud est contrôlée par Sephosi/)).toBeVisible()
    expect(screen.getByRole('button', { name: /Cavalerie lourde.*case C2/ })).toHaveAttribute('title', expect.stringContaining('Engagée'))
    await userEvent.selectOptions(screen.getByLabelText('Campagne'), 'mcts')
    expect(screen.getByLabelText('Exemple')).toHaveValue('')
    expect(screen.queryByLabelText(/Plateau :/)).toBeNull()
  })
})

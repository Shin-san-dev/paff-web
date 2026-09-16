import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGameHarness } from '../src/test/gameHarness'

afterEach(() => vi.unstubAllEnvs())
describe('rapports de simulation réservés à un compte', () => {
  it('autorise uniquement l’identifiant configuré, même si son pseudo change', async () => {
    vi.stubEnv('PAFF_SIMULATION_ADMIN_USER_ID', 'user-1')
    const h = createGameHarness(), before = structuredClone(h.tables)
    await expect(h.invoke('simulations', 'getReport', 1)).resolves.toMatchObject({ status: 'calibration', count: 84 })
    await expect(h.invoke('simulations', 'getReport', 1, { campaign: 'reference' })).resolves.toMatchObject({ count: 792 })
    await expect(h.invoke('simulations', 'getExample', 1, { id: 'partie-001', campaign: 'reference' })).resolves.toMatchObject({ id: 'partie-001' })
    await expect(h.invoke('simulations', 'getExample', 1, { id: 'mcts-001', campaign: 'mcts' })).resolves.toMatchObject({ id: 'mcts-001' })
    await expect(h.invoke('simulations', 'getExample', 1, { id: 'partie-001', campaign: 'mcts' })).resolves.toBeNull()
    await expect(h.invoke('simulations', 'getExample', 1, { id: 'absent' })).resolves.toBeNull()
    await expect(h.invoke('players', 'current', 1)).resolves.toMatchObject({ canUseSimulations: true })
    expect(h.tables).toEqual(before)
  })
  it('refuse un autre administrateur ou un membre nommé Nicolas, même par appel direct', async () => {
    vi.stubEnv('PAFF_SIMULATION_ADMIN_USER_ID', 'user-1')
    const h = createGameHarness()
    h.tables.playerProfiles[1].displayName = 'Nicolas'; h.tables.playerProfiles[1].role = 'admin'
    for (const campaign of ['mcts', 'reference']) for (const fn of ['getReport', 'getExample']) await expect(h.invoke('simulations', fn, 2, { id: 'partie-001', userId: 'user-1', campaign })).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } })
    await expect(h.invoke('players', 'current', 2)).resolves.toMatchObject({ canUseSimulations: false })
  })
  it('reste fermé sans configuration, sans session ou avec compte désactivé', async () => {
    const h = createGameHarness()
    vi.stubEnv('PAFF_SIMULATION_ADMIN_USER_ID', '')
    await expect(h.invoke('simulations', 'getReport', 1)).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } })
    vi.stubEnv('PAFF_SIMULATION_ADMIN_USER_ID', 'user-1')
    await expect(h.invoke('simulations', 'getReport', 0)).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
    h.tables.playerProfiles[0].active = false
    await expect(h.invoke('simulations', 'getReport', 1)).rejects.toMatchObject({ data: { code: 'ACCOUNT_DISABLED' } })
  })
})

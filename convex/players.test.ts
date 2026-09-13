import { describe, expect, it } from 'vitest'
import { createGameHarness } from '../src/test/gameHarness'
import { DEFAULT_PLAYER_AVATAR, FIRST_VERSION_BADGE_ID, playerBadges } from '../shared/playerBadges'

describe('member profiles', () => {
  it('returns only presentation fields from an existing account', async () => {
    const h = createGameHarness()
    h.tables.playerProfiles[1].badgeIds = [FIRST_VERSION_BADGE_ID, 'removed-badge']
    const before = structuredClone(h.tables)
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toEqual({
      userId: 'user-2', displayName: 'Joueur 2', avatarPath: DEFAULT_PLAYER_AVATAR, badges: playerBadges,
    })
    expect(h.tables).toEqual(before)
  })

  it('supports existing accounts before optional fields are initialized', async () => {
    const h = createGameHarness()
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toMatchObject({
      displayName: 'Joueur 2', avatarPath: DEFAULT_PLAYER_AVATAR, badges: [],
    })
    await expect(h.invoke('players', 'current', 1)).resolves.toMatchObject({ userId: 'user-1' })
  })

  it('requires an active member even when called outside the UI', async () => {
    const h = createGameHarness()
    await expect(h.invoke('players', 'getProfile', 0, { userId: 'user-2' })).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
    h.tables.playerProfiles[0].active = false
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).rejects.toMatchObject({ data: { code: 'ACCOUNT_DISABLED' } })
  })

  it.each(['not-an-id', 'user-999', 'user-2'])('handles missing, malformed or inactive profiles: %s', async (userId) => {
    const h = createGameHarness()
    h.tables.playerProfiles[1].active = false
    await expect(h.invoke('players', 'getProfile', 1, { userId })).resolves.toBeNull()
  })

  it('configures badges manually without changing any account or game data', async () => {
    const h = createGameHarness()
    await h.readyFor('preparation')
    const before = structuredClone(h.tables)
    await h.invoke('players', 'setPresentation', 0, {
      userId: 'user-2', avatarPath: '/cards/gobelins/gobelins-shaman-gobelin.webp', badgeIds: [FIRST_VERSION_BADGE_ID, FIRST_VERSION_BADGE_ID],
    })
    expect(h.tables).toEqual({ ...before, playerProfiles: before.playerProfiles.map((p) => p.userId === 'user-2'
      ? { ...p, avatarPath: '/cards/gobelins/gobelins-shaman-gobelin.webp', badgeIds: [FIRST_VERSION_BADGE_ID] } : p) })
    await h.invoke('players', 'setPresentation', 0, { userId: 'user-2', badgeIds: [] })
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toMatchObject({ badges: [], avatarPath: '/cards/gobelins/gobelins-shaman-gobelin.webp' })
  })

  it.each([{ badgeIds: ['unknown'] }, { avatarPath: '//example.org/avatar.png' }, { avatarPath: 'https://example.org/avatar.png' }])('rejects unknown badges and nonlocal avatars', async (fields) => {
    const h = createGameHarness()
    const before = structuredClone(h.tables)
    await expect(h.invoke('players', 'setPresentation', 0, { userId: 'user-1', ...fields })).rejects.toThrow()
    expect(h.tables).toEqual(before)
  })
})

function launchHarness() {
  const h = createGameHarness()
  h.tables.playerProfiles = ['Nicolas', 'Adrien', 'Bru', 'Pierre', 'Quentin', 'Autre membre'].map((displayName, index) => ({
    ...h.tables.playerProfiles[0], _id: `profile-${index + 1}`, userId: `user-${index + 1}`, loginId: `private-login-${index}`, displayName,
  }))
  return h
}

describe('explicit launch profile initialization', () => {
  it('initializes the five existing players once, preserving IDs, logins and all other data', async () => {
    const h = launchHarness()
    const before = structuredClone(h.tables)
    await expect(h.invoke('migrations', 'initializeLaunchProfiles', 0)).resolves.toEqual({ updated: 5, total: 5 })
    expect(h.tables).toEqual({ ...before, playerProfiles: before.playerProfiles.map((p, i) => i < 5
      ? { ...p, avatarPath: DEFAULT_PLAYER_AVATAR, badgeIds: [FIRST_VERSION_BADGE_ID] } : p) })
    for (let i = 1; i <= 5; i++) {
      await expect(h.invoke('players', 'getProfile', 1, { userId: `user-${i}` })).resolves.toMatchObject({
        displayName: before.playerProfiles[i - 1].displayName, badges: playerBadges,
      })
    }
    await h.invoke('players', 'setPresentation', 0, { userId: 'user-1', badgeIds: [], avatarPath: '/art/paff-battle-home.png' })
    const configured = structuredClone(h.tables)
    await expect(h.invoke('migrations', 'initializeLaunchProfiles', 0)).resolves.toEqual({ updated: 0, total: 5 })
    expect(h.tables).toEqual(configured)
  })

  it.each(['missing', 'duplicate'])('requires an unambiguous match for every player before writing: %s', async (condition) => {
    const h = launchHarness()
    if (condition === 'missing') h.tables.playerProfiles[4].displayName = 'Quelqu’un d’autre'
    else h.tables.playerProfiles[5].displayName = 'Nicolas'
    const before = structuredClone(h.tables)
    await expect(h.invoke('migrations', 'initializeLaunchProfiles', 0)).rejects.toThrow('Expected exactly one existing profile')
    expect(h.tables).toEqual(before)
  })
})

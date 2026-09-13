import { describe, expect, it } from 'vitest'
import { createGameHarness } from '../src/test/gameHarness'
import { FIRST_VERSION_BADGE_ID, playerBadges } from '../shared/playerBadges'
import { DEFAULT_PLAYER_AVATAR, playerAvatars } from '../shared/playerAvatars'

describe('member profiles', () => {
  it('changes only the authenticated player’s avatar and persists it in the profile', async () => {
    const h = createGameHarness()
    h.tables.playerProfiles[0].badgeIds = [FIRST_VERSION_BADGE_ID]
    await h.readyFor('preparation')
    const before = structuredClone(h.tables)
    const avatarPath = playerAvatars[1].path
    await h.invoke('players', 'updateMyAvatar', 1, { avatarPath, userId: 'user-2', badgeIds: [] })
    expect(h.tables).toEqual({ ...before, playerProfiles: before.playerProfiles.map((p) => p.userId === 'user-1' ? { ...p, avatarPath } : p) })
    await expect(h.invoke('players', 'getProfile', 2, { userId: 'user-1' })).resolves.toMatchObject({ avatarPath, badges: playerBadges })
  })

  it.each(['https://example.com/avatar.png', '/not-in-the-gallery.png', '/cards/gaeli/gaeli-druide.webp', '/cards/gobelins/gobelins-archers-gobelins.webp'])('refuses avatars outside the gallery: %s', async (avatarPath) => {
    const h = createGameHarness()
    const before = structuredClone(h.tables)
    await expect(h.invoke('players', 'updateMyAvatar', 1, { avatarPath })).rejects.toMatchObject({ data: { code: 'INVALID_AVATAR' } })
    expect(h.tables).toEqual(before)
  })

  it('refuses avatar changes without an active session', async () => {
    const h = createGameHarness()
    const args = { avatarPath: playerAvatars[1].path }
    await expect(h.invoke('players', 'updateMyAvatar', 0, args)).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } })
    h.tables.playerProfiles[0].active = false
    await expect(h.invoke('players', 'updateMyAvatar', 1, args)).rejects.toMatchObject({ data: { code: 'ACCOUNT_DISABLED' } })
  })
  it('returns only presentation fields from an existing account', async () => {
    const h = createGameHarness()
    h.tables.playerProfiles[1].badgeIds = [FIRST_VERSION_BADGE_ID, 'removed-badge']
    const before = structuredClone(h.tables)
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toEqual({
      userId: 'user-2', displayName: 'Joueur 2', avatarPath: DEFAULT_PLAYER_AVATAR, badges: playerBadges,
      deckSummary: { total: 1, byFaction: [{ factionStableId: 'gobelins', name: 'Gobelins', count: 1 }] },
    })
    expect(h.tables).toEqual(before)
  })

  it('counts only the viewed player’s decks and reacts to creation and removal without exposing deck contents', async () => {
    const h = createGameHarness()
    h.tables.factions.push({ ...h.tables.factions[0], _id: 'sephosi', stableId: 'sephosi', name: 'Sephosi' })
    const deckId = await h.invoke('decks', 'create', 2, { name: 'Composition privée', factionStableId: 'sephosi' })
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toEqual({
      userId: 'user-2', displayName: 'Joueur 2', avatarPath: DEFAULT_PLAYER_AVATAR, badges: [],
      deckSummary: { total: 2, byFaction: [
        { factionStableId: 'gobelins', name: 'Gobelins', count: 1 },
        { factionStableId: 'sephosi', name: 'Sephosi', count: 1 },
      ] },
    })
    await h.invoke('decks', 'remove', 2, { deckId })
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toMatchObject({ deckSummary: { total: 1 } })
    await h.invoke('decks', 'remove', 2, { deckId: 'deck-2' })
    await expect(h.invoke('players', 'getProfile', 1, { userId: 'user-2' })).resolves.toMatchObject({ deckSummary: { total: 0, byFaction: [] } })
  })

  it('includes legacy, archived-faction and unassigned decks in totals without changing stored data', async () => {
    const h = createGameHarness()
    delete h.tables.decks[0].factionId
    h.tables.factions[0].status = 'archived'
    h.tables.decks.push({ _id: 'empty', ownerUserId: 'user-1', name: 'Vide' }, { _id: 'missing', ownerUserId: 'user-1', name: 'Ancien', factionId: 'missing-faction' })
    const before = structuredClone(h.tables)
    await expect(h.invoke('players', 'getProfile', 2, { userId: 'user-1' })).resolves.toMatchObject({
      deckSummary: { total: 3, byFaction: [
        { factionStableId: 'gobelins', name: 'Gobelins', count: 1 },
        { factionStableId: null, name: 'Sans faction', count: 2 },
      ] },
    })
    expect(h.tables).toEqual(before)
  })

  it.each([
    ['/art/sentinel-engraving.webp', DEFAULT_PLAYER_AVATAR],
    ['/cards/sephosi/sephosi-cavalerie-lourde-sephosienne.webp', playerAvatars[1].path],
  ])('displays an earlier avatar as a current faction avatar without rewriting it: %s', async (previous, expected) => {
    const h = createGameHarness()
    h.tables.playerProfiles[0].avatarPath = previous
    await expect(h.invoke('players', 'getProfile', 2, { userId: 'user-1' })).resolves.toMatchObject({ avatarPath: expected })
    expect(h.tables.playerProfiles[0].avatarPath).toBe(previous)
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
    await h.invoke('players', 'setPresentation', 0, { userId: 'user-1', avatarPath: playerAvatars[1].path })
    const configured = structuredClone(h.tables)
    await expect(h.invoke('migrations', 'initializeLaunchProfiles', 0)).resolves.toEqual({ updated: 0, total: 5 })
    expect(h.tables).toEqual(configured)
  })

  it('adds Premier jour to all five launch accounts while preserving avatars and other badges', async () => {
    const h = launchHarness()
    h.tables.playerProfiles[0].badgeIds = []
    h.tables.playerProfiles[1].badgeIds = ['another-badge']
    h.tables.playerProfiles[1].avatarPath = playerAvatars[1].path
    await h.invoke('migrations', 'initializeLaunchProfiles', 0)
    expect(h.tables.playerProfiles[0].badgeIds).toEqual([FIRST_VERSION_BADGE_ID])
    expect(h.tables.playerProfiles[1]).toMatchObject({ badgeIds: ['another-badge', FIRST_VERSION_BADGE_ID], avatarPath: playerAvatars[1].path })
    await expect(h.invoke('migrations', 'initializeLaunchProfiles', 0)).resolves.toEqual({ updated: 0, total: 5 })
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

import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { getUnitProfile } from '../shared/unitProfile'
import { DEFAULT_PLAYER_AVATAR, FIRST_VERSION_BADGE_ID } from '../shared/playerBadges'

// Run explicitly once after deployment. This list identifies existing accounts;
// it never provisions users or awards badges based on activity or performance.
export const initializeLaunchProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const names = ['Nicolas', 'Adrien', 'Bru', 'Pierre', 'Quentin']
    const profiles = await ctx.db.query('playerProfiles').collect()
    const launchProfiles = names.map((name) => {
      const matches = profiles.filter((profile) => profile.displayName.trim().toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'))
      if (matches.length !== 1) throw new Error(`Expected exactly one existing profile for ${name}`)
      return matches[0]
    })
    let updated = 0
    for (const profile of launchProfiles) {
      if (profile.avatarPath !== undefined && profile.badgeIds !== undefined) continue
      await ctx.db.patch(profile._id, {
        ...(profile.avatarPath === undefined ? { avatarPath: DEFAULT_PLAYER_AVATAR } : {}),
        ...(profile.badgeIds === undefined ? { badgeIds: [FIRST_VERSION_BADGE_ID] } : {}),
      })
      updated++
    }
    return { updated, total: launchProfiles.length }
  },
})

// Backfill in bounded batches. Existing profiles, IDs and deck contents are preserved.
export const backfillUnitProfiles = internalMutation({
  args: { table: v.union(v.literal('cards'), v.literal('gameCards')), cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const page = await ctx.db.query(args.table).paginate({ cursor: args.cursor, numItems: 100 })
    let updated = 0
    for (const card of page.page) {
      if (card.kind === 'unit' && !card.profile) {
        // Game copies use their own frozen legacy values, never the live catalogue.
        await ctx.db.patch(card._id, { profile: getUnitProfile(card) })
        updated++
      }
    }
    return { updated, scanned: page.page.length, isDone: page.isDone, continueCursor: page.continueCursor }
  },
})

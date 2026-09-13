import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import { getCurrentPlayer, requireActivePlayer } from './lib/auth'
import { normalizeLoginId } from './lib/normalizeLoginId'
import { badgesForPlayer, DEFAULT_PLAYER_AVATAR, playerBadges } from '../shared/playerBadges'

export const current = query({
  args: {},
  handler: async (ctx) => {
    const player = await getCurrentPlayer(ctx)

    if (player.status !== 'active') {
      return { status: player.status }
    }

    return {
      status: player.status,
      userId: player.userId,
      loginId: player.loginId,
      displayName: player.displayName,
      role: player.role,
    }
  },
})

export const getProfile = query({
  // Accept a route segment, then normalize it so a malformed URL is a missing profile.
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireActivePlayer(ctx)
    const userId = ctx.db.normalizeId('users', args.userId)
    if (!userId) return null

    const profile = await ctx.db.query('playerProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId)).unique()
    if (!profile?.active) return null

    // Return only the identity shown to other members, never login or account data.
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      avatarPath: profile.avatarPath ?? DEFAULT_PLAYER_AVATAR,
      badges: badgesForPlayer(profile.badgeIds),
    }
  },
})

export const setPresentation = internalMutation({
  args: {
    userId: v.id('users'),
    avatarPath: v.optional(v.string()),
    badgeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query('playerProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId)).unique()
    if (!profile) throw new Error('Account not found')
    if (args.avatarPath !== undefined && !/^\/(?!\/)[^\\?#]+\.(webp|png|jpe?g|svg)$/i.test(args.avatarPath)) {
      throw new Error('Avatar must be a local image path')
    }
    if (args.badgeIds?.some((id) => !playerBadges.some((badge) => badge.id === id))) {
      throw new Error('Unknown player badge')
    }
    await ctx.db.patch(profile._id, {
      ...(args.avatarPath !== undefined ? { avatarPath: args.avatarPath } : {}),
      ...(args.badgeIds !== undefined ? { badgeIds: [...new Set(args.badgeIds)] } : {}),
    })
    return { updated: true }
  },
})

export const setActive = internalMutation({
  args: {
    loginId: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const loginId = normalizeLoginId(args.loginId)
    const player = await ctx.db
      .query('playerProfiles')
      .withIndex('by_login_id', (query) => query.eq('loginId', loginId))
      .unique()

    if (!player) {
      throw new Error('Account not found')
    }

    await ctx.db.patch(player._id, { active: args.active })
    return { updated: true }
  },
})

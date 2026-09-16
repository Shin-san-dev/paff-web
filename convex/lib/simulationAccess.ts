import { ConvexError } from 'convex/values'
import { requireActivePlayer } from './auth'
import type { QueryCtx } from '../_generated/server'

/** Pinned account ID, configured separately on each deployment; never a display name. */
export function hasSimulationAccess(userId: string) {
  const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  const configured = runtime.process?.env?.PAFF_SIMULATION_ADMIN_USER_ID?.trim()
  return !!configured && userId === configured
}
export async function requireSimulationAdmin(ctx: QueryCtx) {
  const player = await requireActivePlayer(ctx)
  if (!hasSimulationAccess(player.userId)) throw new ConvexError({ code: 'FORBIDDEN' })
  return player
}

import type { State } from './state'
import type { Seat } from '../../shared/board'

/** Rotate coordinates and seat-prefixed unit IDs together. Created IDs remain
 * stable. Canonical orientation also removes floating-point accumulation and
 * tie-order differences between otherwise identical north/south searches. */
export function rotate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), (key, v: unknown) => {
    if ((key === 'cell' || key === 'to') && typeof v === 'number') return 53 - v
    if ((key === 'seat' || key === 'initiative') && typeof v === 'number') return 1 - v
    if (typeof v === 'string') return v.replace(/^([01]):/, (_, s: string) => `${1 - Number(s)}:`)
    return v
  }) as T
}
export function perspective(state: State, seat: Seat) {
  const next = seat === 0 ? structuredClone(state) : rotate(state)
  if (seat === 1) next.players = [next.players[1], next.players[0]]
  next.units.sort((a, b) => a.seat - b.seat || a.id.localeCompare(b.id))
  return next
}

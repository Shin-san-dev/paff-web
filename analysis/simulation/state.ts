import { catalogue2026 } from '../../shared/catalogue2026'
import { cells, isCell, isCenterBase, zoneOf } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { adjacent } from '../../shared/battleEngine'

export const rulesVersion = 'paff-2026-09-15-adrien-03'
export type Unit = {
  id: string; card: string; seat: Seat; cell: number | null; r: number
  recruited: number | null; moved: boolean; shot: boolean; doubled: boolean; rain: number
}
export type Player = {
  faction: 'gobelins' | 'sephosi'; recruitment: number; ps: number; orders: number
  used: Record<string, number>; vallardi: boolean
}
export type Result = { kind: 'draw' } | { kind: 'win'; seat: Seat; reason: 'elimination' | 'base' | 'control' }
export type State = {
  version: typeof rulesVersion; turn: number; phase: 'orders' | 'combat' | 'end'
  initiative: Seat; units: Unit[]; engagements: { a: string; b: string }[]
  players: [Player, Player]; salamander: { seat: Seat; zone: string; source: string }[]
  result?: Result
}
export type Dice = () => number

export function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
export function card(id: string) {
  const found = catalogue2026.find((item) => item.stableId === id)
  requireRule(found, `Carte inconnue : ${id}`)
  return found
}
export const profile = (u: Unit) => card(u.card).profile
export const ability = (u: Unit, id: string) => profile(u).ability?.id === id
export const axis = (cell: number) => Number(zoneOf(cell).split('-')[1])
export const onBoard = (u: Unit) => u.cell !== null && u.r > 0
export function unit(s: State, id: string) {
  const u = s.units.find((item) => item.id === id)
  requireRule(u, `Unité inconnue : ${id}`)
  return u
}
export function deployed(s: State, id: string) {
  const u = unit(s, id)
  requireRule(onBoard(u), `Unité absente du plateau : ${id}`)
  return u as Unit & { cell: number }
}
export function engaged(s: State, id: string) {
  return s.engagements.some((edge) => edge.a === id || edge.b === id)
}
export function opponents(s: State, id: string) {
  return s.engagements.flatMap((e) => e.a === id ? [e.b] : e.b === id ? [e.a] : [])
}
export function d6(dice: Dice) {
  const face = dice()
  requireRule(Number.isInteger(face) && face >= 1 && face <= 6, 'Un résultat de dé doit être entre 1 et 6')
  return face
}
/** Finite, explicit dice make every scenario reproducible; no random fallback. */
export function scriptedDice(faces: number[]) {
  let cursor = 0
  return {
    roll: () => { requireRule(cursor < faces.length, 'Séquence de dés épuisée'); return faces[cursor++] },
    remaining: () => faces.length - cursor,
  }
}

export function makeUnit(id: string, stableId: string, seat: Seat, cell: number | null): Unit {
  return { id, card: stableId, seat, cell, r: card(stableId).profile.regiment,
    recruited: null, moved: false, shot: false, doubled: false, rain: 0 }
}
/** A controlled snapshot, NOT validation of deck construction or initial deployment. */
export function scenario(units: Unit[], turn = 1): State {
  const player = (seat: Seat): Player => ({ faction: units.some((u) => u.seat === seat)
    ? card(units.find((u) => u.seat === seat)!.card).faction : seat === 0 ? 'gobelins' : 'sephosi',
  recruitment: 0, ps: 0, orders: 3, used: {}, vallardi: false })
  const s: State = { version: rulesVersion, turn, phase: 'orders', initiative: 0, units: structuredClone(units),
    engagements: [], players: [player(0), player(1)], salamander: [] }
  for (const u of s.units) if (onBoard(u) && ability(u, 'strategist')) grantVallardi(s, u.seat)
  validate(s)
  return s
}
export function validate(s: State) {
  requireRule(s.version === rulesVersion && Number.isInteger(s.turn) && s.turn >= 1 && s.turn <= 8, 'Référence ou tour invalide')
  requireRule(new Set(s.units.map((u) => u.id)).size === s.units.length, 'Identifiants dupliqués')
  const occupied = s.units.filter(onBoard).map((u) => u.cell)
  requireRule(new Set(occupied).size === occupied.length, 'Case occupée plusieurs fois')
  for (const u of s.units) {
    card(u.card)
    requireRule(u.cell === null || isCell(u.cell), 'Case invalide')
    requireRule(Number.isInteger(u.r) && u.r >= 0, 'R invalides')
    requireRule(card(u.card).faction === s.players[u.seat].faction, 'Faction incohérente')
  }
  const edges = new Set<string>()
  for (const e of s.engagements) {
    const a = deployed(s, e.a), b = deployed(s, e.b), key = [e.a, e.b].sort().join(':')
    requireRule(a.seat !== b.seat && adjacent(a.cell, b.cell) && !edges.has(key), 'Engagement invalide')
    edges.add(key)
  }
  for (const p of s.players) {
    requireRule([p.recruitment, p.ps, p.orders, ...Object.values(p.used)].every((n) => Number.isInteger(n) && n >= 0), 'Ressources invalides')
  }
}
/** Public operations are atomic for state: invalid actions leave their input intact. */
export function change(s: State, fn: (next: State) => void): State {
  validate(s)
  requireRule(!s.result, 'La situation est terminée')
  const next = structuredClone(s)
  fn(next)
  validate(next)
  return next
}
export function grantVallardi(s: State, seat: Seat) {
  const p = s.players[seat]
  if (!p.vallardi) { p.vallardi = true; p.orders++ }
}
export function damage(s: State, losses: Map<string, number>) {
  for (const [id, amount] of losses) {
    const u = unit(s, id)
    u.r = Math.max(0, u.r - amount)
    if (!u.r) u.cell = null
  }
  s.engagements = s.engagements.filter((e) => onBoard(unit(s, e.a)) && onBoard(unit(s, e.b)))
}
export function addLoss(losses: Map<string, number>, id: string, amount: number) {
  losses.set(id, (losses.get(id) ?? 0) + amount)
}
export function elimination(s: State): Result | undefined {
  const present = ([0, 1] as const).map((seat) => s.units.some((u) => onBoard(u) && u.seat === seat))
  return !present[0] && !present[1] ? { kind: 'draw' }
    : !present[0] ? { kind: 'win', seat: 1, reason: 'elimination' }
      : !present[1] ? { kind: 'win', seat: 0, reason: 'elimination' } : undefined
}
export function controls(s: State, seat: Seat, zone: string) {
  const active = s.units.filter((u) => onBoard(u) && zoneOf(u.cell!) === zone && !engaged(s, u.id))
  return active.some((u) => u.seat === seat) && !active.some((u) => u.seat !== seat)
}
export function victory(s: State, endOfTurn = false): Result | undefined {
  const gone = elimination(s)
  if (gone || !endOfTurn) return gone
  const bases = ([0, 1] as const).map((seat) => controls(s, seat,
    zoneOf(cells.find((cell) => isCenterBase(cell, seat === 0 ? 1 : 0))!)))
  if (bases[0] && bases[1]) return s.turn === 8 ? { kind: 'draw' } : undefined
  if (bases[0] || bases[1]) return { kind: 'win', seat: bases[0] ? 0 : 1, reason: 'base' }
  if (s.turn !== 8) return undefined
  const totals = ([0, 1] as const).map((seat) => [0, 1, 2].filter((a) => controls(s, seat, `2-${a}`)).length)
  return totals[0] === totals[1] ? { kind: 'draw' } : { kind: 'win', seat: totals[0] > totals[1] ? 0 : 1, reason: 'control' }
}
export function finishTurn(s: State) {
  return change(s, (next) => {
    requireRule(next.phase === 'end', 'Le combat doit être résolu')
    next.result = victory(next, true)
    if (next.result) return
    for (const seat of [0, 1] as const) next.players[seat].ps += [0, 1, 2].filter((a) => controls(next, seat, `2-${a}`)).length
    next.turn++
    next.initiative = next.initiative === 0 ? 1 : 0
    next.phase = 'orders'
    next.salamander = []
    for (const p of next.players) {
      p.orders = 3; p.vallardi = false
      if ([2, 4, 5].includes(next.turn)) p.recruitment += 3
    }
    for (const u of next.units) {
      u.moved = false; u.shot = false; u.rain = 0; u.doubled = false
      if (onBoard(u) && ability(u, 'strategist')) grantVallardi(next, u.seat)
    }
  })
}

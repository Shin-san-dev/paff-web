import { legalMoves } from '../../shared/battleEngine'
import { cells, isCenterBase, isHome, zoneOf } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { catalogue2026 } from '../../shared/catalogue2026'
import { candidates, distance } from './bots'
import { relativeCell } from './decks'
import { buyOrder, inRange, playOrder } from './orders'
import type { Order } from './orders'
import { ability, controls, engaged, onBoard, unit } from './state'
import type { State, Unit } from './state'
import type { Choice } from './search'

export const ownBase = (seat: Seat) => seat === 0 ? '3-1' : '1-1'
const other = (seat: Seat): Seat => seat === 0 ? 1 : 0
const cards = new Map(catalogue2026.map((c) => [c.stableId, c]))
const card = (id: string) => { const c = cards.get(id); if (!c) throw new Error(`Carte inconnue : ${id}`); return c }
const profile = (u: Unit) => card(u.card).profile
export const canFire = (s: State, u: Unit) => profile(u).offense.kind === 'ranged' && !u.shot && u.recruited !== s.turn && (!u.moved || ability(u, 'moving-shot'))
const value = (u: Unit) => card(u.card).cost * u.r / profile(u).regiment
export const expectedHits = (a: Unit, b: Unit) => Math.min(b.r, profile(a).dice * (7 - Math.max(2, Math.min(6, 4 - (profile(a).offense.score! - (profile(a).offense.kind === 'ranged' ? profile(b).defenseRanged : profile(b).defenseMelee))))) / 6)

/** Position estimate used only at search cutoffs / for move ordering. Terminal
 * results always dominate. No hidden cards or future game dice are consulted. */
export function positionValue(s: State, seat: Seat) {
  if (s.result) return s.result.kind === 'draw' ? 0 : s.result.seat === seat ? 1 : -1
  const board = s.units.filter(onBoard)
  const score = (p: Seat) => {
    const own = board.filter((u) => u.seat === p), enemies = board.filter((u) => u.seat !== p)
    let total = own.reduce((n, u) => n + value(u) * 0.22, 0) + Math.min(s.players[p].ps, 6) * 0.18
    for (const z of ['2-0', '2-1', '2-2']) {
      if (controls(s, p, z)) total += 2
      const strength = own.filter((u) => zoneOf(u.cell!) === z).length
      total += Math.min(strength, 3) * 0.2
    }
    const guards = own.filter((u) => zoneOf(u.cell!) === ownBase(p) && !engaged(s, u.id))
    const invaders = enemies.filter((u) => zoneOf(u.cell!) === ownBase(p) && !engaged(s, u.id))
    const threats = enemies.filter((u) => !engaged(s, u.id) && cells.some((c) => isCenterBase(c, p) && distance(c, u.cell!) <= (profile(u).unitType === 'cavalry' ? 3 : 1)))
    if (invaders.length && !guards.length) total -= 18
    else if (threats.length) total -= Math.max(0, threats.length + 1 - guards.length) * 2.5
    if (invaders.length) total -= invaders.reduce((n, u) => n + u.r, 0) * 0.35
    for (const u of own) {
      const progress = 5 - Math.floor(relativeCell(p, u.cell!) / 9)
      if (profile(u).offense.kind === 'melee') total += Math.min(progress, 3) * 0.12
    }
    return total
  }
  return Math.tanh((score(seat) - score(other(seat))) / 12) * 0.8
}

export type Decision = { kind: 'order'; seat: Seat; order: Order; buy: boolean } | { kind: 'pass'; seat: Seat }

/** Broader, bounded action proposals: complete groups AND subsets / individual
 * moves, including defensive moves omitted by the previous greedy policy.
 * A pass remains available. Partial movement preserves original sequential paths. */
export function orderChoices(s: State, seat: Seat, width = 12, rollout = false): Choice<Decision>[] {
  const p = s.players[seat], buy = p.orders === 0
  const pass: Choice<Decision> = { key: 'pass', action: { kind: 'pass', seat }, priority: -0.08, reason: 'Terminer ses ordres pour ce tour' }
  if (buy && p.ps === 0) return [pass]
  if (buy) s = buyOrder(s, seat)
  const own = s.units.filter((u) => u.seat === seat && onBoard(u)).sort((a, b) => relativeCell(seat, a.cell!) - relativeCell(seat, b.cell!) || a.id.localeCompare(b.id))
  const board = s.units.filter(onBoard), before = positionValue(s, seat)
  const orders = candidates(s, seat, 'control').map((c) => c.order)
  const engine = { units: board.map((u) => ({ id: u.id, seat: u.seat, cardStableId: u.card, cell: u.cell!, regiment: u.r })), engagements: s.engagements, log: [] }
  const movements: { id: string; to: number; gain: number }[] = []
  for (const u of rollout ? [] : own) {
    if (u.moved || (u.shot && !ability(u, 'moving-shot')) || engaged(s, u.id)) continue
    for (const m of legalMoves(engine, engine.units.find((v) => v.id === u.id)!, profile(u)).sort((a, b) => relativeCell(seat, a.cell) - relativeCell(seat, b.cell))) {
      const original = u.cell
      u.cell = m.cell
      const gain = positionValue(s, seat) - before
      u.cell = original
      movements.push({ id: u.id, to: m.cell, gain })
      orders.push({ kind: 'movement', moves: [{ id: u.id, to: m.cell }] })
    }
  }
  // A legal group can advance while leaving one or several defenders in place.
  for (const o of [...orders]) if (o.kind === 'movement' && o.moves.length > 1) {
    const kept = o.moves.filter((m) => !isCenterBase(unit(s, m.id).cell!, seat))
    if (kept.length && kept.length !== o.moves.length) orders.push({ kind: 'movement', moves: kept })
    for (const guard of o.moves.filter((m) => isCenterBase(unit(s, m.id).cell!, seat))) {
      // Retain only a prefix so no path depends on the omitted move vacating its cell.
      const prefix = o.moves.slice(0, o.moves.indexOf(guard))
      if (prefix.length) orders.push({ kind: 'movement', moves: prefix })
    }
  }
  // Build an additional defensive/positional group in each zone; avoid destination clashes.
  for (const z of new Set(own.map((u) => zoneOf(u.cell!)))) {
    const selected: { id: string; to: number }[] = [], destinations = new Set<number>()
    for (const u of own.filter((u) => zoneOf(u.cell!) === z)) {
      const m = movements.filter((v) => v.id === u.id && !destinations.has(v.to)).sort((a, b) => b.gain - a.gain)[0]
      if (m && m.gain > 0) { selected.push({ id: m.id, to: m.to }); destinations.add(m.to) }
    }
    if (selected.length > 1) orders.push({ kind: 'movement', moves: selected })
  }
  // Ordinary focus fire only when earlier shots cannot destroy the target
  // before the last declared shot. Other volleys retain distinct legal targets.
  for (const z of rollout ? [] : new Set(own.map((u) => zoneOf(u.cell!)))) for (const target of board.filter((u) => u.seat !== seat && !engaged(s, u.id))) {
    for (const kind of ['shooting', 'artillery'] as const) {
      const shooters = own.filter((u) => zoneOf(u.cell!) === z && canFire(s, u) && inRange(u, target) && (profile(u).unitType === 'artillery') === (kind === 'artillery'))
      let maxDamage = 0
      const shots: { attacker: string; target: string }[] = []
      for (const u of shooters) {
        if (maxDamage >= target.r) break
        shots.push({ attacker: u.id, target: target.id }); maxDamage += profile(u).dice
      }
      if (shots.length > 1) orders.push({ kind, shots })
    }
  }
  // Reinforcements should be able to defend a threatened centre instead of always taking the first cell.
  if (p.faction === 'gobelins') {
    const free = cells.filter((c) => isHome(c, seat) && isCenterBase(c, seat)
      && !board.some((u) => u.cell === c || (u.seat !== seat && zoneOf(u.cell!) === zoneOf(c))))
    for (const c of free.sort((a, b) => relativeCell(seat, a) - relativeCell(seat, b))) orders.push({ kind: 'goblin-reinforcements', cell: c })
  }

  const unique = new Map<string, Choice<Decision>>()
  for (const o of orders) {
    const key = JSON.stringify(o)
    if (unique.has(key)) continue
    let gain = 0
    if ('moves' in o) {
      // Subsets must remain executable without depending on a unit that no longer moves.
      try { playOrder(s, seat, o, () => 1) } catch { continue }
      const copy = { ...s, units: s.units.map((u) => ({ ...u })) }
      for (const m of o.moves) unit(copy, m.id).cell = m.to
      gain = (positionValue(copy, seat) - before) * 20
      for (const m of o.moves) {
        const u = unit(s, m.id)
        if (canFire(s, u) && !ability(u, 'moving-shot') && board.some((b) => b.seat !== seat && !engaged(s, b.id) && inRange(u, b))) gain -= 0.5
        if (zoneOf(m.to) === ownBase(other(seat))) gain += 0.6
        if (profile(u).offense.kind === 'ranged') {
          const at = { ...u, cell: m.to }
          if (board.some((b) => b.seat !== seat && inRange(at, b))) gain += 0.1
        }
      }
    } else if ('shots' in o) {
      gain = o.shots.reduce((n, sh) => n + expectedHits(unit(s, sh.attacker), unit(s, sh.target)) * card(unit(s, sh.target).card).cost / profile(unit(s, sh.target)).regiment, 0) * 0.35
      if (o.kind === 'concentrated-fire') gain += 0.3
    } else if ('placements' in o) gain = o.placements.reduce((n, pl) => n + card(unit(s, pl.id).card).cost, 0) * 0.12
    else if (o.kind === 'goblin-reinforcements') gain = 0.14 + (o.cell !== null && isCenterBase(o.cell, seat) ? 0.12 : 0)
    if (buy) gain -= 0.06
    unique.set(key, { key, action: { kind: 'order', seat, order: o, buy }, priority: Math.round(gain * 1e9) / 1e9, reason: 'Comparer les suites possibles jusqu’au contrôle de fin de tour' })
  }
  const sorted = [...unique.values()].sort((a, b) => b.priority - a.priority)
  // Keep action-family diversity even when numerous single-unit moves rank first.
  const chosen = sorted.slice(0, Math.max(1, width - 4))
  for (const kind of ['shooting', 'artillery', 'concentrated-fire', 'recruitment', 'goblin-reinforcements', 'strategic-retreat']) {
    const c = sorted.find((v) => v.action.kind === 'order' && v.action.order.kind === kind)
    if (c && !chosen.includes(c)) chosen.push(c)
  }
  chosen.push(pass)
  return chosen.sort((a, b) => b.priority - a.priority)
}

export function deploymentValue(s: State, seat: Seat) {
  const score = (p: Seat) => {
    const own = s.units.filter((u) => onBoard(u) && u.seat === p), enemies = s.units.filter((u) => onBoard(u) && u.seat !== p)
    let total = 0
    for (const axis of [0, 1, 2]) {
      const group = own.filter((u) => Number(zoneOf(u.cell!).split('-')[1]) === axis)
      const opposing = enemies.filter((u) => Number(zoneOf(u.cell!).split('-')[1]) === axis)
      const strength = group.reduce((n, u) => n + u.r + (profile(u).offense.kind === 'melee' ? profile(u).dice : profile(u).dice * 0.7), 0)
      const enemyStrength = opposing.reduce((n, u) => n + u.r + profile(u).dice, 0)
      // Centre receives a larger strategic value; a numerically inferior army
      // can concede a flank. There is no compulsory symmetric split.
      total += (axis === 1 ? 4 : 1) * Math.log1p(strength)
      if (axis === 1) total -= Math.max(0, enemyStrength * 0.65 - strength) * 0.2
      const front = group.filter((u) => isHome(u.cell!, p) && Math.floor(relativeCell(p, u.cell!) / 9) === 4)
      for (const u of group) {
        const melee = profile(u).offense.kind === 'melee'
        total += (melee ? front.includes(u) : !front.includes(u)) ? 0.3 : -0.2
        if (!melee && !front.some((v) => profile(v).offense.kind === 'melee')) total -= 0.5
        if (!melee) total += Math.min(2, group.filter((v) => v.id !== u.id && profile(v).offense.kind === 'ranged' && zoneOf(v.cell!) === zoneOf(u.cell!)).length) * 0.18
        if (ability(u, 'spear-wall')) total += opposing.filter((v) => profile(v).unitType === 'cavalry').length * 0.35
        total += opposing.reduce((n, v) => n + (Math.abs(u.cell! % 9 - v.cell! % 9) <= 1 ? 0.025 : 0), 0)
      }
    }
    return total
  }
  return Math.tanh((score(seat) - score(other(seat))) / 10) * 0.8
}

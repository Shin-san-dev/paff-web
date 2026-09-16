import { adjacent, legalMoves } from '../../shared/battleEngine'
import { cells, colOf, isHome, rowOf, zoneOf } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { ability, card, controls, deployed, engaged, onBoard, opponents, profile, unit } from './state'
import type { State, Unit } from './state'
import { diceCount, outnumbering } from './combat'
import type { Attack, Charge } from './combat'
import { inRange } from './orders'
import type { Order, Shot } from './orders'
import { relativeCell } from './decks'

export const botVersion = 'heuristiques-1'
export const policies = {
  control: { name: 'Contrôle', objective: 2.8, offense: 1, safety: 0.65, recruit: 0.8 },
  aggressive: { name: 'Agression', objective: 1.2, offense: 2.4, safety: 0.3, recruit: 0.5 },
  preservation: { name: 'Préservation', objective: 1.6, offense: 0.9, safety: 1.8, recruit: 1.1 },
} as const
export type Policy = keyof typeof policies
export type Candidate = { order: Order; score: number; reason: string }
export const distance = (a: number, b: number) => Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b))
const probability = (attack: number, defense: number) => (7 - Math.max(2, Math.min(6, 4 - (attack - defense)))) / 6
const value = (u: Unit) => card(u.card).cost / profile(u).regiment
function targetValue(s: State, a: Unit, b: Unit, charge = false) {
  const p = profile(a)
  const bonus = charge && !ability(b, 'spear-wall') && p.unitType === 'cavalry' ? ability(a, 'powerful-charge') && a.moved ? 3 : 1 : 0
  const expected = diceCount(s, a, b, bonus) * probability(p.offense.score ?? 0, p.offense.kind === 'ranged' ? profile(b).defenseRanged : profile(b).defenseMelee)
  return Math.min(b.r, expected) * value(b)
}
const sortUnits = (list: Unit[], seat: Seat) => [...list].sort((a, b) => relativeCell(seat, a.cell ?? 53) - relativeCell(seat, b.cell ?? 53) || a.card.localeCompare(b.card) || a.id.localeCompare(b.id))

/** Remove hidden opponent reserves before policy evaluation, including their identities. */
export function observation(s: State, seat: Seat): State {
  const copy = structuredClone(s)
  copy.units = copy.units.filter((u) => u.seat === seat || u.cell !== null || u.r === 0)
  return copy
}
function positionScore(s: State, u: Unit, cell: number, policy: Policy) {
  const weights = policies[policy], original = u.cell
  u.cell = cell
  const friends = s.units.filter((v) => onBoard(v) && v.seat === u.seat && v.id !== u.id)
  const enemies = s.units.filter((v) => onBoard(v) && v.seat !== u.seat)
  const targets = cells.filter((c) => zoneOf(c).startsWith('2-') && !controls(s, u.seat, zoneOf(c)))
  // If all strategic zones are held, keep the closest one, rather than drifting backwards.
  const objectives = targets.length ? targets : cells.filter((c) => zoneOf(c).startsWith('2-'))
  const nearest = Math.min(...objectives.map((c) => distance(cell, c)))
  const local = zoneOf(cell)
  const occupiedByFriends = friends.some((v) => zoneOf(v.cell!) === local && !engaged(s, v.id))
  let score = weights.objective * (-nearest + (local.startsWith('2-') && !occupiedByFriends ? 3 : 0))
  const ownBase = u.seat === 0 ? '3-1' : '1-1', enemyBase = u.seat === 0 ? '1-1' : '3-1'
  if (local === enemyBase) score += 8 * weights.objective
  if (local === ownBase && enemies.some((v) => zoneOf(v.cell!) === ownBase)) score += 12 * weights.objective
  for (const b of enemies) {
    if (profile(u).offense.kind === 'ranged' && inRange(u, b) && !engaged(s, b.id)) score += weights.offense * targetValue(s, u, b)
    if (adjacent(cell, b.cell!)) {
      score += weights.offense * (profile(u).offense.kind === 'melee' ? targetValue(s, u, b, true) : 0)
      score -= weights.safety * (profile(b).offense.kind === 'melee' ? targetValue(s, b, u) : 0)
    }
  }
  // Friendly congestion is a cost but does not outweigh leaving a base invaded.
  score -= friends.filter((v) => adjacent(cell, v.cell!)).length * 0.08
  u.cell = original
  return score
}
function shotFor(s: State, a: Unit, policy: Policy, excluded: Set<string>) {
  if (a.shot || a.recruited === s.turn || (a.moved && !ability(a, 'moving-shot')) || profile(a).offense.kind !== 'ranged') return null
  const choices = sortUnits(s.units.filter((b) => onBoard(b) && b.seat !== a.seat && inRange(a, b) && !excluded.has(b.id)), a.seat)
    .flatMap((b) => {
      let friendlyTarget: string | undefined
      if (engaged(s, b.id)) {
        if (!ability(a, 'melee-shooting')) return []
        friendlyTarget = opponents(s, b.id).sort((x, y) => value(unit(s, x)) - value(unit(s, y)))[0]
        if (!friendlyTarget) return []
      }
      const risk = friendlyTarget ? targetValue(s, a, unit(s, friendlyTarget)) * policies[policy].safety / 2 : 0
      const score = targetValue(s, a, b) * (friendlyTarget ? 0.5 : 1) * policies[policy].offense - risk
      return [{ shot: { attacker: a.id, target: b.id, ...(friendlyTarget ? { friendlyTarget } : {}) }, score }]
    }).sort((a, b) => b.score - a.score)
  return choices[0] ?? null
}

/** A bounded set of legal choices, not exhaustive search; scores are inspectable. */
export function candidates(state: State, seat: Seat, policy: Policy): Candidate[] {
  const s = observation(state, seat), result: Candidate[] = [], p = s.players[seat]
  const own = sortUnits(s.units.filter((u) => onBoard(u) && u.seat === seat), seat)
  const add = (order: Order, score: number, reason: string) => { if (score > 0.01) result.push({ order, score, reason }) }
  const zones = [...new Set(own.map((u) => zoneOf(u.cell!)))]
  for (const zone of zones) {
    const group = own.filter((u) => zoneOf(u.cell!) === zone)
    const moving = structuredClone(s), moves: Extract<Order, { kind: 'movement' | 'strategic-retreat' }>['moves'] = []
    let moveGain = 0
    for (const source of group) {
      const u = deployed(moving, source.id)
      if (u.moved || (u.shot && !ability(u, 'moving-shot')) || engaged(s, u.id)) continue
      const engine = { units: moving.units.filter(onBoard).map((v) => ({ id: v.id, seat: v.seat, cardStableId: v.card, cell: v.cell!, regiment: v.r })), engagements: moving.engagements, log: [] }
      const from = positionScore(moving, u, u.cell, policy)
      const options = legalMoves(engine, engine.units.find((v) => v.id === u.id)!, profile(u))
        .map((m) => ({ cell: m.cell, gain: positionScore(moving, u, m.cell, policy) - from }))
        .sort((a, b) => b.gain - a.gain || relativeCell(seat, a.cell) - relativeCell(seat, b.cell))
      if (options[0]?.gain > 0.05) { moves.push({ id: u.id, to: options[0].cell }); moveGain += options[0].gain; u.cell = options[0].cell }
    }
    if (moves.length) add({ kind: 'movement', moves }, moveGain, 'Avancer vers une zone utile ou améliorer une position de tir')
    for (const kind of ['shooting', 'artillery'] as const) {
      const shots: Shot[] = [], targets = new Set<string>(); let score = 0
      for (const u of group.filter((u) => (profile(u).unitType === 'artillery') === (kind === 'artillery'))) {
        const choice = shotFor(s, u, policy, targets)
        if (choice && choice.score > 0) { shots.push(choice.shot); score += choice.score; targets.add(choice.shot.target) }
      }
      if (shots.length) add({ kind, shots }, score, 'Tirer sur les cibles accessibles ; éviter une cible déjà assignée à un autre tireur')
    }
    if (p.faction === 'sephosi' && (p.used['concentrated-fire'] ?? 0) < 4) {
      for (const target of sortUnits(s.units.filter((u) => onBoard(u) && u.seat !== seat && !engaged(s, u.id)), seat)) {
        const shooters = group.filter((u) => !u.shot && u.recruited !== s.turn && (!u.moved || ability(u, 'moving-shot')) && profile(u).offense.kind === 'ranged' && inRange(u, target))
        if (shooters.length >= 2) add({ kind: 'concentrated-fire', shots: shooters.map((u) => ({ attacker: u.id, target: target.id })) },
          Math.min(target.r * value(target), shooters.reduce((n, u) => n + targetValue(s, u, target) * (profile(u).dice + 1) / Math.max(1, profile(u).dice), 0)) * policies[policy].offense + 0.1,
          'Concentrer les tirs de la zone avec le bonus de dés')
      }
    }
  }
  if (s.turn >= 2 && (p.used.recruitment ?? 0) < 3) {
    const reserve = s.units.filter((u) => u.seat === seat && u.cell === null && u.r > 0)
      .sort((a, b) => (profile(a).offense.kind === 'melee' ? 0 : 1) - (profile(b).offense.kind === 'melee' ? 0 : 1) || card(b.card).cost - card(a.card).cost || a.id.localeCompare(b.id))
    for (const zone of [...new Set(cells.filter((c) => isHome(c, seat)).sort((a, b) => relativeCell(seat, a) - relativeCell(seat, b)).map(zoneOf))]) {
      const free = cells.filter((c) => zoneOf(c) === zone && !s.units.some((u) => onBoard(u) && (u.cell === c || (u.seat !== seat && zoneOf(u.cell!) === zone))))
        .sort((a, b) => relativeCell(seat, a) - relativeCell(seat, b))
      let spent = 0
      const placements: { id: string; cell: number }[] = []
      for (const u of reserve) if (placements.length < free.length && spent + card(u.card).cost <= p.recruitment + p.ps) {
        placements.push({ id: u.id, cell: free[placements.length] }); spent += card(u.card).cost
      }
      if (placements.length) add({ kind: 'recruitment', placements, ps: Math.max(0, spent - p.recruitment) }, spent * policies[policy].recruit * (s.turn >= 7 ? 0.3 : 1), 'Faire entrer la réserve avec les points disponibles')
    }
  }
  if (p.faction === 'gobelins') {
    const free = cells.filter((c) => isHome(c, seat) && !s.units.some((u) => onBoard(u) && (u.cell === c || (u.seat !== seat && zoneOf(u.cell!) === zoneOf(c)))))
      .sort((a, b) => relativeCell(seat, a) - relativeCell(seat, b))
    if (free.length) add({ kind: 'goblin-reinforcements', cell: free[0] }, 0.65 * policies[policy].recruit, 'Créer une Bande gratuite dans une case disponible')
  }
  // Repli is evaluated separately: never silently allow an ordinary engaged move.
  if (p.faction === 'sephosi') for (const u of own.filter((u) => !u.moved && engaged(s, u.id) && (!u.shot || ability(u, 'moving-shot')))) {
    const engine = { units: s.units.filter(onBoard).map((v) => ({ id: v.id, seat: v.seat, cardStableId: v.card, cell: v.cell!, regiment: v.r })), engagements: s.engagements, log: [] }
    for (const m of legalMoves(engine, engine.units.find((v) => v.id === u.id)!, profile(u)).sort((a, b) => relativeCell(seat, a.cell) - relativeCell(seat, b.cell))) {
      const danger = opponents(s, u.id).reduce((n, id) => n + targetValue(s, unit(s, id), u), 0)
      const gain = positionScore(s, u, m.cell, policy) - positionScore(s, u, u.cell!, policy) + danger * policies[policy].safety
      add({ kind: 'strategic-retreat', moves: [{ id: u.id, to: m.cell }] }, gain, 'Préserver une unité engagée sans subir de riposte gratuite')
    }
  }
  return result.sort((a, b) => b.score - a.score)
}

export function combatPlan(s: State, policy: [Policy, Policy]) {
  const next = structuredClone(s), passed = new Set<Seat>(), charged = new Set<string>(), charges: Charge[] = []
  let seat: Seat = s.initiative
  while (passed.size < 2) {
    const options = sortUnits(next.units.filter((u) => onBoard(u) && u.seat === seat && !engaged(next, u.id) && profile(u).offense.kind === 'melee'), seat)
      .flatMap((a) => sortUnits(next.units.filter((b) => onBoard(b) && b.seat !== seat && adjacent(a.cell!, b.cell!)), seat).map((b) => ({
        attack: { attacker: a.id, target: b.id, rerolls: 'misses' as const },
        score: targetValue(next, a, b, true) * policies[policy[seat]].offense - (profile(b).offense.kind === 'melee' && !charged.has(b.id) ? targetValue(next, b, a) * policies[policy[seat]].safety : 0),
      }))).sort((a, b) => b.score - a.score)
    const selected = options[0]?.score > 0 ? options[0].attack : undefined
    charges.push({ seat, ...(selected ? { attack: selected } : {}) })
    if (selected) { charged.add(selected.attacker); next.engagements.push({ a: selected.attacker, b: selected.target }) }
    else passed.add(seat)
    const other = seat === 0 ? 1 : 0
    if (!passed.has(other)) seat = other
  }
  const attacks: Attack[] = []
  for (const seat of [s.initiative, s.initiative === 0 ? 1 : 0] as Seat[]) {
    for (const a of sortUnits(next.units.filter((u) => onBoard(u) && u.seat === seat && engaged(next, u.id) && !charged.has(u.id) && profile(u).offense.kind === 'melee'), seat)) {
      const target = sortUnits(opponents(next, a.id).map((id) => deployed(next, id)), seat).sort((b, c) => targetValue(next, a, c) - targetValue(next, a, b))[0]
      attacks.push({ attacker: a.id, target: target.id, ...(outnumbering(next, a.id) ? { rerolls: 'misses' as const } : {}) })
    }
  }
  return { charges, attacks }
}

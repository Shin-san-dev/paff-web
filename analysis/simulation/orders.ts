import { adjacent, legalMoves } from '../../shared/battleEngine'
import { cells, colOf, isCell, isHome, rowOf, zoneOf } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { orderDefinitions } from '../../shared/orders'
import { diceCount, hits, melee } from './combat'
import type { Attack } from './combat'
import { ability, addLoss, axis, card, change, d6, damage, deployed, engaged, grantVallardi, makeUnit, onBoard, opponents, profile, requireRule, unit, victory } from './state'
import type { Dice, State, Unit } from './state'

export type Shot = { attacker: string; target: string; friendlyTarget?: string }
type Placement = { id: string; cell: number }
export type Order =
  | { kind: 'movement' | 'strategic-retreat'; moves: { id: string; to: number; freeAttacks?: Attack[] }[] }
  | { kind: 'shooting' | 'artillery' | 'concentrated-fire'; shots: Shot[] }
  | { kind: 'recruitment' | 'divine-fury'; placements: Placement[]; ps?: number; blop?: { count: number; cells: number[] } }
  | { kind: 'goblin-reinforcements'; cell: number | null }
  | { kind: 'shamanic-invocation'; shot: Shot; sacrifices: string[] }
  | { kind: 'lunch-break'; pairs: { troll: string; sacrifice: string }[] }
  | { kind: 'protect-salamander'; salamander: string }
  | { kind: 'great-invocation'; shaman: string }
  | { kind: 'green-line'; caster: string; sacrifice: string }

function spend(s: State, seat: Seat, kind: Order['kind']) {
  requireRule(s.phase === 'orders', 'Les ordres sont terminés')
  const p = s.players[seat], id = kind === 'green-line' ? 'shooting' : kind
  const definition = orderDefinitions.find((order) => order.id === id)
  requireRule(definition && (definition.faction === 'common' || definition.faction === p.faction), 'Ordre indisponible pour cette faction')
  const used = p.used[id] ?? 0
  requireRule(definition.limit === undefined || used < definition.limit, 'Stock d’ordre épuisé')
  requireRule(p.orders > 0, 'Plus d’ordres disponibles')
  p.orders--; p.used[id] = used + 1
}
export function buyOrder(s: State, seat: Seat) {
  return change(s, (next) => {
    requireRule(next.phase === 'orders' && next.players[seat].ps > 0, 'PS ou phase insuffisants')
    next.players[seat].ps--; next.players[seat].orders++
  })
}
/** First zone is the original activation; each other axis must contain a living support. */
export function validateOrderZones(s: State, seat: Seat, zones: string[]) {
  const unique = [...new Set(zones)]
  requireRule(unique.length > 0 && unique.every((z) => cells.some((c) => zoneOf(c) === z)), 'Zone invalide')
  const axes = unique.map((z) => Number(z.split('-')[1]))
  requireRule(unique.length <= 3 && new Set(axes).size === unique.length, 'Une seule zone par axe, trois axes maximum')
  for (const a of axes.slice(1)) requireRule(s.units.some((u) => onBoard(u) && u.seat === seat && axis(u.cell!) === a && ability(u, 'strategic-support')), 'Porte-ordres absent de l’axe supplémentaire')
}
function owned(s: State, id: string, seat: Seat) {
  const u = deployed(s, id)
  requireRule(u.seat === seat, 'Unité adverse')
  return u
}
function uniqueIds(ids: string[]) {
  requireRule(ids.length > 0 && new Set(ids).size === ids.length, 'Sélection vide ou activation multiple d’une unité')
}
function canShoot(u: Unit, turn: number) {
  requireRule(profile(u).offense.kind === 'ranged' && !u.shot && u.recruited !== turn && (!u.moved || ability(u, 'moving-shot')), 'Tir interdit à cette unité ce tour-ci')
}
export function inRange(a: Unit, b: Unit) {
  if (a.cell === null || b.cell === null) return false
  const range = profile(a).unitType === 'artillery' ? 4 : 3
  return axis(a.cell) === axis(b.cell) && Math.abs(rowOf(a.cell) - rowOf(b.cell)) + Math.abs(colOf(a.cell) - colOf(b.cell)) <= range
}
function shoot(s: State, shot: Shot, dice: Dice, bonus = 0, repeated = false, fixedCount?: number, pending?: Map<string, number>) {
  const a = deployed(s, shot.attacker), b = deployed(s, shot.target), p = profile(a)
  if (!repeated) canShoot(a, s.turn)
  requireRule(a.seat !== b.seat && inRange(a, b), 'Cible hors de portée ou alliée')
  const count = fixedCount ?? diceCount(s, a, b, bonus)
  let targets = Array<string>(count).fill(b.id)
  if (engaged(s, b.id)) {
    requireRule(ability(a, 'melee-shooting') && shot.friendlyTarget && opponents(s, b.id).includes(shot.friendlyTarget), 'Tir sur une mêlée interdit ou allié manquant')
    owned(s, shot.friendlyTarget, a.seat)
    targets = targets.map(() => d6(dice) <= 3 ? shot.friendlyTarget! : b.id)
  }
  const losses = pending ?? new Map<string, number>(), rainTargets = new Set<string>()
  // Redirect before touch rolls, using each actual target's DT.
  for (const id of targets) {
    const target = deployed(s, id)
    const n = hits(dice, 1, p.offense.score!, profile(target).defenseRanged).hits
    if (ability(a, 'goblin-rain')) { if (n) rainTargets.add(id) }
    else addLoss(losses, id, n)
  }
  a.shot = true
  for (const id of rainTargets) unit(s, id).rain += 2
  if (!pending) damage(s, losses)
}
function move(s: State, seat: Seat, order: Extract<Order, { moves: unknown }>, dice: Dice) {
  uniqueIds(order.moves.map((m) => m.id))
  if (order.kind === 'strategic-retreat') requireRule(order.moves.length === 1, 'Repli concerne une unité')
  validateOrderZones(s, seat, order.moves.map((m) => zoneOf(owned(s, m.id, seat).cell)))
  for (const m of order.moves) {
    const a = owned(s, m.id, seat)
    requireRule(!a.moved && (!a.shot || ability(a, 'moving-shot')), 'Mouvement déjà utilisé ou tir incompatible')
    const engine = { units: s.units.filter(onBoard).map((u) => ({ id: u.id, seat: u.seat, cell: u.cell!, cardStableId: u.card, regiment: u.r })), engagements: s.engagements, log: [] }
    const mover = engine.units.find((u) => u.id === a.id)!
    requireRule(legalMoves(engine, mover, profile(a)).some((mvt) => mvt.cell === m.to), 'Destination inaccessible')
    if (order.kind === 'strategic-retreat') {
      requireRule(engaged(s, a.id) && !m.freeAttacks?.length, 'Repli exige un engagement et évite les attaques gratuites')
    } else {
      const enemies = opponents(s, a.id).filter((id) => profile(deployed(s, id)).offense.kind === 'melee')
      const attacks = m.freeAttacks ?? []
      requireRule(attacks.length === enemies.length && new Set(attacks.map((x) => x.attacker)).size === enemies.length
        && attacks.every((x) => enemies.includes(x.attacker) && x.target === a.id), 'Déclarer toutes les attaques de désengagement')
      const losses = new Map<string, number>()
      for (const attack of attacks) addLoss(losses, a.id, melee(s, attack, dice, 0, 2))
      damage(s, losses)
    }
    s.engagements = s.engagements.filter((e) => e.a !== a.id && e.b !== a.id)
    if (a.r > 0) { a.cell = m.to; a.moved = true }
    if (victory(s)) break
  }
}
function legalRecruitCell(s: State, seat: Seat, cell: number) {
  return isCell(cell) && isHome(cell, seat) && !s.units.some((u) => onBoard(u) && (u.cell === cell || (u.seat !== seat && zoneOf(u.cell!) === zoneOf(cell))))
}
function createReinforcements(s: State, seat: Seat, stableId: string, count: number, chosen: number[]) {
  requireRule(chosen.length <= count && new Set(chosen).size === chosen.length, 'Trop de renforts ou case dupliquée')
  const available = cells.filter((c) => legalRecruitCell(s, seat, c))
  requireRule(chosen.length === Math.min(count, available.length) && chosen.every((c) => available.includes(c)), 'Placer les renforts possibles ; seules les unités sans case sont perdues')
  for (const cell of chosen) {
    let i = s.units.length
    while (s.units.some((u) => u.id === `created-${i}`)) i++
    const u = makeUnit(`created-${i}`, stableId, seat, cell)
    u.recruited = s.turn
    s.units.push(u)
  }
}
function recruit(s: State, seat: Seat, order: Extract<Order, { placements: unknown }>) {
  uniqueIds(order.placements.map((p) => p.id))
  const divine = order.kind === 'divine-fury'
  if (!divine) requireRule(s.turn >= 2, 'Recrutement commun indisponible au tour 1')
  validateOrderZones(s, seat, order.placements.map((p) => zoneOf(p.cell)))
  const cost = order.placements.reduce((sum, p) => sum + card(unit(s, p.id).card).cost, 0)
  const ps = order.ps ?? 0, player = s.players[seat]
  requireRule(Number.isInteger(ps) && ps >= 0 && ps <= cost && ps <= player.ps && cost - ps <= player.recruitment, 'Financement insuffisant ou invalide')
  player.ps -= ps; player.recruitment -= cost - ps
  for (const placement of order.placements) {
    const u = unit(s, placement.id)
    requireRule(u.seat === seat && u.cell === null && u.r > 0 && u.recruited === null, 'Unité absente de la réserve')
    requireRule(isCell(placement.cell) && !s.units.some((x) => onBoard(x) && x.cell === placement.cell), 'Case occupée ou invalide')
    requireRule(divine ? ability(u, 'flight') : legalRecruitCell(s, seat, placement.cell), 'Placement de recrutement interdit')
    u.cell = placement.cell; u.recruited = s.turn
    if (ability(u, 'strategist')) grantVallardi(s, seat)
    if (ability(u, 'packmaster')) {
      requireRule(order.blop && Number.isInteger(order.blop.count) && order.blop.count >= 1 && order.blop.count <= 3, 'Fournir le résultat du D3 de Blop')
      createReinforcements(s, seat, 'gobelins-chevaucheurs-de-skrans-gobelins', order.blop.count, order.blop.cells)
    }
  }
}
function invocation(s: State, seat: Seat, order: Extract<Order, { kind: 'shamanic-invocation' }>, dice: Dice) {
  const caster = owned(s, order.shot.attacker, seat)
  requireRule(caster.card === 'gobelins-shaman-gobelin', 'Un Shaman doit lancer Invokation')
  const shamans = s.units.filter((u) => onBoard(u) && u.seat === seat && u.id !== caster.id && u.card === caster.card)
  const bonus = shamans.filter((u) => inRange(caster, u)).length
  const count = diceCount(s, caster, deployed(s, order.shot.target), bonus)
  shoot(s, order.shot, dice, bonus)
  const consequence = d6(dice), needed = consequence === 1 ? 2 : consequence <= 3 ? 1 : 0
  requireRule(new Set(order.sacrifices).size === order.sacrifices.length && order.sacrifices.length === Math.min(needed, shamans.length)
    && order.sacrifices.every((id) => shamans.some((u) => u.id === id)), 'Sacrifices d’Invokation invalides')
  damage(s, new Map(order.sacrifices.map((id) => [id, unit(s, id).r])))
  if (consequence === 6 && onBoard(unit(s, order.shot.target))) shoot(s, order.shot, dice, bonus, true, count)
}
function sacrifice(s: State, seat: Seat, receiver: string, victim: string, sameZone: boolean) {
  const a = owned(s, receiver, seat), b = owned(s, victim, seat)
  requireRule(a.id !== b.id && card(b.card).faction === 'gobelins' && !ability(b, 'trollitude')
    && adjacent(a.cell, b.cell) && (!sameZone || zoneOf(a.cell) === zoneOf(b.cell)), 'Sacrifice interdit')
  return b
}
function greenLine(s: State, seat: Seat, order: Extract<Order, { kind: 'green-line' }>, dice: Dice) {
  const caster = owned(s, order.caster, seat)
  requireRule(ability(caster, 'green-line'), 'Ligne Verte réservée au Danzereu')
  canShoot(caster, s.turn)
  const victim = sacrifice(s, seat, caster.id, order.sacrifice, true)
  damage(s, new Map([[victim.id, victim.r]]))
  caster.shot = true
  const step = seat === 0 ? -9 : 9
  for (let cell = caster.cell + step, bonus = 0; isCell(cell); cell += step, bonus++) {
    const target = s.units.find((u) => onBoard(u) && u.cell === cell)
    if (!target) break
    const result = hits(dice, diceCount(s, caster, target, bonus), profile(caster).offense.score! + bonus, profile(target).defenseRanged)
    const losses = new Map([[target.id, result.hits]])
    if (result.faces.includes(6)) for (const u of s.units.filter(onBoard)) {
      if (adjacent(cell, u.cell!) && zoneOf(cell) === zoneOf(u.cell!)) addLoss(losses, u.id, 1)
    }
    damage(s, losses)
    if (!result.hits || !onBoard(caster) || victory(s)) break
  }
}

/** Apply one chosen order. Turn alternation / hidden choices belong to the future orchestrator. */
export function playOrder(s: State, seat: Seat, order: Order, dice: Dice = () => { throw new Error('Dés manquants') }) {
  return change(s, (next) => {
    requireRule(!victory(next), 'La partie est déjà terminée par élimination')
    spend(next, seat, order.kind)
    switch (order.kind) {
      case 'movement': case 'strategic-retreat': move(next, seat, order, dice); break
      case 'recruitment': case 'divine-fury': recruit(next, seat, order); break
      case 'shooting': case 'artillery': case 'concentrated-fire': {
        uniqueIds(order.shots.map((shot) => shot.attacker))
        validateOrderZones(next, seat, order.shots.map((shot) => zoneOf(owned(next, shot.attacker, seat).cell)))
        const volley = order.kind === 'concentrated-fire' ? new Map<string, number>() : undefined
        for (const shot of order.shots) {
          const a = owned(next, shot.attacker, seat)
          if (order.kind !== 'concentrated-fire') requireRule((profile(a).unitType === 'artillery') === (order.kind === 'artillery'), 'Ordre Tir / Artillerie incompatible')
          else {
            const group = order.shots.filter((x) => zoneOf(deployed(next, x.attacker).cell) === zoneOf(a.cell))
            requireRule(group.length >= 2 && group.every((x) => x.target === shot.target), 'Tir concentré : plusieurs tireurs d’une même zone sur la même cible')
          }
          shoot(next, shot, dice, order.kind === 'concentrated-fire' ? 1 : 0, false, undefined, volley)
          if (victory(next)) break
        }
        if (volley) damage(next, volley)
        break
      }
      case 'goblin-reinforcements': createReinforcements(next, seat, 'gobelins-troupe-de-gobelins', 1, order.cell === null ? [] : [order.cell]); break
      case 'shamanic-invocation': invocation(next, seat, order, dice); break
      case 'lunch-break': {
        uniqueIds(order.pairs.map((p) => p.troll)); uniqueIds(order.pairs.map((p) => p.sacrifice))
        const victims = order.pairs.map((p) => {
          requireRule(ability(owned(next, p.troll, seat), 'trollitude'), 'Pause-déjeuner exige un Troll')
          return sacrifice(next, seat, p.troll, p.sacrifice, false)
        })
        for (const p of order.pairs) unit(next, p.troll).r++
        damage(next, new Map(victims.map((u) => [u.id, u.r])))
        break
      }
      case 'protect-salamander': {
        const salamander = owned(next, order.salamander, seat)
        requireRule(salamander.card === 'sephosi-regiment-de-la-salamandre' && engaged(next, salamander.id), 'Salamandre engagée requise')
        next.salamander.push({ seat, zone: zoneOf(salamander.cell), source: salamander.id })
        break
      }
      case 'great-invocation': {
        const shaman = owned(next, order.shaman, seat)
        requireRule(shaman.card === 'gobelins-shaman-gobelin', 'Shaman requis dans l’axe')
        const face = d6(dice)
        const affected = next.units.filter((u) => onBoard(u) && u.seat === seat && !ability(u, 'trollitude')
          && (face === 1 || face === 6 || axis(u.cell!) === axis(shaman.cell)))
        if (face <= 3) damage(next, new Map(affected.map((u) => [u.id, 1])))
        else for (const u of affected) u.doubled = true
        break
      }
      case 'green-line': greenLine(next, seat, order, dice); break
    }
    next.result = victory(next)
  })
}

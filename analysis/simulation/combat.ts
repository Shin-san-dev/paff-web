import { adjacent } from '../../shared/battleEngine'
import { zoneOf } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { ability, addLoss, change, d6, damage, deployed, engaged, onBoard, opponents, profile, requireRule, victory } from './state'
import type { Dice, State, Unit } from './state'

export type Reroll = { index: number }
export type Attack = { attacker: string; target: string; rerolls?: Reroll[] | 'misses' }
export type Charge = { seat: Seat; attack?: Attack }

export function outnumbering(s: State, id: string) {
  if (!engaged(s, id)) return 0
  const seen = new Set([id]), pending = [id]
  while (pending.length) for (const other of opponents(s, pending.pop()!)) {
    if (!seen.has(other)) { seen.add(other); pending.push(other) }
  }
  const seat = deployed(s, id).seat
  return Math.max(0, [...seen].reduce((n, other) => n + (deployed(s, other).seat === seat ? 1 : -1), 0))
}
export function diceCount(s: State, u: Unit, target: Unit, extra = 0) {
  const support = s.salamander.some((b) => b.seat === u.seat && b.source !== u.id && b.zone === zoneOf(target.cell!)) ? 2 : 0
  return Math.max(0, (profile(u).dice + extra + support) * (u.doubled ? 2 : 1) - u.rain)
}
export function hits(dice: Dice, count: number, attack: number, defense: number, rerolls: Reroll[] | 'misses' = [], allowance = 0, modifier = 0) {
  requireRule(Number.isInteger(count) && count >= 0 && count <= 200, 'Nombre de dés invalide')
  const threshold = Math.max(2, Math.min(6, 4 - (attack - defense)))
  const faces = Array.from({ length: count }, () => d6(dice))
  if (rerolls === 'misses') rerolls = faces.flatMap((face, index) => face + modifier < threshold ? [{ index }] : []).slice(0, allowance)
  requireRule(rerolls.length <= allowance && new Set(rerolls.map((r) => r.index)).size === rerolls.length, 'Relances non autorisées')
  requireRule(rerolls.every((r) => Number.isInteger(r.index) && r.index >= 0 && r.index < count), 'Indice de relance invalide')
  for (const r of rerolls) faces[r.index] = d6(dice)
  return { hits: faces.filter((face) => face + modifier >= threshold).length, faces }
}
export function melee(s: State, attack: Attack, dice: Dice, extra = 0, modifier = 0, allowOutnumbering = true) {
  const a = deployed(s, attack.attacker), b = deployed(s, attack.target), p = profile(a)
  requireRule(p.offense.kind === 'melee' && p.offense.score !== null, 'Cette unité ne combat pas')
  return hits(dice, diceCount(s, a, b, extra), p.offense.score, profile(b).defenseMelee,
    attack.rerolls, allowOutnumbering ? outnumbering(s, a.id) : 0, modifier).hits
}

/** Whole combat phase: explicit charge choices and targets, no decision-making bot. */
export function resolveCombat(s: State, plan: {
  trollTargets?: Record<string, string>
  charges: Charge[]
  attacks: Attack[]
}, dice: Dice) {
  return change(s, (next) => {
    requireRule(next.phase === 'orders', 'Phase de combat déjà traitée')
    next.result = victory(next)
    if (next.result) return
    next.phase = 'combat'
    const trolls = new Map<string, number>(), used = new Set<string>(), losses = new Map<string, number>()
    // All Trollitude rolls precede attacks, in snapshot unit order (recorded by the scenario).
    for (const u of next.units.filter(onBoard)) if (ability(u, 'trollitude')) trolls.set(u.id, d6(dice))
    for (const [id, face] of trolls) {
      if (face >= 4) continue
      used.add(id)
      if (face !== 1) continue
      const a = deployed(next, id)
      const candidates = next.units.filter((u) => onBoard(u) && u.seat === a.seat && u.id !== id && adjacent(a.cell, u.cell!))
      if (!candidates.length) continue
      const target = plan.trollTargets?.[id]
      requireRule(target && candidates.some((u) => u.id === target), 'Choisir une cible alliée pour Trollitude')
      addLoss(losses, target, melee(next, { attacker: id, target }, dice, 0, 0, false))
    }
    let actor: Seat = next.initiative
    const passed = new Set<Seat>()
    for (const choice of plan.charges) {
      requireRule(choice.seat === actor && !passed.has(actor), 'Alternance ou passage définitif des charges non respecté')
      if (!choice.attack) passed.add(actor)
      else {
        const attack = choice.attack, a = deployed(next, attack.attacker), b = deployed(next, attack.target)
        requireRule(a.seat === actor && b.seat !== actor && !engaged(next, a.id) && !used.has(a.id) && adjacent(a.cell, b.cell), 'Charge illégale')
        requireRule(profile(a).offense.kind === 'melee', 'Seules les unités C chargent')
        next.engagements.push({ a: a.id, b: b.id })
        const cavalry = profile(a).unitType === 'cavalry'
        const bonus = ability(b, 'spear-wall') ? 0 : cavalry ? ability(a, 'powerful-charge') && a.moved ? 3 : 1 : 0
        addLoss(losses, b.id, melee(next, attack, dice, bonus + (trolls.get(a.id) === 6 ? 1 : 0)))
        used.add(a.id)
      }
      const other = actor === 0 ? 1 : 0
      if (!passed.has(other)) actor = other
    }
    requireRule(passed.size === 2, 'Les deux joueurs doivent terminer leurs charges')
    for (const attack of plan.attacks) {
      const a = deployed(next, attack.attacker)
      requireRule(!used.has(a.id) && opponents(next, a.id).includes(attack.target), 'Une attaque par unité, contre un ennemi engagé')
      addLoss(losses, attack.target, melee(next, attack, dice, trolls.get(a.id) === 6 ? 1 : 0))
      used.add(a.id)
    }
    requireRule(next.units.filter(onBoard).every((u) => profile(u).offense.kind !== 'melee' || !engaged(next, u.id) || used.has(u.id)), 'Une cible doit être choisie pour chaque combattant engagé')
    damage(next, losses)
    next.phase = 'end'
    next.result = victory(next)
  })
}

import { createHash } from 'node:crypto'
import type { Seat } from '../../shared/board'
import { botVersion, candidates, combatPlan } from './bots'
import type { Policy } from './bots'
import { prepareGame } from './decks'
import type { Deck } from './decks'
import { buyOrder, playOrder } from './orders'
import type { Order } from './orders'
import { resolveCombat } from './combat'
import { finishTurn, requireRule, rulesVersion, scriptedDice, victory } from './state'
import type { State } from './state'

export const engineVersion = 'calibration-1'
export const stateHash = (s: State) => createHash('sha256').update(JSON.stringify(s)).digest('hex')
type Action = { kind: 'order'; seat: Seat; order: Order; buy: boolean }
  | { kind: 'combat'; plan: Parameters<typeof resolveCombat>[1] }
  | { kind: 'end' } | { kind: 'pass'; seat: Seat }
export type Event = { turn: number; action: Action; dice: number[]; reason: string; hash: string }
export type Run = {
  id: string; engineVersion: string; rulesVersion: string; botVersion: string; seed: number
  decks: [Deck, Deck]; policies: [Policy, Policy]; initiative: Seat; initial: State; events: Event[]; final: State
}

/** Mulberry32: fixed uint32 seed, stream used only for dice, never policy evaluation. */
export function seededDice(seed: number) {
  requireRule(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'Graine uint32 requise')
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return Math.floor(((t ^ (t >>> 14)) >>> 0) / 4294967296 * 6) + 1
  }
}
export function applyAction(s: State, action: Action, dice: () => number) {
  if (action.kind === 'order') return playOrder(action.buy ? buyOrder(s, action.seat) : s, action.seat, action.order, dice)
  if (action.kind === 'combat') return resolveCombat(s, action.plan, dice)
  if (action.kind === 'end') return finishTurn(s)
  return s
}
export function runGame(config: Pick<Run, 'id' | 'decks' | 'policies' | 'seed' | 'initiative'>): Run {
  let state = prepareGame(config.decks, config.initiative)
  const initial = structuredClone(state), events: Event[] = [], rng = seededDice(config.seed)
  const record = (action: Action, reason: string) => {
    const faces: number[] = [], turn = state.turn
    state = applyAction(state, action, () => { const face = rng(); faces.push(face); return face })
    events.push({ turn, action, dice: faces, reason, hash: stateHash(state) })
  }
  state.result = victory(state)
  while (!state.result) {
    let actor = state.initiative, attempts = 0
    const finished = new Set<Seat>()
    while (finished.size < 2 && !state.result) {
      requireRule(++attempts <= 128, 'Trop d’actions : partie invalide, aucun résultat attribué')
      const p = state.players[actor], buy = p.orders === 0
      const decisionState = buy && p.ps > 0 ? buyOrder(state, actor) : state
      const best = !buy || p.ps > 0 ? candidates(decisionState, actor, config.policies[actor])[0] : undefined
      if (!best) { record({ kind: 'pass', seat: actor }, 'Le robot ne sélectionne plus d’ordre ce tour'); finished.add(actor) }
      else record({ kind: 'order', seat: actor, order: best.order, buy }, best.reason)
      const other = actor === 0 ? 1 : 0
      if (!finished.has(other)) actor = other
    }
    if (state.result) break
    record({ kind: 'combat', plan: combatPlan(state, config.policies) }, 'Charges alternées, attaques restantes et pertes simultanées')
    if (!state.result) record({ kind: 'end' }, 'Contrôle, victoire et ressources du tour suivant')
  }
  return { ...config, engineVersion, rulesVersion, botVersion, initial, events, final: state }
}

/** Reapply recorded decisions and dice; does not ask the bots to decide again. */
export function replay(run: Run, visit?: (state: State, event: Event) => void) {
  requireRule(run.engineVersion === engineVersion && run.rulesVersion === rulesVersion && run.botVersion === botVersion, 'Version de rejeu incompatible')
  let state = prepareGame(run.decks, run.initiative)
  requireRule(stateHash(state) === stateHash(run.initial), 'Déploiement de rejeu incohérent')
  state.result = victory(state)
  for (const event of run.events) {
    requireRule(event.turn === state.turn, 'Tour de rejeu incohérent')
    const dice = scriptedDice(event.dice)
    state = applyAction(state, event.action, dice.roll)
    requireRule(dice.remaining() === 0 && stateHash(state) === event.hash, 'Divergence du rejeu')
    visit?.(state, event)
  }
  requireRule(stateHash(state) === stateHash(run.final) && !!state.result, 'Résultat final de rejeu incohérent')
  return state
}

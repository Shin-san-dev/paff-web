import { canDeployUnit, cells, initialSetup } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { catalogue2026 } from '../../shared/catalogue2026'
import { combatPlan, observation } from './bots'
import { applyAction, stateHash } from './game'
import { resolveCombat } from './combat'
import { finishTurn, makeUnit, onBoard, profile, unit } from './state'
import type { State } from './state'
import { relativeCell } from './decks'
import { deploymentValue, orderChoices, positionValue } from './tactics'
import type { Decision } from './tactics'
import { search } from './search'
import type { Choice, Random } from './search'
import { perspective, rotate } from './perspective'

export const mctsVersion = 'mcts-1'
export const defaultBudget = { iterations: 64, width: 10, deploymentDepth: 6, horizonTurns: 1 }
export type SearchBudget = typeof defaultBudget
const other = (seat: Seat): Seat => seat === 0 ? 1 : 0
const dice = (rng: Random) => () => Math.floor(rng() * 6) + 1
export type BattleNode = { state: State; actor: Seat; passed: Seat[] }

export function battleStep(node: BattleNode, action: Decision, rng: Random): BattleNode {
  let state = applyAction(node.state, action, dice(rng))
  const passed = action.kind === 'pass' ? [...node.passed, action.seat] : node.passed
  if (passed.length === 2 && !state.result) {
    state = resolveCombat(state, combatPlan(state, ['control', 'control']), dice(rng))
    if (!state.result) state = finishTurn(state)
    return { state, actor: state.initiative, passed: [] }
  }
  return { state, actor: passed.includes(other(node.actor)) ? node.actor : other(node.actor), passed }
}
export function chooseOrder(state: State, seat: Seat, passed: Seat[], seed: number, budget: SearchBudget = defaultBudget) {
  const result = orderSearch(perspective(state, seat), 0, seat === 0 ? passed : passed.map((p) => other(p)), seed, budget)
  return seat === 0 ? result : { ...result, action: rotate(result.action) }
}
function orderSearch(state: State, seat: Seat, passed: Seat[], seed: number, budget: SearchBudget) {
  const visible = observation(state, seat), cache = new Map<string, Choice<Decision>[]>()
  const choices = (node: BattleNode, rollout = false) => {
    const key = `${node.actor}:${rollout}:${stateHash(node.state)}`
    if (!cache.has(key)) cache.set(key, orderChoices(node.state, node.actor, rollout ? 5 : budget.width, rollout))
    return cache.get(key)!
  }
  return search({
    root: () => ({ state: structuredClone(visible), actor: seat, passed: [...passed] }),
    actor: (n: BattleNode) => n.actor,
    choices, rollout: (n: BattleNode) => choices(n, true), step: battleStep,
    done: (n: BattleNode) => !!n.state.result || n.state.turn >= state.turn + budget.horizonTurns,
    value: (n: BattleNode, p: Seat) => positionValue(n.state, p),
  }, seat, seed, budget.iterations)
}

export type Placement = { seat: Seat; id: string; cell: number }
type DeploymentNode = { state: State; pending: [string[], string[]]; actor: Seat; plies: number }
export function deploymentChoices(s: State, pending: string[], seat: Seat): Choice<Placement>[] {
  const unique = pending.filter((id, i) => pending.findIndex((j) => unit(s, j).card === unit(s, id).card) === i)
  const setup = { ...initialSetup(), units: s.units.filter(onBoard).map((u) => ({ seat: u.seat, cardStableId: u.card, cell: u.cell! })) }
  const artilleryOnly = pending.every((id) => profile(unit(s, id)).unitType === 'artillery')
  const result: Choice<Placement>[] = []
  for (const id of unique) {
    const u = unit(s, id), remaining = pending.filter((i) => i !== id && profile(unit(s, i)).unitType === 'artillery').length
    for (const cell of [...cells].sort((a, b) => relativeCell(seat, a) - relativeCell(seat, b))) {
      if (!canDeployUnit(cell, seat, profile(u), setup, artilleryOnly, remaining)) continue
      u.cell = cell
      const priority = Math.round(deploymentValue(s, seat) * 1e9) / 1e9
      u.cell = null
      result.push({ key: `${id}@${cell}`, action: { seat, id, cell }, priority, reason: 'Adapter la pose aux unités adverses déjà révélées et aux placements suivants' })
    }
  }
  return result.sort((a, b) => b.priority - a.priority)
}
function deploymentStep(n: DeploymentNode, action: Placement): DeploymentNode {
  const state = structuredClone(n.state), pending = n.pending.map((list) => list.filter((id) => id !== action.id)) as [string[], string[]]
  unit(state, action.id).cell = action.cell
  return { state, pending, actor: pending[other(n.actor)].length ? other(n.actor) : n.actor, plies: n.plies + 1 }
}

/** Opponent's unplaced selection and reserve never enter this function. For
 * rollout only, hypothesize a remaining <=21-point deployment from public
 * faction profiles. This explicit prior is NOT the actual opponent deck. */
export function choosePlacement(state: State, pendingOwn: string[], seat: Seat, seed: number, budget: SearchBudget = defaultBudget) {
  const result = placementSearch(perspective(state, seat), seat === 0 ? pendingOwn : rotate(pendingOwn), 0, seed, budget)
  return seat === 0 ? result : { ...result, action: rotate(result.action) }
}
function placementSearch(state: State, pendingOwn: string[], seat: Seat, seed: number, budget: SearchBudget) {
  const visible = observation(state, seat)
  visible.units = visible.units.filter((u) => onBoard(u) || pendingOwn.includes(u.id))
  const pool = catalogue2026.filter((c) => !c.profile.ability || ['melee-shooting', 'spear-wall', 'powerful-charge', 'moving-shot'].includes(c.profile.ability.id ?? ''))
  const seen = visible.units.filter((u) => u.seat !== seat && onBoard(u))
  const revealedFaction = seen.length ? catalogue2026.find((c) => c.stableId === seen[0].card)!.faction : undefined
  const remainingPoints = Math.max(0, 21 - seen.reduce((n, u) => n + catalogue2026.find((c) => c.stableId === u.card)!.cost, 0))
  const cache = new Map<string, Choice<Placement>[]>()
  return search<DeploymentNode, Placement>({
    root: (rng) => {
      const s = structuredClone(visible), hypothetical: string[] = []
      // Before the first opposing placement even its faction is still private.
      const assumedFaction = revealedFaction ?? (rng() < 0.5 ? 'gobelins' : 'sephosi')
      s.players[other(seat)].faction = assumedFaction
      let points = remainingPoints
      while (points > 0 && hypothetical.length + seen.length < 18) {
        const possible = pool.filter((c) => c.faction === assumedFaction && c.cost <= points && !['unique', 'artillery'].includes(c.profile.unitType))
        if (!possible.length) break
        const chosen = possible[Math.floor(rng() * possible.length)], id = `hypothesis-${hypothetical.length}`
        s.units.push(makeUnit(id, chosen.stableId, other(seat), null)); hypothetical.push(id); points -= chosen.cost
      }
      const pending: [string[], string[]] = seat === 0 ? [[...pendingOwn], hypothetical] : [hypothetical, [...pendingOwn]]
      return { state: s, pending, actor: seat, plies: 0 }
    },
    actor: (n) => n.actor,
    choices: (n) => {
      // Mask hypothetical hidden cards from move ordering; only actor's own pending list and board matter.
      const known = observation(n.state, n.actor)
      const key = `${n.actor}:${stateHash(known)}:${n.pending[n.actor].join(',')}`
      if (!cache.has(key)) cache.set(key, deploymentChoices(known, n.pending[n.actor], n.actor).slice(0, budget.width))
      return cache.get(key)!
    },
    step: deploymentStep,
    done: (n) => n.plies >= budget.deploymentDepth || n.pending.every((p) => !p.length),
    value: (n, p) => deploymentValue(n.state, p),
  }, seat, seed, budget.iterations, budget.deploymentDepth)
}

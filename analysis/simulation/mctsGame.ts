import { canDeployUnit, initialSetup } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { candidates, combatPlan } from './bots'
import { prepareGame, validateDeck } from './decks'
import type { Deck } from './decks'
import { applyAction, engineVersion, seededDice, stateHash } from './game'
import type { Event, Run } from './game'
import { chooseOrder, choosePlacement, defaultBudget, mctsVersion } from './mcts'
import type { Placement, SearchBudget } from './mcts'
import { buyOrder } from './orders'
import { card, onBoard, profile, requireRule, rulesVersion, scenario, scriptedDice, unit, validate, victory } from './state'
import type { State } from './state'

export type Agent = 'mcts' | 'heuristic'
export type DeploymentEvent = { placement: Placement; hash: string; reason: string }
export type MctsRun = Run & { agents: [Agent, Agent]; budget: SearchBudget; deployment: DeploymentEvent[]; setup: State }
type Config = { id: string; decks: [Deck, Deck]; seed: number; initiative: Seat; agents?: [Agent, Agent]; budget?: SearchBudget }
const other = (seat: Seat): Seat => seat === 0 ? 1 : 0

export function deploymentStart(decks: [Deck, Deck], initiative: Seat) {
  decks.forEach(validateDeck)
  const fixed = prepareGame(decks, initiative)
  const pending = ([0, 1] as const).map((seat) => fixed.units.filter((u) => u.seat === seat && onBoard(u)).map((u) => u.id)) as [string[], string[]]
  const state = scenario(fixed.units.map((u) => ({ ...u, cell: null })))
  state.initiative = initiative
  return { state, pending, fixed }
}
export function placeChecked(state: State, pending: [string[], string[]], action: Placement, actor: Seat) {
  requireRule(action.seat === actor && pending[actor].includes(action.id), 'Pose hors alternance ou unité non sélectionnée')
  const u = unit(state, action.id)
  const setup = { ...initialSetup(), units: state.units.filter(onBoard).map((v) => ({ seat: v.seat, cardStableId: v.card, cell: v.cell! })) }
  const remaining = pending[actor].filter((id) => id !== u.id && profile(unit(state, id)).unitType === 'artillery').length
  const onlyArtillery = pending[actor].every((id) => profile(unit(state, id)).unitType === 'artillery')
  requireRule(u.seat === actor && u.cell === null && canDeployUnit(action.cell, actor, profile(u), setup, onlyArtillery, remaining), 'Déploiement illégal')
  const next = structuredClone(state)
  unit(next, u.id).cell = action.cell
  pending[actor] = pending[actor].filter((id) => id !== u.id)
  return next
}
export function runMctsGame(config: Config): MctsRun {
  const agents = config.agents ?? ['mcts', 'mcts'], budget = config.budget ?? defaultBudget
  const start = deploymentStart(config.decks, config.initiative), setup = structuredClone(start.state)
  let state = start.state, actor = config.initiative, decisions = 0
  const deployment: DeploymentEvent[] = []
  while (start.pending.some((p) => p.length)) {
    if (start.pending[actor].length) {
      const searchSeed = (config.seed + 0x1f123bb5 + decisions * 65537) >>> 0
      const first = unit(start.fixed, start.pending[actor][0])
      const choice = agents[actor] === 'mcts' ? choosePlacement(state, start.pending[actor], actor, searchSeed, budget)
        : { action: { seat: actor, id: first.id, cell: first.cell! }, reason: 'Formation fixe du robot de référence' }
      state = placeChecked(state, start.pending, choice.action, actor)
      deployment.push({ placement: choice.action, hash: stateHash(state), reason: choice.reason })
      decisions++
    }
    actor = other(actor)
  }
  validate(state)
  const initial = structuredClone(state), events: Event[] = [], rng = seededDice(config.seed)
  const record = (action: Event['action'], reason: string) => {
    const faces: number[] = [], turn = state.turn
    state = applyAction(state, action, () => { const face = rng(); faces.push(face); return face })
    events.push({ turn, action, dice: faces, reason, hash: stateHash(state) })
  }
  state.result = victory(state)
  while (!state.result) {
    actor = state.initiative
    const passed = new Set<Seat>()
    let attempts = 0
    while (passed.size < 2 && !state.result) {
      requireRule(++attempts <= 128, 'Limite d’actions dépassée : aucun résultat attribué')
      if (agents[actor] === 'mcts') {
        const choice = chooseOrder(state, actor, [...passed], (config.seed + 0x6c8e9cf5 + decisions++ * 65537) >>> 0, budget)
        record(choice.action, `${choice.reason} · ${choice.iterations} explorations`)
        if (choice.action.kind === 'pass') passed.add(actor)
      } else {
        decisions++
        const p = state.players[actor], buy = p.orders === 0
        const best = !buy || p.ps > 0 ? candidates(buy ? buyOrder(state, actor) : state, actor, 'control')[0] : undefined
        if (best) record({ kind: 'order', seat: actor, order: best.order, buy }, best.reason)
        else { record({ kind: 'pass', seat: actor }, 'Fin des ordres du robot de référence'); passed.add(actor) }
      }
      if (!passed.has(other(actor))) actor = other(actor)
    }
    if (state.result) break
    record({ kind: 'combat', plan: combatPlan(state, ['control', 'control']) }, 'Charges et cibles du pilote commun ; pertes simultanées')
    if (!state.result) record({ kind: 'end' }, 'Contrôle des bases et des zones, résultat puis ressources du tour suivant')
  }
  return { ...config, agents, budget, policies: ['control', 'control'], engineVersion, botVersion: mctsVersion,
    rulesVersion, setup, deployment, initial, events, final: state }
}

export function replayMcts(run: MctsRun, visit?: (state: State, label: string, event?: Event) => void) {
  requireRule(run.botVersion === mctsVersion && run.engineVersion === engineVersion && run.rulesVersion === rulesVersion, 'Version MCTS incompatible')
  const start = deploymentStart(run.decks, run.initiative)
  let state = start.state, actor = run.initiative
  requireRule(stateHash(state) === stateHash(run.setup), 'Préparation de rejeu incohérente')
  visit?.(state, 'Avant le déploiement')
  for (const e of run.deployment) {
    if (!start.pending[actor].length) actor = other(actor)
    state = placeChecked(state, start.pending, e.placement, actor)
    requireRule(stateHash(state) === e.hash, 'Déploiement de rejeu divergent')
    visit?.(state, `Déploiement · ${actor === 0 ? 'Sud' : 'Nord'} pose ${card(unit(state, e.placement.id).card).name}`)
    actor = other(actor)
  }
  requireRule(start.pending.every((p) => !p.length) && stateHash(state) === stateHash(run.initial), 'Déploiement incomplet')
  state.result = victory(state)
  let passed = new Set<Seat>(); actor = state.initiative
  for (const e of run.events) {
    requireRule(e.turn === state.turn, 'Tour de rejeu incohérent')
    if (e.action.kind === 'order' || e.action.kind === 'pass') {
      requireRule(e.action.seat === actor && !passed.has(actor), 'Alternance des ordres incohérente')
      if (e.action.kind === 'pass') passed.add(actor)
      if (!passed.has(other(actor))) actor = other(actor)
    } else if (e.action.kind === 'combat') requireRule(passed.size === 2, 'Combat avant la fin des ordres')
    const dice = scriptedDice(e.dice)
    state = applyAction(state, e.action, dice.roll)
    requireRule(dice.remaining() === 0 && stateHash(state) === e.hash, 'Rejeu MCTS divergent')
    const label = e.action.kind === 'order' ? `${e.action.seat === 0 ? 'Sud' : 'Nord'} · ${e.action.order.kind}` : e.action.kind === 'combat' ? 'Combat' : e.action.kind === 'end' ? 'Contrôle de fin de tour' : 'Passe'
    visit?.(state, `Tour ${e.turn} · ${label}`, e)
    if (e.action.kind === 'end' && !state.result) { actor = state.initiative; passed = new Set() }
  }
  requireRule(stateHash(state) === stateHash(run.final) && !!state.result, 'Résultat MCTS divergent')
  return state
}

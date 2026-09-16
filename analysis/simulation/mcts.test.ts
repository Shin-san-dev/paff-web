// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isCenterBase } from '../../shared/board'
import examples from '../../data/simulation/examples.json'
import { calibrationDecks, prepareGame } from './decks'
import { applyAction, stateHash } from './game'
import { chooseOrder, choosePlacement, defaultBudget } from './mcts'
import { deploymentStart, placeChecked, replayMcts, runMctsGame } from './mctsGame'
import { orderChoices } from './tactics'
import { search } from './search'
import { perspective, rotate } from './perspective'
import { engaged, finishTurn, makeUnit, onBoard, scenario, unit } from './state'
import type { State } from './state'
import type { Deck } from './decks'

const decks: [Deck, Deck] = [calibrationDecks[1], calibrationDecks[3]]
const small = { ...defaultBudget, iterations: 12, width: 5, deploymentDepth: 3 }
describe('recherche MCTS et déploiement adaptatif', () => {
  it('anticipe une réponse adverse gagnante plutôt que le gain immédiat apparent', () => {
    type S = { step: number; choice?: string; result?: number }
    const answer = search<S, string>({
      root: () => ({ step: 0 }), actor: (s) => s.step === 0 ? 0 : 1,
      choices: (s) => (s.step === 0 ? ['piège', 'sûr'] : ['punir', 'ignorer']).map((x, i) => ({ key: x, action: x, priority: 2 - i, reason: x })),
      step: (s, a) => s.step === 0 ? { step: 1, choice: a } : { step: 2, result: s.choice === 'sûr' ? 0.3 : a === 'punir' ? -1 : 1 },
      done: (s) => s.step === 2, value: (s) => s.result ?? 0,
    }, 0, 151, 160)
    expect(answer.action).toBe('sûr')
    expect(answer.alternatives.reduce((n, a) => n + a.visits, 0)).toBe(160)
  })
  it('ne consulte ni les cartes adverses cachées ni les dés réels pour décider', () => {
    const s = prepareGame(decks, 0), before = stateHash(s)
    const a = chooseOrder(s, 0, [], 123, small)
    expect(stateHash(s)).toBe(before)
    for (const u of s.units.filter((u) => u.seat === 1 && u.cell === null)) u.card = 'sephosi-regiment-de-la-salamandre'
    expect(chooseOrder(s, 0, [], 123, small)).toEqual(a)
    const start = deploymentStart(decks, 0)
    const first = choosePlacement(start.state, start.pending[0], 0, 456, small)
    for (const u of start.state.units.filter((u) => u.seat === 1)) u.card = 'sephosi-regiment-de-la-salamandre'
    expect(choosePlacement(start.state, start.pending[0], 0, 456, small)).toEqual(first)
    start.state.players[1].faction = 'gobelins'
    expect(choosePlacement(start.state, start.pending[0], 0, 456, small)).toEqual(first)
  })
  it('déploie légalement unité par unité en commençant par l’initiative', () => {
    const start = deploymentStart(decks, 1)
    const chosen = choosePlacement(start.state, start.pending[1], 1, 987, small).action
    expect(chosen.seat).toBe(1)
    expect(isCenterBase(chosen.cell, 1)).toBe(true)
    expect(() => placeChecked(start.state, structuredClone(start.pending), chosen, 0)).toThrow('alternance')
    const after = placeChecked(start.state, start.pending, chosen, 1)
    expect(after.units.filter(onBoard)).toHaveLength(1)
    expect(start.state.units.filter(onBoard)).toHaveLength(0)
  })
  it('adapte les poses à la vue publique avec un raisonnement identique dans les deux orientations', () => {
    const start = deploymentStart([calibrationDecks[0], calibrationDecks[4]], 1)
    let state = start.state
    for (let i = 0; i < 6; i++) {
      const seat = i % 2 ? 0 : 1
      const a = choosePlacement(state, start.pending[seat], seat, 151 + i * 65537, defaultBudget)
      const b = choosePlacement(perspective(state, 1), rotate(start.pending[seat]), seat === 0 ? 1 : 0, 151 + i * 65537, defaultBudget)
      expect(b.action).toEqual(rotate(a.action))
      state = placeChecked(state, start.pending, a.action, seat)
    }
  }, 20000)
  it('déduit le prix de l’ordre supplémentaire avant de financer le recrutement', () => {
    const s = prepareGame(decks, 0)
    s.turn = 2; s.players[0].orders = 0; s.players[0].ps = 2; s.players[0].recruitment = 3
    for (const choice of orderChoices(s, 0, 20)) for (const face of [1, 6]) expect(() => applyAction(s, choice.action, () => face)).not.toThrow()
  })
  it('saisit une victoire de base accessible pendant le tour', () => {
    const s = scenario([makeUnit('g', 'gobelins-troupe-de-gobelins', 0, 23), makeUnit('home', 'gobelins-bande-du-chef', 0, 40), makeUnit('s', 'sephosi-balistes-sephosiennes', 1, 0)])
    s.players[0].orders = 1; s.players[1].orders = 1
    const chosen = chooseOrder(s, 0, [], 521, { ...defaultBudget, iterations: 96 })
    const after = applyAction(s, chosen.action, () => 1)
    expect(after.units.some((u) => u.seat === 0 && onBoard(u) && isCenterBase(u.cell!, 1))).toBe(true)
  })
  it('ne répète pas l’abandon de la Base Centre de la partie 001', () => {
    const frame = examples[0].frames.find((f) => f.label === 'Tour 2 · Combat')!
    let s = finishTurn(structuredClone(frame.state) as unknown as State)
    s = applyAction(s, { kind: 'order', seat: 0, buy: false, order: { kind: 'movement', moves: [{ id: '0:gobelins-bande-du-chef:0', to: 12 }] } }, () => 1)
    s = applyAction(s, { kind: 'order', seat: 1, buy: false, order: { kind: 'strategic-retreat', moves: [{ id: '1:sephosi-cavalerie-lourde-sephosienne:0', to: 11 }] } }, () => 1)
    const chosen = chooseOrder(s, 0, [], 151, defaultBudget)
    const after = applyAction(s, chosen.action, () => 1)
    expect(after.units.some((u) => u.seat === 0 && onBoard(u) && isCenterBase(u.cell!, 0) && !engaged(after, u.id))).toBe(true)
  })
  it('termine puis rejoue aussi les poses et rejette un enregistrement altéré', () => {
    const run = runMctsGame({ id: 'test-mcts', decks, initiative: 1, seed: 41, budget: small })
    expect(run.deployment[0].placement.seat).toBe(1)
    expect(run.deployment.slice(0, 16).map((e) => e.placement.seat)).toEqual(Array.from({ length: 16 }, (_, i) => i % 2 ? 0 : 1))
    expect(run.final.turn).toBeLessThanOrEqual(8)
    expect(stateHash(replayMcts(run))).toBe(stateHash(run.final))
    const corrupt = structuredClone(run)
    corrupt.deployment[0].placement.cell = 53
    expect(() => replayMcts(corrupt)).toThrow()
    const alteredDice = structuredClone(run)
    alteredDice.events.find((e) => e.dice.length)!.dice.push(6)
    expect(() => replayMcts(alteredDice)).toThrow('divergent')
    expect(unit(run.initial, run.deployment[0].placement.id).seat).toBe(1)
  }, 30000)
  it('conserve les poses, les dés et le résultat après rotation des camps', () => {
    const a = runMctsGame({ id: 'rotation-a', decks, initiative: 0, seed: 41, budget: small })
    const b = runMctsGame({ id: 'rotation-b', decks: [decks[1], decks[0]], initiative: 1, seed: 41, budget: small })
    expect(b.deployment.map((d) => d.placement.cell)).toEqual(a.deployment.map((d) => 53 - d.placement.cell))
    expect(b.events.flatMap((e) => e.dice)).toEqual(a.events.flatMap((e) => e.dice))
    const r = a.final.result!
    expect(b.final.result).toEqual(r.kind === 'draw' ? r : { ...r, seat: r.seat === 0 ? 1 : 0 })
    expect(b.final.turn).toBe(a.final.turn)
  }, 40000)
})

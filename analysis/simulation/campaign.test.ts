// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { calibrationDecks, goblinDecks, sephosiDecks, prepareGame, validateDeck } from './decks'
import { calibrationPairings } from './campaign'
import { candidates, observation } from './bots'
import { replay, runGame, seededDice, stateHash } from './game'
import { onBoard, unit, validate } from './state'
import { hits } from './combat'
import { playOrder } from './orders'
import type { Deck } from './decks'
import type { Policy } from './bots'

const config = { id: 'test', decks: [calibrationDecks[1], calibrationDecks[3]] as [Deck, Deck], policies: ['control', 'aggressive'] as [Policy, Policy], seed: 151, initiative: 0 as const }
describe('orchestration et robots de calibration', () => {
  it('couvre trois decks par faction, chaque adversaire et tous les miroirs', () => {
    expect(goblinDecks).toHaveLength(3)
    expect(sephosiDecks).toHaveLength(3)
    const crossed = calibrationPairings.filter((p) => !p.mirror)
    expect(crossed).toHaveLength(9)
    for (const deck of calibrationDecks) {
      const opponents = crossed.filter((p) => p.a.id === deck.id || p.b.id === deck.id)
        .map((p) => p.a.id === deck.id ? p.b.id : p.a.id)
      expect(new Set(opponents).size).toBe(3)
      expect(calibrationPairings.filter((p) => p.mirror && p.a.id === deck.id && p.b.id === deck.id)).toHaveLength(1)
    }
  })
  it('valide budgets, quotas et placements dans les deux camps', () => {
    for (const deck of calibrationDecks) {
      const entries = validateDeck(deck)
      expect(entries.reduce((n, e) => n + e.cost * e.quantity, 0)).toBe(33)
      expect(entries.reduce((n, e) => n + e.cost * e.selectedQuantity, 0)).toBe(21)
      for (const initiative of [0, 1] as const) validate(prepareGame([deck, deck], initiative))
    }
    const bad = structuredClone(calibrationDecks[0]); bad.entries[0].quantity++
    expect(() => validateDeck(bad)).toThrow()
    const unknown = structuredClone(calibrationDecks[3]); unknown.entries[0].card = 'sephosi-aides-de-camp-sephosiens'
    expect(() => validateDeck(unknown)).toThrow('hors du périmètre')
  })
  it('ne transmet pas la composition de la réserve adverse au robot', () => {
    const s = prepareGame(config.decks, 0), before = structuredClone(s)
    expect(observation(s, 0).units.filter((u) => u.seat === 1).every(onBoard)).toBe(true)
    const first = candidates(s, 0, 'control')
    for (const u of s.units.filter((u) => u.seat === 1 && u.cell === null)) u.card = 'sephosi-regiment-de-la-salamandre'
    expect(candidates(s, 0, 'control')).toEqual(first)
    expect(before.units.filter((u) => u.seat === 1 && u.cell === null)).not.toEqual(s.units.filter((u) => u.seat === 1 && u.cell === null))
  })
  it('génère des ordres exécutables sans consommer de dés pour les évaluer', () => {
    const s = prepareGame(config.decks, 0), hash = stateHash(s)
    for (const seat of [0, 1] as const) for (const policy of ['control', 'aggressive', 'preservation'] as const) {
      for (const c of candidates(s, seat, policy)) expect(() => playOrder(s, seat, c.order, () => 1)).not.toThrow()
    }
    expect(stateHash(s)).toBe(hash)
  })
  it('sélectionne les relances ratées après les jets sans relancer deux fois un dé', () => {
    const faces = [6, 1, 2, 6], roll = () => faces.shift()!
    expect(hits(roll, 3, 3, 3, 'misses', 1).faces).toEqual([6, 6, 2])
    expect(faces).toEqual([])
  })
  it('termine une partie, respecte les alternances et rejoue chaque état à l’identique', () => {
    const run = runGame(config)
    expect(run.final.result).toBeDefined()
    expect(run.final.turn).toBeLessThanOrEqual(8)
    expect(run.events.some((e) => e.action.kind === 'combat')).toBe(true)
    expect(run.events.some((e) => e.action.kind === 'order' && e.action.order.kind === 'recruitment')).toBe(true)
    expect(stateHash(replay(JSON.parse(JSON.stringify(run))))).toBe(stateHash(run.final))
    const firstOrders = run.events.filter((e) => e.turn === 1 && (e.action.kind === 'order' || e.action.kind === 'pass')).slice(0, 4)
    expect(firstOrders.map((e) => 'seat' in e.action ? e.action.seat : null)).toEqual([0, 1, 0, 1])
    const corrupt = structuredClone(run)
    corrupt.events.find((e) => e.dice.length)!.dice.push(6)
    expect(() => replay(corrupt)).toThrow('Divergence')
  })
  it('est reproductible par graine et garde les deux styles de jeu interchangeables', () => {
    const a = seededDice(947), b = seededDice(947)
    expect(Array.from({ length: 30 }, a)).toEqual(Array.from({ length: 30 }, b))
    const first = runGame(config), second = runGame(config)
    expect(second).toEqual(first)
  })
  it('inverse les résultats avec les camps et l’initiative, y compris recrutement et Repli', () => {
    for (const [decks, chosen] of [
      [[calibrationDecks[0], calibrationDecks[0]], ['control', 'control']],
      [[calibrationDecks[2], calibrationDecks[3]], ['preservation', 'aggressive']],
    ] as [[Deck, Deck], [Policy, Policy]][]) {
      const first = runGame({ ...config, decks, policies: chosen })
      const reverse = runGame({ ...config, decks: [decks[1], decks[0]], policies: [chosen[1], chosen[0]], initiative: 1 })
      const result = first.final.result!
      expect(reverse.final.result).toEqual(result.kind === 'draw' ? result : { ...result, seat: result.seat === 0 ? 1 : 0 })
      expect(reverse.events.flatMap((e) => e.dice)).toEqual(first.events.flatMap((e) => e.dice))
    }
  })
  it('ne recrute pas de carte morte et refuse une sélection vide comme victoire fictive', () => {
    const s = prepareGame(config.decks, 0), dead = s.units.find((u) => u.seat === 0 && u.cell === null)!
    unit(s, dead.id).r = 0; s.turn = 4; s.players[0].recruitment = 6
    expect(candidates(s, 0, 'preservation').filter((c) => c.order.kind === 'recruitment').every((c) => c.order.kind !== 'recruitment' || c.order.placements.every((p) => p.id !== dead.id))).toBe(true)
    const empty = structuredClone(calibrationDecks[0]); empty.entries.forEach((e) => { e.deployed = 0 })
    const run = runGame({ ...config, decks: [empty, calibrationDecks[3]] })
    expect(run.final.result).toEqual({ kind: 'win', seat: 1, reason: 'elimination' })
    expect(replay(run).result).toEqual(run.final.result)
  })
})

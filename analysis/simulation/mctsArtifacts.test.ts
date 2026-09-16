// @vitest-environment node
import { describe, expect, it } from 'vitest'
import report from '../../data/simulation/mcts/report.json'
import examples from '../../data/simulation/mcts/examples.json'
import baseline from '../../data/simulation/report.json'
import { isCenterBase } from '../../shared/board'
import type { SimulationExample } from '../../shared/simulationReport'

describe('artefacts de la campagne MCTS', () => {
  it('garde une comparaison à configurations égales et sépare les duels de pilotes', () => {
    expect(report.count).toBe(84)
    expect(report.replayed).toBe(report.count)
    expect(report.symmetricPairs).toBe(36)
    const cross = report.runs.filter((r) => !r.mirror)
    expect(cross).toHaveLength(72)
    expect(report.benchmark.runs).toHaveLength(24)
    for (const run of cross) expect(baseline.runs.some((b) => b.decks.join('/') === run.decks.join('/') && b.seed === run.seed && b.initiative === run.initiative && b.policies.every((p) => p === 'control'))).toBe(true)
    expect(report.benchmark.runs.every((r) => r.decks[0] === r.decks[1] && r.policies.includes('mcts') && r.policies.includes('heuristic'))).toBe(true)
  })
  it('conserve exactement vingt exemples, dont deux par confrontation entre factions', () => {
    expect(examples).toHaveLength(20)
    expect(report.examples).toEqual(examples.map((e) => e.id))
    for (const pair of new Set(report.runs.filter((r) => !r.mirror).map((r) => r.pair))) {
      expect(examples.filter((e) => report.runs.find((r) => r.id === e.id)?.pair === pair)).toHaveLength(2)
    }
  })
  it('affiche les poses alternées, le vrai résultat et un exemple de taille raisonnable par requête', () => {
    for (const e of examples as unknown as SimulationExample[]) {
      const run = report.runs.find((r) => r.id === e.id)!
      expect(e.frames[0].state.units).toHaveLength(0)
      const deployment = e.frames.filter((f) => f.label.startsWith('Déploiement'))
      let previous: SimulationExample['frames'][number]['state']['units'] = []
      const seats: number[] = []
      for (const f of deployment) {
        const added = f.state.units.filter((u) => !previous.some((p) => p.id === u.id))
        expect(added).toHaveLength(1)
        seats.push(added[0].seat); previous = f.state.units
      }
      const shortest = Math.min(...[0, 1].map((s) => seats.filter((v) => v === s).length))
      expect(seats.slice(0, shortest * 2)).toEqual(Array.from({ length: shortest * 2 }, (_, i) => i % 2 ? 1 - e.initiative : e.initiative))
      const final = e.frames.at(-1)!.state
      expect(final.result).toEqual(run.result)
      expect(final.turn).toBe(run.turns)
      if (final.result?.kind === 'win' && final.result.reason === 'base') {
        const seat = final.result.seat!
        const free = final.units.filter((u) => u.cell !== null && isCenterBase(u.cell, 1 - seat) && !final.engagements.some((g) => g.a === u.id || g.b === u.id))
        expect(free.some((u) => u.seat === seat)).toBe(true)
        expect(free.some((u) => u.seat !== seat)).toBe(false)
      }
      expect(Buffer.byteLength(JSON.stringify(e))).toBeLessThan(900_000)
    }
  })
})

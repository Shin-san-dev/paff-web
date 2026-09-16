import { describe, expect, it } from 'vitest'
import { summarizeResults } from './results'
import type { SimulationResult } from './results'

describe('bilan des résultats simulés', () => {
  const rows: SimulationResult[] = [
    { decks: ['g', 's'], result: { kind: 'win', seat: 0 }, turns: 2 },
    { decks: ['s', 'g'], result: { kind: 'win', seat: 1 }, turns: 4 },
    { decks: ['g', 's'], result: { kind: 'win', seat: 1 }, turns: 6 },
    { decks: ['s', 'g'], result: { kind: 'draw' }, turns: 8 },
  ]
  it('attribue les victoires à la faction malgré les camps inversés et garde les égalités au dénominateur', () => {
    expect(summarizeResults(rows, (deck) => deck === 'g')).toEqual({
      count: 4, meanTurns: 5, draws: 1, drawTurns: 8,
      sides: [
        { wins: 2, losses: 1, draws: 1, winShare: 0.5, winTurns: 3 },
        { wins: 1, losses: 2, draws: 1, winShare: 0.25, winTurns: 6 },
      ],
    })
  })
  it('distingue les camps dans les miroirs et ne transforme pas une absence de victoire en zéro tour', () => {
    const mirror = [{ decks: ['g', 'g'], result: { kind: 'win', seat: 1 }, turns: 7 }]
    const result = summarizeResults(mirror, (_, seat) => seat === 0)
    expect(result.sides[0]).toMatchObject({ wins: 0, losses: 1, winTurns: null })
    expect(result.sides[1]).toMatchObject({ wins: 1, losses: 0, winTurns: 7 })
    expect(summarizeResults([], () => true)).toMatchObject({ count: 0, meanTurns: null, drawTurns: null })
  })
})

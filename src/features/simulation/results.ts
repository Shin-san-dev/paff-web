export type SimulationResult = {
  turns: number
  decks: string[]
  result: { kind: string; seat?: number }
}

export const meanTurns = (rows: SimulationResult[]) => rows.length ? rows.reduce((sum, row) => sum + row.turns, 0) / rows.length : null

/** Map the winning seat back to the compared side; seats alternate in the campaign. */
export function summarizeResults(rows: SimulationResult[], firstSide: (deckId: string, seat: number) => boolean) {
  const wins: [SimulationResult[], SimulationResult[]] = [[], []]
  const draws: SimulationResult[] = []
  for (const row of rows) {
    if (row.result.kind === 'draw') draws.push(row)
    else if (row.result.kind === 'win' && row.result.seat !== undefined) {
      wins[firstSide(row.decks[row.result.seat], row.result.seat) ? 0 : 1].push(row)
    }
  }
  return {
    count: rows.length, meanTurns: meanTurns(rows), draws: draws.length, drawTurns: meanTurns(draws),
    sides: wins.map((games, index) => ({ wins: games.length, losses: wins[1 - index].length,
      draws: draws.length, winShare: rows.length ? games.length / rows.length : null, winTurns: meanTurns(games) })),
  }
}

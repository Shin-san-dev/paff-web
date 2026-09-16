// Transport types only. Generated reports and traces stay on the server.
export type SimulationRun = {
  id: string; pair: string; mirror: boolean; seed: number; decks: string[]; policies: string[]; initiative: number
  result: { kind: string; seat?: number; reason?: string }; turns: number
}
type Tally = { gobelins: number; sephosi: number; draws: number }
export type SimulationReport = {
  version: string; engineVersion: string; rulesVersion: string; botVersion: string; sourceHash: string
  status: string; seeds: number[]; count: number; replayed: number; symmetricPairs: number
  policies: Record<string, { name: string }>
  decks: { id: string; name: string; entries: { card: string; quantity: number; deployed: number }[] }[]
  runs: SimulationRun[]; examples: string[]; limitations: string[]
  comparison?: { count: number; baseline: Tally; current: Tally; baselineVersion: string }
  benchmark?: { count: number; mcts: number; heuristic: number; draws: number; seed: number; runs: SimulationRun[] }
}
export type SimulationExample = {
  id: string; decks: string[]; policies: string[]; seed: number; initiative: number
  frames: { label: string; detail?: string; state: {
    turn: number; phase: string; result?: { kind: string; seat?: number; reason?: string }
    units: { id: string; card: string; seat: number; cell: number | null; r: number }[]
    engagements: { a: string; b: string }[]
    players: { faction: string; ps: number; orders: number; recruitment: number }[]
  } }[]
  log: { turn: number; kind: string; seat: number | null; dice: number[]; reason: string }[]
}

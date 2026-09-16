import type { Seat } from '../../shared/board'

export type Random = () => number
export function random(seed: number): Random {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = Math.imul(value ^ value >>> 15, 1 | value)
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
export type Choice<A> = { key: string; action: A; priority: number; reason: string }
type Edge<A> = { choice: Choice<A>; visits: number; value: number; next: Map<Seat, Node<A>> }
type Node<A> = { visits: number; edges: Map<string, Edge<A>> }
export type SearchDomain<S, A> = {
  root: (rng: Random) => S
  actor: (state: S) => Seat
  choices: (state: S) => Choice<A>[]
  rollout?: (state: S) => Choice<A>[]
  step: (state: S, action: A, rng: Random) => S
  done: (state: S) => boolean
  value: (state: S, seat: Seat) => number
}

/** Open-loop adversarial UCT. Recompute legal choices after sampled chance
 * outcomes; never reuse an illegal action from another realization. Values are
 * stored from the root player's perspective, inverted at opponent nodes.
 * Search randomness is entirely separate from the real game's dice stream. */
export function search<S, A>(domain: SearchDomain<S, A>, seat: Seat, seed: number, iterations = 64, maxDepth = 40) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error('Budget MCTS invalide')
  const rng = random(seed), root: Node<A> = { visits: 0, edges: new Map() }
  for (let i = 0; i < iterations; i++) {
    let state = domain.root(rng), node = root, expanded = false
    const path: Edge<A>[] = [], nodes = [root]
    for (let depth = 0; depth < maxDepth && !domain.done(state); depth++) {
      const choices = expanded && domain.rollout ? domain.rollout(state) : domain.choices(state)
      if (!choices.length) break
      let choice: Choice<A>
      if (expanded) {
        // Guided stochastic rollout: most likely response plus varied plausible alternatives.
        choice = choices[rng() < 0.8 ? 0 : Math.floor(rng() * Math.min(3, choices.length))]
      } else {
        const unexplored = choices.find((c) => !node.edges.has(c.key))
        if (unexplored) {
          choice = unexplored
          node.edges.set(choice.key, { choice, visits: 0, value: 0, next: new Map() })
          expanded = true
        } else {
          const sign = domain.actor(state) === seat ? 1 : -1
          choice = choices.reduce((best, c) => {
            const score = (candidate: Choice<A>) => {
              const e = node.edges.get(candidate.key)!
              return sign * e.value / e.visits + Math.SQRT2 * Math.sqrt(Math.log(node.visits + 1) / e.visits)
            }
            return score(c) > score(best) ? c : best
          })
        }
        const edge = node.edges.get(choice.key)!
        path.push(edge)
        state = domain.step(state, choice.action, rng)
        const actor = domain.actor(state)
        if (!edge.next.has(actor)) edge.next.set(actor, { visits: 0, edges: new Map() })
        node = edge.next.get(actor)!
        nodes.push(node)
        continue
      }
      state = domain.step(state, choice.action, rng)
    }
    const value = domain.value(state, seat)
    if (!Number.isFinite(value) || Math.abs(value) > 1) throw new Error('Valeur MCTS hors de [-1,1]')
    for (const e of path) { e.visits++; e.value += value }
    for (const n of nodes) n.visits++
  }
  const ranked = [...root.edges.values()].sort((a, b) => b.visits - a.visits || b.value / b.visits - a.value / a.visits)
  if (!ranked.length) throw new Error('Aucune action MCTS')
  return { ...ranked[0].choice, iterations, alternatives: ranked.map((e) => ({ key: e.choice.key, visits: e.visits, mean: e.value / e.visits })) }
}

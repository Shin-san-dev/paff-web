// Isolated policy sensitivity probe. No rule changes or published-data writes.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && ['shared/', 'analysis/'].some((p) => context.parentURL?.startsWith(new URL(p, root).href)) && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.ts`, context)
  return next(specifier, context)
} })
const { candidates, combatPlan } = await import('../analysis/simulation/bots.ts')
const { applyAction, seededDice, stateHash } = await import('../analysis/simulation/game.ts')
const { buyOrder } = await import('../analysis/simulation/orders.ts')
const { onBoard, engaged, victory } = await import('../analysis/simulation/state.ts')
const { zoneOf } = await import('../shared/board.ts')
const traceText = await readFile(new URL('analysis/simulation/output/parties.ndjson', root), 'utf8')
const observations = JSON.parse(await readFile(new URL('analysis/simulation/output/diagnostic/observations.json', root)))
assert.equal(createHash('sha256').update(traceText).digest('hex'), observations.traceHash, 'Run diagnostic audit first for this campaign')
// One orientation, both initiatives and seeds, all nine deck pairs, three
// same-style matchups: fixed selection independent of recorded outcomes.
const selected = traceText.trim().split('\n').map(JSON.parse).filter((r) => r.initial.players[0].faction === 'gobelins'
  && r.initial.players[1].faction === 'sephosi' && r.policies[0] === r.policies[1])
assert.equal(selected.length, 108)

function retainsGuard(s, seat, order) {
  if (!('moves' in order)) return true
  const base = seat === 0 ? '3-1' : '1-1'
  const current = s.units.filter((u) => onBoard(u) && u.seat === seat && zoneOf(u.cell) === base && !engaged(s, u.id))
  if (!current.length) return true
  const destinations = new Map(order.moves.map((m) => [m.id, m.to]))
  return s.units.some((u) => onBoard(u) && u.seat === seat && (!engaged(s, u.id) || destinations.has(u.id))
    && zoneOf(destinations.get(u.id) ?? u.cell) === base)
}
function probe(run, guard) {
  let s = structuredClone(run.initial), eventIndex = 0
  const rng = seededDice(run.seed)
  const record = (action) => {
    s = applyAction(s, action, rng)
    // The unchanged runner must reproduce EVERY reference event, not only its winner.
    if (!guard) { assert.deepEqual(action, run.events[eventIndex].action); assert.equal(stateHash(s), run.events[eventIndex].hash) }
    eventIndex++
  }
  s.result = victory(s)
  while (!s.result) {
    let actor = s.initiative, attempts = 0
    const finished = new Set()
    while (finished.size < 2 && !s.result) {
      assert(++attempts <= 128, 'Invalid probe: action bound exceeded')
      const p = s.players[actor], buy = p.orders === 0
      const decisionState = buy && p.ps > 0 ? buyOrder(s, actor) : s
      const choices = !buy || p.ps > 0 ? candidates(decisionState, actor, run.policies[actor]) : []
      const best = guard && p.faction === 'sephosi' ? choices.find((c) => retainsGuard(decisionState, actor, c.order)) : choices[0]
      if (!best) { record({ kind: 'pass', seat: actor }); finished.add(actor) }
      else record({ kind: 'order', seat: actor, order: best.order, buy })
      const other = actor === 0 ? 1 : 0
      if (!finished.has(other)) actor = other
    }
    if (s.result) break
    record({ kind: 'combat', plan: combatPlan(s, run.policies) })
    if (!s.result) record({ kind: 'end' })
  }
  if (!guard) { assert.equal(eventIndex, run.events.length); assert.equal(stateHash(s), stateHash(run.final)) }
  return { winner: s.result.kind === 'draw' ? 'draw' : s.players[s.result.seat].faction, reason: s.result.reason ?? 'draw', turn: s.turn, hash: stateHash(s) }
}
const rows = []
for (const run of selected) {
  rows.push({ id: run.id, decks: run.decks.map((d) => d.id), policy: run.policies[0], seed: run.seed, initiative: run.initiative,
    baseline: probe(run, false), guard: probe(run, true) })
  if (rows.length % 18 === 0) console.log(`${rows.length}/${selected.length} paires vérifiées`)
}
const tally = (key) => rows.reduce((o, r) => { o[r[key].winner] = (o[r[key].winner] ?? 0) + 1; return o }, {})
const output = { experiment: 'sephosi-retain-last-base-guard-1', traceHash: observations.traceHash,
  description: 'Sephosi reject movement/retreat candidates leaving no unengaged ally in their currently guarded Base Centre. All other choices, rules, decks, initial states and seeds unchanged. Goblin policy unchanged. No future-state or hidden-enemy-reserve inspection.',
  count: rows.length, baseline: tally('baseline'), guard: tally('guard'), rows }
await mkdir(new URL('analysis/simulation/output/diagnostic/', root), { recursive: true })
await writeFile(new URL('analysis/simulation/output/diagnostic/base-guard.json', root), JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify({ count: output.count, baseline: output.baseline, guard: output.guard }))

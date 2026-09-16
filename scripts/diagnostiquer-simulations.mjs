// Read-only audit of the recorded calibration campaign. Never reruns policies
// or writes the published campaign: diagnostic outputs have their own directory.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && ['shared/', 'analysis/'].some((p) => context.parentURL?.startsWith(new URL(p, root).href)) && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.ts`, context)
  return next(specifier, context)
} })
const { replay } = await import('../analysis/simulation/game.ts')
const { card, profile, unit, onBoard, engaged, ability, damage, controls } = await import('../analysis/simulation/state.ts')
const { melee, diceCount, outnumbering, hits } = await import('../analysis/simulation/combat.ts')
const { inRange } = await import('../analysis/simulation/orders.ts')
const { zoneOf } = await import('../shared/board.ts')
const report = JSON.parse(await readFile(new URL('data/simulation/report.json', root)))
const sourceFiles = ['shared/catalogue2026.ts', 'shared/board.ts', 'shared/battleEngine.ts', 'shared/armyRules.ts', 'shared/orders.ts', 'shared/unitAbilities.ts',
  ...['state', 'orders', 'combat', 'decks', 'bots', 'game', 'campaign'].map((name) => `analysis/simulation/${name}.ts`), 'scripts/simuler-paff.mjs']
const sourceHash = createHash('sha256')
for (const path of sourceFiles) { sourceHash.update(path); sourceHash.update(await readFile(new URL(path, root))) }
assert.equal(sourceHash.digest('hex'), report.sourceHash, 'Campaign sources changed: audit the matching version')
const traceText = await readFile(new URL('analysis/simulation/output/parties.ndjson', root), 'utf8')
const runs = traceText.trim().split('\n').map(JSON.parse)
assert.equal(runs.length, report.count)
const cross = runs.filter((r) => r.initial.players[0].faction !== r.initial.players[1].faction)
const bump = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n }
const bucket = (o, k) => o[k] ??= {}
const faction = (s, seat) => s.players[seat].faction
const ownBase = (seat) => seat === 0 ? '3-1' : '1-1'
const at = (s, zone) => s.units.filter((u) => onBoard(u) && zoneOf(u.cell) === zone)
const guards = (s, seat) => at(s, ownBase(seat)).filter((u) => u.seat === seat && !engaged(s, u.id))
const coord = (cell) => cell === null ? null : `${'ABCDEFGHI'[cell % 9]}${Math.floor(cell / 9) + 1}`
const canFire = (s, a) => onBoard(a) && profile(a).offense.kind === 'ranged' && !a.shot && a.recruited !== s.turn && (!a.moved || ability(a, 'moving-shot'))
  && s.units.some((b) => onBoard(b) && b.seat !== a.seat && inRange(a, b) && (!engaged(s, b.id) || ability(a, 'melee-shooting')))
const results = { campaign: report.version, sourceHash: report.sourceHash, traceHash: createHash('sha256').update(traceText).digest('hex'),
  count: cross.length, replaysVerified: 0, causes: {}, byTurn: {}, byDeck: {}, byPolicies: {}, byInitiative: {}, deployments: {},
  orders: {}, activations: {}, effectiveDamage: {}, damageInflicted: {}, combat: {}, shooting: {}, economy: {}, positions: {}, turnControl: {},
  baseWinners: {}, abilities: {}, survivorsAtGoblinWin: [], perGame: [], examples: {} }

// Instrument the recorded combat with the engine's own hit calculation. All
// targets' effective losses and every consumed die must match the exact replay.
function auditCombat(before, after, event) {
  const s = structuredClone(before), losses = new Map(), records = []
  assert(s.units.filter(onBoard).every((u) => !ability(u, 'trollitude')) && !s.salamander.length, 'Audit scope: no Trolls or Salamander')
  let cursor = 0
  const roll = () => { assert(cursor < event.dice.length); return event.dice[cursor++] }
  const attack = (a, charge) => {
    const u = unit(s, a.attacker), target = unit(s, a.target), p = profile(u)
    assert(a.rerolls === undefined || a.rerolls === 'misses', 'Audit assumes failed-dice rerolls')
    const possibleBonus = charge && p.unitType === 'cavalry' ? ability(u, 'powerful-charge') && u.moved ? 3 : 1 : 0
    const bonus = ability(target, 'spear-wall') ? 0 : possibleBonus
    const n = diceCount(s, u, target, bonus), start = cursor
    const total = melee(s, a, roll, bonus)
    const threshold = Math.max(2, Math.min(6, 4 - (p.offense.score - profile(target).defenseMelee)))
    const initialHits = event.dice.slice(start, start + n).filter((f) => f >= threshold).length
    const r = { card: u.card, target: target.card, seat: u.seat, charge, dice: n, rawHits: total,
      rerolled: cursor - start - n, rerollHits: total - initialHits, advantage: outnumbering(s, u.id),
      chargeBonusDice: bonus, spearPreventedDice: possibleBonus - bonus, created: u.id.startsWith('created-') }
    records.push(r)
    const b = bucket(results.combat, u.card)
    for (const k of ['dice', 'rawHits', 'rerolled', 'rerollHits', 'chargeBonusDice', 'spearPreventedDice']) bump(b, k, r[k])
    bump(b, 'attacks'); if (r.advantage) bump(b, 'attacksWithSurnombre'); if (charge) bump(b, 'charges')
    if (r.created) bump(b, 'createdRawHits', total)
    losses.set(target.id, (losses.get(target.id) ?? 0) + total)
  }
  for (const choice of event.action.plan.charges) if (choice.attack) {
    s.engagements.push({ a: choice.attack.attacker, b: choice.attack.target }); attack(choice.attack, true)
  }
  for (const a of event.action.plan.attacks) attack(a, false)
  assert.equal(cursor, event.dice.length)
  for (const u of before.units) assert.equal(unit(after, u.id).r, Math.max(0, u.r - (losses.get(u.id) ?? 0)))
  return records
}

function auditShooting(before, after, event) {
  const s = structuredClone(before), order = event.action.order, pending = new Map()
  let cursor = 0
  const roll = () => { assert(cursor < event.dice.length); return event.dice[cursor++] }
  for (const shot of order.shots) {
    const a = unit(s, shot.attacker), b = unit(s, shot.target)
    assert(!ability(a, 'goblin-rain'), 'Audit scope: damaging shots only')
    const n = diceCount(s, a, b, order.kind === 'concentrated-fire' ? 1 : 0)
    let targets = Array(n).fill(b.id)
    if (engaged(s, b.id)) targets = targets.map(() => roll() <= 3 ? shot.friendlyTarget : b.id)
    const losses = order.kind === 'concentrated-fire' ? pending : new Map(), metric = bucket(results.shooting, a.card)
    bump(metric, 'shots'); bump(metric, 'dice', n)
    if (engaged(s, b.id)) bump(metric, 'meleeShots')
    if (order.kind === 'concentrated-fire') bump(metric, 'bonusDice')
    for (const id of targets) {
      const t = unit(s, id), h = hits(roll, 1, profile(a).offense.score, profile(t).defenseRanged).hits
      bump(metric, t.seat === a.seat ? 'friendlyRawHits' : 'enemyRawHits', h)
      losses.set(id, (losses.get(id) ?? 0) + h)
    }
    if (order.kind !== 'concentrated-fire') damage(s, losses)
  }
  if (order.kind === 'concentrated-fire') damage(s, pending)
  assert.equal(cursor, event.dice.length)
  for (const u of s.units) assert.equal(unit(after, u.id).r, u.r)
}

for (const run of cross) {
  const outcome = run.final.result, winner = outcome.kind === 'draw' ? 'draw' : faction(run.final, outcome.seat)
  const g = run.initial.players.findIndex((p) => p.faction === 'gobelins'), se = 1 - g
  bump(results.causes, `${winner}:${outcome.reason ?? 'draw'}`)
  bump(bucket(results.byTurn, run.final.turn), winner)
  bump(bucket(results.byPolicies, `${run.policies[g]} / ${run.policies[se]}`), winner)
  bump(bucket(results.byInitiative, faction(run.initial, run.initiative)), winner)
  for (const d of run.decks) bump(bucket(results.byDeck, d.id), winner)
  for (const seat of [0, 1]) {
    const id = run.decks[seat].id, board = run.initial.units.filter((u) => u.seat === seat && onBoard(u))
    results.deployments[id] ??= { units: board.length, resistance: board.reduce((n, u) => n + u.r, 0),
      meleeUnits: board.filter((u) => profile(u).offense.kind === 'melee').length,
      meleeDice: board.filter((u) => profile(u).offense.kind === 'melee').reduce((n, u) => n + profile(u).dice, 0),
      rangedUnits: board.filter((u) => profile(u).offense.kind === 'ranged').length,
      rangedDice: board.filter((u) => profile(u).offense.kind === 'ranged').reduce((n, u) => n + profile(u).dice, 0),
      cost: board.reduce((n, u) => n + card(u.card).cost, 0) }
    for (const u of board) bump(results.abilities, profile(u).ability?.id ?? 'none')
  }
  const game = { id: run.id, winner, turn: run.final.turn, reason: outcome.reason ?? 'draw',
    freeBands: 0, buys: [0, 0], income: [0, 0], damageReceived: [0, 0], baseCards: [] }
  let previous = run.initial
  const opportunities = new Set(), fired = new Set(), timeline = []
  replay(run, (state, event) => {
    const a = event.action
    let attacks
    if (a.kind === 'order') {
      const f = faction(previous, a.seat), o = a.order, key = `${f}:${o.kind}`
      bump(results.orders, key)
      if (a.buy) { bump(bucket(results.economy, f), 'boughtOrders'); game.buys[a.seat]++ }
      for (const u of previous.units.filter((u) => u.seat === a.seat && canFire(previous, u))) opportunities.add(u.id)
      if ('shots' in o) {
        auditShooting(previous, state, event)
        bump(results.activations, key, o.shots.length)
        for (const shot of o.shots) fired.add(shot.attacker)
      }
      if ('moves' in o) {
        bump(results.activations, key, o.moves.length)
        for (const m of o.moves) if (!ability(unit(previous, m.id), 'moving-shot') && canFire(previous, unit(previous, m.id))) bump(bucket(results.positions, f), 'movedInsteadOfAvailableShot')
        if (guards(previous, a.seat).length && !guards(state, a.seat).length) {
          bump(bucket(results.positions, f), 'vacatedLastUnengagedBaseGuard')
          if (!at(previous, ownBase(a.seat)).some((u) => u.seat !== a.seat)) bump(bucket(results.positions, f), 'vacatedBaseBeforeEnemyEntered')
        }
      }
      if (o.kind === 'recruitment') {
        bump(bucket(results.economy, f), 'recruitedUnits', o.placements.length)
        bump(bucket(results.economy, f), 'recruitmentPS', o.ps ?? 0)
      }
      if (o.kind === 'goblin-reinforcements') game.freeBands++
    }
    if (a.kind === 'combat') {
      attacks = auditCombat(previous, state, event)
      for (const seat of [0, 1]) {
        const f = faction(state, seat)
        for (const id of opportunities) if (unit(previous, id).seat === seat && !fired.has(id)) bump(bucket(results.positions, f), 'unitTurnsWithUnusedShotOpportunity')
        bump(bucket(results.positions, f), 'unitTurnsWithShotOpportunity', [...opportunities].filter((id) => unit(previous, id).seat === seat).length)
        bump(bucket(results.positions, f), 'combatPhases')
      }
      opportunities.clear(); fired.clear()
    }
    for (const u of previous.units) {
      const removed = u.r - unit(state, u.id).r
      if (removed) {
        const f = faction(previous, u.seat), key = `${f}:${a.kind === 'order' ? a.order.kind : a.kind}`
        bump(results.effectiveDamage, key, removed); game.damageReceived[u.seat] += removed
        const sourceSeat = a.kind === 'order' ? a.seat : 1 - u.seat
        bump(results.damageInflicted, `${faction(previous, sourceSeat)}:${sourceSeat === u.seat ? 'friendly' : 'enemy'}`, removed)
      }
    }
    if (a.kind === 'end') for (const seat of [0, 1]) {
      const f = faction(previous, seat), controlled = ['2-0', '2-1', '2-2'].filter((z) => controls(previous, seat, z)).length
      const t = bucket(bucket(results.turnControl, event.turn), f)
      bump(t, 'games'); bump(t, 'zones', controlled)
      if (!state.result) { bump(bucket(results.economy, f), 'earnedPS', controlled); game.income[seat] += controlled }
    }
    if (run.id === 'partie-218' || run.id === 'partie-001') timeline.push({ turn: event.turn, action: a,
      moves: a.kind === 'order' && 'moves' in a.order ? a.order.moves.map((m) => ({ card: unit(previous, m.id).card, from: coord(unit(previous, m.id).cell), to: coord(m.to) })) : undefined,
      guards: [guards(state, 0).length, guards(state, 1).length], attacks })
    previous = state
  })
  results.replaysVerified++
  if (outcome.kind === 'win' && outcome.reason === 'base') {
    const contenders = at(run.final, ownBase(1 - outcome.seat))
    const controlling = contenders.filter((u) => u.seat === outcome.seat && !engaged(run.final, u.id))
    assert(controlling.length)
    game.baseCards = [...new Set(controlling.map((u) => u.card))]
    for (const c of game.baseCards) bump(results.baseWinners, c)
    if (controlling.some((u) => u.id.startsWith('created-'))) bump(results.baseWinners, 'created-band-games')
    const f = faction(run.final, outcome.seat), b = bucket(results.positions, f)
    bump(b, 'baseWins')
    if (!contenders.some((u) => u.seat !== outcome.seat)) bump(b, 'baseWinsWithNoDefenders')
    else bump(b, 'baseWinsWithEngagedDefenders')
  }
  if (winner === 'gobelins') {
    const board = run.final.units.filter((u) => u.seat === se && onBoard(u))
    results.survivorsAtGoblinWin.push({ id: run.id, units: board.length, resistance: board.reduce((n, u) => n + u.r, 0),
      cost: board.reduce((n, u) => n + card(u.card).cost, 0), reserve: run.final.units.filter((u) => u.seat === se && u.cell === null && u.r > 0).length })
  }
  if (timeline.length) results.examples[run.id] = timeline
  results.perGame.push({ ...game, buys: { gobelins: game.buys[g], sephosi: game.buys[se] }, income: { gobelins: game.income[g], sephosi: game.income[se] },
    damageReceived: { gobelins: game.damageReceived[g], sephosi: game.damageReceived[se] } })
}
const output = new URL('analysis/simulation/output/diagnostic/', root)
await mkdir(output, { recursive: true })
await writeFile(new URL('observations.json', output), JSON.stringify(results, null, 2) + '\n')
const { perGame, examples, survivorsAtGoblinWin, ...compact } = results
const mean = (xs, key) => xs.reduce((n, x) => n + x[key], 0) / xs.length
console.log(JSON.stringify({ ...compact, survivorMeans: { units: mean(survivorsAtGoblinWin, 'units'), resistance: mean(survivorsAtGoblinWin, 'resistance'), cost: mean(survivorsAtGoblinWin, 'cost'), reserve: mean(survivorsAtGoblinWin, 'reserve') },
  noFreeBands: perGame.filter((g) => g.freeBands === 0).reduce((o, g) => { bump(o, g.winner); return o }, {}), exampleIds: Object.keys(examples) }, null, 2))

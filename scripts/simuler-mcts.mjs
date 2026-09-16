import { registerHooks } from 'node:module'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
const root = new URL('../', import.meta.url)
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('.') && ['shared/', 'analysis/'].some((p) => c.parentURL?.startsWith(new URL(p, root).href)) && !/\.[a-z]+$/i.test(s)) return next(`${s}.ts`, c)
  return next(s, c)
} })
const { runMctsGame, replayMcts } = await import('../analysis/simulation/mctsGame.ts')
const { defaultBudget } = await import('../analysis/simulation/mcts.ts')
const { calibrationDecks, goblinDecks, sephosiDecks } = await import('../analysis/simulation/decks.ts')
const { publicRun } = await import('../analysis/simulation/campaign.ts')
const { cellCoordinate } = await import('../shared/board.ts')
const { card, unit } = await import('../analysis/simulation/state.ts')
if (!isMainThread) {
  const run = runMctsGame(workerData)
  replayMcts(run)
  parentPort.postMessage(run)
  process.exit(0)
}
const smoke = process.argv.includes('--smoke')
const started = Date.now()
if (smoke) {
  const run = runMctsGame({ id: 'smoke', decks: [calibrationDecks[1], calibrationDecks[3]], initiative: 0, seed: 151 })
  replayMcts(run)
  console.log(JSON.stringify({ seconds: (Date.now() - started) / 1000, result: run.final.result, turn: run.final.turn, actions: run.events.length,
    deployment: run.deployment.map((e) => ({ name: card(unit(run.initial, e.placement.id).card).name, seat: e.placement.seat, cell: cellCoordinate(e.placement.cell) })) }))
  process.exit(0)
}
const output = new URL('analysis/simulation/output/mcts/', root), published = new URL('data/simulation/mcts/', root)
await mkdir(output, { recursive: true })
const files = ['shared/catalogue2026.ts', 'shared/board.ts', 'shared/battleEngine.ts', 'shared/armyRules.ts', 'shared/orders.ts', 'shared/unitAbilities.ts',
  ...['state', 'orders', 'combat', 'decks', 'bots', 'game', 'campaign', 'search', 'tactics', 'perspective', 'mcts', 'mctsGame'].map((n) => `analysis/simulation/${n}.ts`), 'scripts/simuler-mcts.mjs']
const digest = createHash('sha256')
for (const path of files) { digest.update(path); digest.update(await readFile(new URL(path, root))) }
const sourceHash = digest.digest('hex')
const configs = []
for (const a of goblinDecks) for (const b of sephosiDecks) for (const seed of [151, 947]) for (const swapped of [false, true]) for (const initiative of [0, 1]) {
  configs.push({ decks: swapped ? [b, a] : [a, b], seed, initiative, pair: `${a.id} / ${b.id}`, mirror: false })
}
for (const deck of calibrationDecks) for (const initiative of [0, 1]) configs.push({ decks: [deck, deck], seed: 151, initiative, pair: `${deck.id} / ${deck.id}`, mirror: true })
// Equal-deck duels compare the decision-makers directly, on a new seed.
for (const deck of calibrationDecks) for (const agents of [['mcts', 'heuristic'], ['heuristic', 'mcts']]) for (const initiative of [0, 1]) {
  configs.push({ decks: [deck, deck], agents, seed: 20260916, initiative, pair: `${deck.id} / ${deck.id}`, mirror: true })
}
const runs = Array(configs.length)
try {
  const checkpoint = JSON.parse(await readFile(new URL('checkpoint.json', output)))
  if (checkpoint.sourceHash !== sourceHash) throw new Error('Sources modifiées : archiver le dossier output/mcts avant une nouvelle campagne')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  await writeFile(new URL('checkpoint.json', output), JSON.stringify({ sourceHash, budget: defaultBudget }))
}
let cursor = 0, completed = 0
const workerRun = (config) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL(import.meta.url), { workerData: config })
  worker.once('message', resolve); worker.once('error', reject)
  worker.once('exit', (code) => { if (code) reject(new Error(`Simulation interrompue (${code})`)) })
})
async function consume() {
  while (cursor < configs.length) {
    const i = cursor++, config = configs[i], before = Date.now(), id = `mcts-${String(i + 1).padStart(3, '0')}`
    const file = new URL(`${id}.json`, output)
    try { runs[i] = JSON.parse(await readFile(file)); replayMcts(runs[i]) }
    catch (error) {
      if (error.code !== 'ENOENT') throw error
      runs[i] = await workerRun({ ...config, id, budget: defaultBudget })
      await writeFile(file, JSON.stringify(runs[i]) + '\n')
    }
    const run = runs[i]
    console.log(`${++completed}/${configs.length} · ${run.id} · tour ${run.final.turn} · ${JSON.stringify(run.final.result)} · ${Math.round((Date.now() - before) / 1000)} s`)
  }
}
await Promise.all(Array.from({ length: 4 }, consume))
await writeFile(new URL('parties.ndjson', output), runs.map((r) => JSON.stringify(r)).join('\n') + '\n')
const summaries = runs.map((r, i) => ({ ...publicRun(r, configs[i].pair, configs[i].mirror), policies: r.agents }))
let symmetricPairs = 0
for (let i = 0; i < 72; i += 4) for (const [a, b] of [[0, 3], [1, 2]]) {
  const x = runs[i + a].final.result, y = runs[i + b].final.result
  if (x.kind === y.kind && (x.kind === 'draw' || x.seat !== y.seat && x.reason === y.reason) && runs[i + a].final.turn === runs[i + b].final.turn) symmetricPairs++
}
if (symmetricPairs !== 36) throw new Error(`Symétrie de la recherche à corriger : ${symmetricPairs}/36 paires`) 
// Exactly 20 examples, selected by configuration before reading outcomes: two
// per cross-faction deck pair with different seed/initiative, plus two mirrors.
const selected = [...Array.from({ length: 9 }, (_, i) => [i * 8, i * 8 + 5]).flat(), 72, 78]
const labels = { movement: 'Mouvement', 'strategic-retreat': 'Repli stratégique', shooting: 'Tir', artillery: 'Artillerie', 'concentrated-fire': 'Tir concentré', recruitment: 'Recrutement', 'goblin-reinforcements': 'Tiens, des gobelins…' }
const examples = selected.map((index) => {
  const run = runs[index], frames = [], log = []
  replayMcts(run, (state, label, event) => {
    if (event?.action.kind === 'pass') return
    if (event?.action.kind === 'order') {
      const o = event.action.order
      const detail = 'moves' in o ? o.moves.map((m) => `${card(unit(state, m.id).card).name} → ${cellCoordinate(m.to)}`).join(' ; ')
        : 'shots' in o ? o.shots.map((s) => `${card(unit(state, s.attacker).card).name} → ${card(unit(state, s.target).card).name}`).join(' ; ')
          : 'placements' in o ? o.placements.map((p) => `${card(unit(state, p.id).card).name} → ${cellCoordinate(p.cell)}`).join(' ; ') : ''
      label = `Tour ${event.turn} · ${event.action.seat === 0 ? 'Sud' : 'Nord'} · ${labels[o.kind] ?? o.kind}`
      log.push({ turn: event.turn, kind: o.kind, seat: event.action.seat, dice: event.dice, reason: `${label}${detail ? ` : ${detail}` : ''}` })
    } else log.push({ turn: event?.turn ?? 0, kind: event?.action.kind ?? 'deployment', seat: null, dice: event?.dice ?? [], reason: label })
    // The inspector needs the visible board, not every unplayed reserve card or
    // internal flag repeated in every frame. Full states remain in local traces.
    frames.push({ label, detail: log.at(-1).reason, state: {
      turn: state.turn, phase: state.phase, ...(state.result ? { result: state.result } : {}),
      units: state.units.filter((u) => u.cell !== null && u.r > 0).map(({ id, card, seat, cell, r }) => ({ id, card, seat, cell, r })),
      engagements: structuredClone(state.engagements),
      players: state.players.map(({ faction, ps, orders, recruitment }) => ({ faction, ps, orders, recruitment })),
    } })
  })
  return { id: run.id, decks: run.decks.map((d) => d.id), policies: run.agents, seed: run.seed, initiative: run.initiative, frames, log }
})
const baseline = JSON.parse(await readFile(new URL('data/simulation/report.json', root)))
const comparable = baseline.runs.filter((r) => !r.mirror && r.policies.every((p) => p === 'control'))
const tally = (rows) => rows.reduce((o, r) => { const k = r.result.kind === 'draw' ? 'draws' : r.decks[r.result.seat].startsWith('gobelins-') ? 'gobelins' : 'sephosi'; o[k]++; return o }, { gobelins: 0, sephosi: 0, draws: 0 })
const benchmarkRuns = summaries.slice(84)
const benchmark = benchmarkRuns.reduce((o, r) => { const k = r.result.kind === 'draw' ? 'draws' : r.policies[r.result.seat]; o[k]++; return o }, { mcts: 0, heuristic: 0, draws: 0 })
const report = { version: 'mcts-2026-09-16-1', engineVersion: 'calibration-1', rulesVersion: runs[0].rulesVersion, botVersion: 'mcts-1', catalogueVersion: baseline.catalogueVersion,
  status: 'calibration', sourceHash, seeds: [151, 947], count: 84, replayed: 84, symmetricPairs, policies: { mcts: { name: 'MCTS' } },
  decks: calibrationDecks, runs: summaries.slice(0, 84), examples: examples.map((e) => e.id), searchBudget: defaultBudget,
  benchmark: { count: benchmarkRuns.length, ...benchmark, runs: benchmarkRuns, seed: 20260916 },
  comparison: { count: comparable.length, baseline: tally(comparable), current: tally(summaries.filter((r) => !r.mirror)), baselineVersion: baseline.version },
  limitations: [
    'Essai MCTS : aucun verdict d’équilibrage. Comparaison avec les 72 références Contrôle sur les mêmes decks, graines, camps et initiatives.',
    'Déploiement unité par unité, initiative en premier ; chaque pose observe seulement les unités adverses déjà révélées.',
    'Sélections de 21 points et decks de 33 points conservés. Le choix de la composition et des unités mises en réserve reste fixe.',
    `Recherche UCT de ${defaultBudget.iterations} explorations par décision ; déploiement sur ${defaultBudget.deploymentDepth} poses, ordres jusqu’à la fin du tour courant. Évaluation heuristique en limite de recherche.`,
    'Actions proposées en nombre limité, avec mouvements individuels, mouvements partiels, défense et tirs. Recherche non exhaustive.',
    'La réserve réelle adverse et les futurs dés sont invisibles à la recherche. Au déploiement, les poses encore inconnues sont hypothétiques ; pendant le tour, les recrues adverses inconnues ne sont pas simulées.',
    'Charges et cibles de combat utilisent encore le même pilote heuristique pour les deux factions ; le MCTS en simule les conséquences.',
    'Deux graines. Les inversions ne sont pas des observations indépendantes. Les mêmes graines ne garantissent pas les mêmes attaques après divergence des décisions.',
    'Sans décors, événements et unités complexes non admises dans la campagne de référence.',
  ] }
await mkdir(published, { recursive: true })
await writeFile(new URL('examples.json', published), JSON.stringify(examples) + '\n')
await writeFile(new URL('report.json', published), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ seconds: (Date.now() - started) / 1000, comparison: report.comparison, benchmark, symmetricPairs, examples: examples.length }))

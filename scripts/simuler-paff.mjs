import { registerHooks } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && ['shared/', 'analysis/'].some((p) => context.parentURL?.startsWith(new URL(p, root).href)) && !/\.[a-z]+$/i.test(specifier)) return next(`${specifier}.ts`, context)
  return next(specifier, context)
} })
const { campaign } = await import('../analysis/simulation/campaign.ts')
const { replay, stateHash } = await import('../analysis/simulation/game.ts')
const output = new URL('analysis/simulation/output/', root)
const published = new URL('data/simulation/', root)
await mkdir(output, { recursive: true })
await mkdir(published, { recursive: true })
const sourceFiles = ['shared/catalogue2026.ts', 'shared/board.ts', 'shared/battleEngine.ts', 'shared/armyRules.ts', 'shared/orders.ts', 'shared/unitAbilities.ts',
  ...['state', 'orders', 'combat', 'decks', 'bots', 'game', 'campaign'].map((name) => `analysis/simulation/${name}.ts`), 'scripts/simuler-paff.mjs']
const sourceHash = createHash('sha256')
for (const path of sourceFiles) { sourceHash.update(path); sourceHash.update(await readFile(new URL(path, root))) }
const traces = [], examples = []
const started = Date.now()
const report = campaign((run) => {
  traces.push(JSON.stringify(run))
  // One example per cross-faction pairing, independent of the row numbering.
  const pairing = run.decks.map((d) => d.id).join(' / ')
  if (run.decks[0].id.startsWith('gobelins-') && run.decks[1].id.startsWith('sephosi-') && !examples.some((e) => e.decks.join(' / ') === pairing)) {
    const frames = [{ label: 'Déploiement', state: run.initial }]
    replay(run, (state, event) => { if (event.action.kind === 'combat' || state.result) frames.push({ label: `Tour ${event.turn} · ${state.result ? 'Fin de partie' : 'Combat'}`, state: structuredClone(state) }) })
    examples.push({ id: run.id, decks: run.decks.map((d) => d.id), policies: run.policies, seed: run.seed, initiative: run.initiative,
      frames, log: run.events.map((e) => ({ turn: e.turn, kind: e.action.kind === 'order' ? e.action.order.kind : e.action.kind, seat: 'seat' in e.action ? e.action.seat : null, dice: e.dice, reason: e.reason })), finalHash: stateHash(run.final) })
  }
  if (traces.length % 24 === 0) console.log(`${traces.length} parties exécutées et rejouées`)
})
await writeFile(new URL('parties.ndjson', output), traces.join('\n') + '\n')
await writeFile(new URL('report.json', published), JSON.stringify({ ...report, sourceHash: sourceHash.digest('hex'), examples: examples.map((e) => e.id) }, null, 2) + '\n')
await writeFile(new URL('examples.json', published), JSON.stringify(examples) + '\n')
console.log(`${report.count} parties, ${report.replayed} rejeux vérifiés, ${Math.round((Date.now() - started) / 1000)} secondes. Rapport privé dans data/simulation.`)

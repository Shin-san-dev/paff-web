import { CATALOGUE_VERSION } from '../../shared/catalogue2026'
import type { Seat } from '../../shared/board'
import { calibrationDecks, goblinDecks, sephosiDecks } from './decks'
import { botVersion, policies } from './bots'
import type { Policy } from './bots'
import { engineVersion, replay, runGame } from './game'
import type { Run } from './game'
import { onBoard, requireRule, rulesVersion } from './state'

export const campaignVersion = 'calibration-2026-09-15-2'
export const limitations = [
  'Campagne de calibration des robots : aucun verdict d’équilibrage des factions.',
  'Trois styles fixes sans apprentissage ni anticipation des réponses adverses.',
  'Decks fixes à 33 points, 21 déployés, formation identique inversée selon le camp.',
  'Trois decks par faction, neuf confrontations croisées et un contrôle miroir pour chacun des six decks.',
  'Sans décors, événements, Trolls, Shamans, Danzereu, Blop, Anges, Porte-ordres, Vallardi ou Salamandre.',
  'Les tirs ordinaires préfèrent des cibles distinctes ; seules les salves Tir concentré groupent une même cible.',
  'Pas de mouvement avec attaque de désengagement dans les choix des robots ; Repli Sephosi est utilisé.',
  'Les choix de charges et cibles sont planifiés avant les jets de combat ; le surnombre est évalué à chaque attaque.',
  'Deux graines par confrontation. Les parties inversées sont appariées, pas des observations indépendantes.',
]
export function publicRun(run: Run, pair: string, mirror: boolean) {
  const totals = ([0, 1] as const).map((seat) => {
    const orders = run.events.filter((e) => e.action.kind === 'order' && e.action.seat === seat)
    const recruited = run.final.units.filter((u) => u.seat === seat && u.recruited !== null)
    return { orders: orders.length, extraOrders: orders.filter((e) => e.action.kind === 'order' && e.action.buy).length,
      recruited: recruited.filter((u) => !u.id.startsWith('created-')).length, created: recruited.filter((u) => u.id.startsWith('created-')).length,
      onBoard: run.final.units.filter((u) => u.seat === seat && onBoard(u)).length,
      reserve: run.final.units.filter((u) => u.seat === seat && u.cell === null && u.r > 0).length }
  })
  return { id: run.id, pair, mirror, seed: run.seed, decks: run.decks.map((d) => d.id), policies: run.policies,
    initiative: run.initiative, result: run.final.result!, turns: run.final.turn, actions: run.events.length, totals }
}
export type RunSummary = ReturnType<typeof publicRun>
export const calibrationPairings = [
  ...goblinDecks.flatMap((a) => sephosiDecks.map((b) => ({ a, b, mirror: false }))),
  ...calibrationDecks.map((deck) => ({ a: deck, b: deck, mirror: true })),
]
export function campaign(onRun?: (run: Run) => void, seeds = [151, 947]) {
  const rows: RunSummary[] = [], policyIds = Object.keys(policies) as Policy[]
  requireRule(goblinDecks.length === sephosiDecks.length && goblinDecks.length > 0, 'Même nombre de decks requis dans chaque faction')
  for (const pair of calibrationPairings) for (const pa of policyIds) for (const pb of policyIds) {
    if (pair.mirror && pa !== pb) continue
    for (const seed of seeds) for (const swapped of [false, true]) for (const initiative of [0, 1] as Seat[]) {
      const id = `partie-${String(rows.length + 1).padStart(3, '0')}`
      const run = runGame({ id, seed, decks: swapped ? [pair.b, pair.a] : [pair.a, pair.b], policies: swapped ? [pb, pa] : [pa, pb], initiative })
      replay(run)
      rows.push(publicRun(run, `${pair.a.id} / ${pair.b.id}`, pair.mirror))
      onRun?.(run)
    }
  }
  // Identical seeds under 180° rotation must not favour an absolute board seat.
  // A violation blocks publication of the report, even if aggregate wins happen to match.
  for (let i = 0; i < rows.length; i += 4) for (const [a, b] of [[0, 3], [1, 2]]) {
    const left = rows[i + a].result, right = rows[i + b].result
    requireRule(left.kind === right.kind && (left.kind === 'draw' || (right.kind === 'win' && left.seat !== right.seat && left.reason === right.reason)), 'Résultats asymétriques : calibration à corriger avant publication')
  }
  const groups = [...new Set(rows.map((r) => `${r.pair}|${r.policies.join('/')}`))].map((key) => {
    const group = rows.filter((r) => `${r.pair}|${r.policies.join('/')}` === key)
    return { key, count: group.length, draws: group.filter((r) => r.result.kind === 'draw').length }
  })
  return { version: campaignVersion, engineVersion, rulesVersion, botVersion, catalogueVersion: CATALOGUE_VERSION,
    status: 'calibration' as const, seeds, limitations, policies, decks: calibrationDecks, count: rows.length,
    replayed: rows.length, symmetricPairs: rows.length / 2, groups, runs: rows }
}

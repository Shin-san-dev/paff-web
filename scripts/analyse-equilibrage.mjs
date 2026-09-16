// Node 24+: use native TypeScript stripping; resolve only this audit's local TS imports.
import { registerHooks } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const sharedRoot = new URL('shared/', root).href
const analysisRoot = new URL('analysis/equilibrage/', root).href
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && (context.parentURL?.startsWith(sharedRoot) || context.parentURL?.startsWith(analysisRoot)) && !/\.[a-z]+$/i.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context)
  }
  return nextResolve(specifier, context)
} })

const { numericReport } = await import('../analysis/equilibrage/report.ts')
const { hitProbability } = await import('../analysis/equilibrage/metrics.ts')
const { unitTypeNames } = await import('../shared/unitProfile.ts')
const { units, matchups, auditVersion, catalogueVersion, ruleset, tableRerolls } = numericReport
const output = new URL('docs/equilibrage/', root)
const fr = (number) => number.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const csv = (rows) => rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n'
const markdown = [
  '# Calculs de référence — lot 1', '',
  `Rapport ${auditVersion} · catalogue ${catalogueVersion}. Généré par \`node scripts/analyse-equilibrage.mjs\` (Node 24).`, '',
  `Référentiel : **${ruleset}**, lecture de la réponse Q7 d’Adrien : les seuils du tableau sont conservés, les relances des échecs et confirmations des réussites sont ignorées. Cette lecture est explicite et reste à confirmer si Adrien voulait seulement reporter la discussion des relances. Aucun changement de l’aide du site. Voir les [réponses reçues](retours-adrien-01.md).`, '',
  'Lire [l’analyse](analyse-unites.md) et [les hypothèses](audit-regles.md) avant d’interpréter ces chiffres. Aucune partie simulée, aucun joueur évalué.', '',
  '## Probabilité de toucher avec un dé', '',
  'Sans relance ni confirmation provenant du tableau. Les relances de surnombre ne sont pas modélisées dans une attaque isolée. Colonnes = attaque, lignes = défense. Valeurs en pourcentage.', '',
  '| D \\ A | 1 | 2 | 3 | 4 | 5 | 6 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...[1, 2, 3, 4, 5, 6].map((d) => `| ${d} | ${[1, 2, 3, 4, 5, 6].map((a) => fr(100 * hitProbability(a, d, tableRerolls))).join(' | ')} |`), '',
  '## Les 20 profils', '',
  'G = Gobelins ; S = Sephosi. R est le nombre de points de régiment, pas un jet de sauvegarde.', '',
  '| Faction | Unité | Type | Coût | R | Dés | Attaque | DC | DT | Capacité |',
  '| --- | --- | --- | ---: | ---: | ---: | --- | ---: | ---: | --- |',
  ...units.map((u) => {
    const p = u.profile
    return `| ${u.faction === 'gobelins' ? 'G' : 'S'} | ${u.name} | ${unitTypeNames[p.unitType]} | ${u.cost} | ${p.regiment} | ${p.dice} | ${p.offense.score === null ? '—' : `${p.offense.kind === 'melee' ? 'C' : 'T'}${p.offense.score}`} | ${p.defenseMelee} | ${p.defenseRanged} | ${p.ability?.name ?? '—'} |`
  }), '',
  '## Dégâts moyens bruts d’une attaque', '',
  'Sans plafonnement par les R de la cible, sans charge, surnombre, décor, ordre, sacrifice ou riposte. DC pour C, DT pour T. Les T ne combattent pas en mêlée. Défense 6 : repère théorique, aucun des 20 profils actuels ne la possède.', '',
  '**Trolls : seulement une attaque normale, conditionnée au résultat 4–5 de Trollitude.** Leur moyenne par occasion de combat est calculée séparément dans l’analyse. Danzereu : tir normal seulement. Katapult : zéro dégât, son effet est un malus. Les zéros des soutiens ne mesurent pas leur valeur stratégique.', '',
  '| Unité | D1 | D2 | D3 | D4 | D5 | D6 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...units.map((u) => `| ${u.name} | ${u.damageByDefense.map(fr).join(' | ')} |`), '',
  '## Matrice des 400 attaques', '',
  '[Télécharger le CSV](attaques.csv). Une ligne = un attaquant et une cible à ses R initiaux, y compris confrontations au sein d’une même faction. Les probabilités sont des nombres entre 0 et 1.', '',
  '- `expectedHits` : touches moyennes, même si elles sont ensuite converties en malus.',
  '- `expectedDamage` : R perdus en moyenne, plafonnés aux R initiaux de cette cible.',
  '- `destroyProbability` : probabilité de retirer tous les R de cette cible en **une attaque**, jamais probabilité de gagner un duel ou une partie.',
  '- `statusProbability` : probabilité que Pluie de gobs applique son malus.',
  '- `condition` : hypothèse de l’attaque ; la cible est supposée légale, à portée et disponible.', '',
  '- `ruleset` : version des règles de probabilité utilisée pour cette ligne.',
  '- `pdfExpectedDamage` / `pdfDestroyProbability` : comparaison avec les règles `(r)` du PDF, utilisées dans le premier calcul. Les profils et autres hypothèses restent identiques.', '',
  `${matchups.filter((row) => Math.abs(row.expectedHits - row.pdfReference.expectedHits) > 1e-12).length} couples sur 400 changent de moyenne de touches par rapport au PDF. Il s’agit toujours des mêmes 400 situations, pas de nouvelles parties.`, '',
  'La matrice ne gère ni positions, ni actions restantes, ni combat simultané, ni portée, ni contrôle de zone, ni capacités conditionnelles hors Pluie de gobs. Elle ne constitue pas un moteur de jeu.', '',
].join('\n')

await mkdir(output, { recursive: true })
await writeFile(new URL('chiffres.md', output), markdown)
const columns = ['ruleset', 'attackerId', 'attacker', 'targetId', 'target', 'mode', 'condition', 'expectedHits', 'expectedDamage', 'destroyProbability', 'statusProbability', 'pdfExpectedDamage', 'pdfDestroyProbability']
const rows = matchups.map((row) => ({ ...row, pdfExpectedDamage: row.pdfReference.expectedDamage, pdfDestroyProbability: row.pdfReference.destroyProbability }))
await writeFile(new URL('attaques.csv', output), csv([columns, ...rows.map((row) => columns.map((key) => typeof row[key] === 'number' ? row[key].toFixed(8) : row[key]))]))
console.log(`${units.length} unités, ${matchups.length} attaques calculées dans ${fileURLToPath(output)}`)

import { catalogue2026, CATALOGUE_VERSION } from '../../shared/catalogue2026'
import { attackMetrics, hitProbability } from './metrics'

export const auditVersion = '2026-09-15-lot-1-adrien-01'
export const ruleset = 'adrien-01-sans-relances-tableau'
export const tableRerolls = false
export const units = catalogue2026.map((unit) => ({
  ...unit,
  // Uncapped expected damage against a hypothetical defense, not against a unit.
  damageByDefense: [1, 2, 3, 4, 5, 6].map((defense) => unit.profile.offense.score === null || unit.profile.ability?.id === 'goblin-rain'
    ? 0 : unit.profile.dice * hitProbability(unit.profile.offense.score, defense, tableRerolls)),
}))

export const matchups = units.flatMap((attacker) => units.map((target) => ({
  ruleset,
  attackerId: attacker.stableId, attacker: attacker.name,
  targetId: target.stableId, target: target.name,
  mode: attacker.profile.offense.kind,
  condition: attacker.profile.ability?.id === 'trollitude' ? 'Troll actif, résultat 4–5'
    : attacker.profile.ability?.id === 'green-line' ? 'Tir normal, sans Ligne Verte' : 'Profil sans bonus',
  ...attackMetrics(attacker.profile, target.profile, attacker.profile.dice, tableRerolls),
  // Keep the earlier mathematical reference directly comparable and reproducible.
  pdfReference: attackMetrics(attacker.profile, target.profile, attacker.profile.dice, true),
})))

export const numericReport = { auditVersion, ruleset, tableRerolls, catalogueVersion: CATALOGUE_VERSION, units, matchups }

import { hitRule } from '../../shared/battleEngine'
import type { UnitProfile } from '../../shared/unitProfile'

/** One attack, without position, orders, charge, retaliation or target selection. */
export function hitProbability(attack: number, defense: number, tableRerolls = true) {
  const rule = hitRule(attack, defense)
  const p = (7 - rule.threshold) / 6
  // Adrien Q7: evaluate the same thresholds without the table's (r) rules.
  // This switch belongs to the offline audit; the live game's helper is unchanged.
  if (!tableRerolls) return p
  return rule.reroll === 'fail' ? 1 - (1 - p) ** 2 : rule.reroll === 'success' ? p ** 2 : p
}

export function damageDistribution(dice: number, p: number) {
  if (!Number.isSafeInteger(dice) || dice < 0 || dice > 100 || !Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error('Invalid attack parameters')
  }
  let distribution = [1]
  for (let die = 0; die < dice; die++) {
    const next = Array(distribution.length + 1).fill(0) as number[]
    distribution.forEach((probability, hits) => {
      next[hits] += probability * (1 - p)
      next[hits + 1] += probability * p
    })
    distribution = next
  }
  return distribution
}

export function attackMetrics(profile: UnitProfile, target: UnitProfile, dice = profile.dice, tableRerolls = true) {
  if (profile.offense.score === null || profile.offense.kind === 'none') {
    return { expectedHits: 0, expectedDamage: 0, destroyProbability: 0, statusProbability: 0 }
  }
  const defense = profile.offense.kind === 'melee' ? target.defenseMelee : target.defenseRanged
  const distribution = damageDistribution(dice, hitProbability(profile.offense.score, defense, tableRerolls))
  const expectedHits = distribution.reduce((sum, probability, hits) => sum + probability * hits, 0)
  // Pluie de gobs replaces ALL damage with a temporary penalty.
  if (profile.ability?.id === 'goblin-rain') {
    return { expectedHits, expectedDamage: 0, destroyProbability: 0, statusProbability: 1 - distribution[0] }
  }
  return {
    expectedHits,
    expectedDamage: distribution.reduce((sum, probability, hits) => sum + probability * Math.min(hits, target.regiment), 0),
    destroyProbability: distribution.reduce((sum, probability, hits) => sum + (hits >= target.regiment ? probability : 0), 0),
    statusProbability: 0,
  }
}

import { describe, expect, it } from 'vitest'
import { catalogue2026 } from '../../shared/catalogue2026'
import { attackMetrics, damageDistribution, hitProbability } from './metrics'
import { matchups } from './report'

const unit = (id: string) => catalogue2026.find((u) => u.stableId === id)!.profile

describe('audit math, independently anchored to the PDF table p. 7', () => {
  it('matches all 36 printed cells, expressed as successes out of 36', () => {
    // Rows = defense, columns = attack. 2+(r) = 35/36, 6+(r) = 1/36.
    const table = [[18, 24, 30, 35, 35, 35], [12, 18, 24, 30, 35, 35], [6, 12, 18, 24, 30, 35],
      [6, 6, 12, 18, 24, 30], [1, 6, 6, 12, 18, 24], [1, 1, 6, 6, 12, 18]]
    table.forEach((row, d) => row.forEach((successes, a) => expect(hitProbability(a + 1, d + 1)).toBeCloseTo(successes / 36, 12)))
  })

  it('enumerates a two-die attack: four hit combinations, overkill capped at 1 R', () => {
    const archer = unit('gobelins-archers-gobelins')
    const result = attackMetrics(archer, archer)
    expect(damageDistribution(2, 0.5)).toEqual([0.25, 0.5, 0.25])
    expect(result.expectedHits).toBe(1)
    expect(result.expectedDamage).toBe(0.75)
    expect(result.destroyProbability).toBe(0.75)
  })

  it('removes both table rerolls in the Adrien scenario while preserving PDF results', () => {
    expect(hitProbability(1, 5, false)).toBeCloseTo(1 / 6)
    expect(hitProbability(6, 1, false)).toBeCloseTo(5 / 6)
    expect(hitProbability(1, 5, true)).toBeCloseTo(1 / 36)
    expect(hitProbability(6, 1, true)).toBeCloseTo(35 / 36)
    const archers = unit('gobelins-archers-gobelins')
    const trolls = unit('gobelins-meneurs-de-troll')
    const revised = attackMetrics(archers, trolls, 2, false)
    const original = attackMetrics(archers, trolls, 2, true)
    expect(revised.expectedHits).toBeCloseTo(1 / 3)
    expect(revised.destroyProbability).toBeCloseTo(1 / 36)
    expect(original.destroyProbability).toBeCloseTo(1 / 1296)
  })

  it('identifies the new reference in every exported pair and keeps the PDF comparison', () => {
    const row = matchups.find((m) => m.attackerId === 'gobelins-archers-gobelins' && m.targetId === 'gobelins-meneurs-de-troll')!
    expect(row.ruleset).toBe('adrien-01-sans-relances-tableau')
    expect(row.destroyProbability).toBeCloseTo(1 / 36)
    expect(row.pdfReference.destroyProbability).toBeCloseTo(1 / 1296)
    expect(matchups.every((m) => m.ruleset === row.ruleset)).toBe(true)
  })

  it('models Pluie de gobs as a penalty, and supports as unable to attack', () => {
    const target = unit('sephosi-epeistes-sephosiens')
    const rain = attackMetrics(unit('gobelins-katapult-a-gobs'), target)
    expect(rain.expectedDamage).toBe(0)
    expect(rain.destroyProbability).toBe(0)
    expect(rain.statusProbability).toBeCloseTo(5 / 6)
    expect(attackMetrics(unit('sephosi-marechal-vallardi'), target)).toEqual({ expectedHits: 0, expectedDamage: 0, destroyProbability: 0, statusProbability: 0 })
  })

  it('does not confuse T/DT with C/DC and never loses more R than a target has', () => {
    const target = unit('sephosi-lanciers-sephosiens')
    expect(attackMetrics(unit('gobelins-shaman-gobelin'), target).expectedHits).toBeCloseTo(0.5)
    expect(attackMetrics(unit('gobelins-blop-le-meuteur'), target).expectedHits).toBeCloseTo(2 / 3)
    expect(matchups).toHaveLength(400)
    expect(new Set(matchups.map((m) => `${m.attackerId}/${m.targetId}`)).size).toBe(400)
    for (const row of matchups) {
      expect(row.expectedDamage).toBeGreaterThanOrEqual(0)
      expect(row.expectedDamage).toBeLessThanOrEqual(unit(row.targetId).regiment + 1e-12)
      expect(row.destroyProbability).toBeGreaterThanOrEqual(0)
      expect(row.destroyProbability).toBeLessThanOrEqual(1 + 1e-12)
    }
  })
})

// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cells, isHome } from '../../shared/board'
import type { Seat } from '../../shared/board'
import { diceCount, hits, outnumbering, resolveCombat } from './combat'
import { buyOrder, inRange, playOrder, validateOrderZones } from './orders'
import { damage, finishTurn, makeUnit, scenario, scriptedDice, unit, victory } from './state'
import type { State } from './state'

const ids = {
  band: 'gobelins-troupe-de-gobelins', archers: 'gobelins-archers-gobelins', shaman: 'gobelins-shaman-gobelin',
  skrans: 'gobelins-chevaucheurs-de-skrans-gobelins', catapult: 'gobelins-katapult-a-gobs', troll: 'gobelins-meneurs-de-troll',
  chief: 'gobelins-bande-du-chef', danzereu: 'gobelins-le-danzereu', blop: 'gobelins-blop-le-meuteur',
  spears: 'sephosi-lanciers-sephosiens', swords: 'sephosi-epeistes-sephosiens', crossbow: 'sephosi-arbaletriers-avec-pavois',
  heavy: 'sephosi-cavalerie-lourde-sephosienne', mounted: 'sephosi-arbaletriers-montes-sephosiens',
  ballista: 'sephosi-balistes-sephosiennes', angels: 'sephosi-anges-protecteurs-de-la-sephosi',
  support: 'sephosi-aides-de-camp-sephosiens', vallardi: 'sephosi-marechal-vallardi', salamander: 'sephosi-regiment-de-la-salamandre',
} as const
const u = (id: string, type: keyof typeof ids, seat: Seat, cell: number | null) => makeUnit(id, ids[type], seat, cell)
const quiet = (s: State) => resolveCombat(s, { charges: [{ seat: s.initiative }, { seat: s.initiative === 0 ? 1 : 0 }], attacks: [] }, () => { throw new Error('Aucun dé attendu') })
const dice = (...faces: number[]) => scriptedDice(faces)
function consumed(d: ReturnType<typeof dice>) { expect(d.remaining()).toBe(0) }

describe('R — recrutement et ressources', () => {
  it('R01 — crédite exactement 3 points en 2/4/5, conserve le stock et alterne l’initiative', () => {
    let s = scenario([u('a', 'band', 0, 41), u('b', 'swords', 1, 12)])
    const pools = [s.players[0].recruitment]
    for (let turn = 2; turn <= 8; turn++) {
      s = finishTurn(quiet(s)); pools.push(s.players[0].recruitment)
      expect(s.initiative).toBe((turn - 1) % 2)
    }
    expect(pools).toEqual([0, 3, 3, 6, 9, 9, 9, 9])
    expect(finishTurn(quiet(s)).result).toEqual({ kind: 'draw' })
  })
  it('R02 — dépense six points accumulés avec un seul ordre', () => {
    const s = scenario([u('a', 'band', 0, 41), u('b', 'swords', 1, 12), u('t1', 'troll', 0, null), u('t2', 'troll', 0, null)], 4)
    s.players[0].recruitment = 6
    const next = playOrder(s, 0, { kind: 'recruitment', placements: [{ id: 't1', cell: 39 }, { id: 't2', cell: 40 }] })
    expect(next.players[0]).toMatchObject({ recruitment: 0, orders: 2, used: { recruitment: 1 } })
    expect(unit(next, 't2')).toMatchObject({ cell: 40, recruited: 4 })
    expect(unit(s, 't2').cell).toBeNull()
  })
  it('R03 — PS seuls autorisés, mais ne contournent ni les trois sélections ni le tour 1', () => {
    const s = scenario([u('a', 'band', 0, 41), u('b', 'swords', 1, 12), u('r', 'archers', 0, null)], 2)
    s.players[0].ps = 2
    const order = { kind: 'recruitment' as const, placements: [{ id: 'r', cell: 39 }], ps: 1 }
    expect(playOrder(s, 0, order).players[0]).toMatchObject({ recruitment: 0, ps: 1 })
    s.players[0].used.recruitment = 3
    expect(() => playOrder(s, 0, order)).toThrow('Stock')
    s.players[0].used.recruitment = 0; s.turn = 1
    expect(() => playOrder(s, 0, order)).toThrow('tour 1')
    expect(s.players[0].ps).toBe(2)
  })
  it('R04 — recrue autorisée à bouger, interdite de tir même avec Tir en mouvement', () => {
    const s = scenario([u('a', 'swords', 0, 41), u('b', 'band', 1, 21), u('r', 'mounted', 0, null)], 2)
    s.players[0].recruitment = 3
    const recruited = playOrder(s, 0, { kind: 'recruitment', placements: [{ id: 'r', cell: 39 }] })
    const moved = playOrder(recruited, 0, { kind: 'movement', moves: [{ id: 'r', to: 30 }] })
    expect(() => playOrder(moved, 0, { kind: 'shooting', shots: [{ attacker: 'r', target: 'b' }] }, () => 6)).toThrow('Tir interdit')
    const later = finishTurn(quiet(moved))
    expect(playOrder(later, 0, { kind: 'shooting', shots: [{ attacker: 'r', target: 'b' }] }, () => 6).units.find((x) => x.id === 'b')?.r).toBe(1)
  })
  it('R05 — Fureur paie les Anges et permet l’intrusion, sans ordre Recrutement commun', () => {
    const s = scenario([u('a', 'swords', 0, 41), u('b', 'band', 1, 0), u('angel', 'angels', 0, null)], 2)
    s.players[0].recruitment = 3; s.players[0].ps = 1; s.players[0].used.recruitment = 3
    const next = playOrder(s, 0, { kind: 'divine-fury', placements: [{ id: 'angel', cell: 12 }], ps: 1 })
    expect(next.players[0]).toMatchObject({ recruitment: 0, ps: 0, orders: 2, used: { recruitment: 3, 'divine-fury': 1 } })
    expect(victory(next)).toBeUndefined()
    expect(victory(next, true)).toEqual({ kind: 'win', seat: 0, reason: 'base' })
    const occupied = structuredClone(s); unit(occupied, 'b').cell = 13
    expect(unit(playOrder(occupied, 0, { kind: 'divine-fury', placements: [{ id: 'angel', cell: 12 }], ps: 1 }), 'angel').cell).toBe(12)
  })
  it('R06 — Vallardi apporte son ordre dès l’arrivée, le conserve à sa mort, puis le perd', () => {
    const s = scenario([u('a', 'swords', 0, 41), u('v', 'vallardi', 0, null), u('b', 'band', 1, 0)], 2)
    s.players[0].recruitment = 3
    const next = playOrder(s, 0, { kind: 'recruitment', placements: [{ id: 'v', cell: 39 }] })
    expect(next.players[0].orders).toBe(3) // 3 − recrutement + Stratège.
    damage(next, new Map([['v', 1]]))
    expect(next.players[0].orders).toBe(3)
    expect(next.players[0].vallardi).toBe(true)
    expect(finishTurn(quiet(next)).players[0]).toMatchObject({ orders: 3, vallardi: false })
  })
  it('R07 — les renforts créés dès le tour 1 ne prélèvent ni réserve ni points', () => {
    const s = scenario([u('a', 'band', 0, 41), u('reserve', 'band', 0, null), u('b', 'swords', 1, 12)])
    const next = playOrder(s, 0, { kind: 'goblin-reinforcements', cell: 40 })
    expect(next.units).toHaveLength(4)
    expect(unit(next, 'reserve').cell).toBeNull()
    expect(next.players[0]).toMatchObject({ recruitment: 0, orders: 2 })
    const full = scenario([...cells.filter((c) => isHome(c, 0)).map((c) => u(`g${c}`, 'band', 0, c)), u('b', 'swords', 1, 12)])
    expect(playOrder(full, 0, { kind: 'goblin-reinforcements', cell: null }).units).toHaveLength(19)
  })
  it('R08 — Blop payé crée ses Skrans une fois à son recrutement', () => {
    const s = scenario([u('a', 'band', 0, 41), u('blop', 'blop', 0, null), u('b', 'swords', 1, 12)], 2)
    s.players[0].recruitment = 3
    const order = { kind: 'recruitment' as const, placements: [{ id: 'blop', cell: 39 }], blop: { count: 2, cells: [40, 48] } }
    const next = playOrder(s, 0, order)
    expect(next.units.filter((x) => x.card === ids.skrans)).toHaveLength(2)
    expect(next.players[0].recruitment).toBe(1)
    next.players[0].recruitment = 3
    expect(() => playOrder(next, 0, order)).toThrow('réserve')
  })
  it('R09 — un même PS ne peut financer un ordre et une recrue', () => {
    const s = scenario([u('a', 'band', 0, 41), u('b', 'swords', 1, 12), u('r', 'band', 0, null)], 2)
    s.players[0].ps = 1
    const next = buyOrder(s, 0)
    expect(next.players[0]).toMatchObject({ ps: 0, orders: 4 })
    expect(() => playOrder(next, 0, { kind: 'recruitment', placements: [{ id: 'r', cell: 40 }], ps: 1 })).toThrow('Financement')
  })
})

describe('A — actions, portée, copies', () => {
  it.each([true, false])('A01 — Tir en mouvement consomme deux ordres, séquence tir en premier : %s', (shootFirst) => {
    let s = scenario([u('m', 'mounted', 0, 30), u('other', 'swords', 0, 31), u('b', 'chief', 1, 12)])
    const shot = { kind: 'shooting' as const, shots: [{ attacker: 'm', target: 'b' }] }
    const movement = { kind: 'movement' as const, moves: [{ id: 'm', to: 21 }, { id: 'other', to: 22 }] }
    s = playOrder(s, 0, shootFirst ? shot : movement, () => 6)
    s = playOrder(s, 0, shootFirst ? movement : shot, () => 6)
    expect(s.players[0].orders).toBe(1)
    expect(unit(s, 'other').cell).toBe(22)
    expect(unit(s, 'm')).toMatchObject({ moved: true, shot: true })
    expect(() => playOrder(s, 0, shot, () => 6)).toThrow('Tir interdit')
    expect(() => playOrder(s, 0, { kind: 'movement', moves: [{ id: 'm', to: 30 }] })).toThrow('Mouvement déjà')
  })
  it('A02 — une unité ordinaire ne cumule pas mouvement et tir', () => {
    const s = scenario([u('a', 'crossbow', 0, 30), u('b', 'chief', 1, 12)])
    const moved = playOrder(s, 0, { kind: 'movement', moves: [{ id: 'a', to: 21 }] })
    expect(() => playOrder(moved, 0, { kind: 'shooting', shots: [{ attacker: 'a', target: 'b' }] }, () => 6)).toThrow('Tir interdit')
    const shot = playOrder(s, 0, { kind: 'shooting', shots: [{ attacker: 'a', target: 'b' }] }, () => 1)
    expect(() => playOrder(shot, 0, { kind: 'movement', moves: [{ id: 'a', to: 21 }] })).toThrow('tir incompatible')
  })
  it('A03 — portée Manhattan, même axe, même zone possible et aucun écran d’unité', () => {
    const s = scenario([u('a', 'crossbow', 0, 30), u('screen', 'swords', 0, 21), u('b', 'chief', 1, 12)])
    expect(inRange(unit(s, 'a'), unit(s, 'b'))).toBe(true)
    expect(playOrder(s, 0, { kind: 'shooting', shots: [{ attacker: 'a', target: 'b' }] }, () => 6).units.find((x) => x.id === 'b')?.r).toBe(3)
    expect(inRange(u('a', 'archers', 0, 28), u('b', 'swords', 1, 29))).toBe(false)
    expect(inRange(u('a', 'archers', 0, 29), u('b', 'swords', 1, 32))).toBe(true)
    expect(inRange(u('a', 'archers', 0, 29), u('b', 'swords', 1, 15))).toBe(false)
    expect(inRange(u('a', 'ballista', 0, 39), u('b', 'band', 1, 3))).toBe(true)
  })
  it('A04 — un fantassin ne change pas d’axe ; Vol passe au-dessus d’un occupant', () => {
    const s = scenario([u('a', 'swords', 0, 28), u('fly', 'angels', 0, 30), u('b', 'band', 1, 21)])
    expect(() => playOrder(s, 0, { kind: 'movement', moves: [{ id: 'a', to: 29 }] })).toThrow('inaccessible')
    expect(unit(playOrder(s, 0, { kind: 'movement', moves: [{ id: 'fly', to: 12 }] }), 'fly').cell).toBe(12)
  })
  it('A05 — Appui couvre trois zones de niveaux différents, un stock et aucun budget multiplié', () => {
    const s = scenario([u('a', 'swords', 0, 41), u('p0', 'support', 0, 0), u('p2', 'support', 0, 8), u('b', 'band', 1, 12),
      u('r0', 'crossbow', 0, null), u('r1', 'crossbow', 0, null), u('r2', 'crossbow', 0, null)], 4)
    s.players[0].recruitment = 6
    const order = { kind: 'recruitment' as const, placements: [{ id: 'r1', cell: 39 }, { id: 'r0', cell: 45 }, { id: 'r2', cell: 43 }] }
    const next = playOrder(s, 0, order)
    expect(next.players[0]).toMatchObject({ orders: 2, recruitment: 0, used: { recruitment: 1 } })
    s.players[0].recruitment = 3
    expect(() => playOrder(s, 0, order)).toThrow('Financement')
    expect(() => validateOrderZones(s, 0, ['3-1', '4-1'])).toThrow('Une seule zone')
    expect(() => validateOrderZones(s, 0, ['3-1', '4-0', '3-2', '0-1'])).toThrow('Une seule zone')
    unit(s, 'p2').r = 0; unit(s, 'p2').cell = null
    expect(() => validateOrderZones(s, 0, ['3-1', '3-2'])).toThrow('Porte-ordres')
  })
  it('A06 — désengagement applique +2 aux résultats initiaux et relancés', () => {
    const s = scenario([u('a', 'chief', 0, 22), u('b', 'swords', 1, 23), u('c', 'spears', 1, 13)])
    s.engagements = [{ a: 'a', b: 'b' }, { a: 'a', b: 'c' }]
    const d = dice(1, 1, 1, 2, 1, 1)
    const next = playOrder(s, 0, { kind: 'movement', moves: [{ id: 'a', to: 21, freeAttacks: [
      { attacker: 'b', target: 'a', rerolls: [{ index: 0 }] }, { attacker: 'c', target: 'a' },
    ] }] }, d.roll)
    // C4/DC3 -> 3+: 1+2 hits, rerolled 2+2 hits; C3/DC3 -> 4+: 1+2 misses.
    expect(unit(next, 'a')).toMatchObject({ r: 2, cell: 21 })
    expect(next.engagements).toEqual([]); consumed(d)
  })
  it('A07 — Repli déplace directement sans riposte ni second Mouvement', () => {
    const s = scenario([u('a', 'swords', 0, 22), u('b', 'band', 1, 23)])
    s.engagements = [{ a: 'a', b: 'b' }]
    const next = playOrder(s, 0, { kind: 'strategic-retreat', moves: [{ id: 'a', to: 21 }] })
    expect(unit(next, 'a')).toMatchObject({ r: 3, cell: 21, moved: true })
    expect(next.players[0].orders).toBe(2)
    expect(() => playOrder(next, 0, { kind: 'movement', moves: [{ id: 'a', to: 30 }] })).toThrow('Mouvement déjà')
  })
})

describe('C — combat simultané et relances', () => {
  it('C01 — une charge mortelle n’annule pas la riposte ; destruction mutuelle = égalité', () => {
    const s = scenario([u('g', 'band', 0, 22), u('s', 'swords', 1, 23)])
    unit(s, 's').r = 1
    const d = dice(6, 6, 6, 6, 6)
    const next = resolveCombat(s, { charges: [{ seat: 0, attack: { attacker: 'g', target: 's' } }, { seat: 1 }, { seat: 0 }], attacks: [{ attacker: 's', target: 'g' }] }, d.roll)
    expect(next.result).toEqual({ kind: 'draw' }); expect(next.units.every((x) => x.r === 0)).toBe(true)
    consumed(d) // Les Epéistes blessés lancent encore les trois dés du profil.
  })
  it('C02 — la charge engage sans déplacer et consomme l’unique attaque', () => {
    const s = scenario([u('g', 'band', 0, 22), u('s', 'swords', 1, 23)])
    const plan = { charges: [{ seat: 0 as const, attack: { attacker: 'g', target: 's' } }, { seat: 1 as const }, { seat: 0 as const }], attacks: [{ attacker: 's', target: 'g' }] }
    const next = resolveCombat(s, plan, () => 1)
    expect(unit(next, 'g').cell).toBe(22)
    expect(next.engagements).toEqual([{ a: 'g', b: 's' }])
    expect(() => resolveCombat(s, { ...plan, attacks: [...plan.attacks, { attacker: 'g', target: 's' }] }, () => 1)).toThrow('Une attaque')
  })
  it('C03 — passer les charges est définitif, et l’alternance est vérifiée', () => {
    const s = scenario([u('g', 'band', 0, 22), u('s', 'swords', 1, 23)])
    expect(() => resolveCombat(s, { charges: [{ seat: 0 }, { seat: 1, attack: { attacker: 's', target: 'g' } }, { seat: 0 }], attacks: [] }, () => 1)).toThrow('passage définitif')
    expect(() => resolveCombat(s, { charges: [{ seat: 1 }], attacks: [] }, () => 1)).toThrow('Alternance')
  })
  it('C04 — surnombre sur le groupe relié, une allocation par attaquant', () => {
    const s = scenario([u('g1', 'band', 0, 21), u('g2', 'band', 0, 13), u('g3', 'band', 0, 23), u('s1', 'swords', 1, 22), u('s2', 'swords', 1, 14)])
    s.engagements = [{ a: 'g1', b: 's1' }, { a: 'g2', b: 's1' }, { a: 'g2', b: 's2' }, { a: 'g3', b: 's2' }]
    expect(['g1', 'g2', 'g3'].map((id) => outnumbering(s, id))).toEqual([1, 1, 1])
    expect(outnumbering(s, 's2')).toBe(0)
    const d = dice(6, 2, 1)
    expect(hits(d.roll, 2, 3, 3, [{ index: 0 }], 1).hits).toBe(0) // Relancer une réussite est légal.
    consumed(d)
    expect(() => hits(() => 6, 2, 3, 3, [{ index: 0 }, { index: 0 }], 2)).toThrow('Relances')
  })
  it('C05 — une charge supplémentaire peut viser un ennemi déjà engagé', () => {
    const s = scenario([u('g1', 'band', 0, 21), u('g2', 'band', 0, 13), u('s', 'swords', 1, 22)])
    s.engagements = [{ a: 'g1', b: 's' }]
    const next = resolveCombat(s, { charges: [{ seat: 0, attack: { attacker: 'g2', target: 's', rerolls: [{ index: 0 }] } }, { seat: 1 }, { seat: 0 }],
      attacks: [{ attacker: 'g1', target: 's', rerolls: [{ index: 0 }] }, { attacker: 's', target: 'g1' }] }, () => 1)
    expect(next.engagements).toHaveLength(2)
  })
  it.each([['heavy', 'swords', 4], ['heavy', 'spears', 1], ['angels', 'swords', 2]] as const)('C06 — bonus de charge %s contre %s : %i dés', (a, b, count) => {
    const s = scenario([u('a', a, 0, 22), u('b', b, 1, 23)])
    unit(s, 'a').moved = true
    const d = scriptedDice(Array(count + (b === 'spears' ? 2 : 3)).fill(1))
    resolveCombat(s, { charges: [{ seat: 0, attack: { attacker: 'a', target: 'b' } }, { seat: 1 }, { seat: 0 }], attacks: [{ attacker: 'b', target: 'a' }] }, d.roll)
    consumed(d)
  })
  it('C07 — les relances du tableau sont supprimées, avec seuils conservés', () => {
    const high = dice(1), low = dice(6)
    expect(hits(high.roll, 1, 6, 1).hits).toBe(0)
    expect(hits(low.roll, 1, 1, 6).hits).toBe(1)
    consumed(high); consumed(low)
  })
  it('C08 — aucune riposte inventée pour T et les unités sans attaque', () => {
    for (const target of ['crossbow', 'support', 'vallardi'] as const) {
      const s = scenario([u('g', 'band', 0, 22), u('s', target, 1, 23)])
      const d = dice(1, 1)
      resolveCombat(s, { charges: [{ seat: 0, attack: { attacker: 'g', target: 's' } }, { seat: 1 }, { seat: 0 }], attacks: [] }, d.roll)
      consumed(d)
    }
  })
})

describe('S — capacités et ordres de faction', () => {
  it('S01 — Trollitude est individuel au début du combat, sans annuler un mouvement antérieur', () => {
    const s = scenario([u('t1', 'troll', 0, 22), u('t2', 'troll', 0, 31), u('ally', 'band', 0, 21), u('enemy', 'swords', 1, 23)])
    unit(s, 't2').moved = true
    s.engagements = [{ a: 't1', b: 'enemy' }]
    const d = dice(1, 2, 6, 6, 1, 1, 1) // Deux Trollitude, attaque alliée, puis Epéistes.
    const next = resolveCombat(s, { trollTargets: { t1: 'ally' }, charges: [{ seat: 0 }, { seat: 1 }], attacks: [{ attacker: 'enemy', target: 't1' }] }, d.roll)
    expect(unit(next, 'ally').r).toBe(0)
    expect(unit(next, 't2')).toMatchObject({ cell: 31, moved: true })
    consumed(d)
  })
  it('S02 — Trollitude 1 sans allié ne fait rien ; sur 6 le Troll obtient un dé', () => {
    const s = scenario([u('t', 'troll', 0, 22), u('b', 'swords', 1, 23)])
    s.engagements = [{ a: 't', b: 'b' }]
    const idle = dice(1, 1, 1, 1)
    resolveCombat(s, { charges: [{ seat: 0 }, { seat: 1 }], attacks: [{ attacker: 'b', target: 't' }] }, idle.roll)
    consumed(idle)
    const active = dice(6, 1, 1, 1, 1, 1, 1)
    resolveCombat(s, { charges: [{ seat: 0 }, { seat: 1 }], attacks: [{ attacker: 'b', target: 't' }, { attacker: 't', target: 'b' }] }, active.roll)
    consumed(active)
  })
  it('S03 — Invokation compte les autres Shamans depuis le lanceur, puis sacrifie ce qui reste', () => {
    const s = scenario([u('caster', 'shaman', 0, 30), u('helper', 'shaman', 0, 39), u('b', 'swords', 1, 21)])
    const d = dice(6, 6, 1) // Deux dés de tir PUIS conséquence imposant deux sacrifices.
    const next = playOrder(s, 0, { kind: 'shamanic-invocation', shot: { attacker: 'caster', target: 'b' }, sacrifices: ['helper'] }, d.roll)
    expect(unit(next, 'b').r).toBe(1)
    expect(unit(next, 'helper').r).toBe(0)
    expect(unit(next, 'caster').r).toBe(1)
    consumed(d)
  })
  it('S04 — Invokation seul garde son dé sans sacrifice impossible ; un Shaman hors axe ne donne aucun dé', () => {
    const s = scenario([u('caster', 'shaman', 0, 29), u('far', 'shaman', 0, 28), u('b', 'swords', 1, 20)])
    const d = dice(6, 5)
    const next = playOrder(s, 0, { kind: 'shamanic-invocation', shot: { attacker: 'caster', target: 'b' }, sacrifices: [] }, d.roll)
    expect(unit(next, 'b').r).toBe(2); consumed(d)
    s.units = s.units.filter((x) => x.id !== 'far')
    const alone = dice(6, 1)
    expect(unit(playOrder(s, 0, { kind: 'shamanic-invocation', shot: { attacker: 'caster', target: 'b' }, sacrifices: [] }, alone.roll), 'b').r).toBe(2)
    consumed(alone)
  })
  it('S05 — Invokation sur 6 répète l’attaque seule et s’arrête si la cible est morte', () => {
    const s = scenario([u('caster', 'shaman', 0, 30), u('b', 'swords', 1, 21)])
    const d = dice(6, 6, 6)
    const order = { kind: 'shamanic-invocation' as const, shot: { attacker: 'caster', target: 'b' }, sacrifices: [] }
    expect(unit(playOrder(s, 0, order, d.roll), 'b').r).toBe(1); consumed(d)
    unit(s, 'b').r = 1
    const dead = dice(6, 6)
    expect(unit(playOrder(s, 0, order, dead.roll), 'b').r).toBe(0); consumed(dead)
    const wrong = scenario([u('caster', 'shaman', 0, 30), u('helper', 'shaman', 0, 39), u('b', 'swords', 1, 21)])
    expect(() => playOrder(wrong, 0, { ...order, sacrifices: ['caster'] }, dice(1, 1, 2).roll)).toThrow('Sacrifices')
  })
  it('S06 — Pause-déjeuner soigne une fois chaque Troll au-delà des R initiaux', () => {
    const s = scenario([u('t1', 'troll', 0, 22), u('g1', 'archers', 0, 21), u('t2', 'troll', 0, 31), u('g2', 'shaman', 0, 30), u('b', 'swords', 1, 12)])
    const next = playOrder(s, 0, { kind: 'lunch-break', pairs: [{ troll: 't1', sacrifice: 'g1' }, { troll: 't2', sacrifice: 'g2' }] })
    expect([unit(next, 't1').r, unit(next, 't2').r]).toEqual([3, 3])
    expect([unit(next, 'g1').r, unit(next, 'g2').r]).toEqual([0, 0])
    expect(next.players[0].orders).toBe(2)
    expect(() => playOrder(s, 0, { kind: 'lunch-break', pairs: [{ troll: 't1', sacrifice: 'g1' }, { troll: 't1', sacrifice: 'g2' }] })).toThrow('multiple')
    expect(() => playOrder(s, 0, { kind: 'lunch-break', pairs: [{ troll: 't1', sacrifice: 't2' }] })).toThrow('Sacrifice')
  })
  it('S07 — Pluie cumule les malus sans dégâts, après les autres effets, avec plancher zéro', () => {
    const s = scenario([u('c1', 'catapult', 0, 30), u('c2', 'catapult', 0, 31), u('b', 'swords', 1, 22)])
    unit(s, 'c1').doubled = true
    const d = dice(6, 6, 6)
    const next = playOrder(s, 0, { kind: 'artillery', shots: [{ attacker: 'c1', target: 'b' }, { attacker: 'c2', target: 'b' }] }, d.roll)
    expect(unit(next, 'b')).toMatchObject({ r: 3, rain: 4 }) // Deux touches d’une Katapult = un seul malus.
    expect(diceCount(next, unit(next, 'b'), unit(next, 'c1'))).toBe(0)
    unit(next, 'b').doubled = true
    expect(diceCount(next, unit(next, 'b'), unit(next, 'c1'))).toBe(2) // 3 × 2 − 4.
    const later = finishTurn(quiet(next))
    expect(unit(later, 'b')).toMatchObject({ rain: 0, doubled: false }); consumed(d)
  })
  it('S08 — Tir concentré inclut l’artillerie et tous les tireurs de la zone pour un ordre', () => {
    const s = scenario([u('a', 'crossbow', 0, 30), u('c', 'ballista', 0, 31), u('b', 'chief', 1, 22)])
    const d = dice(6, 6, 6, 6, 6)
    const order = { kind: 'concentrated-fire' as const, shots: [{ attacker: 'a', target: 'b' }, { attacker: 'c', target: 'b' }] }
    const next = playOrder(s, 0, order, d.roll)
    expect(unit(next, 'b').r).toBe(0)
    expect(next.players[0]).toMatchObject({ orders: 2, used: { 'concentrated-fire': 1 } })
    expect(unit(next, 'a').shot && unit(next, 'c').shot).toBe(true); consumed(d)
    unit(s, 'b').r = 1
    const overkill = dice(6, 6, 6, 6, 6)
    playOrder(s, 0, order, overkill.roll); consumed(overkill)
    unit(s, 'c').cell = 40
    expect(() => playOrder(s, 0, order, () => 6)).toThrow('Une seule zone')
  })
  it('S09 — Salamandre protège aussi les tirs et son bonus survit à sa mort jusqu’à la fin du tour', () => {
    const s = scenario([u('s', 'salamander', 0, 22), u('a', 'crossbow', 0, 30), u('g', 'band', 1, 23), u('target', 'chief', 1, 21)])
    s.engagements = [{ a: 's', b: 'g' }]
    const next = playOrder(s, 0, { kind: 'protect-salamander', salamander: 's' })
    expect(diceCount(next, unit(next, 's'), unit(next, 'g'))).toBe(3)
    damage(next, new Map([['s', 3]]))
    const d = dice(6, 6, 6, 6)
    const shot = playOrder(next, 0, { kind: 'shooting', shots: [{ attacker: 'a', target: 'target' }] }, d.roll)
    expect(unit(shot, 'target').r).toBe(1); consumed(d)
    const later = finishTurn(quiet(shot))
    expect(diceCount(later, unit(later, 'a'), unit(later, 'target'))).toBe(2)
  })
  it('S10 — Tir en mêlée redirige les dés avant de toucher, vers l’allié choisi', () => {
    const s = scenario([u('a', 'archers', 0, 30), u('ally', 'band', 0, 22), u('other', 'troll', 0, 14), u('enemy', 'swords', 1, 23)])
    s.engagements = [{ a: 'ally', b: 'enemy' }, { a: 'other', b: 'enemy' }]
    const d = dice(2, 5, 4, 4) // Un dé sur l’allié, un sur l’ennemi, puis deux touches.
    const next = playOrder(s, 0, { kind: 'shooting', shots: [{ attacker: 'a', target: 'enemy', friendlyTarget: 'ally' }] }, d.roll)
    expect(unit(next, 'ally').r).toBe(1) // T1/DT1 : 4 touche.
    expect(unit(next, 'enemy').r).toBe(3) // T1/DT3 : 4 échoue.
    expect(unit(next, 'other').r).toBe(2); consumed(d)
  })
  it('S11 — Ligne Verte progresse verticalement avec bonus cumulés et s’arrête au vide', () => {
    const s = scenario([u('d', 'danzereu', 0, 39), u('offering', 'band', 0, 40), u('a', 'swords', 1, 30), u('b', 'swords', 1, 21), u('far', 'swords', 1, 3)])
    const d = dice(4, 1, 3, 1, 1) // T3/DC? DT3 -> 4+, puis T4/DT3 -> 3+.
    const next = playOrder(s, 0, { kind: 'green-line', caster: 'd', sacrifice: 'offering' }, d.roll)
    expect([unit(next, 'a').r, unit(next, 'b').r, unit(next, 'far').r]).toEqual([2, 2, 3])
    expect(unit(next, 'offering').r).toBe(0); consumed(d)
    const miss = dice(1, 1)
    expect(unit(playOrder(s, 0, { kind: 'green-line', caster: 'd', sacrifice: 'offering' }, miss.roll), 'b').r).toBe(3)
    consumed(miss)
  })
  it('S12 — Ligne Verte atteint les unités engagées et propage un dégât aux voisins sur un 6', () => {
    const s = scenario([u('d', 'danzereu', 0, 39), u('offering', 'band', 0, 40), u('ally', 'band', 0, 31), u('target', 'swords', 1, 30)])
    s.engagements = [{ a: 'ally', b: 'target' }]
    const d = dice(6, 1)
    const next = playOrder(s, 0, { kind: 'green-line', caster: 'd', sacrifice: 'offering' }, d.roll)
    expect(unit(next, 'target').r).toBe(2)
    expect(unit(next, 'ally').r).toBe(1); consumed(d)
  })
  it('S13 — Gross Invokation touche toute la faction sauf les Trolls, selon le résultat et l’axe', () => {
    const s = scenario([u('shaman', 'shaman', 0, 39), u('archer', 'archers', 0, 40), u('troll', 'troll', 0, 41), u('flank', 'skrans', 0, 36), u('b', 'swords', 1, 12)])
    const loss = playOrder(s, 0, { kind: 'great-invocation', shaman: 'shaman' }, () => 2)
    expect([unit(loss, 'shaman').r, unit(loss, 'archer').r, unit(loss, 'troll').r, unit(loss, 'flank').r]).toEqual([0, 0, 2, 2])
    const buff = playOrder(s, 0, { kind: 'great-invocation', shaman: 'shaman' }, () => 6)
    expect(['shaman', 'archer', 'troll', 'flank'].map((id) => unit(buff, id).doubled)).toEqual([true, true, false, true])
  })
})

describe('V — contrôle et victoire', () => {
  it('V01 — la réserve ne protège pas de l’élimination ; deux plateaux vides donnent égalité', () => {
    const s = scenario([u('g', 'band', 0, null), u('s', 'swords', 1, 12)])
    expect(victory(s)).toEqual({ kind: 'win', seat: 1, reason: 'elimination' })
    unit(s, 's').cell = null
    expect(victory(s)).toEqual({ kind: 'draw' })
  })
  it('V02 — les soutiens non offensifs contrôlent ; un ennemi engagé ne conteste pas', () => {
    const s = scenario([u('p', 'support', 0, 21), u('front', 'swords', 0, 31), u('b', 'band', 1, 22)], 8)
    s.engagements = [{ a: 'front', b: 'b' }]
    s.players[1].ps = 20
    expect(victory(s, true)).toEqual({ kind: 'win', seat: 0, reason: 'control' })
    s.engagements = []
    expect(victory(s, true)).toEqual({ kind: 'draw' })
  })
  it('V03 — les intrusions mutuelles continuent avant le tour 8 puis donnent égalité', () => {
    const s = scenario([u('g', 'band', 0, 12), u('s', 'swords', 1, 39)], 7)
    expect(victory(s, true)).toBeUndefined()
    s.turn = 8
    expect(victory(s, true)).toEqual({ kind: 'draw' })
  })
  it('V04 — les PS de contrôle arrivent en fin de tour et financent le suivant', () => {
    const s = scenario([u('g', 'band', 0, 21), u('s', 'swords', 1, 0)])
    expect(s.players[0].ps).toBe(0)
    const next = finishTurn(quiet(s))
    expect(next.players[0]).toMatchObject({ ps: 1, orders: 3 })
    expect(buyOrder(next, 0).players[0]).toMatchObject({ ps: 0, orders: 4 })
  })
})

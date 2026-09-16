import { deckRuleIssues, preparationBudgetError } from '../../shared/armyRules'
import { canDeployUnit, cells, initialSetup, preparationCapacityError } from '../../shared/board'
import type { GameSetup, Seat } from '../../shared/board'
import { ability, card, makeUnit, requireRule, scenario } from './state'
import type { State } from './state'

export type Deck = { id: string; name: string; entries: { card: string; quantity: number; deployed: number }[] }
const g = (slug: string) => `gobelins-${slug}`
const se = (slug: string) => `sephosi-${slug}`
export const calibrationDecks: Deck[] = [0, 3, 6].map((skrans) => ({
  id: `gobelins-${skrans}-skrans`, name: `Gobelins · ${skrans} Skrans`, entries: [
    { card: g('bande-du-chef'), quantity: 4, deployed: 3 },
    { card: g('archers-gobelins'), quantity: 6, deployed: 4 },
    { card: g('troupe-de-gobelins'), quantity: 15 - skrans, deployed: 8 - skrans },
    ...(skrans ? [{ card: g('chevaucheurs-de-skrans-gobelins'), quantity: skrans, deployed: skrans }] : []),
  ],
}))
calibrationDecks.push({ id: 'sephosi-reference', name: 'Sephosi · référence', entries: [
  { card: se('epeistes-sephosiens'), quantity: 3, deployed: 2 },
  { card: se('lanciers-sephosiens'), quantity: 2, deployed: 1 },
  { card: se('arbaletriers-avec-pavois'), quantity: 3, deployed: 2 },
  { card: se('cavalerie-lourde-sephosienne'), quantity: 2, deployed: 2 },
  { card: se('arbaletriers-montes-sephosiens'), quantity: 2, deployed: 0 },
  { card: se('balistes-sephosiennes'), quantity: 1, deployed: 1 },
] })
calibrationDecks.push({ id: 'sephosi-infanterie', name: 'Sephosi · infanterie', entries: [
  { card: se('epeistes-sephosiens'), quantity: 5, deployed: 3 },
  { card: se('lanciers-sephosiens'), quantity: 4, deployed: 2 },
  { card: se('arbaletriers-avec-pavois'), quantity: 2, deployed: 2 },
  { card: se('balistes-sephosiennes'), quantity: 1, deployed: 1 },
] })
calibrationDecks.push({ id: 'sephosi-tir', name: 'Sephosi · tir', entries: [
  { card: se('epeistes-sephosiens'), quantity: 3, deployed: 1 },
  { card: se('lanciers-sephosiens'), quantity: 2, deployed: 2 },
  { card: se('arbaletriers-avec-pavois'), quantity: 6, deployed: 4 },
  { card: se('balistes-sephosiennes'), quantity: 3, deployed: 2 },
] })

export const goblinDecks = calibrationDecks.filter((deck) => card(deck.entries[0].card).faction === 'gobelins')
export const sephosiDecks = calibrationDecks.filter((deck) => card(deck.entries[0].card).faction === 'sephosi')

// These mechanics alone are admitted to this calibration campaign. The full
// scenario engine retains the other cards; refusing them prevents silent omissions.
const coveredAbilities = new Set([undefined, 'moving-shot', 'spear-wall', 'powerful-charge', 'melee-shooting', 'goblin-rain'])
export function validateDeck(deck: Deck) {
  requireRule(deck.entries.length > 0 && new Set(deck.entries.map((e) => e.card)).size === deck.entries.length, 'Deck vide ou carte dupliquée')
  requireRule(deck.entries.every((e) => Number.isInteger(e.quantity) && e.quantity > 0 && Number.isInteger(e.deployed) && e.deployed >= 0 && e.deployed <= e.quantity), 'Quantités invalides')
  requireRule(new Set(deck.entries.map((e) => card(e.card).faction)).size === 1, 'Deck de plusieurs factions')
  const entries = deck.entries.map((e) => ({ ...card(e.card), kind: 'unit' as const, quantity: e.quantity, selectedQuantity: e.deployed }))
  requireRule(!deckRuleIssues(entries).length, deckRuleIssues(entries).join(' '))
  requireRule(!preparationBudgetError(entries) && !preparationCapacityError(entries), 'Préparation illégale')
  requireRule(entries.every((e) => coveredAbilities.has(e.profile.ability?.id)), 'Carte hors du périmètre des robots de calibration')
  return entries
}
export const relativeCell = (seat: Seat, cell: number) => seat === 0 ? cell : 53 - cell

/** Private selections are validated before either side sees the opponent's deployment. */
export function prepareGame(decks: [Deck, Deck], initiative: Seat): State {
  decks.forEach(validateDeck)
  const units = decks.flatMap((deck, seat) => deck.entries.flatMap((e) => Array.from({ length: e.quantity }, (_, i) =>
    makeUnit(`${seat}:${e.card}:${i}`, e.card, seat as Seat, null))))
  const pending = decks.map((deck, seat) => deck.entries.flatMap((e) => Array.from({ length: e.deployed }, (_, i) => units.find((u) => u.id === `${seat}:${e.card}:${i}`)!)))
  const setup: GameSetup = initialSetup()
  let actor: Seat = initiative
  while (pending.some((list) => list.length)) {
    const list = pending[actor]
    if (list.length) {
      const u = list.shift()!
      const p = card(u.card).profile
      requireRule(!ability(u, 'packmaster'), 'Blop ne peut pas être déployé initialement')
      const artilleryOnly = decks[actor].entries.filter((e) => e.deployed).every((e) => card(e.card).profile.unitType === 'artillery')
      const remaining = list.filter((u) => card(u.card).profile.unitType === 'artillery').length
      // Same fixed formation for both seats: centre first, then balanced flanks;
      // ranged units prefer rear positions. No opponent reserve is inspected.
      const preferred = p.offense.kind === 'ranged' ? [48, 45, 53, 49, 46, 52, 47, 50, 51, 39, 36, 44, 40, 37, 43, 38, 41, 42]
        : [39, 36, 44, 40, 37, 43, 38, 41, 42, 48, 45, 53, 49, 46, 52, 47, 50, 51]
      const cell = preferred.map((c) => relativeCell(actor, c)).find((c) => canDeployUnit(c, actor, p, setup, artilleryOnly, remaining))
      requireRule(cell !== undefined && cells.includes(cell), 'Aucune case de déploiement légale')
      u.cell = cell
      setup.units.push({ seat: actor, cardStableId: u.card, cell })
    }
    actor = actor === 0 ? 1 : 0
  }
  const s = scenario(units)
  s.initiative = initiative
  return s
}

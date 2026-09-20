import type { UnitProfile } from './unitProfile'

// PAFF 2026 (3).pdf, received 2026-09-18, p. 9, and consolidated rulings.
// Creator rulings are recorded in docs/differences-regles-2026-09-18.md.
// IDs and descriptions travel with frozen game profiles.
export const unitAbilities = {
  strategicSupport: { id: 'strategic-support', name: 'Appui stratégique', description: 'Lorsque vous jouez un ordre dans un axe, vous pouvez également appliquer cet ordre dans un autre axe contenant un Porte-ordres Sephosiens.' },
  powerfulCharge: { id: 'powerful-charge', name: 'Charge puissante', description: 'Si cette unité s’est déplacée ce tour-ci, elle lance 3 dés supplémentaires en cas de charge, au lieu de 1.' },
  greenLine: { id: 'green-line', name: 'Ligne Verte', description: 'Au lieu de tirer, sacrifiez une unité gobeline alliée, hors Trolls et Djil, adjacente dans la même zone. Le sort commence à la première case de la zone suivante devant le Danzereu ; les cases de sa propre zone ne sont pas ciblées, même dans la zone centrale à deux rangées. Attaquez au tir sur une ligne verticale du même axe vers l’Arrière ennemi, quel que soit le camp des cibles. Après chaque attaque qui touche, attaquez la cible suivante avec +1 dé et +1 A cumulés. Arrêtez au premier emplacement vide ou à la première attaque sans touche. Au moins un 6 inflige aussi 1 point de R aux unités adjacentes à la cible dans sa zone ; le Danzereu ne peut pas être atteint par ces dégâts collatéraux. Les unités engagées en combat peuvent être ciblées.' },
  packmaster: { id: 'packmaster', name: 'Meuteur !', description: 'Cette unité ne peut pas être déployée avec l’armée initiale. Quand vous déployez Blop, le Meuteur, vous pouvez déployer gratuitement 1D3 unités de Chevaucheurs de Skrans.' },
  spearWall: { id: 'spear-wall', name: 'Mur de lance', description: 'Les unités chargeant cette unité ne bénéficient pas de dés supplémentaires.' },
  goblinRain: { id: 'goblin-rain', name: 'Pluie de gobs', description: 'Si cette unité touche une unité ennemie, la cible ne subit pas de dégâts, mais un malus de −2 aux dés durant ce tour. Ce malus ne s’applique pas aux unités alliées.' },
  strategist: { id: 'strategist', name: 'Stratège', description: 'Tant que Vallardi est déployé et vivant, vous pouvez sélectionner un ordre supplémentaire à chaque tour, y compris le tour de son recrutement. S’il est détruit, vous conservez cet ordre supplémentaire jusqu’à la fin du tour.' },
  meleeShooting: { id: 'melee-shooting', name: 'Tir en mêlée', description: 'Vous pouvez tirer sur une unité ennemie engagée avec une de vos unités. Avant les jets pour toucher, lancez autant de dés que de dés pour toucher. Chaque résultat de 3 ou moins attribue le dé pour toucher correspondant à votre unité, et non à l’unité ennemie.' },
  movingShot: { id: 'moving-shot', name: 'Tir en mouvement', description: 'Cette unité peut se déplacer et tirer dans un même tour.' },
  magicalShot: { id: 'magical-shot', name: 'Tir magique', description: 'L’unité ciblée ne peut pas utiliser de capacités pour se défendre et ne bénéficie pas des protections de décors.' },
  trollitude: { id: 'trollitude', name: 'Trollitude', description: 'Au début de la phase de combat, lancez un dé : 1, le Troll attaque une unité alliée adjacente ; 2–3, l’unité ne fait rien ; 4–5, elle attaque normalement ; 6, elle lance un dé supplémentaire pour attaquer.' },
  flight: { id: 'flight', name: 'Vol', description: 'Cette unité se déplace comme une unité de cavalerie et peut passer au-dessus des décors et des unités alliées ou ennemies.' },
} as const

export type UnitAbility = keyof typeof unitAbilities
export function hasUnitAbility(profile: UnitProfile | undefined, ability: UnitAbility) {
  return profile?.ability?.id === unitAbilities[ability].id
}

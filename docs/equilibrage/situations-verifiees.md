# Lot 2 — situations contrôlées

Ce document conserve la validation du socle au lot 2. Le [lot 3](campagne-calibration.md) ajoute depuis une orchestration de parties complètes sur un choix restreint de cartes, des robots et un rapport privé. Les limites propres aux capacités ci-dessous demeurent ; les descriptions « aucun bot » et « orchestration absente » concernent le périmètre historique du lot 2.

Référence **`paff-2026-09-15-adrien-03`**. Le moteur est dans [analysis/simulation](../../analysis/simulation/). Il reçoit une situation, des choix explicites et une séquence finie de dés. Il produit un nouvel état ; une action refusée ne modifie pas l’état fourni. Aucun hasard de remplacement, aucun bot, aucun compte utilisateur et aucun appel Convex.

Le but est de vérifier les règles avant de mesurer une force de faction. **44 cas automatiques** décrivent les résultats attendus ci-dessous. Les noms R/A/C/S/V se retrouvent directement dans [les tests](../../analysis/simulation/scenarios.test.ts). Les cas paramétrés A01 et C06 exécutent plusieurs variantes.

## Vérifications du socle

| Cas | Situation et résultat attendu |
| --- | --- |
| R01 | Huit tours sans recrutement : stock 0/3/3/6/9/9/9/9, initiative alternée, égalité terminale sans contrôle. |
| R02–R03 | Deux Trolls payés avec six points en un ordre ; recrutement uniquement avec PS permis, mais quatrième sélection et recrutement commun au tour 1 refusés. |
| R04 | Arbalétrier Monté recruté puis déplacé : tir refusé ce tour, autorisé au suivant. |
| R05 | Ange arrivé par Fureur : 3 points + 1 PS dépensés, stock Recrutement intact, Base Centre accessible même avec un ennemi dans la zone ; victoire évaluée seulement à la fin du tour. |
| R06 | Vallardi recruté : ordre reçu immédiatement et conservé après sa mort ; absent au tour suivant. |
| R07–R08 | Bande créée au tour 1 sans vider la réserve ; aucune création si camp plein ; Blop payé crée ses Skrans une fois. |
| R09 | Un PS transformé en ordre ne peut aussi payer une recrue. |
| A01–A02 | Mouvement puis Tir et ordre inverse coûtent chacun deux sélections pour les Montés ; les autres unités de la zone restent activables. Répétitions et combinaison ordinaire refusées. |
| A03–A04 | Portée Manhattan, même axe et même zone ; aucun écran d’unité au tir. Changement d’axe refusé au fantassin ; Vol survole une unité. |
| A05 | Appui recrute dans trois zones de niveaux différents : une sélection, paiement de toutes les recrues. Copie sans Porte-ordres, quatrième zone et deuxième zone du même axe refusées. |
| A06–A07 | Désengagement : +2 aux résultats initiaux et relancés. Repli : déplacement sans riposte, mouvement du tour consommé. |
| C01–C02 | Charge mortelle et riposte d’Epéistes blessés : tous les dés conservés, destruction simultanée donnant égalité. La charge ne déplace pas et ne permet pas une seconde attaque. |
| C03–C05 | Passage définitif, alternance des charges, ennemi déjà engagé ciblable. Réseau 3 contre 2 : une relance par attaquant majoritaire ; succès relançables, deuxième relance d’un dé refusée. |
| C06–C08 | Charge puissante : quatre dés après mouvement, un seul contre Mur de lance ; Vol n’ajoute pas de dé de Cavalerie. Pas de relances du tableau, ni attaque C pour les profils T/sans attaque. |

## Vérifications des capacités et victoires

| Cas | Situation et résultat attendu |
| --- | --- |
| S01–S02 | Deux Trolls tirent chacun leur comportement au début du combat ; attaque d’un allié sur 1, rien sans cible ou sur 2, trois dés sur 6. Le mouvement précédent reste effectué. |
| S03–S05 | Invokation : lanceur exclu du bonus/sacrifice, portée depuis lui, dés et dégâts avant conséquence. Un seul Shaman disponible sacrifié quand deux sont demandés ; bonus maintenu. Sur 6, répétition sans deuxième conséquence, omise si cible morte. |
| S06 | Deux Trolls soignés au-delà de leurs R initiaux avec deux sacrifices distincts ; deux soins du même Troll ou sacrifice d’un Troll refusés. |
| S07 | Deux Katapults imposent −4 dés et zéro dégât ; plusieurs touches d’une même attaque n’ajoutent qu’un malus. Doublement puis malus, minimum zéro, effets retirés au tour suivant. |
| S08 | Tir concentré : Arbalétriers + Baliste de la zone lancent 3 + 2 dés en un ordre. Une autre zone du même axe est refusée. |
| S09 | Bonus Salamandre accordé au tir même après sa mort ; exclut la Salamandre et expire à la fin du tour. |
| S10 | Tir en mêlée : redirections choisies avant les touches, destinataire allié choisi par son propriétaire et DT respectif appliqué. |
| S11–S12 | Ligne Verte : verticale, dés/A progressifs, arrêt au vide ou au tir raté ; cible engagée possible et dégâts adjacents sur un 6. |
| S13 | Gross Invokation affecte Shamans, Archers et Skrans, mais exclut les Trolls ; effets locaux ou globaux selon le résultat. |
| V01–V04 | Réserve sans plateau = défaite ; deux plateaux vides = égalité. Un soutien peut contrôler, un ennemi engagé ne conteste pas. Intrusions mutuelles : poursuivre avant 8, égalité à 8. Les PS arrivent en fin de tour et ne départagent pas la victoire. |

## Architecture et limites explicites

- `state.ts` : états en mémoire, référence de règles, unités/ressources, passage de tour, contrôle et victoire. Les vingt profils proviennent du catalogue existant.
- `orders.ts` : effets des ordres choisis, financement, portée, mouvement et capacités. La géométrie et les chemins réutilisent les fonctions pures existantes ; aucun code du site n’importe ce moteur.
- `combat.ts` : choix de charges/attaques, relances et accumulation des pertes de toute la phase avant application.
- `scenarios.test.ts` : décisions et faces de dés données explicitement, vérification des conséquences et de plusieurs refus. Le D3 de Blop est fourni directement comme résultat 1/2/3, sans inventer de tirage.
- `analysis/tsconfig.json` : vérification TypeScript stricte indépendante, intégrée à `npm run check`. Aucune dépendance ajoutée.

Le constructeur de scénario accepte **un instantané de plateau**, potentiellement au milieu d’une partie. Il ne valide pas les 33 points, la sélection initiale ou les quotas d’un deck. Le lot 3 applique ces contrôles séparément dans `decks.ts` avant une partie complète. Les instantanés de milieu de partie renseignent explicitement leurs ressources ; seul le passage de tour applique automatiquement les crédits 2/4/5.

Les modules du socle n’organisent pas eux-mêmes l’alternance des **ordres**, la préparation ou une partie complète : `game.ts` et `decks.ts` assurent désormais cette orchestration au lot 3. Les charges vérifient leur alternance et les passages définitifs. Pour un scénario isolé, le passage en combat reste choisi explicitement. Une séquence de dés d’une tentative invalide doit être rejouée depuis le début : seul l’état de jeu, pas le curseur du fournisseur de dés, est transactionnel.

Appui est exécutable pour Mouvement, Tir, Artillerie, Tir concentré et Recrutement/Fureur dans les zones indiquées. Le validateur commun impose trois axes maximum sans récursion ; **l’application des copies aux autres ordres de faction reste à raccorder**, bien que le droit de les copier soit acquis. Ne pas lancer un robot qui ignorerait ces options et présenter son résultat comme complet.

Quelques compositions demandent une vérification avant une campagne, au-delà des douze questions closes :

- Les charges sont lancées dans leur ordre de déclaration ; le surnombre utilise le réseau présent à ce moment, avec toutes les victimes encore présentes jusqu’à la fin du combat. Les tests couvrent la simultanéité des pertes ; un exemple joué avec le créateur devra confirmer le comptage lorsqu’une charge ultérieure agrandit ce réseau.
- Tir concentré est traité comme une salve : tous les tireurs annoncés lancent avant le retrait de la cible. Le cas de sur-dégâts est testé. Les tirs ordinaires sont résolus dans l’ordre fourni par le scénario.
- Les bonus de dés sont ajoutés avant un éventuel doublement, puis Pluie est soustraite. Seule la position finale de Pluie est explicitement arbitrée. **Ne pas interpréter les compositions doublement + autre bonus comme définitivement validées** ; les campagnes devront les isoler ou les faire préciser.
- Les pertes adjacentes de Ligne Verte sont appliquées à chaque cible ; si le lanceur meurt, le sort s’arrête. Cette interaction particulière reste une convention du prototype, pas un nouvel arbitrage du créateur.

Décors, interceptions par forêt, protections et effet des Ruines sont hors de ce socle sans décor. Aucun événement. Tir magique conserve son identité mais n’ajoute aucun effet en l’absence de protection concernée.

## Reproduire et interpréter

`npm run test:simulation` exécute ces situations. `npm run check` vérifie le lint, les types de l’analyse, tous les tests et le build du site. Les contrôles ne déploient rien.

**Validation historique du lot 2 :** `npm run check` réussi, avec **297 tests dans 27 fichiers**, dont les 44 situations de ce moteur ; lint, TypeScript strict de l’analyse et compilation du site réussis. Liens documentaires locaux et absence de références au moteur dans `src/`, `convex/` et `shared/` vérifiés. Les modules Convex étaient inchangés : aucun essai réseau ni déploiement n’avait été effectué à ce stade. Les contrôles du lot 3 sont consignés dans son rapport.

Les exemples prouvent les conséquences annoncées des règles dans les cas couverts. **Ils ne donnent ni taux de victoire de faction, ni verdict sur un deck.** La [méthode de campagnes](methode-simulations.md) décrit l’étape suivante et ses conditions de démarrage.

# Calculs de référence — lot 1

Rapport 2026-09-15-lot-1-adrien-01 · catalogue 2026-09-15. Généré par `node scripts/analyse-equilibrage.mjs` (Node 24).

Référentiel : **adrien-01-sans-relances-tableau**, lecture de la réponse Q7 d’Adrien : les seuils du tableau sont conservés, les relances des échecs et confirmations des réussites sont ignorées. Cette lecture est explicite et reste à confirmer si Adrien voulait seulement reporter la discussion des relances. Aucun changement de l’aide du site. Voir les [réponses reçues](retours-adrien-01.md).

Lire [l’analyse](analyse-unites.md) et [les hypothèses](audit-regles.md) avant d’interpréter ces chiffres. Aucune partie simulée, aucun joueur évalué.

## Probabilité de toucher avec un dé

Sans relance ni confirmation provenant du tableau. Les relances de surnombre ne sont pas modélisées dans une attaque isolée. Colonnes = attaque, lignes = défense. Valeurs en pourcentage.

| D \ A | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 50,000 | 66,667 | 83,333 | 83,333 | 83,333 | 83,333 |
| 2 | 33,333 | 50,000 | 66,667 | 83,333 | 83,333 | 83,333 |
| 3 | 16,667 | 33,333 | 50,000 | 66,667 | 83,333 | 83,333 |
| 4 | 16,667 | 16,667 | 33,333 | 50,000 | 66,667 | 83,333 |
| 5 | 16,667 | 16,667 | 16,667 | 33,333 | 50,000 | 66,667 |
| 6 | 16,667 | 16,667 | 16,667 | 16,667 | 33,333 | 50,000 |

## Les 20 profils

G = Gobelins ; S = Sephosi. R est le nombre de points de régiment, pas un jet de sauvegarde.

| Faction | Unité | Type | Coût | R | Dés | Attaque | DC | DT | Capacité |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: | ---: | --- |
| G | Bande de Gobelins | Troupe | 1 | 2 | 2 | C2 | 2 | 1 | — |
| G | Archers Gobelins | Tir | 1 | 1 | 2 | T1 | 1 | 1 | Tir en mêlée |
| G | Shamans Gobelins | Tir | 1 | 1 | 1 | T3 | 1 | 1 | Tir magique |
| G | Chevaucheurs de Skrans Gobelins | Cavalerie | 1 | 2 | 2 | C2 | 2 | 1 | — |
| G | Katapult à gobs | Artillerie | 2 | 1 | 1 | T5 | 1 | 1 | Pluie de gobs |
| G | Trolls | Élite | 3 | 2 | 2 | C4 | 5 | 5 | Trollitude |
| G | Gros tarrés de gobelins | Élite | 2 | 1 | 1 | C5 | 1 | 1 | — |
| G | Bande du chef | Élite | 3 | 5 | 4 | C3 | 3 | 2 | — |
| G | Le Danzereu | Unique | 2 | 1 | 2 | T3 | 1 | 1 | Ligne Verte |
| G | Blop, le Meuteur | Unique | 2 | 3 | 2 | C3 | 2 | 1 | Meuteur ! |
| S | Lanciers Sephosiens | Troupe | 3 | 3 | 2 | C3 | 4 | 3 | Mur de lance |
| S | Epéistes Sephosiens | Troupe | 3 | 3 | 3 | C4 | 3 | 3 | — |
| S | Arbalétriers Sephosiens | Tir | 2 | 2 | 2 | T3 | 1 | 2 | — |
| S | Cavalerie lourde Sephosienne | Cavalerie | 3 | 2 | 1 | C4 | 3 | 2 | Charge puissante |
| S | Arbalétriers Montés | Cavalerie | 2 | 1 | 1 | T3 | 1 | 1 | Tir en mouvement |
| S | Balistes Sephosiennes | Artillerie | 2 | 1 | 1 | T6 | 1 | 1 | — |
| S | Anges Protecteurs de la Sephosi | Élite | 4 | 2 | 2 | C4 | 3 | 2 | Vol |
| S | Porte-ordres Sephosiens | Élite | 2 | 1 | 0 | — | 1 | 1 | Appui stratégique |
| S | Maréchal Vallardi | Unique | 2 | 1 | 0 | — | 1 | 1 | Stratège |
| S | Régiment de la Salamandre | Unique | 4 | 3 | 3 | C4 | 4 | 4 | — |

## Dégâts moyens bruts d’une attaque

Sans plafonnement par les R de la cible, sans charge, surnombre, décor, ordre, sacrifice ou riposte. DC pour C, DT pour T. Les T ne combattent pas en mêlée. Défense 6 : repère théorique, aucun des 20 profils actuels ne la possède.

**Trolls : seulement une attaque normale, conditionnée au résultat 4–5 de Trollitude.** Leur moyenne par occasion de combat est calculée séparément dans l’analyse. Danzereu : tir normal seulement. Katapult : zéro dégât, son effet est un malus. Les zéros des soutiens ne mesurent pas leur valeur stratégique.

| Unité | D1 | D2 | D3 | D4 | D5 | D6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bande de Gobelins | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 | 0,333 |
| Archers Gobelins | 1,000 | 0,667 | 0,333 | 0,333 | 0,333 | 0,333 |
| Shamans Gobelins | 0,833 | 0,667 | 0,500 | 0,333 | 0,167 | 0,167 |
| Chevaucheurs de Skrans Gobelins | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 | 0,333 |
| Katapult à gobs | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 |
| Trolls | 1,667 | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 |
| Gros tarrés de gobelins | 0,833 | 0,833 | 0,833 | 0,667 | 0,500 | 0,333 |
| Bande du chef | 3,333 | 2,667 | 2,000 | 1,333 | 0,667 | 0,667 |
| Le Danzereu | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 |
| Blop, le Meuteur | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 |
| Lanciers Sephosiens | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 |
| Epéistes Sephosiens | 2,500 | 2,500 | 2,000 | 1,500 | 1,000 | 0,500 |
| Arbalétriers Sephosiens | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 | 0,333 |
| Cavalerie lourde Sephosienne | 0,833 | 0,833 | 0,667 | 0,500 | 0,333 | 0,167 |
| Arbalétriers Montés | 0,833 | 0,667 | 0,500 | 0,333 | 0,167 | 0,167 |
| Balistes Sephosiennes | 0,833 | 0,833 | 0,833 | 0,833 | 0,667 | 0,500 |
| Anges Protecteurs de la Sephosi | 1,667 | 1,667 | 1,333 | 1,000 | 0,667 | 0,333 |
| Porte-ordres Sephosiens | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 |
| Maréchal Vallardi | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 | 0,000 |
| Régiment de la Salamandre | 2,500 | 2,500 | 2,000 | 1,500 | 1,000 | 0,500 |

## Matrice des 400 attaques

[Télécharger le CSV](attaques.csv). Une ligne = un attaquant et une cible à ses R initiaux, y compris confrontations au sein d’une même faction. Les probabilités sont des nombres entre 0 et 1.

- `expectedHits` : touches moyennes, même si elles sont ensuite converties en malus.
- `expectedDamage` : R perdus en moyenne, plafonnés aux R initiaux de cette cible.
- `destroyProbability` : probabilité de retirer tous les R de cette cible en **une attaque**, jamais probabilité de gagner un duel ou une partie.
- `statusProbability` : probabilité que Pluie de gobs applique son malus.
- `condition` : hypothèse de l’attaque ; la cible est supposée légale, à portée et disponible.

- `ruleset` : version des règles de probabilité utilisée pour cette ligne.
- `pdfExpectedDamage` / `pdfDestroyProbability` : comparaison avec les règles `(r)` du PDF, utilisées dans le premier calcul. Les profils et autres hypothèses restent identiques.

98 couples sur 400 changent de moyenne de touches par rapport au PDF. Il s’agit toujours des mêmes 400 situations, pas de nouvelles parties.

La matrice ne gère ni positions, ni actions restantes, ni combat simultané, ni portée, ni contrôle de zone, ni capacités conditionnelles hors Pluie de gobs. Elle ne constitue pas un moteur de jeu.

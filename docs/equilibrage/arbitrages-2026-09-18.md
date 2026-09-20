# Réponses du créateur — après le lot B, 18 septembre 2026

Source : réponses transmises directement par Nicolas dans la conversation de travail, après les lots A/B. Elles remplacent les quatre hypothèses du PDF reçu le 18 septembre. La question de géométrie posée ensuite est résolue par le vocal fourni par Nicolas dans la même conversation.

## 1. Tir concentré — confirmé

> Il faut plusieurs unités qui tir dans la zone pour bénéficier de tir concentré. Une seule ne suffit pas.

Au moins **deux tireurs éligibles dans chaque zone activée**, artillerie comprise, tirent sur la même cible avec +1 dé chacun. Un tireur dans deux zones différentes ne constitue pas un groupe de deux ; Appui stratégique ne dispense pas une zone copiée de cette condition. Un tireur seul conserve son Tir/Tir Artillerie ordinaire, sans ce bonus.

Le moteur refuse une salve isolée avant de lancer les dés ; V2 adaptée et V3 ne la proposent plus. Les contrôles couvrent aussi les copies Appui et le cas où le second tireur a déjà tiré.

## 2. Djil — confirmé

> Djil n'a pas Trollitude. Il est considéré comme une unité de trolls, et donc pas de gobelins. Ainsi il ne bénéficie pas des effets de la gross invokation et ne peut pas etre sacrifié avec ligne verte.

Le comportement déjà implémenté est confirmé : pas de jet de Trollitude pour Djil, ni pertes ni doublement de La gross Invokation, ni sacrifice avec Ligne Verte ou Pause-déjeuner. Son exclusion des soins de Pause-déjeuner reste celle du PDF. Il appartient toujours à la **faction** Gobelins pour le deck ; la distinction Troll/Gobelin concerne ici les effets.

## 3. La gross Invokation et Pluie — confirmé

> ça double uniquement les dés du profil de l'unité.
> Le malus de pluie de gob ne s'applioque qu'aux unités ennemies et non aux unités alliés, donc pas de sujet.

Calcul : **dés du profil × 2 + dés supplémentaires − malus ennemis éventuels**, minimum zéro. Les dés de charge, d’Invokation shamanique ou de progression de Ligne Verte ne sont pas doublés. Aucun changement du seuil de touche.

Pluie ne touche que les ennemis du propriétaire de la Katapult, sans blessures directes ; les alliés restent indemnes. Deux joueurs de faction Gobelins restent adversaires : le calcul demeure défini dans ce miroir, sans convertir Pluie en malus allié.

## 4. Ligne Verte — précisée par le vocal

Réponse écrite initiale :

> Le Danzereu ne peut pas être tué par les dégâts collatéraux car son premier tir concerne forcément une unité adjacente dans la première zone devant lui.

Le plateau comporte deux rangées dans la zone centrale, ce qui avait motivé une question complémentaire sur E4/E3. Le vocal **5866084371739450829.ogg**, transmis ensuite par Nicolas, précise :

> Il va tirer que sur la première unité qui est dans la zone juste devant lui. Il peut pas tirer sur les unités de sa zone à lui.
>
> Et il tire que tout droit […] vers la base ennemie ou vers l’arrière ennemi.

Ces passages proviennent d’une transcription automatique locale du vocal de 43 secondes ; ponctuation et orthographe harmonisées. Source conservée chez Nicolas : `/Users/nicolasca/Downloads/5866084371739450829.ogg`. SHA-256 du vocal : `9a3de03881b5000bd06897bf3f03baabae2d441c2ce4b19d2e5d067901a661fc`. Le vocal a été traité localement, sans envoi à un service de transcription.

**Traduction sur le plateau :** commencer à la première case de la zone suivante, sur la même colonne en direction de l’Arrière ennemi. Les cases de la propre zone du Danzereu ne sont jamais des cibles de cette ligne. Pour le camp Sud, E4 → E2 et E3 → E2 ; E5 → E4. Pour le camp Nord, le cas symétrique est E3 → E5. La case intermédiaire de la propre zone est ignorée, qu’elle soit vide, occupée par un allié ou par un ennemi.

À partir de la zone suivante, conserver les arbitrages déjà reçus : ne pas franchir de case vide, arrêter au premier échec, +1 dé et +1 A cumulés à chaque cible suivante. Un 6 inflige aussi 1 R aux voisins de la cible **dans sa zone**, alliés comme ennemis. Le Danzereu reste dans une zone différente et n’est donc pas victime collatérale : aucune immunité artificielle ni condition d’arrêt sur sa mort n’est nécessaire.

Le blocage temporaire des départs depuis la seconde rangée centrale est retiré. Les cas S17/S23 et B23 contrôlent la géométrie et le choix du bot dans les deux orientations. Les quatre questions sont désormais résolues ; les conventions techniques distinctes des règles restent documentées séparément.

## Application locale

- Règles du simulateur : `paff-2026-09-18-arbitrages-2` ; moteur/rejeu : `simulation-2026-09-18-3`.
- Catalogue/descriptions : `2026-09-18-arbitrages-2` ; nouvelles parties manuelles : `2026-09-18-manual-2`. Les aides sont actualisées, l’arbitrage du plateau reste manuel.
- Les anciens jeux de données et relectures ne sont pas recalculés ; leur version ne change pas.
- Les changements restent sur `codex/simulateur-v3`. Pas de commit, publication ou écriture Convex pour cette correction. Les textes stockés en base ne seront actualisés qu’à l’application du catalogue dans l’environnement choisi.

## Vérifications effectuées

- Contrôles du moteur : 78 cas réussis ; décisions V3 : 65 cas réussis, dont les départs centraux dans les deux camps.
- Suite générale : 428 tests vérifiés. Le dernier passage global a réussi 427 tests ; le seul échec était l’ancien libellé attendu par le test d’infobulle. Ce libellé a été actualisé et les 14 tests du catalogue ont été relancés avec succès.
- Lint, types stricts de l’analyse, compilation du site et types Convex réussis. Aucun contrôle de réseau ou de production, aucune nouvelle campagne de parties.

# Lot 3 — premières parties entre robots

15 septembre 2026 · Campagne `calibration-2026-09-15-2` · règles `paff-2026-09-15-adrien-03` · moteur `calibration-1` · robots `heuristiques-1`.

**792 parties terminées, toutes rejouées à l’identique.** Ce lot calibre un simulateur et trois comportements simples. Ses résultats ne permettent pas encore de conclure sur l’équilibre des factions ni de changer le coût des unités.

## Protocole exécuté

- Six decks fixes de 33 points, dont 21 déployés : **trois par faction**. Trois variantes Gobelins remplacent respectivement 0, 3 ou 6 Bandes par des Skrans, à coût égal. Les Sephosi disposent de la référence mixte, d’une composition infanterie et d’une composition tir. Les compositions sont dans `analysis/simulation/decks.ts` et dans le rapport privé. Les quotas et la légalité du placement initial sont vérifiés.
- Trois styles : contrôle des zones, agression, préservation/recrutement. Ils évaluent des actions candidates avec des priorités explicites, sans apprentissage ni recherche des réponses adverses. Chacun connaît sa réserve, mais pas les identités des unités encore cachées dans la réserve adverse, ni les futurs dés.
- 648 confrontations entre factions : 3 decks Gobelins × 3 decks Sephosi × 9 couples de styles × 2 graines × 4 combinaisons camp/initiative. Chaque paire de decks joue 72 parties ; chaque deck affronte les trois adversaires pendant 216 parties, hors miroirs.
- 144 contrôles avec deck et style identiques : chacun des six decks, 3 styles, 2 graines, 4 combinaisons. Certaines combinaisons sont équivalentes ; ce sont des contrôles de symétrie, pas 144 observations indépendantes.
- Graines 151 et 947, générateur D6 déterministe, journal de chaque décision et de ses dés. Chaque partie termine au plus tard au tour 8. Le rejeu utilise les décisions enregistrées sans rappeler les robots et compare les empreintes des états.
- 396 paires avec rotation du plateau et initiative correspondante : résultats inversés et causes de victoire concordantes. Une divergence, une action illégale ou un rejeu différent arrête la génération ; aucune partie en échec n’est écartée pour embellir le rapport.

## Résultats de calibration

| Deck Gobelins | Deck Sephosi | Parties | Victoires Gobelins | Victoires Sephosi | Égalités |
| --- | --- | ---: | ---: | ---: | ---: |
| 0 Skrans | Référence | 72 | 64 | 6 | 2 |
| 0 Skrans | Infanterie | 72 | 66 | 4 | 2 |
| 0 Skrans | Tir | 72 | 72 | 0 | 0 |
| 3 Skrans | Référence | 72 | 72 | 0 | 0 |
| 3 Skrans | Infanterie | 72 | 68 | 0 | 4 |
| 3 Skrans | Tir | 72 | 68 | 2 | 2 |
| 6 Skrans | Référence | 72 | 68 | 0 | 4 |
| 6 Skrans | Infanterie | 72 | 56 | 2 | 14 |
| 6 Skrans | Tir | 72 | 64 | 0 | 8 |

Les six contrôles miroir ont autant de victoires sud que nord : 6/6 et 12 égalités pour Gobelins 0 Skrans ; 2/2 et 20 égalités pour 3 Skrans ; 6/6 et 12 égalités pour 6 Skrans ; 12/12 sans égalité pour Sephosi référence et tir ; 4/4 et 16 égalités pour Sephosi infanterie. Ces totaux concordent avec les inversions ; ils ne prouvent pas l’absence d’avantage du premier joueur dans les règles.

La durée moyenne est de 5,37 tours. Le journal totalise 21 282 Mouvements, 3 194 Recrutements, 1 646 Tirs, 1 148 renforts Gobelins, 722 Replis stratégiques, 974 Artilleries et **272 Tirs concentrés**. La disponibilité accrue de tireurs permet davantage de salves, mais ni leur nombre brut ni la domination Gobelins ne suffisent à juger la qualité des choix tactiques.

Les premiers contrôles ont révélé deux biais d’orientation des robots : l’ordre d’examen des zones de recrutement et le départage des destinations de Repli dépendaient des coordonnées absolues. Ils utilisent désormais les coordonnées relatives au camp ; un test de régression et les inversions de toute la campagne vérifient ce point.

## Limites qui empêchent un verdict d’équilibrage

Les robots choisissent des actions à court terme et ne représentent pas encore un joueur expérimenté. Les tirs ordinaires proposent des cibles distinctes ; seul Tir concentré groupe une cible. Le mouvement avec attaque de désengagement n’est pas proposé, même si son effet est testé par le socle ; le Repli Sephosi est disponible. Les relances automatiques ciblent les échecs uniquement, alors que les règles autorisent aussi de relancer un succès. Les charges et leurs cibles sont planifiées avant les jets.

Cette campagne utilise des formations fixes et trois decks par faction. Les variantes Sephosi explorent des orientations différentes ; elles modifient plusieurs quantités et ne permettent donc pas d’isoler l’effet d’une seule unité. Un effectif égal de decks corrige la couverture asymétrique, sans rendre ce choix représentatif de toutes les compositions possibles. Elle exclut décors, événements, Trolls, Shamans, Danzereu, Blop, Anges, Porte-ordres, Vallardi et Salamandre. Le validateur des decks du robot refuse les capacités non prises en charge ; il ne les ignore pas silencieusement. Les cas isolés du lot 2 peuvent couvrir certaines de ces unités sans que le robot sache les jouer en partie complète. Les conventions sur le moment du surnombre pendant les charges et sur la salve Tir concentré restent celles du [socle](situations-verifiees.md).

Deux graines ne suffisent pas pour estimer précisément une force de deck. Les parties inversées sont appariées et plusieurs contrôles se dupliquent ; aucun intervalle calculé comme si les 792 parties étaient indépendantes n’est présenté. La domination des decks Gobelins dans cette campagne est un **signal à expliquer dans ce protocole**, pas une mesure générale de puissance. La variante 6 Skrans ne surpasse d’ailleurs pas la variante 3 dans ce petit échantillon.

## Synthèse disponible dans l’atelier

À la demande de Nicolas, le bilan apparaît avant la liste des parties et suit le filtre sélectionné : victoires, défaites, égalités, part de victoires (égalités incluses au dénominateur), durée moyenne globale et durée moyenne des seules victoires de chaque camp. Une absence de victoire est affichée « — », jamais zéro tour. Chaque ligne de partie nomme désormais le deck gagnant en plus du camp et du motif.

Sur les **648 confrontations entre factions** : Gobelins **598 victoires / 14 défaites / 36 égalités**, Sephosi **14 victoires / 598 défaites / 36 égalités**. Les victoires Gobelins arrivent en moyenne au tour **4,82**, celles des Sephosi au tour **5,57**. La moyenne de ces 648 parties est de **5,01 tours** ; les 36 égalités terminent au tour 8. Les pourcentages de victoire sont respectivement **92,3 %** et **2,2 %**, avec **5,6 %** d’égalités (arrondis indépendants).

Les **144 parties miroir** sont présentées séparément : 42 victoires sud, 42 nord, 60 égalités ; moyenne **6,97 tours**. Une victoire Gobelins contre Gobelins n’est pas comptée comme une victoire contre Sephosi. La moyenne des **792 parties réunies** est de **5,37 tours**. Un tableau dépliable donne aussi les neuf bilans par paire de decks et les durées correspondantes. Ces nombres décrivent la campagne de calibration, sans devenir des statistiques de joueurs réels.

Cette synthèse est calculée à partir des résultats existants : aucune nouvelle campagne ni modification des robots n’a été nécessaire pour l’afficher.

## Reproduction et architecture

Avec Node 24 et les dépendances du dépôt installées :

```sh
npm run simulate
npm run test:simulation
npm run check
npx tsc --noEmit -p convex/tsconfig.json
```

`npm run simulate` ne contacte pas Convex. Il génère le rapport `data/simulation/report.json`, neuf exemples dans `data/simulation/examples.json`, et les traces complètes dans `analysis/simulation/output/parties.ndjson` (ignorées par Git, régénérables). Les versions, graines, compositions et une empreinte SHA-256 des sources sont enregistrées dans le rapport. Les 400 attaques analytiques du lot 1 ne sont pas recalculées.

`decks.ts` prépare les deux camps ; `bots.ts` propose les choix ; `game.ts` organise les tours et rejoue les journaux ; `campaign.ts` applique le protocole. Le socle `state.ts`/`orders.ts`/`combat.ts` demeure hors ligne. Les fonctions pures de géométrie et les profils viennent du projet existant.

Le site sert uniquement le rapport et neuf exemples via deux queries Convex en lecture seule. Il ne lance pas de simulation dans le navigateur ou en mutation et ne lit aucune partie réelle. Les JSON sont importés côté serveur, jamais dans le code client de production ni sous `public/`. Le lecteur affiche le déploiement puis les positions après chaque combat, avec illustrations existantes, R restants et journal des décisions/dés ; ce n’est pas une animation de chaque action.

## Accès privé et environnements

La route `/admin/equilibrage` et son lien de navigation sont réservés au compte Nicolas. **Chaque query contrôle côté serveur l’utilisateur authentifié actif et son identifiant exact**, défini dans `PAFF_SIMULATION_ADMIN_USER_ID`. Un pseudo « Nicolas » ou le rôle `admin` ne suffit pas. Une configuration absente refuse tous les accès. La capacité retournée par `players.current` pilote l’interface ; elle ne remplace jamais le contrôle des queries.

Le compte existant `nicolas` a été identifié en développement et cette variable a été configurée sur **`grateful-warthog-543`**. Aucun compte ni rôle n’a été créé ou modifié. Le backend de développement a été synchronisé avec `npx convex dev --once`, interface locale avec `npm run dev`. Les queries réseau ont accepté Nicolas, refusé Adrien (`FORBIDDEN`) et refusé la lecture d’un exemple sans session (`UNAUTHENTICATED`). La session réelle Nicolas ouvre le rapport dans Chrome ; Nicolas 2 voit « Accès réservé » dans le navigateur intégré.

**Production non déployée pour ce lot.** Lors d’une publication autorisée, lire d’abord les profils de `tough-gecko-249` et utiliser l’identifiant de Nicolas propre à cet environnement pour `PAFF_SIMULATION_ADMIN_USER_ID` ; ne pas recopier l’identifiant de développement. Puis déployer Convex et publier l’interface suivant le README. Sans cette configuration, l’atelier de production reste fermé. Aucune migration de données de partie n’est nécessaire.

## Validation du lot

`npm run check` réussi : lint, types stricts de l’analyse, **314 tests dans 31 fichiers**, puis build du site. Le backend passe également `npx tsc --noEmit -p convex/tsconfig.json`. La campagne complète vérifie 792 rejeux et 396 inversions ; les 53 tests du moteur couvrent les situations et l’orchestration, les tests serveur l’identité et les refus, les tests d’interface le filtre et le lecteur. Les deux tests du bilan vérifient l’attribution des victoires malgré les camps inversés, le dénominateur avec égalités, les durées et les cas sans victoire.

Sur la dev, le rapport lu par Nicolas est identique au JSON local, empreinte comprise. Dans sa session Chrome, rendu desktop, filtre des confrontations, chargement d’un exemple, passage au combat suivant, sélection d’une unité et journal des actions/dés ont été vérifiés. Les refus Adrien et sans session ont été obtenus directement du serveur ; Nicolas 2 voit le refus dans le navigateur. Les bundles publics compilés ne contiennent ni les exemples ni l’empreinte du rapport privé. Liens documentaires locaux et `git diff --check` valides.

## Historique de la correction du panel

La révision 1 comportait 264 parties : trois variantes Gobelins contre un unique deck Sephosi, puis deux contrôles miroir. Nicolas a relevé cette couverture asymétrique. La révision 2 conserve les robots, les graines, le moteur, les règles et les trois decks Gobelins ; elle ajoute les deux decks Sephosi et croise les neuf paires, avec six miroirs. Les résultats des trois anciennes confrontations face à la référence Sephosi sont conservés à l’identique. Les numéros de partie suivent le nouvel ordre des confrontations : toujours identifier un essai par la version de campagne, les decks, les styles, la graine et l’initiative, pas uniquement par son numéro.

Les neuf exemples de l’atelier couvrent chacun une paire entre factions et leur menu affiche les deux decks. Le test du panel empêche la régression vers une faction testée contre moins d’adversaires que l’autre.

## Étape suivante

L’inspection des 648 confrontations entre factions est faite dans le [diagnostic des parties](diagnostic-campagne.md) : causes de victoire, unités et capacités, économie, défauts des robots et essai séparé d’une défense de base. Ce dernier ne remplace aucun résultat de la campagne affichée.

Améliorer les décisions des robots : protection de la base, regroupement et concentration des tirs, anticipation d’une réponse adverse. Comparer ces pilotes au comportement actuel avec les mêmes decks et graines, puis valider sur des graines indépendantes. Varier les déploiements et la présence des Bandes du chef ; étendre ensuite les cartes et capacités prises en charge avec des situations attendues. Un apprentissage par renforcement n’est pas nécessaire à ce stade. Aucun changement de coût ou de règle n’est déduit de cette calibration.

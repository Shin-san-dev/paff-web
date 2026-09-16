# Essai MCTS — 16 septembre 2026

Nicolas a demandé de remplacer les décisions purement immédiates par une recherche MCTS, après avoir constaté des déploiements Sephosi dispersés et l’abandon volontaire de la base gobeline dans la partie 001. Il a confirmé le **déploiement alterné unité par unité, initiative en premier, avec adaptation aux poses déjà révélées**. La campagne de référence est conservée séparément.

**Anomalie identifiée à la relecture du 16 septembre :** les résultats ci-dessous sont reproductibles, mais le pilote peut terminer ses ordres alors qu’il lui reste ses trois ordres de base et des actions légales. Ce passage définitif pendant les ordres n’est pas autorisé par la règle des trois ordres alternés (PDF p. 2, ORD-01) ; la confirmation d’Adrien sur le passage définitif concerne les **charges**. Ne pas utiliser cette campagne comme validation d’une simulation entièrement fidèle. Voir le diagnostic de `mcts-022` ci-dessous ; aucune campagne recalculée pendant ce diagnostic.

## Périmètre

**Autres écarts confirmés le 16 septembre :** la première pose n’est pas contrainte à la case centrale E2/E5 et les charges entre axes sont acceptées. Relecture des 84 traces du rapport : 138 premières poses sur 168 hors du milieu de la Base Centre ; 144 charges entre axes dans 66 parties. Les six decks omettent aussi plusieurs unités et capacités majeures des deux factions. Les résultats ci-dessous restent historiques ; ils ne mesurent pas l’équilibrage global des factions. Voir les [précisions, preuves et couverture à étendre](retours-nicolas-2026-09-16.md). Aucun recalcul lors de ce constat.

Même catalogue, mêmes règles `paff-2026-09-15-adrien-03`, mêmes six decks et mêmes sélections de 21 points. Les profils, coûts, règles et parties du site manuel ne changent pas. La recherche concerne le choix d’une unité et de sa case au déploiement, puis les ordres. Les charges et cibles de combat sont encore proposées par le pilote heuristique commun ; la recherche en simule les conséquences avec les règles existantes.

Le déploiement n’est plus une formation fixe. À son tour, un agent choisit une unité encore à placer et une case légale, après observation du plateau public. La première unité non artillerie reste en Base Centre. Quand un joueur a fini, l’autre continue de poser toutes les unités de sa sélection. Les contraintes d’artillerie et de capacité sont conservées.

## Recherche et informations disponibles

L’algorithme est un **MCTS UCT en boucle ouverte, à décisions adverses**, sans réseau neuronal ni apprentissage. Chaque décision utilise 64 explorations. Les valeurs sont mémorisées du point de vue de l’agent qui décide ; aux nœuds adverses, la recherche favorise les réponses qui lui sont défavorables. Chaque traversée réévalue les actions légales après les résultats aléatoires et ne réutilise pas un ordre devenu illégal.

- **Déploiement :** horizon de six poses. Le choix de départ tient compte des placements possibles suivants. L’évaluation accorde davantage de valeur au centre, au soutien des tireurs et aux menaces visibles, sans imposer un nombre fixe d’unités par axe. Les déploiements adverses encore inconnus sont des hypothèses tirées de profils publics de la faction, dans le budget supposé de 21 points ; ce ne sont jamais les cartes effectivement cachées. Cette distribution simplifiée n’est pas un modèle appris des compositions adverses.
- **Ordres :** horizon jusqu’au contrôle de fin du tour courant, avec jets de combat, pertes simultanées, victoire et ressources, dans la limite de 40 actions simulées par exploration. L’évaluation intermédiaire mesure notamment les unités restantes, les zones, les ressources et les menaces sur les bases. Une victoire ou défaite terminale domine cette estimation.
- **Actions :** propositions limitées en nombre, avec mouvements individuels, groupes partiels, défense de base, tirs, recrutement et ordres de faction déjà couverts. Les simulations de continuation utilisent une politique plus rapide, avec variation entre plusieurs réponses plausibles. La recherche reste guidée par des heuristiques et ne couvre pas toutes les séquences légales.
- **Informations cachées :** la réserve adverse réelle est retirée de l’observation. Avant la première pose adverse, même sa faction est inconnue : une hypothèse Gobelins/Sephosi équiprobable est utilisée, puis remplacée par la faction révélée. Pendant les ordres, une recrue adverse inconnue n’est pas ajoutée aux anticipations ; c’est une limite de cet essai court. La propre réserve de l’agent reste disponible.
- **Hasard :** les dés d’exploration utilisent un flux séparé de celui de la partie. Les agents ne lisent jamais les futurs jets réels. Les décisions sont reproductibles avec le même état visible, la même graine de recherche et le même budget.

La limite de budget signifie qu’une erreur stratégique reste possible. Réussir un cas simple n’établit pas un niveau de jeu optimal. Les quatre travailleurs du générateur ne font que paralléliser des parties indépendantes ; ils ne modifient pas les décisions ni les graines.

## Protocole de comparaison

- **72 confrontations MCTS contre MCTS** : neuf paires Gobelins/Sephosi × deux graines (151, 947) × deux camps × deux initiatives. Comparaison avec les **72 parties de référence Contrôle/Contrôle** ayant exactement ces configurations, et non avec le total hétérogène des 648 anciennes confrontations.
- **12 miroirs MCTS** : chacun des six decks contre lui-même, deux initiatives, graine 151.
- **24 duels de pilotes séparés** : MCTS contre l’ancien robot Contrôle, deck identique dans les deux camps, six decks, permutation des agents et des initiatives, nouvelle graine 20260916. Ils mesurent le changement de pilote, pas la force relative des factions.

Chaque partie enregistre les poses, les ordres, les passages, les plans de combat, les dés et les empreintes d’état. Un rejeu vérifie toute la séquence. Les 36 paires de confrontations tournées à 180° doivent avoir le même résultat et la même durée ; sinon la publication du rapport est bloquée.

Le déploiement et la politique d’ordres changent ensemble dans cet essai. Une amélioration ne peut pas être attribuée à la recherche seule, indépendamment du choix des actions et de leur évaluation. Les graines communes n’impliquent pas que les mêmes dés concernent les mêmes attaques après divergence des décisions. Ni les deux graines de comparaison ni les rotations ne constituent un grand échantillon indépendant.

## Relecture privée

L’atelier propose deux campagnes : **Recherche MCTS** par défaut et **Référence**. L’ancienne campagne de 792 parties et ses neuf exemples restent accessibles.

La campagne MCTS conserve **20 relectures choisies avant lecture des résultats** : deux par confrontation entre factions, plus deux miroirs. On peut voir le plateau vide, chacune des poses, chaque ordre, les combats et les contrôles de fin de tour. Un sélecteur permet d’atteindre directement une étape. Le lecteur précise le vainqueur, son camp et la cause, montre les coordonnées et les engagements et explique une victoire par Base Centre.

Les requêtes Convex vérifient toujours l’identité exacte de Nicolas pour chaque campagne et chaque exemple. Les traces et rapports ne sont pas importés dans le client public. Une requête d’exemple charge seulement la partie choisie ; les réserves et champs internes inutiles ne sont pas répétés dans les images d’état destinées au lecteur.

## Reproduction

```sh
npm run simulate:mcts
npx vitest run analysis/simulation/mcts.test.ts analysis/simulation/mctsArtifacts.test.ts
npm run check
npx tsc --noEmit -p convex/tsconfig.json
```

Le générateur conserve les parties complètes et un point de reprise dans `analysis/simulation/output/mcts/`, ignoré par Git. Il refuse de reprendre un calcul dont l’empreinte de sources diffère. Pour une nouvelle version, archiver ce dossier avant de relancer. Les données de référence `data/simulation/report.json` et `examples.json` ne sont jamais écrasées ; les nouveaux artefacts sont écrits dans `data/simulation/mcts/` uniquement après validation de la campagne complète.

Le moteur MCTS est isolé dans `search.ts`, `tactics.ts`, `perspective.ts`, `mcts.ts` et `mctsGame.ts`. Il réutilise les règles et calculs de dés existants. La recherche raisonne dans une orientation commune, depuis le camp qui décide, pour éviter un avantage artificiel lié au sens du plateau. Les tests ciblés vérifient l’anticipation d’une réponse adverse, l’absence d’accès aux cartes et à la faction cachées, le déploiement légal alterné, le financement après achat d’ordre, une victoire de base accessible, la régression de la partie 001, les rejeux altérés et l’inversion des camps.

## Résultats et mise en service

Les 72 confrontations entre factions sont terminées :

| Pilote | Victoires Gobelins | Victoires Sephosi | Égalités | Tours moyens |
| --- | ---: | ---: | ---: | ---: |
| Référence Contrôle | 66 | 2 | 4 | 4,92 |
| MCTS | 66 | 4 | 2 | 7,11 |

La part de victoires Gobelins reste **91,7 %** dans les deux groupes. La recherche ne fait donc pas disparaître le déséquilibre des résultats de ces compositions. Les Sephosi gagnent deux parties de plus, avec deux égalités de moins.

Le déroulement change nettement : la référence termine 68 parties par Base Centre ; MCTS en termine 34 par Base Centre, 34 par contrôle des zones, deux par élimination et deux par égalité. Sur la configuration du premier exemple, le déploiement Sephosi place six unités au centre et une sur chaque flanc, au lieu de trois au centre et cinq réparties sur les flancs. Ce sont des améliorations de certains comportements observés ; ni une durée plus longue ni un taux de victoires plus proche de 50 % ne suffisent à établir la qualité du pilote.

Les 24 duels à deck identique donnent **18 victoires MCTS, deux victoires du robot Contrôle et quatre égalités** :

| Deck commun aux deux camps | MCTS | Contrôle | Égalités |
| --- | ---: | ---: | ---: |
| Gobelins · 0 Skrans | 4 | 0 | 0 |
| Gobelins · 3 Skrans | 0 | 2 | 2 |
| Gobelins · 6 Skrans | 2 | 0 | 2 |
| Sephosi · référence | 4 | 0 | 0 |
| Sephosi · infanterie | 4 | 0 | 0 |
| Sephosi · tir | 4 | 0 | 0 |

Le nouveau pilote domine cette référence dans l’ensemble des duels, particulièrement avec les Sephosi, mais régresse sur le deck Gobelins à trois Skrans. Cela justifie de conserver les relectures et de rechercher les décisions fautives ; cela ne valide ni un pilote optimal ni un changement de coût. Le passage à ce pilote ne suffit donc pas à faire disparaître le bilan extrême de ce panel ; il ne prouve pas que tous les défauts stratégiques ont été corrigés. Les restrictions d’actions, le court horizon, les charges heuristiques et les unités exclues empêchent encore d’en déduire l’équilibre général des factions.

**Validation de la campagne :** 108 parties terminées et rejouées à l’identique, dont 84 dans le rapport principal et 24 duels séparés ; 36 paires entre factions concordantes après rotation ; exactement 20 exemples, de 65 à 105 étapes, chacun inférieur à 266 Ko en JSON. Empreinte des sources : `2857e938949c810c12a6e9f0880d8ddf3183624b3cf2466c8cae6ff521e58995`. Calcul en environ 26 minutes sur le poste de développement avec quatre travailleurs. Les artefacts de référence restent inchangés.

**Validation de l’application :** `npm run check` réussi (lint, types stricts d’analyse, **327 tests dans 33 fichiers**, build), ainsi que `npx tsc --noEmit -p convex/tsconfig.json`. Le bundle du navigateur ne contient ni les rapports ni les relectures privées. Les empreintes de la référence et de MCTS concordent encore avec leurs sources après génération.

**Développement :** fonctions synchronisées avec `npx convex dev --once` sur **grateful-warthog-543**. Relecture du rapport et du plus gros exemple avec l’identité Nicolas : contenus identiques aux artefacts locaux. Appel du rapport avec Adrien refusé (`FORBIDDEN`) ; exemple sans session refusé (`UNAUTHENTICATED`). Contrôle desktop avec la session Nicolas : 20 exemples, première pose unique, navigation par étape, illustrations, engagements, sélection d’une unité et retour à la référence de 792 parties / neuf exemples. L’atelier est consultable à `http://127.0.0.1:5173/admin/equilibrage` avec le serveur local démarré.

Travail non commité dans le dossier partagé, branche `codex/audit-equilibrage`. **Aucune publication Vercel ni mise à jour Convex de production** pour cet essai.

## Diagnostic demandé sur mcts-022

La trace complète commence au tour 1 par **Sephosi (initiative) : passage définitif avec trois ordres restants**, puis les trois mouvements Gobelins, un passage Gobelins, le combat et la fin du tour. Au tour 2, l’initiative revient correctement aux Gobelins et les ordres alternent. Le générateur du lecteur supprime tous les événements `pass`, ce qui masque la cause du tour inactif Sephosi. Ces deux défauts (action de fin prématurée proposée et passage caché au lecteur) restent à corriger avant une nouvelle campagne.

Le rejeu ciblé de la décision initiale retrouve exactement ce passage : 64 explorations au total, huit options proposées, dix visites pour passer contre neuf pour le meilleur mouvement concurrent. Des mouvements, un tir d’arbalétrier et un ordre d’artillerie sont disponibles. Le choix ne vient donc pas d’une impossibilité d’agir. L’horizon au tour courant, les continuations heuristiques et le faible nombre d’évaluations par option rendent l’estimation fragile ; surtout, cette fin prématurée ne devait pas faire partie des choix autorisés.

La cavalerie reçoit bien +1 dé de charge, ou **+3 à la place du +1** pour Charge puissante après un déplacement ; Mur de lance annule le bonus. La trace `mcts-001` contient deux charges de cavalerie lourde (tours 1 et 5) avec un dé de profil + trois supplémentaires. `mcts-022` emploie le deck Sephosi tir, **sans cavalerie**. Les unités complexes exclues des six decks ne sont pas évaluées par cette campagne.

Le simulateur fonctionne déjà sans interface et sans appel à un modèle de langage. Un profilage ponctuel de la première décision Sephosi de `mcts-022` mesure environ 572 ms pour la recherche contre 25 ms pour rejouer toute la partie enregistrée ; environ 24 % des échantillons CPU de cette recherche se trouvent dans les copies profondes d’état. Ce relevé porte sur une seule position, pas sur toute la campagne. La génération répétée des actions et leur évaluation représentent également un coût. L’échantillonnage des cartes cachées reste partiel au déploiement et absent pour la réserve adverse pendant les ordres : la version actuelle n’est pas un ISMCTS complet. Aucun apprentissage persistant n’a lieu entre les parties.

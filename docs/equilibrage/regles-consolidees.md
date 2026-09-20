# Règles de référence pour l’équilibrage

Socle **`paff-2026-09-18-arbitrages-2`** · Gobelins / Sephosi · catalogue `2026-09-18-arbitrages-2`. Les résultats historiques V2 restent sur `paff-2026-09-15-adrien-03`. Le moteur, ses références et ses bilans de couverture sont conservés dans le dépôt local séparé `paff-simulator` ; voir [la séparation](../separation-simulateur.md).

Cette référence rassemble les règles retenues. Les dix-neuf questions initiales et les douze compléments ont reçu leurs réponses. Elle décrit les règles, **pas le niveau d’automatisation du site** : celui-ci reste documenté dans les [règles implémentées](../regles-implementees.md). Les anciennes campagnes et leurs limites restent historiques.

**Réponses du créateur après le lot B :** au moins deux tireurs par zone pour Tir concentré ; Djil confirmé Troll sans Trollitude, exclu de La gross Invokation et des sacrifices ; seuls les dés du profil doublent ; Pluie vise les ennemis uniquement. Le Danzereu ne se tue pas par les dégâts collatéraux de Ligne Verte. Le vocal précise que Ligne Verte commence dans la **zone suivante**, sans viser les cases de la propre zone du Danzereu : E4→E2 pour le camp Sud, E3→E5 pour le camp Nord. Voir les [réponses, la question et l’application](arbitrages-2026-09-18.md).

## Sources et priorité

1. [Réponses du créateur transmises par Nicolas après le lot B, le 18 septembre](arbitrages-2026-09-18.md), remplaçant les hypothèses du [diff](../differences-regles-2026-09-18.md). Puis derniers arbitrages explicites transmis par Nicolas : [précisions du 16 septembre](retours-nicolas-2026-09-16.md), puis [troisième salve](retours-adrien-03.md), [deuxième](retours-adrien-02.md) et [première](retours-adrien-01.md) pour les points non remplacés.
2. Arbitrages du projet : réserve égale au reste du deck sans plafond de 12, déploiement sans minimum, portées exprimées en cases, quota Unique total.
3. **PAFF 2026 (3).pdf**, 10 pages, reçu le 18 septembre : règles p. 1–6, ordres p. 7, unités p. 8, capacités p. 9. SHA-256 : `7eb3b911c27c60aff60115d38dd3103c0ab55d99c0f8049c401fc793dcc0cde9`. Les passages inchangés ne remplacent pas les arbitrages précédents. Export du 15 septembre conservé comme référence historique dans le diff.
4. Catalogue numérique [catalogue2026.ts](../../shared/catalogue2026.ts), géométrie [board.ts](../../shared/board.ts). Les anciennes descriptions du plateau manuel ne remplacent pas les arbitrages ci-dessus.

Les salves historiques conservent les formulations reçues. En cas de contradiction, cette référence et la dernière réponse datée font foi. Aucune statistique personnelle de joueur n’entre dans cette analyse.

## Armées, plateau et départ

| Réf. | Règle |
| --- | --- |
| BASE-01 | Une faction par deck, maximum 33 points. Quotas : Cavalerie 6, Artillerie 4, Élite 4, Unique **1 au total**. Troupe et Tir sans quota de nombre. |
| BASE-02 | Déployer de 0 à 21 points. Tout le reste constitue la réserve, sans plafond séparé de 12. Une sélection vide est légale mais entraîne la défaite au démarrage ; si les deux plateaux sont vides, égalité. |
| BASE-03 | 54 cases, 6 lignes et 9 colonnes ; axes de largeur 2/5/2 ; 15 zones. Les deux lignes centrales sont regroupées en trois zones stratégiques. Le camp de chaque joueur contient 18 cases, dont 9 à l’Arrière. L’espacement graphique des flancs ne change pas les distances. |
| BASE-04 | Sélection privée, initiative, déploiement alterné de toutes les unités choisies. Première unité de chaque joueur sur la **case du milieu de sa Base Centre**, E5 au Sud / E2 au Nord ; artillerie à l’Arrière ; Blop en réserve. Appliqué au simulateur dans le lot A. Une sélection non vide tout-artillerie y est refusée explicitement, faute de première pose compatible (convention WIP). La préparation du site manuel conserve encore son ancien comportement. |
| BASE-05 | Le lot de situations utilise un plateau **sans décors**. Les événements sont explicitement exclus. Ruines : −1 dé à l’attaquant au tir comme au combat. Colline : +1 dé au tir depuis la colline et −1 dé au premier jet de combat de celui qui charge une unité dessus, après les bonus de charge applicables. Ces règles restent consignées pour un futur lot avec décors. |

## Tours, économie et ordres

| Réf. | Règle |
| --- | --- |
| ORD-01 | Huit tours maximum, initiative alternée. Trois ordres de base par joueur et par tour, joués alternativement. Limites de sélection par partie : avancé 4, rare 2, légendaire 1, Recrutement commun 3. |
| ORD-02 | Stock de recrutement conservé, augmenté de **3 points aux tours 2, 4 et 5**. Un ordre permet d’en dépenser autant que souhaité et n’apporte pas lui-même de nouveaux points. Indépendamment de ce financement, les trois sélections de Recrutement commun sont débloquées progressivement : **première dès le tour 2, deuxième dès le tour 3, troisième dès le tour 4**. Au total depuis le début de la partie : zéro utilisation au tour 1, au plus une au tour 2, deux au tour 3, trois à partir du tour 4 ; les sélections non utilisées restent disponibles. Calendrier contrôlé par le simulateur depuis le lot A ; source : rappel de Nicolas d’après la modification du fichier de règles du 14 septembre. |
| ORD-03 | Un PS finance un ordre supplémentaire **ou** un point de recrutement. Recrutement uniquement avec des PS possible s’il reste une sélection utilisable. Les PS de contrôle gagnés en fin de tour servent aux tours suivants. |
| ORD-04 | Recrutement ordinaire : unités de la réserve payées à leur coût, case libre dans une zone Base/Arrière de son camp sans ennemi **non engagé**. Les ennemis tous engagés ne bloquent donc plus le recrutement. Les recrues peuvent recevoir des ordres normalement, **mais ne tirent pas ce tour-ci**. |
| ORD-05 | Un Mouvement et un Tir au maximum par unité dans le tour, sauf répétition expressément autorisée par une capacité. Ordres Mouvement et Tir par zone ; l’artillerie utilise Tir Artillerie. |
| ORD-06 | Une unité ordinaire ne combine pas mouvement et tir. **Tir en mouvement** permet aux Arbalétriers Montés de faire les deux dans l’ordre choisi, au prix de **deux ordres**. Chaque ordre active aussi les autres unités éligibles de sa zone. |
| ORD-07 | Vallardi déployé et vivant donne +1 ordre, y compris dès son recrutement. S’il meurt, le bonus acquis reste disponible jusqu’à la fin du tour. Sa présence en réserve ne suffit pas. |
| ORD-08 | Appui stratégique peut étendre le même ordre à trois zones au maximum, une par axe ; chaque axe supplémentaire contient un Porte-ordres. Le niveau de zone est libre. Tous les ordres sont concernés ; aucune copie récursive. Stock et sélection payés une fois ; chaque recrue reste payée, sans multiplication du stock de points. |

## Déplacement et tir

| Réf. | Règle |
| --- | --- |
| ACT-01 | Déplacement orthogonal vers une case libre. Un point ordinaire, trois pour Cavalerie/Vol, artillerie immobile. Changer d’axe coûte un point supplémentaire. Après avoir quitté sa zone de départ, ne pas y revenir dans le même déplacement. Vol permet de survoler les occupants, pas de s’arrêter dessus. |
| ACT-02 | Une unité engagée doit se désengager pour bouger. Chaque ennemi engagé capable de combattre obtient une attaque gratuite, avec **+2 aux résultats des dés**. Les relances de surnombre sont supprimées. L’ordre Repli stratégique déplace directement une unité sans ces attaques, et consomme son mouvement du tour. |
| ACT-03 | Portée de tir 3 cases, artillerie 4, mesurée horizontalement + verticalement. Toujours le même axe ; les unités ne bloquent pas les tirs ; une cible dans la même zone est possible. |
| ACT-04 | Une attaque choisit une seule cible, avec tous ses dés. Pas de répartition entre plusieurs ennemis, sauf capacité explicite. Tir ordinaire interdit sur une cible engagée, avec les exceptions Tir en mêlée et Ligne Verte. |
| ACT-05 | T contre DT, C contre DC. Seuil de touche `4 − (A − D)`, borné entre 2+ et 6+. Une touche retire 1 R, sans sauvegarde. **Aucune relance/confirmation du tableau ; les relances de surnombre sont également supprimées.** Une unité blessée conserve tous les dés de son profil. |

## Combat

| Réf. | Règle |
| --- | --- |
| COM-01 | Début du combat : un jet de Trollitude par unité dotée de cette capacité (Djil exclu, confirmé par le créateur). Puis charges alternées ; passer termine définitivement ses charges. Une unité non engagée peut charger un ennemi adjacent **dans le même axe**, même déjà engagé. **Aucun combat ni engagement entre axes**, précision de Nicolas du 16 septembre appliquée aux charges, engagements et attaques forcées de Trollitude dans le simulateur. |
| COM-02 | La charge ne déplace pas : elle crée un engagement et consomme l’unique attaque de combat. Aucun nouveau droit de charge après cette sous-phase. Une unité C engagée qui n’a pas chargé attaque une cible engagée au choix. Les T, Vallardi et Porte-ordres ne ripostent pas en C. |
| COM-03 | **Dégâts simultanés sur toute la phase**, charges comprises. Résoudre matériellement un jet avant un autre ne supprime pas une attaque prévue. Les deux armées détruites simultanément donnent égalité. |
| COM-04 | Pas de dé de charge générique. Cavalerie : +1 dé ; Charge puissante : +3 au lieu de +1 si déplacement préalable. Mur de lance supprime les dés supplémentaires de charge. Les Anges sont Élite avec Vol, pas Cavalerie. |
| COM-05 | **Aucune relance de surnombre.** Suppression confirmée par Nicolas le 18 septembre, remplaçant la règle antérieure sur le réseau d’engagements. Plusieurs engagements restent possibles. |

## Capacités et ordres de faction

| Réf. | Règle |
| --- | --- |
| CAP-01 · Renforts | « Tiens, des gobelins... » crée gratuitement une Bande, au prix d’un ordre. Blop, payé et recruté, crée 1D3 Skrans une seule fois. Ces exemplaires ne viennent pas de la réserve et ne comptent pas dans les limites du deck. Arrivée possible dès le tour 1 si l’effet est utilisable ; placement ordinaire. Les unités impossibles à placer sont perdues. Blop lui-même ne devient ni gratuit ni déployable initialement. |
| CAP-02 · Trollitude | Jet au début du combat : 1 attaque un allié adjacent choisi par le propriétaire, ou rien sans cible ; 2–3 rien ; 4–5 attaque normalement ; 6 +1 dé. Aucun effet rétroactif sur la phase d’ordres précédente. |
| CAP-03 · Invokation | Ordre avancé. Le lanceur Shaman ajoute un dé par **autre** Shaman ami à portée depuis lui. Déterminer les dés, résoudre le tir/dégâts, puis les conséquences : 1 sacrifier deux autres Shamans ; 2–3 un ; 4–5 rien ; 6 répéter l’attaque seule contre la même cible si elle survit. Choix des sacrifices par le propriétaire ; si insuffisants, sacrifier ceux disponibles, sans annuler les dés déjà lancés. Jamais le lanceur. |
| CAP-04 · Ligne Verte | Remplace le tir du Danzereu. Sacrifice d’un Gobelin non Troll adjacent dans la même zone, Djil exclu, confirmé par le créateur. Ligne verticale vers l’Arrière ennemi, même axe, cibles des deux camps même engagées. Départ à la première case de la zone suivante, vers l’Arrière ennemi ; ignorer les cases de la propre zone du lanceur, même dans la zone centrale à deux rangées. Le Danzereu ne subit donc pas ses dégâts collatéraux. Arrêt au premier vide ou à la première attaque sans touche. +1 dé et +1 A cumulés par cible suivante. Au moins un 6 inflige en plus 1 R aux voisins de la cible dans sa zone. |
| CAP-05 · Pluie | Aucun dégât direct. Une Katapult qui touche une unité ennemie impose −2 dés jusqu’à la fin du tour. Plusieurs attaques réussies cumulent ces malus ; appliquer après les autres effets, minimum zéro dé. Plusieurs touches d’une même attaque ne multiplient pas son malus. Aucun malus sur les unités alliées. |
| CAP-06 · Pause-déjeuner | Ordre rare. Au plus +1 R par Troll et par sélection, avec un sacrifice distinct de Gobelin non Troll adjacent, même engagé. Peut soigner plusieurs Trolls et dépasser leurs R initiaux. Djil ne peut pas être soigné (PDF), ni sacrifié (Troll confirmé). |
| CAP-07 · Gross Invokation | Ordre légendaire, Shaman présent dans l’axe requis. Affecte toute la faction Gobelins sauf les Trolls et Djil. 1 : −1 R dans tous les axes ; 2–3 : −1 R dans l’axe choisi ; 4–5 : dés doublés dans cet axe pour le tour ; 6 : dés doublés dans tous les axes. Seuls les dés du profil doublent ; les bonus de dés sont ajoutés sans doublement, puis les éventuels malus ennemis sont soustraits, minimum zéro. |
| CAP-08 · Tir concentré | Ordre avancé, immédiatement résolu sans ordre Tir supplémentaire. **Au moins deux tireurs éligibles** d’une même zone, artillerie incluse, attaquent la même cible et reçoivent tous +1 dé. Un tireur seul ne suffit pas ; chaque zone copiée avec Appui doit elle aussi contenir au moins deux tireurs activés. Chaque tireur doit respecter ses conditions de tir. |
| CAP-09 · Fureur divine | Ordre rare. Anges de la réserve, coût payé en points de recrutement et/ou PS. Déploiement sur case libre de toute zone, même occupée par un ennemi et en Base Centre. Aucun Recrutement commun supplémentaire ; peut permettre une victoire à la fin de ce tour. |
| CAP-10 · Salamandre | Ordre légendaire, Salamandre initialement engagée. Les autres unités amies gagnent +2 dés contre les cibles dans cette zone, tirs compris. L’effet dure jusqu’à la fin du tour, même après mort ou désengagement de la Salamandre. |
| CAP-11 · Tir en mêlée | Archers Gobelins : choisir un allié engagé avec la cible. Avant les touches, lancer un dé de redirection par dé d’attaque : 1–3 dirigé vers cet allié, 4–6 vers l’ennemi. Toucher ensuite contre le DT du destinataire réel. |
| CAP-12 · Tir magique | La cible ne profite pas de capacités défensives ni des protections de décor. Aucun bonus de dégâts générique. Dans le socle sans décor, ce n’est pas une source automatique de dégâts supplémentaires. |

## Contrôle et victoire

| Réf. | Règle |
| --- | --- |
| VIC-01 | Aucune unité sur le plateau = défaite immédiate même avec réserve. Vérifier après un effet entièrement résolu ; pour le combat, après les pertes simultanées de toute la phase. Deux armées vides = égalité. |
| VIC-02 | Contrôler une zone exige au moins une unité amie non engagée et aucune ennemie non engagée. Le type offensif et le prix ne comptent pas ; un ennemi engagé ne conteste pas seul. Chaque zone stratégique rapporte 1 PS en fin de tour. |
| VIC-03 | Contrôler la Base Centre ennemie donne une victoire totale en fin de tour. Si les deux joueurs le font, continuer avant le tour 8 ; égalité au tour 8. |
| VIC-04 | Au huitième tour, à défaut d’une victoire totale, comparer le nombre de zones stratégiques contrôlées : plus grand nombre gagnant, nombre égal = égalité. Ne pas utiliser le stock de PS comme départage. |

## Ce que cette consolidation permet

Reprendre les situations contrôlées avec des résultats attendus explicites. Ne pas redemander les douze arbitrages ni l’adoption du stock 2/4/5. Les limites d’implémentation et conventions techniques du prototype restent visibles dans [le rapport des situations](situations-verifiees.md) ; elles devront être levées avant d’utiliser des parties automatisées comme preuve d’équilibrage.

## Conventions du moteur V3, distinctes des arbitrages du créateur

En phase d’ordres, une action légale encore disponible interdit de passer avec des ordres restants. L’absence d’action est contrôlée indépendamment du score du bot. Un joueur bloqué reçoit de nouveau la main après une action adverse ; deux passages consécutifs ferment cette phase. Acheter un ordre supplémentaire avec un PS reste facultatif. Cette transition explicite est une convention de moteur pour le cas non détaillé dans les réponses ; le passage définitif confirmé concerne les **charges** seulement. Les ordres sans effet (par exemple un renfort sans case) ne servent pas à bloquer cette transition.

Une sélection non vide tout-artillerie ne peut respecter à la fois la première pose E5/E2 et l’artillerie à l’Arrière : le simulateur la refuse et signale la raison. Aucun changement de cette exception dans la préparation du site manuel.

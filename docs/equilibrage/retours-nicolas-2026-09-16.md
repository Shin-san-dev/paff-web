# Précisions de Nicolas après relecture des parties — 16 septembre 2026

Source : remarques transmises directement par Nicolas dans la conversation de travail, après le diagnostic de `mcts-022`. Ces précisions complètent la référence `paff-2026-09-15-adrien-03`. Elles sont retenues comme règles ; leur application au code reste à faire pour les écarts indiqués ci-dessous. Aucune campagne recalculée ni publication lors de cette consolidation.

## Première unité

La première unité de **chaque joueur** doit être posée sur la **case du milieu de sa Base Centre** : E5 au Sud, E2 au Nord, dans les coordonnées fixes du plateau. Le déploiement reste alterné, initiative en premier. Les contraintes de sélection vide, d’artillerie et de réserve de Blop restent des sujets distincts.

Écart constaté : `shared/board.ts` autorise actuellement n’importe laquelle des cinq cases de Base Centre, au placement comme à la correction de position. Le site et les deux pilotes de simulation réutilisent ce contrôle. L’ancienne exception provisoire d’une sélection composée uniquement d’artillerie est encore codée ; la nouvelle précision ne confirme pas cette exception. Ne pas la présenter comme un arbitrage de Nicolas.

## Relations entre axes

- Franchir une frontière d’axe coûte **un point de mouvement supplémentaire** : une case orthogonalement voisine dans l’axe adjacent coûte donc deux points.
- Aucun tir entre axes.
- Aucun combat entre axes : deux cases voisines de part et d’autre d’une séparation ne permettent pas une charge ni un engagement.

Le surcoût de mouvement est déjà appliqué par `shared/battleEngine.ts`. Les tirs du simulateur sont déjà limités au même axe. En revanche, `analysis/simulation/combat.ts` accepte une charge entre voisins orthogonaux sans vérifier l’axe, et les bots proposent ces charges. La correction devra distinguer voisinage pour le déplacement et légalité du combat ; supprimer tout voisinage entre axes interdirait aussi des mouvements autorisés. Vérifier également les engagements, attaques et interactions comme Trollitude.

Une relecture des **84 traces du rapport MCTS** (72 confrontations entre factions et 12 miroirs, hors 24 duels de pilotes) constate **144 charges entre axes dans 66 parties**. Exemple : `mcts-001`, tour 2, C3 → B3. Sur les 168 premières poses individuelles, **138 ne sont pas en E2/E5**. Les dés enregistrés et empreintes des événements sont reproduits à l’identique : cela prouve la reproductibilité des anciennes traces, pas leur conformité aux nouvelles précisions. Aucun nouveau choix MCTS ni nouveau tirage n’a été calculé pour ce diagnostic.

## Couverture des factions

Les trois decks Gobelins ne varient que la quantité de Skrans autour des Bandes, chefs et Archers. Les trois decks Sephosi couvrent infanterie, tireurs, cavalerie et balistes. Ce panel ne représente pas l’ensemble des deux factions. Les résultats historiques ne permettent pas d’affirmer qu’une faction est globalement plus forte ni de déterminer quelles unités sont les meilleures.

Élargissement demandé, à préparer avant une nouvelle campagne représentative :

| Faction | Familles de decks à couvrir |
| --- | --- |
| Sephosi | Anges Protecteurs et Fureur divine ; Régiment de la Salamandre et son soutien ; Maréchal Vallardi et économie d’ordres ; Porte-ordres et actions sur plusieurs axes. Conserver les compositions d’infanterie, tir et cavalerie comme comparaisons. |
| Gobelins | Shamans Gobelins et Invokation ; Le Danzereu et Ligne Verte ; Blop, le Meuteur et renforts ; Trolls et sacrifices ; Katapult et réduction des dés. Conserver les variantes de troupes et Skrans comme comparaisons. |

Ce sont des familles à construire, pas des listes de cartes déjà validées. Respecter les 33 points, le déploiement à 21 points maximum, les quotas et **une seule Unique par deck** : Salamandre et Vallardi appartiennent donc à des compositions différentes, tout comme Danzereu et Blop. Blop commence en réserve.

Ajouter les cartes ne suffit pas : le validateur des decks de calibration exclut volontairement plusieurs capacités que les pilotes ne savent pas employer. Certains effets existent dans les situations contrôlées, mais chaque famille devra aussi disposer de choix légaux et utilisables par le bot : recrutement, cibles, sacrifices, placements et ordres associés. Ne pas retirer cette protection sans vérifier cette couverture.

## Déblocage progressif des ordres de recrutement

Pendant la pause en attente des trois réponses, Nicolas transmet une modification du fichier de règles datée du **14 septembre** : « Le premier ordre de recrutement est accessible à partir du tour 2. Le deuxième à partir du tour 3. Le troisième à partir du tour 4. » Source : extrait fourni dans la conversation, sans nouvelle lecture d’un fichier du Drive.

Ce calendrier fixe le nombre cumulé de sélections communes débloquées : 0 au tour 1, 1 au tour 2, 2 au tour 3 et 3 à partir du tour 4. Les sélections utilisées sont déduites de ce total ; celles non utilisées restent disponibles. Par exemple, dépenser un premier ordre au tour 2 interdit d’en jouer un deuxième avant le tour 3, même avec assez de points ou de PS.

Ce déblocage **2/3/4** est distinct du stock de points de recrutement **+3 aux tours 2/4/5**, adopté dans les réponses d’Adrien. Un ordre ne génère pas de points ; disposer de points ne débloque pas une sélection. Fureur divine conserve son propre stock et ne consomme pas de Recrutement commun supplémentaire.

Écart confirmé : le texte du catalogue `shared/orders.ts` mentionne déjà le calendrier 2/3/4, mais `analysis/simulation/orders.ts` contrôle seulement le tour minimal 2 et le plafond global de trois utilisations. Il permet donc de consommer prématurément les deuxième et troisième sélections si le financement suffit. Corriger ce contrôle avant la V3 et le tester aux tours 1 à 5, y compris avec des points/PS disponibles et des sélections conservées. Aucun moteur ni rapport modifié pendant cette pause.

## Ordre de reprise

1. Corriger les règles et le passage prématuré pendant les ordres identifié précédemment ; rendre les passages visibles dans le lecteur.
2. Vérifier quelques situations ciblées, incluant les deux camps et les frontières d’axes, avant tout recalcul de campagne.
3. Étendre les choix des bots et les decks aux familles ci-dessus, avec vérification de chaque capacité et de sa disponibilité réelle pendant une partie.
4. Relancer ensuite une campagne versionnée, distincte des anciennes, avec environ vingt relectures et des confrontations symétriques. Les réglages de puissance des unités viennent après la fidélité des règles et la couverture des capacités.

L’amélioration du MCTS ou le passage à l’ISMCTS ne corrigera pas à lui seul les actions illégales ni les capacités absentes des choix des bots.

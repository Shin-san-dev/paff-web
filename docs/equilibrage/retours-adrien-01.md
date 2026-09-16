# Premiers retours d’Adrien — questions 1 à 10

> **Archive de la première salve.** Les anciennes mentions « à préciser » décrivent l’état de cet échange. Les compléments ont été clos dans [la troisième salve](retours-adrien-03.md) ; consulter les [règles consolidées](regles-consolidees.md) pour la référence actuelle.

Source : réponses d’Adrien transmises par Nicolas dans la conversation du projet, après l’audit du 15 septembre 2026. Référence documentaire : **`adrien-01`**. Ce document conserve la première salve ; la [deuxième salve](retours-adrien-02.md) conserve l’étape historique suivante.

Ce document consigne les réponses du créateur pour la référence d’analyse. Il ne décrit pas une mise à jour déployée du jeu. Les profils d’unités restent ceux du catalogue `2026-09-15`. Le système de recrutement décrit par Adrien est retenu comme une règle, conformément à la correction de Nicolas ; les interprétations encore ouvertes sont identifiées séparément.

## Réponses reçues

### Q01 — Actions par unité

- Une unité ne peut pas recevoir plusieurs ordres Mouvement ni plusieurs ordres Tir dans le même tour.
- Une unité recrutée peut recevoir des ordres normalement pendant le reste du tour.
- **À préciser :** cette dernière phrase supprime-t-elle l’interdiction explicite de tirer le tour du recrutement dans le PDF p. 6 ? La limitation ordinaire déplacement/tir et l’exception Tir en mouvement ne sont pas redéfinies par cette réponse.

### Q02 — Combat

- Une charge constitue l’attaque de l’unité pendant la phase de combat : aucune seconde attaque dans les combats classiques, sauf capacité spéciale.
- Une seule cible par attaque, au tir comme en combat, sans répartition des dés, sauf capacité spéciale.
- Une unité engagée contre plusieurs ennemis ne peut attaquer qu’un seul de ces ennemis.
- Les dégâts sont **simultanés sur toute la phase**, même si les combats sont résolus un par un.
- Une unité blessée conserve tous ses dés tant qu’elle n’est pas détruite.
- Conséquence pour une future simulation : l’ordre matériel de lancement des dés ne doit pas annuler l’attaque d’une unité qui subit des pertes dans cette même phase. Le traitement d’une élimination totale simultanée reste à rapprocher de Q04.

### Q03 — Tir

- Distance comptée horizontalement et verticalement, sans diagonale : somme des écarts de ligne et de colonne.
- Interdiction de tirer dans un autre axe.
- Les unités alliées et ennemies ne bloquent pas les tirs.
- Une cible dans la même zone peut être visée.
- Les portées restent 3 cases pour le tir et 4 pour l’artillerie dans la référence du projet ; la réponse précise la mesure, pas de nouvelles valeurs.

### Q04 — Victoire

- L’absence d’unité d’un joueur sur l’aire de jeu entraîne sa défaite, même s’il lui reste une réserve, et cela peut arriver en cours de partie.
- Avec zéro unité déployée au départ, la partie commence puis ce joueur perd. Cela ne rend pas la sélection vide illégale : il faut distinguer droit de préparer et conséquence de victoire.
- Si les deux joueurs remplissent une condition de victoire totale à la fin du même tour, la partie continue ; si cela arrive au huitième tour, il y a égalité.
- Une égalité de zones stratégiques à la fin du huitième tour donne une égalité.
- **Cas à préciser :** les deux armées disparaissent lors de la même phase de combat, ou les deux joueurs commencent sans unité. La défaite dès l’absence d’unités et la poursuite en cas de victoire totale simultanée ne définissent pas explicitement une priorité pour ces cas. Aucune règle de départage ajoutée dans l’analyse.

### Q05 — Recrutement : nouveau système retenu

Adrien remplace les points apportés par chaque sélection Recrutement par une **réserve de points de recrutement** alimentée de 3 points aux **tours 2, 4 et 5**, soit 9 points au total.

- Les points non dépensés sont conservés.
- Un ordre Recrutement permet de dépenser autant de points disponibles que souhaité pour recruter.
- Les ordres Recrutement restent limités à trois sélections par partie.
- Il est possible de recruter uniquement avec des PS à condition d’avoir encore un ordre Recrutement disponible.
- **Statut : répondu et retenu.** Nicolas a signalé que cette réponse définissait déjà le nouveau système. La formulation « il faudrait plutôt » avait été interprétée trop prudemment comme une proposition en attente ; il n’y a pas de nouvelle validation à demander sur le stock conservé, les apports **2/4/5** et les trois sélections pour le dépenser. Ne pas réintroduire l’ancien système de points apportés par les ordres.

Le système du PDF/site reste, à ce stade, trois sélections accessibles aux tours 2/3/4 apportant 3 points chacune ; aucun compteur de points de recrutement conservés n’est ajouté au site par ce lot.

### Q06 — Charges

- La charge ne déplace pas l’unité : elle crée un engagement entre deux cases adjacentes.
- Une unité peut charger un ennemi déjà engagé.
- Les charges ne peuvent être effectuées que pendant la phase de charge, pas après.
- **Reste à préciser :** passer lors de l’alternance des charges empêche-t-il de charger lors d’une alternance ultérieure dans cette même phase ? La réponse interdit les charges après la phase, mais ne répond pas directement à ce passage temporaire.

### Q07 — Relances et surnombre

- Avec le surnombre, on peut relancer les échecs mais également des réussites si l’on cherche un résultat particulier.
- Dans un combat avec plusieurs unités de chaque côté, la différence du nombre total d’unités donne le nombre de dés relançables.
- Adrien indique : **« On ne va pas traiter les relances du tableaux pour cette version du jeu. »**
- Le bonus de +2 en désengagement s’applique aux jets de relance.
- **Lecture retenue pour un calcul distinct :** mêmes seuils de touches, sans relance des échecs à 2+(r), ni confirmation des réussites à 6+(r). Si Adrien voulait seulement reporter la discussion, il faudra conserver les probabilités du PDF. Les deux références restent comparables dans le CSV.
- **Reste à formaliser :** le périmètre d’un « combat » pour compter les unités dans un réseau d’engagements, si le nombre de relances est accordé à chaque attaquant ou partagé, et si un même dé ne peut être relancé qu’une fois. Aucune relance de surnombre n’est ajoutée aux 400 attaques isolées.

### Q08 — Renforts gobelins

- Les Bandes de « Tiens, des gobelins... » et les Skrans de Blop sont **créés en plus du deck**, pas prélevés en réserve.
- Ils ne comptent pas dans les limites du deck. Les autres règles ordinaires s’appliquent.
- Ces unités peuvent arriver dès le tour 1.
- S’il n’y a pas de cases disponibles, les unités qui ne peuvent pas être déployées sont perdues ; elles ne rejoignent pas une réserve à utiliser plus tard.
- La capacité de Blop se déclenche **une seule fois par partie, à son recrutement**.
- Ce droit d’arrivée au tour 1 ne donne pas à Blop un recrutement personnel gratuit ou un droit de déploiement initial : il reste en réserve au départ et son entrée doit elle-même être possible et payée. Les premiers points du nouveau stock arrivent au tour 2.

### Q09 — Fureur divine

- Les Anges doivent être présents dans la réserve.
- Leur coût se paie normalement ; le nombre d’Anges déployables dépend des points de recrutement disponibles et des exemplaires possédés.
- Déploiement possible dans n’importe quelle zone, y compris occupée par des ennemis et en Base Centre adverse. La règle générale d’une case libre reste applicable.
- Une arrivée peut permettre de gagner à la fin du même tour, sous réserve des conditions de victoire ordinaires.
- **Articulation à préciser avec Q05 :** Fureur divine constitue-t-elle à elle seule l’ordre permettant de dépenser le stock de points/PS, sans consommer aussi une des trois sélections Recrutement ? Le paiement n’est plus ambigu ; la coordination des stocks reste à formaliser.

### Q10 — Appui stratégique

- Tous les ordres accessibles peuvent être appliqués dans un second axe ; les points de recrutement ne sont pas doublés.
- La zone supplémentaire est choisie librement dans l’axe concerné, sans devoir être au même niveau que la première. La condition de présence d’un Porte-ordres dans l’axe supplémentaire est conservée.
- Les coûts et stocks d’ordre ne sont consommés qu’une fois.
- Chaque unité recrutée doit néanmoins être payée, quel que soit l’axe où elle arrive.
- Plusieurs Porte-ordres permettent de couvrir les trois axes, au maximum **trois zones, une par axe**. Il n’y a pas de copies successives ou récursives.
- Les plafonds d’actions par unité de Q01 restent applicables. La copie étend les unités pouvant être activées ; elle ne permet pas à une même unité de recevoir deux Tirs ou deux Mouvements dans le tour.

## Conséquences immédiates pour l’analyse

1. **Masse gobeline :** la création hors deck est confirmée. Un Blop apporte en moyenne deux Skrans créés si toutes les cases nécessaires sont disponibles ; les unités impossibles à placer sont perdues. « Tiens, des gobelins... » crée une nouvelle Bande au prix d’un ordre et d’une case, sans prélever de carte déjà payée.
2. **Soutiens Sephosi :** Appui stratégique peut couvrir trois zones pour une sélection d’ordre ; le budget de recrutement ne se multiplie pas. Les nouvelles limites par unité empêchent de rentabiliser des ordres supplémentaires en faisant simplement tirer le même tireur à répétition.
3. **Anges :** leur menace de victoire par arrivée en Base Centre est confirmée et payante. Le coût, les cases, les défenseurs non engagés et les actions adverses restantes doivent être intégrés à tout jugement d’équilibre.
4. **Charge et pertes :** une seule attaque de combat, une seule cible, dés conservés avec les blessures, simultanéité à l’échelle de la phase. La première unité dont on lance les dés n’obtient pas une attaque supplémentaire ni une suppression anticipée de riposte.
5. **Relances du tableau :** dans la lecture sans `(r)`, un 2+ donne 83,33 % au lieu de 97,22 %, et un 6+ donne 16,67 % au lieu de 2,78 %. Les probabilités changent pour 98 des 400 couples en moyenne de touches. Les effets de surnombre sont une question séparée.

Exemples : Archers Gobelins contre Trolls, probabilité de retirer les 2 R en une salve : **2,78 %** sans confirmation, contre **0,077 %** avec le PDF. Baliste contre DT1–3 : **83,33 %** de touche sans relance des échecs, contre **97,22 %** précédemment. Arbalétriers Sephosiens contre Bande intacte : **69,44 %**, inchangé, car cette confrontation ne relevait pas d’une case `(r)`.

## Compléments à demander

Avant une simulation complète, préciser le tir des recrues (Q01), les cas de disparition simultanée des armées (Q04), le passage temporaire pendant les charges (Q06), le sens de la mise à l’écart des relances du tableau et le partage des relances de surnombre (Q07), puis l’articulation Fureur/recrutement (Q09). Le stock conservé et le calendrier 2/4/5 de Q05 sont retenus et retirés des demandes de confirmation.

À l’issue de cette première salve, Q11–Q19 étaient en attente. Elles ont depuis reçu des réponses dans [la deuxième salve](retours-adrien-02.md), qui rassemble aussi les derniers points à trancher. Les calculs de ce document restent ceux de `adrien-01` ; aucune partie n’a été simulée et aucun recalcul n’est lancé pendant la finalisation des règles.

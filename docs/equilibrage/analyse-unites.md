# PAFF — première analyse d’équilibrage

> **Chiffres des attaques simples conservés à `adrien-01` ; conclusions ciblées actualisées à `adrien-03`.** Les derniers arbitrages ne changent ni les vingt profils ni les seuils utilisés par la matrice. Les [règles consolidées](regles-consolidees.md) et les [situations contrôlées](situations-verifiees.md) précisent les coûts d’ordres, les chronologies et les capacités. Le [lot 3 de calibration](campagne-calibration.md) ajoute ensuite des parties de robots ; il ne régénère pas ces 400 attaques et ne justifie aucun changement de coût.

15 septembre 2026 · Analyse initiale, puis révision ciblée au lot 2 après les trois salves · Gobelins et Sephosi · 20 unités.

**Trois priorités ressortent : examiner le rapport coût/avantages des Skrans, trouver une fonction convaincante aux Gros tarrés et mesurer l’économie des renforts et des ordres avant de conclure sur les factions.** La création de renforts hors deck, les copies d’ordre jusqu’à trois axes et l’arrivée payante d’Anges en Base Centre sont maintenant confirmées. Les Trolls, Anges et soutiens demandent toujours des situations de plateau.

Aucun profil ni aucune fonction du jeu n’est modifié. La **référence d’analyse** est enrichie des réponses d’Adrien, sans les appliquer au plateau manuel. Ce rapport théorique précède les campagnes. Les observations ci-dessous sont des résultats mathématiques locaux ou des hypothèses de conception, pas des taux de victoire prédits.

**Référence numérique confirmée :** la troisième salve confirme la suppression des deux règles `(r)` du tableau, avec seuils conservés. Les chiffres calculés à `adrien-01` restent donc utilisables pour les attaques simples. La comparaison avec les probabilités du PDF est conservée dans le CSV. Les relances de surnombre restent exclues de ces attaques isolées et sont vérifiées séparément sur des réseaux d’engagements dans le lot 2.

## Lire et reproduire le lot

- [Suivi des règles](audit-regles.md) : clôture des questions et références actuelles.
- [Réponses d’Adrien Q01–Q10](retours-adrien-01.md) : réponses reçues et compléments ; le recrutement est un système retenu, pas une proposition en attente, comme l’a précisé Nicolas. Les réponses Q11–Q19 sont dans la deuxième salve liée en tête du document.
- [Profils et tableaux chiffrés](chiffres.md) : 20 unités, probabilités du tableau des touches et dégâts contre chaque défense.
- [Matrice des 400 attaques](attaques.csv) : perte moyenne de R et probabilité de détruire la cible en **une attaque**, y compris rencontres de même faction. Ce ne sont pas 400 parties ni 400 duels.

Recalcul local : `node scripts/analyse-equilibrage.mjs`, avec Node 24. Les données sont lues directement dans le catalogue du projet et le tableau des touches existant. Les deux fichiers générés sont `chiffres.md` et `attaques.csv` ; ce rapport interprétatif et l’audit des règles restent rédigés et revus manuellement. Après une modification du catalogue, régénérer les chiffres **et réexaminer les conclusions datées**, pas seulement les tableaux.

Référence : PDF **PAFF 2026 (2)** reçu le 15 septembre, catalogue `2026-09-15`, arbitrages de Nicolas et réponses jusqu’à `adrien-03`. La matrice conserve son identifiant numérique `adrien-01`. Les colonnes éditoriales « modif éventuelle » du PDF ne sont pas des modifications adoptées. Le tableau des touches et les 20 profils de la p. 7 ont été comparés visuellement au catalogue ; seules les règles de relance de ce tableau diffèrent dans le calcul révisé.

## Ce que les calculs mesurent

Pour un dé, on calcule la probabilité `p` de toucher : de 1/6 à 5/6 sans relance du tableau dans cette révision. Avec `n` dés indépendants, les touches suivent la distribution binomiale : moyenne `n × p`. Pour une cible ayant `R` points, les pertes effectives sont `min(touches, R)` et la probabilité de destruction est `P(touches ≥ R)`. La référence PDF applique en plus les relances `(r)` et reste calculable séparément.

Exemple : deux dés qui touchent sur 4+ produisent en moyenne 1 touche. Contre une cible à 1 R, ils ne retirent que **0,75 R en moyenne** et la détruisent dans **75 %** des attaques. Le quatrième de probabilité restant est un échec complet. Utiliser simplement « R divisés par dégâts moyens » ne donne pas une durée exacte de survie.

Les tableaux n’accordent aucun bonus de position, de charge, de surnombre ou d’ordre. Les T attaquent contre DT au tir ; ils ne ripostent pas en mêlée. La Katapult applique un malus au lieu de dégâts. Les Trolls y sont conditionnés à une attaque normale, Danzereu à son tir ordinaire. Les sections suivantes examinent ces limites plutôt que d’en faire une note globale de puissance.

## Comparaisons à budget identique

Les dégâts ci-dessous sont **bruts**, sans sur-dégâts plafonnés, et supposent que toutes les unités peuvent attaquer. Plusieurs unités coûtent aussi plusieurs cases et peuvent nécessiter plusieurs ordres si elles sont dispersées. Ce tableau ne calcule pas un vainqueur de duel.

| Budget | Comparaison | Résultat calculable | Lecture et limite |
| --- | --- | --- | --- |
| 1 point | 1 Bande / 1 Skrans | Même R2, 2 dés C2, DC2, DT1. Skrans : mouvement 3 au lieu de 1, changement d’axe possible, +1 dé à la charge. | Forte pression pour choisir les Skrans jusqu’au quota de six. Le quota, les voies de passage et leur restriction de trajet empêchent de parler de supériorité universelle dans toutes les positions. |
| 2 points | 2 Bandes / 1 Gros tarré | Dégâts contre DC1 à DC5 : **2,667 / 2 / 1,333 / 0,667 / 0,667** contre **0,833 / 0,833 / 0,833 / 0,667 / 0,5**. R total 4 contre 1. | Deux Bandes égalent ou dépassent le dégât brut contre toutes les DC présentes, avec davantage de R et sans quota Élite. Le tarré concentre son attaque sur une seule case. Sans confirmation à 6+, même une hypothétique DC6 ne lui donne plus l’avantage brut : 0,333 contre 0,667 pour deux Bandes. |
| 3 points | 3 Bandes / 1 Epéiste | Face à une cible DC3 : 2 touches moyennes des deux côtés. R total 6 contre 3 ; DC2/DT1 contre DC3/DT3. | La horde n’a pas « trois fois l’offense » dans cette comparaison. Son nombre aide au contrôle et au surnombre ; l’Epéiste est plus compact et résiste mieux au tir par R. |
| 3 points | 1 Bande du chef / 1 Epéiste | Face à DC3 : 2 touches des deux côtés ; face à DC4 : 1,333 contre 1,5. Chef : R5/DC3/DT2 ; Epéiste : R3/DC3/DT3. | Chef favorisé par l’endurance et le volume contre faible DC ; Epéiste par l’attaque contre forte DC et la résistance de chaque R au tir. Le Chef consomme une place Élite. |
| 2 points | 2 Shamans / 1 Arbalétrier Sephosien | Même total de 2 dés T3, 2 R cumulés contre 2 R sur une carte ; les deux Shamans ont DT1, l’Arbalétrier DT2. | Deux corps et synergies magiques contre résistance, compacité et concentration des ordres. La possibilité de perdre un Shaman réduit les dés du groupe ; blesser l’Arbalétrier sans le tuer ne réduit pas son profil. |
| 4 points | 4 Skrans / 1 Ange | Face à DC3, sans charge : 2,667 contre 1,333 touches ; R total 8 contre 2. | Le prix du Vol ne se justifie pas par les dégâts. Il faut mesurer les cases accessibles malgré les écrans et les menaces sur la base, avec le quota de six cavaleries et quatre élites. |

## Gobelins — les dix unités

### Bande de Gobelins — 1 point

**Rôle :** masse de mêlée et présence territoriale. Les 2 dés révisés renforcent son rendement : contre DC3, une Bande produit 0,667 touche, deux 1,333, trois 2. Avec R2, une seule touche ne retire pas la carte ni ses dés. Son DT1 expose cependant ses effectifs aux tirs : une salve d’Arbalétriers Sephosiens a **69,44 %** de chances de retirer ses 2 R.

**À surveiller :** le cumul du coût 1, de la génération/recrutement gratuit, du surnombre et des unités laissées non engagées pour contrôler. Ce faisceau est plus significatif que le seul passage à deux dés. **Confiance élevée** dans l’efficacité locale ; avantage global de faction non établi.

### Archers Gobelins — 1 point

**Rôle :** volume de tir et intervention risquée dans une mêlée. Contre DT1, 1 touche moyenne contre 0,833 pour un Shaman de même coût ; contre DT3, seulement 0,333 contre 0,5. Contre DT5, sans confirmation à 6+, ils produisent désormais **0,333** touche contre 0,167 pour le Shaman, au lieu de 0,056 avec la référence PDF. Leur volume redevient utile contre les fortes DT ; ils ne sont pas simplement moins bons que les Shamans.

En Tir en mêlée, chacun des deux dés est attribué à un allié avec probabilité 1/2 : en moyenne **un dé contre l’ennemi et un contre l’allié**, puis chacun utilise la défense de sa propre cible. Face à un Epéiste engagé avec une Bande, cela donnerait 0,167 touche ennemie et 0,5 touche alliée, sans bonus. **Point d’attention :** cibles et défenses choisies peuvent rendre cette capacité nuisible.

### Shamans Gobelins — 1 point

**Rôle :** tir plus précis contre certaines défenses, support des deux Invokations. T3 contre DT3 donne 0,5 touche ; contre DT5, 0,167, désormais **la moitié** des Archers sans confirmation à 6+. Un seul dé ne peut détruire une carte intacte de 2 R en un tir ordinaire. Le gain contre DT3 et les synergies magiques deviennent plus importants pour justifier ce choix face aux Archers.

**À surveiller :** les grappes de Shamans. Invokation compte les autres Shamans à portée depuis le lanceur, puis inflige ses dégâts avant les sacrifices. Le bonus n’est pas annulé si les sacrifices sont insuffisants. Sans décor, Tir magique a moins d’occasions utiles ; il ne faut lui attribuer ni un bonus de dégâts implicite ni la suppression automatique de toute capacité adverse.

### Chevaucheurs de Skrans Gobelins — 1 point

**Rôle :** masse mobile, renfort de flanc, charge. Même profil brut qu’une Bande, plus la mobilité et un dé de charge : contre DC3, **1 touche en charge** au lieu de 0,667. Mur de lance supprime ce supplément.

**Premier candidat à examen du coût ou du profil.** Le bénéfice est mesurable au même prix ; le quota de six ne supprime pas l’incitation à les remplir. Avant de changer un chiffre, comparer des decks avec 0/3/6 Skrans, en tenant compte des déplacements réellement utiles. Les Skrans créés par Blop sont désormais confirmés hors deck et limites, sous réserve de pouvoir les placer. Le constat est robuste ; le bon correctif ne l’est pas encore.

### Katapult à gobs — 2 points

**Rôle :** neutralisation temporaire, **zéro dégât direct**. T5 touche une cible DT3 avec probabilité **83,33 %** ; si elle doit encore lancer au moins deux dés une fois dans le tour et si le malus est borné à zéro, cela retire en moyenne 1,667 dé à cette attaque. C'est une réduction de dés, pas de R.

**À surveiller :** l’ordre de jeu. Tirer après les attaques pertinentes de la cible peut ne rien apporter. Les malus de plusieurs Katapults se cumulent après les autres effets, avec plancher zéro, sans infliger de R. Le cas de deux Katapults et d’une cible aux dés doublés est vérifié en S07. Son unique R et son immobilité lui donnent une faiblesse lisible.

### Trolls — 3 points

**Rôle :** point d’ancrage résistant par R, offense imprévisible. Sans confirmation du tableau, une salve d’Archers T1 retire ses 2 R avec probabilité **2,78 %**, contre **0,077 %** avec le PDF. Leurs touches moyennes passent de 0,056 à 0,333. Un Shaman produit 0,167 touche et ne peut le tuer seul en un tir normal. Une Baliste T6 lui retire toujours 0,667 R moyen par tir. La suppression des confirmations réduit fortement la protection du Troll contre les attaques faibles ; elle n’annule pas son avantage contre tous les attaquants.

Pour **une seule occasion de combat ennemie**, sans bonus, Trollitude donne 0 dé ennemi sur 1/2/3, 2 dés sur 4/5, 3 sur 6. Moyenne : `(2 + 2 + 3) / 6 = 7/6` dé ennemi, contre les 2 dés du profil. Face à DC3 : **0,778 touche moyenne**, au lieu de 1,333 quand il attaque normalement. Sur 1, une attaque alliée existe si une cible admissible est présente ; elle n’est pas incluse dans ces dégâts ennemis.

**À surveiller :** risque d’inactivité au combat et dommage aux alliés. Le jet est fait au début du combat : il ne rend pas les mouvements précédents impossibles. Pause-déjeuner permet +1 R au plus par Troll pour chaque ordre, avec deux sélections de cet ordre par partie et dépassement des R initiaux autorisé. Ses défenses élevées ne suffisent pas à conclure qu’il est trop fort ; sa fiabilité et la perte d’alliés doivent être observées sur le plateau.

### Gros tarrés de gobelins — 2 points

**Rôle apparent :** coup puissant concentré. C5 franchit bien les défenses, mais un seul dé plafonne les dégâts à **1 R par attaque**. Il ne peut donc détruire aucune unité intacte de R2 ou plus en un coup sans bonus, même avec une excellente probabilité de toucher.

**Candidat le plus net à une identité à renforcer.** Deux Bandes au même prix offrent davantage de R et au moins autant de dégâts bruts contre toutes les DC actuelles. La compacité reste un avantage réel et peut aider quand une seule case d’attaque est disponible ; cela paraît peu pour compenser R1/DC1/DT1 et une place Élite. Tester une variante de coût, de dés ou une capacité spécialisée séparément, sans décider laquelle avant des situations comparables.

### Bande du chef — 3 points

**Rôle :** bloc de mêlée compact, robuste, efficace contre faible défense. Cinq R et quatre dés C3 au coût d’un Epéiste ; une attaque normale contre un Epéiste intact le détruit avec probabilité **31,25 %**, contre **29,63 %** pour une attaque d’Epéiste sur Epéiste. C’est un effet de la distribution des dés, malgré la même moyenne brute de 2 touches contre DC3.

**À surveiller :** bonus de dés et saturation du centre. Il est moins efficace que l’Epéiste contre DC4/5 et possède DT2 au lieu de 3. Bon candidat de référence gobeline à tester avec les Skrans, avant d’inférer une domination de faction.

### Le Danzereu — 2 points

**Rôle :** tir normal correct et menace de chaîne liée à l’alignement. Hors Ligne Verte, mêmes deux dés T3 qu’un Arbalétrier Sephosien, mais R1/DT1 contre R2/DT2, et une place Unique consommée.

**Valeur conditionnelle élevée, encore non chiffrable globalement.** Son sort coûte une carte alliée sacrifiée et peut frapper les deux camps. Il progresse verticalement dans un axe, s’arrête au premier vide ou échec et augmente ses dés/A à chaque cible. Les cas S11–S12 vérifient cette dépendance à l’alignement et les pertes adjacentes ; ils ne donnent pas sa fréquence utile dans une vraie partie. Ne pas extrapoler la puissance du sort à partir du tir ordinaire de la matrice.

### Blop, le Meuteur — 2 points

**Rôle :** chef de renfort avec corps de mêlée utilisable : R3, deux dés C3. Déploiement initial interdit, et choix exclusif avec Danzereu.

Un D3 uniforme donne en moyenne **deux Skrans créés en plus du deck**, sans compter dans ses limites : Q08 a tranché leur origine. Cet apport représente en moyenne deux points de cartes au-delà du Blop si tous peuvent être placés. Ceux qui ne trouvent pas de case sont perdus ; le déclenchement n’a lieu qu’une fois, lors du recrutement de Blop. **Mesurer cet apport réel avant de recommander un coût**, en incluant le paiement et le moment d’entrée de Blop, qui reste exclu du déploiement initial.

## Sephosi — les dix unités

### Lanciers Sephosiens — 3 points

**Rôle :** défense anti-charge. DC4 contre C2 ne subit que 1/6 de touche par dé ; DT3 protège mieux que les DT1/2 gobelines. Mur de lance annule le supplément de charge, y compris celui de Charge puissante.

**À surveiller :** capacité à tenir un objectif sans être tous engagés. Deux dés C3 produisent seulement 0,667 touche contre DC4 ; ils sont moins offensifs que les Epéistes. Leur spécialisation a du sens si les charges pèsent vraiment dans les parties, moins face au tir ou à un contournement.

### Epéistes Sephosiens — 3 points

**Rôle :** infanterie polyvalente et repère de comparaison. R3, trois dés C4, DC3/DT3. Contre une Bande intacte : 2,5 touches brutes, 1,921 R effectivement retiré en moyenne et **92,59 %** de destruction en une attaque normale. En mêlée simultanée, cela n’efface pas la riposte de cette Bande.

Le DT passé à 3 réduit les touches de deux dés T3 de 1,333 à 1, soit **25 % de dégâts bruts attendus en moins** pour cet attaquant précis. **À surveiller :** rendement face à plusieurs petites unités, où compacité et sur-dégâts ne compensent pas nécessairement le contrôle de plusieurs cases.

### Arbalétriers Sephosiens — 2 points

**Rôle :** tir régulier, deux dés T3 sur une carte R2. Ils retirent une Bande intacte dans **69,44 %** des tirs ordinaires légaux. Leur deuxième R maintient les deux dés après une blessure ; ils sont néanmoins sans riposte C et n’ont que DC1.

**À surveiller :** placement protégé et Tir concentré. À budget égal, deux Shamans ont la même offense mais occupent deux cases avec des synergies différentes. Il n’y a pas d’infériorité simple de l’une des deux options.

### Cavalerie lourde Sephosienne — 3 points

**Rôle :** charge décisive, faible combat prolongé. Un dé C4 de base, deux en charge ordinaire sans déplacement préalable, **quatre** avec déplacement et Charge puissante. Face à DC3 : 0,667 / 1,333 / 2,667 touches brutes selon ces trois situations.

Contre une Bande R2/DC2, quatre dés C4 donnent **98,38 %** de destruction en une charge, contre 0 % pour son seul dé hors charge. Contre Mur de lance, le bonus disparaît. La charge consomme maintenant explicitement son attaque de combat ; elle ne frappe pas une seconde fois dans cette phase. **À surveiller :** fréquence réelle des charges utiles et coût d’un repli ; une moyenne qui mélange les trois états serait trompeuse.

### Arbalétriers Montés — 2 points

**Rôle :** projection et tir mobile, pas cavalerie de mêlée. Un seul dé T3, R1/DC1/DT1 ; offense de Shaman au double du coût. Le type Cavalerie ne leur donne pas une attaque C.

**Candidat à surveiller si la mobilité est peu récompensée.** Ils paient la possibilité de changer d’axe et de combiner déplacement/tir, mais cette combinaison consomme **un Mouvement et un Tir**. Ce n’est pas une économie de sélection ; les deux ordres peuvent bénéficier aux autres unités éligibles de la zone. À distance et position identiques, un Arbalétrier à pied au même prix est plus solide et tire deux fois plus de dés. Leur intérêt doit donc venir des positions et des occasions de tir rendues accessibles, vérifiées dans A01, puis mesurées en partie.

### Balistes Sephosiennes — 2 points

**Rôle :** tir précis de longue portée, faible volume. Sans relance du tableau, T6 touche DT1/2/3/4 à **83,33 %**, DT5 à 66,67 %. Les 97,22 % du premier calcul contre DT1/2/3 ne s’appliquent plus à cette référence. Son unique dé n’enlève jamais plus de 1 R sans bonus : outil de finition ou élimination de R1, pas destruction immédiate d’une Bande R2.

**À surveiller :** occasions de tir depuis l’arrière et coût de l’ordre Artillerie séparé. Tir concentré inclut bien les Balistes : avec plusieurs tireurs éligibles d’une zone, chaque Baliste obtient deux dés au lieu d’un et peut ainsi menacer une cible R2. Ce gain dépend d’un regroupement et d’un ordre avancé disponible, pas de tous les tirs.

### Anges Protecteurs de la Sephosi — 4 points

**Rôle :** passage au-dessus des lignes, intrusion, accès aux cases libres difficiles à atteindre. Deux dés C4, R2/DC3/DT2 : faible rendement brut pour quatre points si on les traite comme infanterie frontale.

**Verdict lié à leur rôle stratégique.** Q09 confirme une arrivée payante depuis la réserve, y compris dans une Base Centre contenant des ennemis, avec victoire possible en fin de tour si ses conditions sont remplies. Vol peut franchir les écrans. Leur type Élite n’accorde pas automatiquement le dé de charge de cavalerie. Priorité : mesurer menaces, défenseurs non engagés et réponses disponibles ; le financement avec le nouveau stock retenu doit encore être articulé, sans renforcer immédiatement les dés.

### Porte-ordres Sephosiens — 2 points

**Rôle :** étendre un ordre à un autre axe. Aucune attaque, R1/DC1/DT1, coût en points et en quota Élite. Sa présence non engagée peut tout de même contrôler une zone selon la règle générale.

**Extension d’ordre confirmée jusqu’à trois zones, une par axe**, avec les soutiens nécessaires, sans récursion. Tous les ordres sont concernés, les coûts/stocks payés une fois ; chaque recrue reste à payer et aucun point de recrutement n’est multiplié. Une copie sans unité éligible n’apporte rien ; les unités ne gagnent pas de deuxième Tir/Mouvement. Mesurer les activations réellement utiles et le coût de protection ; ne pas lui attribuer une note zéro à partir des dégâts.

### Maréchal Vallardi — 2 points

**Rôle :** augmenter la quantité d’ordres. Aucun dé, aucune attaque : ces cases ne sont pas des données manquantes. S’il est autorisé à produire son bonus pendant huit tours, il ajoute au plus **8 sélections** aux 24 de base, soit +33,33 % sur ce seul nombre. Cela ne signifie ni +33,33 % de dégâts, ni de chances de gagner ; PS, stocks et actions utiles changent le rendement.

**Bonus précisé :** aucun ordre depuis la réserve ; +1 dès le tour du recrutement, conservé jusqu’à la fin du tour s’il meurt. Une arrivée tardive réduit donc le nombre de tours utiles, sans attendre un tour supplémentaire pour le premier bonus. Il consomme le seul slot Unique : choisir Vallardi exclut Salamandre et l’usage de son ordre conditionnel. Il faut mesurer combien d’ordres supplémentaires peuvent effectivement activer des unités.

### Régiment de la Salamandre — 4 points

**Rôle :** infanterie d’élite compacte et pivot d’un ordre de zone. Même R3 et trois dés C4 qu’un Epéiste, avec DC4/DT4 au lieu de 3/3, pour un point de plus et une place Unique.

Face à deux dés C2, la moyenne subie passe de 0,667 à 0,333 touche grâce à DC4 ; ce bénéfice ne vaut pas uniformément −50 % contre tous les attaquants. L’ordre Protéger la Salamandre donne +2 dés aux **autres** unités remplissant sa condition, tirs compris, et reste actif jusqu’à la fin du tour même après sa mort ou son repli. **À surveiller :** nombre d’alliés ayant encore une attaque utile contre cette zone et renoncement à Vallardi.

## Ordres : le multiplicateur à ne pas oublier

| Ordre | Lecture pour l’équilibrage |
| --- | --- |
| Mouvement / Tir / Tir Artillerie | Un ordre peut activer plusieurs unités d’une zone. La masse groupée amortit ce coût ; la dispersion et la séparation Tir/Artillerie le renchérissent. Q01 interdit plusieurs Mouvements ou Tirs pour la même unité dans le tour. Appui peut étendre l’ordre à trois axes sans lever ce plafond. |
| Recrutement | Règle Q05 retenue : 9 points de base, crédités par 3 aux tours **2/4/5**, conservés jusqu’à dépense via au plus trois ordres. Une unité à 4 points exige assez d’épargne ou un supplément de PS. La réserve peut manquer de financement ou arriver trop tard. Statut documentaire corrigé après précision de Nicolas, sans recalcul. |
| Tiens, des gobelins... | Q08 confirme la création d’une Bande hors réserve et limites du deck, possible dès le tour 1, au prix d’une sélection et d’une case. Sans case, elle est perdue. Ordre illimité ne signifie pas quantité d’actions illimitée dans un tour. |
| Invokation shamanique | Un jet de conséquence : perte moyenne de **2/3 Shaman si au moins deux autres sont disponibles**, **1/2 avec un seul**, zéro si aucun. Le lanceur est exclu. Les bonus de tir précèdent ces pertes ; sur 6, le même tir est répété sans nouvelle conséquence si la cible survit. Ces petites moyennes conditionnelles ne sont pas un rendement global de l’ordre. |
| Pause-déjeuner | Une carte sacrifiée pour +1 R par Troll au maximum pour cet ordre, au-delà de ses R initiaux possible. Avec une Bande intacte, on échange 2 R sur le terrain contre 1 R mieux protégé. Comparer sacrifice d’une carte blessée, contrôle perdu et disponibilité des deux sélections. |
| La gross Invokation ! | Si N unités sont affectables au total et n dans l’axe choisi, chaque carte ayant au moins 1 R, la perte immédiate moyenne est `N/6 + n/3` R. Sur 4/5, bonus dans l’axe ; sur 6, partout. Les bonus ne servent qu’aux attaques restant à effectuer. Une armée de R1 risque de perdre des cartes entières, leurs futures actions et leur contrôle. |
| Repli stratégique | Déplace directement une unité sans les attaques gratuites à +2, au prix d’un ordre et de son mouvement du tour. Peut préserver une carte, libérer du contrôle ou préparer une charge future. À distinguer de la capacité inutilisée avec un dé P. |
| Tir concentré | Plusieurs tireurs d’une zone, artillerie comprise, reçoivent chacun +1 dé et tirent immédiatement pour une sélection. +100 % de dés pour une unité à un dé, +50 % pour une unité à deux ; les pertes effectives dépendent des R de la cible. |
| Fureur divine | Anges de réserve payés en points/PS, arrivée possible en Base Centre ennemie occupée, victoire possible à cette fin de tour. L’ordre rare suffit : aucune sélection Recrutement commune supplémentaire. Son économie porte sur la sélection et la position, pas sur le coût des Anges. |
| Protéger la Salamandre ! | +2 dés peut tripler une attaque à un dé ou doubler une attaque à deux dés, sous condition de zone et de Salamandre engagée. Mesurer aussi l’ordre dépensé, les alliés réellement éligibles et les menaces ailleurs. |

## Ce qu’on peut dire des factions

**Gobelins :** accès à des corps bon marché, nombreuses possibilités d’occupation et de surnombre, cavalerie très accessible et création de renforts confirmée hors deck. En contrepartie, nombreux DT1, plusieurs R1, sacrifices et risques de pertes alliées. La force de la masse dépend de l’espace, des ordres par zone, de l’engagement et du moment des renforts. Sans confirmations du tableau, les attaques faibles redeviennent plus efficaces contre les défenses extrêmes.

**Sephosi :** davantage de résistance et d’offense concentrées sur certaines cartes, contre-charge, mobilité spécialisée et économie d’ordres. Les soutiens coûtent des points sans combattre ; leurs combos demandent que la bonne unité survive au bon endroit et au bon moment. Un robot médiocre qui ne prépare pas ces situations pourrait les faire paraître artificiellement faibles.

**Aucune faction favorite démontrée.** La victoire récompense le contrôle et l’intrusion, pas les pertes infligées. Le contrôle rapporte aussi des PS : des unités bon marché peuvent alimenter des actions supplémentaires, tandis qu’un Ange ou un repli bien placé peut changer une fin de tour sans produire de dégât.

## Priorités pour les prochains essais

| Priorité | Hypothèse | Preuve disponible | Expérience qui pourrait la contredire |
| --- | --- | --- | --- |
| Haute | Les Skrans sont un choix trop évident à 1 point. | Même profil qu’une Bande plus mobilité/charge ; quota six. | Decks de même budget à 0/3/6 Skrans : leur avantage disparaît-il dans les embouteillages, contre anti-charge ou faute d’ordres utiles ? |
| Haute | Le Gros tarré manque d’une niche utile. | Budget égal à deux Bandes, moins de R, pas plus de dégâts bruts sur DC1–5, une seule touche maximum. | Positions avec une seule case disponible, buffs de dés et cibles résistantes : apporte-t-il assez pour justifier ses deux points et son quota Élite ? |
| Haute | Les renforts et copies d’ordres peuvent dominer les profils. | Création Blop/Bandes, intrusion payante des Anges, Appui sur trois axes ; stock 2/4/5 et chronologie de Stratège acquis. | Mesurer cartes réellement placées, points dépensés et activations utiles, indépendamment de la victoire finale. |
| Moyenne | Les Montés ou les Anges paient une mobilité trop chère. | Rendement de combat faible à budget égal. | Mesurer accès aux objectifs, contournements et victoires de base empêchés/rendus possibles, avec et sans leurs outils. |
| Moyenne | Les Trolls créent des combats peu intéressants malgré une moyenne acceptable. | Défense contre attaques faibles moins extrême sans confirmation du tableau, mais inactivité ou dommage allié fréquents. | Comparer les deux références et relever tours de blocage, décisions disponibles et amplitude des résultats, pas seulement dégâts moyens. |
| Moyenne | Chef, Epéistes et Salamandre offrent des points de comparaison sains. | Avantages distincts et chiffrables, avec compacité et quotas. | Confrontations symétriques de positions puis armées mixtes ; vérifier que ces options restent utiles face à la masse et aux bonus. |

Ce lot ne propose **aucun nouveau coût officiel**. Lorsqu’une variante sera essayée, changer un paramètre à la fois et conserver l’original comme témoin. Les premières dizaines de parties pourront signaler de gros problèmes ; elles ne suffiront pas à départager finement deux options proches.

Pour séparer équilibre et qualité de jeu au lot des simulations : mêmes règles et budgets, inversion des camps et de l’initiative, familles de stratégies de plusieurs niveaux, tirages reproductibles, résultats par stratégie et par confrontation. Réserver aussi des decks et situations non utilisés pour régler les robots. Si un avantage ne survit pas à ces variations, le présenter comme dépendant du pilote. Aucun robot isolé ne permettra de prouver l’équilibre général.

L’espace de consultation et de simulation sera ajouté **au lot des simulations**, conformément au choix de Nicolas. Il devra rester sur une branche dédiée pendant la revue, et son accès sur le site sera réservé au compte Nicolas avec protection serveur, sans statistiques ajoutées aux profils des joueurs.

## Vérification du lot

**Lot 2 :** les tests du moteur vérifient des situations à dés imposés, détaillées dans [le rapport](situations-verifiees.md). Ils ne recalculent pas la matrice ni ne simulent des parties complètes. Les compositions encore provisoires et les options non raccordées sont signalées ; aucun coût d’unité n’est modifié. Le protocole des campagnes est dans [la méthode](methode-simulations.md).

La première version a passé `npm run check` avec **251 tests**. La révision `adrien-01` a passé **253 tests**, le lint, les types de l’application et le build ; les modules d’analyse et leurs tests ont également passé leur contrôle TypeScript séparé. Deux tests supplémentaires portent sur les probabilités sans `(r)` et la conservation des résultats PDF dans chaque couple. Les contrôles couvrent aussi les 36 cases imprimées, le plafonnement des pertes, l’absence de dégâts de la Katapult, C/DC et T/DT, et l’intégrité des 400 couples. Les liens locaux sont valides, le CSV est versionné et la régénération des deux fichiers produit un contenu identique. Aucune modification du site, des profils d’unités ou des fonctions Convex ; aucune écriture en développement ou en production.

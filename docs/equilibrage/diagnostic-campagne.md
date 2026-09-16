# Diagnostic des parties de calibration

Analyse du 15 septembre 2026, demandée par Nicolas après lecture des victoires/défaites. Référence : **`calibration-2026-09-15-2`**, moteur `calibration-1`, robots `heuristiques-1`, règles `paff-2026-09-15-adrien-03`. Empreinte des sources : `b084746d7505359dc6f3a98c214012b4302513ad6ca84985d0fd516fdf0ee73e`.

Le diagnostic porte sur les **648 confrontations entre factions** de la campagne existante. Les 144 miroirs sont exclus des comparaisons Gobelins/Sephosi. Chaque décision et chaque dé des 648 parties ont été rejoués à l’identique ; les dégâts détaillés ci-dessous ont été rapprochés des pertes effectives, cible par cible. Un essai séparé de 108 configurations mesure une variation de défense du robot Sephosi. Le moteur, les règles, les robots de référence et les résultats affichés dans l’atelier restent inchangés.

## Conclusion

Le mécanisme dominant observé est **l’occupation du plateau, puis son effet sur les objectifs et l’économie d’ordres**. Les Gobelins disposent de beaucoup plus d’unités et de R au départ ; ils contrôlent rapidement davantage de zones, financent davantage d’ordres et prennent la Base Centre. Les Sephosi infligent pourtant davantage de dégâts.

La Bande du chef et les unités à un point sont les premières pistes de vérification des profils. Les décisions des robots contribuent au problème : défense tardive de la base, déplacements qui consomment la possibilité de tirer, activation peu efficace des tireurs. Le petit essai de garde de base améliore la résistance Sephosi sans renverser l’écart. On ne peut donc ni attribuer toute la domination à une capacité, ni conclure que toute la différence disparaîtrait avec de meilleurs robots.

## 1. Comment les parties se terminent

| Résultat | Base Centre | Contrôle au tour 8 | Élimination | Total |
| --- | ---: | ---: | ---: | ---: |
| Victoire Gobelins | 534 | 64 | 0 | 598 |
| Victoire Sephosi | 8 | 6 | 0 | 14 |
| Égalité | — | — | — | 36 |

**89,3 % des victoires Gobelins viennent de la Base Centre.** Leurs victoires surviennent en moyenne au tour 4,82, celles des Sephosi au tour 5,57. Les 36 égalités atteignent le tour 8. Il y a 34 victoires Gobelins dès le premier tour.

Dans 412 des 534 prises de base gobelines, aucun défenseur Sephosi ne subsiste dans la zone à la fin ; dans les 122 autres, les défenseurs présents sont tous engagés. Selon VIC-02, un ennemi engagé ne conteste pas seul une zone : une unité gobeline libre peut donc donner le contrôle.

Au moment d’une victoire Gobelins, il reste en moyenne **4,98 unités Sephosi sur le plateau, 9,50 R et 2,56 unités en réserve**. La défaite intervient souvent alors que l’armée peut encore combattre.

## 2. Les Sephosi font des dégâts, mais perdent les objectifs

| Pertes effectives infligées à l’adversaire | Gobelins | Sephosi |
| --- | ---: | ---: |
| R retirés sur les 648 parties | 9 932 | 12 702 |

Ces valeurs plafonnent les pertes aux R restants de chaque cible et excluent les deux R de tirs fratricides gobelins. Les touches excédentaires ne sont pas des dégâts effectifs.

Les Sephosi retirent donc **environ 28 % de R supplémentaires** à l’adversaire sur cette campagne. Cela ne mesure pas une meilleure rentabilité : les Gobelins leur présentent davantage de R et des unités moins chères. Cela montre en revanche que « les Sephosi ne réussissent pas leurs attaques » n’explique pas la domination observée.

### Exemple : `partie-218`

Gobelins 3 Skrans contre Sephosi référence, deux robots Contrôle, graine 151, initiative Sephosi. Coordonnées du plateau : colonnes A–I, lignes 1–6, Sephosi au nord.

1. Les Sephosi déplacent leurs Epéistes de F2 vers F3 et leur cavalerie de E2 vers C3. Leur Base Centre perd ses deux défenseurs.
2. Un Skran passe de G5 à G2, dans cette base.
3. Les Sephosi ramènent un Arbalétrier de F1 à F2 pour contester la zone, puis activent leur flanc.
4. Au combat, le Skran charge cet Arbalétrier et le détruit. Les Sephosi détruisent trois Bandes ailleurs.
5. Les Gobelins gagnent à la fin du **tour 1**, malgré **8 R perdus contre 4** infligés. Sept unités Sephosi survivent sur le plateau.

Aucun recrutement, renfort gratuit ou achat d’ordre n’a eu lieu. La position de la base, la mobilité et la fragilité du défenseur de secours suffisent à expliquer cette victoire précise.

## 3. Effectifs, résistance et économie

Tous ces déploiements coûtent **21 points**.

| Déploiement | Unités | Total de R | Combattants C | Dés C de base | Tireurs | Dés T de base |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Gobelins, chacun des trois decks | 15 | 35 | 11 | 28 | 4 | 8 |
| Sephosi référence | 8 | 18 | 5 | 10 | 3 | 5 |
| Sephosi infanterie | 8 | 20 | 5 | 13 | 3 | 5 |
| Sephosi tir | 9 | 19 | 3 | 7 | 6 | 10 |

Les scores d’attaque/défense et les bonus de charge diffèrent ; les colonnes de dés ne sont pas des dégâts attendus. En revanche, le nombre de corps compte directement pour occuper plusieurs zones, engager les défenseurs et garder une unité libre pour le contrôle.

Les règles produisent un effet cumulatif visible très tôt :

| Mesure | Gobelins | Sephosi |
| --- | ---: | ---: |
| Zones stratégiques contrôlées à la fin du tour 1, moyenne par partie | 1,50 | 0,27 |
| PS gagnés sur toute la campagne | 4 100 | 728 |
| Ordres supplémentaires achetés | 2 710 | 514 |
| PS dépensés pour recruter | 1 390 | 80 |
| Unités entrées par Recrutement commun | 3 914 | 1 422 |
| Unités déplacées par ordre Mouvement, moyenne | 2,20 | 1,23 |

Les PS d’un tour terminal ne sont pas comptés comme revenus disponibles. La meilleure occupation finance ensuite davantage de mouvements et de recrues. Il s’agit d’un mécanisme compatible avec les trajectoires observées ; ces totaux ne permettent pas d’attribuer un pourcentage causal des victoires à l’économie seule.

## 4. Unités et capacités réellement impliquées

### Bande du chef : première unité à examiner

Elle réalise **7 662 des 13 150 touches de mêlée gobelines, soit 58,3 %**. Une Bande du chef libre participe au contrôle de la base dans **308 des 534 prises de base gagnantes**. Chaque deck en déploie trois et en conserve une en réserve : cette présence constante empêche d’isoler son effet sur le taux de victoire.

Son profil est solide sans capacité spéciale : **3 points, 5 R, 4 dés, C3/DC3**. À coût égal, les Epéistes ont **3 R, 3 dés, C4/DC3**. Dans un échange isolé sans bonus ni relance, chacun inflige en moyenne deux touches brutes à l’autre, mais la Bande du chef dispose de deux R supplémentaires. C’est une piste concrète de rentabilité à tester, pas une justification suffisante pour changer son coût.

### Bandes et Skrans : occupation peu coûteuse

Les Bandes participent à **268** prises de base gagnantes, les Skrans à **220**, les Archers à **20**. Plusieurs types peuvent participer à la même prise : **ne pas additionner ces comptes**.

Les Skrans accélèrent les incursions, comme dans l’exemple du tour 1. Leur nombre ne suffit cependant pas à expliquer les résultats :

| Deck Gobelins | Victoires / 216 | Pourcentage |
| --- | ---: | ---: |
| 0 Skran | 202 | 93,5 % |
| 3 Skrans | 208 | 96,3 % |
| 6 Skrans | 188 | 87,0 % |

La composition et le placement fixe changent avec leur nombre. Ces résultats n’établissent pas que six Skrans seraient intrinsèquement moins bons que trois.

### Surnombre : avantage réel, contribution limitée aux touches

Les relances de dés ratés ajoutent **748 touches de mêlée gobelines**, soit **5,7 %** de leurs touches, contre **214** côté Sephosi. Ce sont les réussites supplémentaires effectivement obtenues après relance, avant plafonnement des dégâts aux R restants. Cela ne signifie pas que supprimer la règle ferait perdre 5,7 % de victoires : une seule touche peut tuer un défenseur et changer l’objectif.

### Renforts gratuits et Tir en mêlée : pas nécessaires à la domination observée

- L’ordre de renfort gratuit est utilisé **716 fois**. Les Bandes ainsi créées produisent **112 touches de mêlée**, soit 0,85 % des touches gobelines. Aucune n’est une unité libre contrôlant la base adverse lors d’une victoire finale. Elles peuvent néanmoins tenir des zones ou engager un défenseur : leur effet indirect n’est pas mesuré par ces deux chiffres.
- Sur **434 parties sans aucun renfort gratuit**, les Gobelins gagnent **424 fois**. Ce sous-ensemble favorise les parties courtes ; il prouve que le renfort n’est pas nécessaire à ces victoires, sans mesurer l’effet de sa suppression.
- Les Archers Gobelins effectuent seulement **4 tirs sur une mêlée**, sur 244 activations de tir au total. Cette capacité ne peut pas être l’explication générale des 598 victoires.

### Les outils Sephosi ne sont pas tous exploités

- **Tir concentré : 168 ordres**, activant exactement deux tireurs chacun ; 526 R ennemis retirés. Il fonctionne et inflige des pertes. Le résultat actuel ne permet pas de le qualifier de faible.
- **Charge puissante :** la cavalerie lourde reçoit 740 dés de charge supplémentaires au total. Les Epéistes restent le premier contributeur Sephosi aux touches de mêlée : 8 658.
- **Mur de lances :** les Lanciers annulent 80 dés de charge de Skrans dans les attaques réellement choisies. Leur effet dissuasif sur les charges non choisies n’est pas quantifié.
- **Tir en mouvement :** les Arbalétriers Montés, initialement en réserve dans le seul deck référence, n’effectuent que 20 activations de tir. Cette campagne examine donc très peu leur potentiel.
- **Vallardi, Porte-ordres, Anges et Salamandre ne figurent pas dans ces decks.** Leurs capacités et ordres ne peuvent pas expliquer les résultats, et leurs éventuelles compensations tactiques ne sont pas testées. Même limite pour les unités complexes gobelines absentes.

## 5. Ce que les robots font mal ou examinent trop peu

La lecture de `bots.ts` montre que les trois styles utilisent le même générateur de choix ; seuls les coefficients changent. Le robot récompense fortement l’entrée dans la base adverse. Il ne valorise la défense de sa propre base que lorsqu’un ennemi s’y trouve déjà, sans anticiper une incursion ou une charge contre le seul défenseur.

Autres limites mesurées :

- **596 ordres Sephosi** retirent le dernier défenseur libre de la Base Centre avant l’entrée d’un ennemi. Le même comportement existe côté Gobelins, 908 fois : le défaut est commun, ses conséquences dépendent des armées.
- **2 110 déplacements Sephosi** concernent un tireur qui pouvait légalement tirer à cet instant et perd cette possibilité en bougeant. Certains mouvements sont utiles ; ce décompte ne les classe pas tous comme erreurs.
- Parmi 9 576 occurrences « unité × tour » Sephosi avec une cible légale lors d’une de leurs décisions d’ordre, **7 554 n’aboutissent à aucun tir**. Manque d’ordres, mort avant activation et priorité donnée à une position peuvent l’expliquer ; c’est un signal à examiner, pas un taux d’erreur.
- Pour un Tir ordinaire, le robot exclut une cible dès qu’un premier tireur lui est assigné. Il ne propose donc pas la concentration ordinaire de plusieurs tireurs sur un ennemi résistant, même lorsque cela serait légal. Les 984 ordres Tir Sephosi n’activent que 1 012 tireurs ; le regroupement est peu exploité.
- Le score d’un Mouvement additionne les gains des unités déplacées. Une activation nombreuse peut dépasser le score d’un tir ; la qualité d’un choix n’est pas comparée à l’échelle d’un tour complet.

L’initiative n’explique pas l’écart : les Gobelins gagnent **292/324** avec l’initiative et **306/324** lorsque les Sephosi commencent. Selon la paire de styles, ils gagnent de **60 à 70 parties sur 72**. Changer uniquement les coefficients actuels ne fournit pas une stratégie indépendante suffisamment différente.

## 6. Essai isolé : garder un défenseur en Base Centre

Une seule modification du choix Sephosi : refuser un candidat Mouvement ou Repli qui retirerait le dernier allié libre d’une Base Centre actuellement défendue. La règle n’ajoute pas un défenseur quand la base est déjà vide, ne choisit pas de nouveau placement et n’anticipe pas les combats. L’ordre proposé entier est refusé ; il n’est pas réécrit. Les Gobelins conservent leurs décisions habituelles dans l’état qu’ils observent.

Échantillon fixé sans regarder les gagnants : **108 configurations**, neuf paires de decks × trois styles identiques de part et d’autre × deux graines × deux initiatives, Gobelins au sud. L’autre orientation est omise ; les 396 paires inversées de la campagne avaient confirmé sa symétrie. Le runner sans cette variation reproduit **chaque action et chaque empreinte d’état** des 108 références avant de tester la garde.

| Sur les mêmes 108 configurations | Référence | Garde Sephosi |
| --- | ---: | ---: |
| Victoires Gobelins | 98 | 92 |
| Victoires Sephosi | 1 | 1 |
| Égalités | 9 | 15 |
| Durée moyenne | 5,46 tours | 6,67 tours |
| Victoires Gobelins par Base Centre | 76 | 59 |

La `partie-218` passe d’une victoire Gobelins au tour 1 à une égalité au tour 8. Sur l’échantillon, sept victoires Gobelins deviennent des égalités et une devient une victoire Sephosi ; une ancienne égalité et l’ancienne victoire Sephosi deviennent des victoires Gobelins. Les changements ne sont donc pas uniformément bénéfiques.

**Conclusion limitée :** cette consigne de garde retarde et évite certaines défaites rapides, mais la domination subsiste. Elle mesure la sensibilité à une décision du robot, pas l’effet d’un défenseur optimal, ni le niveau de jeu humain. Les règles, coûts, placements initiaux et graines restent identiques ; après divergence des actions, les dés d’une même graine ne concernent plus nécessairement les mêmes attaques. Ce n’est pas un essai avec jets identiques par attaque.

## 7. Vérifications prioritaires avant un changement d’équilibrage

1. Améliorer les décisions de défense et l’emploi des tirs : menaces immédiates sur la base, placement des Lanciers, concentration ordinaire, choix Tir/Mouvement et activation de plusieurs tireurs. Comparer au robot de référence avec le même protocole, puis sur des graines nouvelles.
2. Varier réellement les compositions et déploiements : notamment moins de Bandes du chef, plusieurs répartitions Sephosi entre infanterie et tir, et des formations défensives. Les trois decks Gobelins actuels conservent tous le même noyau de chefs.
3. Mesurer séparément la valeur des effectifs bon marché pour le contrôle et la rentabilité de la Bande du chef. Faire varier un seul facteur à la fois, en conservant les résultats de référence ; des variantes de règles éventuelles restent des expériences isolées.
4. Étendre les cartes et capacités admises avec leurs situations vérifiées, surtout les outils de soutien Sephosi absents. Ne pas extrapoler ce panel restreint à toutes les factions possibles.

Aucune modification de coût, de capacité ou de condition de victoire n’est décidée par ce diagnostic. L’écart observé est massif, mais les deux graines et les rotations liées ne sont pas 648 observations indépendantes : aucun intervalle de confiance ou test de significativité n’est déduit de ce total.

## Reproduction et périmètre technique

```sh
node scripts/diagnostiquer-simulations.mjs
node scripts/sonder-defense-base.mjs
```

Le premier script lit `analysis/simulation/output/parties.ndjson`, vérifie l’empreinte des sources contre le rapport publié et rejoue les 648 confrontations sans redemander de décision aux robots. L’instrumentation des attaques est volontairement limitée aux unités présentes dans cette campagne : elle refuse les Trolls, Salamandres et tirs de Katapult au lieu de leur attribuer silencieusement des dégâts ordinaires. Les relances sont celles des dés ratés. Chaque jet consommé et chaque perte cible sont vérifiés.

Le second script écrit seulement son essai de sensibilité, après contrôle de l’empreinte des traces et reproduction des références. Les sorties détaillées sont dans **`analysis/simulation/output/diagnostic/observations.json`** et **`base-guard.json`**, ignorées par Git et régénérables. L’empreinte des traces de cette analyse est `07752e1b50ce4fafa952f1dd8fa63d8deff15c8a8149b6084709748256f18b70`.

Si les traces manquent, `npm run simulate` les régénère mais réécrit aussi les artefacts de campagne : conserver les versions de référence avant cette opération. Les deux commandes de diagnostic ne réécrivent ni `data/simulation/`, ni le moteur, ni les bots. Les analyses ne lisent aucune partie humaine et ne contactent ni Convex ni Vercel.

Validation : 648 rejeux exacts avec audit des dégâts ; 108 reproductions exactes du runner de contrôle et 108 essais de garde terminés ; `npm run check` réussi, avec **314 tests**, lint, types et build. Les scripts restent des outils d’analyse hors ligne ; le diagnostic écrit est consultable ici, sans modification de la page admin.

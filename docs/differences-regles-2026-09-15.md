# Retours de première partie et règles du 15 septembre 2026

Source : `PAFF 2026 (2).pdf`, 9 pages, transmis par Nicolas le 15 septembre. Référence précédente : [export du 11 septembre](differences-regles-2026-09-11.md). Lecture du nouvel export et contrôle visuel du tableau des unités p. 7 ; les annotations « modif éventuelle » restent des pistes, pas des changements de profils.

## Trois unités révisées — page 7

| Unité | Avant | Maintenant |
| --- | --- | --- |
| Bande de Gobelins | 3 dés | **2 dés** |
| Archers Gobelins | 2 R, 3 dés | **1 R, 2 dés** |
| Epéistes Sephosiens | 2 DT | **3 DT** |

Les 17 autres profils, coûts, capacités et illustrations restent identiques. Les noms harmonisés « Bande du chef » et « Balistes Sephosiennes » sont conservés. Les identifiants des cartes et les références des decks restent stables. `catalogue2026:apply` met à jour les profils et les métadonnées du catalogue ; les cartes déjà copiées dans les parties ne sont pas modifiées.

## Règles et arbitrages

- **Recrutement (p. 2)** : calendrier avancé de 3/4/5 à **2/3/4**. La définition partagée est actualisée. À la demande de Nicolas, les boutons +/− de Recrutement sont désactivés au tour 1 et le serveur refuse leur utilisation directe. Ils s’activent dès le tour 2 ; revenir à 1 les désactive sans remettre le stock à zéro. Le compteur suit les sélections restantes sur la partie. Les disponibilités progressives suivantes restent manuelles, tout comme les effets, coûts et recrutements des ordres de faction.
- **Déploiement (consigne explicite)** : maximum 21 points, sans minimum. Le reste du deck de 33 points maximum peut rester en réserve, par exemple **18 + 15**. La limite de réserve à 12 est retirée, même si elle figure encore p. 1. Les quotas, 18 cases, artillerie à l’arrière et Blop en réserve restent appliqués. Tous les exemplaires choisis doivent ensuite être placés.
- **Charge (p. 4)** : le dé supplémentaire générique disparaît. La cavalerie conserve son dé de charge et Charge puissante son texte particulier. L’aide au combat utilisait déjà le profil de base sans bonus automatique : aucun calcul de charge à supprimer. L’application des bonus reste manuelle.
- **Ordres (p. 6)** : Invokation shamanique reprend maintenant « 2–3 », correction déjà intégrée le 11 septembre. Aucun autre changement d’effet ou de limite relevé. Les capacités sont en p. 8 et la note d’attente en p. 9.

## Retours d’interface

- **Spectateurs** : le code filtrait auparavant uniquement les parties en phase `battle`, ce qui les rendait invisibles pendant le choix des decks, la préparation, l’initiative et le déploiement. Les parties lancées apparaissent désormais immédiatement ; un spectateur peut entrer, suivre l’étape puis voir les unités au fur et à mesure de leur placement. Les cartes privées restent exclues des réponses, les mutations restent réservées aux participants et aucun siège n’est créé. Cette cause est établie dans le code et couverte par les tests ; un éventuel retard réseau pendant un combat déjà commencé n’a pas été reproduit.
- **Engagements** : trait rouge vif continu et extrémités arrondies.
- **Axes** : espacement horizontal entre flancs et centre porté de 0,5 à 1,25 rem ; les cases, coordonnées et distances de mouvement sont inchangées.
- **Aperçus** : carte ancrée près de la case, délai de fermeture pour la rejoindre, capacité interactive avec sa propre infobulle. Tab donne accès à la capacité, Échap ferme et rend le focus à la case. Le défilement de l’aperçu ou de l’infobulle ne ferme pas la carte. Même comportement pour les spectateurs.

## Version et validation

Nouvelles batailles : `2026-09-15-manual-1`. Catalogue : `2026-09-15`. Les batailles commencées conservent leurs cartes, ordres et stocks figés ; le verrou de correction Recrutement au tour 1 s’applique aussi à ces batailles, sans mutation rétroactive des définitions.

Validation locale : `npm run check` (lint, **247 tests**, compilation) et `npx tsc --noEmit -p convex/tsconfig.json` réussis. Les tests couvrent notamment le parcours spectateur dès le lancement jusqu’au combat, le refus de ses mutations, les cartes cachées, le déploiement 18 + 15 jusqu’au combat, les corrections de recrutement et les transitions entre carte, capacité et infobulle au pointeur/clavier.

Développement : fonctions synchronisées par `npx convex dev --once` sur **grateful-warthog-543**. `catalogue2026:apply` a actualisé les 20 fiches (3 profils révisés et métadonnées de référence), sans création ni archivage. Une lecture du catalogue confirme les trois nouvelles valeurs ; `health:check` répond « operational ». Les lectures du catalogue ont d’abord échoué dans le bac à sable avec `fetch failed` / `ENOTFOUND o1192621.ingest.sentry.io`, puis réussi avec la permission réseau. Aucun refus persistant en développement.

Contrôle visuel à 1280 × 720 : vrais composants de bataille et profils courants avec données de démonstration locales, trois engagements et aperçus/capacités. Deux captures enregistrées pour la revue. Ce contrôle visuel et les tests multi-clients en mémoire ne constituent pas une nouvelle partie à plusieurs comptes sur le réseau.

Le déploiement de production et la publication Vercel restent des étapes distinctes, à effectuer lorsqu’ils seront demandés. Pour publier ce lot : intégrer et pousser la branche après accord, déployer les fonctions Convex en production, puis y appliquer `catalogue2026:apply`. Les anciennes parties gardent leurs profils copiés.

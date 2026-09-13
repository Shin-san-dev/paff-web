# Journal et profils joueurs

Le projet utilise **React/Vite, React Router et Convex**. Il n’utilise pas Next.js.

- `/journal` est public, même pendant le chargement de la session. Les entrées sont définies dans `src/features/journal/entries.ts`, triées par date ISO décroissante et affichées en français avec un fuseau UTC explicite. Ajouter une entrée consiste à ajouter un objet à ce tableau.
- `/players/:userId` utilise l’identifiant `users` existant. La route et la requête Convex exigent un membre actif, comme le lobby. Tous les comptes actifs possèdent déjà un profil consultable ; aucune seconde table de joueurs n’est créée.
- `playerProfiles` reçoit deux champs optionnels, `avatarPath` et `badgeIds`. Les documents existants restent valides. La galerie propose un avatar par faction : shaman Gobelins (par défaut) et ange protecteur Sephosi. Les anciennes images sont résolues vers ces deux choix à l’affichage, en gardant la faction lorsqu’elle est reconnue, sans réécrire les profils. Une initiale prend le relais si l’image ne charge pas.
- Les badges sont décrits dans `shared/playerBadges.ts`. Le badge initial est « Premier jour » (`first-version`), illustré par `public/badges/premier-jour.svg`. Les attributions sont explicites, sans déblocage automatique. Une liste vide ne produit aucune section vide à l’écran. Les futurs éléments personnels pourront être ajoutés au même profil ; aucune interface anticipée n’est affichée.
- `players:getProfile` ne renvoie que `userId`, `displayName`, `avatarPath`, les badges décrits dans le catalogue et `deckSummary` (total et répartition par faction). Les identifiants de connexion, rôles, noms des decks et cartes restent hors de cette réponse. Les profils absents, désactivés ou les URL mal formées affichent « Profil indisponible ».
- Les compteurs de decks sont calculés à la lecture avec l’index `decks.by_owner`, sans nouveau champ ni compteur stocké. Ils concernent le joueur consulté et se mettent à jour avec les decks. Les decks vides avec faction comptent pour celle-ci ; les anciens decks sans `factionId` utilisent leur première carte encore disponible comme `decks:listMine`. Les decks sans faction identifiable sont regroupés sous « Sans faction » pour garder un total cohérent. Seules les factions ayant des decks apparaissent ; zéro deck affiche un état vide explicite. Aucun résultat de partie ni comparaison n’est ajouté.
- Le pseudo dans l’en-tête, le nom et l’avatar dans les places à table, ainsi que les noms des participants aux batailles listées dans le lobby pointent vers ces profils. `games:listLobby` et `games:get` exposent uniquement un identifiant utilisateur supplémentaire pour construire ces liens. Aucune mutation ni règle de partie n’est modifiée.

La page de profil ne contient pas de lien de retour au lobby. Le journal possède son groupe de navigation « À propos de PAFF », distinct de la navigation du jeu.

Le profil utilise un en-tête horizontal compact (avatar de 64 à 96 px à gauche du nom), puis des blocs decks et badges côte à côte sur ordinateur, empilés sur mobile. Le choix d’avatar utilise un `<dialog>` natif, comme la confirmation des decks, pour ne pas allonger la page. Annuler ou Échap ferme la fenêtre sans sauvegarder et ramène le focus au bouton d’ouverture.

## Mise en service

Pour essayer cette branche avant publication, synchroniser **le développement** avec `npx convex dev --once`, puis lancer l’interface avec `npm run dev`. La cible habituelle est `grateful-warthog-543` ; vérifier la configuration selon `docs/contexte-projet.md`. `npx convex deploy --dry-run` vise la production dans cette configuration et n’est pas nécessaire à cet essai.

La migration ci-dessous exige les cinq membres du lancement et ne convient donc pas à une dev qui ne les contient pas tous. Pour vérifier le rendu des badges en dev, utiliser `players:setPresentation` sur un profil existant de développement, avec son véritable identifiant et en préservant ses autres badges. Ne pas créer de comptes pour faire passer la migration. Cet essai ne réalise pas l’attribution aux cinq membres de production.

Cette branche ne déclenche aucune publication. Lors de sa publication, **déployer Convex avant l’interface** pour que `players:getProfile` et les identifiants des liens soient disponibles.

Après le déploiement Convex, initialiser explicitement les profils sur l’environnement choisi :

```sh
npx convex run migrations:initializeLaunchProfiles '{}'
```

Ajouter `--prod` uniquement pour l’environnement de production prévu. Cette mutation interne recherche exactement les cinq noms existants : **Nicolas, Adrien, Bru, Pierre, Quentin**, en ignorant la casse et les espaces de début/fin. Si l’un manque ou correspond à plusieurs comptes, elle refuse toute écriture : vérifier les noms des comptes concernés avant de la relancer.

Elle renseigne l’avatar par défaut lorsqu’il est absent et ajoute le badge `first-version` aux cinq profils s’il manque, sans doublon ni retrait des autres badges. Elle ne crée pas de compte, ne change aucun identifiant ni mot de passe et préserve les avatars déjà configurés. Une deuxième exécution est sans effet si les cinq attributions sont déjà présentes. Comme il s’agit d’une attribution manuelle explicite, la relancer après le retrait du badge le réattribue aux cinq membres du lancement.

Pour modifier ensuite une attribution ou choisir un autre asset du projet, utiliser la mutation interne `players:setPresentation` avec le véritable `userId` du compte :

```sh
npx convex run players:setPresentation '{"userId":"ID_UTILISATEUR_EXISTANT","avatarPath":"/cards/gobelins/gobelins-shaman-gobelin.webp","badgeIds":["first-version"]}'
```

Omettre un champ conserve sa valeur ; `"badgeIds": []` retire les badges. Les identifiants de badge inconnus sont refusés ; les images doivent appartenir aux deux choix de `shared/playerAvatars.ts`, y compris pour la mutation interne. Aucun outil d’administration ni système d’upload n’est nécessaire. Depuis son propre profil, un membre peut utiliser « Modifier l’avatar » pour choisir Gobelins ou Sephosi. La mutation publique `players:updateMyAvatar` ne reçoit aucun identifiant de joueur et ne modifie que l’avatar du compte authentifié ; elle refuse les images hors galerie. Les badges restent gérés uniquement par les mutations internes.

## Vérifications

`npm run check` exécute le lint, tous les tests et la compilation de production. `npx tsc --noEmit -p convex/tsconfig.json` vérifie aussi strictement le backend Convex.

Les tests couvrent l’accès public au journal, les routes privées, les cinq profils, l’absence de données privées et de statistiques de parties, les compteurs de decks (création/suppression, isolation entre propriétaires, anciens decks, zéro deck), les deux avatars, les cas manquants/inactifs, les attributions manuelles et l’initialisation idempotente. Les parcours fonctionnels existants continuent à vérifier le déroulement du jeu. L’essai réseau en développement et l’attribution aux cinq profils en production sont deux vérifications distinctes.

### Essai du 13 septembre 2026

- `npx convex dev --once` a synchronisé **grateful-warthog-543**, sans refus de permission. `health:check` a répondu `operational`.
- L’interface locale sur `http://localhost:5174` utilise cette dev. Le profil de Nicolas affiche son deck Gobelins réel ; la galerie propose exactement Gobelins et Sephosi.
- Sur le compte de développement existant **Nicolas 2**, `players:updateMyAvatar` a enregistré Sephosi et `players:setPresentation` a permis l’essai du badge. Un deck Sephosi temporaire a fait passer le total de 1 à 2 avec la répartition Orcs / Sephosi, contrôlée dans le navigateur à 375 px de large. Après suppression de ce seul deck temporaire, le total est revenu à 1 sans rechargement. Le badge de test a été retiré (`badgeIds: []`) et l’avatar ramené au choix par défaut Gobelins. Aucun compte n’a été créé ni aucun deck préexistant modifié.
- `npm run check` : lint, **239 tests / 24 fichiers**, build réussis. Le typage Convex strict et `git diff --check` passent également.
- **Production : aucune écriture dans tough-gecko-249 lors de cet essai**, aucune publication Vercel. Le déploiement du backend et l’attribution « Premier jour » aux cinq membres de production restent à effectuer séparément ; l’essai sur Nicolas 2 ne les réalise pas.

### Correction du profil Nicolas — 13 septembre 2026

Le profil Nicolas de **grateful-warthog-543** n’avait pas de `badgeIds` : l’essai précédent ne concernait que Nicolas 2. À la demande de l’utilisateur, `players:setPresentation` a attribué durablement `first-version` au véritable compte Nicolas de développement, sans modifier son avatar ni ses autres données. Le badge « Premier jour » est désormais visible sur son profil local. Cette attribution en dev ne remplace pas celle des cinq membres de production.

La nouvelle présentation a été contrôlée sur le profil réel, badge inclus : aucun défilement horizontal ou vertical à **1440 × 754**, **375 × 667** et **320 × 568**. Le sélecteur d’avatar reste dans la fenêtre visible au petit format sans agrandir la page. Le contenu reste libre de s’étendre si un zoom d’accessibilité ou de futurs contenus l’exigent : aucune hauteur forcée ni contenu coupé.

Après cette correction, `npm run check` passe avec **240 tests / 24 fichiers**, lint et build. La fermeture au clavier et le retour du focus au bouton d’avatar ont aussi été vérifiés dans le navigateur.

### Mise en production — 13 septembre 2026

À la demande de l’utilisateur, le backend de cette version (`db86c50`) a été déployé sur **tough-gecko-249** avec `npx convex deploy` : schéma validé, aucun index supprimé. `npx convex run migrations:initializeLaunchProfiles '{}' --prod` a ensuite mis à jour les **cinq profils existants** (Nicolas, Adrien, Bru, Pierre, Quentin) avec le badge « Premier jour » et l’avatar par défaut lorsque nécessaire. Résultat : `updated: 5, total: 5`. L’attribution des cinq membres en production est donc réalisée ; les réserves ci-dessus décrivent les essais antérieurs.

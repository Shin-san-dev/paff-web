# Journal et profils joueurs

Le projet utilise **React/Vite, React Router et Convex**. Il n’utilise pas Next.js.

- `/journal` est public, même pendant le chargement de la session. Les entrées sont définies dans `src/features/journal/entries.ts`, triées par date ISO décroissante et affichées en français avec un fuseau UTC explicite. Ajouter une entrée consiste à ajouter un objet à ce tableau.
- `/players/:userId` utilise l’identifiant `users` existant. La route et la requête Convex exigent un membre actif, comme le lobby. Tous les comptes actifs possèdent déjà un profil consultable ; aucune seconde table de joueurs n’est créée.
- `playerProfiles` reçoit deux champs optionnels, `avatarPath` et `badgeIds`. Les documents existants restent valides. L’illustration locale `public/art/sentinel-engraving.webp` sert d’avatar par défaut ; une initiale prend le relais si l’image ne charge pas.
- Les badges sont décrits dans `shared/playerBadges.ts`. Les attributions sont explicites, sans déblocage automatique. Une liste vide ne produit aucune section vide à l’écran. Les futurs éléments personnels pourront être ajoutés au même profil ; aucune interface anticipée n’est affichée.
- `players:getProfile` ne renvoie que `userId`, `displayName`, `avatarPath` et les badges décrits dans le catalogue. Les identifiants de connexion, rôles et données de compte restent hors de cette réponse. Les profils absents, désactivés ou les URL mal formées affichent « Profil indisponible ».
- Le pseudo dans l’en-tête, le nom et l’avatar dans les places à table, ainsi que les noms des participants aux batailles listées dans le lobby pointent vers ces profils. `games:listLobby` et `games:get` exposent uniquement un identifiant utilisateur supplémentaire pour construire ces liens. Aucune mutation ni règle de partie n’est modifiée.

## Mise en service

Cette branche ne déclenche aucune publication. Lors de sa publication, **déployer Convex avant l’interface** pour que `players:getProfile` et les identifiants des liens soient disponibles.

Après le déploiement Convex, initialiser explicitement les profils sur l’environnement choisi :

```sh
npx convex run migrations:initializeLaunchProfiles '{}'
```

Ajouter `--prod` uniquement pour l’environnement de production prévu. Cette mutation interne recherche exactement les cinq noms existants : **Nicolas, Adrien, Bru, Pierre, Quentin**, en ignorant la casse et les espaces de début/fin. Si l’un manque ou correspond à plusieurs comptes, elle refuse toute écriture : vérifier les noms des comptes concernés avant de la relancer.

Elle renseigne l’avatar par défaut et le badge `first-version` uniquement lorsque les champs sont absents. Elle ne crée pas de compte, ne change aucun identifiant ni mot de passe et préserve les présentations déjà configurées, y compris un badge explicitement retiré. Une deuxième exécution est sans effet.

Pour modifier ensuite une attribution ou choisir un autre asset du projet, utiliser la mutation interne `players:setPresentation` avec le véritable `userId` du compte :

```sh
npx convex run players:setPresentation '{"userId":"ID_UTILISATEUR_EXISTANT","avatarPath":"/art/sentinel-engraving.webp","badgeIds":["first-version"]}'
```

Omettre un champ conserve sa valeur ; `"badgeIds": []` retire les badges. Les identifiants de badge inconnus sont refusés ; les images doivent être des chemins locaux. Aucun outil d’administration ni système d’upload n’est nécessaire.

## Vérifications

`npm run check` exécute le lint, tous les tests et la compilation de production. `npx tsc --noEmit -p convex/tsconfig.json` vérifie aussi strictement le backend Convex.

Les tests couvrent l’accès public au journal, les routes privées, les cinq profils, l’absence de données de compte et de statistiques dans les profils, les cas manquants/inactifs, les attributions manuelles et l’initialisation idempotente. Les parcours fonctionnels existants continuent à vérifier le déroulement du jeu. Un contrôle réseau avec les comptes réels et l’initialisation des cinq profils reste à faire après publication sur l’environnement choisi.

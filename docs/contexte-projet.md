# Contexte de PAFF

Ce document rassemble les repères durables à relire à chaque nouvelle tâche. `AGENTS.md` demande cette lecture au démarrage. Maintenir ce document lorsque le produit ou la manière de travailler change.

## Produit et vocabulaire

PAFF est un jeu de cartes et de stratégie privé développé pour un groupe d’amis. L’interface est en français, avec des tons sombres, du bronze, du parchemin et des illustrations fantasy. Conserver un ton simple et personnel ; les textes exacts fournis par l’utilisateur priment sur la reformulation.

La première version jouable date du **11 septembre 2026** et comprend **Gobelins** et **Sephosi** (clé technique `sephosi`). Le catalogue comporte aussi d’autres factions ; le journal raconte l’histoire du projet et ne doit pas être déduit automatiquement de l’état courant du catalogue. Les noms et profils d’unités sont à vérifier dans `shared/catalogue2026.ts` et les données du catalogue.

Les cinq membres initiaux sont **Nicolas, Adrien, Bru, Pierre et Quentin**. Les profils sont communautaires : pas de statistiques de parties, victoires/défaites, classement, comparaison, Elo ni progression compétitive. Ne pas confondre cette contrainte avec les compteurs déjà nécessaires au déroulement d’une partie.

## Architecture et sources

- **React 19 + TypeScript, Vite, React Router**. Routes dans `src/app/App.tsx`, pages dans `src/pages/`, fonctions et composants métier dans `src/features/`.
- **Convex + Convex Auth**. `users` identifie le compte ; `playerProfiles` porte le pseudo, l’accès, l’avatar et les badges. `gamePlayers` est l’appartenance à une partie, pas une seconde identité permanente.
- **Styles et assets** : variables dans `src/styles/global.css`, navigation dans `src/components/SiteHeader.tsx`, illustrations et logo dans `public/`. Réutiliser l’existant, sans dépendances lourdes.
- **Jeu** : état courant documenté dans `docs/regles-implementees.md`. Les comparaisons de règles datées sont dans `docs/differences-regles-*.md`.
- **Journal et profils** : `docs/journal-profils.md`, `src/features/journal/entries.ts`, `shared/playerBadges.ts`, `shared/playerAvatars.ts`, `convex/players.ts`.

## Décisions d’interface

- Journal public `/journal`, dans un groupe de navigation distinct « À propos de PAFF », séparé de Cartes / Mes decks / Lobby.
- Profils `/players/:userId` réservés aux membres actifs. Avatar, pseudo, badges et **nombre de decks total et par faction** (précision utilisateur du 13 septembre 2026) ; pas de lien de retour au lobby dans le contenu du profil. Les compteurs sont calculés depuis les decks existants, sans publier leurs noms ou leur contenu et sans statistiques de parties.
- Présentation compacte des profils : petit avatar à gauche du nom, contenu près du haut, decks et badges visibles ensemble sans défilement sur les formats usuels. Le changement d’avatar s’ouvre dans une petite fenêtre modale, sans rallonger la page. Ne pas réintroduire un grand avatar central ni de grandes marges supérieures.
- Chaque membre peut changer son propre avatar : **un choix par faction, seulement Gobelins et Sephosi pour l’instant**. Gobelins utilise le shaman, Sephosi l’ange protecteur ; Gobelins est le choix par défaut. Les anciens avatars sont ramenés à ces deux choix à l’affichage, en conservant leur faction lorsqu’elle est reconnue. La mutation détermine le propriétaire depuis la session et ne permet pas de modifier les badges.
- Le badge **« Premier jour »** (`first-version`) indique la présence dès le lancement ; il est attribué explicitement aux cinq membres initiaux. Son illustration est locale. Pas de système de déblocage automatique.
- Le logo apparaît dans la navigation et comme favicon ; ne pas le dupliquer dans le bloc principal de l’accueil.
- Les futures préférences de faction/carte et les decks publics ne doivent pas apparaître comme des sections vides.

## Retours de partie du 15 septembre 2026

- Référence courante : `PAFF 2026 (2).pdf`, 9 pages, reçue le 15 septembre. Trois profils révisés : Bande de Gobelins 2 dés ; Archers Gobelins 1 R / 2 dés ; Epéistes Sephosiens 3 DT. Valeurs versionnées dans `shared/catalogue2026.ts`, comparaison dans `docs/differences-regles-2026-09-15.md`.
- Déploiement initial : jusqu’à 21 points **sans minimum**, réserve égale au reste du deck (33 points maximum). La consigne de Nicolas autorisant 18 + 15 prime sur la limite de réserve à 12 encore présente dans le PDF. Conserver les contraintes de cases, de types et de Blop.
- Compteur Recrutement : +/− interdits au tour 1 côté interface et serveur, disponibles dès le tour 2. Calendrier de référence 2/3/4 ; les autres disponibilités et les effets restent manuels. Ne pas confondre ce compteur avec l’entrée d’une unité de réserve, qui peut provenir d’un ordre de faction.
- Spectateurs : partie visible dès son lancement, avec suivi des préparatifs sans révéler les choix privés, puis plateau public au déploiement et au combat. Toujours aucune place de joueur ni droit d’action.
- Plateau : flancs davantage séparés, liens d’engagement rouge vif continus, aperçu de carte survolable avec capacité consultable et accès clavier. Aucun changement des coordonnées ou des déplacements.

## Environnements et travail local

Le dossier habituel de Nicolas est `/Users/nicolasca/Documents/workspace/paff-web`. Travailler dedans, sur une branche `codex/<sujet>`, et laisser les diffs consultables avant commit. Une nouvelle conversation doit être ouverte dans ce projet pour charger son `AGENTS.md` ; un échange sans accès au dépôt ne récupère pas automatiquement ces fichiers.

- Développement Convex configuré localement : `grateful-warthog-543`. Au contrôle du 13 septembre 2026, il contient Nicolas, Adrien et le compte de test Nicolas 2.
- Production Convex : `tough-gecko-249`. Au même contrôle, elle contient les cinq comptes initiaux. Toujours relire l’état réel avant une écriture ; ne pas supposer que les données de développement et de production sont identiques.
- Site public : <https://paff-web.vercel.app>. Vercel construit et publie l’interface depuis `main`, avec `npm run check` ; cela ne déploie pas Convex.
- Ne pas publier ni intégrer une branche implicitement. Une demande explicite d’attribution de badges autorise la mise à jour des profils ciblés, en conservant identifiants, accès, avatars choisis et autres données.

### Procédure de développement

La configuration locale vérifiée le 13 septembre 2026 contient `CONVEX_DEPLOYMENT=dev:grateful-warthog-543` et `VITE_CONVEX_URL=https://grateful-warthog-543.convex.cloud`. Relire ces deux valeurs à la reprise et vérifier qu’aucune variable de déploiement du processus ne change la cible ; ne jamais imprimer de clé ni de mot de passe.

| Besoin | Commande et cible |
| --- | --- |
| Synchroniser les fonctions, le schéma et les types pour essayer une fonctionnalité | `npx convex dev --once` : instance de développement configurée, puis arrêt de la commande. |
| Travailler avec synchronisation continue du backend | `npx convex dev` : instance de développement configurée. |
| Ouvrir l’interface locale | `npm run dev` : Vite utilise `VITE_CONVEX_URL`. |
| Lire l’état de service en développement | `npx convex run health:check` : requête sans modification de données. |
| Exécuter une fonction pour un essai en développement | `npx convex run module:fonction '…'` : vérifier si la fonction lit ou modifie les données et utiliser les identifiants réellement présents en dev. |
| Publier le backend en production lorsque demandé | `npx convex deploy` : production du projet, **pas** l’instance de développement indiquée par `.env.local`. |
| Exécuter une fonction en production lorsque demandé | `npx convex run module:fonction '…' --prod`. |

`npx convex deploy --dry-run` reste une simulation de déploiement vers la cible de `deploy` ; ce n’est ni un test hors réseau ni une synchronisation de la dev. Référence : [CLI Convex](https://docs.convex.dev/cli/overview), sections développement et déploiement ; options vérifiées dans la version installée du CLI.

Pour les badges, l’initialisation des cinq membres du lancement exige leurs cinq profils existants. Leur absence en dev ne bloque pas l’essai du profil, de l’avatar ou du rendu d’un badge sur un compte de développement existant. Suivre `docs/journal-profils.md` et garder l’attribution aux cinq comptes de production comme une étape distincte.

### Reprise entre conversations et permissions

Les repères durables vont dans `AGENTS.md` et ce document ; l’état d’une fonctionnalité va dans sa documentation dédiée. Indiquer l’environnement réellement utilisé, ce qui a été vérifié, ce qui a été publié et ce qui reste à faire. Un résultat en mémoire, en dev ou en production ne prouve pas les deux autres.

À la reprise d’une conversation déjà ouverte, relire ces fichiers depuis le disque. Tant que les modifications ne sont pas commitées puis intégrées, elles ne sont disponibles que dans la copie de travail qui les contient. La lecture des instructions au démarrage est décrite dans la [documentation Codex sur AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Une restriction de permissions est indépendante de ces documents. Après un refus, distinguer un déploiement de production refusé d’un accès réseau de développement également refusé. Continuer le travail indépendant qui reste autorisé et rapporter le motif exact pour les étapes bloquées ; ne pas changer d’outil pour exécuter l’action refusée. La réussite d’un déploiement dans une ancienne session ne garantit pas les permissions d’une nouvelle session.

## Vérifications

`npm run check` : lint, tests unitaires/fonctionnels et build. `npx tsc --noEmit -p convex/tsconfig.json` : backend strict. Les tests fonctionnels utilisent les vrais handlers et écrans, avec transport et base en mémoire ; compléter par un essai réseau lorsque le lot le nécessite.

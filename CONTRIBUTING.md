# Contribuer à PAFF

PAFF est un projet privé entre amis. Ce document propose un process minimal pour les contributions par pull request ; il est ouvert à discussion avec Nicolas et n'a pas valeur définitive tant qu'il n'est pas mergé.

## Avant de commencer

- Le dépôt est public mais le jeu est privé : la création de compte est désactivée côté serveur (`convex/auth.ts`), les comptes joueurs sont créés à la main par Nicolas. Contribuer au code ne donne pas accès au jeu.
- Pas de droits d'écriture sur `nicolasca/paff-web` par défaut : forker le dépôt et travailler depuis son fork.
- Pour une évolution non triviale (règles, UI, structure), en discuter avec Nicolas avant d'écrire du code, pour éviter un travail qui ne correspond pas à sa direction du projet.

## Process proposé

1. Forker le dépôt, cloner son fork.
2. Créer une branche dédiée depuis `main`, avec le préfixe `codex/<sujet>` déjà utilisé dans le projet (voir `AGENTS.md`).
3. Committer avec des messages clairs, en français comme le reste du projet (commits, code, commentaires).
4. Ouvrir une pull request vers `nicolasca/paff-web:main`, avec une description qui explique le changement et son impact (règles, interface, Convex).
5. Attendre la revue de Nicolas avant merge. Pas de merge automatique.

## Vérifications avant de proposer une PR

```sh
npm run check
```

Lint, tests unitaires/fonctionnels et build. Pour toute modification touchant `convex/`, ajouter aussi :

```sh
npx tsc --noEmit -p convex/tsconfig.json
```

## Points spécifiques au projet

- **Règles du jeu** : toute modification des règles ou du déroulement d'une partie doit mettre à jour `docs/regles-implementees.md` dans le même lot, en distinguant ce qui est implémenté de ce qui reste provisoire.
- **Décisions durables** : les choix d'interface ou de structure qui doivent survivre à la PR vont dans `docs/contexte-projet.md`.
- **Déploiement Convex séparé de l'interface** : Vercel construit et publie l'interface automatiquement sur push vers `main` (via `npm run check`), mais ne déploie **pas** les fonctions Convex. Le déploiement Convex (`npx convex deploy`, ciblant la production `tough-gecko-249`) et l'application de mises à jour du catalogue restent des actions manuelles de Nicolas — une PR mergée sur l'interface n'implique pas automatiquement une mise à jour du backend en production.
- **Environnements** : le développement Convex (`grateful-warthog-543`) et la production (`tough-gecko-249`) ont des données distinctes. Ne pas supposer qu'elles sont synchronisées.

## Ce que ce document ne couvre pas encore

Le format de revue (qui, sous quel délai), les critères d'acceptation, et une éventuelle licence restent à définir avec Nicolas.

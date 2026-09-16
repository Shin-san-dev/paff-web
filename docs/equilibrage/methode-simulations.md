# Méthode des simulations

Statut : première [campagne de calibration](campagne-calibration.md) exécutée au lot 3, **792 parties sur six decks restreints**. Socle : [règles consolidées](regles-consolidees.md) et [situations contrôlées](situations-verifiees.md). La campagne vérifie le fonctionnement des robots ; elle ne remplit pas encore les critères d’une étude d’équilibrage générale.

## Avant une étude d’équilibrage générale

L’orchestration des tours, la préparation et les journaux rejouables sont en place. Terminer les copies d’ordres encore absentes avant d’intégrer les cartes concernées ; vérifier les compositions signalées dans le rapport des situations, puis comparer quelques déroulements pas à pas avec une partie jouée. Chaque simulation conserve versions des règles, catalogue, decks, politique de décision et source de hasard. Un tir illégal arrête la campagne ; une option importante absente interdit de généraliser le résultat au jeu complet.

## Distinguer deck, hasard et manière de jouer

1. **Des decks de référence à budget égal**, puis des variantes changeant une seule chose : par exemple 0/3/6 Skrans, mêmes contraintes de réserve et plan de déploiement. Ne pas modifier simultanément coût, composition et comportement du robot.
2. **Des confrontations inversées** : chaque paire joue dans les deux camps et avec les deux initiatives. Réutiliser des graines appariées avec un générateur déterministe ; comme les actions peuvent consommer des nombres de dés différents, journaliser les tirages et ne pas promettre que la même graine produit des événements tactiques identiques.
3. **Plusieurs manières de jouer explicites** : contrôle de zones, agression, préservation/recrutement. Évaluer chaque deck avec chacune, puis croiser les politiques entre adversaires. Une domination limitée à une politique signale d’abord une dépendance au comportement du robot.
4. **Des contrôles symétriques** : deck identique et politique identique dans les deux camps. Un avantage persistant du siège ou de l’initiative doit être compris avant de classer les compositions.
5. **Une exploration progressive** : un petit ensemble sert à découvrir des problèmes ; un ensemble indépendant de graines sert à vérifier ensuite les observations. Les premières dizaines de parties sont un contrôle de fonctionnement, pas une estimation précise de l’équilibre.

## Mesures et décisions

Conserver séparément victoires, défaites et égalités **des configurations simulées**, avec incertitude statistique et effectifs. Analyser aussi contrôle de zones, ordres/PS dépensés, unités de réserve réellement entrées, sacrifices, occasions d’utiliser une capacité et causes de victoire. Ces diagnostics restent dans l’outil d’étude réservé à Nicolas ; ils ne deviennent pas des statistiques de profils joueurs.

Ne proposer un changement de coût ou de capacité qu’en présence d’un effet retrouvé avec plusieurs politiques, les camps inversés et des essais indépendants, et compréhensible dans les situations de plateau. Un résultat dû au robot doit conduire à corriger ou diversifier sa politique. Une différence compatible avec le hasard demande davantage de données, pas une modification du jeu.

L’intégration du lot 3 permet de consulter les résultats dans `/admin/equilibrage`, réservé au **compte Nicolas** avec autorisation vérifiée côté serveur. Les calculs restent hors ligne, sans collecte de parties réelles. La [documentation de campagne](campagne-calibration.md) distingue l’essai sur Convex de développement de la publication en production, non effectuée.

L’[essai MCTS du 16 septembre](campagne-mcts.md) applique cette anticipation aux poses et aux ordres, avec comparaison aux anciens pilotes et duels à deck identique sur une nouvelle graine. Ses 20 relectures détaillées servent à examiner les décisions avant toute conclusion sur les coûts. Un apprentissage par renforcement pourra être envisagé ensuite si le moteur, les actions disponibles et les critères d’évaluation sont suffisamment fiables ; il n’est pas requis pour cet essai.

# Gaeli — révision du 21 septembre 2026

Source : `PAFF 2026 (4).pdf`, reçu de Nicolas le 21 septembre : ordres p. 7, profils et aides aux illustrations p. 8, capacités p. 9. Ce lot remplace Gaeli et désactive les Orcs à sa demande. Il conserve les arbitrages du créateur du 18 septembre pour les Gobelins et Sephosi.

## Catalogue et jeu

Le catalogue `2026-09-21-gaeli-1` contient 30 unités définies, dix par faction active. Les valeurs complètes figurent dans les [règles implémentées](regles-implementees.md#valeurs-du-catalogue-courant).

Quatre cartes Gaeli gardent leur identité : Combattants des Vlands, Druides, Esprits des Bois, Chefs de Clan de la Gaeli. Six unités sont créées : Longues Lames, Archers longs Gaeliens, Gardiens des Cen', Eclaireurs des Vlands, Servlanders, Grand Gardien. Sorl Caleit et les trois anciennes cartes Action Gaeli sont archivés ; les anciens decks permettent de les retirer. Druides et Gardiens des Cen' sont des unités de type Tir sans dés ni attaque, affichés « — ».

Quatre ordres rejoignent le catalogue public, l’éditeur et les nouvelles batailles : Tir longue portée (illimité), Course héroique (4), Appel des vents (2), Convocation des Esprits (1). Cinq capacités sont consultables : Bran Teha, Chant des Ancêtres, Charge du Gardien, Ethérés, Pour la Gaeli !

Le Grand Gardien commence obligatoirement en réserve : sélection, validation et placement initial contrôlés côté serveur et interface. Les autres conditions de sa charge et les effets Gaeli restent appliqués par les joueurs sur le plateau manuel. Les nouvelles batailles portent la version `2026-09-21-manual-1` ; les profils et ordres copiés dans les parties existantes restent figés.

## Retrait des Orcs

`catalogue2026:apply` archive la faction et ses cartes, puis supprime les entrées Orcs de tous les decks, même lorsqu’une carte était déjà archivée. Il conserve le nom et le propriétaire des decks vidés, et libère leur choix de faction. Les cartes source et les copies historiques des parties ne sont pas supprimées. L’opération est idempotente.

Le catalogue masque les factions archivées ; les mutations refusent création de deck Orcs, ajout de carte indisponible et nouvelle sélection d’un deck invalide. L’ancien import ne republie plus les Orcs.

## Illustrations

Nicolas demande une faction celtique et druidique, à énergie et tatouages bleus, avec des illustrations **carrées 1:1**. Les indications visuelles du PDF servent uniquement à la création d’images.

Sept créations et trois recompositions carrées des visuels existants sont intégrées dans `public/cards/gaeli/`. Toutes mesurent **1254 × 1254 pixels** et sont converties en WebP sans recadrage supplémentaire. Les anciens chemins restent disponibles pour les parties historiques. Les [prompts et chemins](illustrations-gaeli-2026-09-21.json) documentent le générateur intégré utilisé ; son outil n’expose pas de sélecteur de version du modèle.

## Vérification et preview

`npm run check` réussi : 261 tests, lint et build. Types Convex vérifiés séparément. Les tests couvrent le retrait des Orcs (y compris dans des decks mixtes ou déjà vides), la recomposition d’un ancien deck Orcs en Gaeli, les identités conservées, les instantanés de partie, l’idempotence, les ordres et la restriction initiale du Grand Gardien côté serveur et interface.

Nicolas autorise le push de `codex/gaeli-2026-09-21` et une preview accessible à Adrien. Elle utilise **grateful-warthog-543** ; la production **tough-gecko-249** reste distincte. La publication du lot en production nécessitera ensuite le déploiement des fonctions et l’application du catalogue dans cet environnement.

Développement **grateful-warthog-543** synchronisé et catalogue appliqué : **6 créations, 24 mises à jour, 12 archivages, 1 faction désactivée, 13 entrées Orcs retirées de 2 decks**. Deuxième application : tous les compteurs à zéro. Catalogue public local : trois factions et dix Gaeli, illustrations carrées et ordres consultables. Aucun changement de données en production.

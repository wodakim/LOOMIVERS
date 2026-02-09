# Genesis Survivor Engine (GSE-v1)

## Introduction
Genesis Survivor est un moteur de jeu de type "Survivor / Bullet Heaven" codé entièrement en **Vanilla JavaScript (ES6+)** sans aucune dépendance externe. Il est conçu pour la performance (60 FPS avec 3000 entités), la sécurité (anti-cheat) et le SEO.

## Architecture
Le projet utilise une architecture **ECS (Entity Component System)** stricte :
*   **Entities** : ID uniques, conteneurs de composants.
*   **Components** : Données pures (Position, Vitesse, Stats).
*   **Systems** : Logique métier (Mouvement, Rendu, Collisions).

### Performance
*   **Object Pooling** : Réutilisation des entités et objets pour éviter le Garbage Collection en jeu.
*   **Spatial Hashing** : Grille spatiale pour la détection de collisions en O(1) moyen.
*   **Fixed Time Step** : Boucle de jeu déterministe découplée du rendu.

## Installation & Démarrage
Aucune installation npm n'est requise pour le moteur lui-même.
Pour lancer le jeu en local (pour éviter les restrictions CORS des modules ES6) :

```bash
python3 -m http.server 8000
# Ouvrir http://localhost:8000
```

## Fonctionnalités Clés
1.  **Gameplay** :
    *   Combat automatique, Vagues d'ennemis scriptées (5 min).
    *   3 types d'ennemis (Basic, Shooter, Charger) + Boss Final.
    *   Progression (XP, Level Up, Shop persistant).
2.  **Moteur Physique Interactif (Terraformation)** :
    *   Zones d'effets persistantes (Feu, Eau, Huile).
    *   Interactions élémentaires (Feu + Huile = Explosion, Élec + Eau = Stun).
3.  **Sécurité** :
    *   Sauvegarde chiffrée (XOR + Checksum) pour empêcher la triche via `localStorage`.
4.  **Audio** :
    *   Synthétiseur audio procédural (Web Audio API) sans assets externes.

## Commandes
*   **Souris** : Visée (pour certaines armes) / Interaction UI.
*   **ZQSD / Flèches** : Déplacement.
*   **P / Echap** : Pause.

## Structure du Code
*   `src/core/` : Cœur du moteur (GameLoop, Input, Audio, Save).
*   `src/ecs/` : Gestionnaire d'entités et base ECS.
*   `src/systems/` : Tous les systèmes logiques.
*   `src/components/` : Définitions des données.
*   `src/data/` : Configuration (Vagues, Armes).

## Crédits
Développé par Jules (AI Assistant) pour un client exigeant une stack Pure JS.

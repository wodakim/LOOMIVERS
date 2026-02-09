# PROJET GENESIS SURVIVOR ENGINE (GSE-v1)

## VUE D'ENSEMBLE
Ce document décrit l'architecture technique du moteur de jeu "Genesis Survivor".
L'objectif est de créer un moteur performant, sécurisé et optimisé pour le SEO, sans aucune dépendance externe (Vanilla JS).

## ARCHITECTURE
Le moteur repose sur une architecture **ECS (Entity Component System)** stricte pour garantir des performances élevées (60 FPS avec 3000 sprites).

### 1. BOUCLE DE JEU (GAME LOOP)
*   **Type :** Pas de temps fixe (Fixed Time Step).
*   **Logique :** Découplée du taux de rafraîchissement de l'écran. La physique tourne à une fréquence fixe pour le déterminisme.
*   **Rendu :** Interpolation entre les états pour une fluidité maximale.

### 2. GESTION DE LA MÉMOIRE
*   **Object Pooling :** Réutilisation stricte des entités et composants (ObjectPool). Pas d'allocation dynamique (`new`) pendant le gameplay pour éviter les pics de latence dus au Garbage Collector.

### 3. RENDU & PHYSIQUE
*   **Canvas API :** Rendu optimisé via un seul canvas principal.
*   **Background Canvas :** Canvas dédié (Offscreen/Underlay) pour la Terraformation (Zones persistantes).
*   **Spatial Hash Grid :** Système de détection de collision optimisé (O(1) en moyenne) pour gérer des milliers d'entités.
*   **Debug Mode :** Visualisation de la grille spatiale et des hitbox pour le débogage.

### 4. GAMEPLAY & FEATURES
*   **Game State :** Machine à états (MENU, PLAY, SHOP, GAMEOVER) gérée par `GameManager`.
*   **Combat System :**
    *   **Tir automatique :** Sur l'ennemi le plus proche avec gestion de cooldown.
    *   **Armes variées :** Projectiles standards, Fouet (Zone horizontale), Aura (Zone autour du joueur).
*   **Elemental Alchemy :** Réactions élémentaires (Feu + Huile = Explosion) gérées par `AlchemySystem`.
*   **XP & Level Up :** Système de progression avec gemmes d'XP magnétiques et niveaux.
*   **Wave Manager :** Système de script pour faire apparaître des vagues d'ennemis progressives (`WavesConfig.js`).
    *   **Boss :** Apparition d'un Boss massif avec barre de vie dédiée à 60 secondes.
*   **Terraformation :** Gestion d'effets environnementaux persistants (Feu, Eau) via un canvas séparé.
*   **Particles :** Système de particules simple pour le feedback visuel (impacts, sang, explosions).
*   **Damage & Stats :** Gestion des PV, Dégâts, Score et Textes flottants.

### 5. META-PROGRESSION & ÉCONOMIE (SHOP)
*   **Système de Sauvegarde (UpgradeManager) :** Persistance de l'Or et des Statistiques (Santé, Dégâts, Vitesse) entre les sessions.
*   **Boutique (Shop) :** Interface dédiée permettant d'acheter des améliorations permanentes et de débloquer de nouvelles armes.
*   **Sécurité (Anti-Cheat) :**
    *   **Chiffrement XOR :** Sauvegarde chiffrée avec clé rotative basée sur le timestamp initial.
    *   **Checksum :** Hash de vérification pour détecter toute altération manuelle du `localStorage`.

### 6. AUDIO & IMMERSION
*   **AudioSystem :** Gestionnaire de sons procéduraux (Oscillators) pour les effets sonores (Tir, Hit, Level Up, Game Over). Aucun fichier audio externe nécessaire.

### 7. SEO & ACCESSIBILITÉ
*   **DOM Throttling :** Mise à jour asynchrone (toutes les 2s ou via `requestIdleCallback`) d'une description textuelle invisible du jeu pour les moteurs de recherche et lecteurs d'écran.
*   **Structure Sémantique :** Utilisation de balises HTML5 (`main`, `article`, `figure`) autour du Canvas.

## STRUCTURE DES DOSSIERS
*   `/src/core` : Cœur du moteur (Loop, Input, Save, Pool, WaveManager, GameManager, UpgradeManager, AudioSystem).
*   `/src/ecs` : Classes de base ECS (Entity, Component, System, Manager).
*   `/src/systems` : Logique métier (Mouvement, Rendu, Collision, IA, Combat, Damage, Particle, Terraformation, Progression, Alchemy).
*   `/src/components` : Données (Position, Vitesse, Stats, Weapon, Particle, Progression, Elemental, Boss).
*   `/src/data` : Configuration (WavesConfig, WeaponTypes).
*   `/assets` : Ressources graphiques (Placeholders générés dynamiquement).

## DIRECTIVES DE DÉVELOPPEMENT
*   **Langue du Code :** Anglais (Variables, Fonctions, Classes).
*   **Langue de Documentation :** Français (JSDoc, Markdown).
*   **Modules :** ES Modules natifs (`import`/`export`).

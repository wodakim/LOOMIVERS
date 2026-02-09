# PROJET GENESIS SURVIVOR ENGINE (GSE-v1)

## VUE D'ENSEMBLE
Ce document décrit l'architecture technique du moteur de jeu "Genesis Survivor".
L'objectif est de créer un moteur performant, sécurisé et optimisé pour le SEO, sans aucune dépendance externe.

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
*   **Combat System :** Tir automatique sur l'ennemi le plus proche avec gestion de cooldown.
*   **Wave Manager :** Système de script pour faire apparaître des vagues d'ennemis progressives (`WavesConfig.js`).
*   **Terraformation :** Gestion d'effets environnementaux persistants (Feu, Eau) via un canvas séparé.
*   **Particles :** Système de particules simple pour le feedback visuel (impacts, sang).
*   **Damage & Stats :** Gestion des PV, Dégâts, Score et Textes flottants.

### 5. SÉCURITÉ (ANTI-CHEAT)
*   **Chiffrement de Sauvegarde :** Algorithme XOR avec une clé dérivée d'un "Sel" unique (`sys_integrity`) généré lors de la première session.
*   **Intégrité :** Vérification par Checksum. Toute modification non signée corrompt la sauvegarde.
*   **Sanitization :** Protection contre les injections XSS pour les futures fonctionnalités sociales.

### 6. SEO & ACCESSIBILITÉ
*   **DOM Throttling :** Mise à jour asynchrone (toutes les 2s ou via `requestIdleCallback`) d'une description textuelle invisible du jeu pour les moteurs de recherche et lecteurs d'écran.

## STRUCTURE DES DOSSIERS
*   `/src/core` : Cœur du moteur (Loop, Input, Save, Pool, WaveManager).
*   `/src/ecs` : Classes de base ECS (Entity, Component, System, Manager).
*   `/src/systems` : Logique métier (Mouvement, Rendu, Collision, IA, Combat, Damage, Particle, Terraformation).
*   `/src/components` : Données (Position, Vitesse, Stats, Weapon, Particle).
*   `/src/data` : Configuration (WavesConfig).
*   `/assets` : Ressources graphiques et sonores (Placeholders pour l'instant).

## DIRECTIVES DE DÉVELOPPEMENT
*   **Langue du Code :** Anglais (Variables, Fonctions, Classes).
*   **Langue de Documentation :** Français (JSDoc, Markdown).
*   **Modules :** ES Modules natifs (`import`/`export`).

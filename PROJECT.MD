
# PROJET GENESIS SURVIVOR ENGINE (GSE-v1)

## ÉTAT DU PROJET
**Phase :** V3-A (Polish, Gameplay Varié, UI).
**Moteur :** ECS Custom (Vanilla JS).
**Dépendances :** Aucune (Zero Dependency).

---

## 1. FONCTIONNALITÉS TERMINÉES (V1, V2, V3) ✅

*   **Architecture Moteur**
    *   [x] Boucle de jeu (GameLoop) avec pas de temps fixe.
    *   [x] ECS (Entity Component System) complet.
    *   [x] Gestionnaire de mémoire (Object Pool) avec nettoyage strict.
    *   [x] Physique : Spatial Hashing + Map Collision.
    *   [x] Rendu : Canvas API 2D + Caméra + Offscreen Canvas.
    *   [x] Assets : Support Sprites (PNG) + Générateur SVG procédural.
    *   [x] **Génération Procédurale :** Cartes caverneuses + Connectivité garantie.

*   **Gameplay Core**
    *   [x] Mouvement Joueur (Clavier + Joystick Mobile) + Dash.
    *   [x] Tir Automatique (Multi-armes, Multishot).
    *   [x] Vagues d'ennemis scriptées + Endless Mode.
    *   [x] **Ennemis Élites :** Versions puissantes (HPx5, Scale).
    *   [x] **Destructibles :** Caisses destructibles dans la map.
    *   [x] **Synergies :** Traits combinés (ex: Inferno Trail).
    *   [x] **Combat Feel :** Knockback, Friction, Flocking (Séparation).

*   **Metagame & Hub**
    *   [x] Hub Interactif (POIs stateful).
    *   [x] Bestiaire, Wardrobe, Leaderboard.
    *   [x] Portail de Retour.
    *   [x] Menus complets (Pause, Options, Credits).
    *   [x] Sauvegarde chiffrée.

*   **UI & Polish**
    *   [x] **Notification System :** Toasts (Unlock, Achievements).
    *   [x] **Juice :** Taches de sang persistantes, Popups de dégâts dynamiques, Éclincelles.
    *   [x] **Health Bars :** Sur Élites et Boss.
    *   [x] **Auto-Pause :** Focus perdu.

---

## 2. ROADMAP V3 (FUTUR)

### B. ACCESSIBILITÉ & AUDIO AVANCÉ
*   **Gamepad :** Support complet manette.
*   **Audio Spatial :** Panning 3D.

### C. CONTENU
*   **Plus d'Armes :** Évolutions niveau 5.
*   **Plus d'Ennemis :** Nouveaux patterns.

---

## 3. DIRECTIVES TECHNIQUES
*   **Contrainte :** Toujours ZERO DÉPENDANCE (Vanilla JS).
*   **Performance :** 60 FPS constants. Culling strict.

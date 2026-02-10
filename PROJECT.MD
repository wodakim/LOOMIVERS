
# PROJET GENESIS SURVIVOR ENGINE (GSE-v1)

## ÉTAT DU PROJET
**Phase :** V2-C Completed (Hub, Maps, Bestiary, Endless Mode).
**Moteur :** ECS Custom (Vanilla JS).
**Dépendances :** Aucune (Zero Dependency).

---

## 1. FONCTIONNALITÉS TERMINÉES (V1 & V2) ✅

*   **Architecture Moteur**
    *   [x] Boucle de jeu (GameLoop) avec pas de temps fixe.
    *   [x] ECS (Entity Component System) complet.
    *   [x] Gestionnaire de mémoire (Object Pool).
    *   [x] Physique : Spatial Hashing + **Map Collision (Grille Statique)**.
    *   [x] Rendu : Canvas API 2D optimisé + **Caméra System (Scrolling)** + Offscreen Canvas.
    *   [x] Assets : Support Sprites (PNG) avec cycles d'animation.
    *   [x] **Génération Procédurale :** Cartes caverneuses (Cellular Automata) et Connectivité garantie (Flood Fill).

*   **Gameplay Core**
    *   [x] Mouvement Joueur (Clavier + Joystick Mobile).
    *   [x] Tir Automatique (Pistolet, Fouet, Aura, Mines, Orbes, Tourelle).
    *   [x] Vagues d'ennemis scriptées (5 minutes + Boss).
    *   [x] **Mode Endless :** Scaling infini après le Boss.
    *   [x] Types d'ennemis : Basic, Shooter, Charger, Boss, Healer, Buffer, Ghost, Kamikaze.
    *   [x] Progression : XP, Level Up, Traits (Roguelite).
    *   [x] Dash Actif avec i-frames.

*   **Metagame & Hub**
    *   [x] **Hub Interactif :** Déplacement libre, POIs (Points d'Intérêt).
    *   [x] **Bestiaire :** Suivi des kills et déblocage d'entrées.
    *   [x] **Portail de Retour :** Choix "Victory" ou "Endless" après le Boss.
    *   [x] Menus : Start, Shop, Options, Credits, Pause, Victory, Game Over.
    *   [x] Sauvegarde : Persistance (Or, Scores, Kills, Upgrades) avec chiffrage simple.

*   **Systèmes Avancés**
    *   [x] Alchimie : Interactions élémentaires (Feu + Huile, etc.).
    *   [x] Terraformation : Cratères et zones persistantes.
    *   [x] Audio : Synthétiseur procédural (Volume Control).

---

## 2. ROADMAP V3 (FUTUR)

### D. SYSTÈME DE TRAITS AVANCÉ
*   **Synergies :** Combinaisons d'armes (Evolution).
*   **Arbre de Passifs :** Constellation de stats dans le Hub.

### E. POLISH & JUICE
*   **Particules V2 :** Système de particules plus complexe (GPU/Instancing?).
*   **Animations UI :** Transitions plus fluides.

---

## 3. DIRECTIVES TECHNIQUES
*   **Contrainte :** Toujours ZERO DÉPENDANCE (Vanilla JS).
*   **Performance :** 60 FPS constants visés.
*   **Carte :** Taille 4096px x 4096px (Run) vs 1024px+ (Hub).

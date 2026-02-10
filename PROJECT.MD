# PROJET GENESIS SURVIVOR ENGINE (GSE-v1)

## ÉTAT DU PROJET
**Dernière mise à jour :** Phase V2-D (UI/UX Level Up & Fixes).
**Moteur :** ECS Custom (Vanilla JS).
**Dépendances :** Aucune (Zero Dependency).

---

## 1. FONCTIONNALITÉS TERMINÉES (V1 - STABLE) ✅
Ces fonctionnalités sont implémentées et vérifiées.

*   **Architecture Moteur**
    *   [x] Boucle de jeu (GameLoop) avec pas de temps fixe.
    *   [x] ECS (Entity Component System) complet.
    *   [x] Gestionnaire de mémoire (Object Pool) pour Entités.
    *   [x] Physique : Spatial Hashing (Grille) pour collisions optimisées.
    *   [x] Rendu : Canvas API 2D optimisé + Offscreen Canvas (Terraformation).

*   **Gameplay Core**
    *   [x] Mouvement Joueur (Clavier + Joystick Mobile).
    *   [x] Tir Automatique (Pistolet, Fouet, Aura, Mines, Orbes, Tourelle).
    *   [x] Vagues d'ennemis scriptées (5 minutes + Boss).
    *   [x] Types d'ennemis : Basic, Shooter, Charger, Boss, Healer, Buffer, Ghost, Kamikaze.
    *   [x] Progression : XP, Level Up, Ramassage magnétique.
    *   [x] **Dash Actif :** Compétence d'esquive (i-frames) activée par Espace/Bouton Mobile.
    *   [x] **Pickups Utilitaires :** Potions de soin et Aimants (Drops rares).
    *   [x] **Bestiaire Support/Unique :** Healers, Buffers, Ghosts, Kamikazes.
    *   [x] **Boss "Bullet Hell" :** Patterns Spirales et Anneaux.

*   **Systèmes Avancés**
    *   [x] **Alchimie :** Interactions (Feu + Huile = Explosion, Eau + Électricité = Stun).
    *   [x] **Terraformation :** Zones persistantes au sol (Ralentissement, Dégâts).
    *   [x] **Audio :** Synthétiseur procédural (Web Audio API) pour SFX sans assets.
    *   [x] **Meta-Progression :** Shop (Or, Stats, Armes), Sauvegarde sécurisée.

*   **UI & Polish**
    *   [x] Menus : Start, Shop, Game Over, Victory, Pause.
    *   [x] **Level Up :** Système de choix de cartes (Roguelite).
    *   [x] Feedback : Hit Flash, Textes flottants, Timer.
    *   [x] SEO : Structure sémantique HTML5 + JSON-LD.
    *   [x] **Mobile :** Contrôles tactiles et Responsive UI.
    *   [x] **Equilibrage :** Nerf Stats Joueur, Buff PV Ennemis, Spawn constant (Filler).

---

## 2. ROADMAP V2 (EN DÉVELOPPEMENT)
Les éléments marqués d'un triangle rouge 🔺 sont à implémenter ou à tester.

### C. HUB & METAGAME (NOUVEAU SCOPE)
*   **Le HUB (Quartier Général)**
    *   🔺 **Carte Intactive :** Zone de déplacement libre entre les runs.
    *   🔺 **Points d'Intérêt (POI) :**
        *   Leaderboard (Tableau des scores).
        *   Wardrobe (Sélection personnage).
        *   Bestiaire (Cage).
        *   Portail de Sang (Lancer la run).
    *   🔺 **UI HUB :** Flèches flottantes animées au-dessus des POI.
*   **Mode "Endless"**
    *   🔺 **Portail de Retour :** Pop-up explicite pour retourner au HUB après le Boss ou en Endless.
    *   🔺 **Scaling Infini :** Difficulté exponentielle après 5 minutes.

### D. SYSTÈME DE TRAITS (ROGUELITE)
*   **Cartes d'Amélioration**
    *   [x] **Présentation :** Au Level Up, afficher 3 cartes (Traits).
    *   🔺 **Animation :** Effet de "Flip" (retournement) lors de l'apparition des cartes.
    *   🔺 **Contenu :** Traits variés (Balles rebondissantes, Explosion à la mort, etc.).

### E. POLISH V2
*   **Juice 2.0**
    *   🔺 **Particules Avancées :** Traînées de projectiles, débris persistants.
    *   🔺 **Leaderboard Local :** Affichage des meilleurs scores (LocalStorage).

---

## 3. DIRECTIVES TECHNIQUES
*   **Contrainte :** Toujours ZERO DÉPENDANCE (Vanilla JS).
*   **Performance :** Maintenir 60 FPS sur mobile.
*   **Architecture :** Continuer d'utiliser l'ECS pour toutes les nouvelles features.

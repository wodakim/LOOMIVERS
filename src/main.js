import { GameLoop } from './core/GameLoop.js';
import { EntityManager } from './ecs/EntityManager.js';
import { InputHandler } from './core/InputHandler.js';
import { SaveSystem } from './core/SaveSystem.js';

// Components
import {
    TransformComponent,
    VelocityComponent,
    RenderComponent,
    InputComponent,
    AIComponent,
    ColliderComponent
} from './components/Components.js';

// Systems
import { InputSystem } from './systems/InputSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { DamageSystem } from './systems/DamageSystem.js';
import { AISystem } from './systems/AISystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { SEOSystem } from './systems/SEOSystem.js';
import { TerraformationSystem } from './systems/TerraformationSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { ProgressionSystem } from './systems/ProgressionSystem.js';
import { AlchemySystem } from './systems/AlchemySystem.js';
import { WeaponComponent } from './components/WeaponComponents.js';
import { HealthComponent, ScoreComponent } from './components/StatsComponents.js';
import { LevelComponent } from './components/ProgressionComponents.js';
import { ElementalComponent } from './components/ElementalComponents.js';
import { WaveManager } from './core/WaveManager.js';
import { GameManager, GameState } from './core/GameManager.js';
import { UpgradeManager } from './core/UpgradeManager.js';
import { WeaponTypes } from './data/WeaponTypes.js';

/**
 * Point d'entrée principal du moteur Genesis Survivor.
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Gestion du redimensionnement (Responsive)
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialisation des cœurs (nécessaire avant GameManager pour SaveSystem)
        this.saveSystem = new SaveSystem();
        this.saveSystem.initIntegritySalt();
        this.upgradeManager = new UpgradeManager(this.saveSystem);

        // Game Manager (State Machine)
        this.gameManager = new GameManager(this);

        this.initEngine();
    }

    initEngine() {
        // Initialisation des cœurs (Reset)
        this.entityManager = new EntityManager();
        this.inputHandler = new InputHandler();
        // SaveSystem et UpgradeManager sont persistants, pas besoin de les recréer

        // Wave Manager (Director)
        this.waveManager = new WaveManager(this.entityManager, this.canvas.width, this.canvas.height);

        // Initialisation des Systèmes
        // Ordre CRITIQUE : Input -> Logic -> Physics -> Render
        // Note: On instancie PhysicsSystem tôt pour l'injecter dans l'IA (Separation/Flocking)
        this.physicsSystem = new PhysicsSystem(this.entityManager, this.canvas.width, this.canvas.height);

        this.inputSystem = new InputSystem(this.entityManager, this.inputHandler);
        this.aiSystem = new AISystem(this.entityManager, this.physicsSystem); // Injection Physics pour grid neighbor search
        this.combatSystem = new CombatSystem(this.entityManager);
        this.movementSystem = new MovementSystem(this.entityManager, this.canvas.width, this.canvas.height);
        // this.physicsSystem déjà instancié plus haut
        this.particleSystem = new ParticleSystem(this.entityManager);
        this.terraformationSystem = new TerraformationSystem(this.entityManager, this.canvas.width, this.canvas.height);
        this.alchemySystem = new AlchemySystem(this.entityManager, this.terraformationSystem, this.particleSystem);
        this.progressionSystem = new ProgressionSystem(this.entityManager, this.physicsSystem);
        this.damageSystem = new DamageSystem(this.entityManager, this.physicsSystem, this.particleSystem, this.progressionSystem, this.alchemySystem); // Injection Alchemy
        this.renderSystem = new RenderSystem(this.entityManager, this.ctx, this.canvas.width, this.canvas.height, this.physicsSystem, this.terraformationSystem);
        this.seoSystem = new SEOSystem(this.entityManager);

        this.entityManager.registerSystem(this.inputSystem);
        this.entityManager.registerSystem(this.aiSystem);
        this.entityManager.registerSystem(this.combatSystem);
        // Terraformation avant Movement pour appliquer les effets (ralentissement)
        this.entityManager.registerSystem(this.terraformationSystem);
        this.entityManager.registerSystem(this.movementSystem);
        this.entityManager.registerSystem(this.physicsSystem);
        this.entityManager.registerSystem(this.particleSystem);
        this.entityManager.registerSystem(this.damageSystem);
        this.entityManager.registerSystem(this.progressionSystem);
        this.entityManager.registerSystem(this.alchemySystem);

        // Demo Terraformation : Ajouter des zones initiales
        this.terraformationSystem.addZone(200, 200, 100, 'water');
        this.terraformationSystem.addZone(600, 400, 80, 'fire');

        // Configuration
        this.debugMode = true;
        this.renderSystem.setDebugMode(this.debugMode);

        // Boucle de jeu
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );

        console.log('Genesis Survivor Engine (GSE-v1) initialized. Waiting for start.');
    }

    start() {
        this.initWorld();
        // Appliquer les upgrades permanentes au joueur
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (player) {
            this.upgradeManager.applyPlayerStats(player);

            // Check Weapon Unlocks
            if (this.upgradeManager.upgrades['unlock_whip'].level > 0) {
                const w = player.getComponent('WeaponComponent');
                Object.assign(w, WeaponTypes.WHIP);
            }
            // Note: Aura would be a second weapon component or entity in a full system.
            // Here, last unlock wins for main weapon slot.
        }
        this.gameLoop.start();
    }

    stop() {
        this.gameLoop.stop();
    }

    reset() {
        this.stop();
        // TODO: Clean up all entities properly via EntityManager.clear() or creating new instance
        // Pour la POC : On recrée tout l'engine pour être sûr
        this.initEngine();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Si le système de mouvement ou de physique dépend des limites, il faudrait les mettre à jour ici
        if (this.movementSystem) {
            this.movementSystem.worldWidth = this.canvas.width;
            this.movementSystem.worldHeight = this.canvas.height;
        }
        if (this.physicsSystem) {
             // Idéalement reconstruire la grille ou mettre à jour les dimensions
             this.physicsSystem.cols = Math.ceil(this.canvas.width / this.physicsSystem.cellSize);
             this.physicsSystem.rows = Math.ceil(this.canvas.height / this.physicsSystem.cellSize);
        }
        if (this.renderSystem) {
            this.renderSystem.width = this.canvas.width;
            this.renderSystem.height = this.canvas.height;
        }
    }

    initWorld() {
        // 1. Création du Héro (Carré Bleu)
        const hero = this.entityManager.createEntity();
        hero.tags.add('player');

        hero.addComponent(new TransformComponent());
        const t = hero.getComponent('TransformComponent');
        t.x = this.canvas.width / 2;
        t.y = this.canvas.height / 2;

        hero.addComponent(new VelocityComponent());
        const v = hero.getComponent('VelocityComponent');
        v.speed = 300; // Pixels par seconde

        hero.addComponent(new InputComponent());

        // Ajout de l'arme par défaut
        hero.addComponent(new WeaponComponent());
        const weapon = hero.getComponent('WeaponComponent');
        weapon.fireRate = 2; // 2 tirs/sec
        weapon.damage = 25;
        weapon.range = 400;

        // Le Héro tire du FEU
        hero.addComponent(new ElementalComponent());
        hero.getComponent('ElementalComponent').tags.add('fire');

        hero.addComponent(new ColliderComponent());
        const c = hero.getComponent('ColliderComponent');
        c.radius = 20;
        c.tags = ['player'];

        hero.addComponent(new HealthComponent());
        hero.getComponent('HealthComponent').current = 1000; // Le héros est tanky

        hero.addComponent(new LevelComponent()); // Pour l'XP

        hero.addComponent(new RenderComponent());
        const r = hero.getComponent('RenderComponent');
        r.color = '#00ccff'; // Bleu Cyan
        r.shape = 'rect';
        r.width = 40;
        r.height = 40;
        r.layer = 10;

    }

    // (spawnEnemy déplacé dans WaveManager)

    update(dt) {
        if (this.gameManager.state !== GameState.PLAYING) return;

        // Mise à jour du Wave Manager
        this.waveManager.update(dt);

        // Mise à jour de la logique (Pas de temps fixe)
        this.entityManager.update(dt);

        // Mise à jour SEO (Throttled)
        this.seoSystem.update(dt);

        // Check Game Over Condition (Hero Dead)
        const hero = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (!hero || !hero.active) {
            // Le DamageSystem a déjà tué l'entité si HP <= 0
            // On récupère le score avant de finir
            const score = this.damageSystem.score;
            this.gameManager.triggerGameOver(score);
        }
    }

    render(alpha) {
        // Rendu (Interpolé)
        this.renderSystem.render(alpha);
    }
}

// Démarrage
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

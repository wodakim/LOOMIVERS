import { GameLoop } from './core/GameLoop.js';
import { EntityManager } from './ecs/EntityManager.js';
import { InputHandler } from './core/InputHandler.js';
import { SaveSystem } from './core/SaveSystem.js';
import { AudioSystem } from './core/AudioSystem.js';
import { AssetLoader } from './core/AssetLoader.js';

// Components
import {
    TransformComponent,
    VelocityComponent,
    RenderComponent,
    InputComponent,
    AIComponent,
    ColliderComponent,
    DashComponent,
    InteractableComponent,
    SpriteComponent
} from './components/Components.js';

// Systems
import { AnimationSystem } from './systems/AnimationSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { DamageSystem } from './systems/DamageSystem.js';
import { AISystem } from './systems/AISystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { UISystem } from './systems/UISystem.js';
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
        this.audioSystem = new AudioSystem();

        // Game Manager (State Machine)
        this.playerColor = '#00ccff'; // Default
        this.gameManager = new GameManager(this);

        this.initEngine();
    }

    initEngine() {
        // Initialisation des cœurs (Reset)
        this.entityManager = new EntityManager();
        this.inputHandler = new InputHandler();

        // Wave Manager (Director)
        this.waveManager = new WaveManager(this.entityManager, this.canvas.width, this.canvas.height, this.assetLoader);

        // Initialisation des Systèmes
        this.physicsSystem = new PhysicsSystem(this.entityManager, this.canvas.width, this.canvas.height);

        this.inputSystem = new InputSystem(this.entityManager, this.inputHandler);
        this.aiSystem = new AISystem(this.entityManager, this.physicsSystem);
        this.combatSystem = new CombatSystem(this.entityManager, this.audioSystem);
        this.movementSystem = new MovementSystem(this.entityManager, this.canvas.width, this.canvas.height);
        this.particleSystem = new ParticleSystem(this.entityManager);
        this.terraformationSystem = new TerraformationSystem(this.entityManager, this.canvas.width, this.canvas.height);
        this.alchemySystem = new AlchemySystem(this.entityManager, this.terraformationSystem, this.particleSystem, this.audioSystem);
        this.progressionSystem = new ProgressionSystem(this.entityManager, this.physicsSystem, this.audioSystem);
        this.damageSystem = new DamageSystem(this.entityManager, this.physicsSystem, this.particleSystem, this.progressionSystem, this.alchemySystem, this.audioSystem);
        this.renderSystem = new RenderSystem(this.entityManager, this.ctx, this.canvas.width, this.canvas.height, this.physicsSystem, this.terraformationSystem);
        this.uiSystem = new UISystem(this.entityManager);
        this.seoSystem = new SEOSystem(this.entityManager);
        this.animationSystem = new AnimationSystem(this.entityManager);

        this.entityManager.registerSystem(this.inputSystem);
        this.entityManager.registerSystem(this.animationSystem);
        this.entityManager.registerSystem(this.aiSystem);
        this.entityManager.registerSystem(this.combatSystem);
        this.entityManager.registerSystem(this.terraformationSystem);
        this.entityManager.registerSystem(this.movementSystem);
        this.entityManager.registerSystem(this.physicsSystem);
        this.entityManager.registerSystem(this.particleSystem);
        this.entityManager.registerSystem(this.damageSystem);
        this.entityManager.registerSystem(this.progressionSystem);
        this.entityManager.registerSystem(this.alchemySystem);
        this.entityManager.registerSystem(this.uiSystem);

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

    // Called for Run
    initWorld() {
        // Reset systems relevant to runs
        this.waveManager = new WaveManager(this.entityManager, this.canvas.width, this.canvas.height, this.assetLoader);

        // Demo Terraformation : Ajouter des zones initiales
        this.terraformationSystem.zones = []; // Reset zones
        this.terraformationSystem.addZone(200, 200, 100, 'water');
        this.terraformationSystem.addZone(600, 400, 80, 'fire');

        this.createPlayer(true); // Can shoot
    }

    // Called for HUB
    initHub() {
        this.terraformationSystem.zones = [];
        this.createPlayer(false); // Can't shoot

        // Add POIs
        // Leaderboard (Left)
        this.createPOI(200, 300, '#ff00ff', 'Leaderboard', 'leaderboard');
        // Wardrobe (Right)
        this.createPOI(this.canvas.width - 200, 300, '#00ffff', 'Wardrobe', 'wardrobe');
        // Bestiary (Bottom Left)
        this.createPOI(300, 600, '#00ff00', 'Bestiary', 'bestiary');
        // Shop (Bottom Right)
        this.createPOI(this.canvas.width - 300, 600, '#ffff00', 'Shop', 'shop');
        // Portal
        this.createPOI(this.canvas.width / 2, 400, '#ff0000', 'PORTAL', 'portal');
    }

    createPlayer(canShoot) {
        const hero = this.entityManager.createEntity();
        hero.tags.add('player');

        hero.addComponent(new TransformComponent());
        const t = hero.getComponent('TransformComponent');
        t.x = this.canvas.width / 2;
        t.y = this.canvas.height / 2;

        hero.addComponent(new VelocityComponent());
        const v = hero.getComponent('VelocityComponent');
        v.speed = 300;

        hero.addComponent(new InputComponent());
        hero.addComponent(new DashComponent());

        hero.addComponent(new ColliderComponent());
        const c = hero.getComponent('ColliderComponent');
        c.radius = 20;
        c.tags = ['player'];

        hero.addComponent(new HealthComponent());
        hero.getComponent('HealthComponent').current = 1000;

        hero.addComponent(new LevelComponent());

        hero.addComponent(new RenderComponent());
        const r = hero.getComponent('RenderComponent');
        r.color = this.playerColor;
        r.shape = 'rect';
        r.width = 40;
        r.height = 40;
        r.layer = 10;

        if (canShoot) {
            hero.addComponent(new WeaponComponent());
            const weapon = hero.getComponent('WeaponComponent');
            weapon.fireRate = 1.5;
            weapon.damage = 15;
            weapon.range = 400;

            hero.addComponent(new ElementalComponent());
            hero.getComponent('ElementalComponent').tags.add('fire');

            this.upgradeManager.applyPlayerStats(hero);
        }
    }

    createPOI(x, y, color, label, action) {
        const poi = this.entityManager.createEntity();
        poi.tags.add('poi');
        if (action === 'portal') poi.tags.add('portal');

        poi.addComponent(new TransformComponent());
        poi.getComponent('TransformComponent').x = x;
        poi.getComponent('TransformComponent').y = y;

        poi.addComponent(new RenderComponent());
        const r = poi.getComponent('RenderComponent');
        r.color = color;
        r.shape = 'rect'; // Should be sprite/icon
        r.width = 60;
        r.height = 60;
        r.layer = 1;

        poi.addComponent(new InteractableComponent());
        const interact = poi.getComponent('InteractableComponent');
        interact.label = label;
        interact.action = action;

        poi.addComponent(new ColliderComponent());
        const c = poi.getComponent('ColliderComponent');
        c.radius = 50;
        c.isTrigger = true;
    }

    start() {
        // Resume Audio Context on user interaction (Start Game)
        this.audioSystem.init();

        // Enter HUB by default now
        this.gameManager.enterHub();
    }

    stop() {
        this.gameLoop.stop();
    }

    reset() {
        this.stop();
        this.initEngine();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.movementSystem) {
            this.movementSystem.worldWidth = this.canvas.width;
            this.movementSystem.worldHeight = this.canvas.height;
        }
        if (this.physicsSystem) {
             this.physicsSystem.cols = Math.ceil(this.canvas.width / this.physicsSystem.cellSize);
             this.physicsSystem.rows = Math.ceil(this.canvas.height / this.physicsSystem.cellSize);
        }
        if (this.renderSystem) {
            this.renderSystem.width = this.canvas.width;
            this.renderSystem.height = this.canvas.height;
        }
    }

    update(dt) {
        // HUB Logic Loop check
        if (this.gameManager.state === GameState.HUB) {
            // Check POI interaction
            const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
            const pois = this.entityManager.getEntities().filter(e => e.hasComponent('InteractableComponent'));

            if (player) {
                const pt = player.getComponent('TransformComponent');
                for (const poi of pois) {
                    const poit = poi.getComponent('TransformComponent');
                    const interact = poi.getComponent('InteractableComponent');
                    const dx = pt.x - poit.x;
                    const dy = pt.y - poit.y;
                    if (dx*dx + dy*dy < 50*50) {
                        if (interact.action === 'portal') this.gameManager.startGame();
                        else if (interact.action === 'leaderboard') this.gameManager.showLeaderboard();
                        else if (interact.action === 'wardrobe') this.gameManager.showWardrobe();
                        else if (interact.action === 'shop') this.gameManager.openShop();
                        else if (interact.action === 'bestiary') console.log('Bestiary locked.');
                    }
                }
            }

            // Still update ECS for movement
            this.entityManager.update(dt);
            return;
        }

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

    async loadAssets() {
        this.assetLoader = new AssetLoader();
        const sources = {
            'zombie_walk1': 'assets/sprites/enemies/tier1/Zombie_walk1.png',
            'zombie_walk2': 'assets/sprites/enemies/tier1/Zombie_walk2.png',
            'zombie_walk3': 'assets/sprites/enemies/tier1/Zombie_walk3.png',
            'zombie_attack': 'assets/sprites/enemies/tier1/Zombie_attack.png'
        };
        await this.assetLoader.loadImages(sources);
        console.log('Assets loaded');

        if (this.waveManager) {
            this.waveManager.assetLoader = this.assetLoader;
        }
    }
}

// Démarrage
window.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    window.game = game;
    await game.loadAssets();
});

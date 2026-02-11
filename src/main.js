import { GameLoop } from './core/GameLoop.js';
import { EntityManager } from './ecs/EntityManager.js';
import { InputHandler } from './core/InputHandler.js';
import { SaveSystem } from './core/SaveSystem.js';
import { AudioSystem } from './core/AudioSystem.js';
import { AssetLoader } from './core/AssetLoader.js';
import { MapGenerator } from './core/MapGenerator.js';

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
import { NotificationSystem } from './core/NotificationSystem.js';
import { TraitSystem } from './systems/TraitSystem.js';
import { WeaponTypes } from './data/WeaponTypes.js';
import { AssetSources, Animations } from './data/AssetManifest.js';

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
        this.notificationSystem = new NotificationSystem();

        // Game Manager (State Machine)
        this.playerColor = '#00ccff'; // Default
        this.gameManager = new GameManager(this);

        // --- NEW FIX: POI INTERACTION STATE ---
        this.activeInteractions = new Set(); // Stores POI IDs currently inside
        // --------------------------------------

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
        this.particleSystem.setTerraformationSystem(this.terraformationSystem); // Inject dependency
        this.alchemySystem = new AlchemySystem(this.entityManager, this.terraformationSystem, this.particleSystem, this.audioSystem);
        this.progressionSystem = new ProgressionSystem(this.entityManager, this.physicsSystem, this.audioSystem);
        this.traitSystem = new TraitSystem(this.entityManager, this.progressionSystem);
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
        // Map Generation
        const MAP_SIZE = 4096;
        const TILE_SIZE = 64;

        const mapGen = new MapGenerator(MAP_SIZE, MAP_SIZE, TILE_SIZE);
        const grid = mapGen.generate();
        const spawn = mapGen.getSpawnPoint();

        // Update Systems with Map
        this.physicsSystem.setMap(grid, TILE_SIZE);
        this.renderSystem.setMap(grid, TILE_SIZE);

        this.movementSystem.setWorldBounds(MAP_SIZE, MAP_SIZE);
        this.waveManager.setWorldBounds(MAP_SIZE, MAP_SIZE);
        this.terraformationSystem.resize(MAP_SIZE, MAP_SIZE);

        // Reset Wave Manager
        this.waveManager = new WaveManager(this.entityManager, MAP_SIZE, MAP_SIZE, this.assetLoader);
        this.waveManager.setMap(grid, TILE_SIZE);

        // Reset Terraformation Zones
        this.terraformationSystem.zones = [];

        // Spawn Destructibles (Crates)
        const props = mapGen.placeDestructibles();
        for(const prop of props) {
            this.createCrate(prop.x, prop.y);
        }

        this.createPlayer(true, spawn.x, spawn.y);
    }

    createCrate(x, y) {
        const crate = this.entityManager.createEntity();
        crate.tags.add('destructible');

        crate.addComponent(new TransformComponent());
        const t = crate.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        crate.addComponent(new RenderComponent());
        const r = crate.getComponent('RenderComponent');
        r.color = '#8b4513'; // Brown
        r.shape = 'rect';
        r.width = 40;
        r.height = 40;
        r.layer = 4; // Below enemies

        crate.addComponent(new ColliderComponent());
        const c = crate.getComponent('ColliderComponent');
        c.width = 40;
        c.height = 40;
        c.tags = ['enemy', 'player']; // Blocks movement

        crate.addComponent(new HealthComponent());
        const h = crate.getComponent('HealthComponent');
        h.current = h.max = 20;
    }

    // Called for HUB
    initHub() {
        // Hub is small (Screen Size or Fixed minimum)
        const HUB_WIDTH = Math.max(this.canvas.width, 1024);
        const HUB_HEIGHT = Math.max(this.canvas.height, 768);
        const TILE_SIZE = 64;

        // Generate Empty Map (Border Walls only)
        const rows = Math.ceil(HUB_HEIGHT / TILE_SIZE);
        const cols = Math.ceil(HUB_WIDTH / TILE_SIZE);
        const grid = [];
        for(let r=0; r<rows; r++) {
            const row = [];
            for(let c=0; c<cols; c++) {
                if(r===0 || r===rows-1 || c===0 || c===cols-1) row.push(1);
                else row.push(0);
            }
            grid.push(row);
        }

        // Update Systems
        this.physicsSystem.setMap(grid, TILE_SIZE);
        this.renderSystem.setMap(grid, TILE_SIZE);
        this.movementSystem.setWorldBounds(HUB_WIDTH, HUB_HEIGHT);
        this.waveManager.setWorldBounds(HUB_WIDTH, HUB_HEIGHT);
        this.waveManager.setMap(grid, TILE_SIZE);
        this.terraformationSystem.resize(HUB_WIDTH, HUB_HEIGHT);

        this.createPlayer(false, HUB_WIDTH/2, HUB_HEIGHT/2); // Center

        // Add POIs
        this.createPOI(200, 300, '#ff00ff', 'Leaderboard', 'leaderboard');
        this.createPOI(HUB_WIDTH - 200, 300, '#00ffff', 'Wardrobe', 'wardrobe');
        this.createPOI(300, 600, '#00ff00', 'Bestiary', 'bestiary');
        this.createPOI(HUB_WIDTH - 300, 600, '#ffff00', 'Shop', 'shop');
        this.createPOI(HUB_WIDTH / 2, 400, '#ff0000', 'PORTAL', 'portal');
    }

    createPlayer(canShoot, x, y) {
        const hero = this.entityManager.createEntity();
        hero.tags.add('player');

        hero.addComponent(new TransformComponent());
        const t = hero.getComponent('TransformComponent');
        t.x = x !== undefined ? x : this.canvas.width / 2;
        t.y = y !== undefined ? y : this.canvas.height / 2;

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

        // Sprite for Player
        if (this.assetLoader) {
            const idleKeys = Animations['player_idle'];
            const runKeys = Animations['player_run'];
            const attackKeys = Animations['player_attack'];

            if (idleKeys && runKeys) {
                const idleImgs = idleKeys.map(k => this.assetLoader.get(k)).filter(img => img);
                const runImgs = runKeys.map(k => this.assetLoader.get(k)).filter(img => img);
                const attackImgs = attackKeys ? attackKeys.map(k => this.assetLoader.get(k)).filter(img => img) : [];

                if (idleImgs.length > 0) {
                    hero.addComponent(new SpriteComponent());
                    const sprite = hero.getComponent('SpriteComponent');
                    sprite.animations['idle'] = idleImgs;
                    sprite.animations['walk'] = runImgs; // Map run to walk for MovementSystem? No, it uses 'walk' often.
                    sprite.animations['run'] = runImgs;
                    sprite.animations['attack'] = attackImgs;
                    sprite.currentAnimation = 'idle';

                    // Adjust collider/render size to match sprite
                    r.width = 64;
                    r.height = 64;
                    c.radius = 24;
                }
            }
        }

        if (canShoot) {
            hero.addComponent(new WeaponComponent());
            const weapon = hero.getComponent('WeaponComponent');
            weapon.fireRate = 1.5;
            weapon.damage = 15;
            weapon.range = 1200; // Increased from 400
            weapon.projectileSpeed = 900; // Faster bullets

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
        // Cleanup old persistent DOM elements
        const poiLabels = document.querySelectorAll('.poi-label');
        poiLabels.forEach(el => el.remove());

        this.initEngine();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Update RenderSystem Viewport
        if (this.renderSystem) {
            this.renderSystem.width = this.canvas.width;
            this.renderSystem.height = this.canvas.height;
        }

        // Note: We do NOT update MovementSystem/PhysicsSystem world bounds here
        // because they are now determined by the generated Map size,
        // independent of screen size (thanks to the Camera).
    }

    checkInteraction() {
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        const pois = this.entityManager.getEntities().filter(e => e.hasComponent('InteractableComponent'));

        if (player) {
            const pt = player.getComponent('TransformComponent');
            for (const poi of pois) {
                const poit = poi.getComponent('TransformComponent');
                const interact = poi.getComponent('InteractableComponent');
                const dx = pt.x - poit.x;
                const dy = pt.y - poit.y;
                const isInside = (dx*dx + dy*dy < 50*50); // 50px radius

                if (isInside) {
                    if (!this.activeInteractions.has(poi.id)) {
                        // ENTER EVENT
                        this.activeInteractions.add(poi.id);
                        if (interact.action === 'portal') this.gameManager.startGame();
                        else if (interact.action === 'leaderboard') this.gameManager.showLeaderboard();
                        else if (interact.action === 'wardrobe') this.gameManager.showWardrobe();
                        else if (interact.action === 'shop') this.gameManager.openShop();
                        else if (interact.action === 'bestiary') this.gameManager.openBestiary();
                        else if (interact.action === 'end_run') this.gameManager.triggerVictory(this.damageSystem.score);
                    }
                } else {
                    if (this.activeInteractions.has(poi.id)) {
                        // EXIT EVENT
                        this.activeInteractions.delete(poi.id);
                        // Optional: close if needed, but GameManager handles explicit 'Back' buttons.
                        // We assume UI stays open until closed by user, OR closed here?
                        // User said: "ne se rouvrir qu'une fois re rentrer dans leurs perimetre mais pas avant de l'avoir quitter"
                        // So UI logic is handled by this state check preventing rapid re-open.
                    }
                }
            }
        }
    }

    update(dt) {
        // HUB Logic Loop check
        if (this.gameManager.state === GameState.HUB) {
            this.checkInteraction();
            // Still update ECS for movement
            this.entityManager.update(dt);
            return;
        }

        if (this.gameManager.state !== GameState.PLAYING) return;

        // In-Game Interaction (Return Portal)
        this.checkInteraction();

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
        await this.assetLoader.loadImages(AssetSources);
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

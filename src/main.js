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
import { AISystem } from './systems/AISystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { SEOSystem } from './systems/SEOSystem.js';

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

        // Initialisation des cœurs
        this.entityManager = new EntityManager();
        this.inputHandler = new InputHandler();
        this.saveSystem = new SaveSystem();

        // Sécurité : Initialisation du système de sauvegarde (Key generation)
        this.saveSystem.initIntegritySalt();

        // Initialisation des Systèmes
        // Ordre CRITIQUE : Input -> Logic -> Physics -> Render
        this.inputSystem = new InputSystem(this.entityManager, this.inputHandler);
        this.aiSystem = new AISystem(this.entityManager);
        this.movementSystem = new MovementSystem(this.entityManager, this.canvas.width, this.canvas.height);
        this.physicsSystem = new PhysicsSystem(this.entityManager, this.canvas.width, this.canvas.height);
        this.renderSystem = new RenderSystem(this.entityManager, this.ctx, this.canvas.width, this.canvas.height, this.physicsSystem);
        this.seoSystem = new SEOSystem(this.entityManager);

        this.entityManager.registerSystem(this.inputSystem);
        this.entityManager.registerSystem(this.aiSystem);
        this.entityManager.registerSystem(this.movementSystem);
        this.entityManager.registerSystem(this.physicsSystem);
        // RenderSystem et SEOSystem sont appelés manuellement dans la boucle de rendu pour séparer update/draw

        // Configuration
        this.debugMode = true;
        this.renderSystem.setDebugMode(this.debugMode);

        // Boucle de jeu
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );

        this.initWorld();
        this.gameLoop.start();

        console.log('Genesis Survivor Engine (GSE-v1) initialized.');
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

        hero.addComponent(new ColliderComponent());
        const c = hero.getComponent('ColliderComponent');
        c.radius = 20;
        c.tags = ['player'];

        hero.addComponent(new RenderComponent());
        const r = hero.getComponent('RenderComponent');
        r.color = '#00ccff'; // Bleu Cyan
        r.shape = 'rect';
        r.width = 40;
        r.height = 40;
        r.layer = 10;

        // 2. Création des Ennemis (Carrés Rouges)
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy(i);
        }
    }

    spawnEnemy(index) {
        const enemy = this.entityManager.createEntity();
        enemy.tags.add('enemy');

        enemy.addComponent(new TransformComponent());
        const t = enemy.getComponent('TransformComponent');
        // Position aléatoire autour du joueur
        t.x = Math.random() * this.canvas.width;
        t.y = Math.random() * this.canvas.height;

        enemy.addComponent(new VelocityComponent());
        const v = enemy.getComponent('VelocityComponent');
        v.speed = 100 + Math.random() * 50; // Vitesse variable

        enemy.addComponent(new AIComponent());
        const ai = enemy.getComponent('AIComponent');
        ai.detectionRadius = 500;

        enemy.addComponent(new ColliderComponent());
        const c = enemy.getComponent('ColliderComponent');
        c.radius = 16;
        c.tags = ['enemy'];

        enemy.addComponent(new RenderComponent());
        const r = enemy.getComponent('RenderComponent');
        r.color = '#ff3333'; // Rouge
        r.shape = 'rect'; // Le prompt demandait "carrés rouges"
        r.width = 32;
        r.height = 32;
        r.layer = 5;
    }

    update(dt) {
        // Mise à jour de la logique (Pas de temps fixe)
        this.entityManager.update(dt);

        // Mise à jour SEO (Throttled)
        this.seoSystem.update(dt);
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

import { System } from '../ecs/System.js';
import { TransformComponent, RenderComponent } from '../components/Components.js';

export class RenderSystem extends System {
    /**
     * @param {EntityManager} entityManager
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {PhysicsSystem} physicsSystem - Pour le debug draw
     * @param {TerraformationSystem} terraformationSystem - Pour dessiner le fond
     */
    constructor(entityManager, ctx, width, height, physicsSystem, terraformationSystem) {
        super(entityManager);
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.physicsSystem = physicsSystem;
        this.terraformationSystem = terraformationSystem;
        this.debugMode = false; // Sera activé via main.js

        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * @param {number} alpha - Facteur d'interpolation.
     */
    render(alpha) {
        // 1. Effacer l'écran
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1b. Dessiner le Terrain (Background)
        if (this.terraformationSystem) {
            this.terraformationSystem.renderTerrain(this.ctx);
        }

        const entities = this.entityManager.getEntities();

        // 2. Filtrer et Trier par layer
        const renderables = [];
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('RenderComponent') && entity.hasComponent('TransformComponent')) {
                renderables.push(entity);
            }
        }
        renderables.sort((a, b) => {
            const ra = a.getComponent('RenderComponent');
            const rb = b.getComponent('RenderComponent');
            return ra.layer - rb.layer;
        });

        // 3. Dessiner les entités
        for (const entity of renderables) {
            const transform = entity.getComponent('TransformComponent');
            const render = entity.getComponent('RenderComponent');

            this.drawPlaceholder(transform, render);
        }

        // 3b. Dessiner les textes flottants (UI World Space)
        this.drawFloatingTexts(entities);

        // 3c. Particles (si gérées via RenderComponent, elles sont déjà dessinées en étape 3)
        // Mais si on veut un effet spécial (additive blending), on le fait ici ou via un flag sur RenderComponent.
        // Pour l'instant, étape 3 suffit.

        // 4. Debug Draw (Grille Spatiale)
        if (this.debugMode && this.physicsSystem) {
            this.physicsSystem.drawDebug(this.ctx);
        }

        // 5. FPS Counter
        this.drawFPS();
    }

    drawPlaceholder(transform, render, entity) {
        this.ctx.save();
        this.ctx.translate(transform.x, transform.y);
        this.ctx.rotate(transform.rotation);

        // Effet "Glow"
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = render.color;
        this.ctx.fillStyle = render.color;

        // Hack pour les particules qui fade out
        if (entity && entity.hasComponent('ParticleComponent')) {
            const p = entity.getComponent('ParticleComponent');
            this.ctx.globalAlpha = p.lifetime / p.maxLifetime;
        }

        if (render.shape === 'rect') {
            this.ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
        } else if (render.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, render.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawFloatingTexts(entities) {
        this.ctx.save();
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('FloatingTextComponent') && entity.hasComponent('TransformComponent')) {
                const transform = entity.getComponent('TransformComponent');
                const ft = entity.getComponent('FloatingTextComponent');

                // Petit effet de fade out
                this.ctx.globalAlpha = Math.max(0, ft.lifetime);

                this.ctx.strokeText(ft.text, transform.x, transform.y);
                this.ctx.fillText(ft.text, transform.x, transform.y);
            }
        }
        this.ctx.restore();
    }

    drawFPS() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }

        this.ctx.save();
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillText(`Entities: ${this.entityManager.getEntities().length}`, 10, 40);
        if (this.debugMode) {
             this.ctx.fillText(`DEBUG MODE ON`, 10, 60);
        }
        this.ctx.restore();
    }
}

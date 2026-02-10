import { System } from '../ecs/System.js';
import { TransformComponent, RenderComponent } from '../components/Components.js';

export class RenderSystem extends System {
    constructor(entityManager, ctx, width, height, physicsSystem, terraformationSystem) {
        super(entityManager);
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.physicsSystem = physicsSystem;
        this.terraformationSystem = terraformationSystem;
        this.debugMode = false;

        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

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
        const texts = [];

        for (const entity of entities) {
            if (!entity.active) continue;

            if (entity.hasComponent('RenderComponent') && entity.hasComponent('TransformComponent')) {
                renderables.push(entity);
            }
            if (entity.hasComponent('FloatingTextComponent') && entity.hasComponent('TransformComponent')) {
                texts.push(entity);
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
            const sprite = entity.getComponent('SpriteComponent');

            // Gestion du Hit Flash (White Blink)
            if (render.hitFlashTimer > 0) {
                render.hitFlashTimer -= 0.016; // Approx dt, render receives alpha but we need logic update for visual timer
                // Or handle in logic system? Render system is fine for visual only state.
                this.ctx.save();
                this.drawEntity(transform, render, sprite, '#ffffff', true); // Force white
                this.ctx.restore();
            } else {
                this.ctx.save();
                this.drawEntity(transform, render, sprite, render.color, false);
                this.ctx.restore();
            }
        }

        // 3b. Dessiner les textes flottants
        this.drawFloatingTexts(texts);

        // 4. Debug Draw
        if (this.debugMode && this.physicsSystem) {
            this.physicsSystem.drawDebug(this.ctx);
        }

        // 5. FPS Counter
        this.drawFPS();
    }

    drawEntity(transform, render, sprite, color, isHitFlash) {
        this.ctx.translate(transform.x, transform.y);
        this.ctx.rotate(transform.rotation);

        // Effet "Glow"
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        this.ctx.fillStyle = color;

        let drawn = false;

        // 1. Sprite Rendering
        if (sprite && sprite.animations) {
            const frames = sprite.animations[sprite.currentAnimation];
            if (frames && frames.length > 0) {
                const img = frames[sprite.currentFrameIndex];
                if (img) {
                    this.ctx.save();
                    if (sprite.flipX) {
                        this.ctx.scale(-1, 1);
                    }

                    if (isHitFlash) {
                        // Flash Effect on Sprite: use GlobalCompositeOperation or Filter
                        // Filter is expensive, but effective. 'brightness(10)' or 'grayscale(1) brightness(2)'
                        // Or use source-in with color.
                        this.ctx.globalCompositeOperation = 'source-over';
                        // Note: For true white flash on sprite, we need complex masking.
                        // Simplification: Apply brightness filter
                        this.ctx.filter = 'brightness(1000%)';
                    }

                    // Draw Image centered
                    // We use render.width/height as destination size to match hitbox/design
                    // But we might want to respect aspect ratio?
                    // For now, stretch to fit render bounds (simple)
                    this.ctx.drawImage(img, -render.width / 2, -render.height / 2, render.width, render.height);

                    this.ctx.restore();
                    drawn = true;
                }
            }
        }

        // 2. Shape Rendering (Fallback or if no sprite)
        if (!drawn) {
            if (render.shape === 'rect') {
                this.ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
            } else if (render.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, render.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawFloatingTexts(entities) {
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;

        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const ft = entity.getComponent('FloatingTextComponent');

            this.ctx.globalAlpha = Math.max(0, ft.lifetime);

            if (ft.isCritical) {
                this.ctx.font = 'bold 24px Arial'; // Plus gros
                this.ctx.fillStyle = '#ff0000';    // Rouge vif
            } else {
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = '#ffffff';
            }

            this.ctx.strokeText(ft.text, transform.x, transform.y);
            this.ctx.fillText(ft.text, transform.x, transform.y);
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

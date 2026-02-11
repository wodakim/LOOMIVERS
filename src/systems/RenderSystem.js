import { System } from '../ecs/System.js';
import { TransformComponent, RenderComponent } from '../components/Components.js';

export class RenderSystem extends System {
    constructor(entityManager, ctx, width, height, physicsSystem, terraformationSystem) {
        super(entityManager);
        this.ctx = ctx;
        this.width = width;   // Screen Width
        this.height = height; // Screen Height
        this.physicsSystem = physicsSystem;
        this.terraformationSystem = terraformationSystem;
        this.debugMode = false;

        this.camera = { x: 0, y: 0 };
        this.mapGrid = null;
        this.mapTileSize = 64;

        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    setMap(mapGrid, tileSize) {
        this.mapGrid = mapGrid;
        this.mapTileSize = tileSize;
    }

    updateCamera() {
        // Find Player
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (player) {
            const t = player.getComponent('TransformComponent');
            // Center camera on player
            this.camera.x = t.x - this.width / 2;
            this.camera.y = t.y - this.height / 2;
        }

        // Clamp to Map Bounds (if map exists)
        if (this.mapGrid) {
            const mapW = this.mapGrid[0].length * this.mapTileSize;
            const mapH = this.mapGrid.length * this.mapTileSize;

            this.camera.x = Math.max(0, Math.min(this.camera.x, mapW - this.width));
            this.camera.y = Math.max(0, Math.min(this.camera.y, mapH - this.height));
        }
    }

    render(alpha) {
        this.updateCamera();

        // 1. Clear Screen
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        // Apply Camera Transform
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 1b. Draw Map Tiles (Culling)
        this.drawMap();

        // 1c. Draw Terraformation (Background)
        // Note: TerraformationSystem creates a canvas the size of the WORLD?
        // No, currently initialized with screen width. It needs update.
        // For now, assume renderTerrain handles its own or we draw entities.
        // Actually, TerraformationSystem uses an offscreen canvas.
        // We should draw it at 0,0 relative to world.
        if (this.terraformationSystem) {
             this.terraformationSystem.renderTerrain(this.ctx);
        }

        const entities = this.entityManager.getEntities();

        // 2. Filter & Sort
        const renderables = [];
        const texts = [];

        for (const entity of entities) {
            if (!entity.active) continue;

            if (entity.hasComponent('RenderComponent') && entity.hasComponent('TransformComponent')) {
                // Frustum Culling
                const t = entity.getComponent('TransformComponent');
                if (t.x + 100 > this.camera.x && t.x - 100 < this.camera.x + this.width &&
                    t.y + 100 > this.camera.y && t.y - 100 < this.camera.y + this.height) {
                    renderables.push(entity);
                }
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

        // 3. Draw Entities
        for (const entity of renderables) {
            const transform = entity.getComponent('TransformComponent');
            const render = entity.getComponent('RenderComponent');
            const sprite = entity.getComponent('SpriteComponent');

            // Handle Hit Flash
            if (render.hitFlashTimer > 0) {
                render.hitFlashTimer -= 0.016;
                this.ctx.save();
                this.drawEntity(transform, render, sprite, '#ffffff', true);
                this.ctx.restore();
            } else {
                this.ctx.save();
                this.drawEntity(transform, render, sprite, render.color, false);
                this.ctx.restore();
            }
        }

        // 3b. Draw Floating Texts
        this.drawFloatingTexts(texts);

        // 4. Debug Draw
        if (this.debugMode && this.physicsSystem) {
            this.physicsSystem.drawDebug(this.ctx);
        }

        // 5. FPS Counter
        this.drawFPS();
    }

    drawMap() {
        if (!this.mapGrid) return;

        const startCol = Math.floor(this.camera.x / this.mapTileSize);
        const endCol = Math.ceil((this.camera.x + this.width) / this.mapTileSize);
        const startRow = Math.floor(this.camera.y / this.mapTileSize);
        const endRow = Math.ceil((this.camera.y + this.height) / this.mapTileSize);

        const rows = this.mapGrid.length;
        const cols = this.mapGrid[0].length;

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const tile = this.mapGrid[r][c];
                    const x = c * this.mapTileSize;
                    const y = r * this.mapTileSize;

                    if (tile === 1) { // Wall
                        this.ctx.fillStyle = '#444';
                        this.ctx.fillRect(x, y, this.mapTileSize, this.mapTileSize);
                        // Add some texture detail?
                        this.ctx.fillStyle = '#222';
                        this.ctx.fillRect(x + 5, y + 5, this.mapTileSize - 10, this.mapTileSize - 10);
                    } else { // Floor
                        this.ctx.fillStyle = '#1a1a1a'; // Slightly lighter than bg
                        this.ctx.fillRect(x, y, this.mapTileSize, this.mapTileSize);
                        this.ctx.strokeStyle = '#222';
                        this.ctx.strokeRect(x, y, this.mapTileSize, this.mapTileSize);
                    }
                }
            }
        }
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

            // Dynamic scaling (Pop effect)
            const age = 1.0 - ft.lifetime; // Age from 0 to 1 (if lifetime is 1.0) usually lifetime decreases
            // Assuming max lifetime is around 1.0. If lifetime starts at 1.5, we normalize?
            // Let's scale based on remaining lifetime to simplify.
            // Pop up at start:
            let scale = 1.0;
            if (ft.lifetime > 0.8) {
                scale = 1.0 + (ft.lifetime - 0.8) * 2; // Pop
            }

            this.ctx.translate(transform.x, transform.y);
            this.ctx.scale(scale, scale);

            if (ft.isCritical) {
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillStyle = '#ff0000';
            } else {
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillStyle = '#ffffff';
            }

            this.ctx.strokeText(ft.text, 0, 0);
            this.ctx.fillText(ft.text, 0, 0);

            this.ctx.scale(1/scale, 1/scale);
            this.ctx.translate(-transform.x, -transform.y);
        }
        this.ctx.restore();
    }

    drawFPS() {
        this.ctx.restore(); // Restore Camera Transform (Draw UI in Screen Space)

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
        this.ctx.fillText(`Cam: ${Math.round(this.camera.x)},${Math.round(this.camera.y)}`, 10, 60);
        if (this.debugMode) {
             this.ctx.fillText(`DEBUG MODE ON`, 10, 80);
        }
        this.ctx.restore();
    }
}

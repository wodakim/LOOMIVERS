import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent } from '../components/Components.js';
import { HealthComponent } from '../components/StatsComponents.js';

export class TerraformationSystem extends System {
    constructor(entityManager, width, height) {
        super(entityManager);
        this.width = width;
        this.height = height;
        this.zones = []; // Liste des zones actives {x, y, radius, type}

        // Création du canvas d'arrière-plan (Offscreen pour la logique, Onscreen pour le visuel si on veut)
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'terrain-canvas';
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;

        // Insertion dans le DOM avant le canvas de jeu (pour le debug/visuel séparé si besoin)
        const gameContainer = document.getElementById('game-container');
        const gameCanvas = document.getElementById('game-canvas');
        if (gameContainer && gameCanvas) {
            gameContainer.insertBefore(this.bgCanvas, gameCanvas);
        }

        this.ctx = this.bgCanvas.getContext('2d', { willReadFrequently: true });

        // Effacer le fond (transparent)
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;
        this.zones = []; // Clear zones on resize/map change
        this.ctx.clearRect(0, 0, width, height);
    }

    /**
     * Ajoute un cratère ou une zone d'effet.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {string} type - 'fire' | 'water' | 'crater' | 'oil' | 'electrified_water'
     */
    addZone(x, y, radius, type) {
        this.zones.push({ x, y, radius, type });
        this.redrawZones(); // Simple POC redraw
    }

    addStain(x, y, size, color) {
        // Stains are purely visual and permanent (until resize/reset)
        // We draw them immediately on the canvas and DON'T store them in 'zones' logic list
        // because they don't have gameplay effects (collisions).
        // BUT redrawZones clears the canvas. So we need a way to persist them.

        // Option 1: Separate canvas for stains.
        // Option 2: Store stains in a list and redraw (expensive).
        // Option 3: Don't clear stains in redrawZones? But redrawZones is needed for dynamic zones moving/changing?
        // Actually, zones are static mostly. But 'fire' might flicker?
        // Let's store stains in a separate list.
        if (!this.stains) this.stains = [];
        this.stains.push({x, y, size, color, rotation: Math.random() * Math.PI});

        // Optimize: Limit stain count
        if (this.stains.length > 500) this.stains.shift();

        this.redrawZones();
    }

    redrawZones() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Stains first (bottom layer)
        if (this.stains) {
            for (const stain of this.stains) {
                this.ctx.save();
                this.ctx.translate(stain.x, stain.y);
                this.ctx.rotate(stain.rotation);
                this.ctx.fillStyle = stain.color;
                this.ctx.globalAlpha = 0.6;
                // Splat shape
                this.ctx.beginPath();
                this.ctx.arc(0, 0, stain.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        for (const zone of this.zones) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);

            if (zone.type === 'fire') {
                this.ctx.fillStyle = 'rgba(255, 50, 0, 0.5)';
            } else if (zone.type === 'water') {
                this.ctx.fillStyle = 'rgba(0, 50, 255, 0.5)';
            } else if (zone.type === 'crater') {
                this.ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            } else if (zone.type === 'oil') {
                this.ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
            } else if (zone.type === 'electrified_water') {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00ffff';
            }

            this.ctx.fill();
            this.ctx.restore();
        }
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('TransformComponent')) {
                const t = entity.getComponent('TransformComponent');

                // Vérifier si l'entité est dans une zone
                for (const zone of this.zones) {
                    const dx = t.x - zone.x;
                    const dy = t.y - zone.y;
                    const distSq = dx*dx + dy*dy;

                    if (distSq < zone.radius * zone.radius) {
                        this.applyZoneEffect(entity, zone, dt);
                    }
                }

                // Slime Trail Logic
                if (entity.tags.has('enemy') && entity.hasComponent('ElementalComponent')) {
                     const elem = entity.getComponent('ElementalComponent');
                     if (elem.tags.has('oil')) {
                         // Chance to leave puddle
                         if (Math.random() < 0.01) { // Low chance per frame
                             this.addZone(t.x, t.y, 20, 'oil');
                         }
                     }
                }
            }
        }
    }

    applyZoneEffect(entity, zone, dt) {
        // Effet EAU : Ralentissement
        if (zone.type === 'water') {
            if (entity.hasComponent('VelocityComponent')) {
                const v = entity.getComponent('VelocityComponent');
                // Ralentissement de 50%
                v.vx *= 0.5;
                v.vy *= 0.5;
            }
        }

        // ELECTRIFIED WATER : STUN + DAMAGE
        if (zone.type === 'electrified_water') {
            if (entity.hasComponent('VelocityComponent')) {
                const v = entity.getComponent('VelocityComponent');
                // Stun almost complete
                v.vx *= 0.1;
                v.vy *= 0.1;
            }
            if (entity.hasComponent('HealthComponent') && entity.tags.has('enemy')) {
                 const h = entity.getComponent('HealthComponent');
                 h.current -= 20 * dt;
            }
        }

        // Effet FEU : Dégâts (DoT)
        if (zone.type === 'fire') {
            if (entity.hasComponent('HealthComponent')) {
                // Le joueur est immunisé à son propre feu (gameplay classique)
                if (entity.tags.has('enemy')) {
                    const health = entity.getComponent('HealthComponent');
                    health.current -= 50 * dt; // 50 DPS (significatif)
                }
            }
        }
    }

    // Méthode de secours pour dessiner sur le canvas principal via RenderSystem
    renderTerrain(mainCtx) {
        mainCtx.drawImage(this.bgCanvas, 0, 0);
    }
}

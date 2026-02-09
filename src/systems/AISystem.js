import { System } from '../ecs/System.js';
import { TransformComponent, AIComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { ProjectileComponent, WeaponComponent } from '../components/WeaponComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { BossComponent } from '../components/BossComponent.js';

/**
 * Système gérant l'intelligence artificielle des ennemis.
 * Implémente le "Chase", "Separation" (Boids), et les comportements spécifiques (Shooter, Charger, Boss).
 */
export class AISystem extends System {
    /**
     * @param {EntityManager} entityManager
     * @param {PhysicsSystem} physicsSystem - Utilisé pour l'algo de voisinage (Grid)
     */
    constructor(entityManager, physicsSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        // Trouver la cible (Joueur)
        let targetEntity = null;
        for (const entity of entities) {
            if (entity.tags.has('player')) {
                targetEntity = entity;
                break;
            }
        }

        if (!targetEntity) return;

        const targetTransform = targetEntity.getComponent('TransformComponent');

        for (const entity of entities) {
            if (entity.hasComponent('AIComponent') && entity.hasComponent('TransformComponent') && entity.hasComponent('VelocityComponent')) {
                const ai = entity.getComponent('AIComponent');

                // Boss Logic Override
                if (entity.hasComponent('BossComponent')) {
                    this.handleBoss(entity, targetTransform, dt);
                    continue;
                }

                if (ai.behavior === 'shooter') {
                    this.handleShooter(entity, targetTransform, dt, ai);
                } else if (ai.behavior === 'charger') {
                    this.handleCharger(entity, targetTransform, dt, ai);
                } else {
                    // Default Chase
                    this.handleChase(entity, targetTransform, dt);
                }
            }
        }
    }

    handleChase(entity, targetTransform, dt) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        // 1. Vecteur vers la Cible (Chase)
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let dirX = 0;
        let dirY = 0;

        if (dist > 0) {
            dirX = dx / dist;
            dirY = dy / dist;
        }

        // 2. Séparation
        const separationForce = this.calculateSeparation(entity, transform);

        // 3. Synthèse
        const chaseWeight = 1.0;
        const separationWeight = 2.0;

        let finalDx = (dirX * chaseWeight) + (separationForce.x * separationWeight);
        let finalDy = (dirY * chaseWeight) + (separationForce.y * separationWeight);

        // Normalisation
        const finalDist = Math.sqrt(finalDx*finalDx + finalDy*finalDy);
        if (finalDist > 0) {
            finalDx /= finalDist;
            finalDy /= finalDist;
        }

        const speedFactor = 0.8;
        velocity.vx = finalDx * velocity.speed * speedFactor;
        velocity.vy = finalDy * velocity.speed * speedFactor;
    }

    handleShooter(entity, targetTransform, dt, ai) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Movement Logic: Keep Distance
        const desiredDist = ai.shootRange || 300;
        let moveDirX = 0;
        let moveDirY = 0;

        if (dist > desiredDist + 50) {
             // Too far: Chase
             moveDirX = dx / dist;
             moveDirY = dy / dist;
        } else if (dist < desiredDist - 50) {
             // Too close: Flee
             moveDirX = -(dx / dist);
             moveDirY = -(dy / dist);
        } else {
            // Sweet spot: Stop (or strafe later)
            moveDirX = 0;
            moveDirY = 0;
        }

        // Apply Separation even for Shooters
        const separationForce = this.calculateSeparation(entity, transform);
        moveDirX += separationForce.x * 2.0;
        moveDirY += separationForce.y * 2.0;

        // Normalize
        const moveLen = Math.sqrt(moveDirX*moveDirX + moveDirY*moveDirY);
        if (moveLen > 0) {
            moveDirX /= moveLen;
            moveDirY /= moveLen;
        }

        velocity.vx = moveDirX * velocity.speed * 0.8;
        velocity.vy = moveDirY * velocity.speed * 0.8;

        // Shooting Logic
        ai.shootTimer -= dt;
        if (ai.shootTimer <= 0 && dist < ai.shootRange * 1.5) {
            this.shooterFire(entity, targetTransform);
            ai.shootTimer = 2.0; // Fire every 2s
        }
    }

    shooterFire(source, targetTransform) {
        const sourceTransform = source.getComponent('TransformComponent');

        // Spawn Enemy Projectile
        const projectile = this.entityManager.createEntity();
        projectile.tags.add('projectile');
        projectile.tags.add('enemy_projectile'); // Important for collision filtering

        projectile.addComponent(new TransformComponent());
        const t = projectile.getComponent('TransformComponent');
        t.x = sourceTransform.x;
        t.y = sourceTransform.y;

        const dx = targetTransform.x - t.x;
        const dy = targetTransform.y - t.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        projectile.addComponent(new VelocityComponent());
        const v = projectile.getComponent('VelocityComponent');
        const speed = 200;
        v.vx = (dx/dist) * speed;
        v.vy = (dy/dist) * speed;

        projectile.addComponent(new RenderComponent());
        const r = projectile.getComponent('RenderComponent');
        r.color = '#ff00ff'; // Purple shot
        r.shape = 'circle';
        r.width = 6;
        r.height = 6;
        r.layer = 20;

        projectile.addComponent(new ProjectileComponent());
        const p = projectile.getComponent('ProjectileComponent');
        p.damage = 10;
        p.sourceId = source.id;
        p.lifetime = 3.0;

        projectile.addComponent(new ColliderComponent());
        const c = projectile.getComponent('ColliderComponent');
        c.radius = 4;
        c.isTrigger = true;
        c.tags = ['player']; // Hits player
    }

    handleCharger(entity, targetTransform, dt, ai) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');
        const render = entity.getComponent('RenderComponent');

        if (ai.isCharging) {
            // Dashing state
            ai.chargeTimer -= dt;
            if (ai.chargeTimer <= 0) {
                // End dash
                ai.isCharging = false;
                velocity.vx = 0;
                velocity.vy = 0;
                ai.chargeTimer = 2.0; // Cooldown
                if (render) render.color = '#ffaa00'; // Reset color (Orange)
            }
            // While charging, velocity is locked (high speed), no steering
        } else {
            // Prepare state
            ai.chargeTimer -= dt;

            // Look at player
            const dx = targetTransform.x - transform.x;
            const dy = targetTransform.y - transform.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (ai.chargeTimer <= 0 && dist < 400) {
                // Start Charge
                ai.isCharging = true;
                ai.chargeTimer = 0.5; // Dash duration

                // Dash vector
                const speed = velocity.speed * 4.0; // 4x speed
                velocity.vx = (dx/dist) * speed;
                velocity.vy = (dy/dist) * speed;

                if (render) render.color = '#ffff00'; // Flash Yellow warning
            } else {
                // Normal slow chase / orientation
                const chaseSpeed = velocity.speed * 0.5;
                if (dist > 0) {
                    velocity.vx = (dx/dist) * chaseSpeed;
                    velocity.vy = (dy/dist) * chaseSpeed;
                }

                // Separation
                const sep = this.calculateSeparation(entity, transform);
                velocity.vx += sep.x * velocity.speed;
                velocity.vy += sep.y * velocity.speed;
            }
        }
    }

    calculateSeparation(entity, transform) {
        const separationForce = { x: 0, y: 0 };
        if (this.physicsSystem) {
            const neighbors = this.getNeighbors(entity, transform);
            let separationCount = 0;
            const separationRadius = 30;

            for (const neighbor of neighbors) {
                if (neighbor === entity) continue;
                if (!neighbor.hasComponent('TransformComponent')) continue;

                const nt = neighbor.getComponent('TransformComponent');
                const ndx = transform.x - nt.x;
                const ndy = transform.y - nt.y;
                const ndistSq = ndx*ndx + ndy*ndy;

                if (ndistSq > 0 && ndistSq < separationRadius * separationRadius) {
                    const ndist = Math.sqrt(ndistSq);
                    const strength = (separationRadius - ndist) / separationRadius;
                    separationForce.x += (ndx / ndist) * strength;
                    separationForce.y += (ndy / ndist) * strength;
                    separationCount++;
                }
            }

            if (separationCount > 0) {
                separationForce.x /= separationCount;
                separationForce.y /= separationCount;
            }
        }
        return separationForce;
    }

    getNeighbors(entity, transform) {
        // Utilisation de la grille du PhysicsSystem
        if (!this.physicsSystem || !this.physicsSystem.grid) return [];

        const cellSize = this.physicsSystem.cellSize;
        const col = Math.floor(transform.x / cellSize);
        const row = Math.floor(transform.y / cellSize);

        const neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${col + i},${row + j}`;
                const cell = this.physicsSystem.grid.get(key);
                if (cell) {
                    for (const e of cell) {
                        if (e.tags.has('enemy')) {
                             neighbors.push(e);
                        }
                    }
                }
            }
        }
        return neighbors;
    }

    handleBoss(entity, targetTransform, dt) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            velocity.vx = (dx / dist) * velocity.speed;
            velocity.vy = (dy / dist) * velocity.speed;
        }
    }
}

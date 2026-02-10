import { System } from '../ecs/System.js';
import { TransformComponent, AIComponent, VelocityComponent, RenderComponent, ColliderComponent, SupportComponent } from '../components/Components.js';
import { ProjectileComponent, WeaponComponent } from '../components/WeaponComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { BossComponent } from '../components/BossComponent.js';
import { HealthComponent } from '../components/StatsComponents.js';

export class AISystem extends System {
    constructor(entityManager, physicsSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

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

                // Support Logic
                if (entity.hasComponent('SupportComponent')) {
                    this.handleSupport(entity, dt);
                    this.handleChase(entity, targetTransform, dt, 0.5);
                    continue;
                }

                if (ai.behavior === 'shooter') {
                    this.handleShooter(entity, targetTransform, dt, ai);
                } else if (ai.behavior === 'charger') {
                    this.handleCharger(entity, targetTransform, dt, ai);
                } else if (ai.behavior === 'ghost') {
                    this.handleChase(entity, targetTransform, dt, 0.6); // Slower but no collision
                } else if (ai.behavior === 'kamikaze') {
                    this.handleKamikaze(entity, targetTransform, dt);
                } else {
                    this.handleChase(entity, targetTransform, dt);
                }
            }
        }
    }

    handleKamikaze(entity, targetTransform, dt) {
        const transform = entity.getComponent('TransformComponent');
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const distSq = dx*dx + dy*dy;

        // Explode if close
        if (distSq < 50 * 50) {
            // Trigger Explosion
            const health = entity.getComponent('HealthComponent');
            health.current = 0; // Die immediately

            // Spawn explosion effect/damage via separate entity or event?
            // Let's spawn a mine-like explosion instantly
            this.triggerKamikazeExplosion(transform);
        } else {
            // Chase fast
            this.handleChase(entity, targetTransform, dt, 1.5);
        }
    }

    triggerKamikazeExplosion(transform) {
        const explosion = this.entityManager.createEntity();
        explosion.tags.add('projectile');

        explosion.addComponent(new TransformComponent());
        explosion.getComponent('TransformComponent').x = transform.x;
        explosion.getComponent('TransformComponent').y = transform.y;

        // Visual
        explosion.addComponent(new RenderComponent());
        const r = explosion.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = 100; // Big boom
        r.height = 100;
        r.color = '#ff0000';
        r.layer = 20;

        // Logic
        explosion.addComponent(new ProjectileComponent());
        const p = explosion.getComponent('ProjectileComponent');
        p.damage = 40; // High damage
        p.sourceId = -1; // Neutral or Enemy source
        p.lifetime = 0.2;

        explosion.addComponent(new ColliderComponent());
        const c = explosion.getComponent('ColliderComponent');
        c.radius = 50;
        c.isTrigger = true;
        c.tags = ['player']; // Hurts player
    }

    handleSupport(entity, dt) {
        const support = entity.getComponent('SupportComponent');
        const transform = entity.getComponent('TransformComponent');

        if (support.timer > 0) {
            support.timer -= dt;
            return;
        }

        const neighbors = this.getNeighbors(entity, transform);
        let actionTriggered = false;

        for (const neighbor of neighbors) {
            if (neighbor === entity) continue;

            const nTransform = neighbor.getComponent('TransformComponent');
            const dx = nTransform.x - transform.x;
            const dy = nTransform.y - transform.y;
            const distSq = dx*dx + dy*dy;

            if (distSq < support.range * support.range) {
                if (support.type === 'healer') {
                    if (neighbor.hasComponent('HealthComponent')) {
                        const h = neighbor.getComponent('HealthComponent');
                        if (h.current < h.max) {
                            h.current = Math.min(h.current + support.effectStrength, h.max);
                            this.spawnBeam(transform, nTransform, '#00ff00');
                            actionTriggered = true;
                        }
                    }
                } else if (support.type === 'buffer') {
                    if (neighbor.hasComponent('VelocityComponent')) {
                        const v = neighbor.getComponent('VelocityComponent');
                        v.vx *= 1.2;
                        v.vy *= 1.2;
                        this.spawnBeam(transform, nTransform, '#00ffff');
                        actionTriggered = true;
                    }
                }
            }
        }

        if (actionTriggered) {
            support.timer = support.cooldown;
        }
    }

    spawnBeam(start, end, color) {
        const p = this.entityManager.createEntity();
        p.addComponent(new TransformComponent());
        p.getComponent('TransformComponent').x = end.x;
        p.getComponent('TransformComponent').y = end.y;
        p.addComponent(new RenderComponent());
        p.getComponent('RenderComponent').color = color;
        p.getComponent('RenderComponent').shape = 'circle';
        p.getComponent('RenderComponent').width = 10;
        p.getComponent('RenderComponent').height = 10;
    }

    handleChase(entity, targetTransform, dt, speedMod = 1.0) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Visual State Update
        if (entity.hasComponent('SpriteComponent')) {
            const sprite = entity.getComponent('SpriteComponent');
            if (dist < 60) { // Close range
                if (sprite.currentAnimation !== 'attack' && sprite.animations['attack']) {
                    sprite.currentAnimation = 'attack';
                    sprite.currentFrameIndex = 0;
                }
            } else {
                if (sprite.currentAnimation !== 'walk' && sprite.animations['walk']) {
                    sprite.currentAnimation = 'walk';
                    sprite.currentFrameIndex = 0; // Optional: reset or keep frame
                }
            }
        }

        let dirX = 0;
        let dirY = 0;

        if (dist > 0) {
            dirX = dx / dist;
            dirY = dy / dist;
        }

        const separationForce = this.calculateSeparation(entity, transform);

        const chaseWeight = 1.0;
        const separationWeight = 2.0;

        let finalDx = (dirX * chaseWeight) + (separationForce.x * separationWeight);
        let finalDy = (dirY * chaseWeight) + (separationForce.y * separationWeight);

        const finalDist = Math.sqrt(finalDx*finalDx + finalDy*finalDy);
        if (finalDist > 0) {
            finalDx /= finalDist;
            finalDy /= finalDist;
        }

        const speedFactor = 0.8 * speedMod;
        velocity.vx = finalDx * velocity.speed * speedFactor;
        velocity.vy = finalDy * velocity.speed * speedFactor;
    }

    handleShooter(entity, targetTransform, dt, ai) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const desiredDist = ai.shootRange || 300;
        let moveDirX = 0;
        let moveDirY = 0;

        if (dist > desiredDist + 50) {
             moveDirX = dx / dist;
             moveDirY = dy / dist;
        } else if (dist < desiredDist - 50) {
             moveDirX = -(dx / dist);
             moveDirY = -(dy / dist);
        } else {
            moveDirX = 0;
            moveDirY = 0;
        }

        const separationForce = this.calculateSeparation(entity, transform);
        moveDirX += separationForce.x * 2.0;
        moveDirY += separationForce.y * 2.0;

        const moveLen = Math.sqrt(moveDirX*moveDirX + moveDirY*moveDirY);
        if (moveLen > 0) {
            moveDirX /= moveLen;
            moveDirY /= moveLen;
        }

        velocity.vx = moveDirX * velocity.speed * 0.8;
        velocity.vy = moveDirY * velocity.speed * 0.8;

        ai.shootTimer -= dt;
        if (ai.shootTimer <= 0 && dist < ai.shootRange * 1.5) {
            this.shooterFire(entity, targetTransform);
            ai.shootTimer = 2.0;
        }
    }

    shooterFire(source, targetTransform) {
        const sourceTransform = source.getComponent('TransformComponent');
        this.spawnProjectile(sourceTransform.x, sourceTransform.y, targetTransform.x, targetTransform.y, source);
    }

    spawnProjectile(x, y, targetX, targetY, source) {
        const projectile = this.entityManager.createEntity();
        projectile.tags.add('projectile');
        projectile.tags.add('enemy_projectile');

        projectile.addComponent(new TransformComponent());
        const t = projectile.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        projectile.addComponent(new VelocityComponent());
        const v = projectile.getComponent('VelocityComponent');
        const speed = 200;
        if (dist > 0) {
            v.vx = (dx/dist) * speed;
            v.vy = (dy/dist) * speed;
        }

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
        c.tags = ['player'];
    }

    handleCharger(entity, targetTransform, dt, ai) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');
        const render = entity.getComponent('RenderComponent');

        if (ai.isCharging) {
            ai.chargeTimer -= dt;
            if (ai.chargeTimer <= 0) {
                ai.isCharging = false;
                velocity.vx = 0;
                velocity.vy = 0;
                ai.chargeTimer = 2.0;
                if (render) render.color = '#ffaa00';
            }
        } else {
            ai.chargeTimer -= dt;
            const dx = targetTransform.x - transform.x;
            const dy = targetTransform.y - transform.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (ai.chargeTimer <= 0 && dist < 400) {
                ai.isCharging = true;
                ai.chargeTimer = 0.5;
                const speed = velocity.speed * 4.0;
                velocity.vx = (dx/dist) * speed;
                velocity.vy = (dy/dist) * speed;
                if (render) render.color = '#ffff00';
            } else {
                const chaseSpeed = velocity.speed * 0.5;
                if (dist > 0) {
                    velocity.vx = (dx/dist) * chaseSpeed;
                    velocity.vy = (dy/dist) * chaseSpeed;
                }
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
        const boss = entity.getComponent('BossComponent');
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');
        const health = entity.getComponent('HealthComponent');

        if (boss.phase === 1 && health.current < health.max * 0.5) {
            boss.phase = 2;
            boss.attackCooldown = 0.1;
            console.log("BOSS PHASE 2");
        }

        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            velocity.vx = (dx / dist) * velocity.speed;
            velocity.vy = (dy / dist) * velocity.speed;
        }

        boss.patternTimer -= dt;
        if (boss.patternTimer <= 0) {
            boss.currentPattern = boss.currentPattern === 'spiral' ? 'ring' : 'spiral';
            boss.patternTimer = boss.patternDuration;
        }

        boss.attackCooldown -= dt;
        if (boss.attackCooldown <= 0) {
            if (boss.currentPattern === 'spiral') {
                this.fireSpiralPattern(entity, boss);
            } else {
                this.fireRingPattern(entity, boss);
            }
            boss.attackCooldown = boss.phase === 2 ? 0.1 : 0.2;
        }
    }

    fireSpiralPattern(entity, boss) {
        const transform = entity.getComponent('TransformComponent');
        const branches = boss.phase === 2 ? 4 : 2;

        for (let i = 0; i < branches; i++) {
            const angle = boss.angleOffset + (i * (Math.PI * 2 / branches));
            const targetX = transform.x + Math.cos(angle) * 100;
            const targetY = transform.y + Math.sin(angle) * 100;

            this.spawnProjectile(transform.x, transform.y, targetX, targetY, entity);
        }

        boss.angleOffset += 0.2;
    }

    fireRingPattern(entity, boss) {
        const transform = entity.getComponent('TransformComponent');
        const count = 12;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + boss.angleOffset;
            const targetX = transform.x + Math.cos(angle) * 100;
            const targetY = transform.y + Math.sin(angle) * 100;

            this.spawnProjectile(transform.x, transform.y, targetX, targetY, entity);
        }
        boss.angleOffset += 0.05;

        boss.attackCooldown = 1.0;
    }
}

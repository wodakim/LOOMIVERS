import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent, DashComponent } from '../components/Components.js';
import { HealthComponent, FloatingTextComponent, ScoreComponent } from '../components/StatsComponents.js';
import { ProjectileComponent } from '../components/WeaponComponents.js';

export class DamageSystem extends System {
    constructor(entityManager, physicsSystem, particleSystem, progressionSystem, alchemySystem, audioSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem;
        this.particleSystem = particleSystem;
        this.progressionSystem = progressionSystem;
        this.alchemySystem = alchemySystem;
        this.audioSystem = audioSystem;
        this.scoreElement = document.getElementById('score-display');
        this.score = 0;
        this.kills = {}; // Map<type, count> for session

        // Cooldown pour les dégâts de contact (évite 60 hits/sec)
        this.contactDamageCooldowns = new Map(); // entityId -> timer
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        const grid = this.physicsSystem.grid;

        // Update cooldowns
        for (const [id, timer] of this.contactDamageCooldowns) {
            if (timer > 0) {
                this.contactDamageCooldowns.set(id, timer - dt);
            } else {
                this.contactDamageCooldowns.delete(id);
            }
        }

        // 1. Projectiles (Trigger)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ProjectileComponent') && entity.hasComponent('ColliderComponent') && entity.hasComponent('TransformComponent')) {
                this.checkProjectileCollision(entity, grid);
            }

            // Textes Flottants
            if (entity.active && entity.hasComponent('FloatingTextComponent')) {
                const ft = entity.getComponent('FloatingTextComponent');
                ft.lifetime -= dt;

                if (entity.hasComponent('TransformComponent')) {
                    entity.getComponent('TransformComponent').y -= 20 * dt;
                }

                if (ft.lifetime <= 0) {
                    this.entityManager.removeEntity(entity);
                }
            }
        }

        // 1b. Check Contact Damage (Player vs Enemy)
        this.checkContactDamage(entities, grid);

        // 2. Score UI
        // Handled in UISystem now

        // 3. Global Death Check
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('HealthComponent')) {
                const health = entity.getComponent('HealthComponent');
                if (health.current <= 0 && !health.isDead) {
                    health.isDead = true;
                    if (this.audioSystem) {
                         this.audioSystem.playTone(100, 'sawtooth', 0.1, 0.3);
                    }
                    this.killEntity(entity);
                }
            }
        }
    }

    checkContactDamage(entities, grid) {
        let player = null;
        for (const e of entities) {
            if (e.tags.has('player')) {
                player = e;
                break;
            }
        }

        if (!player || !player.active) return;

        // Check DASH Invulnerability
        if (player.hasComponent('DashComponent')) {
            const dash = player.getComponent('DashComponent');
            if (dash.isDashing) return; // Invincible while dashing
        }

        // Check cooldown
        if (this.contactDamageCooldowns.has(player.id)) return;

        const pTransform = player.getComponent('TransformComponent');
        const pCollider = player.getComponent('ColliderComponent');
        const pHealth = player.getComponent('HealthComponent');

        if (!pTransform || !pCollider || !pHealth) return;

        // Look for enemies nearby
        // Using Grid for optimization
        const col = Math.floor(pTransform.x / this.physicsSystem.cellSize);
        const row = Math.floor(pTransform.y / this.physicsSystem.cellSize);

        // Check surrounding cells
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${col + i},${row + j}`;
                const cell = grid.get(key);
                if (cell) {
                    for (const other of cell) {
                        if (other.tags.has('enemy') && other.active) {
                            const oTransform = other.getComponent('TransformComponent');
                            const oCollider = other.getComponent('ColliderComponent');

                            const dx = pTransform.x - oTransform.x;
                            const dy = pTransform.y - oTransform.y;
                            const distSq = dx*dx + dy*dy;
                            const minDist = pCollider.radius + oCollider.radius; // Hitbox collision

                            if (distSq < minDist * minDist) {
                                // HIT!
                                const damage = 10; // Base contact damage
                                this.applyDamage(player, damage);

                                // Cooldown (i-frames)
                                this.contactDamageCooldowns.set(player.id, 1.0); // 1 second invulnerability
                                return; // One hit per frame max
                            }
                        }
                    }
                }
            }
        }
    }

    checkProjectileCollision(projectileEntity, grid) {
        const projectileTransform = projectileEntity.getComponent('TransformComponent');
        const projectileCollider = projectileEntity.getComponent('ColliderComponent');
        const projectileData = projectileEntity.getComponent('ProjectileComponent');
        const projectileVelocity = projectileEntity.getComponent('VelocityComponent');

        const col = Math.floor(projectileTransform.x / this.physicsSystem.cellSize);
        const row = Math.floor(projectileTransform.y / this.physicsSystem.cellSize);
        const key = `${col},${row}`;

        const cellEntities = grid.get(key);
        if (!cellEntities) return;

        for (const target of cellEntities) {
            let isValidTarget = false;
            for (const tag of projectileCollider.tags) {
                if (target.tags.has(tag)) {
                    isValidTarget = true;
                    break;
                }
            }
            if (!isValidTarget) continue;

            if (target.hasComponent('ColliderComponent') && target.hasComponent('HealthComponent') && target.hasComponent('TransformComponent')) {
                if (target.hasComponent('DashComponent') && target.getComponent('DashComponent').isDashing) {
                    continue;
                }

                const targetTransform = target.getComponent('TransformComponent');
                const targetCollider = target.getComponent('ColliderComponent');

                const dx = projectileTransform.x - targetTransform.x;
                const dy = projectileTransform.y - targetTransform.y;
                const distSq = dx * dx + dy * dy;
                const minDist = projectileCollider.radius + targetCollider.radius;

                if (distSq < minDist * minDist) {
                    // Check Trait Mods
                    if (projectileEntity.mods) {
                        // Pierce
                        if (projectileEntity.mods.has('pierce')) {
                            projectileEntity.pierceCount = (projectileEntity.pierceCount || 0) + 1;
                            if (projectileEntity.pierceCount > 2) { // Allow 2 hits (Pierce 1 + base)
                                this.entityManager.removeEntity(projectileEntity);
                            }
                        } else {
                            this.entityManager.removeEntity(projectileEntity);
                        }

                        // Explosion
                        if (projectileEntity.mods.has('explosive')) {
                            // Spawn simple explosion logic?
                            // For now just Area Damage
                            // TODO: Add proper explosion effect
                        }
                    } else {
                        // Default behavior: destroy on hit
                        this.entityManager.removeEntity(projectileEntity);
                    }

                    // Critical Hit Calculation
                    const isCrit = Math.random() < 0.1; // 10% Chance
                    const finalDamage = isCrit ? projectileData.damage * 2 : projectileData.damage;

                    // Knockback Vector
                    let knockback = { x: 0, y: 0 };
                    if (projectileVelocity) {
                        knockback.x = projectileVelocity.vx * 0.5; // Transfer momentum
                        knockback.y = projectileVelocity.vy * 0.5;
                    }

                    this.applyDamage(target, finalDamage, isCrit, knockback);

                    if (this.alchemySystem) {
                        this.alchemySystem.onProjectileHit(projectileEntity, target);
                    }

                    return; // Hit handled
                }
            }
        }
    }

    applyDamage(target, amount, isCrit = false, knockback = null) {
        const health = target.getComponent('HealthComponent');
        health.current -= amount;

        // Knockback (Impulse)
        if (target.hasComponent('VelocityComponent') && knockback) {
            const v = target.getComponent('VelocityComponent');
            v.vx += knockback.x;
            v.vy += knockback.y;
        }

        // Hit Flash Effect
        if (target.hasComponent('RenderComponent')) {
            target.getComponent('RenderComponent').hitFlashTimer = 0.1; // 100ms flash
        }

        // Sound Hit
        if (this.audioSystem) {
            this.audioSystem.playNoise(0.05, 0.2);
        }

        // Floating Text
        this.spawnFloatingText(target, amount, isCrit);

        // Particles
        if (this.particleSystem) {
             const t = target.getComponent('TransformComponent');
             const color = target.getComponent('RenderComponent') ? target.getComponent('RenderComponent').color : '#fff';
             // Spark Burst on Hit
             this.particleSystem.emitBurst(t.x, t.y, 3, '#ffff00');
             this.particleSystem.emit(t.x, t.y, 3, color);
        }

        if (health.current <= 0 && !health.isDead) {
            health.isDead = true;
            if (this.audioSystem) {
                this.audioSystem.playTone(100, 'sawtooth', 0.1, 0.3);
            }
            // Spawn Blood on Death
            if (this.particleSystem) {
                const t = target.getComponent('TransformComponent');
                this.particleSystem.emit(t.x, t.y, 10, '#880000', 150, true);
            }
            this.killEntity(target);
        }
    }

    spawnFloatingText(target, amount, isCrit) {
        const transform = target.getComponent('TransformComponent');
        const textEntity = this.entityManager.createEntity();

        textEntity.addComponent(new TransformComponent());
        const t = textEntity.getComponent('TransformComponent');
        t.x = transform.x;
        t.y = transform.y - 20;

        textEntity.addComponent(new FloatingTextComponent());
        const ft = textEntity.getComponent('FloatingTextComponent');
        ft.text = amount.toString() + (isCrit ? '!' : '');
        ft.color = isCrit ? '#ff0000' : '#fff';
        ft.isCritical = isCrit;

        // Criticals last longer and float higher?
        if (isCrit) {
            ft.lifetime = 1.5;
            // Maybe add velocity component for fancier float? For now stick to linear y- in update
        }
    }

    killEntity(entity) {
        // Track Kills for Bestiary
        if (entity.name) {
            this.kills[entity.name] = (this.kills[entity.name] || 0) + 1;
        }

        // Trigger Victory if Boss
        if (entity.hasComponent('BossComponent')) {
            window.game.gameManager.triggerVictory(this.score);
        }

        if (entity.hasComponent('ScoreComponent')) {
            const val = entity.getComponent('ScoreComponent').value;
            this.score += val;
        }

        // Spawn Drops (XP or Pickups)
        if (this.progressionSystem && entity.hasComponent('TransformComponent')) {
            const t = entity.getComponent('TransformComponent');

            // 5% chance for a utility pickup
            if (Math.random() < 0.05) {
                // 50/50 Health or Magnet
                const type = Math.random() < 0.5 ? 'health' : 'magnet';
                this.progressionSystem.spawnPickup(t.x, t.y, type);
            } else {
                const xpValue = entity.hasComponent('ScoreComponent') ? Math.ceil(entity.getComponent('ScoreComponent').value / 5) : 1;
                this.progressionSystem.spawnXPGem(t.x, t.y, xpValue);
            }
        }

        this.entityManager.removeEntity(entity);
    }
}

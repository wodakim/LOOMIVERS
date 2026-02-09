import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { CollectableComponent, LevelComponent } from '../components/ProgressionComponents.js';
import { WeaponComponent } from '../components/WeaponComponents.js';
import { HealthComponent } from '../components/StatsComponents.js';

export class ProgressionSystem extends System {
    constructor(entityManager, physicsSystem, audioSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem;
        this.audioSystem = audioSystem;
        this.uiXPBar = document.getElementById('xp-fill'); // À créer dans HTML
        this.uiLevel = document.getElementById('level-display'); // À créer
        this.levelUpOverlay = document.getElementById('levelup-overlay'); // À créer
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        let player = null;
        let playerTransform = null;
        let playerLevel = null;

        // Trouver le joueur
        for (const entity of entities) {
            if (entity.active && entity.tags.has('player')) {
                player = entity;
                playerTransform = entity.getComponent('TransformComponent');
                playerLevel = entity.getComponent('LevelComponent');
                break;
            }
        }

        if (!player) return;

        // Si le joueur level up, on arrête la logique (Pause) - Géré par GameLoop normalement via un State
        if (playerLevel && playerLevel.isLevelingUp) return;

        // Gestion des Collectables (XP)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('CollectableComponent') && entity.hasComponent('TransformComponent')) {
                this.handleCollectable(entity, player, playerTransform, dt);
            }
        }

        // Mise à jour UI
        if (playerLevel && this.uiXPBar && this.uiLevel) {
            const progress = (playerLevel.currentXP / playerLevel.nextLevelXP) * 100;
            this.uiXPBar.style.width = `${progress}%`;
            this.uiLevel.textContent = `LVL ${playerLevel.level}`;
        }
    }

    handleCollectable(gem, player, playerTransform, dt) {
        const gemTransform = gem.getComponent('TransformComponent');
        const collectable = gem.getComponent('CollectableComponent');

        const dx = playerTransform.x - gemTransform.x;
        const dy = playerTransform.y - gemTransform.y;
        const distSq = dx * dx + dy * dy;

        // Magnétisme
        if (distSq < collectable.magnetRange * collectable.magnetRange) {
            const dist = Math.sqrt(distSq);

            // Attirer vers le joueur
            if (dist > 10) { // Pas trop près pour éviter le jitter
                gemTransform.x += (dx / dist) * collectable.magnetSpeed * dt;
                gemTransform.y += (dy / dist) * collectable.magnetSpeed * dt;
            } else {
                // Collecté !
                this.collect(gem, player);
            }
        }
    }

    collect(gem, player) {
        const collectable = gem.getComponent('CollectableComponent');
        const level = player.getComponent('LevelComponent');
        const health = player.getComponent('HealthComponent');

        if (collectable.type === 'xp' && level) {
            level.currentXP += collectable.value;
            if (level.currentXP >= level.nextLevelXP) {
                this.triggerLevelUp(player, level);
            }
        } else if (collectable.type === 'health' && health) {
            health.current = Math.min(health.current + collectable.value, health.max);
            if (this.audioSystem) this.audioSystem.playTone(400, 'sine', 0.2, 0.5); // Heal sound
        } else if (collectable.type === 'magnet') {
            this.triggerMagnetEffect(player);
            if (this.audioSystem) this.audioSystem.playTone(800, 'sine', 0.5, 0.5);
        }

        this.entityManager.removeEntity(gem);
    }

    triggerMagnetEffect(player) {
        const entities = this.entityManager.getEntities();
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('CollectableComponent')) {
                // Force magnet range to infinite temporarily logic?
                // Or just teleport gems close?
                // Better: Set a flag or huge range on gems
                const c = entity.getComponent('CollectableComponent');
                if (c.type === 'xp') {
                    c.magnetRange = 2000; // Pull everything on screen
                    c.magnetSpeed = 800; // Fast
                }
            }
        }
    }

    triggerLevelUp(player, level) {
        if (this.audioSystem) {
            this.audioSystem.playLevelUp();
        }

        level.currentXP -= level.nextLevelXP;
        level.level++;
        level.nextLevelXP = Math.floor(level.nextLevelXP * 1.5);

        console.log(`LEVEL UP! Now level ${level.level}`);

        // Amélioration stats basiques (POC)
        // Dans une version complète, on afficherait l'UI et mettrait le jeu en pause
        const weapon = player.getComponent('WeaponComponent');
        if (weapon) {
            weapon.damage += 1; // Was 5 (Nerf)
            weapon.fireRate += 0.05; // Was 0.2 (Nerf)
            console.log('Weapon Upgraded!');
        }

        const health = player.getComponent('HealthComponent');
        if (health) {
            health.max += 5; // Was 20 (Nerf)
            health.current = health.max; // Soin complet
        }
    }

    spawnXPGem(x, y, value) {
        const gem = this.entityManager.createEntity();

        gem.addComponent(new TransformComponent());
        const t = gem.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        gem.addComponent(new CollectableComponent());
        const c = gem.getComponent('CollectableComponent');
        c.value = value;
        c.magnetRange = 150;

        gem.addComponent(new RenderComponent());
        const r = gem.getComponent('RenderComponent');
        r.shape = 'circle'; // Gemme ronde
        r.width = 6;
        r.height = 6;
        r.color = '#00ff00'; // Vert XP
        r.layer = 2; // Au sol
    }

    spawnPickup(x, y, type) {
        const pickup = this.entityManager.createEntity();

        pickup.addComponent(new TransformComponent());
        const t = pickup.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        pickup.addComponent(new CollectableComponent());
        const c = pickup.getComponent('CollectableComponent');
        c.type = type;
        c.magnetRange = 50; // Pickups are harder to get
        c.magnetSpeed = 100;

        pickup.addComponent(new RenderComponent());
        const r = pickup.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = 12;
        r.height = 12;
        r.layer = 3;

        if (type === 'health') {
            c.value = 30;
            r.color = '#ff0000'; // Red Heart
        } else if (type === 'magnet') {
            r.color = '#0000ff'; // Blue Magnet
        }
    }
}

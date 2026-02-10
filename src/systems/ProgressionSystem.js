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
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        let player = null;
        let playerTransform = null;
        let playerLevel = null;

        for (const entity of entities) {
            if (entity.active && entity.tags.has('player')) {
                player = entity;
                playerTransform = entity.getComponent('TransformComponent');
                playerLevel = entity.getComponent('LevelComponent');
                break;
            }
        }

        if (!player) return;

        // Skip logic if leveling up
        if (playerLevel && playerLevel.isLevelingUp) return;

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('CollectableComponent') && entity.hasComponent('TransformComponent')) {
                this.handleCollectable(entity, player, playerTransform, dt);
            }
        }
    }

    handleCollectable(gem, player, playerTransform, dt) {
        const gemTransform = gem.getComponent('TransformComponent');
        const collectable = gem.getComponent('CollectableComponent');

        const dx = playerTransform.x - gemTransform.x;
        const dy = playerTransform.y - gemTransform.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < collectable.magnetRange * collectable.magnetRange) {
            const dist = Math.sqrt(distSq);
            if (dist > 10) {
                gemTransform.x += (dx / dist) * collectable.magnetSpeed * dt;
                gemTransform.y += (dy / dist) * collectable.magnetSpeed * dt;
            } else {
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
            if (this.audioSystem) this.audioSystem.playTone(400, 'sine', 0.2, 0.5);
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
                const c = entity.getComponent('CollectableComponent');
                if (c.type === 'xp') {
                    c.magnetRange = 2000;
                    c.magnetSpeed = 800;
                }
            }
        }
    }

    triggerLevelUp(player, level) {
        if (this.audioSystem) {
            this.audioSystem.playLevelUp();
        }

        level.isLevelingUp = true; // Pause logic in next update

        // Generate Choices
        const choices = this.generateUpgradeChoices();

        // Call GameManager to show UI
        // Assuming global access or passed in constructor.
        // For POC: window.game
        window.game.gameManager.showLevelUp(choices, (selectedChoice) => {
            this.applyUpgrade(player, selectedChoice);
            // Resume
            level.currentXP -= level.nextLevelXP;
            level.level++;
            level.nextLevelXP = Math.floor(level.nextLevelXP * 1.5);
            level.isLevelingUp = false;
        });
    }

    generateUpgradeChoices() {
        const pool = [
            { type: 'stat', id: 'dmg', name: 'Damage Boost', description: 'Increase Damage by 2' },
            { type: 'stat', id: 'speed', name: 'Speed Boost', description: 'Increase Speed by 10%' },
            { type: 'stat', id: 'fire', name: 'Rapid Fire', description: 'Fire Rate +10%' },
            { type: 'heal', id: 'heal', name: 'Full Heal', description: 'Restore all HP' },
            { type: 'stat', id: 'hp', name: 'Max Health', description: 'Max HP +20' }
        ];

        // Pick 3 random
        const choices = [];
        for (let i = 0; i < 3; i++) {
            const rand = Math.floor(Math.random() * pool.length);
            choices.push(pool[rand]);
        }
        return choices;
    }

    applyUpgrade(player, choice) {
        const weapon = player.getComponent('WeaponComponent');
        const health = player.getComponent('HealthComponent');
        const velocity = player.getComponent('VelocityComponent');

        if (choice.id === 'dmg') weapon.damage += 2;
        if (choice.id === 'speed') velocity.speed *= 1.1;
        if (choice.id === 'fire') weapon.fireRate *= 1.1;
        if (choice.id === 'heal') health.current = health.max;
        if (choice.id === 'hp') {
            health.max += 20;
            health.current += 20;
        }

        console.log(`Applied Upgrade: ${choice.name}`);
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
        r.shape = 'circle';
        r.width = 6;
        r.height = 6;
        r.color = '#00ff00';
        r.layer = 2;
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
        c.magnetRange = 50;
        c.magnetSpeed = 100;

        pickup.addComponent(new RenderComponent());
        const r = pickup.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = 12;
        r.height = 12;
        r.layer = 3;

        if (type === 'health') {
            c.value = 30;
            r.color = '#ff0000';
        } else if (type === 'magnet') {
            r.color = '#0000ff';
        }
    }
}

import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { WeaponComponent, ProjectileComponent } from '../components/WeaponComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';

export class CombatSystem extends System {
    constructor(entityManager, audioSystem) {
        super(entityManager);
        this.audioSystem = audioSystem;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        // 1. Gestion des Armes (Auto-Fire)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('WeaponComponent') && entity.hasComponent('TransformComponent')) {
                this.handleWeapon(entity, dt, entities);
            }
        }

        // 2. Gestion des Projectiles (Durée de vie)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ProjectileComponent')) {
                const projectile = entity.getComponent('ProjectileComponent');
                projectile.lifetime -= dt;
                if (projectile.lifetime <= 0) {
                    this.entityManager.removeEntity(entity);
                }
            }
        }
    }

    handleWeapon(entity, dt, allEntities) {
        const weapon = entity.getComponent('WeaponComponent');

        // Gestion du cooldown
        if (weapon.cooldown > 0) {
            weapon.cooldown -= dt;
            return;
        }

        if (weapon.type === 'pistol') {
            this.handlePistol(entity, weapon, allEntities);
        } else if (weapon.type === 'whip') {
            this.handleWhip(entity, weapon);
        } else if (weapon.type === 'aura') {
            this.handleAura(entity, weapon);
        }
    }

    handlePistol(entity, weapon, allEntities) {
        const transform = entity.getComponent('TransformComponent');
        let target = null;
        let minDistSq = weapon.range * weapon.range;
        const targetTag = entity.tags.has('player') ? 'enemy' : 'player';

        for (const potentialTarget of allEntities) {
            if (!potentialTarget.active || !potentialTarget.tags.has(targetTag)) continue;
            const targetTransform = potentialTarget.getComponent('TransformComponent');
            const dx = targetTransform.x - transform.x;
            const dy = targetTransform.y - transform.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDistSq) {
                minDistSq = distSq;
                target = potentialTarget;
            }
        }

        if (target) {
            this.fireProjectile(entity, target, weapon);
            weapon.cooldown = 1 / weapon.fireRate;
        }
    }

    handleWhip(entity, weapon) {
        // Attack horizontally (Left/Right based on movement or random)
        // For simplicity: Always attacks RIGHT for now, or alternates.
        // Needs to spawn a temporary hitbox entity.
        this.spawnMeleeHitbox(entity, weapon, 50, 0); // Offset X
        this.spawnMeleeHitbox(entity, weapon, -50, 0); // Offset X (Double whip!)
        weapon.cooldown = 1 / weapon.fireRate;

        if (entity.tags.has('player') && this.audioSystem) {
            this.audioSystem.playNoise(0.1, 0.3); // Woosh effect
        }
    }

    handleAura(entity, weapon) {
        // Aura is a persistent hitbox around player.
        // Actually, we can just spawn a short-lived large circle every tick?
        // Or better: Spawn one entity that follows player.
        // For this ECS, spawning a short-lived pulse is easier to manage without parent-child hierarchy.
        this.spawnAreaHitbox(entity, weapon);
        weapon.cooldown = 1 / weapon.fireRate;

        // Aura sound is annoying if played every tick (fireRate is high).
        // Maybe skipping it or playing very low.
    }

    spawnMeleeHitbox(source, weapon, offsetX, offsetY) {
        const sourceTransform = source.getComponent('TransformComponent');
        const hitbox = this.entityManager.createEntity();
        hitbox.tags.add('projectile'); // Treated as projectile for damage system

        hitbox.addComponent(new TransformComponent());
        const t = hitbox.getComponent('TransformComponent');
        t.x = sourceTransform.x + offsetX;
        t.y = sourceTransform.y + offsetY;

        // Visual
        hitbox.addComponent(new RenderComponent());
        const r = hitbox.getComponent('RenderComponent');
        r.shape = 'rect';
        r.width = 100;
        r.height = 20;
        r.color = weapon.color;

        // Data
        hitbox.addComponent(new ProjectileComponent());
        const p = hitbox.getComponent('ProjectileComponent');
        p.damage = weapon.damage;
        p.sourceId = source.id;
        p.lifetime = weapon.duration || 0.2;

        // Collider
        hitbox.addComponent(new ColliderComponent());
        const c = hitbox.getComponent('ColliderComponent');
        c.width = 100;
        c.height = 20;
        c.isTrigger = true;
        c.tags = source.tags.has('player') ? ['enemy'] : ['player'];

        // Elemental
        if (source.hasComponent('ElementalComponent')) {
             hitbox.addComponent(new ElementalComponent());
             const sourceElem = source.getComponent('ElementalComponent');
             const hitElem = hitbox.getComponent('ElementalComponent');
             // Add weapon specific tag if needed, otherwise inherit
             if (weapon.type === 'whip') hitElem.tags.add('electric');
             for (const tag of sourceElem.tags) hitElem.tags.add(tag);
        }
    }

    spawnAreaHitbox(source, weapon) {
        const sourceTransform = source.getComponent('TransformComponent');
        const hitbox = this.entityManager.createEntity();
        hitbox.tags.add('projectile');

        hitbox.addComponent(new TransformComponent());
        const t = hitbox.getComponent('TransformComponent');
        t.x = sourceTransform.x;
        t.y = sourceTransform.y;

        // Visual (Faint circle)
        hitbox.addComponent(new RenderComponent());
        const r = hitbox.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = weapon.range * 2; // Diameter
        r.height = weapon.range * 2;
        r.color = weapon.color; // Transparent handled in RenderSystem or by color code
        r.layer = 1; // Below player

        hitbox.addComponent(new ProjectileComponent());
        const p = hitbox.getComponent('ProjectileComponent');
        p.damage = weapon.damage;
        p.sourceId = source.id;
        p.lifetime = 0.1; // Instant tick

        hitbox.addComponent(new ColliderComponent());
        const c = hitbox.getComponent('ColliderComponent');
        c.radius = weapon.range;
        c.isTrigger = true;
        c.tags = source.tags.has('player') ? ['enemy'] : ['player'];

        if (source.hasComponent('ElementalComponent')) {
             hitbox.addComponent(new ElementalComponent());
             const hitElem = hitbox.getComponent('ElementalComponent');
             if (weapon.type === 'aura') hitElem.tags.add('oil');
        }
    }

    fireProjectile(source, target, weapon) {
        const sourceTransform = source.getComponent('TransformComponent');
        const targetTransform = target.getComponent('TransformComponent');

        if (source.tags.has('player') && this.audioSystem) {
            this.audioSystem.playShoot();
        }

        // Création du projectile via l'EntityManager (qui utilise le Pool)
        const projectile = this.entityManager.createEntity();
        projectile.tags.add('projectile');

        // Position initiale (centre du tireur)
        projectile.addComponent(new TransformComponent());
        const t = projectile.getComponent('TransformComponent');
        t.x = sourceTransform.x;
        t.y = sourceTransform.y;

        // Calcul de la direction
        const dx = targetTransform.x - sourceTransform.x;
        const dy = targetTransform.y - sourceTransform.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Vélocité
        projectile.addComponent(new VelocityComponent());
        const v = projectile.getComponent('VelocityComponent');
        v.vx = (dx / dist) * weapon.projectileSpeed;
        v.vy = (dy / dist) * weapon.projectileSpeed;

        // Rendu
        projectile.addComponent(new RenderComponent());
        const r = projectile.getComponent('RenderComponent');
        r.color = weapon.color;
        r.shape = 'circle';
        r.width = 8;
        r.height = 8;
        r.layer = 20; // Au-dessus des unités

        // Données Projectile
        projectile.addComponent(new ProjectileComponent());
        const p = projectile.getComponent('ProjectileComponent');
        p.damage = weapon.damage;
        p.sourceId = source.id;
        p.lifetime = weapon.range / weapon.projectileSpeed; // Durée de vie basée sur la portée

        // Elemental Transfer (Source -> Projectile)
        if (source.hasComponent('ElementalComponent')) {
            projectile.addComponent(new ElementalComponent());
            const sourceElem = source.getComponent('ElementalComponent');
            const projElem = projectile.getComponent('ElementalComponent');
            // Clone tags
            for (const tag of sourceElem.tags) projElem.tags.add(tag);
        }

        // Collider (Trigger)
        projectile.addComponent(new ColliderComponent());
        const c = projectile.getComponent('ColliderComponent');
        c.radius = 4;
        c.isTrigger = true;
        c.tags = source.tags.has('player') ? ['enemy'] : ['player'];
    }
}

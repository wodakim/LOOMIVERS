import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { WeaponComponent, ProjectileComponent, OrbitalComponent } from '../components/WeaponComponents.js';
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

        // 2. Gestion des Projectiles (Durée de vie et Comportements spéciaux)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ProjectileComponent')) {
                const projectile = entity.getComponent('ProjectileComponent');
                projectile.lifetime -= dt;

                // Orbital Logic
                if (projectile.isOrbital && entity.hasComponent('OrbitalComponent')) {
                    this.updateOrbital(entity, dt);
                }

                if (projectile.lifetime <= 0) {
                    // Mine Explosion on timeout? Or just disappear?
                    // Let's say mines explode on timeout too for safety
                    if (projectile.isMine && entity.hasComponent('TransformComponent')) {
                        // Trigger AOE (handled in DamageSystem usually, but here we can force it via simple collider check or just remove)
                        // Removing for now to keep it simple, mines trigger on collision.
                    }
                    this.entityManager.removeEntity(entity);
                }
            }
        }
    }

    updateOrbital(entity, dt) {
        const orbital = entity.getComponent('OrbitalComponent');
        const parent = this.entityManager.getEntities().find(e => e.id === orbital.parentId);

        if (parent && parent.active && parent.hasComponent('TransformComponent')) {
            const pt = parent.getComponent('TransformComponent');
            const t = entity.getComponent('TransformComponent');

            orbital.angle += orbital.speed * dt;
            t.x = pt.x + Math.cos(orbital.angle) * orbital.radius;
            t.y = pt.y + Math.sin(orbital.angle) * orbital.radius;
        } else {
            // Parent dead, destroy orbital
            this.entityManager.removeEntity(entity);
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
        } else if (weapon.type === 'mines') {
            this.handleMines(entity, weapon);
        } else if (weapon.type === 'orbital') {
            this.handleOrbital(entity, weapon);
        } else if (weapon.type === 'turret') {
            this.handleTurret(entity, weapon);
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
        this.spawnMeleeHitbox(entity, weapon, 50, 0);
        this.spawnMeleeHitbox(entity, weapon, -50, 0);
        weapon.cooldown = 1 / weapon.fireRate;

        if (entity.tags.has('player') && this.audioSystem) {
            this.audioSystem.playNoise(0.1, 0.3);
        }
    }

    handleAura(entity, weapon) {
        this.spawnAreaHitbox(entity, weapon);
        weapon.cooldown = 1 / weapon.fireRate;
    }

    handleMines(entity, weapon) {
        // Drop mine at current position
        const t = entity.getComponent('TransformComponent');
        this.spawnMine(entity, t.x, t.y, weapon);
        weapon.cooldown = 1 / weapon.fireRate;
    }

    handleOrbital(entity, weapon) {
        // Spawn orbs if not enough count
        // Basic check: count tracked in weapon component?
        // Let's check active orbitals
        // For simplicity: If cooldown is 0 (initial), spawn all.
        // Or if we want to respawn them.

        // This logic is tricky in stateless system.
        // We'll verify if we have spawned them by checking weapon.orbitals array of IDs.
        // Filter dead ones.

        weapon.orbitals = weapon.orbitals.filter(id => {
            const e = this.entityManager.getEntities().find(ent => ent.id === id);
            return e && e.active;
        });

        if (weapon.orbitals.length < weapon.orbitalCount) {
            // Spawn missing orb
            const id = this.spawnOrbital(entity, weapon, weapon.orbitals.length * (Math.PI * 2 / weapon.orbitalCount));
            weapon.orbitals.push(id);
        }

        // Cooldown just checks periodically
        weapon.cooldown = 1.0;
    }

    handleTurret(entity, weapon) {
        const t = entity.getComponent('TransformComponent');
        this.spawnTurret(entity, t.x, t.y, weapon);
        weapon.cooldown = 1 / weapon.fireRate; // Very long cooldown (e.g. 5s)
    }

    spawnMine(source, x, y, weapon) {
        const mine = this.entityManager.createEntity();
        mine.tags.add('projectile');

        mine.addComponent(new TransformComponent());
        const t = mine.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        mine.addComponent(new RenderComponent());
        const r = mine.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = 16;
        r.height = 16;
        r.color = weapon.color;
        r.layer = 2; // Floor

        mine.addComponent(new ProjectileComponent());
        const p = mine.getComponent('ProjectileComponent');
        p.damage = weapon.damage;
        p.sourceId = source.id;
        p.lifetime = weapon.duration;
        p.isMine = true;

        mine.addComponent(new ColliderComponent());
        const c = mine.getComponent('ColliderComponent');
        c.radius = 16;
        c.isTrigger = true;
        c.tags = source.tags.has('player') ? ['enemy'] : ['player'];

        // Add Fire element
        if (weapon.tags) {
            mine.addComponent(new ElementalComponent());
            for (const tag of weapon.tags) mine.getComponent('ElementalComponent').tags.add(tag);
        }
    }

    spawnOrbital(source, weapon, initialAngle) {
        const orb = this.entityManager.createEntity();
        orb.tags.add('projectile');

        orb.addComponent(new TransformComponent()); // Position updated by system

        orb.addComponent(new RenderComponent());
        const r = orb.getComponent('RenderComponent');
        r.shape = 'circle';
        r.width = 12;
        r.height = 12;
        r.color = weapon.color;
        r.layer = 20;

        orb.addComponent(new ProjectileComponent());
        const p = orb.getComponent('ProjectileComponent');
        p.damage = weapon.damage;
        p.sourceId = source.id;
        p.lifetime = 9999; // Persistent until parent dies
        p.isOrbital = true;

        orb.addComponent(new OrbitalComponent());
        const o = orb.getComponent('OrbitalComponent');
        o.parentId = source.id;
        o.radius = weapon.range;
        o.speed = weapon.speed;
        o.angle = initialAngle;

        orb.addComponent(new ColliderComponent());
        const c = orb.getComponent('ColliderComponent');
        c.radius = 12;
        c.isTrigger = true;
        c.tags = source.tags.has('player') ? ['enemy'] : ['player'];

        if (weapon.tags) {
            orb.addComponent(new ElementalComponent());
            for (const tag of weapon.tags) orb.getComponent('ElementalComponent').tags.add(tag);
        }

        return orb.id;
    }

    spawnTurret(source, x, y, weapon) {
        const turret = this.entityManager.createEntity();
        turret.tags.add('ally'); // Turret is an entity that shoots

        turret.addComponent(new TransformComponent());
        const t = turret.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        turret.addComponent(new RenderComponent());
        const r = turret.getComponent('RenderComponent');
        r.shape = 'rect';
        r.width = 24;
        r.height = 24;
        r.color = weapon.color;

        // Turret has its own weapon!
        turret.addComponent(new WeaponComponent());
        const w = turret.getComponent('WeaponComponent');
        w.type = 'pistol'; // Basic shots
        w.damage = weapon.damage;
        w.range = weapon.range;
        w.fireRate = 2.0; // Fast fire
        w.projectileSpeed = weapon.projectileSpeed;
        w.color = '#ffff00';

        // Lifetime managed via Health or specific component?
        // Let's use ProjectileComponent for lifetime easy hack, even if it's not a projectile moving
        turret.addComponent(new ProjectileComponent());
        turret.getComponent('ProjectileComponent').lifetime = weapon.duration;
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

import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { WeaponComponent, ProjectileComponent } from '../components/WeaponComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';

export class CombatSystem extends System {
    constructor(entityManager) {
        super(entityManager);
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
        const transform = entity.getComponent('TransformComponent');

        // Gestion du cooldown
        if (weapon.cooldown > 0) {
            weapon.cooldown -= dt;
            return;
        }

        // Recherche de la cible la plus proche
        let target = null;
        let minDistSq = weapon.range * weapon.range;

        // Optimisation : Utiliser le SpatialHash du PhysicsSystem ici serait idéal
        // Pour l'instant, scan linéaire simple (O(N)) sur les entités 'enemy'
        // Si l'entité est le joueur, elle vise les ennemis.
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

        // Tirer si une cible est trouvée
        if (target) {
            this.fireProjectile(entity, target, weapon);
            weapon.cooldown = 1 / weapon.fireRate;
        }
    }

    fireProjectile(source, target, weapon) {
        const sourceTransform = source.getComponent('TransformComponent');
        const targetTransform = target.getComponent('TransformComponent');

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

import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, ColliderComponent, RenderComponent } from '../components/Components.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { ProjectileComponent } from '../components/WeaponComponents.js';
import { HealthComponent } from '../components/StatsComponents.js';

export class AlchemySystem extends System {
    constructor(entityManager, terraformationSystem, particleSystem) {
        super(entityManager);
        this.terraformationSystem = terraformationSystem; // Pour lire les zones
        this.particleSystem = particleSystem;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        // 1. Interactions Projectiles <-> Zones (Background)
        // Simplifié : on ne checke pas tous les pixels, mais on suppose que TerraformationSystem garde une liste de zones actives
        // Pour la POC : On va juste ajouter une logique simple "Si projectile FEU touche Ennemi HUILEUX -> Explosion"
        // Ou "Projectile FEU passe sur Zone HUILE -> Explosion"

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ElementalComponent') && entity.hasComponent('TransformComponent')) {
                this.checkElementalReaction(entity);
            }
        }
    }

    checkElementalReaction(entity) {
        const elements = entity.getComponent('ElementalComponent').tags;
        const transform = entity.getComponent('TransformComponent');

        // Réaction : FEU + HUILE (Zone)
        if (elements.has('fire')) {
            // Check si on est sur une zone d'huile
            // Note: TerraformationSystem devrait exposer une méthode performante isZone(x, y, type)
            // Ici on va tricher et vérifier si on est proche de la zone de démo (600, 400) qui est 'fire' (rouge/orange)
            // Disons qu'on ajoute une zone 'oil' pour le test.
        }

        // Réaction : FEU (Projectile) + HUILE (Ennemi)
        // Géré lors de la collision ? Mieux ici pour séparer la logique.
        // Mais AlchemySystem n'a pas accès aux collisions facilement sans refaire le SpatialHash check.
        // Option : DamageSystem ajoute un flag 'HitEvent' sur l'entité touchée ?
    }

    // Appelée par DamageSystem quand un projectile touche une cible
    onProjectileHit(projectile, target) {
        if (!projectile.hasComponent('ElementalComponent') || !target.hasComponent('ElementalComponent')) return;

        const pTags = projectile.getComponent('ElementalComponent').tags;
        const tTags = target.getComponent('ElementalComponent').tags;

        // COMBO: FEU + HUILE -> EXPLOSION
        if ((pTags.has('fire') && tTags.has('oil')) || (pTags.has('oil') && tTags.has('fire'))) {
            this.triggerExplosion(target.getComponent('TransformComponent'));
        }
    }

    triggerExplosion(transform) {
        console.log("ALCHEMY: EXPLOSION!");

        // 1. Visuel
        this.particleSystem.emit(transform.x, transform.y, 20, '#ffaa00', 200);

        // 2. Dégâts de zone (AOE)
        const entities = this.entityManager.getEntities();
        const radius = 100;
        const damage = 50;

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('HealthComponent') && entity.hasComponent('TransformComponent')) {
                // Friendly fire activé pour l'explosion
                const t = entity.getComponent('TransformComponent');
                const dx = t.x - transform.x;
                const dy = t.y - transform.y;
                if (dx*dx + dy*dy < radius*radius) {
                     const health = entity.getComponent('HealthComponent');
                     health.current -= damage;
                     // On pourrait appeler DamageSystem.spawnFloatingText ici si on avait accès
                }
            }
        }
    }
}

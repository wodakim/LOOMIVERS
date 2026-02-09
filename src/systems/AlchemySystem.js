import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, ColliderComponent, RenderComponent } from '../components/Components.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { ProjectileComponent } from '../components/WeaponComponents.js';
import { HealthComponent } from '../components/StatsComponents.js';

export class AlchemySystem extends System {
    constructor(entityManager, terraformationSystem, particleSystem, audioSystem) {
        super(entityManager);
        this.terraformationSystem = terraformationSystem; // Pour lire les zones
        this.particleSystem = particleSystem;
        this.audioSystem = audioSystem;
    }

    update(dt) {
        // Logic moved to onProjectileHit and checkTerrainInteraction
        // To be optimized: Check if entities with elements are in zones.
    }

    // Appelée par DamageSystem quand un projectile touche une cible
    onProjectileHit(projectile, target) {
        if (!projectile.hasComponent('ElementalComponent')) return; // Target might not have one

        const pTags = projectile.getComponent('ElementalComponent').tags;

        // Target Tags (Entity or implicitly from zone?)
        let tTags = new Set();
        if (target.hasComponent('ElementalComponent')) {
             tTags = target.getComponent('ElementalComponent').tags;
        }

        const transform = target.getComponent('TransformComponent');

        // COMBO 1: FEU + HUILE -> EXPLOSION
        if ((pTags.has('fire') && tTags.has('oil')) || (pTags.has('oil') && tTags.has('fire'))) {
            this.triggerExplosion(transform);
        }

        // COMBO 2: ELECTRIQUE + EAU (Sur cible mouillée) -> STUN
        if ((pTags.has('electric') && tTags.has('water'))) {
            this.triggerElectricShock(transform);
        }

        // Interaction avec le terrain (Zones)
        // Check si la cible est dans une zone spéciale
        if (this.terraformationSystem) {
            for (const zone of this.terraformationSystem.zones) {
                const dx = transform.x - zone.x;
                const dy = transform.y - zone.y;
                if (dx*dx + dy*dy < zone.radius * zone.radius) {

                    // ELECTRIQUE + ZONE EAU -> ZONE ELECTRIFIEE
                    if (pTags.has('electric') && zone.type === 'water') {
                        console.log("ALCHEMY: ELECTRIFIED WATER!");
                        zone.type = 'electrified_water'; // Change zone type
                        // Visual update needed?
                        // TerraformationSystem redraw logic is complex, for POC just changing type enables effect
                        if (this.audioSystem) this.audioSystem.playTone(800, 'square', 0.2, 0.5);
                    }

                    // FEU + ZONE HUILE -> ZONE FEU (Explosion en chaîne ?)
                    if (pTags.has('fire') && zone.type === 'oil') {
                        console.log("ALCHEMY: OIL IGNITED!");
                        zone.type = 'fire';
                        this.triggerExplosion({x: zone.x, y: zone.y});
                    }
                }
            }
        }
    }

    triggerExplosion(transform) {
        console.log("ALCHEMY: EXPLOSION!");

        if (this.audioSystem) {
            this.audioSystem.playExplosion();
        }

        // 1. Visuel
        this.particleSystem.emit(transform.x, transform.y, 20, '#ffaa00', 200);

        // 2. Dégâts de zone (AOE)
        const entities = this.entityManager.getEntities();
        const radius = 100;
        const damage = 50;

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('HealthComponent') && entity.hasComponent('TransformComponent')) {
                const t = entity.getComponent('TransformComponent');
                const dx = t.x - transform.x;
                const dy = t.y - transform.y;
                if (dx*dx + dy*dy < radius*radius) {
                     const health = entity.getComponent('HealthComponent');
                     health.current -= damage;
                }
            }
        }
    }

    triggerElectricShock(transform) {
        // Shockwave visual
        this.particleSystem.emit(transform.x, transform.y, 10, '#00ffff', 150);
        if (this.audioSystem) this.audioSystem.playTone(600, 'sawtooth', 0.1, 0.5);

        // Stun logic?
        // Need 'StunComponent' or modify AI state?
        // For POC: Just massive damage to shields/health?
        // Or stop velocity
    }
}

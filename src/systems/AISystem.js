import { System } from '../ecs/System.js';
import { TransformComponent, AIComponent, VelocityComponent } from '../components/Components.js';

export class AISystem extends System {
    constructor(entityManager) {
        super(entityManager);
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
                const transform = entity.getComponent('TransformComponent');
                const velocity = entity.getComponent('VelocityComponent');

                // Logique de poursuite simple (Chase)
                const dx = targetTransform.x - transform.x;
                const dy = targetTransform.y - transform.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < ai.detectionRadius * ai.detectionRadius) {
                    // Normalisation du vecteur direction
                    const dist = Math.sqrt(distSq);
                    if (dist > 0) {
                        const dirX = dx / dist;
                        const dirY = dy / dist;

                        // Applique la vitesse vers la cible
                        velocity.vx = dirX * velocity.speed * 0.5; // Les ennemis sont plus lents
                        velocity.vy = dirY * velocity.speed * 0.5;
                    }
                } else {
                    // Arrêt si hors de portée
                    velocity.vx = 0;
                    velocity.vy = 0;
                }
            }
        }
    }
}

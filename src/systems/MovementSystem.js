import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent } from '../components/Components.js';

export class MovementSystem extends System {
    constructor(entityManager, width, height) {
        super(entityManager);
        this.worldWidth = width;
        this.worldHeight = height;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.hasComponent('TransformComponent') && entity.hasComponent('VelocityComponent')) {
                const transform = entity.getComponent('TransformComponent');
                const velocity = entity.getComponent('VelocityComponent');

                // Intégration de la position : p' = p + v * dt
                transform.x += velocity.vx * dt; // dt est déjà en secondes grâce à GameLoop
                transform.y += velocity.vy * dt;

                // Vérification des limites du monde (Boundary Check) simple
                // Pourrait être déplacé dans CollisionSystem mais utile ici pour le prototypage
                if (transform.x < 0) transform.x = 0;
                if (transform.y < 0) transform.y = 0;
                if (transform.x > this.worldWidth) transform.x = this.worldWidth;
                if (transform.y > this.worldHeight) transform.y = this.worldHeight;
            }
        }
    }
}

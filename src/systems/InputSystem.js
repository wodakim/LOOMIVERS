import { System } from '../ecs/System.js';
import { InputComponent, VelocityComponent } from '../components/Components.js';

export class InputSystem extends System {
    constructor(entityManager, inputHandler) {
        super(entityManager);
        this.inputHandler = inputHandler;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        const moveVector = this.inputHandler.getMovementVector();

        for (const entity of entities) {
            if (entity.hasComponent('InputComponent') && entity.hasComponent('VelocityComponent')) {
                const velocity = entity.getComponent('VelocityComponent');

                // Application directe du vecteur d'input à la vélocité cible
                // Dans un système plus complexe, on appliquerait une force/accélération
                velocity.vx = moveVector.x * velocity.speed;
                velocity.vy = moveVector.y * velocity.speed;
            }
        }
    }
}

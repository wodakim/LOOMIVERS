import { System } from '../ecs/System.js';
import { InputComponent, VelocityComponent, DashComponent } from '../components/Components.js';

export class InputSystem extends System {
    constructor(entityManager, inputHandler) {
        super(entityManager);
        this.inputHandler = inputHandler;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        const moveVector = this.inputHandler.getMovementVector();
        const isDashPressed = this.inputHandler.isDashPressed();

        for (const entity of entities) {
            if (entity.hasComponent('InputComponent') && entity.hasComponent('VelocityComponent')) {
                const velocity = entity.getComponent('VelocityComponent');

                // Dash Trigger Logic
                if (isDashPressed && entity.hasComponent('DashComponent')) {
                    const dash = entity.getComponent('DashComponent');
                    // Can dash if not already dashing and cooldown is 0 AND moving
                    if (!dash.isDashing && dash.cooldownTimer <= 0 && (moveVector.x !== 0 || moveVector.y !== 0)) {
                        dash.isDashing = true;
                        dash.dashTimer = dash.duration;
                        dash.dashVector = { ...moveVector }; // Snapshot direction
                    }
                }

                // Standard Movement (Ignored by MovementSystem if dashing)
                velocity.vx = moveVector.x * velocity.speed;
                velocity.vy = moveVector.y * velocity.speed;
            }
        }
    }
}

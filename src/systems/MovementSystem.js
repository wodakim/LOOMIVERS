import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, DashComponent } from '../components/Components.js';

export class MovementSystem extends System {
    constructor(entityManager, width, height) {
        super(entityManager);
        this.worldWidth = width;
        this.worldHeight = height;
    }

    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.hasComponent('TransformComponent') && entity.hasComponent('VelocityComponent')) {
                const transform = entity.getComponent('TransformComponent');
                const velocity = entity.getComponent('VelocityComponent');

                let vx = velocity.vx;
                let vy = velocity.vy;

                // Gestion du Dash
                if (entity.hasComponent('DashComponent')) {
                    const dash = entity.getComponent('DashComponent');

                    // Mise à jour des timers
                    if (dash.cooldownTimer > 0) dash.cooldownTimer -= dt;

                    if (dash.isDashing) {
                        dash.dashTimer -= dt;

                        // Override velocity during dash
                        // On utilise dashVector qui a été set par InputSystem
                        vx = dash.dashVector.x * velocity.speed * dash.speedMultiplier;
                        vy = dash.dashVector.y * velocity.speed * dash.speedMultiplier;

                        // Force update velocity component for visual/other systems
                        velocity.vx = vx;
                        velocity.vy = vy;

                        if (dash.dashTimer <= 0) {
                            dash.isDashing = false;
                            dash.cooldownTimer = dash.cooldown;
                        }
                    }
                }

                // Intégration de la position : p' = p + v * dt
                transform.x += vx * dt;
                transform.y += vy * dt;

                // Boundary Check
                if (transform.x < 0) transform.x = 0;
                if (transform.y < 0) transform.y = 0;
                if (transform.x > this.worldWidth) transform.x = this.worldWidth;
                if (transform.y > this.worldHeight) transform.y = this.worldHeight;
            }
        }
    }
}

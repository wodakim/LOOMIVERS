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

                // Inferno Trail Synergy
                if (entity.mods && entity.mods.has('inferno_trail')) {
                    // Spawn fire zone occasionally
                    if (Math.random() < 0.1) {
                        // We need access to TerraformationSystem.
                        // Can't easily access from here without refactoring.
                        // Skip for now, or use global window.game (hack)
                        if (window.game && window.game.terraformationSystem) {
                            window.game.terraformationSystem.addZone(transform.x, transform.y, 20, 'fire');
                        }
                    }
                }

                // Friction / Drag (For Knockback Decay)
                // If velocity is higher than base speed, decay it
                // Simple linear drag for everything to stabilize knockback
                const drag = 5.0 * dt; // 500% per second decay
                velocity.vx -= velocity.vx * drag;
                velocity.vy -= velocity.vy * drag;

                // Stop if very small
                if (Math.abs(velocity.vx) < 0.1) velocity.vx = 0;
                if (Math.abs(velocity.vy) < 0.1) velocity.vy = 0;

                // Boundary Check
                if (transform.x < 0) transform.x = 0;
                if (transform.y < 0) transform.y = 0;
                if (transform.x > this.worldWidth) transform.x = this.worldWidth;
                if (transform.y > this.worldHeight) transform.y = this.worldHeight;
            }
        }
    }
}

import { System } from '../ecs/System.js';

export class AnimationSystem extends System {
    constructor(entityManager) {
        super(entityManager);
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (!entity.active) continue;

            if (entity.hasComponent('SpriteComponent')) {
                const sprite = entity.getComponent('SpriteComponent');
                const velocity = entity.getComponent('VelocityComponent');

                // 1. Update Animation Frame
                this.updateAnimation(sprite, dt);

                // 2. Flip Logic based on Velocity
                if (velocity && Math.abs(velocity.vx) > 0.1) {
                    sprite.flipX = velocity.vx < 0;
                }
            }
        }
    }

    updateAnimation(sprite, dt) {
        if (!sprite.isPlaying) return;

        const frames = sprite.animations[sprite.currentAnimation];
        if (!frames || frames.length === 0) return;

        // If only 1 frame, ensure index is valid
        if (frames.length === 1) {
            sprite.currentFrameIndex = 0;
            return;
        }

        sprite.frameTimer += dt;
        if (sprite.frameTimer >= sprite.frameDuration) {
            sprite.frameTimer -= sprite.frameDuration; // Keep remainder for smooth timing
            sprite.currentFrameIndex++;

            if (sprite.currentFrameIndex >= frames.length) {
                if (sprite.loop) {
                    sprite.currentFrameIndex = 0;
                } else {
                    sprite.currentFrameIndex = frames.length - 1;
                    sprite.isPlaying = false; // Stop at end
                }
            }
        }
    }
}

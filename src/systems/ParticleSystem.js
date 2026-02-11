import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent } from '../components/Components.js';
import { ParticleComponent } from '../components/ParticleComponent.js';

export class ParticleSystem extends System {
    constructor(entityManager) {
        super(entityManager);
        this.terraformationSystem = null; // Injected
    }

    setTerraformationSystem(ts) {
        this.terraformationSystem = ts;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ParticleComponent')) {
                const particle = entity.getComponent('ParticleComponent');
                particle.lifetime -= dt;

                if (particle.lifetime <= 0) {
                    // Blood Stain Logic
                    if (particle.isBlood && this.terraformationSystem) {
                        const t = entity.getComponent('TransformComponent');
                        const r = entity.getComponent('RenderComponent');
                        this.terraformationSystem.addStain(t.x, t.y, r.width, r.color);
                    }
                    this.entityManager.removeEntity(entity);
                }
            }
        }
    }

    emit(x, y, count, color = '#fff', speed = 100, isBlood = false) {
        for (let i = 0; i < count; i++) {
            const p = this.entityManager.createEntity();

            p.addComponent(new TransformComponent());
            const t = p.getComponent('TransformComponent');
            t.x = x;
            t.y = y;

            p.addComponent(new VelocityComponent());
            const v = p.getComponent('VelocityComponent');
            const angle = Math.random() * Math.PI * 2;
            const s = Math.random() * speed;
            v.vx = Math.cos(angle) * s;
            v.vy = Math.sin(angle) * s;
            // Higher drag for blood to stop near body
            // Since MovementSystem applies drag = 5.0 * dt, we don't need v.drag unless we implement per-entity drag
            // Let's assume global drag handles it, or set high speed and let it decay

            p.addComponent(new ParticleComponent());
            const pc = p.getComponent('ParticleComponent');
            pc.color = color;
            pc.lifetime = 0.3 + Math.random() * 0.4;
            pc.maxLifetime = pc.lifetime;
            pc.size = isBlood ? 4 + Math.random() * 6 : 2 + Math.random() * 3;
            pc.isBlood = isBlood;

            p.addComponent(new RenderComponent());
            const r = p.getComponent('RenderComponent');
            r.color = color;
            r.shape = isBlood ? 'circle' : 'rect';
            r.width = pc.size;
            r.height = pc.size;
            r.layer = isBlood ? 15 : 20; // Blood slightly lower than entities
        }
    }
}

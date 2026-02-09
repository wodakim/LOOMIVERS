import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent } from '../components/Components.js';
import { ParticleComponent } from '../components/ParticleComponent.js';

export class ParticleSystem extends System {
    constructor(entityManager) {
        super(entityManager);
    }

    update(dt) {
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ParticleComponent')) {
                const particle = entity.getComponent('ParticleComponent');
                particle.lifetime -= dt;

                if (particle.lifetime <= 0) {
                    this.entityManager.removeEntity(entity);
                } else {
                    // Update scale or opacity if needed logic is here
                    // RenderSystem will handle the drawing based on lifetime
                }
            }
        }
    }

    emit(x, y, count, color = '#fff', speed = 100) {
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
            v.drag = 0.5; // Ralentissement rapide

            p.addComponent(new ParticleComponent());
            const pc = p.getComponent('ParticleComponent');
            pc.color = color;
            pc.lifetime = 0.5 + Math.random() * 0.5;
            pc.maxLifetime = pc.lifetime;
            pc.size = 2 + Math.random() * 3;

            // On n'ajoute pas de RenderComponent standard, car le rendu des particules est souvent spécifique.
            // MAIS pour simplifier et rester dans l'ECS générique :
            p.addComponent(new RenderComponent());
            const r = p.getComponent('RenderComponent');
            r.color = color;
            r.shape = 'rect';
            r.width = pc.size;
            r.height = pc.size;
            r.layer = 20;
        }
    }
}

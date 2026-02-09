import { System } from '../ecs/System.js';
import { TransformComponent, AIComponent, VelocityComponent, ColliderComponent } from '../components/Components.js';
import { BossComponent } from '../components/BossComponent.js';

export class AISystem extends System {
    constructor(entityManager, physicsSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem; // Pour le flocking/separation via la grille
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

                // Boss Logic Override
                if (entity.hasComponent('BossComponent')) {
                    this.handleBoss(entity, targetTransform, dt);
                    continue; // Skip basic AI
                }

                // 1. Vecteur vers la Cible (Chase)
                // TOUJOURS poursuivre, pas de check de radius pour l'arrêt
                const dx = targetTransform.x - transform.x;
                const dy = targetTransform.y - transform.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                let dirX = 0;
                let dirY = 0;

                if (dist > 0) {
                    dirX = dx / dist;
                    dirY = dy / dist;
                }

                // 2. Séparation (Flocking) - Éviter de s'empiler
                // On utilise la grille spatiale pour trouver les voisins proches
                const separationForce = { x: 0, y: 0 };
                if (this.physicsSystem) {
                    const neighbors = this.getNeighbors(entity, transform);
                    let separationCount = 0;

                    for (const neighbor of neighbors) {
                        if (neighbor === entity) continue;
                        if (!neighbor.hasComponent('TransformComponent')) continue;

                        const nt = neighbor.getComponent('TransformComponent');
                        const ndx = transform.x - nt.x;
                        const ndy = transform.y - nt.y;
                        const ndistSq = ndx*ndx + ndy*ndy;

                        // Rayon de séparation (ex: taille du sprite + marge)
                        const separationRadius = 30;

                        if (ndistSq > 0 && ndistSq < separationRadius * separationRadius) {
                            const ndist = Math.sqrt(ndistSq);
                            // Plus on est proche, plus on repousse fort
                            const strength = (separationRadius - ndist) / separationRadius;
                            separationForce.x += (ndx / ndist) * strength;
                            separationForce.y += (ndy / ndist) * strength;
                            separationCount++;
                        }
                    }

                    if (separationCount > 0) {
                        separationForce.x /= separationCount;
                        separationForce.y /= separationCount;
                    }
                }

                // 3. Synthèse des forces
                // Poids : Chase (0.8) + Separation (1.5 - pour être sûr qu'ils ne stackent pas)
                // On veut une séparation forte.

                const chaseWeight = 1.0;
                const separationWeight = 2.0;

                let finalDx = (dirX * chaseWeight) + (separationForce.x * separationWeight);
                let finalDy = (dirY * chaseWeight) + (separationForce.y * separationWeight);

                // Normalisation finale pour vitesse constante
                const finalDist = Math.sqrt(finalDx*finalDx + finalDy*finalDy);
                if (finalDist > 0) {
                    finalDx /= finalDist;
                    finalDy /= finalDist;
                }

                // Application de la vitesse
                // Les ennemis ont une vitesse de base définie dans WaveManager
                // On utilise 80% de cette vitesse pour laisser une marge de manœuvre au joueur (300px/s)
                const speedFactor = 0.8;
                velocity.vx = finalDx * velocity.speed * speedFactor;
                velocity.vy = finalDy * velocity.speed * speedFactor;
            }
        }
    }

    getNeighbors(entity, transform) {
        // Utilisation de la grille du PhysicsSystem
        if (!this.physicsSystem || !this.physicsSystem.grid) return [];

        const cellSize = this.physicsSystem.cellSize;
        const col = Math.floor(transform.x / cellSize);
        const row = Math.floor(transform.y / cellSize);

        // On check la cellule courante et les voisines (9 cellules) pour être précis
        // Ou juste la courante pour l'opti extrême (risque d'artefact aux bords de cellule)
        // Checkons les voisines
        const neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${col + i},${row + j}`;
                const cell = this.physicsSystem.grid.get(key);
                if (cell) {
                    for (const e of cell) {
                        // On ne repousse que les autres ennemis (pas le joueur, ni les balles)
                        if (e.tags.has('enemy')) {
                             neighbors.push(e);
                        }
                    }
                }
            }
        }
        return neighbors;
    }

    handleBoss(entity, targetTransform, dt) {
        const transform = entity.getComponent('TransformComponent');
        const velocity = entity.getComponent('VelocityComponent');

        // Boss Chase : Toujours vers le joueur, lent mais implacable.
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            // Le boss est déjà configuré lent (40px/s), on garde sa vitesse max
            velocity.vx = (dx / dist) * velocity.speed;
            velocity.vy = (dy / dist) * velocity.speed;
        }
    }
}

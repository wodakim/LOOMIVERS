import { System } from '../ecs/System.js';
import { TransformComponent, ColliderComponent } from '../components/Components.js';

export class PhysicsSystem extends System {
    constructor(entityManager, width, height, cellSize = 100) {
        super(entityManager);
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Map(); // Spatial Hash Grid : "col,row" -> [Entity]

        // Map Grid (Static Walls)
        this.mapGrid = null;
        this.mapTileSize = 0;
        this.mapRows = 0;
        this.mapCols = 0;
    }

    setMap(mapGrid, tileSize) {
        this.mapGrid = mapGrid;
        this.mapTileSize = tileSize;
        this.mapRows = mapGrid.length;
        this.mapCols = mapGrid[0].length;
    }

    update(dt) {
        // 1. Rebuild Grid
        this.grid.clear();
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.hasComponent('ColliderComponent') && entity.hasComponent('TransformComponent')) {
                const transform = entity.getComponent('TransformComponent');

                // Calcul de la cellule
                const col = Math.floor(transform.x / this.cellSize);
                const row = Math.floor(transform.y / this.cellSize);
                const key = `${col},${row}`;

                if (!this.grid.has(key)) {
                    this.grid.set(key, []);
                }
                this.grid.get(key).push(entity);
            }
        }

        // 2. Check Entity vs Map Collisions
        if (this.mapGrid) {
            const entities = this.entityManager.getEntities();
            for (const entity of entities) {
                if (entity.hasComponent('ColliderComponent') && entity.hasComponent('TransformComponent')) {
                    this.resolveMapCollision(entity);
                }
            }
        }

        // 3. Check Entity vs Entity Collisions
        for (const [key, cellEntities] of this.grid) {
            if (cellEntities.length < 2) continue;

            for (let i = 0; i < cellEntities.length; i++) {
                for (let j = i + 1; j < cellEntities.length; j++) {
                    const e1 = cellEntities[i];
                    const e2 = cellEntities[j];

                    this.resolveCollision(e1, e2);
                }
            }
        }
    }

    resolveMapCollision(entity) {
        const transform = entity.getComponent('TransformComponent');
        const collider = entity.getComponent('ColliderComponent');

        // Ghost enemies ignore walls? Maybe. For now, assume ghosts fly through walls?
        if (collider.tags.includes('ghost')) return;

        const minCol = Math.floor((transform.x - collider.radius) / this.mapTileSize);
        const maxCol = Math.floor((transform.x + collider.radius) / this.mapTileSize);
        const minRow = Math.floor((transform.y - collider.radius) / this.mapTileSize);
        const maxRow = Math.floor((transform.y + collider.radius) / this.mapTileSize);

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (r < 0 || c < 0 || r >= this.mapRows || c >= this.mapCols) continue;

                if (this.mapGrid[r][c] === 1) {
                    this.resolveCircleRect(transform, collider.radius, c * this.mapTileSize, r * this.mapTileSize, this.mapTileSize, this.mapTileSize);
                }
            }
        }
    }

    resolveCircleRect(circle, radius, rx, ry, rw, rh) {
        // Find closest point on rect to circle center
        const closestX = Math.max(rx, Math.min(circle.x, rx + rw));
        const closestY = Math.max(ry, Math.min(circle.y, ry + rh));

        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            circle.x += nx * overlap;
            circle.y += ny * overlap;
        } else if (distSq === 0) {
            // Inside the wall: Push out shortest path
            const dL = circle.x - rx;
            const dR = (rx + rw) - circle.x;
            const dT = circle.y - ry;
            const dB = (ry + rh) - circle.y;

            const min = Math.min(dL, dR, dT, dB);
            if (min === dL) circle.x -= (dL + radius);
            else if (min === dR) circle.x += (dR + radius);
            else if (min === dT) circle.y -= (dT + radius);
            else circle.y += (dB + radius);
        }
    }

    resolveCollision(e1, e2) {
        const t1 = e1.getComponent('TransformComponent');
        const t2 = e2.getComponent('TransformComponent');
        const c1 = e1.getComponent('ColliderComponent');
        const c2 = e2.getComponent('ColliderComponent');

        // Check for Ghost logic (No collision with other enemies)
        // If BOTH are enemies AND ONE has 'ghost' tag -> Skip
        if (e1.tags.has('enemy') && e2.tags.has('enemy')) {
            if (c1.tags.includes('ghost') || c2.tags.includes('ghost')) {
                return;
            }
        }

        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;
        const distSq = dx * dx + dy * dy;
        const minDist = c1.radius + c2.radius;

        if (distSq < minDist * minDist) {
            // Collision détectée (Cercle simple)
            const dist = Math.sqrt(distSq);
            if (dist === 0) return; // Évite division par zéro si positions identiques

            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Repousse les entités (Soft separation)
            // On suppose masse égale pour l'instant
            t1.x += nx * overlap * 0.5;
            t1.y += ny * overlap * 0.5;
            t2.x -= nx * overlap * 0.5;
            t2.y -= ny * overlap * 0.5;
        }
    }

    /**
     * Dessine la grille de débogage.
     * @param {CanvasRenderingContext2D} ctx
     */
    drawDebug(ctx) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;

        // Dessin des lignes verticales
        for (let c = 0; c <= this.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * this.cellSize, 0);
            ctx.lineTo(c * this.cellSize, this.rows * this.cellSize);
            ctx.stroke();
        }

        // Dessin des lignes horizontales
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * this.cellSize);
            ctx.lineTo(this.cols * this.cellSize, r * this.cellSize);
            ctx.stroke();
        }

        // Surbrillance des cellules actives
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        for (const key of this.grid.keys()) {
            const [c, r] = key.split(',').map(Number);
            ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        }
    }
}

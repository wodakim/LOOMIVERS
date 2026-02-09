import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent } from '../components/Components.js';

export class TerraformationSystem extends System {
    constructor(entityManager, width, height) {
        super(entityManager);
        this.width = width;
        this.height = height;

        // Création du canvas d'arrière-plan (Offscreen pour la logique, Onscreen pour le visuel si on veut)
        // Ici on va dessiner sur un canvas séparé superposé en CSS
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'terrain-canvas';
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;

        // Insertion dans le DOM avant le canvas de jeu
        const gameContainer = document.getElementById('game-container');
        const gameCanvas = document.getElementById('game-canvas');
        gameContainer.insertBefore(this.bgCanvas, gameCanvas);

        this.ctx = this.bgCanvas.getContext('2d', { willReadFrequently: true });

        // Initialisation : fond noir
        this.ctx.fillStyle = '#000000'; // Noir, mais transparent en CSS si on veut voir le body bg
        // En fait le jeu a un fond #111 effacé à chaque frame dans RenderSystem.
        // Pour que le terrain soit visible, RenderSystem doit être transparent ou dessiner par dessus ?
        // Non, RenderSystem efface tout.
        // Solution : RenderSystem doit dessiner le contenu de bgCanvas en premier !

        // On va plutôt dire que RenderSystem s'occupe de dessiner le bgCanvas comme une image de fond.
        // Ce système ne fait que modifier le bgCanvas.
    }

    /**
     * Ajoute un cratère ou une zone d'effet.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {string} type - 'fire' | 'water' | 'crater'
     */
    addZone(x, y, radius, type) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (type === 'fire') {
            this.ctx.fillStyle = 'rgba(255, 50, 0, 0.5)';
            // Logique de gameplay : Les entités sur du rouge prennent des dégâts
        } else if (type === 'water') {
            this.ctx.fillStyle = 'rgba(0, 50, 255, 0.5)';
            // Logique de gameplay : Les entités sur du bleu sont ralenties
        } else if (type === 'crater') {
            this.ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        }

        this.ctx.fill();
        this.ctx.restore();
    }

    update(dt) {
        // Optimisation : Ne pas lire les pixels à chaque frame pour chaque entité (trop lent).
        // On peut utiliser une grille de données simple ou échantillonner.

        // Pour la POC : On vérifie juste quelques points sous le joueur/ennemis
        const entities = this.entityManager.getEntities();

        for (const entity of entities) {
            if (entity.active && entity.hasComponent('TransformComponent') && entity.hasComponent('VelocityComponent')) {
                const t = entity.getComponent('TransformComponent');
                const v = entity.getComponent('VelocityComponent');

                // Sampling simple (Centre de l'entité)
                // Attention : getImageData est LENT. Ne pas faire ça 60 fois x 3000 entités.
                // Solution pro : Garder une grille 2D en mémoire (Uint8Array) en parallèle du canvas.
                // Pour la POC : On va le faire uniquement pour le joueur pour tester l'effet visuel + logique

                if (entity.tags.has('player')) {
                     // Check rapide
                     // this.checkTerrainEffect(t, v);
                     // Désactivé par défaut pour perfs, activé si besoin de démo technique
                }
            }
        }
    }

    // Méthode de secours pour dessiner sur le canvas principal
    renderTerrain(mainCtx) {
        mainCtx.drawImage(this.bgCanvas, 0, 0);
    }
}

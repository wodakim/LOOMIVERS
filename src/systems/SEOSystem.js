import { System } from '../ecs/System.js';

export class SEOSystem extends System {
    constructor(entityManager) {
        super(entityManager);
        this.descriptionContainer = document.getElementById('game-description');
        this.lastUpdate = 0;
        this.throttleTime = 2000; // 2 secondes
    }

    update(dt) {
        // On n'utilise pas dt ici, mais le temps réel
        const now = performance.now();
        if (now - this.lastUpdate < this.throttleTime) return;

        this.lastUpdate = now;

        // Utilisation de requestIdleCallback pour ne pas bloquer le thread principal
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => this.updateDescription());
        } else {
            setTimeout(() => this.updateDescription(), 0);
        }
    }

    updateDescription() {
        if (!this.descriptionContainer) return;

        const entities = this.entityManager.getEntities();
        let playerCount = 0;
        let enemyCount = 0;
        let playerHealth = 100; // Placeholder

        for (const entity of entities) {
            if (entity.tags.has('player')) playerCount++;
            if (entity.tags.has('enemy')) enemyCount++;
        }

        const text = `
            Genesis Survivor Game State.
            Player is active. Health: ${playerHealth}%.
            Enemies nearby: ${enemyCount}.
            Current objective: Survive.
        `;

        this.descriptionContainer.textContent = text;
    }
}

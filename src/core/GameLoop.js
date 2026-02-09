export class GameLoop {
    /**
     * @param {function(number): void} update - Fonction de mise à jour logique (dt fixe).
     * @param {function(number): void} render - Fonction de rendu (interpolation).
     * @param {number} step - Pas de temps fixe (défaut: 1/60s).
     */
    constructor(update, render, step = 1/60) {
        this.update = update;
        this.render = render;
        this.step = step;
        this.dt = 0;
        this.last = 0;
        this.accumulator = 0;
        this.rafId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.last = performance.now();
        this.rafId = requestAnimationFrame(this.frame.bind(this));
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    frame(timestamp) {
        if (!this.isRunning) return;

        this.dt = (timestamp - this.last) / 1000;
        this.last = timestamp;

        // Protection contre la spirale de la mort (lag spike)
        if (this.dt > 0.25) this.dt = 0.25;

        this.accumulator += this.dt;

        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        // Interpolation (alpha) pour le rendu fluide
        const alpha = this.accumulator / this.step;
        this.render(alpha);

        this.rafId = requestAnimationFrame(this.frame.bind(this));
    }
}

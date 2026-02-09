/**
 * Boucle de jeu principale avec pas de temps fixe (Fixed Time Step).
 * Gère la mise à jour de la logique et le rendu séparément.
 */
export class GameLoop {
    /**
     * @param {Function} updateFn - Fonction de mise à jour logique (physique, IA).
     * @param {Function} renderFn - Fonction de rendu (dessin).
     * @param {number} targetFPS - Fréquence cible pour la logique (ex: 60Hz).
     */
    constructor(updateFn, renderFn, targetFPS = 60) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.timeStep = 1000 / targetFPS; // ms par frame logique

        this.lastFrameTimeMs = 0;
        this.accumulatedTime = 0;
        this.rafId = null;
        this.isRunning = false;

        // Liaison du contexte pour requestAnimationFrame
        this.loop = this.loop.bind(this);
    }

    /**
     * Démarre la boucle de jeu.
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTimeMs = performance.now();
            this.rafId = requestAnimationFrame(this.loop);
        }
    }

    /**
     * Arrête la boucle de jeu.
     */
    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.rafId);
    }

    /**
     * La fonction de boucle principale appelée par requestAnimationFrame.
     * @param {number} timestamp - Le temps actuel fourni par le navigateur.
     */
    loop(timestamp) {
        if (!this.isRunning) return;

        // Calcul du temps écoulé depuis la dernière frame
        let delta = timestamp - this.lastFrameTimeMs;
        this.lastFrameTimeMs = timestamp;

        // Protection contre la "spirale de la mort" si le jeu lag trop (max 1s de rattrapage)
        if (delta > 1000) delta = 1000;

        this.accumulatedTime += delta;

        // Mise à jour de la logique par pas de temps fixe
        while (this.accumulatedTime >= this.timeStep) {
            this.updateFn(this.timeStep / 1000); // Conversion en secondes pour la physique
            this.accumulatedTime -= this.timeStep;
        }

        // Calcul de l'interpolation pour le rendu (entre 0 et 1)
        // Permet un mouvement fluide même si le framerate écran != framerate logique
        const alpha = this.accumulatedTime / this.timeStep;

        // Appel du rendu
        this.renderFn(alpha);

        // Planification de la prochaine frame
        this.rafId = requestAnimationFrame(this.loop);
    }
}

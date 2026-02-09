/**
 * Gestionnaire des entrées utilisateur (Clavier, Tactile).
 * Découplé des entités : met à jour un état interne que les systèmes peuvent lire.
 */
export class InputHandler {
    constructor() {
        // État des touches
        this.keys = new Set();

        // État du joystick virtuel
        this.joystick = {
            active: false,
            origin: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            vector: { x: 0, y: 0 } // Normalisé (-1 à 1)
        };

        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    setupTouchListeners() {
        // On attache les écouteurs au canvas plus tard ou globalement pour l'instant
        // Pour un joystick virtuel global, on peut écouter sur window ou un overlay spécifique

        window.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            // Si on touche la moitié gauche de l'écran (convention mobile pour le mouvement)
            if (touch.clientX < window.innerWidth / 2) {
                this.joystick.active = true;
                this.joystick.origin = { x: touch.clientX, y: touch.clientY };
                this.joystick.current = { x: touch.clientX, y: touch.clientY };
                this.updateJoystickVector();
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!this.joystick.active) return;
            // e.preventDefault(); // Empêcher le scroll

            // Trouver le touch correspondant au joystick (le premier actif ici pour simplifier la POC)
            // Dans une version complète, on suivrait l'ID du touch
            const touch = e.changedTouches[0];

            this.joystick.current = { x: touch.clientX, y: touch.clientY };
            this.updateJoystickVector();
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
             if (this.joystick.active) {
                 this.joystick.active = false;
                 this.joystick.vector = { x: 0, y: 0 };
             }
        });
    }

    updateJoystickVector() {
        const dx = this.joystick.current.x - this.joystick.origin.x;
        const dy = this.joystick.current.y - this.joystick.origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50; // Rayon max du joystick en pixels

        if (distance > 0) {
            // Normalisation
            const limitedDist = Math.min(distance, maxDist);
            const scale = limitedDist / distance; // Pour limiter visuellement le stick

            // Le vecteur de sortie est normalisé entre -1 et 1
            this.joystick.vector = {
                x: (dx / distance) * (limitedDist / maxDist),
                y: (dy / distance) * (limitedDist / maxDist)
            };
        } else {
            this.joystick.vector = { x: 0, y: 0 };
        }
    }

    /**
     * Récupère le vecteur de mouvement actuel (Clavier ou Joystick).
     * @returns {{x: number, y: number}} Vecteur normalisé.
     */
    getMovementVector() {
        let x = 0;
        let y = 0;

        // Clavier (ZQSD / Flèches)
        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
        if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
        if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
        if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

        // Si le clavier est utilisé, on normalise
        if (x !== 0 || y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
            return { x, y };
        }

        // Sinon, on retourne le joystick
        if (this.joystick.active) {
            return this.joystick.vector;
        }

        return { x: 0, y: 0 };
    }
}

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
            id: null,
            origin: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            vector: { x: 0, y: 0 } // Normalisé (-1 à 1)
        };

        // État des boutons virtuels
        this.actions = {
            dash: false,
            pause: false
        };

        this.setupKeyboardListeners();
        this.setupTouchListeners();
        this.setupVirtualButtons();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            if (e.code === 'Space') this.actions.dash = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            if (e.code === 'Space') this.actions.dash = false;
        });
    }

    setupVirtualButtons() {
        const dashBtn = document.getElementById('btn-dash');
        const pauseBtn = document.getElementById('btn-pause');

        if (dashBtn) {
            dashBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.actions.dash = true;
                dashBtn.style.transform = 'scale(0.9)';
            });
            dashBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.actions.dash = false;
                dashBtn.style.transform = 'scale(1)';
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                // Toggle pause via event emission simulation (handled in GameManager update loop or separate check)
                // For direct input polling:
                this.actions.pause = true;
                // Need to reset it quickly or handle toggle logic elsewhere
                setTimeout(() => this.actions.pause = false, 100);

                // Direct call fallback if needed (GameManager listens to keydown usually)
                const event = new KeyboardEvent('keydown', { key: 'P' });
                window.dispatchEvent(event);
            });
        }
    }

    setupTouchListeners() {
        const zone = document.getElementById('joystick-zone');
        const knob = document.getElementById('joystick-knob');

        if (!zone || !knob) return;

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystick.id = touch.identifier;
            this.joystick.active = true;

            // Center is relative to the zone
            const rect = zone.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            this.joystick.origin = { x: centerX, y: centerY };
            this.updateJoystickFromTouch(touch.clientX, touch.clientY, knob);
        }, { passive: false });

        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystick.active) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.id) {
                    const touch = e.changedTouches[i];
                    this.updateJoystickFromTouch(touch.clientX, touch.clientY, knob);
                    break;
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.id) {
                    this.joystick.active = false;
                    this.joystick.vector = { x: 0, y: 0 };
                    knob.style.transform = `translate(-50%, -50%)`; // Reset visual
                    break;
                }
            }
        };

        zone.addEventListener('touchend', endJoystick);
        zone.addEventListener('touchcancel', endJoystick);
    }

    updateJoystickFromTouch(clientX, clientY, knob) {
        const dx = clientX - this.joystick.origin.x;
        const dy = clientY - this.joystick.origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 35; // Visual limit inside the 120px zone

        const angle = Math.atan2(dy, dx);

        // Visual Update
        const visualDist = Math.min(distance, maxDist);
        const knobX = Math.cos(angle) * visualDist;
        const knobY = Math.sin(angle) * visualDist;

        knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        // Vector Update (Normalized)
        // Deadzone check
        if (distance > 5) {
            this.joystick.vector = {
                x: Math.cos(angle),
                y: Math.sin(angle)
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
        // Priorité au Joystick s'il est actif
        if (this.joystick.active && (this.joystick.vector.x !== 0 || this.joystick.vector.y !== 0)) {
            return this.joystick.vector;
        }

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
        }

        return { x, y };
    }

    isDashPressed() {
        return this.actions.dash;
    }
}

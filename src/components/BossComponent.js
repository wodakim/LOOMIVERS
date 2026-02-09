import { Component } from '../ecs/Component.js';

export class BossComponent extends Component {
    constructor() {
        super();
        this.phase = 1; // 1 (Normal), 2 (Rage/Bullet Hell)
        this.patternTimer = 0;
        this.currentPattern = 'spiral'; // 'spiral', 'ring'
        this.patternDuration = 5.0; // Switch pattern every 5s
        this.attackCooldown = 0.2; // Fast fire rate for bullet hell
        this.angleOffset = 0; // For rotating patterns
    }

    reset() {
        this.phase = 1;
        this.patternTimer = 0;
        this.currentPattern = 'spiral';
        this.patternDuration = 5.0;
        this.attackCooldown = 0.2;
        this.angleOffset = 0;
    }
}

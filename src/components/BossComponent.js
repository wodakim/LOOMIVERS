import { Component } from '../ecs/Component.js';

export class BossComponent extends Component {
    constructor() {
        super();
        this.phase = 1; // 1, 2, 3...
        this.attackCooldown = 2;
    }

    reset() {
        this.phase = 1;
        this.attackCooldown = 2;
    }
}

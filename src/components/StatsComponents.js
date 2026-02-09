import { Component } from '../ecs/Component.js';

export class HealthComponent extends Component {
    constructor() {
        super();
        this.current = 100;
        this.max = 100;
        this.isDead = false;
    }

    reset() {
        this.current = 100;
        this.max = 100;
        this.isDead = false;
    }
}

export class ScoreComponent extends Component {
    constructor() {
        super();
        this.value = 10; // Score donné à la mort
    }

    reset() {
        this.value = 10;
    }
}

export class FloatingTextComponent extends Component {
    constructor() {
        super();
        this.text = '';
        this.color = '#fff';
        this.lifetime = 1.0;
        this.size = 14;
        this.isCritical = false;
    }

    reset() {
        this.text = '';
        this.color = '#fff';
        this.lifetime = 1.0;
        this.size = 14;
        this.isCritical = false;
    }
}

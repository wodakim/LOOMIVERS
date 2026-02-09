import { Component } from '../ecs/Component.js';

export class CollectableComponent extends Component {
    constructor() {
        super();
        this.type = 'xp'; // 'xp', 'health', 'coin'
        this.value = 1;
        this.magnetRange = 100; // Rayon d'attraction
        this.magnetSpeed = 300; // Vitesse d'attraction
    }

    reset() {
        this.type = 'xp';
        this.value = 1;
        this.magnetRange = 100;
        this.magnetSpeed = 300;
    }
}

export class LevelComponent extends Component {
    constructor() {
        super();
        this.level = 1;
        this.currentXP = 0;
        this.nextLevelXP = 10;
        this.isLevelingUp = false;
    }

    reset() {
        this.level = 1;
        this.currentXP = 0;
        this.nextLevelXP = 10;
        this.isLevelingUp = false;
    }
}

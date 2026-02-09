import { Component } from '../ecs/Component.js';

export class TransformComponent extends Component {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scale = 1;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scale = 1;
    }
}

export class VelocityComponent extends Component {
    constructor() {
        super();
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.drag = 0.9;
    }

    reset() {
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.drag = 0.9;
    }
}

export class RenderComponent extends Component {
    constructor() {
        super();
        this.width = 32;
        this.height = 32;
        this.color = '#FFFFFF';
        this.shape = 'rect'; // 'rect' | 'circle'
        this.layer = 0;
    }

    reset() {
        this.width = 32;
        this.height = 32;
        this.color = '#FFFFFF';
        this.shape = 'rect';
        this.layer = 0;
    }
}

export class InputComponent extends Component {
    constructor() {
        super();
        this.receivesInput = true;
    }

    reset() {
        this.receivesInput = true;
    }
}

export class AIComponent extends Component {
    constructor() {
        super();
        this.targetId = -1; // ID de l'entité cible (ex: Joueur)
        this.state = 'idle'; // 'idle', 'chase', 'attack'
        this.detectionRadius = 300;
    }

    reset() {
        this.targetId = -1;
        this.state = 'idle';
        this.detectionRadius = 300;
    }
}

export class ColliderComponent extends Component {
    constructor() {
        super();
        this.radius = 16;
        this.width = 32;
        this.height = 32;
        this.isTrigger = false;
        this.tags = []; // 'player', 'enemy', 'wall'
    }

    reset() {
        this.radius = 16;
        this.width = 32;
        this.height = 32;
        this.isTrigger = false;
        this.tags = [];
    }
}

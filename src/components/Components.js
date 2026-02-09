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
        this.hitFlashTimer = 0; // For juice
    }

    reset() {
        this.width = 32;
        this.height = 32;
        this.color = '#FFFFFF';
        this.shape = 'rect';
        this.layer = 0;
        this.hitFlashTimer = 0;
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

export class DashComponent extends Component {
    constructor() {
        super();
        this.duration = 0.2; // Durée du dash (s)
        this.cooldown = 1.0; // Temps avant réutilisation (s)
        this.speedMultiplier = 3.0; // Boost de vitesse

        // État interne
        this.isDashing = false;
        this.dashTimer = 0;
        this.cooldownTimer = 0;
        this.dashVector = { x: 0, y: 0 };
    }

    reset() {
        this.isDashing = false;
        this.dashTimer = 0;
        this.cooldownTimer = 0;
        this.dashVector = { x: 0, y: 0 };
        this.duration = 0.2;
        this.cooldown = 1.0;
        this.speedMultiplier = 3.0;
    }
}

export class AIComponent extends Component {
    constructor() {
        super();
        this.targetId = -1; // ID de l'entité cible (ex: Joueur)
        this.state = 'idle'; // 'idle', 'chase', 'attack'
        this.detectionRadius = 300;
        this.behavior = 'chase'; // 'chase', 'shooter', 'charger', 'ghost', 'kamikaze'
        this.chargeTimer = 0;
        this.isCharging = false;
        this.shootTimer = 0;
        this.shootRange = 400;
    }

    reset() {
        this.targetId = -1;
        this.state = 'idle';
        this.detectionRadius = 300;
        this.behavior = 'chase';
        this.chargeTimer = 0;
        this.isCharging = false;
        this.shootTimer = 0;
        this.shootRange = 400;
    }
}

export class SupportComponent extends Component {
    constructor() {
        super();
        this.type = 'healer'; // 'healer' | 'buffer'
        this.range = 200;
        this.cooldown = 2.0;
        this.timer = 0;
        this.effectStrength = 10; // Heal amount or Speed multiplier %
    }

    reset() {
        this.type = 'healer';
        this.range = 200;
        this.cooldown = 2.0;
        this.timer = 0;
        this.effectStrength = 10;
    }
}

export class ColliderComponent extends Component {
    constructor() {
        super();
        this.radius = 16;
        this.width = 32;
        this.height = 32;
        this.isTrigger = false;
        this.tags = []; // 'player', 'enemy', 'wall', 'ghost'
    }

    reset() {
        this.radius = 16;
        this.width = 32;
        this.height = 32;
        this.isTrigger = false;
        this.tags = [];
    }
}

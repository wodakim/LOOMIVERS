import { Component } from '../ecs/Component.js';

export class WeaponComponent extends Component {
    constructor() {
        super();
        this.type = 'pistol'; // 'pistol', 'whip', 'aura', 'mines', 'orbital', 'turret'
        this.damage = 10;
        this.range = 300;
        this.fireRate = 0.5; // Tirs par seconde
        this.cooldown = 0;
        this.projectileSpeed = 400;
        this.color = '#ffff00';
        this.duration = 0;

        // Orbital specific
        this.orbitalAngle = 0;
        this.orbitalCount = 0;
        this.orbitals = []; // IDs of spawned orbital entities
    }

    reset() {
        this.type = 'pistol';
        this.damage = 10;
        this.range = 300;
        this.fireRate = 0.5;
        this.cooldown = 0;
        this.projectileSpeed = 400;
        this.color = '#ffff00';
        this.duration = 0;
        this.orbitalAngle = 0;
        this.orbitalCount = 0;
        this.orbitals = [];
    }
}

export class ProjectileComponent extends Component {
    constructor() {
        super();
        this.damage = 0;
        this.sourceId = -1; // ID de l'entité qui a tiré
        this.lifetime = 2; // Secondes avant destruction auto
        this.isMine = false; // Special logic for mines
        this.isOrbital = false; // Special logic for orbitals
    }

    reset() {
        this.damage = 0;
        this.sourceId = -1;
        this.lifetime = 2;
        this.isMine = false;
        this.isOrbital = false;
    }
}

export class OrbitalComponent extends Component {
    constructor() {
        super();
        this.parentId = -1;
        this.angle = 0;
        this.radius = 80;
        this.speed = 2;
    }

    reset() {
        this.parentId = -1;
        this.angle = 0;
        this.radius = 80;
        this.speed = 2;
    }
}

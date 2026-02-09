import { Component } from './Component.js';

export class WeaponComponent extends Component {
    constructor() {
        super();
        this.damage = 10;
        this.range = 300;
        this.fireRate = 0.5; // Tirs par seconde
        this.cooldown = 0;
        this.projectileSpeed = 400;
        this.color = '#ffff00';
    }

    reset() {
        this.damage = 10;
        this.range = 300;
        this.fireRate = 0.5;
        this.cooldown = 0;
        this.projectileSpeed = 400;
        this.color = '#ffff00';
    }
}

export class ProjectileComponent extends Component {
    constructor() {
        super();
        this.damage = 0;
        this.sourceId = -1; // ID de l'entité qui a tiré
        this.lifetime = 2; // Secondes avant destruction auto
    }

    reset() {
        this.damage = 0;
        this.sourceId = -1;
        this.lifetime = 2;
    }
}

import { Component } from '../ecs/Component.js';

export class WeaponComponent extends Component {
    constructor() {
        super();
        this.type = 'pistol'; // 'pistol', 'whip', 'aura'
        this.damage = 10;
        this.range = 300;
        this.fireRate = 0.5; // Tirs par seconde
        this.cooldown = 0;
        this.projectileSpeed = 400;
        this.color = '#ffff00';
        this.duration = 0; // For melee/aura
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

import { Component } from './Component.js';

export class ParticleComponent extends Component {
    constructor() {
        super();
        this.lifetime = 1.0;
        this.maxLifetime = 1.0;
        this.size = 2;
        this.color = '#fff';
        this.fade = true;
    }

    reset() {
        this.lifetime = 1.0;
        this.maxLifetime = 1.0;
        this.size = 2;
        this.color = '#fff';
        this.fade = true;
    }
}

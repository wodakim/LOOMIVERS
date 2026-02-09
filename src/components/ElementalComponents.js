import { Component } from '../ecs/Component.js';

export class ElementalComponent extends Component {
    constructor() {
        super();
        this.tags = new Set(); // 'fire', 'oil', 'water', 'electric'
    }

    reset() {
        this.tags.clear();
    }
}

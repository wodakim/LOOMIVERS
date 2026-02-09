/**
 * Entité ECS : Un simple conteneur d'ID et de composants.
 * Gérée par l'EntityManager et le Pool.
 */
export class Entity {
    constructor() {
        this.id = -1;
        this.components = new Map();
        this.active = false;
        this.tags = new Set();
    }

    /**
     * Ajoute un composant à l'entité.
     * @param {Component} component - L'instance du composant.
     * @returns {Entity} L'entité elle-même pour le chaînage.
     */
    addComponent(component) {
        this.components.set(component.constructor.name, component);
        return this;
    }

    /**
     * Récupère un composant par son type (Nom de la classe).
     * @param {string} componentName - Le nom de la classe du composant.
     * @returns {Component|undefined}
     */
    getComponent(componentName) {
        return this.components.get(componentName);
    }

    /**
     * Vérifie si l'entité possède un composant.
     * @param {string} componentName
     * @returns {boolean}
     */
    hasComponent(componentName) {
        return this.components.has(componentName);
    }

    /**
     * Réinitialise l'entité pour le pooling.
     * Appelle reset() sur tous ses composants.
     */
    reset() {
        this.id = -1;
        this.active = false;
        this.tags.clear();

        for (const component of this.components.values()) {
            if (component.reset) component.reset();
            // Note: On pourrait aussi retourner les composants à leur propre pool ici
            // Pour cette version, on garde les instances de composants attachées ou on les laisse au GC si on remplace
            // Optimisation future: Pool de composants spécifique.
        }
        this.components.clear();
    }
}

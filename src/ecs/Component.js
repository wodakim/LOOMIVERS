/**
 * Classe de base pour tous les composants ECS.
 * Les composants ne doivent contenir QUE des données, aucune logique.
 */
export class Component {
    constructor() {}

    /**
     * Réinitialise le composant pour le pooling.
     */
    reset() {}
}

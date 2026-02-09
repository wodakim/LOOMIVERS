/**
 * Système de base ECS.
 * Contient la logique qui opère sur les entités possédant certains composants.
 */
export class System {
    /**
     * @param {EntityManager} entityManager - Référence au gestionnaire d'entités.
     */
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Méthode de mise à jour appelée à chaque frame (ou tick physique).
     * @param {number} dt - Delta time en secondes.
     */
    update(dt) {}
}

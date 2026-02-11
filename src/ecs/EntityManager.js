import { Entity } from './Entity.js';
import { ObjectPool } from '../core/ObjectPool.js';

/**
 * Gestionnaire central des entités et des systèmes.
 * Gère le cycle de vie des entités via un Object Pool.
 */
export class EntityManager {
    constructor() {
        this.entities = [];
        this.systems = [];
        this.entityPool = new ObjectPool(Entity, 1000);
        this.nextId = 0;
    }

    /**
     * Crée une nouvelle entité (depuis le pool).
     * @returns {Entity} L'entité activée.
     */
    createEntity() {
        const entity = this.entityPool.acquire();
        // Force clean in case pool failed or user logic failed
        if (entity.components.size > 0) {
            console.warn("EntityManager: Acquired dirty entity! Resetting.");
            entity.reset();
        }

        entity.id = this.nextId++;
        entity.active = true;
        this.entities.push(entity);
        return entity;
    }

    /**
     * Marque une entité pour suppression (retour au pool à la fin de la frame).
     * @param {Entity} entity
     */
    removeEntity(entity) {
        entity.active = false;
    }

    /**
     * Enregistre un système.
     * @param {System} system
     */
    registerSystem(system) {
        this.systems.push(system);
    }

    /**
     * Met à jour tous les systèmes.
     * @param {number} dt - Delta time.
     */
    update(dt) {
        // Nettoyage des entités inactives (optimisé avec swap-and-pop pour éviter le splice lent)
        let i = 0;
        while (i < this.entities.length) {
            const entity = this.entities[i];
            if (!entity.active) {
                // Retour au pool
                this.entityPool.release(entity);

                // Swap avec le dernier élément
                const lastIndex = this.entities.length - 1;
                if (i < lastIndex) {
                    this.entities[i] = this.entities[lastIndex];
                }
                this.entities.pop();
                // Ne pas incrémenter i, car on doit vérifier le nouvel élément à cette position
            } else {
                i++;
            }
        }

        for (const system of this.systems) {
            system.update(dt);
        }
    }

    /**
     * Récupère toutes les entités actives.
     * @returns {Array<Entity>}
     */
    getEntities() {
        return this.entities;
    }
}

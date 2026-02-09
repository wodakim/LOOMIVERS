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
        // Le nettoyage réel se fait souvent en fin de frame,
        // mais pour simplifier ici on filtre ou on le fait immédiatement si l'array est géré.
        // Pour des perfs optimales (tableau dense), on ferait un swap-and-pop.
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
        // Nettoyage des entités inactives (simplifié)
        // Dans une version pro, on ferait ça plus intelligemment pour éviter le splice/filter coûteux
        for (let i = this.entities.length - 1; i >= 0; i--) {
            if (!this.entities[i].active) {
                this.entityPool.release(this.entities[i]);
                this.entities.splice(i, 1);
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

/**
 * Système de pool d'objets générique pour éviter le Garbage Collection.
 * @template T
 */
export class ObjectPool {
    /**
     * @param {new () => T} factoryFunc - Le constructeur de la classe à pooler.
     * @param {number} initialSize - Taille initiale du pool.
     */
    constructor(factoryFunc, initialSize = 100) {
        this.factory = factoryFunc;
        this.pool = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new this.factory());
        }
    }

    /**
     * Récupère un objet du pool ou en crée un nouveau si vide.
     * @returns {T} L'objet récupéré.
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        } else {
            // Extension dynamique du pool si nécessaire (devrait être rare si bien dimensionné)
            return new this.factory();
        }
    }

    /**
     * Retourne un objet dans le pool pour réutilisation.
     * @param {T} obj - L'objet à libérer.
     */
    release(obj) {
        if (obj.reset) {
            obj.reset();
        }
        this.pool.push(obj);
    }
}

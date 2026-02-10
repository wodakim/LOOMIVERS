export class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    /**
     * Loads multiple images.
     * @param {Object} sources - Key-value pairs of asset names and paths.
     * @returns {Promise} Resolves when all images are loaded.
     */
    loadImages(sources) {
        const promises = [];
        this.totalAssets += Object.keys(sources).length;

        for (const [key, src] of Object.entries(sources)) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.assets.set(key, img);
                    this.loadedAssets++;
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error(`Failed to load image: ${src}`, e);
                    reject(e);
                };
            }));
        }
        return Promise.all(promises);
    }

    /**
     * Gets a loaded asset by key.
     * @param {string} key
     * @returns {HTMLImageElement}
     */
    get(key) {
        return this.assets.get(key);
    }
}

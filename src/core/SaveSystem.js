/**
 * Système de sauvegarde sécurisé avec chiffrement XOR et vérification d'intégrité.
 */
export class SaveSystem {
    constructor() {
        this.storageKey = 'genesis_save_v1';
        this.integrityKey = 'sys_integrity';
        this.salt = this.initIntegritySalt();
    }

    /**
     * Initialise ou récupère le "Sel" unique pour le chiffrement.
     * @returns {string} Le sel d'intégrité.
     */
    initIntegritySalt() {
        let salt = localStorage.getItem(this.integrityKey);
        if (!salt) {
            // Génération d'un sel unique basé sur le temps et l'aléatoire
            salt = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem(this.integrityKey, salt);
            console.log('Genesis Security: New integrity salt generated.');
        }
        return salt;
    }

    /**
     * Chiffre ou déchiffre une chaîne avec XOR.
     * @param {string} text - Le texte à traiter.
     * @returns {string} Le résultat.
     */
    xorCipher(text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            // XOR entre le code char du texte et le code char du sel (rotatif)
            result += String.fromCharCode(text.charCodeAt(i) ^ this.salt.charCodeAt(i % this.salt.length));
        }
        return result;
    }

    /**
     * Sauvegarde les données du jeu.
     * @param {Object} data - L'objet de données à sauvegarder.
     */
    save(data) {
        try {
            const jsonString = JSON.stringify(data);

            // Calcul du checksum (simple hash pour la démo, pourrait être plus robuste)
            const checksum = this.generateChecksum(jsonString);

            // On ajoute le checksum aux données avant chiffrement
            const payload = JSON.stringify({ data: jsonString, checksum: checksum });

            // Chiffrement
            const encrypted = this.xorCipher(payload);

            // Encodage Base64 pour le stockage sûr
            localStorage.setItem(this.storageKey, btoa(encrypted));
            console.log('Game Saved securely.');
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    /**
     * Charge les données du jeu.
     * @returns {Object|null} Les données déchiffrées ou null si corrompu/inexistant.
     */
    load() {
        const encryptedBase64 = localStorage.getItem(this.storageKey);
        if (!encryptedBase64) return null;

        try {
            // Décodage Base64
            const encrypted = atob(encryptedBase64);

            // Déchiffrement
            const decryptedPayload = this.xorCipher(encrypted);
            const { data, checksum } = JSON.parse(decryptedPayload);

            // Vérification de l'intégrité
            const calculatedChecksum = this.generateChecksum(data);

            if (checksum !== calculatedChecksum) {
                console.error('SECURITY ALERT: Save file corrupted or modified! Wiping data.');
                this.wipe();
                return null;
            }

            return JSON.parse(data);
        } catch (e) {
            console.error('Load failed (corruption detected):', e);
            this.wipe(); // Sécurité punitive
            return null;
        }
    }

    /**
     * Génère un hash simple pour vérifier l'intégrité.
     * @param {string} str - La chaîne à hasher.
     * @returns {number} Le hash.
     */
    generateChecksum(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convertit en entier 32bit
        }
        return hash;
    }

    /**
     * Efface la sauvegarde (punitif).
     */
    wipe() {
        localStorage.removeItem(this.storageKey);
    }
}

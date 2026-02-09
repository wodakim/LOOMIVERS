/**
 * Configuration complète des vagues pour une session de jeu de 5 minutes.
 * Progression de la difficulté :
 * 0-1m : Tutoriel / Ennemis de base (tier1)
 * 1m-2m : Introduction des Shooters (distance)
 * 2m-3m : Introduction des Chargers (pression)
 * 3m-4m : Mélange intense (Hordes)
 * 4m-5m : Survival extrême (Elites)
 * 5m : BOSS FINAL
 */
export const WavesConfig = [
    // --- PHASE 1: WARM UP (0-60s) ---
    {
        time: 0,
        enemies: [
            { type: 'tier1', count: 5, interval: 1.0 } // Très lent au début
        ]
    },
    {
        time: 15,
        enemies: [
            { type: 'tier1', count: 10, interval: 0.8 }
        ]
    },
    {
        time: 30,
        enemies: [
            { type: 'tier1', count: 15, interval: 0.5 },
            { type: 'tier2', count: 1, interval: 0 } // Premier Elite (Mini-boss)
        ]
    },
    {
        time: 45,
        enemies: [
            { type: 'tier1', count: 20, interval: 0.4 }
        ]
    },

    // --- PHASE 2: SHOOTERS (1m-2m) ---
    {
        time: 60,
        enemies: [
            { type: 'tier1', count: 10, interval: 0.5 },
            { type: 'shooter', count: 3, interval: 2.0 } // Intro Shooters
        ]
    },
    {
        time: 90,
        enemies: [
            { type: 'tier1', count: 15, interval: 0.4 },
            { type: 'shooter', count: 5, interval: 1.5 }
        ]
    },

    // --- PHASE 3: CHARGERS (2m-3m) ---
    {
        time: 120,
        enemies: [
            { type: 'tier1', count: 10, interval: 0.3 },
            { type: 'charger', count: 2, interval: 5.0 } // Intro Chargers (Attention !)
        ]
    },
    {
        time: 150,
        enemies: [
            { type: 'tier1', count: 20, interval: 0.3 },
            { type: 'charger', count: 4, interval: 3.0 },
            { type: 'shooter', count: 4, interval: 2.0 }
        ]
    },

    // --- PHASE 4: CHAOS (3m-4m) ---
    {
        time: 180,
        enemies: [
            { type: 'tier1', count: 30, interval: 0.2 }, // Horde dense
            { type: 'healer', count: 2, interval: 5.0 }, // Support intro
            { type: 'tier2', count: 3, interval: 5.0 }
        ]
    },
    {
        time: 210,
        enemies: [
            { type: 'shooter', count: 10, interval: 1.0 }, // Bullet Hell check
            { type: 'buffer', count: 2, interval: 10.0 }, // Support intro
            { type: 'charger', count: 5, interval: 2.0 }
        ]
    },

    // --- PHASE 5: SURVIVAL (4m-5m) ---
    {
        time: 240,
        enemies: [
            { type: 'tier2', count: 10, interval: 2.0 }, // Armée d'Elites
            { type: 'healer', count: 5, interval: 3.0 },
            { type: 'tier1', count: 40, interval: 0.1 }
        ]
    },
    {
        time: 270,
        enemies: [
            { type: 'charger', count: 10, interval: 1.0 }, // Charge massive
            { type: 'shooter', count: 10, interval: 1.0 }
        ]
    },

    // --- BOSS FIGHT (5m) ---
    {
        time: 300,
        enemies: [
            { type: 'boss1', count: 1, interval: 0 } // LE FINAL
        ]
    }
];

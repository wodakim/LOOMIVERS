export const WavesConfig = [
    {
        time: 0, // Début
        enemies: [
            { type: 'tier1', count: 3, interval: 0.5 } // 3 ennemis, 1 toutes les 0.5s
        ]
    },
    {
        time: 10, // À 10 secondes
        enemies: [
            { type: 'tier1', count: 5, interval: 0.2 },
            { type: 'tier2', count: 1, interval: 0 } // 1 Elite direct
        ]
    },
    {
        time: 30, // À 30 secondes
        enemies: [
            { type: 'tier1', count: 15, interval: 0.2 },
            { type: 'shooter', count: 5, interval: 1 }, // New Shooters
            { type: 'charger', count: 3, interval: 2 }  // New Chargers
        ]
    },
    {
        time: 60, // À 60 secondes (Boss)
        enemies: [
            { type: 'boss1', count: 1, interval: 0 },
            { type: 'shooter', count: 5, interval: 2 } // Adds pressure
        ]
    }
];

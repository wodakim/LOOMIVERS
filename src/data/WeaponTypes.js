export const WeaponTypes = {
    PISTOL: {
        type: 'pistol',
        name: 'Plasma Pistol',
        damage: 10,
        range: 300,
        fireRate: 2,
        projectileSpeed: 400,
        color: '#ffff00',
        tags: ['fire'] // Legacy
    },
    WHIP: {
        type: 'whip',
        name: 'Thunder Whip',
        damage: 25,
        range: 150,
        fireRate: 1.5,
        duration: 0.2,
        color: '#00ccff',
        tags: ['electric']
    },
    AURA: {
        type: 'aura',
        name: 'Toxic Aura',
        damage: 5,
        range: 100,
        fireRate: 5,
        color: '#00ff00',
        tags: ['oil']
    },
    MINES: {
        type: 'mines',
        name: 'Proximity Mines',
        damage: 50,
        range: 60, // Explosion radius
        fireRate: 0.5, // 1 mine every 2s
        duration: 10, // Lifetime
        color: '#ff3333',
        tags: ['fire', 'explosive']
    },
    ORBITAL: {
        type: 'orbital',
        name: 'Ice Orbs',
        damage: 15,
        range: 80, // Distance from player
        speed: 2, // Rotation speed
        count: 2, // Number of orbs
        color: '#00ffff',
        tags: ['water', 'ice'] // Ice logic (slow)
    },
    TURRET: {
        type: 'turret',
        name: 'Sentry Turret',
        damage: 8,
        range: 250,
        fireRate: 0.2, // Spawn rate (1 turret every 5s)
        duration: 15, // Turret lifetime
        projectileSpeed: 500,
        color: '#aaaaaa',
        tags: ['physical']
    }
};

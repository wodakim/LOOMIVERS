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
        range: 150, // Range is actually width/2 for whip
        fireRate: 1.5,
        duration: 0.2, // How long the hitbox stays active
        color: '#00ccff',
        tags: ['electric']
    },
    AURA: {
        type: 'aura',
        name: 'Toxic Aura',
        damage: 5,
        range: 100, // Radius
        fireRate: 5, // Ticks per second
        color: '#00ff00',
        tags: ['oil'] // Poison/Oil logic
    }
};

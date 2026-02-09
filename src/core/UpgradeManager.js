export class UpgradeManager {
    constructor(saveSystem) {
        this.saveSystem = saveSystem;
        this.upgrades = {
            'health_boost': { name: 'Max Health +20', cost: 100, level: 0, maxLevel: 5, stat: 'maxHealth', value: 20 },
            'damage_boost': { name: 'Damage +10%', cost: 200, level: 0, maxLevel: 5, stat: 'damageMult', value: 0.1 },
            'speed_boost': { name: 'Speed +10', cost: 150, level: 0, maxLevel: 3, stat: 'speedAdd', value: 10 },
            'unlock_whip': { name: 'Unlock Whip', cost: 500, level: 0, maxLevel: 1, stat: 'unlock', value: 'WHIP' },
            'unlock_aura': { name: 'Unlock Aura', cost: 800, level: 0, maxLevel: 1, stat: 'unlock', value: 'AURA' }
        };
        this.loadUpgrades();
    }

    loadUpgrades() {
        const data = this.saveSystem.load();
        if (data && data.upgrades) {
            for (const key in data.upgrades) {
                if (this.upgrades[key]) {
                    this.upgrades[key].level = data.upgrades[key];
                }
            }
        }
    }

    saveUpgrades() {
        const data = this.saveSystem.load() || { gold: 0, highScore: 0 };
        data.upgrades = {};
        for (const key in this.upgrades) {
            data.upgrades[key] = this.upgrades[key].level;
        }
        this.saveSystem.save(data);
    }

    buyUpgrade(key) {
        const upgrade = this.upgrades[key];
        const data = this.saveSystem.load() || { gold: 0 };

        if (upgrade && upgrade.level < upgrade.maxLevel && data.gold >= upgrade.cost) {
            data.gold -= upgrade.cost;
            upgrade.level++;
            // Save gold immediately
            this.saveSystem.save(data);
            // Save upgrades
            this.saveUpgrades();
            return true;
        }
        return false;
    }

    applyPlayerStats(playerEntity) {
        const health = playerEntity.getComponent('HealthComponent');
        const weapon = playerEntity.getComponent('WeaponComponent');
        const velocity = playerEntity.getComponent('VelocityComponent');

        if (health) health.max += this.upgrades['health_boost'].level * this.upgrades['health_boost'].value;
        if (health) health.current = health.max; // Full heal on start

        if (weapon) weapon.damage *= (1 + this.upgrades['damage_boost'].level * this.upgrades['damage_boost'].value);

        if (velocity) velocity.speed += this.upgrades['speed_boost'].level * this.upgrades['speed_boost'].value;

        // Weapon Unlocks (Need to add new entities/components for secondary weapons logic,
        // OR just switch main weapon for this POC)
        // For POC: If Whip is unlocked, replace Pistol.
        if (this.upgrades['unlock_whip'].level > 0) {
             // Logic handled in Game.js start() to swap weapon type
        }
    }

    getGold() {
        const data = this.saveSystem.load();
        return data ? (data.gold || 0) : 0;
    }
}

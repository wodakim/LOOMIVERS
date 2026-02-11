
import { Traits } from '../data/Traits.js';
import { WeaponComponent } from '../components/WeaponComponents.js';

export class TraitSystem {
    constructor(entityManager, progressionSystem) {
        this.entityManager = entityManager;
        this.progressionSystem = progressionSystem;
        this.activeTraits = {}; // trait_id -> level
    }

    applyTrait(traitId) {
        const trait = Traits[traitId];
        if (!trait) return;

        // Track Level
        this.activeTraits[traitId] = (this.activeTraits[traitId] || 0) + 1;

        // Find Player
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (!player) return;

        // Apply Logic
        if (trait.type === 'stat') {
            this.applyStatTrait(player, traitId);
        } else if (trait.type === 'weapon_mod' || trait.type === 'projectile_mod') {
            this.applyWeaponTrait(player, traitId);
        }

        console.log(`Applied Trait: ${trait.name} (Lvl ${this.activeTraits[traitId]})`);
    }

    applyStatTrait(player, id) {
        if (id === 'vitality') {
            const hp = player.getComponent('HealthComponent');
            hp.max *= 1.2;
            hp.current += (hp.max * 0.2); // Heal amount gained
        } else if (id === 'swiftness') {
            const vel = player.getComponent('VelocityComponent');
            vel.speed *= 1.15;
        } else if (id === 'greed') {
            // Magnet range usually handled in ProgressionSystem or Pickup logic
            // We need to store this modifier somewhere.
            // Let's add it to ProgressionSystem if possible, or a MagnetComponent
            // For now, simple hack:
            if (this.progressionSystem) {
                this.progressionSystem.magnetRange = (this.progressionSystem.magnetRange || 100) * 1.5;
            }
        }
    }

    applyWeaponTrait(player, id) {
        // Find Weapon
        const weapon = player.getComponent('WeaponComponent');
        if (!weapon) return;

        // Store Mods in WeaponComponent for CombatSystem/DamageSystem to use
        if (!weapon.mods) weapon.mods = new Set();

        // Evolve check logic could be here, but simpler to just stack mods.
        // V3: Evolution?
        // If weapon level max? We don't track weapon level explicitly in component yet, just traits.

        if (id === 'multishot') {
            weapon.projectileCount = (weapon.projectileCount || 1) + 1;
        } else if (id === 'inferno_trail') {
            // Add Dash Mod or persistent effect
            // For now, assume MovementSystem or AlchemySystem handles it if we tag player
            if (!player.mods) player.mods = new Set();
            player.mods.add('inferno_trail');
        } else {
            // Mods like bounce, pierce, explosive are flags checked later
            weapon.mods.add(id);
        }
    }

    getAvailableOptions() {
        const options = [];
        const keys = Object.keys(Traits);

        // Find Synergies
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        let synergy = null;
        if (player) {
            // Check Conditions for Inferno Trail
            // Assumption: Player has ElementalComponent with tags
            const elem = player.getComponent('ElementalComponent');
            if (elem && elem.tags.has('fire') && elem.tags.has('oil')) {
                if (!this.activeTraits['inferno_trail']) {
                    synergy = 'inferno_trail';
                }
            }
        }

        // Force synergy if available (High priority)
        if (synergy) {
            options.push({ id: synergy, ...Traits[synergy] });
        }

        // Pick 3 random valid options
        for(let i=0; i<3; i++) {
            // Filter maxed traits
            const valid = keys.filter(k => {
                const lvl = this.activeTraits[k] || 0;
                return lvl < Traits[k].maxLevel;
            });

            if (valid.length === 0) break;

            const pick = valid[Math.floor(Math.random() * valid.length)];
            options.push({ id: pick, ...Traits[pick] });

            // Remove from pool for this selection to avoid duplicates
            const idx = keys.indexOf(pick);
            if (idx > -1) keys.splice(idx, 1);
        }
        return options;
    }
}

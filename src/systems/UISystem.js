import { System } from '../ecs/System.js';
import { HealthComponent, ScoreComponent } from '../components/StatsComponents.js';
import { LevelComponent } from '../components/ProgressionComponents.js';

export class UISystem extends System {
    constructor(entityManager) {
        super(entityManager);

        // Cache DOM Elements
        this.healthBar = document.getElementById('health-bar');
        this.xpBar = document.getElementById('xp-fill');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.bossHealthContainer = document.getElementById('boss-health-container');
        this.bossHealthFill = document.getElementById('boss-health-fill');
        this.timerDisplay = document.getElementById('time-display');

        this.lastScore = -1;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        let player = null;
        let boss = null;

        // 1. Find relevant entities
        for (const entity of entities) {
            if (entity.active) {
                if (entity.tags.has('player')) {
                    player = entity;
                }
                if (entity.hasComponent('BossComponent')) {
                    boss = entity;
                }
            }
        }

        // 2. Update Player UI
        if (player) {
            // Health
            if (this.healthBar && player.hasComponent('HealthComponent')) {
                const health = player.getComponent('HealthComponent');
                const pct = Math.max(0, (health.current / health.max) * 100);
                this.healthBar.style.width = `${pct}%`;
            }

            // XP & Level
            if (this.xpBar && this.levelDisplay && player.hasComponent('LevelComponent')) {
                const level = player.getComponent('LevelComponent');
                const xpPct = (level.currentXP / level.nextLevelXP) * 100;
                this.xpBar.style.width = `${xpPct}%`;
                this.levelDisplay.textContent = `LVL ${level.level}`;
            }
        }

        // 3. Update Boss UI
        if (boss && this.bossHealthContainer && this.bossHealthFill) {
            if (this.bossHealthContainer.classList.contains('hidden')) {
                this.bossHealthContainer.classList.remove('hidden');
            }
            const health = boss.getComponent('HealthComponent');
            const pct = Math.max(0, (health.current / health.max) * 100);
            this.bossHealthFill.style.width = `${pct}%`;
        } else if (this.bossHealthContainer && !this.bossHealthContainer.classList.contains('hidden')) {
            // Hide if no boss
            this.bossHealthContainer.classList.add('hidden');
        }

        // 4. Score is handled by DamageSystem for logic, but we can display it here centrally if we shared state.
        // Currently DamageSystem updates text directly. We'll leave it there or move it later.
        // But for cleaner architecture, let's look for a global score state or assume DamageSystem does it.
        // Actually, DamageSystem has 'score' prop.
        // For now, DamageSystem handles Score UI update.
    }
}

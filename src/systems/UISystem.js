import { System } from '../ecs/System.js';
import { HealthComponent, ScoreComponent } from '../components/StatsComponents.js';
import { LevelComponent } from '../components/ProgressionComponents.js';
import { InteractableComponent, TransformComponent } from '../components/Components.js';

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

        // Context for drawing floating arrows (using a secondary canvas or main canvas in RenderSystem?)
        // RenderSystem clears canvas every frame.
        // UISystem is updated AFTER RenderSystem in main.js?
        // No, UI updates DOM elements usually. But for "floating arrows in canvas", RenderSystem is better.
        // HOWEVER, we can use absolute positioned DOM elements for POI labels to keep text sharp and accessible.

        this.poiContainer = document.getElementById('ui-layer');
        this.poiLabels = new Map(); // entityId -> DOM Element
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        let player = null;
        let boss = null;
        const pois = [];

        // 1. Find relevant entities
        for (const entity of entities) {
            if (entity.active) {
                if (entity.tags.has('player')) player = entity;
                if (entity.hasComponent('BossComponent')) boss = entity;
                // Check hacky label property or component
                // We added 'label' prop in main.js createPOI, better use component now if we refactored
                // But for now let's check tag 'poi'
                if (entity.tags.has('poi')) pois.push(entity);
            }
        }

        // 2. Update Player UI
        if (player) {
            if (this.healthBar && player.hasComponent('HealthComponent')) {
                const health = player.getComponent('HealthComponent');
                const pct = Math.max(0, (health.current / health.max) * 100);
                this.healthBar.style.width = `${pct}%`;
            }

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
            this.bossHealthContainer.classList.add('hidden');
        }

        // 4. Update POI Labels (Floating DOM)
        // Cleanup old labels
        for (const [id, el] of this.poiLabels) {
            if (!entities.find(e => e.id === id && e.active)) {
                el.remove();
                this.poiLabels.delete(id);
            }
        }

        // Create/Update labels
        for (const poi of pois) {
            let labelText = 'POI';
            if (poi.label) labelText = poi.label;
            else if (poi.hasComponent('InteractableComponent')) {
                labelText = poi.getComponent('InteractableComponent').label;
            }

            let el = this.poiLabels.get(poi.id);
            if (!el) {
                el = document.createElement('div');
                el.className = 'poi-label';
                el.innerHTML = `<div class="arrow">⬇</div><span>${labelText}</span>`;
                this.poiContainer.appendChild(el);
                this.poiLabels.set(poi.id, el);
            }

            // Update text if changed (e.g. state change)
            const span = el.querySelector('span');
            if (span && span.textContent !== labelText) {
                span.textContent = labelText;
            }

            // Position (World to Screen)
            // Assuming Camera is static at (0,0) offset but centered?
            // In RenderSystem we translate center?
            // Actually RenderSystem translates to entity position.
            // We need to know where the camera is.
            // In this engine, camera is static?
            // Wait, RenderSystem does: ctx.translate(transform.x, transform.y) ONLY for the entity.
            // It does NOT have a global camera translate. The player moves ON SCREEN?
            // Checking MovementSystem: transform.x += velocity.
            // If the canvas covers the whole world, then x/y are screen coordinates (if world = screen).
            // But main.js sets canvas.width = window.innerWidth.
            // And logic uses this.canvas.width.
            // So Entity (x,y) IS Screen (x,y).

            const t = poi.getComponent('TransformComponent');
            if (t) {
                el.style.left = `${t.x}px`;
                el.style.top = `${t.y - 60}px`; // Offset above

                // Bobbing effect handled via CSS animation usually
            }
        }
    }
}

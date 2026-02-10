import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent, AIComponent, SupportComponent, SpriteComponent } from '../components/Components.js';
import { HealthComponent, ScoreComponent } from '../components/StatsComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { BossComponent } from '../components/BossComponent.js';
import { WavesConfig } from '../data/WavesConfig.js';
import { Animations } from '../data/AssetManifest.js';

export class WaveManager {
    constructor(entityManager, width, height, assetLoader) {
        this.entityManager = entityManager;
        this.width = width;
        this.height = height;
        this.assetLoader = assetLoader;

        this.currentTime = 0;
        this.currentWaveIndex = -1;
        this.pendingSpawns = []; // Liste des ennemis à spawner {type, time}

        this.timeDisplay = document.getElementById('time-display');
        this.bossHealthBarContainer = document.getElementById('boss-health-container');
        this.bossHealthBar = document.getElementById('boss-health-fill');
    }

    setWorldBounds(width, height) {
        this.width = width;
        this.height = height;
    }

    setMap(mapGrid, tileSize) {
        this.mapGrid = mapGrid;
        this.mapTileSize = tileSize;
    }

    update(dt) {
        this.currentTime += dt;

        // Update Timer UI
        if (this.timeDisplay) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = Math.floor(this.currentTime % 60);
            this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Check Boss State
        const boss = this.entityManager.getEntities().find(e => e.hasComponent('BossComponent'));
        if (boss) {
            this.bossSpawned = true;
        } else if (this.bossSpawned && !this.bossDefeated) {
            // Boss was spawned but now is gone -> Defeated
            this.bossDefeated = true;
            this.spawnPortal();
            this.endlessMode = true;
            console.log("Boss Defeated! Portal Spawned. Endless Mode Active.");
        }

        // 1. Wave Logic
        if (!this.endlessMode) {
            const nextWave = WavesConfig[this.currentWaveIndex + 1];
            if (nextWave && this.currentTime >= nextWave.time) {
                this.startWave(nextWave);
                this.currentWaveIndex++;
            }
        } else {
            // Endless Logic
            this.difficultyMultiplier += dt * 0.005; // Scaling
            this.endlessWaveTimer -= dt;
            if (this.endlessWaveTimer <= 0) {
                this.spawnEndlessWave();
                this.endlessWaveTimer = 30; // Every 30s
            }
        }

        // 2. Spawn Queue
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const spawn = this.pendingSpawns[i];
            spawn.delay -= dt;

            if (spawn.delay <= 0) {
                this.spawnEnemy(spawn.type);
                this.pendingSpawns.splice(i, 1);
            }
        }

        // 3. Filler Logic (Ensure constant presence)
        this.checkFiller();

        // 4. Update Boss Health UI
        this.updateBossUI();
    }

    checkFiller() {
        const entities = this.entityManager.getEntities();

        // Count Enemies
        let enemyCount = 0;
        let hasBoss = false;

        for (const e of entities) {
            if (e.tags.has('enemy') && e.active) {
                enemyCount++;
                if (e.hasComponent('BossComponent')) hasBoss = true;
            }
        }

        // Filler Conditions: No Boss, Low Enemy Count
        // Don't spawn filler if a huge wave is currently spawning (pendingSpawns > 0) to avoid lag
        if (!hasBoss && enemyCount < 5 && this.pendingSpawns.length === 0) {
            // Spawn a small group of 3 weak enemies immediately
            for (let i = 0; i < 3; i++) {
                this.spawnEnemy('tier1');
            }
        }
    }

    startWave(waveData) {
        console.log(`Starting Wave at ${waveData.time}s`);
        let currentDelay = 0;

        for (const enemyGroup of waveData.enemies) {
            for (let i = 0; i < enemyGroup.count; i++) {
                this.pendingSpawns.push({
                    type: enemyGroup.type,
                    delay: currentDelay
                });
                currentDelay += enemyGroup.interval;
            }
        }
    }

    spawnPortal() {
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (player) {
            const t = player.getComponent('TransformComponent');
            const portal = this.entityManager.createEntity();
            portal.tags.add('poi'); // Use POI tag for identification

            portal.addComponent(new TransformComponent());
            const pt = portal.getComponent('TransformComponent');
            // Check for valid map position?
            // Just spawn near player, assuming player is in valid spot
            pt.x = t.x + 100;
            pt.y = t.y + 100;

            portal.addComponent(new RenderComponent());
            const r = portal.getComponent('RenderComponent');
            r.color = '#ff00ff';
            r.shape = 'rect'; // Or sprite if available
            r.width = 60;
            r.height = 90;
            r.layer = 2;

            portal.addComponent(new InteractableComponent());
            const i = portal.getComponent('InteractableComponent');
            i.action = 'end_run';
            i.label = 'EXIT RUN';

            portal.addComponent(new ColliderComponent());
            const c = portal.getComponent('ColliderComponent');
            c.radius = 50;
            c.isTrigger = true;

            this.portalSpawned = true;
        }
    }

    spawnEndlessWave() {
        const count = 20 * this.difficultyMultiplier;
        // Simple composition
        for(let i=0; i<count; i++) {
            const r = Math.random();
            let type = 'tier1';
            if (r > 0.6) type = 'tier2';
            if (r > 0.8) type = 'shooter';
            if (r > 0.9) type = 'charger';

            this.pendingSpawns.push({ type: type, delay: i * 0.2 });
        }
    }

    updateBossUI() {
        // Find Boss
        const entities = this.entityManager.getEntities();
        let boss = null;
        for (const e of entities) {
            if (e.active && e.hasComponent('BossComponent') && e.hasComponent('HealthComponent')) {
                boss = e;
                break;
            }
        }

        if (boss && this.bossHealthBarContainer && this.bossHealthBar) {
            this.bossHealthBarContainer.classList.remove('hidden');
            const h = boss.getComponent('HealthComponent');
            const percent = (h.current / h.max) * 100;
            this.bossHealthBar.style.width = `${percent}%`;
        } else if (this.bossHealthBarContainer) {
            this.bossHealthBarContainer.classList.add('hidden');
        }
    }

    spawnEnemy(type) {
        const enemy = this.entityManager.createEntity();
        enemy.tags.add('enemy');
        enemy.name = type; // For Bestiary tracking

        // Find Player Position to spawn relative to view
        let px = this.width / 2;
        let py = this.height / 2;
        const player = this.entityManager.getEntities().find(e => e.tags.has('player'));
        if (player) {
            const pt = player.getComponent('TransformComponent');
            px = pt.x;
            py = pt.y;
        }

        // Spawn Radius: Just outside screen (approx 1000px radius or rectangle)
        // Let's use a circle around player
        const spawnRadius = 800; // Enough to be offscreen usually
        const angle = Math.random() * Math.PI * 2;

        let x = px + Math.cos(angle) * spawnRadius;
        let y = py + Math.sin(angle) * spawnRadius;

        // Clamp to World Bounds
        x = Math.max(50, Math.min(x, this.width - 50));
        y = Math.max(50, Math.min(y, this.height - 50));

        // Check Wall Collision (Retry a few times if inside wall)
        if (this.mapGrid) {
            for(let i=0; i<5; i++) {
                const c = Math.floor(x / this.mapTileSize);
                const r = Math.floor(y / this.mapTileSize);
                if (r >= 0 && c >= 0 && r < this.mapGrid.length && c < this.mapGrid[0].length) {
                    if (this.mapGrid[r][c] === 0) break; // Valid
                }
                // Try another angle
                const newAngle = angle + (Math.random() - 0.5) * 2;
                x = px + Math.cos(newAngle) * spawnRadius;
                y = py + Math.sin(newAngle) * spawnRadius;
                x = Math.max(50, Math.min(x, this.width - 50));
                y = Math.max(50, Math.min(y, this.height - 50));
            }
        }

        enemy.addComponent(new TransformComponent());
        const t = enemy.getComponent('TransformComponent');
        t.x = x;
        t.y = y;

        enemy.addComponent(new VelocityComponent());
        const v = enemy.getComponent('VelocityComponent');

        enemy.addComponent(new AIComponent());
        const ai = enemy.getComponent('AIComponent');
        ai.detectionRadius = 800; // Voient loin

        enemy.addComponent(new ColliderComponent());
        const c = enemy.getComponent('ColliderComponent');
        c.radius = 16;
        c.tags = ['enemy'];

        enemy.addComponent(new HealthComponent());
        const h = enemy.getComponent('HealthComponent');

        enemy.addComponent(new ScoreComponent());
        const s = enemy.getComponent('ScoreComponent');

        enemy.addComponent(new RenderComponent());
        const r = enemy.getComponent('RenderComponent');
        r.shape = 'rect';
        r.width = 32;
        r.height = 32;
        r.layer = 5;

        // Elemental (Default none)
        enemy.addComponent(new ElementalComponent());

        // Helper to load anims
        const setupSprite = (animPrefix, defaultAnim = 'walk') => {
            if (!this.assetLoader || !Animations[animPrefix]) return;

            const keys = Animations[animPrefix];
            const imgs = keys.map(k => this.assetLoader.get(k)).filter(i => i);

            if (imgs.length > 0) {
                enemy.addComponent(new SpriteComponent());
                const sprite = enemy.getComponent('SpriteComponent');
                sprite.animations[defaultAnim] = imgs;
                sprite.currentAnimation = defaultAnim;

                // Try to find attack
                const attackKeys = Animations[animPrefix.split('_')[0] + '_attack'];
                if (attackKeys) {
                    const atkImgs = attackKeys.map(k => this.assetLoader.get(k)).filter(i => i);
                    if (atkImgs.length > 0) sprite.animations['attack'] = atkImgs;
                }
            }
        };

        // Config selon le Type
        // Apply Difficulty Multiplier
        const mult = this.difficultyMultiplier;

        if (type === 'tier1') {
            v.speed = 80 + Math.random() * 40;
            h.current = h.max = 50 * mult;
            s.value = 10;
            r.color = '#ff3333';

            setupSprite('zombie_walk');

            // 50% de chance d'être "HUILEUX"
            if (Math.random() > 0.5) {
                enemy.getComponent('ElementalComponent').tags.add('oil');
                r.color = '#440044';
            }

        } else if (type === 'tier2') {
            v.speed = 60;
            h.current = h.max = 150 * mult;
            s.value = 50;
            r.color = '#aa00aa';
            r.width = 48;
            r.height = 48;
            c.radius = 24;

            setupSprite('skeleton_walk');

        } else if (type === 'boss1') {
            v.speed = 40;
            h.current = h.max = 5000 * mult;
            s.value = 1000;
            r.color = '#ff0000';
            r.width = 128;
            r.height = 128;
            c.radius = 64;

            enemy.addComponent(new BossComponent());
            enemy.getComponent('ElementalComponent').tags.add('fire');

            setupSprite('boss_idle', 'idle');
            // Manual attack override
            if (this.assetLoader && Animations['boss_attack']) {
                const s = enemy.getComponent('SpriteComponent');
                if (s) {
                    s.animations['attack'] = Animations['boss_attack'].map(k => this.assetLoader.get(k)).filter(i => i);
                }
            }

        } else if (type === 'shooter') {
            v.speed = 70;
            h.current = h.max = 80 * mult;
            s.value = 30;
            r.color = '#ff00ff'; // Magenta
            r.shape = 'circle'; // Distinct shape

            ai.behavior = 'shooter';
            ai.shootRange = 350;
            ai.shootTimer = Math.random() * 2; // Random offset

        } else if (type === 'charger') {
            v.speed = 50;
            h.current = h.max = 120 * mult;
            s.value = 40;
            r.color = '#ffaa00';
            r.width = 40;
            r.height = 40;

            ai.behavior = 'charger';
            ai.chargeTimer = 2 + Math.random();

            setupSprite('orc_walk'); // Reuse Orc for Charger

        } else if (type === 'healer') {
            v.speed = 40;
            h.current = h.max = 60 * mult;
            s.value = 50;
            r.color = '#00ff00'; // Green
            r.shape = 'circle';
            r.width = 24;
            r.height = 24;

            enemy.addComponent(new SupportComponent());
            const sup = enemy.getComponent('SupportComponent');
            sup.type = 'healer';
            sup.effectStrength = 20;

        } else if (type === 'buffer') {
            v.speed = 90;
            h.current = h.max = 40 * mult;
            s.value = 50;
            r.color = '#00ffff'; // Cyan
            r.shape = 'circle';
            r.width = 24;
            r.height = 24;

            enemy.addComponent(new SupportComponent());
            const sup = enemy.getComponent('SupportComponent');
            sup.type = 'buffer';
            sup.range = 300;

        } else if (type === 'ghost') {
            v.speed = 40; // Slow but direct
            h.current = h.max = 40 * mult;
            s.value = 20;
            r.color = 'rgba(255, 255, 255, 0.5)'; // Transparent white
            r.shape = 'circle';

            ai.behavior = 'ghost';
            c.tags.push('ghost'); // For physics filter

        } else if (type === 'kamikaze') {
            v.speed = 120; // Very fast
            h.current = h.max = 20 * mult;
            s.value = 30;
            r.color = '#ffaa00'; // Orange warning
            r.shape = 'rect'; // distinct

            ai.behavior = 'kamikaze';
        }
    }
}

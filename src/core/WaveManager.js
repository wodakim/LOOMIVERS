import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent, AIComponent } from '../components/Components.js';
import { HealthComponent, ScoreComponent } from '../components/StatsComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { BossComponent } from '../components/BossComponent.js';
import { WavesConfig } from '../data/WavesConfig.js';

export class WaveManager {
    constructor(entityManager, width, height) {
        this.entityManager = entityManager;
        this.width = width;
        this.height = height;

        this.currentTime = 0;
        this.currentWaveIndex = -1;
        this.pendingSpawns = []; // Liste des ennemis à spawner {type, time}

        this.timeDisplay = document.getElementById('time-display');
        this.bossHealthBarContainer = document.getElementById('boss-health-container'); // À créer
        this.bossHealthBar = document.getElementById('boss-health-fill'); // À créer
    }

    update(dt) {
        this.currentTime += dt;

        // Update Timer UI
        if (this.timeDisplay) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = Math.floor(this.currentTime % 60);
            this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // 1. Vérifier si une nouvelle vague doit démarrer
        const nextWave = WavesConfig[this.currentWaveIndex + 1];
        if (nextWave && this.currentTime >= nextWave.time) {
            this.startWave(nextWave);
            this.currentWaveIndex++;
        }

        // 2. Gérer les spawns en attente
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const spawn = this.pendingSpawns[i];
            spawn.delay -= dt;

            if (spawn.delay <= 0) {
                this.spawnEnemy(spawn.type);
                this.pendingSpawns.splice(i, 1);
            }
        }

        // 3. Update Boss Health UI
        this.updateBossUI();
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

        // Position : Bord de l'écran (aléatoire)
        const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
        let x, y;
        const padding = 50;

        switch(side) {
            case 0: x = Math.random() * this.width; y = -padding; break;
            case 1: x = this.width + padding; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height + padding; break;
            case 3: x = -padding; y = Math.random() * this.height; break;
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

        // Config selon le Type
        if (type === 'tier1') {
            v.speed = 80 + Math.random() * 40;
            h.current = h.max = 30;
            s.value = 10;
            r.color = '#ff3333'; // Rouge

            // 50% de chance d'être "HUILEUX" (Noir/Violet foncé)
            if (Math.random() > 0.5) {
                enemy.getComponent('ElementalComponent').tags.add('oil');
                r.color = '#440044';
            }

        } else if (type === 'tier2') {
            v.speed = 60;
            h.current = h.max = 100;
            s.value = 50;
            r.color = '#aa00aa'; // Violet
            r.width = 48;
            r.height = 48;
            c.radius = 24;
        } else if (type === 'boss1') {
            v.speed = 40;
            h.current = h.max = 2000;
            s.value = 1000;
            r.color = '#ff0000'; // Rouge vif
            r.width = 128;
            r.height = 128;
            c.radius = 64;

            enemy.addComponent(new BossComponent());

            // Le boss est élémentaire (FEU + HUILE = DANGEREUX)
            enemy.getComponent('ElementalComponent').tags.add('fire');

        } else if (type === 'shooter') {
            v.speed = 70;
            h.current = h.max = 50;
            s.value = 30;
            r.color = '#ff00ff'; // Magenta
            r.shape = 'circle'; // Distinct shape

            ai.behavior = 'shooter';
            ai.shootRange = 350;
            ai.shootTimer = Math.random() * 2; // Random offset

        } else if (type === 'charger') {
            v.speed = 50; // Base speed slow
            h.current = h.max = 80;
            s.value = 40;
            r.color = '#ffaa00'; // Orange
            r.width = 40;
            r.height = 40;

            ai.behavior = 'charger';
            ai.chargeTimer = 2 + Math.random();
        }
    }
}

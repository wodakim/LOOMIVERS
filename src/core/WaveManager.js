import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent, AIComponent } from '../components/Components.js';
import { HealthComponent, ScoreComponent } from '../components/StatsComponents.js';
import { ElementalComponent } from '../components/ElementalComponents.js';
import { WavesConfig } from '../data/WavesConfig.js';

export class WaveManager {
    constructor(entityManager, width, height) {
        this.entityManager = entityManager;
        this.width = width;
        this.height = height;

        this.currentTime = 0;
        this.currentWaveIndex = -1;
        this.pendingSpawns = []; // Liste des ennemis à spawner {type, time}
    }

    update(dt) {
        this.currentTime += dt;

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
        }
    }
}

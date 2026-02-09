import { System } from '../ecs/System.js';
import { TransformComponent, VelocityComponent, RenderComponent, ColliderComponent } from '../components/Components.js';
import { HealthComponent, FloatingTextComponent, ScoreComponent } from '../components/StatsComponents.js';
import { ProjectileComponent } from '../components/WeaponComponents.js';

export class DamageSystem extends System {
    constructor(entityManager, physicsSystem, particleSystem, progressionSystem, alchemySystem, audioSystem) {
        super(entityManager);
        this.physicsSystem = physicsSystem;
        this.particleSystem = particleSystem;
        this.progressionSystem = progressionSystem;
        this.alchemySystem = alchemySystem;
        this.audioSystem = audioSystem;
        this.scoreElement = document.getElementById('score-display');
        this.score = 0;
    }

    update(dt) {
        const entities = this.entityManager.getEntities();
        const grid = this.physicsSystem.grid;

        // 1. Détection des collisions "Trigger" (Projectiles) via le SpatialHash
        // Pour chaque projectile actif
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('ProjectileComponent') && entity.hasComponent('ColliderComponent') && entity.hasComponent('TransformComponent')) {
                this.checkProjectileCollision(entity, grid);
            }

            // Gestion des Textes Flottants
            if (entity.active && entity.hasComponent('FloatingTextComponent')) {
                const ft = entity.getComponent('FloatingTextComponent');
                ft.lifetime -= dt;

                // Effet de montée du texte
                if (entity.hasComponent('TransformComponent')) {
                    entity.getComponent('TransformComponent').y -= 20 * dt;
                }

                if (ft.lifetime <= 0) {
                    this.entityManager.removeEntity(entity);
                }
            }
        }

        // 2. Mise à jour de l'UI (Score)
        if (this.scoreElement) {
             this.scoreElement.textContent = `SCORE: ${this.score.toString().padStart(5, '0')}`;
        }

        // 3. Vérification globale des morts (pour les dégâts environnementaux qui ne passent pas par applyDamage)
        for (const entity of entities) {
            if (entity.active && entity.hasComponent('HealthComponent')) {
                const health = entity.getComponent('HealthComponent');
                if (health.current <= 0 && !health.isDead) {
                    health.isDead = true;
                    if (this.audioSystem) {
                         this.audioSystem.playTone(100, 'sawtooth', 0.1, 0.3);
                    }
                    this.killEntity(entity);
                }
            }
        }
    }

    checkProjectileCollision(projectileEntity, grid) {
        const projectileTransform = projectileEntity.getComponent('TransformComponent');
        const projectileCollider = projectileEntity.getComponent('ColliderComponent');
        const projectileData = projectileEntity.getComponent('ProjectileComponent');

        // Récupération des entités dans la même case de la grille
        const col = Math.floor(projectileTransform.x / this.physicsSystem.cellSize);
        const row = Math.floor(projectileTransform.y / this.physicsSystem.cellSize);
        const key = `${col},${row}`;

        const cellEntities = grid.get(key);
        if (!cellEntities) return;

        for (const target of cellEntities) {
            // Vérifier si la cible est valide (tags)
            let isValidTarget = false;
            for (const tag of projectileCollider.tags) {
                if (target.tags.has(tag)) {
                    isValidTarget = true;
                    break;
                }
            }
            if (!isValidTarget) continue;

            if (target.hasComponent('ColliderComponent') && target.hasComponent('HealthComponent') && target.hasComponent('TransformComponent')) {
                const targetTransform = target.getComponent('TransformComponent');
                const targetCollider = target.getComponent('ColliderComponent');

                // Collision Cercle-Cercle
                const dx = projectileTransform.x - targetTransform.x;
                const dy = projectileTransform.y - targetTransform.y;
                const distSq = dx * dx + dy * dy;
                const minDist = projectileCollider.radius + targetCollider.radius;

                if (distSq < minDist * minDist) {
                    // Touché !
                    this.applyDamage(target, projectileData.damage);

                    // Alchemy System Check
                    if (this.alchemySystem) {
                        this.alchemySystem.onProjectileHit(projectileEntity, target);
                    }

                    // Détruire le projectile
                    this.entityManager.removeEntity(projectileEntity);
                    return; // Un projectile ne touche qu'une cible pour l'instant
                }
            }
        }
    }

    applyDamage(target, amount) {
        const health = target.getComponent('HealthComponent');
        health.current -= amount;

        // Sound Hit
        if (this.audioSystem) {
            // Volume bas pour les hits pour ne pas saturer
            this.audioSystem.playNoise(0.05, 0.2);
        }

        // Afficher Floating Text
        this.spawnFloatingText(target, amount);

        // Particules de sang/impact
        if (this.particleSystem) {
             const t = target.getComponent('TransformComponent');
             const color = target.getComponent('RenderComponent') ? target.getComponent('RenderComponent').color : '#fff';
             this.particleSystem.emit(t.x, t.y, 5, color);
        }

        // Trigger Alchemy (Explosions ?) via AlchemySystem
        // Note: L'appelant (checkProjectileCollision) a accès au projectile, pas nous ici directement facilement.
        // Refactoring mineur: on passe le projectile à applyDamage ou on appelle onProjectileHit avant.

        if (health.current <= 0 && !health.isDead) {
            health.isDead = true;
            if (this.audioSystem) {
                // Son plus grave pour la mort
                this.audioSystem.playTone(100, 'sawtooth', 0.1, 0.3);
            }
            this.killEntity(target);
        }
    }

    spawnFloatingText(target, amount) {
        const transform = target.getComponent('TransformComponent');
        const textEntity = this.entityManager.createEntity();

        textEntity.addComponent(new TransformComponent());
        const t = textEntity.getComponent('TransformComponent');
        t.x = transform.x;
        t.y = transform.y - 20;

        textEntity.addComponent(new FloatingTextComponent());
        const ft = textEntity.getComponent('FloatingTextComponent');
        ft.text = amount.toString();
        ft.color = '#fff';

        // Pas de RenderComponent classique, le RenderSystem devra gérer le FloatingTextComponent
        // OU on crée un RenderComponent spécial 'text'.
        // Pour simplifier, on modifie RenderSystem pour gérer FloatingTextComponent.
    }

    killEntity(entity) {
        // Score & Gold (Score = Gold pour simplifier ici, ou ratio 1:1)
        if (entity.hasComponent('ScoreComponent')) {
            const val = entity.getComponent('ScoreComponent').value;
            this.score += val;

            // Sauvegarde de l'or (On ajoute au profil global via SaveSystem)
            // Note: Pour les perfs, il vaut mieux le faire en fin de partie,
            // mais ici on va le faire "à la volée" ou via GameManager lors du Game Over.
            // Pour l'instant, on stocke juste dans le score courant.
        }

        // Spawn XP Gem
        if (this.progressionSystem && entity.hasComponent('TransformComponent')) {
            const t = entity.getComponent('TransformComponent');
            // Valeur XP dépend du score ou fixe
            const xpValue = entity.hasComponent('ScoreComponent') ? Math.ceil(entity.getComponent('ScoreComponent').value / 5) : 1;
            this.progressionSystem.spawnXPGem(t.x, t.y, xpValue);
        }

        // Effet de mort (particules plus tard)
        this.entityManager.removeEntity(entity);
    }
}

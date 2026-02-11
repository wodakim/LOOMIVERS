import { WeaponTypes } from '../data/WeaponTypes.js';
import { BestiaryEntries } from '../data/BestiaryData.js';

export const GameState = {
    MENU: 'MENU',
    HUB: 'HUB',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    SHOP: 'SHOP',
    VICTORY: 'VICTORY',
    LEVELUP: 'LEVELUP',
    LEADERBOARD: 'LEADERBOARD',
    WARDROBE: 'WARDROBE'
};

export class GameManager {
    constructor(game) {
        this.game = game;
        this.state = GameState.MENU;
        this.previousState = null;

        // UI Elements
        this.menuScreen = document.getElementById('menu-screen');
        this.shopScreen = document.getElementById('shop-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        this.wardrobeScreen = document.getElementById('wardrobe-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.levelUpScreen = document.getElementById('levelup-screen');
        this.optionsScreen = document.getElementById('options-screen');
        this.creditsScreen = document.getElementById('credits-screen');
        this.bestiaryScreen = document.getElementById('bestiary-screen');
        this.bestiaryGrid = document.getElementById('bestiary-grid');
        this.cardsContainer = document.getElementById('cards-container');
        this.leaderboardList = document.getElementById('leaderboard-list');

        this.finalScoreElement = document.getElementById('final-score');
        this.victoryScoreElement = document.getElementById('victory-score');

        // Buttons
        this.initButtons();
        this.initInput();

        // Wardrobe listeners
        this.initWardrobe();

        // Load Player Color
        const data = this.game.saveSystem.load();
        if (data && data.playerColor) {
            this.game.playerColor = data.playerColor;
        }

        // Initial State
        this.showScreen(this.menuScreen);
    }

    initButtons() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const victoryRestartBtn = document.getElementById('victory-restart-btn');
        const shopBtn = document.getElementById('shop-btn');
        const backBtn = document.getElementById('back-btn');
        const lbCloseBtn = document.getElementById('leaderboard-close-btn');
        const wdCloseBtn = document.getElementById('wardrobe-close-btn');
        const bestiaryCloseBtn = document.getElementById('bestiary-close-btn');

        // New Buttons
        const optionsBtn = document.getElementById('options-btn');
        const creditsBtn = document.getElementById('credits-btn');
        const optionsBackBtn = document.getElementById('options-back-btn');
        const creditsBackBtn = document.getElementById('credits-back-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const pauseOptionsBtn = document.getElementById('pause-options-btn');
        const quitBtn = document.getElementById('quit-btn');

        // Volume Controls
        const masterVol = document.getElementById('master-volume');
        const muteToggle = document.getElementById('mute-toggle');
        const volValue = document.getElementById('volume-value');

        if (startBtn) startBtn.addEventListener('click', () => this.enterHub());
        if (restartBtn) restartBtn.addEventListener('click', () => this.enterHub());
        if (victoryRestartBtn) victoryRestartBtn.addEventListener('click', () => this.enterHub());

        if (shopBtn) shopBtn.addEventListener('click', () => this.openShop());
        if (backBtn) backBtn.addEventListener('click', () => this.closeShop());
        if (lbCloseBtn) lbCloseBtn.addEventListener('click', () => this.closeOverlay());
        if (wdCloseBtn) wdCloseBtn.addEventListener('click', () => this.closeOverlay());
        if (bestiaryCloseBtn) bestiaryCloseBtn.addEventListener('click', () => this.closeOverlay());

        // New Listeners
        if (optionsBtn) optionsBtn.addEventListener('click', () => this.showOptions(GameState.MENU));
        if (creditsBtn) creditsBtn.addEventListener('click', () => this.showCredits());
        if (optionsBackBtn) optionsBackBtn.addEventListener('click', () => this.closeOptions());
        if (creditsBackBtn) creditsBackBtn.addEventListener('click', () => this.closeCredits());

        if (resumeBtn) resumeBtn.addEventListener('click', () => this.togglePause());
        if (pauseOptionsBtn) pauseOptionsBtn.addEventListener('click', () => this.showOptions(GameState.PAUSED));
        if (quitBtn) quitBtn.addEventListener('click', () => this.quitToTitle());

        if (masterVol) {
            masterVol.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                this.game.audioSystem.setMasterVolume(val);
                if (volValue) volValue.textContent = `${e.target.value}%`;
            });
        }

        if (muteToggle) {
            muteToggle.addEventListener('change', (e) => {
                this.game.audioSystem.toggleMute();
            });
        }

        // Shop Item Buttons
        const upgradeKeys = [
            'health_boost', 'damage_boost', 'speed_boost',
            'unlock_whip', 'unlock_mines', 'unlock_orbital', 'unlock_turret'
        ];

        upgradeKeys.forEach(key => {
            const btn = document.getElementById(`buy-${key}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.buyUpgrade(key);
                });
            }
        });
    }

    initWardrobe() {
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.setPlayerColor(color);
            });
        });
    }

    setPlayerColor(color) {
        this.game.playerColor = color;
        // Update current player entity if exists
        const player = this.game.entityManager.getEntities().find(e => e.tags.has('player'));
        if (player) {
            const render = player.getComponent('RenderComponent');
            if (render) {
                render.color = color;
            }
        }
        // Save choice
        const data = this.game.saveSystem.load() || {};
        data.playerColor = color;
        this.game.saveSystem.save(data);
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                this.togglePause();
            }
        });
    }

    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.game.stop();
            this.showScreen(this.pauseScreen, false);
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.pauseScreen.classList.add('hidden');
            this.game.gameLoop.start();
        }
    }

    enterHub() {
        console.log('Entering HUB...');
        this.state = GameState.HUB;
        this.hideAllScreens();

        // Reset Logic but keep upgrades
        this.game.reset(); // Will trigger initWorld

        // Setup HUB World
        this.game.initHub();

        this.game.gameLoop.start();
    }

    closeOverlay() {
        // Return to HUB state
        this.state = GameState.HUB;
        this.hideAllScreens();
    }

    startGame() {
        console.log('Game Starting (Run)...');
        this.state = GameState.PLAYING;
        // Clean Entities (Remove Hub POIs)
        // Re-init World for Run
        this.game.reset();
        this.game.initWorld(); // Run Setup
        this.game.gameLoop.start();
    }

    // ... (Existing methods: showLevelUp, closeLevelUp, restartGame, openShop, closeShop, buyUpgrade, updateShopUI) ...
    // Note: restartGame now calls enterHub instead of startGame directly in UI buttons.

    restartGame() {
        this.enterHub();
    }

    showLevelUp(choices, onSelectCallback) {
        this.state = GameState.LEVELUP;
        this.game.stop();

        // If choices is empty (e.g. maxed out), use generic heal?
        // But for now we assume choices provided by ProgressionSystem or TraitSystem

        this.cardsContainer.innerHTML = '';

        // Use TraitSystem to get options if choices not provided (or mixed)
        // Currently ProgressionSystem handles this.
        // Let's assume choices are passed correctly.

        choices.forEach(choice => {
            const card = document.createElement('div');
            card.className = 'card';
            if (choice.rarity) card.classList.add(choice.rarity); // css styling

            let icon = '?';
            if (choice.type === 'stat') icon = '⚡';
            if (choice.type === 'heal') icon = '❤';
            if (choice.type === 'weapon') icon = '⚔';
            if (choice.type === 'weapon_mod' || choice.type === 'projectile_mod') icon = '🔮';

            const color = choice.rarity === 'legendary' ? '#ffaa00' : (choice.rarity === 'rare' ? '#00ccff' : '#ffffff');

            card.innerHTML = `
                <div class="card-icon" style="color:${color}; border-color:${color};">${icon}</div>
                <h3 style="color:${color};">${choice.name}</h3>
                <p style="color:#ccc;">${choice.description || choice.desc}</p>
                ${choice.rarity ? `<span style="font-size:10px; text-transform:uppercase; color:${color};">${choice.rarity}</span>` : ''}
            `;

            card.addEventListener('click', () => {
                onSelectCallback(choice);
                this.closeLevelUp();
            });

            this.cardsContainer.appendChild(card);
        });

        this.showScreen(this.levelUpScreen, false);
    }

    closeLevelUp() {
        this.state = GameState.PLAYING;
        this.levelUpScreen.classList.add('hidden');
        this.game.gameLoop.start();
    }

    openShop() {
        this.state = GameState.SHOP;
        this.updateShopUI();
        this.showScreen(this.shopScreen);
    }

    closeShop() {
        this.state = GameState.MENU;
        this.showScreen(this.menuScreen);
    }

    showOptions(fromState) {
        this.previousState = fromState;
        this.state = GameState.MENU; // Logic state
        this.showScreen(this.optionsScreen);
    }

    closeOptions() {
        if (this.previousState === GameState.PAUSED) {
            this.state = GameState.PAUSED;
            this.showScreen(this.pauseScreen, false);
        } else {
            this.state = GameState.MENU;
            this.showScreen(this.menuScreen);
        }
    }

    showCredits() {
        this.showScreen(this.creditsScreen);
    }

    closeCredits() {
        this.showScreen(this.menuScreen);
    }

    quitToTitle() {
        console.log('Quitting to Title...');
        this.game.stop();
        this.state = GameState.MENU;
        this.showScreen(this.menuScreen);
        // Optional: Clear ECS to free memory, though reset() does it on start
    }

    showLeaderboard() {
        this.state = GameState.LEADERBOARD;
        if (this.leaderboardList) this.leaderboardList.innerHTML = '';

        const data = this.game.saveSystem.load() || { highScores: [] };
        const scores = data.highScores || [];

        if (scores.length === 0) {
            if (this.leaderboardList) this.leaderboardList.innerHTML = '<li>No scores yet!</li>';
        } else {
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.textContent = `#${index + 1} - ${entry.score} pts - ${new Date(entry.date).toLocaleDateString()}`;
                if (this.leaderboardList) this.leaderboardList.appendChild(li);
            });
        }

        this.showScreen(this.leaderboardScreen);
    }

    showWardrobe() {
        this.state = GameState.WARDROBE;
        // Could highlight current color
        this.showScreen(this.wardrobeScreen);
    }

    buyUpgrade(key) {
        if (this.game.upgradeManager.buyUpgrade(key)) {
            this.updateShopUI();
        } else {
            console.log("Cannot buy upgrade: " + key);
        }
    }

    updateShopUI() {
        const gold = this.game.upgradeManager.getGold();
        const goldEl = document.getElementById('shop-gold');
        if (goldEl) goldEl.textContent = gold;

        const upgrades = this.game.upgradeManager.upgrades;
        for (const key in upgrades) {
            const upg = upgrades[key];
            const lvlEl = document.getElementById(`lvl-${key}`);
            const costEl = document.getElementById(`cost-${key}`);
            const btn = document.getElementById(`buy-${key}`);

            if (lvlEl) lvlEl.textContent = `Lvl: ${upg.level}/${upg.maxLevel}`;
            if (costEl) costEl.textContent = upg.level >= upg.maxLevel ? "MAX" : `${upg.cost} G`;

            if (btn) {
                if (upg.level >= upg.maxLevel) {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                } else if (gold < upg.cost) {
                    btn.classList.add('disabled');
                } else {
                    btn.disabled = false;
                    btn.classList.remove('disabled');
                }
            }
        }
    }

    triggerGameOver(score) {
        this.state = GameState.GAMEOVER;
        if (this.finalScoreElement) this.finalScoreElement.textContent = score;

        this.processEndGame(score);
        console.log(`Game Over. Score: ${score}.`);

        if (this.game.audioSystem) {
            this.game.audioSystem.playGameOver();
        }

        this.showScreen(this.gameOverScreen);
        this.game.stop();
    }

    triggerVictory(score) {
        this.state = GameState.VICTORY;
        if (this.victoryScoreElement) this.victoryScoreElement.textContent = score;

        this.processEndGame(score);
        console.log(`VICTORY! Score: ${score}.`);

        if (this.game.audioSystem) {
            this.game.audioSystem.playLevelUp();
        }

        this.showScreen(this.victoryScreen);
        this.game.stop();
    }

    processEndGame(score) {
        const data = this.game.saveSystem.load() || { gold: 0, highScores: [], killCounts: {} };
        const goldEarned = Math.floor(score * 0.1);

        data.gold = (data.gold || 0) + goldEarned;

        // Handle High Scores List
        if (!data.highScores) data.highScores = [];
        data.highScores.push({ score: score, date: Date.now() });

        // Sort descending
        data.highScores.sort((a, b) => b.score - a.score);

        // Keep top 10
        data.highScores = data.highScores.slice(0, 10);

        // Merge Kills
        const sessionKills = this.game.damageSystem.kills || {};
        if (!data.killCounts) data.killCounts = {};

        for (const [type, count] of Object.entries(sessionKills)) {
            data.killCounts[type] = (data.killCounts[type] || 0) + count;
        }

        this.game.saveSystem.save(data);
    }

    openBestiary() {
        const data = this.game.saveSystem.load() || { killCounts: {} };
        const kills = data.killCounts || {};

        if (this.bestiaryGrid) {
            this.bestiaryGrid.innerHTML = '';

            for (const [key, entry] of Object.entries(BestiaryEntries)) {
                const count = kills[key] || 0;
                const unlocked = count >= entry.minKills;

                const card = document.createElement('div');
                card.style.background = '#222';
                card.style.border = unlocked ? `2px solid ${entry.color}` : '2px solid #444';
                card.style.borderRadius = '10px';
                card.style.padding = '15px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'center';
                card.style.color = '#fff';

                if (unlocked) {
                    card.innerHTML = `
                        <div style="width: 40px; height: 40px; background: ${entry.color}; border-radius: 50%; margin-bottom: 10px;"></div>
                        <h3 style="color: ${entry.color};">${entry.name}</h3>
                        <p style="font-size: 12px; color: #aaa; margin: 5px 0;">${entry.desc}</p>
                        <p style="font-size: 14px; margin-top: auto;">Kills: ${count}</p>
                    `;
                } else {
                    card.innerHTML = `
                        <div style="width: 40px; height: 40px; background: #333; border-radius: 50%; margin-bottom: 10px;">?</div>
                        <h3 style="color: #666;">???</h3>
                        <p style="font-size: 12px; color: #444; margin: 5px 0;">Defeat more to unlock.</p>
                        <p style="font-size: 14px; margin-top: auto;">${count} / ${entry.minKills}</p>
                    `;
                }

                this.bestiaryGrid.appendChild(card);
            }
        }

        this.showScreen(this.bestiaryScreen);
    }

    showScreen(screen, hideOthers = true) {
        if (hideOthers) this.hideAllScreens();
        if (screen) screen.classList.remove('hidden');
    }

    hideAllScreens() {
        if (this.menuScreen) this.menuScreen.classList.add('hidden');
        if (this.shopScreen) this.shopScreen.classList.add('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.victoryScreen) this.victoryScreen.classList.add('hidden');
        if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
        if (this.levelUpScreen) this.levelUpScreen.classList.add('hidden');
        if (this.leaderboardScreen) this.leaderboardScreen.classList.add('hidden');
        if (this.wardrobeScreen) this.wardrobeScreen.classList.add('hidden');
        if (this.optionsScreen) this.optionsScreen.classList.add('hidden');
        if (this.creditsScreen) this.creditsScreen.classList.add('hidden');
        if (this.bestiaryScreen) this.bestiaryScreen.classList.add('hidden');
    }
}

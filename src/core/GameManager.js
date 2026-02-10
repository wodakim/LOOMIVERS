import { WeaponTypes } from '../data/WeaponTypes.js';

export const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    SHOP: 'SHOP',
    VICTORY: 'VICTORY',
    LEVELUP: 'LEVELUP'
};

export class GameManager {
    constructor(game) {
        this.game = game;
        this.state = GameState.MENU;

        // UI Elements
        this.menuScreen = document.getElementById('menu-screen');
        this.shopScreen = document.getElementById('shop-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.levelUpScreen = document.getElementById('levelup-screen');
        this.cardsContainer = document.getElementById('cards-container');

        this.finalScoreElement = document.getElementById('final-score');
        this.victoryScoreElement = document.getElementById('victory-score');

        // Buttons
        this.initButtons();
        this.initInput();

        // Initial State
        this.showScreen(this.menuScreen);
    }

    initButtons() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const victoryRestartBtn = document.getElementById('victory-restart-btn');
        const shopBtn = document.getElementById('shop-btn');
        const backBtn = document.getElementById('back-btn');

        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
        if (victoryRestartBtn) victoryRestartBtn.addEventListener('click', () => this.restartGame());

        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                this.openShop();
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeShop();
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

    showLevelUp(choices, onSelectCallback) {
        this.state = GameState.LEVELUP;
        this.game.stop();

        this.cardsContainer.innerHTML = '';

        choices.forEach(choice => {
            const card = document.createElement('div');
            card.className = 'card';

            // Icon Logic (Simple Text/Char)
            let icon = '?';
            if (choice.type === 'stat') icon = '⚡';
            if (choice.type === 'heal') icon = '❤';
            if (choice.type === 'weapon') icon = '⚔';

            card.innerHTML = `
                <div class="card-icon">${icon}</div>
                <h3>${choice.name}</h3>
                <p>${choice.description}</p>
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

    startGame() {
        console.log('Game Starting...');
        this.state = GameState.PLAYING;
        this.hideAllScreens();
        this.game.start();
    }

    restartGame() {
        this.game.reset();
        this.startGame();
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
        const data = this.game.saveSystem.load() || { gold: 0, highScore: 0 };
        const goldEarned = Math.floor(score * 0.1);

        data.gold = (data.gold || 0) + goldEarned;
        if (score > (data.highScore || 0)) data.highScore = score;

        this.game.saveSystem.save(data);
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
    }
}

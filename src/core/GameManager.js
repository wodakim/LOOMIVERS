export const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
};

export class GameManager {
    constructor(game) {
        this.game = game;
        this.state = GameState.MENU;

        // UI Elements
        this.menuScreen = document.getElementById('menu-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.finalScoreElement = document.getElementById('final-score');

        // Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        // Initial State
        this.showScreen(this.menuScreen);
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.hideAllScreens();
        this.game.start();
    }

    restartGame() {
        this.game.reset(); // Nécessite d'implémenter reset() dans Game
        this.startGame();
    }

    triggerGameOver(score) {
        this.state = GameState.GAMEOVER;
        this.finalScoreElement.textContent = score;
        this.showScreen(this.gameOverScreen);
        this.game.stop();
    }

    showScreen(screen) {
        this.hideAllScreens();
        screen.classList.remove('hidden');
    }

    hideAllScreens() {
        this.menuScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
}

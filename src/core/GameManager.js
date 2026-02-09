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
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('Start Button Clicked');
                this.startGame();
            });
        } else {
            console.error('Start Button not found!');
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log('Restart Button Clicked');
                this.restartGame();
            });
        }

        // Initial State
        this.showScreen(this.menuScreen);
    }

    startGame() {
        console.log('Game Starting...');
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

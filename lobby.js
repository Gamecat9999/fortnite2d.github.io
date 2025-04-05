class Lobby {
    constructor() {
        this.players = [];
        this.isHost = false;
        this.roomCode = null;
        this.playerId = null;
        this.gameId = null;
        this.playerName = '';
        this.botCount = 20;
        this.waitTime = 5000; // 5 seconds
        this.waitTimer = null;
        this.gameState = null;
        
        this.setupEventListeners();
        this.checkExistingGame();
    }

    checkExistingGame() {
        const gameState = localStorage.getItem('gameState');
        if (gameState) {
            const state = JSON.parse(gameState);
            // Only redirect if the game is actively being played and was started recently
            if (state.status === 'playing' && state.gameData && state.startTime) {
                const timeSinceStart = Date.now() - state.startTime;
                // Only redirect if game was started less than 5 minutes ago
                if (timeSinceStart < 5 * 60 * 1000) {
                    window.location.href = 'game.html';
                    return;
                }
            }
            // Clear invalid or expired game state
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameData');
        }
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createGame() {
        if (!this.playerName) {
            alert('Please enter your name first');
            return;
        }

        // Generate a new room code
        this.roomCode = this.generateRoomCode();
        this.playerId = 'player-' + Date.now();
        this.isHost = true;

        // Create initial game state
        this.gameState = {
            roomCode: this.roomCode,
            status: 'waiting',
            players: [{
                id: this.playerId,
                name: this.playerName,
                isHost: true
            }],
            hostId: this.playerId
        };

        // Save to localStorage
        localStorage.setItem('gameState', JSON.stringify(this.gameState));

        // Update UI
        document.querySelector('.room-code').textContent = this.roomCode;
        document.getElementById('copyCode').disabled = false;
        document.getElementById('startGame').disabled = false;
        this.updatePlayerList();
    }

    async joinGame(roomCode) {
        if (!this.playerName) {
            alert('Please enter your name first');
            return;
        }

        // Check if game exists
        const gameState = localStorage.getItem('gameState');
        if (!gameState) {
            alert('Game not found');
            return;
        }

        const state = JSON.parse(gameState);
        if (state.roomCode !== roomCode) {
            alert('Invalid room code');
            return;
        }

        if (state.status !== 'waiting') {
            alert('Game already in progress');
            return;
        }

        // Generate player ID
        this.playerId = 'player-' + Date.now();
        this.roomCode = roomCode;
        this.gameState = state;

        // Add player to game
        this.gameState.players.push({
            id: this.playerId,
            name: this.playerName,
            isHost: false
        });

        // Save updated state
        localStorage.setItem('gameState', JSON.stringify(this.gameState));

        // Update UI
        document.querySelector('.room-code').textContent = this.roomCode;
        document.getElementById('startGame').disabled = true;
        this.updatePlayerList();
    }

    async startGame() {
        if (!this.isHost) {
            alert('Only the host can start the game');
            return;
        }

        // Disable the start button
        const startButton = document.getElementById('startGame');
        startButton.disabled = true;
        startButton.textContent = 'Starting Game...';

        // Start the wait timer
        this.startWaitTimer();
    }

    startWaitTimer() {
        // Clear any existing timer
        if (this.waitTimer) {
            clearTimeout(this.waitTimer);
        }

        // Create and style the countdown container
        const countdownContainer = document.createElement('div');
        countdownContainer.className = 'countdown-container';
        countdownContainer.innerHTML = `
            <div class="countdown-title">Starting Game</div>
            <div class="countdown-timer">5</div>
            <div class="countdown-subtitle">Waiting for players...</div>
        `;
        document.body.appendChild(countdownContainer);

        let timeLeft = this.waitTime / 1000;
        const timerElement = countdownContainer.querySelector('.countdown-timer');

        const countdownInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            // Update subtitle based on time left
            const subtitle = countdownContainer.querySelector('.countdown-subtitle');
            if (timeLeft <= 2) {
                subtitle.textContent = 'Starting with bots...';
            }
        }, 1000);

        // Start the game after the wait time
        this.waitTimer = setTimeout(() => {
            clearInterval(countdownInterval);
            countdownContainer.remove();
            this.startGameWithBots();
        }, this.waitTime);
    }

    startGameWithBots() {
        // Create game data for local play with bots
        const gameData = {
            gameId: 'local-game',
            playerId: this.playerId,
            playerName: this.playerName,
            isLocal: true,
            bots: this.createBots()
        };

        // Update game state
        const gameState = {
            status: 'playing',
            gameData: gameData,
            startTime: Date.now()
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));

        // Open game in new tab first
        const gameWindow = window.open('game.html', '_blank');
        
        // Only clear the screen if the new tab was successfully opened
        if (gameWindow) {
            // Clear the body and show loading message
            document.body.innerHTML = '';
            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Starting game...';
            loadingMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 24px;
                color: white;
            `;
            document.body.appendChild(loadingMessage);
        } else {
            // If popup was blocked, show an error message
            alert('Please allow popups to start the game');
            // Clear game state since we couldn't start the game
            localStorage.removeItem('gameState');
        }
    }

    createBots() {
        const botNames = [
            'BotAlpha', 'BotBeta', 'BotGamma', 'BotDelta', 'BotEpsilon',
            'BotZeta', 'BotEta', 'BotTheta', 'BotIota', 'BotKappa',
            'BotLambda', 'BotMu', 'BotNu', 'BotXi', 'BotOmicron',
            'BotPi', 'BotRho', 'BotSigma', 'BotTau', 'BotUpsilon'
        ];

        const bots = [];
        for (let i = 0; i < this.botCount; i++) {
            bots.push({
                id: `bot-${i}`,
                name: botNames[i],
                isBot: true,
                x: Math.random() * 1500 + 50,
                y: Math.random() * 1000 + 50,
                width: 30,
                height: 30,
                speed: 4,
                health: 100,
                shield: 0,
                weapons: [],
                currentWeapon: null,
                target: null,
                state: 'wander',
                lastStateChange: Date.now(),
                lastShot: 0
            });
        }
        return bots;
    }

    setupEventListeners() {
        // Player name input
        document.getElementById('playerName').addEventListener('input', (e) => {
            this.playerName = e.target.value.trim();
        });

        // Create game button
        document.getElementById('createGame').addEventListener('click', () => {
            this.createGame();
        });

        // Join game button
        document.getElementById('joinGame').addEventListener('click', () => {
            const roomCode = document.getElementById('roomCode').value.trim();
            if (roomCode) {
                this.joinGame(roomCode);
            } else {
                alert('Please enter a room code');
            }
        });

        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });

        // Copy room code button
        document.getElementById('copyCode').addEventListener('click', () => {
            if (this.roomCode) {
                navigator.clipboard.writeText(this.roomCode)
                    .then(() => alert('Room code copied to clipboard!'))
                    .catch(() => alert('Failed to copy room code'));
            }
        });

        // Clear game state when page is unloaded
        window.addEventListener('beforeunload', () => {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameData');
        });
    }

    updatePlayerList() {
        const playerList = document.querySelector('.player-list');
        playerList.innerHTML = '';

        if (this.gameState && this.gameState.players) {
            this.gameState.players.forEach(player => {
                const playerSlot = document.createElement('div');
                playerSlot.className = 'player-slot';
                playerSlot.textContent = `${player.name} ${player.isHost ? '(Host)' : ''}`;
                playerList.appendChild(playerSlot);
            });
        }
    }
}

// Initialize the lobby when the page loads
window.addEventListener('load', () => {
    window.lobby = new Lobby();
}); 
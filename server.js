const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server Running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active games and players
const games = new Map();
const players = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    let playerId = null;
    let gameId = null;

    // Handle incoming messages
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'join':
                handleJoin(ws, data);
                break;
            case 'create':
                handleCreate(ws, data);
                break;
            case 'start':
                handleStart(ws, data);
                break;
            case 'update':
                handleUpdate(ws, data);
                break;
            case 'shoot':
                handleShoot(ws, data);
                break;
            case 'collect':
                handleCollect(ws, data);
                break;
        }
    });

    // Handle disconnections
    ws.on('close', () => {
        if (playerId && gameId) {
            const game = games.get(gameId);
            if (game) {
                game.players = game.players.filter(p => p.id !== playerId);
                broadcastToGame(gameId, {
                    type: 'playerLeft',
                    playerId: playerId
                });
            }
            players.delete(playerId);
        }
    });
});

// Handle player joining a game
function handleJoin(ws, data) {
    const { gameId, playerName } = data;
    const game = games.get(gameId);
    
    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game not found'
        }));
        return;
    }

    if (game.started) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game already started'
        }));
        return;
    }

    const playerId = generateId();
    const player = {
        id: playerId,
        name: playerName,
        x: Math.random() * 4000,
        y: Math.random() * 3000,
        health: 100,
        shield: 0,
        weapons: [],
        isHost: game.players.length === 0
    };

    players.set(playerId, ws);
    game.players.push(player);

    ws.send(JSON.stringify({
        type: 'joined',
        playerId: playerId,
        gameId: gameId,
        isHost: player.isHost,
        players: game.players
    }));

    broadcastToGame(gameId, {
        type: 'playerJoined',
        player: player
    });
}

// Handle game creation
function handleCreate(ws, data) {
    const gameId = generateId();
    const game = {
        id: gameId,
        players: [],
        started: false,
        chests: generateChests(),
        potions: generatePotions()
    };

    games.set(gameId, game);
    ws.send(JSON.stringify({
        type: 'created',
        gameId: gameId
    }));
}

// Handle game start
function handleStart(ws, data) {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (!game) return;

    game.started = true;
    broadcastToGame(gameId, {
        type: 'gameStarted',
        chests: game.chests,
        potions: game.potions
    });
}

// Handle player updates
function handleUpdate(ws, data) {
    const { gameId, playerId, x, y } = data;
    const game = games.get(gameId);
    
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (player) {
        player.x = x;
        player.y = y;
        broadcastToGame(gameId, {
            type: 'playerUpdate',
            playerId: playerId,
            x: x,
            y: y
        });
    }
}

// Handle shooting
function handleShoot(ws, data) {
    const { gameId, playerId, weapon, targetX, targetY } = data;
    broadcastToGame(gameId, {
        type: 'shoot',
        playerId: playerId,
        weapon: weapon,
        targetX: targetX,
        targetY: targetY
    });
}

// Handle item collection
function handleCollect(ws, data) {
    const { gameId, playerId, itemType, itemId } = data;
    const game = games.get(gameId);
    
    if (!game) return;

    if (itemType === 'chest') {
        const chest = game.chests.find(c => c.id === itemId);
        if (chest && !chest.opened) {
            chest.opened = true;
            broadcastToGame(gameId, {
                type: 'chestOpened',
                chestId: itemId,
                playerId: playerId
            });
        }
    } else if (itemType === 'potion') {
        const potion = game.potions.find(p => p.id === itemId);
        if (potion && !potion.collected) {
            potion.collected = true;
            broadcastToGame(gameId, {
                type: 'potionCollected',
                potionId: itemId,
                playerId: playerId
            });
        }
    }
}

// Helper functions
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

function generateChests() {
    const chests = [];
    for (let i = 0; i < 20; i++) {
        chests.push({
            id: generateId(),
            x: Math.random() * 4000,
            y: Math.random() * 3000,
            opened: false,
            weapon: Math.floor(Math.random() * 5),
            ammo: Math.floor(Math.random() * 30) + 10
        });
    }
    return chests;
}

function generatePotions() {
    const potions = [];
    for (let i = 0; i < 15; i++) {
        potions.push({
            id: generateId(),
            x: Math.random() * 4000,
            y: Math.random() * 3000,
            collected: false
        });
    }
    return potions;
}

function broadcastToGame(gameId, message) {
    const game = games.get(gameId);
    if (!game) return;

    game.players.forEach(player => {
        const ws = players.get(player.id);
        if (ws) {
            ws.send(JSON.stringify(message));
        }
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
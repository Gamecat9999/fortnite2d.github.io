<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize game data storage
$games = [];

// Helper function to generate random items
function generateChests($mapType) {
    $chests = [];
    $count = 10;
    $bounds = getMapBounds($mapType);
    
    for ($i = 0; $i < $count; $i++) {
        $chests[] = [
            'id' => uniqid(),
            'x' => rand($bounds['minX'], $bounds['maxX']),
            'y' => rand($bounds['minY'], $bounds['maxY']),
            'opened' => false,
            'weapon' => rand(0, 4),
            'ammo' => rand(10, 30)
        ];
    }
    return $chests;
}

function generatePotions($mapType) {
    $potions = [];
    $count = 15;
    $bounds = getMapBounds($mapType);
    
    for ($i = 0; $i < $count; $i++) {
        $potions[] = [
            'id' => uniqid(),
            'x' => rand($bounds['minX'], $bounds['maxX']),
            'y' => rand($bounds['minY'], $bounds['maxY']),
            'collected' => false
        ];
    }
    return $potions;
}

function getMapBounds($mapType) {
    switch ($mapType) {
        case 'island':
            return ['minX' => 0, 'maxX' => 4000, 'minY' => 0, 'maxY' => 3000];
        case 'desert':
            return ['minX' => 0, 'maxX' => 5000, 'minY' => 0, 'maxY' => 4000];
        case 'snow':
            return ['minX' => 0, 'maxX' => 4500, 'minY' => 0, 'maxY' => 3500];
        default:
            return ['minX' => 0, 'maxX' => 4000, 'minY' => 0, 'maxY' => 3000];
    }
}

// Get request method safely
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($method === 'POST') {
    // Get POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }

    $type = $data['type'] ?? '';
    
    switch ($type) {
        case 'create':
            $gameId = uniqid();
            $mapType = $data['mapType'] ?? 'island';
            $games[$gameId] = [
                'id' => $gameId,
                'mapType' => $mapType,
                'players' => [],
                'started' => false,
                'chests' => generateChests($mapType),
                'potions' => generatePotions($mapType)
            ];
            echo json_encode(['type' => 'created', 'gameId' => $gameId]);
            break;

        case 'join':
            $gameId = $data['gameId'] ?? '';
            $playerName = $data['playerName'] ?? '';
            
            if (!isset($games[$gameId])) {
                echo json_encode(['error' => 'Game not found']);
                exit;
            }

            if ($games[$gameId]['started']) {
                echo json_encode(['error' => 'Game already started']);
                exit;
            }

            $playerId = uniqid();
            $isHost = empty($games[$gameId]['players']);
            
            $games[$gameId]['players'][$playerId] = [
                'id' => $playerId,
                'name' => $playerName,
                'x' => rand(0, getMapBounds($games[$gameId]['mapType'])['maxX']),
                'y' => rand(0, getMapBounds($games[$gameId]['mapType'])['maxY']),
                'health' => 100,
                'shield' => 0,
                'weapons' => [],
                'isHost' => $isHost
            ];

            echo json_encode([
                'type' => 'joined',
                'playerId' => $playerId,
                'gameId' => $gameId,
                'isHost' => $isHost,
                'players' => array_values($games[$gameId]['players']),
                'mapType' => $games[$gameId]['mapType']
            ]);
            break;

        case 'start':
            $gameId = $data['gameId'] ?? '';
            if (isset($games[$gameId])) {
                $games[$gameId]['started'] = true;
                echo json_encode([
                    'type' => 'gameStarted',
                    'chests' => $games[$gameId]['chests'],
                    'potions' => $games[$gameId]['potions'],
                    'mapType' => $games[$gameId]['mapType']
                ]);
            } else {
                echo json_encode(['error' => 'Game not found']);
            }
            break;

        case 'update':
            $gameId = $data['gameId'] ?? '';
            $playerId = $data['playerId'] ?? '';
            $x = $data['x'] ?? 0;
            $y = $data['y'] ?? 0;

            if (isset($games[$gameId]['players'][$playerId])) {
                $games[$gameId]['players'][$playerId]['x'] = $x;
                $games[$gameId]['players'][$playerId]['y'] = $y;
                echo json_encode(['type' => 'updated']);
            } else {
                echo json_encode(['error' => 'Player not found']);
            }
            break;

        case 'shoot':
            $gameId = $data['gameId'] ?? '';
            $playerId = $data['playerId'] ?? '';
            $weapon = $data['weapon'] ?? '';
            $targetX = $data['targetX'] ?? 0;
            $targetY = $data['targetY'] ?? 0;

            if (isset($games[$gameId]['players'][$playerId])) {
                echo json_encode([
                    'type' => 'shot',
                    'playerId' => $playerId,
                    'weapon' => $weapon,
                    'targetX' => $targetX,
                    'targetY' => $targetY
                ]);
            } else {
                echo json_encode(['error' => 'Player not found']);
            }
            break;

        case 'collect':
            $gameId = $data['gameId'] ?? '';
            $playerId = $data['playerId'] ?? '';
            $itemType = $data['itemType'] ?? '';
            $itemId = $data['itemId'] ?? '';

            if (isset($games[$gameId])) {
                if ($itemType === 'chest') {
                    foreach ($games[$gameId]['chests'] as &$chest) {
                        if ($chest['id'] === $itemId && !$chest['opened']) {
                            $chest['opened'] = true;
                            echo json_encode([
                                'type' => 'chestOpened',
                                'chestId' => $itemId,
                                'playerId' => $playerId
                            ]);
                            break;
                        }
                    }
                } elseif ($itemType === 'potion') {
                    foreach ($games[$gameId]['potions'] as &$potion) {
                        if ($potion['id'] === $itemId && !$potion['collected']) {
                            $potion['collected'] = true;
                            echo json_encode([
                                'type' => 'potionCollected',
                                'potionId' => $itemId,
                                'playerId' => $playerId
                            ]);
                            break;
                        }
                    }
                }
            } else {
                echo json_encode(['error' => 'Game not found']);
            }
            break;

        default:
            echo json_encode(['error' => 'Invalid request type']);
            break;
    }
} elseif ($method === 'GET') {
    $gameId = $_GET['gameId'] ?? '';
    $playerId = $_GET['playerId'] ?? '';

    if ($gameId && isset($games[$gameId])) {
        echo json_encode([
            'type' => 'gameState',
            'game' => $games[$gameId]
        ]);
    } else {
        echo json_encode(['error' => 'Game not found']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method']);
} 
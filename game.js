class Game {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Detect device type
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log("Device type:", this.isMobile ? "Mobile" : "Desktop");

        // Initialize player
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            width: 30,
            height: 30,
            speed: 5,
            health: 100,
            shield: 100,
            name: 'Player',
            materials: {
                wood: 0,
                stone: 0
            },
            weapons: [
                { type: 'pickaxe', damage: 20, range: 30 },
                { type: 'empty', damage: 0, range: 0 },
                { type: 'empty', damage: 0, range: 0 }
            ],
            currentWeapon: 0,
            ammo: {
                pistol: 0,
                shotgun: 0,
                rifle: 0
            },
            items: {
                medkit: 0,
                shieldPotion: 0
            },
            kills: 0,
            deaths: 0,
            isAlive: true
        };

        // Initialize game objects
        this.trees = [];
        this.rocks = [];
        this.chests = [];
        this.bullets = [];
        this.bots = [];
        this.buildings = [];
        this.lastShotTime = 0;
        this.shotCooldown = 500; // milliseconds between shots
        this.gameOver = false;
        this.gamePaused = false;
        this.minimapVisible = !this.isMobile; // Hide minimap on mobile
        this.buildMode = false;
        this.selectedBuildingType = 'wall'; // wall, tower, base
        this.lastItemUseTime = 0;
        this.itemCooldown = 1000; // milliseconds between item uses
        
        // Mobile touch controls
        this.touchControls = {
            joystick: {
                active: false,
                x: 0,
                y: 0,
                centerX: 0,
                centerY: 0,
                radius: 0
            },
            fireButton: {
                active: false,
                x: 0,
                y: 0,
                radius: 0
            },
            buildButton: {
                active: false,
                x: 0,
                y: 0,
                radius: 0
            },
            itemButtons: [
                { active: false, x: 0, y: 0, radius: 0, type: 'medkit' },
                { active: false, x: 0, y: 0, radius: 0, type: 'shieldPotion' }
            ]
        };

        // Generate terrain
        this.generateTerrain();
        
        // Generate bots
        this.generateBots();

        // Set up event listeners
        this.setupEventListeners();

        // Start game loop
        this.lastTime = 0;
        this.gameLoop(0);
    }

    generateTerrain() {
        // Generate trees
        for (let i = 0; i < 100; i++) {
            this.trees.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                width: 40,
                height: 60,
                health: 100
            });
        }

        // Generate rocks
        for (let i = 0; i < 60; i++) {
            this.rocks.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                width: 30,
                height: 30,
                health: 200
            });
        }

        // Generate chests
        for (let i = 0; i < 20; i++) {
            this.chests.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                width: 30,
                height: 30,
                opened: false
            });
        }
    }
    
    generateBots() {
        // Bot name list
        const botNames = [
            'Shadow', 'Phantom', 'Ghost', 'Wraith', 'Specter', 'Reaper', 'Harbinger',
            'Nemesis', 'Viper', 'Cobra', 'Python', 'Rattlesnake', 'Mamba', 'Asp',
            'Wolf', 'Bear', 'Lion', 'Tiger', 'Panther', 'Jaguar', 'Leopard',
            'Hawk', 'Eagle', 'Falcon', 'Raven', 'Crow', 'Vulture', 'Condor',
            'Dragon', 'Wyvern', 'Griffin', 'Phoenix', 'Hydra', 'Kraken', 'Leviathan'
        ];
        
        // Shuffle bot names
        const shuffledNames = [...botNames].sort(() => Math.random() - 0.5);
        
        // Generate 19 bots
        for (let i = 0; i < 19; i++) {
            this.bots.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                width: 30,
                height: 30,
                speed: 2 + Math.random() * 2,
                health: 100,
                shield: 50,
                name: shuffledNames[i],
                materials: {
                    wood: 0,
                    stone: 0
                },
                weapons: [
                    { type: 'pistol', damage: 25, range: 300 },
                    { type: 'shotgun', damage: 50, range: 150 },
                    { type: 'rifle', damage: 35, range: 400 }
                ],
                currentWeapon: Math.floor(Math.random() * 3),
                ammo: {
                    pistol: 100,
                    shotgun: 50,
                    rifle: 100
                },
                items: {
                    medkit: 0,
                    shieldPotion: 0
                },
                lastShotTime: 0,
                shotCooldown: 500 + Math.random() * 500,
                state: 'patrol', // patrol, chase, attack, build, gather
                patrolPoint: {
                    x: Math.random() * 4000 - 2000,
                    y: Math.random() * 4000 - 2000
                },
                patrolTimer: 0,
                patrolDuration: 3000 + Math.random() * 5000,
                buildTimer: 0,
                buildCooldown: 5000 + Math.random() * 10000,
                isAlive: true
            });
        }
    }

    setupEventListeners() {
        // Keyboard controls
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === '1') this.switchWeapon(0);
            if (e.key === '2') this.switchWeapon(1);
            if (e.key === '3') this.switchWeapon(2);
            if (e.key === 'e' || e.key === 'E') this.openChest();
            if (e.key === 'Escape') this.togglePause();
            if (e.key === 'q' || e.key === 'Q') this.toggleBuildMode();
            if (e.key === 'm' || e.key === 'M') this.toggleMinimap();
            if (e.key === 'f' || e.key === 'F') this.useMedkit();
            if (e.key === 'g' || e.key === 'G') this.useShieldPotion();
            
            // Building type selection
            if (e.key === 'w' || e.key === 'W') this.selectBuildingType('wall');
            if (e.key === 'e' || e.key === 'E') this.selectBuildingType('tower');
            if (e.key === 'r' || e.key === 'R') this.selectBuildingType('base');
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                if (this.buildMode) {
                    this.build();
                } else if (this.player.currentWeapon === 0) {
                    this.usePickaxe();
                } else {
                    this.shoot();
                }
            }
        });
        
        // Auto-fire when holding mouse button
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 && this.player.currentWeapon !== 0 && !this.gamePaused && !this.gameOver && !this.buildMode) { // Left mouse button is held
                this.shoot();
            }
        });
        
        // Scroll wheel to change weapons
        this.canvas.addEventListener('wheel', (e) => {
            if (this.gameOver || this.gamePaused || this.buildMode) return;
            
            // Determine scroll direction
            if (e.deltaY < 0) {
                // Scrolling up - switch to previous weapon
                this.switchWeapon((this.player.currentWeapon - 1 + this.player.weapons.length) % this.player.weapons.length);
            } else {
                // Scrolling down - switch to next weapon
                this.switchWeapon((this.player.currentWeapon + 1) % this.player.weapons.length);
            }
            
            // Prevent default scrolling behavior
            e.preventDefault();
        });
        
        // Mobile touch controls
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }
    
    setupMobileControls() {
        // Initialize touch control positions
        this.initializeTouchControls();
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        });
        
        // Create mobile UI elements
        this.createMobileUI();
    }
    
    initializeTouchControls() {
        // Calculate responsive sizes based on screen dimensions
        const screenSize = Math.min(this.width, this.height);
        const joystickRadius = screenSize * 0.12; // 12% of screen size
        const buttonRadius = screenSize * 0.08; // 8% of screen size
        const itemButtonRadius = screenSize * 0.06; // 6% of screen size
        
        // Position joystick on the left side
        this.touchControls.joystick.centerX = joystickRadius + 20;
        this.touchControls.joystick.centerY = this.height - joystickRadius - 20;
        this.touchControls.joystick.radius = joystickRadius;
        
        // Position fire button on the right side
        this.touchControls.fireButton.x = this.width - buttonRadius - 20;
        this.touchControls.fireButton.y = this.height - buttonRadius - 20;
        this.touchControls.fireButton.radius = buttonRadius;
        
        // Position build button
        this.touchControls.buildButton.x = this.width - buttonRadius - 20;
        this.touchControls.buildButton.y = this.height - (buttonRadius * 3) - 60;
        this.touchControls.buildButton.radius = buttonRadius;
        
        // Position item buttons
        const itemButtonY = this.height - (itemButtonRadius * 3) - 40;
        const itemButtonSpacing = itemButtonRadius * 2.5;
        
        this.touchControls.itemButtons.forEach((button, index) => {
            button.x = this.width - itemButtonRadius - 20;
            button.y = itemButtonY + (index * itemButtonSpacing);
            button.radius = itemButtonRadius;
        });
    }
    
    createMobileUI() {
        // Create mobile UI container
        const mobileUI = document.createElement('div');
        mobileUI.className = 'mobile-ui';
        document.body.appendChild(mobileUI);
        
        // Create joystick
        const joystick = document.createElement('div');
        joystick.className = 'mobile-joystick';
        joystick.id = 'mobileJoystick';
        mobileUI.appendChild(joystick);
        
        // Create fire button
        const fireButton = document.createElement('div');
        fireButton.className = 'mobile-button fire-button';
        fireButton.id = 'mobileFireButton';
        mobileUI.appendChild(fireButton);
        
        // Create build button
        const buildButton = document.createElement('div');
        buildButton.className = 'mobile-button build-button';
        buildButton.id = 'mobileBuildButton';
        mobileUI.appendChild(buildButton);
        
        // Create item buttons
        const itemContainer = document.createElement('div');
        itemContainer.className = 'mobile-item-container';
        mobileUI.appendChild(itemContainer);
        
        this.touchControls.itemButtons.forEach((button, index) => {
            const itemButton = document.createElement('div');
            itemButton.className = 'mobile-button item-button';
            itemButton.id = `mobileItemButton${index}`;
            itemButton.dataset.item = button.type;
            itemContainer.appendChild(itemButton);
        });
        
        // Create pause button
        const pauseButton = document.createElement('div');
        pauseButton.className = 'mobile-button pause-button';
        pauseButton.id = 'mobilePauseButton';
        mobileUI.appendChild(pauseButton);
        
        // Add event listeners to mobile UI elements
        document.getElementById('mobileFireButton').addEventListener('click', () => {
            if (this.buildMode) {
                this.build();
            } else if (this.player.currentWeapon === 0) {
                this.usePickaxe();
            } else {
                this.shoot();
            }
        });
        
        document.getElementById('mobileBuildButton').addEventListener('click', () => {
            this.toggleBuildMode();
        });
        
        document.getElementById('mobilePauseButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Add event listeners to item buttons
        this.touchControls.itemButtons.forEach((button, index) => {
            document.getElementById(`mobileItemButton${index}`).addEventListener('click', () => {
                if (button.type === 'medkit') {
                    this.useMedkit();
                } else if (button.type === 'shieldPotion') {
                    this.useShieldPotion();
                }
            });
        });
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Check if touch is on joystick
        const joystickDist = Math.sqrt(
            Math.pow(touchX - this.touchControls.joystick.centerX, 2) +
            Math.pow(touchY - this.touchControls.joystick.centerY, 2)
        );
        
        if (joystickDist <= this.touchControls.joystick.radius) {
            this.touchControls.joystick.active = true;
            this.touchControls.joystick.x = touchX;
            this.touchControls.joystick.y = touchY;
            return;
        }
        
        // Check if touch is on fire button
        const fireDist = Math.sqrt(
            Math.pow(touchX - this.touchControls.fireButton.x, 2) +
            Math.pow(touchY - this.touchControls.fireButton.y, 2)
        );
        
        if (fireDist <= this.touchControls.fireButton.radius) {
            this.touchControls.fireButton.active = true;
            return;
        }
        
        // Check if touch is on build button
        const buildDist = Math.sqrt(
            Math.pow(touchX - this.touchControls.buildButton.x, 2) +
            Math.pow(touchY - this.touchControls.buildButton.y, 2)
        );
        
        if (buildDist <= this.touchControls.buildButton.radius) {
            this.touchControls.buildButton.active = true;
            return;
        }
        
        // Check if touch is on item buttons
        this.touchControls.itemButtons.forEach((button, index) => {
            const itemDist = Math.sqrt(
                Math.pow(touchX - button.x, 2) +
                Math.pow(touchY - button.y, 2)
            );
            
            if (itemDist <= button.radius) {
                button.active = true;
                if (button.type === 'medkit') {
                    this.useMedkit();
                } else if (button.type === 'shieldPotion') {
                    this.useShieldPotion();
                }
                return;
            }
        });
        
        // If touch is not on any control, switch weapon
        // Divide the screen into 3 vertical sections for weapon switching
        const sectionWidth = this.width / 3;
        const section = Math.floor(touchX / sectionWidth);
        
        // Switch to the corresponding weapon (0 is pickaxe, 1-2 are other weapons)
        if (section >= 0 && section < 3) {
            this.switchWeapon(section);
        }
    }
    
    handleTouchMove(e) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Update joystick position if active
        if (this.touchControls.joystick.active) {
            // Calculate distance from center
            const dx = touchX - this.touchControls.joystick.centerX;
            const dy = touchY - this.touchControls.joystick.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit joystick movement to radius
            if (distance > this.touchControls.joystick.radius) {
                const angle = Math.atan2(dy, dx);
                this.touchControls.joystick.x = this.touchControls.joystick.centerX + Math.cos(angle) * this.touchControls.joystick.radius;
                this.touchControls.joystick.y = this.touchControls.joystick.centerY + Math.sin(angle) * this.touchControls.joystick.radius;
            } else {
                this.touchControls.joystick.x = touchX;
                this.touchControls.joystick.y = touchY;
            }
            
            // Update player movement based on joystick position
            const normalizedDx = (this.touchControls.joystick.x - this.touchControls.joystick.centerX) / this.touchControls.joystick.radius;
            const normalizedDy = (this.touchControls.joystick.y - this.touchControls.joystick.centerY) / this.touchControls.joystick.radius;
            
            this.player.x += normalizedDx * this.player.speed;
            this.player.y += normalizedDy * this.player.speed;
        }
        
        // Auto-fire when fire button is active
        if (this.touchControls.fireButton.active && this.player.currentWeapon !== 0 && !this.gamePaused && !this.gameOver && !this.buildMode) {
            this.shoot();
        }
    }
    
    handleTouchEnd(e) {
        // Reset joystick
        this.touchControls.joystick.active = false;
        
        // Reset fire button
        this.touchControls.fireButton.active = false;
        
        // Reset build button
        this.touchControls.buildButton.active = false;
        
        // Reset item buttons
        this.touchControls.itemButtons.forEach(button => {
            button.active = false;
        });
    }

    switchWeapon(index) {
        if (index < this.player.weapons.length) {
            this.player.currentWeapon = index;
            document.querySelectorAll('.weapon-slot').forEach((slot, i) => {
                slot.classList.toggle('active', i === index);
            });
        }
    }

    usePickaxe() {
        const weapon = this.player.weapons[0];
        const range = weapon.range;

        // Check for trees and rocks in range
        const treesInRange = this.trees.filter(tree => 
            this.distance(this.player, tree) < range
        );

        const rocksInRange = this.rocks.filter(rock => 
            this.distance(this.player, rock) < range
        );

        // Damage closest tree or rock
        const closestTree = this.findClosest(treesInRange);
        const closestRock = this.findClosest(rocksInRange);

        if (closestTree && (!closestRock || this.distance(this.player, closestTree) < this.distance(this.player, closestRock))) {
            closestTree.health -= weapon.damage;
            if (closestTree.health <= 0) {
                this.player.materials.wood += 10;
                this.trees = this.trees.filter(t => t !== closestTree);
            }
        } else if (closestRock) {
            closestRock.health -= weapon.damage;
            if (closestRock.health <= 0) {
                this.player.materials.stone += 10;
                this.rocks = this.rocks.filter(r => r !== closestRock);
            }
        }
    }

    shoot() {
        if (this.player.currentWeapon === 0) return; // Can't shoot with pickaxe
        
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (weapon.type === 'empty') return;

        const ammoType = weapon.type;
        if (this.player.ammo[ammoType] <= 0) {
            this.showNotification("Out of ammo!");
            return;
        }
        
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.shotCooldown) {
            return;
        }
        this.lastShotTime = currentTime;

        this.player.ammo[ammoType]--;

        // Create bullet
        const angle = Math.atan2(
            this.mouse.y - this.height/2,
            this.mouse.x - this.width/2
        );
        
        // Add some spread based on weapon type
        let spread = 0;
        if (weapon.type === 'pistol') spread = 0.05;
        else if (weapon.type === 'shotgun') spread = 0.2;
        else if (weapon.type === 'rifle') spread = 0.02;
        
        const finalAngle = angle + (Math.random() - 0.5) * spread;

        // Create bullet with weapon-specific properties
        const bullet = {
            x: this.player.x,
            y: this.player.y,
            angle: finalAngle,
            speed: weapon.type === 'shotgun' ? 8 : 12,
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            owner: 'player'
        };
        
        this.bullets.push(bullet);
        
        // For shotgun, create multiple bullets
        if (weapon.type === 'shotgun') {
            for (let i = 0; i < 5; i++) {
                const pelletAngle = finalAngle + (Math.random() - 0.5) * 0.3;
                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y,
                    angle: pelletAngle,
                    speed: 8,
                    damage: weapon.damage / 2,
                    range: weapon.range,
                    distanceTraveled: 0,
                    owner: 'player'
                });
            }
        }
    }
    
    botShoot(bot) {
        const weapon = bot.weapons[bot.currentWeapon];
        const ammoType = weapon.type;
        
        if (bot.ammo[ammoType] <= 0) {
            // Switch to another weapon with ammo
            for (let i = 0; i < bot.weapons.length; i++) {
                const weaponType = bot.weapons[i].type;
                if (bot.ammo[weaponType] > 0) {
                    bot.currentWeapon = i;
                    break;
                }
            }
            return;
        }
        
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - bot.lastShotTime < bot.shotCooldown) {
            return;
        }
        bot.lastShotTime = currentTime;
        
        bot.ammo[ammoType]--;
        
        // Calculate angle to target
        const target = bot.target;
        const angle = Math.atan2(
            target.y - bot.y,
            target.x - bot.x
        );
        
        // Add some spread based on weapon type
        let spread = 0;
        if (weapon.type === 'pistol') spread = 0.1;
        else if (weapon.type === 'shotgun') spread = 0.3;
        else if (weapon.type === 'rifle') spread = 0.05;
        
        const finalAngle = angle + (Math.random() - 0.5) * spread;
        
        // Create bullet
        const bullet = {
            x: bot.x,
            y: bot.y,
            angle: finalAngle,
            speed: weapon.type === 'shotgun' ? 8 : 12,
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            owner: 'bot',
            ownerName: bot.name
        };
        
        this.bullets.push(bullet);
        
        // For shotgun, create multiple bullets
        if (weapon.type === 'shotgun') {
            for (let i = 0; i < 5; i++) {
                const pelletAngle = finalAngle + (Math.random() - 0.5) * 0.3;
                this.bullets.push({
                    x: bot.x,
                    y: bot.y,
                    angle: pelletAngle,
                    speed: 8,
                    damage: weapon.damage / 2,
                    range: weapon.range,
                    distanceTraveled: 0,
                    owner: 'bot',
                    ownerName: bot.name
                });
            }
        }
    }

    distance(obj1, obj2) {
        return Math.sqrt(
            Math.pow(obj1.x - obj2.x, 2) + 
            Math.pow(obj1.y - obj2.y, 2)
        );
    }

    findClosest(objects) {
        if (objects.length === 0) return null;
        return objects.reduce((closest, current) => {
            const distCurrent = this.distance(this.player, current);
            const distClosest = closest ? this.distance(this.player, closest) : Infinity;
            return distCurrent < distClosest ? current : closest;
        }, null);
    }
    
    updateBots(deltaTime) {
        this.bots.forEach(bot => {
            if (!bot.isAlive) return;
            
            // Check for other bots in range to attack
            const botsInRange = this.bots.filter(otherBot => 
                otherBot !== bot && 
                otherBot.isAlive && 
                this.distance(bot, otherBot) < 300
            );
            
            // Check for player in range
            const playerInRange = this.player.isAlive && this.distance(bot, this.player) < 300;
            
            // Prioritize attacking player if in range, otherwise attack other bots
            if (playerInRange) {
                bot.state = 'chase';
                bot.target = this.player;
            } else if (botsInRange.length > 0) {
                bot.state = 'chase';
                bot.target = botsInRange[0]; // Attack the first bot in range
            }
            
            // Update bot state
            if (bot.state === 'chase') {
                // Move towards target
                const target = bot.target;
                const angle = Math.atan2(
                    target.y - bot.y,
                    target.x - bot.x
                );
                
                // Add some randomness to movement
                const randomAngle = angle + (Math.random() - 0.5) * 0.2;
                const randomSpeed = bot.speed * (0.8 + Math.random() * 0.4);
                
                bot.x += Math.cos(randomAngle) * randomSpeed;
                bot.y += Math.sin(randomAngle) * randomSpeed;
                
                // Check if in range to attack
                if (this.distance(bot, target) < 200) {
                    // Shoot at target
                    this.botShoot(bot);
                }
            } else if (bot.state === 'gather') {
                // Check for trees and rocks to gather materials
                const treesInRange = this.trees.filter(tree => 
                    this.distance(bot, tree) < 50
                );
                
                const rocksInRange = this.rocks.filter(rock => 
                    this.distance(bot, rock) < 50
                );
                
                if (treesInRange.length > 0 || rocksInRange.length > 0) {
                    // Gather materials
                    if (treesInRange.length > 0) {
                        const tree = treesInRange[0];
                        tree.health -= 20;
                        if (tree.health <= 0) {
                            bot.materials.wood += 10;
                            this.trees = this.trees.filter(t => t !== tree);
                        }
                    }
                    
                    if (rocksInRange.length > 0) {
                        const rock = rocksInRange[0];
                        rock.health -= 20;
                        if (rock.health <= 0) {
                            bot.materials.stone += 10;
                            this.rocks = this.rocks.filter(r => r !== rock);
                        }
                    }
                } else {
                    // No more resources in range, go back to patrol
                    bot.state = 'patrol';
                    bot.patrolPoint = {
                        x: Math.random() * 4000 - 2000,
                        y: Math.random() * 4000 - 2000
                    };
                    bot.patrolTimer = 0;
                    bot.patrolDuration = 3000 + Math.random() * 5000;
                }
            } else if (bot.state === 'build') {
                // Try to build something
                this.botBuild(bot);
                
                // If couldn't build, go back to patrol
                if (bot.state === 'build') {
                    bot.state = 'patrol';
                    bot.patrolPoint = {
                        x: Math.random() * 4000 - 2000,
                        y: Math.random() * 4000 - 2000
                    };
                    bot.patrolTimer = 0;
                    bot.patrolDuration = 3000 + Math.random() * 5000;
                }
            } else {
                // Patrol state
                bot.patrolTimer += deltaTime;
                
                if (bot.patrolTimer >= bot.patrolDuration) {
                    // Time to change patrol point
                    bot.patrolPoint = {
                        x: Math.random() * 4000 - 2000,
                        y: Math.random() * 4000 - 2000
                    };
                    bot.patrolTimer = 0;
                    bot.patrolDuration = 3000 + Math.random() * 5000;
                }
                
                // Move towards patrol point
                const angle = Math.atan2(
                    bot.patrolPoint.y - bot.y,
                    bot.patrolPoint.x - bot.x
                );
                
                // Add some randomness to movement
                const randomAngle = angle + (Math.random() - 0.5) * 0.5;
                const randomSpeed = bot.speed * 0.5 * (0.8 + Math.random() * 0.4);
                
                bot.x += Math.cos(randomAngle) * randomSpeed;
                bot.y += Math.sin(randomAngle) * randomSpeed;
                
                // Occasionally change direction completely
                if (Math.random() < 0.01) {
                    bot.patrolPoint = {
                        x: Math.random() * 4000 - 2000,
                        y: Math.random() * 4000 - 2000
                    };
                }
                
                // Check for trees and rocks to gather materials
                const treesInRange = this.trees.filter(tree => 
                    this.distance(bot, tree) < 50
                );
                
                const rocksInRange = this.rocks.filter(rock => 
                    this.distance(bot, rock) < 50
                );
                
                if (treesInRange.length > 0 || rocksInRange.length > 0) {
                    bot.state = 'gather';
                    
                    // Gather materials
                    if (treesInRange.length > 0) {
                        const tree = treesInRange[0];
                        tree.health -= 20;
                        if (tree.health <= 0) {
                            bot.materials.wood += 10;
                            this.trees = this.trees.filter(t => t !== tree);
                        }
                    }
                    
                    if (rocksInRange.length > 0) {
                        const rock = rocksInRange[0];
                        rock.health -= 20;
                        if (rock.health <= 0) {
                            bot.materials.stone += 10;
                            this.rocks = this.rocks.filter(r => r !== rock);
                        }
                    }
                }
            }
            
            // Use items if health or shield is low
            if (bot.health < 50 && bot.items.medkit > 0) {
                bot.items.medkit--;
                bot.health = Math.min(100, bot.health + 50);
            }
            
            if (bot.shield < 30 && bot.items.shieldPotion > 0) {
                bot.items.shieldPotion--;
                bot.shield = Math.min(100, bot.shield + 50);
            }
        });
    }

    update(deltaTime) {
        if (this.gameOver || this.gamePaused) return;

        // Update player position based on input
        if (!this.isMobile) {
            // Desktop controls
            if (this.keys['w'] || this.keys['ArrowUp']) this.player.y -= this.player.speed;
            if (this.keys['s'] || this.keys['ArrowDown']) this.player.y += this.player.speed;
            if (this.keys['a'] || this.keys['ArrowLeft']) this.player.x -= this.player.speed;
            if (this.keys['d'] || this.keys['ArrowRight']) this.player.x += this.player.speed;
        }
        // Mobile controls are handled in handleTouchMove

        // Update bots
        this.updateBots(deltaTime);

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            // Move bullet
            const dx = Math.cos(bullet.angle) * bullet.speed;
            const dy = Math.sin(bullet.angle) * bullet.speed;
            bullet.x += dx;
            bullet.y += dy;
            bullet.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
            
            // Check if bullet is out of range
            if (bullet.distanceTraveled > bullet.range) {
                return false;
            }
            
            // Check if bullet is out of bounds
            if (bullet.x < -2000 || bullet.x > 2000 || bullet.y < -2000 || bullet.y > 2000) {
                return false;
            }
            
            // Check for collisions with trees and rocks
            for (const tree of this.trees) {
                if (this.checkCollision(bullet, tree)) {
                    return false;
                }
            }
            
            for (const rock of this.rocks) {
                if (this.checkCollision(bullet, rock)) {
                    return false;
                }
            }
            
            // Check for collisions with buildings
            for (const building of this.buildings) {
                if (this.checkCollision(bullet, building)) {
                    // Apply damage to building
                    building.health -= bullet.damage;
                    
                    // Check if building is destroyed
                    if (building.health <= 0) {
                        this.buildings = this.buildings.filter(b => b !== building);
                    }
                    
                    return false;
                }
            }
            
            // Check for collisions with bots (if player bullet or bot bullet)
            if (bullet.owner === 'player') {
                for (let i = 0; i < this.bots.length; i++) {
                    const bot = this.bots[i];
                    if (!bot.isAlive) continue;
                    
                    if (this.checkCollision(bullet, bot)) {
                        // Apply damage to bot
                        if (bot.shield > 0) {
                            bot.shield -= bullet.damage;
                            if (bot.shield < 0) {
                                bot.health += bot.shield;
                                bot.shield = 0;
                            }
                        } else {
                            bot.health -= bullet.damage;
                        }
                        
                        // Check if bot is dead
                        if (bot.health <= 0) {
                            bot.isAlive = false;
                            this.player.kills++;
                            
                            // Show notification
                            this.showNotification(`Killed ${bot.name}!`);
                            
                            // Check if all bots are dead
                            const aliveBots = this.bots.filter(b => b.isAlive).length;
                            if (aliveBots === 0) {
                                this.showGameOver(true);
                            }
                        }
                        
                        return false;
                    }
                }
            } else if (bullet.owner === 'bot') {
                // Check for collision with player
                if (this.player.isAlive && this.checkCollision(bullet, this.player)) {
                    // Apply damage to player
                    if (this.player.shield > 0) {
                        this.player.shield -= bullet.damage;
                        if (this.player.shield < 0) {
                            this.player.health += this.player.shield;
                            this.player.shield = 0;
                        }
                    } else {
                        this.player.health -= bullet.damage;
                    }
                    
                    // Check if player is dead
                    if (this.player.health <= 0) {
                        this.player.isAlive = false;
                        this.player.deaths++;
                        this.showGameOver(false);
                    }
                    
                    return false;
                }
                
                // Check for collision with other bots
                for (let i = 0; i < this.bots.length; i++) {
                    const bot = this.bots[i];
                    if (!bot.isAlive || bot.name === bullet.ownerName) continue;
                    
                    if (this.checkCollision(bullet, bot)) {
                        // Apply damage to bot
                        if (bot.shield > 0) {
                            bot.shield -= bullet.damage;
                            if (bot.shield < 0) {
                                bot.health += bot.shield;
                                bot.shield = 0;
                            }
                        } else {
                            bot.health -= bullet.damage;
                        }
                        
                        // Check if bot is dead
                        if (bot.health <= 0) {
                            bot.isAlive = false;
                            
                            // Find the bot that killed this bot
                            const killerBot = this.bots.find(b => b.name === bullet.ownerName);
                            if (killerBot) {
                                // Increment kill count for the killer bot
                                killerBot.kills = (killerBot.kills || 0) + 1;
                            }
                            
                            // Check if all bots are dead
                            const aliveBots = this.bots.filter(b => b.isAlive).length;
                            if (aliveBots === 0 && this.player.isAlive) {
                                this.showGameOver(true);
                            }
                        }
                        
                        return false;
                    }
                }
            }
            
            return true;
        });

        // Check if player is the last one alive
        const aliveBots = this.bots.filter(b => b.isAlive).length;
        if (this.player.isAlive && aliveBots === 0) {
            this.showGameOver(true);
        }

        // Update HUD
        this.updateHUD();
    }
    
    checkCollision(bullet, obj) {
        // Simple circle-rectangle collision
        const closestX = Math.max(obj.x - obj.width/2, Math.min(bullet.x, obj.x + obj.width/2));
        const closestY = Math.max(obj.y - obj.height/2, Math.min(bullet.y, obj.y + obj.height/2));
        
        const distanceX = bullet.x - closestX;
        const distanceY = bullet.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < 9; // 3 is bullet radius
    }
    
    showGameOver(won) {
        this.gameOver = true;
        
        // Create game over screen
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        
        if (won) {
            gameOver.innerHTML = `
                <h1>Victory!</h1>
                <h2>You've defeated all the bots!</h2>
                <p>Kills: ${this.player.kills}</p>
                <p>Deaths: ${this.player.deaths}</p>
                <div class="button-container">
                    <button id="playAgainButton">Play Again</button>
                    <button id="returnToLobbyButton">Return to Lobby</button>
                </div>
            `;
        } else {
            gameOver.innerHTML = `
                <h1>Game Over</h1>
                <h2>You were defeated!</h2>
                <p>Kills: ${this.player.kills}</p>
                <p>Deaths: ${this.player.deaths}</p>
                <div class="button-container">
                    <button id="playAgainButton">Play Again</button>
                    <button id="returnToLobbyButton">Return to Lobby</button>
                </div>
            `;
        }
        
        document.body.appendChild(gameOver);
        
        // Add event listeners to buttons
        document.getElementById('playAgainButton').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('returnToLobbyButton').addEventListener('click', () => {
            // Clear game state from localStorage
            localStorage.removeItem('gameData');
            // Redirect to lobby
            window.location.href = 'index.html';
        });
    }

    updateHUD() {
        // Update health and shield bars
        document.querySelector('.health-fill').style.width = `${this.player.health}%`;
        document.querySelector('.shield-fill').style.width = `${this.player.shield}%`;

        // Update materials
        document.querySelector('.material:nth-child(1) span').textContent = `Wood: ${this.player.materials.wood}`;
        document.querySelector('.material:nth-child(2) span').textContent = `Stone: ${this.player.materials.stone}`;

        // Update ammo
        document.querySelector('.ammo-type:nth-child(1) span').textContent = `Pistol: ${this.player.ammo.pistol}`;
        document.querySelector('.ammo-type:nth-child(2) span').textContent = `Shotgun: ${this.player.ammo.shotgun}`;
        document.querySelector('.ammo-type:nth-child(3) span').textContent = `Rifle: ${this.player.ammo.rifle}`;
        
        // Update items
        document.querySelector('.item:nth-child(1) span').textContent = `Medkit: ${this.player.items.medkit}`;
        document.querySelector('.item:nth-child(2) span').textContent = `Shield Potion: ${this.player.items.shieldPotion}`;
        
        // Update weapon slots
        document.querySelectorAll('.weapon-slot').forEach((slot, i) => {
            const weapon = this.player.weapons[i];
            if (weapon.type === 'empty') {
                slot.textContent = 'Empty';
            } else {
                slot.textContent = weapon.type.charAt(0).toUpperCase() + weapon.type.slice(1);
            }
        });
    }

    drawTerrain() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw trees
        this.ctx.fillStyle = '#2d5a27';
        this.trees.forEach(tree => {
            this.ctx.fillRect(
                tree.x - this.player.x + this.width/2,
                tree.y - this.player.y + this.height/2,
                tree.width,
                tree.height
            );
        });

        // Draw rocks
        this.ctx.fillStyle = '#666666';
        this.rocks.forEach(rock => {
            this.ctx.fillRect(
                rock.x - this.player.x + this.width/2,
                rock.y - this.player.y + this.height/2,
                rock.width,
                rock.height
            );
        });
        
        // Draw buildings
        this.buildings.forEach(building => {
            if (building.type === 'wall') {
                this.ctx.fillStyle = '#8B4513';
            } else if (building.type === 'tower') {
                this.ctx.fillStyle = '#A0522D';
            } else {
                this.ctx.fillStyle = '#6B4423';
            }
            
            this.ctx.fillRect(
                building.x - this.player.x + this.width/2,
                building.y - this.player.y + this.height/2,
                building.width,
                building.height
            );
            
            // Draw building health bar
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(
                building.x - this.player.x + this.width/2,
                building.y - this.player.y + this.height/2 - 10,
                building.width,
                5
            );
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(
                building.x - this.player.x + this.width/2,
                building.y - this.player.y + this.height/2 - 10,
                building.width * (building.health / (building.type === 'wall' ? 100 : building.type === 'tower' ? 200 : 500)),
                5
            );
            
            // Draw owner name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                building.owner === 'player' ? 'Player' : building.ownerName,
                building.x - this.player.x + this.width/2 + building.width/2,
                building.y - this.player.y + this.height/2 - 15
            );
        });
    }

    drawChests() {
        this.ctx.fillStyle = '#8B4513';
        this.chests.forEach(chest => {
            if (!chest.opened) {
                this.ctx.fillRect(
                    chest.x - this.player.x + this.width/2,
                    chest.y - this.player.y + this.height/2,
                    chest.width,
                    chest.height
                );
            }
        });
    }

    drawPlayers() {
        // Draw player
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(
            this.width/2 - this.player.width/2,
            this.height/2 - this.player.height/2,
            this.player.width,
            this.player.height
        );

        // Draw player name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.player.name,
            this.width/2,
            this.height/2 - this.player.height/2 - 5
        );
        
        // Draw bots
        this.ctx.fillStyle = '#ff0000';
        this.bots.forEach(bot => {
            if (!bot.isAlive) return;
            
            this.ctx.fillRect(
                bot.x - this.player.x + this.width/2 - bot.width/2,
                bot.y - this.player.y + this.height/2 - bot.height/2,
                bot.width,
                bot.height
            );
            
            // Draw bot name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                bot.name,
                bot.x - this.player.x + this.width/2,
                bot.y - this.player.y + this.height/2 - bot.height/2 - 5
            );
            
            // Draw bot health bar
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(
                bot.x - this.player.x + this.width/2 - 15,
                bot.y - this.player.y + this.height/2 - bot.height/2 - 15,
                30,
                5
            );
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(
                bot.x - this.player.x + this.width/2 - 15,
                bot.y - this.player.y + this.height/2 - bot.height/2 - 15,
                30 * (bot.health / 100),
                5
            );
            
            // Draw bot shield bar
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(
                bot.x - this.player.x + this.width/2 - 15,
                bot.y - this.player.y + this.height/2 - bot.height/2 - 10,
                30,
                5
            );
            
            this.ctx.fillStyle = '#0000ff';
            this.ctx.fillRect(
                bot.x - this.player.x + this.width/2 - 15,
                bot.y - this.player.y + this.height/2 - bot.height/2 - 10,
                30 * (bot.shield / 50),
                5
            );
        });
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            const screenX = bullet.x - this.player.x + this.width/2;
            const screenY = bullet.y - this.player.y + this.height/2;
            
            this.ctx.fillStyle = bullet.owner === 'player' ? '#ffff00' : '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawMinimap() {
        // Don't draw minimap on mobile
        if (!this.minimapVisible || this.isMobile) return;
        
        const minimapSize = 150;
        const minimapX = this.width - minimapSize - 20;
        const minimapY = 20;
        const minimapScale = minimapSize / 4000; // 4000 is the approximate world size
        
        // Draw minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Draw minimap border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Draw player on minimap
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(
            minimapX + (this.player.x + 2000) * minimapScale,
            minimapY + (this.player.y + 2000) * minimapScale,
            5,
            5
        );
        
        // Draw bots on minimap
        this.ctx.fillStyle = '#ff0000';
        this.bots.forEach(bot => {
            if (!bot.isAlive) return;
            
            this.ctx.fillRect(
                minimapX + (bot.x + 2000) * minimapScale,
                minimapY + (bot.y + 2000) * minimapScale,
                5,
                5
            );
        });
        
        // Draw buildings on minimap
        this.buildings.forEach(building => {
            if (building.type === 'wall') {
                this.ctx.fillStyle = '#8B4513';
            } else if (building.type === 'tower') {
                this.ctx.fillStyle = '#A0522D';
            } else {
                this.ctx.fillStyle = '#6B4423';
            }
            
            this.ctx.fillRect(
                minimapX + (building.x + 2000) * minimapScale,
                minimapY + (building.y + 2000) * minimapScale,
                3,
                3
            );
        });
        
        // Draw player view area
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            minimapX + minimapSize/2 - 5,
            minimapY + minimapSize/2 - 5,
            10,
            10
        );
        
        // Draw combined player count
        const aliveBots = this.bots.filter(b => b.isAlive).length;
        const totalPlayers = (this.player.isAlive ? 1 : 0) + aliveBots;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `Players: ${totalPlayers}`,
            minimapX,
            minimapY + minimapSize + 20
        );
    }

    drawMobileControls() {
        if (!this.isMobile) return;
        
        // Calculate responsive sizes based on screen dimensions
        const screenSize = Math.min(this.width, this.height);
        const joystickRadius = screenSize * 0.12; // 12% of screen size
        const buttonRadius = screenSize * 0.08; // 8% of screen size
        const itemButtonRadius = screenSize * 0.06; // 6% of screen size
        
        // Draw joystick
        this.ctx.beginPath();
        this.ctx.arc(
            this.touchControls.joystick.centerX,
            this.touchControls.joystick.centerY,
            this.touchControls.joystick.radius,
            0,
            Math.PI * 2
        );
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        if (this.touchControls.joystick.active) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.touchControls.joystick.x,
                this.touchControls.joystick.y,
                joystickRadius * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.fill();
        }
        
        // Draw fire button
        this.ctx.beginPath();
        this.ctx.arc(
            this.touchControls.fireButton.x,
            this.touchControls.fireButton.y,
            this.touchControls.fireButton.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = this.touchControls.fireButton.active ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 0, 0, 0.5)';
        this.ctx.fill();
        
        // Draw build button
        this.ctx.beginPath();
        this.ctx.arc(
            this.touchControls.buildButton.x,
            this.touchControls.buildButton.y,
            this.touchControls.buildButton.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = this.touchControls.buildButton.active ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 255, 0, 0.5)';
        this.ctx.fill();
        
        // Draw item buttons
        this.touchControls.itemButtons.forEach((button, index) => {
            this.ctx.beginPath();
            this.ctx.arc(
                button.x,
                button.y,
                button.radius,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = button.active ? 'rgba(0, 0, 255, 0.7)' : 'rgba(0, 0, 255, 0.5)';
            this.ctx.fill();
            
            // Draw item icon
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.floor(screenSize * 0.04)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.type === 'medkit' ? 'F' : 'G', button.x, button.y);
        });
        
        // Draw weapon indicator at the top of the screen
        const weaponNames = ['Pickaxe', 'Pistol', 'Shotgun', 'Rifle'];
        const currentWeapon = this.player.weapons[this.player.currentWeapon];
        const weaponName = currentWeapon.type === 'empty' ? 'Empty' : 
                          currentWeapon.type.charAt(0).toUpperCase() + currentWeapon.type.slice(1);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, 40);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.floor(screenSize * 0.04)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Weapon: ${weaponName}`, this.width / 2, 25);
        
        // Draw weapon ammo if applicable
        if (currentWeapon.type !== 'pickaxe' && currentWeapon.type !== 'empty') {
            const ammo = this.player.ammo[currentWeapon.type] || 0;
            this.ctx.fillText(`Ammo: ${ammo}`, this.width / 2, 50);
        }
    }

    gameLoop(timestamp) {
        try {
            // Calculate delta time
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            // Update game state
            this.update(deltaTime);

            // Draw everything
            this.drawTerrain();
            this.drawChests();
            this.drawPlayers();
            this.drawBullets();
            
            // Draw minimap
            this.drawMinimap();
            
            // Draw build preview if in build mode
            if (this.buildMode) {
                this.drawBuildPreview();
            }
            
            // Draw pause overlay if paused
            if (this.gamePaused) {
                this.drawPauseOverlay();
            }
            
            // Draw mobile controls if on mobile
            if (this.isMobile) {
                this.drawMobileControls();
            }

            // Request next frame
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        } catch (error) {
            console.error("Game loop error:", error);
            // Try to recover by restarting the game loop
            setTimeout(() => {
                requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            }, 1000);
        }
    }

    openChest() {
        if (this.gameOver || this.gamePaused) return;
        
        try {
            // Find chests in range
            const chestsInRange = this.chests.filter(chest => 
                !chest.opened && this.distance(this.player, chest) < 50
            );

            if (chestsInRange.length > 0) {
                const chest = chestsInRange[0]; // Open the first chest in range
                chest.opened = true;
                
                // Generate random loot
                this.generateRandomLoot(chest);
            }
        } catch (error) {
            console.error("Error opening chest:", error);
        }
    }

    generateRandomLoot(chest) {
        try {
            // Possible loot types
            const lootTypes = [
                { type: 'pistol', ammo: 30, chance: 0.3 },
                { type: 'shotgun', ammo: 20, chance: 0.2 },
                { type: 'rifle', ammo: 40, chance: 0.2 },
                { type: 'medkit', amount: 1, chance: 0.2 },
                { type: 'shieldPotion', amount: 1, chance: 0.1 }
            ];
            
            // Possible material amounts
            const materialAmounts = [
                { wood: 20, stone: 0, chance: 0.4 },
                { wood: 0, stone: 20, chance: 0.4 },
                { wood: 10, stone: 10, chance: 0.2 }
            ];
            
            // Random number for loot type
            const lootRoll = Math.random();
            let cumulativeChance = 0;
            let selectedLoot = null;
            
            for (const loot of lootTypes) {
                cumulativeChance += loot.chance;
                if (lootRoll <= cumulativeChance) {
                    selectedLoot = loot;
                    break;
                }
            }
            
            // Random number for materials
            const materialRoll = Math.random();
            cumulativeChance = 0;
            let selectedMaterials = null;
            
            for (const materials of materialAmounts) {
                cumulativeChance += materials.chance;
                if (materialRoll <= cumulativeChance) {
                    selectedMaterials = materials;
                    break;
                }
            }
            
            // Apply loot
            if (selectedLoot) {
                if (selectedLoot.type === 'medkit' || selectedLoot.type === 'shieldPotion') {
                    // Add item
                    this.player.items[selectedLoot.type] += selectedLoot.amount;
                    
                    // Show notification
                    this.showNotification(`Found a ${selectedLoot.type}!`);
                } else {
                    // Find an empty weapon slot
                    const emptySlotIndex = this.player.weapons.findIndex(w => w.type === 'empty');
                    
                    if (emptySlotIndex !== -1) {
                        // Add weapon to empty slot
                        this.player.weapons[emptySlotIndex] = {
                            type: selectedLoot.type,
                            damage: selectedLoot.type === 'pistol' ? 25 : selectedLoot.type === 'shotgun' ? 50 : 35,
                            range: selectedLoot.type === 'pistol' ? 300 : selectedLoot.type === 'shotgun' ? 150 : 400
                        };
                        
                        // Add ammo
                        this.player.ammo[selectedLoot.type] += selectedLoot.ammo;
                        
                        // Show notification
                        this.showNotification(`Found ${selectedLoot.type} with ${selectedLoot.ammo} ammo!`);
                    } else {
                        // No empty slots, just add ammo
                        this.player.ammo[selectedLoot.type] += selectedLoot.ammo;
                        this.showNotification(`Found ${selectedLoot.ammo} ${selectedLoot.type} ammo!`);
                    }
                }
            }
            
            if (selectedMaterials) {
                // Add materials
                this.player.materials.wood += selectedMaterials.wood;
                this.player.materials.stone += selectedMaterials.stone;
                
                // Show notification
                if (selectedMaterials.wood > 0 && selectedMaterials.stone > 0) {
                    this.showNotification(`Found ${selectedMaterials.wood} wood and ${selectedMaterials.stone} stone!`);
                } else if (selectedMaterials.wood > 0) {
                    this.showNotification(`Found ${selectedMaterials.wood} wood!`);
                } else if (selectedMaterials.stone > 0) {
                    this.showNotification(`Found ${selectedMaterials.stone} stone!`);
                }
            }
        } catch (error) {
            console.error("Error generating random loot:", error);
            // Show a generic notification if something goes wrong
            this.showNotification("Found some loot!");
        }
    }

    showNotification(message) {
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            
            // Add to document
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                try {
                    if (notification && notification.parentNode) {
                        notification.remove();
                    }
                } catch (e) {
                    console.error("Error removing notification:", e);
                }
            }, 3000);
        } catch (error) {
            console.error("Error showing notification:", error);
        }
    }

    togglePause() {
        if (this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }
    
    showPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'pause-menu';
        pauseMenu.id = 'pauseMenu';
        pauseMenu.innerHTML = `
            <h1>Game Paused</h1>
            <div class="button-container">
                <button id="resumeButton">Resume</button>
                <button id="returnToLobbyButton">Return to Lobby</button>
            </div>
        `;
        
        document.body.appendChild(pauseMenu);
        
        // Add event listeners
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('returnToLobbyButton').addEventListener('click', () => {
            // Clear game state from localStorage
            localStorage.removeItem('gameData');
            // Redirect to lobby
            window.location.href = 'index.html';
        });
    }
    
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
    }
    
    drawPauseOverlay() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw pause text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 40);
    }

    toggleBuildMode() {
        if (this.gameOver || this.gamePaused) return;
        this.buildMode = !this.buildMode;
        
        if (this.buildMode) {
            // No notification for build mode activation
        } else {
            // No notification for build mode deactivation
        }
    }
    
    selectBuildingType(type) {
        if (!this.buildMode) return;
        
        this.selectedBuildingType = type;
        // No notification for building type selection
    }
    
    build() {
        if (!this.buildMode) return;
        
        // Check if player has enough materials
        const requiredMaterials = {
            'wall': { wood: 20, stone: 0 },
            'tower': { wood: 30, stone: 20 },
            'base': { wood: 50, stone: 50 }
        };
        
        const materials = requiredMaterials[this.selectedBuildingType];
        
        if (this.player.materials.wood < materials.wood || this.player.materials.stone < materials.stone) {
            // No notification for insufficient materials
            return;
        }
        
        // Deduct materials
        this.player.materials.wood -= materials.wood;
        this.player.materials.stone -= materials.stone;
        
        // Create building
        const building = {
            x: this.player.x,
            y: this.player.y,
            width: this.selectedBuildingType === 'wall' ? 100 : this.selectedBuildingType === 'tower' ? 60 : 200,
            height: this.selectedBuildingType === 'wall' ? 20 : this.selectedBuildingType === 'tower' ? 100 : 100,
            health: this.selectedBuildingType === 'wall' ? 100 : this.selectedBuildingType === 'tower' ? 200 : 500,
            type: this.selectedBuildingType,
            owner: 'player'
        };
        
        this.buildings.push(building);
        
        // No notification for building placement
    }
    
    botBuild(bot) {
        // Check if bot has enough materials
        const buildingTypes = ['wall', 'tower', 'base'];
        const selectedType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
        
        const requiredMaterials = {
            'wall': { wood: 20, stone: 0 },
            'tower': { wood: 30, stone: 20 },
            'base': { wood: 50, stone: 50 }
        };
        
        const materials = requiredMaterials[selectedType];
        
        if (bot.materials.wood < materials.wood || bot.materials.stone < materials.stone) {
            // Bot can't build, go back to patrol
            bot.state = 'patrol';
            return;
        }
        
        // Deduct materials
        bot.materials.wood -= materials.wood;
        bot.materials.stone -= materials.stone;
        
        // Create building
        const building = {
            x: bot.x,
            y: bot.y,
            width: selectedType === 'wall' ? 100 : selectedType === 'tower' ? 60 : 200,
            height: selectedType === 'wall' ? 20 : selectedType === 'tower' ? 100 : 100,
            health: selectedType === 'wall' ? 100 : selectedType === 'tower' ? 200 : 500,
            type: selectedType,
            owner: 'bot',
            ownerName: bot.name
        };
        
        this.buildings.push(building);
        
        // Reset build timer
        bot.buildTimer = 0;
        
        // No notification for bot building
    }
    
    toggleMinimap() {
        // Don't allow minimap toggle on mobile
        if (this.isMobile) return;
        
        this.minimapVisible = !this.minimapVisible;
        this.showNotification(this.minimapVisible ? "Minimap shown" : "Minimap hidden");
    }
    
    drawBuildPreview() {
        // Calculate building position (snap to grid)
        const gridSize = 40;
        const buildingX = Math.floor((this.mouse.x - this.width/2 + this.player.x) / gridSize) * gridSize;
        const buildingY = Math.floor((this.mouse.y - this.height/2 + this.player.y) / gridSize) * gridSize;
        
        // Check if there's already a building at this position
        const buildingExists = this.buildings.some(building => 
            building.x === buildingX && building.y === buildingY
        );
        
        // Set color based on whether building is possible
        this.ctx.fillStyle = buildingExists ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
        
        // Draw preview
        const width = this.selectedBuildingType === 'wall' ? 40 : 
                     this.selectedBuildingType === 'tower' ? 60 : 100;
        const height = this.selectedBuildingType === 'wall' ? 40 : 
                      this.selectedBuildingType === 'tower' ? 80 : 100;
        
        this.ctx.fillRect(
            buildingX - this.player.x + this.width/2,
            buildingY - this.player.y + this.height/2,
            width,
            height
        );
        
        // Draw building type text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.selectedBuildingType.toUpperCase(),
            buildingX - this.player.x + this.width/2 + width/2,
            buildingY - this.player.y + this.height/2 + height/2
        );
    }

    useMedkit() {
        if (this.gameOver || this.gamePaused || this.buildMode) return;
        
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastItemUseTime < this.itemCooldown) {
            return;
        }
        
        // Check if player has medkits
        if (this.player.items.medkit <= 0) {
            this.showNotification("No medkits available!");
            return;
        }
        
        // Check if player needs healing
        if (this.player.health >= 100) {
            this.showNotification("Health is already full!");
            return;
        }
        
        // Use medkit
        this.player.items.medkit--;
        this.player.health = Math.min(100, this.player.health + 50);
        this.lastItemUseTime = currentTime;
        
        // Show notification
        this.showNotification("Used medkit! +50 health");
    }
    
    useShieldPotion() {
        if (this.gameOver || this.gamePaused || this.buildMode) return;
        
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastItemUseTime < this.itemCooldown) {
            return;
        }
        
        // Check if player has shield potions
        if (this.player.items.shieldPotion <= 0) {
            this.showNotification("No shield potions available!");
            return;
        }
        
        // Check if player needs shield
        if (this.player.shield >= 100) {
            this.showNotification("Shield is already full!");
            return;
        }
        
        // Use shield potion
        this.player.items.shieldPotion--;
        this.player.shield = Math.min(100, this.player.shield + 50);
        this.lastItemUseTime = currentTime;
        
        // Show notification
        this.showNotification("Used shield potion! +50 shield");
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
}); 
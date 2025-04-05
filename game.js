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

        // Detect if device is mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Initialize touch controls for mobile
        this.touchControls = {
            joystick: {
                active: false,
                x: 0,
                y: 0,
                startX: 0,
                startY: 0,
                radius: 50
            },
            buttons: {
                shoot: {
                    active: false,
                    x: this.width - 80,
                    y: this.height - 80,
                    radius: 40
                },
                build: {
                    active: false,
                    x: this.width - 80,
                    y: this.height - 160,
                    radius: 40
                },
                useItem: {
                    active: false,
                    x: this.width - 80,
                    y: this.height - 240,
                    radius: 40
                }
            }
        };

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
        this.minimapVisible = true;
        this.buildMode = false;
        this.selectedBuildingType = 'wall'; // wall, tower, base
        this.lastItemUseTime = 0;
        this.itemCooldown = 1000; // milliseconds between item uses

        // Generate terrain
        this.generateTerrain();
        
        // Generate bots
        this.generateBots();

        // Set up event listeners
        this.setupEventListeners();

        // Start game loop
        this.lastTime = 0;
        this.gameLoop(0);
        
        // Show mobile controls if on mobile
        if (this.isMobile) {
            this.showMobileControls();
        }
    }

    generateTerrain() {
        // Generate trees
        for (let i = 0; i < 50; i++) {
            this.trees.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                width: 40,
                height: 60,
                health: 100
            });
        }

        // Generate rocks
        for (let i = 0; i < 30; i++) {
            this.rocks.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                width: 30,
                height: 30,
                health: 200
            });
        }

        // Generate chests
        for (let i = 0; i < 10; i++) {
            this.chests.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
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
        
        // Generate 5 bots
        for (let i = 0; i < 5; i++) {
            this.bots.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
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
                    x: Math.random() * 2000 - 1000,
                    y: Math.random() * 2000 - 1000
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
        
        // Scroll wheel to change weapons - improved sensitivity
        this.canvas.addEventListener('wheel', (e) => {
            if (this.gameOver || this.gamePaused || this.buildMode) return;
            
            // Determine scroll direction with improved sensitivity
            // Use a smaller threshold to make it more responsive
            const scrollThreshold = 5;
            
            if (Math.abs(e.deltaY) > scrollThreshold) {
                if (e.deltaY < 0) {
                    // Scrolling up - switch to previous weapon
                    this.switchWeapon((this.player.currentWeapon - 1 + this.player.weapons.length) % this.player.weapons.length);
                } else {
                    // Scrolling down - switch to next weapon
                    this.switchWeapon((this.player.currentWeapon + 1) % this.player.weapons.length);
                }
                
                // Show notification for weapon switch
                const weapon = this.player.weapons[this.player.currentWeapon];
                if (weapon.type !== 'empty') {
                    this.showNotification(`Switched to ${weapon.type}`);
                }
                
                // Prevent default scrolling behavior
                e.preventDefault();
            }
        });
        
        // Touch controls for mobile
        if (this.isMobile) {
            // Touch start event
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                
                // Check if touch is in joystick area (left side of screen)
                if (touchX < 150 && touchY > this.height - 150) {
                    this.touchControls.joystick.active = true;
                    this.touchControls.joystick.startX = touchX;
                    this.touchControls.joystick.startY = touchY;
                    this.touchControls.joystick.x = touchX;
                    this.touchControls.joystick.y = touchY;
                }
                
                // Check if touch is in shoot button area
                const shootBtn = this.touchControls.buttons.shoot;
                if (this.distance({x: touchX, y: touchY}, {x: shootBtn.x, y: shootBtn.y}) < shootBtn.radius) {
                    shootBtn.active = true;
                    if (this.buildMode) {
                        this.build();
                    } else if (this.player.currentWeapon === 0) {
                        this.usePickaxe();
                    } else {
                        this.shoot();
                    }
                }
                
                // Check if touch is in build button area
                const buildBtn = this.touchControls.buttons.build;
                if (this.distance({x: touchX, y: touchY}, {x: buildBtn.x, y: buildBtn.y}) < buildBtn.radius) {
                    buildBtn.active = true;
                    this.toggleBuildMode();
                }
                
                // Check if touch is in use item button area
                const useItemBtn = this.touchControls.buttons.useItem;
                if (this.distance({x: touchX, y: touchY}, {x: useItemBtn.x, y: useItemBtn.y}) < useItemBtn.radius) {
                    useItemBtn.active = true;
                    this.useMedkit();
                }
            });
            
            // Touch move event
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                
                // Update joystick position if active
                if (this.touchControls.joystick.active) {
                    const dx = touchX - this.touchControls.joystick.startX;
                    const dy = touchY - this.touchControls.joystick.startY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > this.touchControls.joystick.radius) {
                        // Limit joystick movement to radius
                        const angle = Math.atan2(dy, dx);
                        this.touchControls.joystick.x = this.touchControls.joystick.startX + Math.cos(angle) * this.touchControls.joystick.radius;
                        this.touchControls.joystick.y = this.touchControls.joystick.startY + Math.sin(angle) * this.touchControls.joystick.radius;
                    } else {
                        this.touchControls.joystick.x = touchX;
                        this.touchControls.joystick.y = touchY;
                    }
                }
                
                // Update mouse position for aiming
                this.mouse = {
                    x: touchX,
                    y: touchY
                };
                
                // Auto-fire when touching shoot button
                if (this.touchControls.buttons.shoot.active && this.player.currentWeapon !== 0 && !this.gamePaused && !this.gameOver && !this.buildMode) {
                    this.shoot();
                }
            });
            
            // Touch end event
            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                
                // Reset joystick
                this.touchControls.joystick.active = false;
                
                // Reset buttons
                this.touchControls.buttons.shoot.active = false;
                this.touchControls.buttons.build.active = false;
                this.touchControls.buttons.useItem.active = false;
            });
            
            // Handle multiple touches for weapon switching
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    // Two finger tap - switch weapon
                    this.switchWeapon((this.player.currentWeapon + 1) % this.player.weapons.length);
                    
                    // Show notification for weapon switch
                    const weapon = this.player.weapons[this.player.currentWeapon];
                    if (weapon.type !== 'empty') {
                        this.showNotification(`Switched to ${weapon.type}`);
                    }
                }
            });
        }
    }

    switchWeapon(index) {
        if (index < this.player.weapons.length) {
            this.player.currentWeapon = index;
            
            // Update UI to show active weapon
            document.querySelectorAll('.weapon-slot').forEach((slot, i) => {
                slot.classList.toggle('active', i === index);
            });
            
            // Update weapon name in slot
            const weapon = this.player.weapons[index];
            const weaponName = weapon.type === 'empty' ? 'Empty' : 
                              weapon.type.charAt(0).toUpperCase() + weapon.type.slice(1);
            
            document.querySelectorAll('.weapon-slot')[index].textContent = weaponName;
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
        
        // Calculate angle to player
        const angle = Math.atan2(
            this.player.y - bot.y,
            this.player.x - bot.x
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
            owner: 'bot'
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
                    owner: 'bot'
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
            
            // Update bot state
            const distToPlayer = this.distance(bot, this.player);
            
            // Update build timer
            bot.buildTimer += deltaTime;
            
            // Bot AI logic
            if (distToPlayer < 300) {
                // Player is in range, chase and attack
                bot.state = 'chase';
                
                // Move towards player
                const angle = Math.atan2(
                    this.player.y - bot.y,
                    this.player.x - bot.x
                );
                
                bot.x += Math.cos(angle) * bot.speed;
                bot.y += Math.sin(angle) * bot.speed;
                
                // Shoot at player if in range
                if (distToPlayer < 200) {
                    this.botShoot(bot);
                }
                
                // Use items if health or shield is low
                if (bot.health < 50 && bot.items.medkit > 0) {
                    bot.items.medkit--;
                    bot.health = Math.min(100, bot.health + 50);
                    this.showNotification(`${bot.name} used a medkit!`);
                }
                
                if (bot.shield < 30 && bot.items.shieldPotion > 0) {
                    bot.items.shieldPotion--;
                    bot.shield = Math.min(100, bot.shield + 50);
                    this.showNotification(`${bot.name} used a shield potion!`);
                }
            } else if (bot.state === 'chase') {
                // Lost player, go back to patrol
                bot.state = 'patrol';
                bot.patrolPoint = {
                    x: Math.random() * 2000 - 1000,
                    y: Math.random() * 2000 - 1000
                };
                bot.patrolTimer = 0;
                bot.patrolDuration = 3000 + Math.random() * 5000;
            } else if (bot.buildTimer >= bot.buildCooldown) {
                // Time to build something
                bot.state = 'build';
                
                // Try to build
                this.botBuild(bot);
                
                // If couldn't build, go back to patrol
                if (bot.state === 'build') {
                    bot.state = 'patrol';
                    bot.patrolPoint = {
                        x: Math.random() * 2000 - 1000,
                        y: Math.random() * 2000 - 1000
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
                        x: Math.random() * 2000 - 1000,
                        y: Math.random() * 2000 - 1000
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
                        x: Math.random() * 2000 - 1000,
                        y: Math.random() * 2000 - 1000
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
        });
    }

    update(deltaTime) {
        if (this.gameOver || this.gamePaused) return;

        // Update player position based on keyboard or joystick
        if (this.isMobile && this.touchControls.joystick.active) {
            // Mobile joystick control
            const dx = this.touchControls.joystick.x - this.touchControls.joystick.startX;
            const dy = this.touchControls.joystick.y - this.touchControls.joystick.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) { // Dead zone
                const angle = Math.atan2(dy, dx);
                const speed = Math.min(distance / this.touchControls.joystick.radius, 1) * this.player.speed;
                
                this.player.x += Math.cos(angle) * speed;
                this.player.y += Math.sin(angle) * speed;
            }
        } else {
            // Keyboard control
            if (this.keys['w'] || this.keys['ArrowUp']) this.player.y -= this.player.speed;
            if (this.keys['s'] || this.keys['ArrowDown']) this.player.y += this.player.speed;
            if (this.keys['a'] || this.keys['ArrowLeft']) this.player.x -= this.player.speed;
            if (this.keys['d'] || this.keys['ArrowRight']) this.player.x += this.player.speed;
        }

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
            if (bullet.x < -1000 || bullet.x > 3000 || bullet.y < -1000 || bullet.y > 3000) {
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
            
            // Check for collisions with bots (if player bullet)
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
            }
            
            // Check for collision with player (if bot bullet)
            if (bullet.owner === 'bot') {
                if (this.checkCollision(bullet, this.player)) {
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
        
        // Remove mobile controls if they exist
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.remove();
        }
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
        
        // Draw mobile controls if on mobile
        if (this.isMobile) {
            this.drawMobileControls();
        }
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
        if (!this.minimapVisible) return;
        
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
            minimapX + (this.player.x + 1000) * minimapScale,
            minimapY + (this.player.y + 1000) * minimapScale,
            5,
            5
        );
        
        // Draw bots on minimap
        this.ctx.fillStyle = '#ff0000';
        this.bots.forEach(bot => {
            if (!bot.isAlive) return;
            
            this.ctx.fillRect(
                minimapX + (bot.x + 1000) * minimapScale,
                minimapY + (bot.y + 1000) * minimapScale,
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
                minimapX + (building.x + 1000) * minimapScale,
                minimapY + (building.y + 1000) * minimapScale,
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
        
        // Draw player count
        const aliveBots = this.bots.filter(b => b.isAlive).length;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `Players: ${this.player.isAlive ? 1 : 0}`,
            minimapX,
            minimapY + minimapSize + 20
        );
        this.ctx.fillText(
            `Bots: ${aliveBots}`,
            minimapX,
            minimapY + minimapSize + 40
        );
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
            this.showNotification("Build mode activated. Press W for wall, E for tower, R for base.");
        } else {
            this.showNotification("Build mode deactivated.");
        }
    }
    
    selectBuildingType(type) {
        if (!this.buildMode) return;
        
        this.selectedBuildingType = type;
        this.showNotification(`Selected building type: ${type}`);
    }
    
    build() {
        if (!this.buildMode) return;
        
        // Check if player has enough materials
        const buildingCosts = {
            wall: { wood: 10, stone: 5 },
            tower: { wood: 20, stone: 15 },
            base: { wood: 50, stone: 30 }
        };
        
        const cost = buildingCosts[this.selectedBuildingType];
        
        if (this.player.materials.wood < cost.wood || this.player.materials.stone < cost.stone) {
            this.showNotification(`Not enough materials! Need ${cost.wood} wood and ${cost.stone} stone.`);
            return;
        }
        
        // Calculate building position (snap to grid)
        const gridSize = 40;
        const buildingX = Math.floor((this.mouse.x - this.width/2 + this.player.x) / gridSize) * gridSize;
        const buildingY = Math.floor((this.mouse.y - this.height/2 + this.player.y) / gridSize) * gridSize;
        
        // Check if there's already a building at this position
        const buildingExists = this.buildings.some(building => 
            building.x === buildingX && building.y === buildingY
        );
        
        if (buildingExists) {
            this.showNotification("Cannot build here - building already exists!");
            return;
        }
        
        // Create building
        const building = {
            x: buildingX,
            y: buildingY,
            type: this.selectedBuildingType,
            health: this.selectedBuildingType === 'wall' ? 100 : 
                    this.selectedBuildingType === 'tower' ? 200 : 500,
            owner: 'player',
            width: this.selectedBuildingType === 'wall' ? 40 : 
                   this.selectedBuildingType === 'tower' ? 60 : 100,
            height: this.selectedBuildingType === 'wall' ? 40 : 
                    this.selectedBuildingType === 'tower' ? 80 : 100
        };
        
        // Add building to list
        this.buildings.push(building);
        
        // Deduct materials
        this.player.materials.wood -= cost.wood;
        this.player.materials.stone -= cost.stone;
        
        // Show notification
        this.showNotification(`Built a ${this.selectedBuildingType}!`);
    }
    
    botBuild(bot) {
        // Check if bot has enough materials
        const buildingCosts = {
            wall: { wood: 10, stone: 5 },
            tower: { wood: 20, stone: 15 },
            base: { wood: 50, stone: 30 }
        };
        
        // Choose a random building type
        const buildingTypes = ['wall', 'tower', 'base'];
        const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
        const cost = buildingCosts[buildingType];
        
        if (bot.materials.wood < cost.wood || bot.materials.stone < cost.stone) {
            return;
        }
        
        // Find a suitable location near the bot
        const gridSize = 40;
        const searchRadius = 200;
        
        for (let i = 0; i < 10; i++) {
            const offsetX = (Math.random() - 0.5) * searchRadius;
            const offsetY = (Math.random() - 0.5) * searchRadius;
            
            const buildingX = Math.floor((bot.x + offsetX) / gridSize) * gridSize;
            const buildingY = Math.floor((bot.y + offsetY) / gridSize) * gridSize;
            
            // Check if there's already a building at this position
            const buildingExists = this.buildings.some(building => 
                building.x === buildingX && building.y === buildingY
            );
            
            if (!buildingExists) {
                // Create building
                const building = {
                    x: buildingX,
                    y: buildingY,
                    type: buildingType,
                    health: buildingType === 'wall' ? 100 : 
                            buildingType === 'tower' ? 200 : 500,
                    owner: 'bot',
                    ownerName: bot.name,
                    width: buildingType === 'wall' ? 40 : 
                           buildingType === 'tower' ? 60 : 100,
                    height: buildingType === 'wall' ? 40 : 
                            buildingType === 'tower' ? 80 : 100
                };
                
                // Add building to list
                this.buildings.push(building);
                
                // Deduct materials
                bot.materials.wood -= cost.wood;
                bot.materials.stone -= cost.stone;
                
                // Show notification
                this.showNotification(`${bot.name} built a ${buildingType}!`);
                
                // Reset build timer
                bot.buildTimer = 0;
                bot.buildCooldown = 5000 + Math.random() * 10000;
                
                return;
            }
        }
    }
    
    toggleMinimap() {
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

    showMobileControls() {
        // Create mobile controls container
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        mobileControls.id = 'mobileControls';
        
        // Create weapon switcher
        const weaponSwitcher = document.createElement('div');
        weaponSwitcher.className = 'weapon-switcher';
        weaponSwitcher.innerHTML = `
            <div class="weapon-slot active">1</div>
            <div class="weapon-slot">2</div>
            <div class="weapon-slot">3</div>
        `;
        
        // Add weapon switcher to mobile controls
        mobileControls.appendChild(weaponSwitcher);
        
        // Add mobile controls to document
        document.body.appendChild(mobileControls);
        
        // Add event listeners to weapon slots
        document.querySelectorAll('.weapon-switcher .weapon-slot').forEach((slot, i) => {
            slot.addEventListener('click', () => {
                this.switchWeapon(i);
                
                // Update active weapon slot
                document.querySelectorAll('.weapon-switcher .weapon-slot').forEach((s, j) => {
                    s.classList.toggle('active', j === i);
                });
            });
        });
    }
    
    drawMobileControls() {
        // Draw joystick
        if (this.touchControls.joystick.active) {
            // Draw joystick base
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(
                this.touchControls.joystick.startX,
                this.touchControls.joystick.startY,
                this.touchControls.joystick.radius,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw joystick handle
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(
                this.touchControls.joystick.x,
                this.touchControls.joystick.y,
                20,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        } else {
            // Draw joystick base (inactive)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                this.touchControls.joystick.startX,
                this.touchControls.joystick.startY,
                this.touchControls.joystick.radius,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Draw action buttons
        const buttons = this.touchControls.buttons;
        
        // Draw shoot button
        this.ctx.fillStyle = buttons.shoot.active ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(
            buttons.shoot.x,
            buttons.shoot.y,
            buttons.shoot.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw build button
        this.ctx.fillStyle = buttons.build.active ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 255, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(
            buttons.build.x,
            buttons.build.y,
            buttons.build.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw use item button
        this.ctx.fillStyle = buttons.useItem.active ? 'rgba(0, 0, 255, 0.7)' : 'rgba(0, 0, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(
            buttons.useItem.x,
            buttons.useItem.y,
            buttons.useItem.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw button icons
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Shoot icon
        this.ctx.fillText('🔫', buttons.shoot.x, buttons.shoot.y);
        
        // Build icon
        this.ctx.fillText('🏗️', buttons.build.x, buttons.build.y);
        
        // Use item icon
        this.ctx.fillText('💊', buttons.useItem.x, buttons.useItem.y);
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
}); 
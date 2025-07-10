class NinjaShooter {
    constructor() {
        console.log('NinjaShooter constructor called');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameStarted = false;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.spacePressed = false;
        this.lastBulletTime = 0;
        
        // Mobile controls
        this.mobileControls = {
            joystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0 },
            attackButton: false
        };
        
        try {
            this.init();
            this.setupEventListeners();
            console.log('NinjaShooter initialized successfully');
        } catch (error) {
            console.error('Error initializing NinjaShooter:', error);
        }
        
        // Setup mobile controls separately to prevent blocking game initialization
        this.setupMobileControlsSafely();
    }

    init() {
        console.log('Initializing game...');
        try {
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
            
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 5, 10);
            
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x1a1a2e);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap || THREE.BasicShadowMap;
            
            const gameContainer = document.getElementById('gameContainer');
            if (!gameContainer) {
                throw new Error('Game container not found');
            }
            gameContainer.appendChild(this.renderer.domElement);
            
            this.setupLights();
            this.setupEnvironment();
            this.createPlayer();
            
            window.addEventListener('resize', () => this.onWindowResize());
            console.log('Game initialization completed');
        } catch (error) {
            console.error('Error in init():', error);
            throw error;
        }
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
    }

    setupEnvironment() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 和風建物の設置
        for (let i = 0; i < 8; i++) {
            const buildingGroup = new THREE.Group();
            
            // 建物の基礎
            const baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
            const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 0.25;
            buildingGroup.add(base);
            
            // 建物の壁
            const wallGeometry = new THREE.BoxGeometry(1.8, 2, 1.8);
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf4e4c1 });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.y = 1.25;
            buildingGroup.add(wall);
            
            // 屋根
            const roofGeometry = new THREE.ConeGeometry(1.5, 1, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = 2.75;
            roof.rotation.y = Math.PI / 4;
            buildingGroup.add(roof);
            
            buildingGroup.position.set(
                (Math.random() - 0.5) * 35,
                0,
                (Math.random() - 0.5) * 35
            );
            buildingGroup.castShadow = true;
            this.scene.add(buildingGroup);
        }
        
        // 竹林の追加
        for (let i = 0; i < 15; i++) {
            const bambooGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
            const bambooMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
            const bamboo = new THREE.Mesh(bambooGeometry, bambooMaterial);
            bamboo.position.set(
                (Math.random() - 0.5) * 40,
                2,
                (Math.random() - 0.5) * 40
            );
            bamboo.castShadow = true;
            this.scene.add(bamboo);
        }
    }

    createPlayer() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);

        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.8;
        head.castShadow = true;
        group.add(head);

        const maskGeometry = new THREE.PlaneGeometry(0.4, 0.15);
        const maskMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const mask = new THREE.Mesh(maskGeometry, maskMaterial);
        mask.position.set(0, 0.8, 0.25);
        group.add(mask);

        const eyeGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 0.85, 0.25);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 0.85, 0.25);
        group.add(leftEye, rightEye);

        group.position.set(0, 1, 0);
        this.player = group;
        this.scene.add(group);
        
        // プレイヤーの呼吸アニメーション用の初期値
        this.playerAnimation = {
            breathOffset: 0,
            moveOffset: 0
        };
    }

    createEnemy() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);

        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2a0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.6;
        head.castShadow = true;
        group.add(head);

        group.position.set(
            (Math.random() - 0.5) * 20,
            1,
            -15 - Math.random() * 10
        );
        
        group.userData = {
            health: 1,
            speed: 0.02 + Math.random() * 0.02,
            direction: new THREE.Vector3(0, 0, 1)
        };

        this.enemies.push(group);
        this.scene.add(group);
    }

    createBullet() {
        // 手裏剣の作成
        const shurikenGroup = new THREE.Group();
        
        // 中心の円
        const centerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.rotation.x = Math.PI / 2;
        shurikenGroup.add(center);
        
        // 手裏剣の刃
        for (let i = 0; i < 6; i++) {
            const bladeGeometry = new THREE.ConeGeometry(0.02, 0.15, 3);
            const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.x = Math.PI / 2;
            blade.position.x = 0.08;
            blade.rotation.z = (i * Math.PI) / 3;
            shurikenGroup.add(blade);
        }
        
        const bullet = shurikenGroup;
        
        bullet.position.copy(this.player.position);
        bullet.position.y += 0.5;
        bullet.position.z -= 0.5;
        
        const direction = new THREE.Vector3(0, 0, -1);
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        direction.copy(cameraDirection);
        direction.y = 0;
        direction.normalize();
        
        bullet.userData = {
            direction: direction,
            speed: 0.5,
            life: 100,
            rotationSpeed: 0.3
        };
        
        this.bullets.push(bullet);
        this.scene.add(bullet);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            if (event.code === 'Space') {
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            if (event.code === 'Space') {
                event.preventDefault();
            }
        });

        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Simple start button setup
        this.setupStartButton();
    }
    
    setupStartButton() {
        // Multiple attempts to find and setup start button
        let attempts = 0;
        const maxAttempts = 10;
        
        const trySetupButton = () => {
            attempts++;
            const startButton = document.getElementById('startButton');
            console.log(`Start button setup attempt ${attempts}/${maxAttempts}:`, !!startButton);
            
            if (startButton) {
                startButton.addEventListener('click', () => {
                    console.log('Start button clicked!');
                    this.startGame();
                });
                console.log('Start button event listener added successfully');
                return true;
            } else if (attempts < maxAttempts) {
                setTimeout(trySetupButton, 200);
            } else {
                console.error('Failed to find start button after all attempts');
            }
        };
        
        // Try immediately and also with delays
        trySetupButton();
    }
    
    setupMobileControlsSafely() {
        // Use multiple delayed attempts to setup mobile controls
        let attempts = 0;
        const maxAttempts = 5;
        
        const trySetup = () => {
            attempts++;
            try {
                console.log(`Mobile controls setup attempt ${attempts}/${maxAttempts}`);
                const joystick = document.querySelector('.mobile-joystick');
                const joystickHandle = document.querySelector('.mobile-joystick-handle');
                const attackButton = document.querySelector('.mobile-attack-button');
                
                if (joystick && joystickHandle && attackButton) {
                    this.setupMobileControls();
                    console.log('Mobile controls setup successful');
                    return true;
                } else {
                    console.log('Mobile elements not ready yet, retrying...');
                    if (attempts < maxAttempts) {
                        setTimeout(trySetup, 500);
                    } else {
                        console.log('Mobile controls setup failed after max attempts');
                    }
                }
            } catch (error) {
                console.error('Error in mobile controls setup attempt:', error);
                if (attempts < maxAttempts) {
                    setTimeout(trySetup, 500);
                }
            }
        };
        
        setTimeout(trySetup, 100);
    }
    
    setupMobileControls() {
        console.log('Setting up mobile controls...');
        const joystick = document.querySelector('.mobile-joystick');
        const joystickHandle = document.querySelector('.mobile-joystick-handle');
        const attackButton = document.querySelector('.mobile-attack-button');
        
        if (!joystick || !joystickHandle || !attackButton) {
            console.error('Mobile control elements not found');
            return;
        }
        
        // Touch events for joystick
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.joystick.active = true;
            this.updateJoystick(e.touches[0], joystickHandle);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.mobileControls.joystick.active) {
                this.updateJoystick(e.touches[0], joystickHandle);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileControls.joystick.active = false;
            this.mobileControls.joystick.x = 0;
            this.mobileControls.joystick.y = 0;
            joystickHandle.style.transform = 'translate(-50%, -50%)';
        });
        
        // Touch events for attack button
        attackButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileControls.attackButton = true;
        });
        
        attackButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileControls.attackButton = false;
        });
        
        console.log('Mobile controls setup completed');
    }
    
    updateJoystick(touch, handle) {
        try {
            const joystick = document.querySelector('.mobile-joystick');
            if (!joystick) return;
            
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 30;
            
            if (distance <= maxDistance) {
                this.mobileControls.joystick.x = deltaX / maxDistance;
                this.mobileControls.joystick.y = deltaY / maxDistance;
                handle.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px)`;
            } else {
                const angle = Math.atan2(deltaY, deltaX);
                const limitedX = Math.cos(angle) * maxDistance;
                const limitedY = Math.sin(angle) * maxDistance;
                this.mobileControls.joystick.x = limitedX / maxDistance;
                this.mobileControls.joystick.y = limitedY / maxDistance;
                handle.style.transform = `translate(-50%, -50%) translate(${limitedX}px, ${limitedY}px)`;
            }
        } catch (error) {
            console.error('Error updating joystick:', error);
        }
    }

    startGame() {
        console.log('Starting game...');
        try {
            this.gameStarted = true;
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.style.display = 'none';
                console.log('Start screen hidden');
            } else {
                console.error('Start screen not found');
                return;
            }
            
            // Reset game state
            this.score = 0;
            this.lives = 3;
            this.updateUI();
            
            this.gameLoop();
            console.log('Game loop started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            console.error('Error stack:', error.stack);
        }
    }

    updatePlayer() {
        if (!this.player) return;

        const moveSpeed = 0.1;
        const playerPos = this.player.position;

        // Keyboard controls
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            playerPos.z -= moveSpeed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            playerPos.z += moveSpeed;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            playerPos.x -= moveSpeed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            playerPos.x += moveSpeed;
        }
        
        // Mobile controls
        if (this.mobileControls.joystick.active) {
            playerPos.x += this.mobileControls.joystick.x * moveSpeed;
            playerPos.z += this.mobileControls.joystick.y * moveSpeed;
        }

        playerPos.x = Math.max(-15, Math.min(15, playerPos.x));
        playerPos.z = Math.max(-5, Math.min(15, playerPos.z));

        this.camera.position.x = playerPos.x;
        this.camera.position.z = playerPos.z + 10;
        this.camera.lookAt(playerPos);
        
        // プレイヤーの呼吸アニメーション
        this.playerAnimation.breathOffset += 0.05;
        this.player.position.y = 1 + Math.sin(this.playerAnimation.breathOffset) * 0.05;

        // Keyboard attack
        if (this.keys['Space']) {
            if (!this.spacePressed || Date.now() - this.lastBulletTime > 200) {
                this.createBullet();
                this.lastBulletTime = Date.now();
                this.spacePressed = true;
            }
        } else {
            this.spacePressed = false;
        }
        
        // Mobile attack
        if (this.mobileControls.attackButton) {
            if (Date.now() - this.lastBulletTime > 200) {
                this.createBullet();
                this.lastBulletTime = Date.now();
            }
        }
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const userData = enemy.userData;
            
            enemy.position.add(userData.direction.clone().multiplyScalar(userData.speed));
            
            // 敵の渡りアニメーション
            enemy.rotation.y += 0.05;
            
            if (enemy.position.z > 20) {
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                this.lives--;
                this.updateUI();
            }
        }

        if (Math.random() < 0.02) {
            this.createEnemy();
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const userData = bullet.userData;
            
            bullet.position.add(userData.direction.clone().multiplyScalar(userData.speed));
            bullet.rotation.z += userData.rotationSpeed; // 手裏剣の回転
            userData.life--;
            
            if (userData.life <= 0 || bullet.position.z < -30) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (bullet.position.distanceTo(enemy.position) < 0.8) {
                    // ヒットエフェクトの作成
                    this.createHitEffect(enemy.position);
                    
                    this.scene.remove(bullet);
                    this.scene.remove(enemy);
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 10;
                    this.updateUI();
                    break;
                }
            }
        }
    }

    createHitEffect(position) {
        const particles = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            particle.position.copy(position);
            particle.userData = {
                velocity: direction.multiplyScalar(0.1),
                life: 30
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // パーティクルの削除タイマー
        setTimeout(() => {
            this.scene.remove(particles);
        }, 1000);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameStarted = false;
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('startButton').textContent = 'リスタート';
        document.querySelector('.subtitle').textContent = `最終スコア: ${this.score}`;
        
        this.score = 0;
        this.lives = 3;
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.bullets.forEach(bullet => this.scene.remove(bullet));
        this.enemies = [];
        this.bullets = [];
        this.updateUI();
    }

    gameLoop() {
        if (!this.gameStarted) return;
        
        try {
            this.updatePlayer();
            this.updateEnemies();
            this.updateBullets();
            this.checkCollisions();
            
            this.renderer.render(this.scene, this.camera);
            
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.gameStarted = false;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the game when the script loads
console.log('Game script loaded, initializing game...');
try {
    console.log('Creating NinjaShooter instance...');
    const game = new NinjaShooter();
    console.log('Game instance created successfully');
    window.game = game; // Make game accessible globally for debugging
} catch (error) {
    console.error('Failed to create game instance:', error);
    console.error('Error stack:', error.stack);
}
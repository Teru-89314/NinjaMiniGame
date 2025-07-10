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
        
        try {
            this.init();
            this.setupEventListeners();
            console.log('NinjaShooter initialized successfully');
        } catch (error) {
            console.error('Error initializing NinjaShooter:', error);
        }
    }

    init() {
        console.log('Initializing game...');
        try {
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0x404040, 10, 100);
            
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 5, 10);
            
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0x87CEEB);
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
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f3a });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        for (let i = 0; i < 10; i++) {
            const treeGeometry = new THREE.ConeGeometry(0.5, 3, 8);
            const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a2d });
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(
                (Math.random() - 0.5) * 40,
                1.5,
                (Math.random() - 0.5) * 40
            );
            tree.castShadow = true;
            this.scene.add(tree);
        }
    }

    createPlayer() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
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
        const maskMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
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
    }

    createEnemy() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);

        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x4a0000 });
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
        const geometry = new THREE.SphereGeometry(0.1, 6, 6);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const bullet = new THREE.Mesh(geometry, material);
        
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
            life: 100
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

        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startGame();
            });
            console.log('Start button event listener added');
        } else {
            console.error('Start button not found');
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
            }
            this.gameLoop();
            console.log('Game loop started');
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    updatePlayer() {
        if (!this.player) return;

        const moveSpeed = 0.1;
        const playerPos = this.player.position;

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

        playerPos.x = Math.max(-15, Math.min(15, playerPos.x));
        playerPos.z = Math.max(-5, Math.min(15, playerPos.z));

        this.camera.position.x = playerPos.x;
        this.camera.position.z = playerPos.z + 10;
        this.camera.lookAt(playerPos);

        if (this.keys['Space']) {
            if (!this.spacePressed || Date.now() - this.lastBulletTime > 200) {
                this.createBullet();
                this.lastBulletTime = Date.now();
                this.spacePressed = true;
            }
        } else {
            this.spacePressed = false;
        }
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const userData = enemy.userData;
            
            enemy.position.add(userData.direction.clone().multiplyScalar(userData.speed));
            
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
    const game = new NinjaShooter();
    console.log('Game instance created successfully');
} catch (error) {
    console.error('Failed to create game instance:', error);
}
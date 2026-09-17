/**
 * Cyber Velocity 3D - Main Game Engine
 * Gestiona el bucle de juego, físicas, generación infinita, colisiones, efectos y HUD.
 */

class GameEngine {
    constructor() {
        this.container = document.getElementById('game-container');
        
        // Estado del juego
        this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.score = 0;
        this.distance = 0;
        this.destroyedCount = 0;
        this.highScore = parseInt(localStorage.getItem('cyber_velocity_highscore') || '0', 10);
        this.combo = 1.0;
        this.comboTimer = 0;
        
        // Atributos de nave
        this.health = 100;
        this.maxHealth = 100;
        this.baseSpeed = 65; // unidades por segundo
        this.maxSpeed = 160;
        this.currentSpeed = this.baseSpeed;
        this.lateralSpeed = 22;
        this.shipX = 0;
        this.shipTargetX = 0;
        this.shipBank = 0;
        this.trackWidth = 18;
        
        // Turbo Boost
        this.isBoosting = false;
        this.boostEnergy = 100; // 0 a 100
        this.boostTimer = 0;
        
        // Sistema de disparo
        this.lastShotTime = 0;
        this.shotCooldown = 0.16; // segundos
        this.lasers = [];
        
        // Cámara
        this.cameraMode = 0; // 0: Tercera persona, 1: Cockpit, 2: Alta
        this.cameraShake = 0;
        
        // Entidades y Pista
        this.trackSegments = [];
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.speedLines = null;
        
        // Teclas
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false,
            boost: false
        };

        this.initThree();
        this.initEntities();
        this.initParticles();
        this.initEventListeners();
        this.updateHUDStatic();

        // Game Loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // Escena
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05060f, 0.007);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 4.5, -8);
        this.baseFov = 65;

        // Renderizador WebGL
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.8);
        dirLight.position.set(10, 30, 20);
        this.scene.add(dirLight);

        const backlight = new THREE.DirectionalLight(0xff007f, 1.2);
        backlight.position.set(-10, 20, -30);
        this.scene.add(backlight);
    }

    initEntities() {
        // Nave
        this.player = Models.createPlayerShip();
        this.player.position.set(0, 0.8, 0);
        this.scene.add(this.player);

        // Ciudad de fondo
        this.city = Models.createCityScenery();
        this.scene.add(this.city);

        // Pista inicial (Segmentos continuos)
        this.segmentLength = 120;
        this.totalSegments = 7;
        for (let i = 0; i < this.totalSegments; i++) {
            const seg = Models.createTrackSegment(i * this.segmentLength, this.segmentLength, this.trackWidth);
            this.scene.add(seg);
            this.trackSegments.push(seg);
        }

        // Generar algunos obstáculos iniciales más adelante
        this.spawnDistanceCursor = 150;
    }

    initParticles() {
        // Líneas de velocidad Warp (Speed lines)
        const lineCount = 200;
        const lineGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(lineCount * 6);

        for (let i = 0; i < lineCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 20;
            const z = (Math.random() - 0.5) * 150;
            const len = 4 + Math.random() * 12;

            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z + len;
        }

        lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.25
        });

        this.speedLines = new THREE.LineSegments(lineGeo, lineMat);
        this.scene.add(this.speedLines);
    }

    initEventListeners() {
        // Redimensionamiento
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Controles de teclado
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
            if (e.code === 'Space') {
                this.keys.shoot = true;
                e.preventDefault();
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = true;
            if (e.code === 'KeyC') this.cycleCamera();
            if (e.code === 'KeyP') this.togglePause();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
            if (e.code === 'Space') this.keys.shoot = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = false;
        });

        // Botones de UI
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-restart-pause').addEventListener('click', () => {
            document.getElementById('pause-screen').classList.add('hidden');
            this.restartGame();
        });

        // Botones táctiles para móviles / pantallas touch
        const tLeft = document.getElementById('touch-left');
        const tRight = document.getElementById('touch-right');
        const tShoot = document.getElementById('touch-shoot');
        const tBoost = document.getElementById('touch-boost');

        const bindTouch = (elem, pressFn, releaseFn) => {
            elem.addEventListener('touchstart', (e) => { e.preventDefault(); pressFn(); });
            elem.addEventListener('touchend', (e) => { e.preventDefault(); releaseFn(); });
            elem.addEventListener('mousedown', pressFn);
            elem.addEventListener('mouseup', releaseFn);
        };

        bindTouch(tLeft, () => this.keys.left = true, () => this.keys.left = false);
        bindTouch(tRight, () => this.keys.right = true, () => this.keys.right = false);
        bindTouch(tShoot, () => this.keys.shoot = true, () => this.keys.shoot = false);
        bindTouch(tBoost, () => this.keys.boost = true, () => this.keys.boost = false);

        if ('ontouchstart' in window) {
            document.getElementById('touch-controls').classList.remove('hidden');
        }
    }

    startGame() {
        soundSystem.init();
        soundSystem.startMusic();

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.state = 'PLAYING';
    }

    restartGame() {
        // Reset variables
        this.health = 100;
        this.score = 0;
        this.distance = 0;
        this.destroyedCount = 0;
        this.combo = 1.0;
        this.currentSpeed = this.baseSpeed;
        this.shipTargetX = 0;
        this.shipX = 0;
        this.player.position.set(0, 0.8, 0);
        this.isBoosting = false;
        this.boostEnergy = 100;

        // Limpiar obstáculos y proyectiles
        this.obstacles.forEach(o => this.scene.remove(o));
        this.collectibles.forEach(c => this.scene.remove(c));
        this.lasers.forEach(l => this.scene.remove(l.mesh));
        this.particles.forEach(p => this.scene.remove(p.mesh));
        this.obstacles = [];
        this.collectibles = [];
        this.lasers = [];
        this.particles = [];

        // Reposicionar pista
        for (let i = 0; i < this.trackSegments.length; i++) {
            this.trackSegments[i].position.z = i * this.segmentLength;
        }
        this.spawnDistanceCursor = 150;

        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('damage-vignette').classList.remove('damage-active');
        document.getElementById('boost-vignette').classList.remove('boost-active');
        this.updateHUDStatic();

        soundSystem.startMusic();
        this.state = 'PLAYING';
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pause-screen').classList.remove('hidden');
            soundSystem.stopMusic();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pause-screen').classList.add('hidden');
            soundSystem.startMusic();
        }
    }

    cycleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 3;
        const msg = this.cameraMode === 0 ? "VISTA: 3ª PERSONA" : (this.cameraMode === 1 ? "VISTA: CABINA (1ª)" : "VISTA: AÉREA");
        this.showAlert(msg, 1200);
    }

    showAlert(text, duration = 1500) {
        const banner = document.getElementById('game-message');
        banner.textContent = text;
        banner.classList.remove('hidden');
        clearTimeout(this.alertTimeout);
        this.alertTimeout = setTimeout(() => banner.classList.add('hidden'), duration);
    }

    // DISPARAR LÁSER
    fireLaser() {
        const now = this.clock.getElapsedTime();
        if (now - this.lastShotTime < this.shotCooldown) return;
        this.lastShotTime = now;

        soundSystem.playShoot();

        // Dos disparos simultáneos desde los cañones derecho e izquierdo
        const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6);
        laserGeo.rotateX(Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        [-0.6, 0.6].forEach(offset => {
            const mesh = new THREE.Mesh(laserGeo, laserMat);
            mesh.position.set(this.player.position.x + offset, this.player.position.y + 0.1, this.player.position.z + 2.0);
            this.scene.add(mesh);

            this.lasers.push({
                mesh: mesh,
                collider: new THREE.Box3(),
                spawnZ: mesh.position.z
            });
        });
    }

    // CREACIÓN DE EXPLOSIÓN DE PARTÍCULAS
    createExplosion(position, color = 0xff007f, count = 24) {
        for (let i = 0; i < count; i++) {
            const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const pMat = new THREE.MeshBasicMaterial({ color: color });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(position);

            const speed = 6 + Math.random() * 14;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.cos(phi) * speed + 2,
                Math.sin(phi) * Math.sin(theta) * speed
            );

            this.scene.add(pMesh);
            this.particles.push({
                mesh: pMesh,
                vel: velocity,
                life: 0.6 + Math.random() * 0.4,
                age: 0
            });
        }
    }

    // GENERADOR DE OBSTÁCULOS Y POWER-UPS
    spawnTrackElements() {
        const playerZ = this.player.position.z;
        const maxSpawnZ = playerZ + 450;
        const lanes = [-5.5, -2.8, 0, 2.8, 5.5];

        while (this.spawnDistanceCursor < maxSpawnZ) {
            const z = this.spawnDistanceCursor;
            const roll = Math.random();

            if (roll < 0.35) {
                // Barrera láser en un carril o dos
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const barrier = Models.createLaserBarrier(lane, z);
                this.scene.add(barrier);
                this.obstacles.push(barrier);
            } else if (roll < 0.6) {
                // Mina cyberpunk
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const mine = Models.createCyberMine(lane, z);
                this.scene.add(mine);
                this.obstacles.push(mine);
            } else if (roll < 0.75) {
                // Drone patrullero
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const drone = Models.createDrone(lane, z);
                this.scene.add(drone);
                this.obstacles.push(drone);
            } else if (roll < 0.88) {
                // Cristal de energía o booster
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const crystal = Models.createEnergyCrystal(lane, z);
                this.scene.add(crystal);
                this.collectibles.push(crystal);
            } else if (roll < 0.95) {
                // Turbo pad en el suelo
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const pad = Models.createBoostPad(lane, z);
                this.scene.add(pad);
                this.collectibles.push(pad);
            } else {
                // Power-up de escudo
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const shield = Models.createShieldPickup(lane, z);
                this.scene.add(shield);
                this.collectibles.push(shield);
            }

            // Distancia entre elementos (se reduce gradualmente con la distancia)
            const gap = Math.max(22, 45 - (this.distance / 1500) * 12);
            this.spawnDistanceCursor += gap;
        }
    }

    // RECICLADO DE PISTA Y LIMPIEZA
    recycleTrack() {
        const playerZ = this.player.position.z;

        // Reciclar segmentos de pista que quedaron atrás
        this.trackSegments.forEach(seg => {
            if (seg.position.z < playerZ - this.segmentLength * 1.5) {
                // Encontrar el segmento más adelantado
                let maxZ = -Infinity;
                this.trackSegments.forEach(s => { if (s.position.z > maxZ) maxZ = s.position.z; });
                seg.position.z = maxZ + this.segmentLength;
            }
        });

        // Limpiar obstáculos que quedaron muy atrás
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.position.z < playerZ - 20) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Limpiar coleccionables
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const col = this.collectibles[i];
            if (col.position.z < playerZ - 20) {
                this.scene.remove(col);
                this.collectibles.splice(i, 1);
            }
        }
    }

    // GESTIÓN DE DAÑO
    takeDamage(amount) {
        if (this.isBoosting) return; // Invulnerable durante turbo

        this.health -= amount;
        this.combo = 1.0; // Pérdida de combo
        this.cameraShake = 0.5;
        soundSystem.playHit();

        // Efecto viñeta de daño
        const vig = document.getElementById('damage-vignette');
        vig.classList.add('damage-active');
        setTimeout(() => vig.classList.remove('damage-active'), 300);

        if (this.health <= 0) {
            this.health = 0;
            this.gameOver();
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        soundSystem.playExplosion();
        soundSystem.stopMusic();

        this.createExplosion(this.player.position, 0xff0055, 60);

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('cyber_velocity_highscore', this.highScore.toString());
        }

        document.getElementById('final-distance').textContent = `${Math.floor(this.distance)} m`;
        document.getElementById('final-score').textContent = Math.floor(this.score).toLocaleString();
        document.getElementById('final-destroyed').textContent = this.destroyedCount;
        document.getElementById('final-highscore').textContent = this.highScore.toLocaleString();

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    // ACTUALIZACIÓN PRINCIPAL
    update(dt) {
        if (this.state !== 'PLAYING') return;

        // 1. Manejo de velocidad y aceleración
        let targetSpeed = this.baseSpeed + Math.min(60, (this.distance / 1000) * 8);

        if (this.keys.up) targetSpeed += 25;
        if (this.keys.down) targetSpeed -= 30;

        // Turbo Nitro
        if (this.keys.boost && this.boostEnergy > 10) {
            this.isBoosting = true;
            targetSpeed = this.maxSpeed;
            this.boostEnergy = Math.max(0, this.boostEnergy - dt * 35);
            document.getElementById('boost-vignette').classList.add('boost-active');
            if (!this.boostSoundPlayed) {
                soundSystem.playBoost();
                this.boostSoundPlayed = true;
            }
        } else {
            this.isBoosting = false;
            this.boostEnergy = Math.min(100, this.boostEnergy + dt * 10);
            this.boostSoundPlayed = false;
            document.getElementById('boost-vignette').classList.remove('boost-active');
        }

        // Interpolación de velocidad
        this.currentSpeed += (targetSpeed - this.currentSpeed) * (dt * 4);

        // Avanzar nave
        const forwardMove = this.currentSpeed * dt;
        this.player.position.z += forwardMove;
        this.distance += forwardMove;
        this.score += forwardMove * 0.5 * this.combo;

        // Sonido de motor
        soundSystem.updateEngine(this.currentSpeed / this.maxSpeed, this.isBoosting);

        // 2. Control lateral y alabeo (banking/roll)
        const halfTrack = (this.trackWidth / 2) - 1.5;
        if (this.keys.left) {
            this.shipTargetX = Math.max(-halfTrack, this.shipTargetX - this.lateralSpeed * dt);
            this.shipBank = Math.min(0.45, this.shipBank + dt * 4);
        } else if (this.keys.right) {
            this.shipTargetX = Math.min(halfTrack, this.shipTargetX + this.lateralSpeed * dt);
            this.shipBank = Math.max(-0.45, this.shipBank - dt * 4);
        } else {
            this.shipBank *= Math.exp(-dt * 6);
        }

        this.shipX += (this.shipTargetX - this.shipX) * (dt * 12);
        this.player.position.x = this.shipX;
        this.player.rotation.z = this.shipBank;
        this.player.rotation.y = -this.shipBank * 0.3;

        // Flamas de propulsores escalan con velocidad
        const flameScale = (this.currentSpeed / this.baseSpeed) * (this.isBoosting ? 2.2 : 1.0);
        if (this.player.flames) {
            this.player.flames.forEach(f => {
                f.scale.set(1, 1, flameScale + Math.random() * 0.3);
            });
        }

        // 3. Disparo
        if (this.keys.shoot) {
            this.fireLaser();
        }

        // 4. Actualizar proyectiles láser
        const laserSpeed = 220;
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.mesh.position.z += laserSpeed * dt;
            l.collider.setFromCenterAndSize(l.mesh.position, new THREE.Vector3(0.5, 0.5, 2.5));

            // Colisión de láser con obstáculos
            let hit = false;
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const obs = this.obstacles[j];
                if (l.collider.intersectsBox(obs.collider)) {
                    hit = true;
                    obs.userData.health -= 1;
                    this.createExplosion(l.mesh.position, 0x00f3ff, 12);

                    if (obs.userData.health <= 0) {
                        this.createExplosion(obs.position, 0xff0055, 30);
                        soundSystem.playExplosion();
                        this.score += (obs.userData.scoreValue || 100) * this.combo;
                        this.destroyedCount++;
                        this.increaseCombo();
                        this.scene.remove(obs);
                        this.obstacles.splice(j, 1);
                    }
                    break;
                }
            }

            // Eliminar proyectiles fuera de rango
            if (hit || l.mesh.position.z > this.player.position.z + 250) {
                this.scene.remove(l.mesh);
                this.lasers.splice(i, 1);
            }
        }

        // 5. Actualizar caja de colisión de nave
        this.player.collider.setFromCenterAndSize(
            new THREE.Vector3(this.player.position.x, this.player.position.y + 0.2, this.player.position.z),
            new THREE.Vector3(1.8, 0.8, 2.6)
        );

        // 6. Colisiones con obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Animación flotante de minas y drones
            if (obs.userData.type === 'mine') {
                obs.rotation.y += dt * 2;
                obs.ring.rotation.x += dt * 3;
            } else if (obs.userData.type === 'drone') {
                obs.userData.moveTime += dt * 2.5;
                obs.position.x = obs.userData.baseLaneX + Math.sin(obs.userData.moveTime) * 1.5;
                obs.updateCollider();
            }

            if (this.player.collider.intersectsBox(obs.collider)) {
                if (this.isBoosting) {
                    // Si estamos en turbo, arrollamos el obstáculo
                    this.createExplosion(obs.position, 0xffaa00, 35);
                    soundSystem.playExplosion();
                    this.score += 250 * this.combo;
                    this.destroyedCount++;
                    this.increaseCombo();
                    this.scene.remove(obs);
                    this.obstacles.splice(i, 1);
                } else {
                    this.takeDamage(25);
                    this.createExplosion(obs.position, 0xff0055, 25);
                    this.scene.remove(obs);
                    this.obstacles.splice(i, 1);
                }
            }
        }

        // 7. Colisiones con coleccionables y Boost Pads
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const col = this.collectibles[i];

            // Animación de rotación
            col.rotation.y += dt * 2.5;

            if (this.player.collider.intersectsBox(col.collider)) {
                if (col.userData.isBoostPad) {
                    // Activar turbo instantáneo
                    this.isBoosting = true;
                    this.currentSpeed = this.maxSpeed;
                    this.boostEnergy = 100;
                    this.showAlert("HYPERDRIVE ACTIVADO!", 1000);
                    soundSystem.playBoost();
                } else if (col.userData.type === 'crystal') {
                    soundSystem.playPickup();
                    this.score += col.userData.points * this.combo;
                    this.increaseCombo();
                    this.createExplosion(col.position, 0x00f3ff, 15);
                    this.scene.remove(col);
                    this.collectibles.splice(i, 1);
                } else if (col.userData.type === 'shield_powerup') {
                    soundSystem.playPickup();
                    this.health = Math.min(this.maxHealth, this.health + col.userData.shieldVal);
                    this.showAlert("+ESCUDO RESTAURADO", 1000);
                    this.createExplosion(col.position, 0x00ff88, 15);
                    this.scene.remove(col);
                    this.collectibles.splice(i, 1);
                }
            }
        }

        // 8. Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;
            p.mesh.position.addScaledVector(p.vel, dt);
            p.mesh.scale.multiplyScalar(Math.max(0.01, 1 - dt * 2));
            if (p.age >= p.life) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // 9. Líneas de velocidad (Speed lines) siguen a la nave
        if (this.speedLines) {
            this.speedLines.position.z = this.player.position.z;
            this.speedLines.material.opacity = (this.currentSpeed / this.maxSpeed) * (this.isBoosting ? 0.7 : 0.25);
        }

        // 10. Ciudad sigue a la nave en Z
        if (this.city) {
            this.city.position.z = this.player.position.z * 0.85;
        }

        // 11. Reducir combo si no se recoge nada en un tiempo
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1.0;
            }
        }

        // Generar y reciclar
        this.spawnTrackElements();
        this.recycleTrack();

        // 12. Actualizar Cámara
        this.updateCamera(dt);

        // 13. Actualizar HUD
        this.updateHUD();
    }

    increaseCombo() {
        this.combo = Math.min(4.0, Number((this.combo + 0.2).toFixed(1)));
        this.comboTimer = 3.5;
    }

    updateCamera(dt) {
        let targetCamPos, lookAtPos;

        if (this.cameraMode === 0) {
            // Tercera persona dinámica
            targetCamPos = new THREE.Vector3(
                this.player.position.x * 0.7,
                this.player.position.y + 3.8,
                this.player.position.z - 7.5
            );
            lookAtPos = new THREE.Vector3(
                this.player.position.x * 0.4,
                this.player.position.y + 1.2,
                this.player.position.z + 18
            );
        } else if (this.cameraMode === 1) {
            // Cabina (1ª persona)
            targetCamPos = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 0.6,
                this.player.position.z + 0.8
            );
            lookAtPos = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 0.6,
                this.player.position.z + 40
            );
        } else {
            // Alta / Aérea
            targetCamPos = new THREE.Vector3(
                this.player.position.x * 0.5,
                this.player.position.y + 12.0,
                this.player.position.z - 12.0
            );
            lookAtPos = new THREE.Vector3(
                this.player.position.x * 0.2,
                this.player.position.y,
                this.player.position.z + 15
            );
        }

        // Sacudida de cámara
        if (this.cameraShake > 0) {
            targetCamPos.x += (Math.random() - 0.5) * this.cameraShake * 1.5;
            targetCamPos.y += (Math.random() - 0.5) * this.cameraShake * 1.5;
            this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
        }

        this.camera.position.lerp(targetCamPos, dt * 10);
        this.camera.lookAt(lookAtPos);

        // Ajuste dinámico de campo visual (FOV) en turbo
        const targetFov = this.isBoosting ? 82 : this.baseFov;
        this.camera.fov += (targetFov - this.camera.fov) * (dt * 6);
        this.camera.updateProjectionMatrix();
    }

    updateHUDStatic() {
        document.getElementById('highscore-display').textContent = this.highScore.toLocaleString();
    }

    updateHUD() {
        // Distancia y Puntuación
        document.getElementById('distance-display').textContent = `${Math.floor(this.distance)} m`;
        document.getElementById('score-display').textContent = Math.floor(this.score).toLocaleString();

        // Combo
        const comboEl = document.getElementById('combo-display');
        if (this.combo > 1.0) {
            comboEl.textContent = `x${this.combo.toFixed(1)} COMBO`;
            comboEl.classList.remove('hidden');
        } else {
            comboEl.classList.add('hidden');
        }

        // Velocímetro (1 unidad Three.js ≈ 3.6 km/h)
        const kmh = Math.floor(this.currentSpeed * 3.6);
        document.getElementById('speed-display').textContent = kmh;
        const speedPercent = Math.min(100, (this.currentSpeed / this.maxSpeed) * 100);
        document.getElementById('speed-indicator').style.width = `${speedPercent}%`;

        // Barra de Escudo
        const shieldPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        const shieldBar = document.getElementById('shield-bar');
        shieldBar.style.width = `${shieldPercent}%`;
        document.getElementById('shield-text').textContent = `${Math.round(shieldPercent)}%`;

        if (shieldPercent <= 30) {
            shieldBar.classList.add('low');
        } else {
            shieldBar.classList.remove('low');
        }

        // Barra de Boost
        const boostBar = document.getElementById('boost-bar');
        boostBar.style.width = `${this.boostEnergy}%`;
        document.getElementById('boost-text').textContent = this.boostEnergy >= 25 ? 'LISTO' : 'RECARGANDO';
    }

    animate() {
        requestAnimationFrame(this.animate);
        const dt = Math.min(this.clock.getDelta(), 0.1);
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar el juego al cargar la ventana
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});

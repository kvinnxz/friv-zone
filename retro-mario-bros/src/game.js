// ==========================================================================
// GAME ENGINE: Game Loop (60 FPS Fixed Timestep), Cámara, Entrada y HUD
// ==========================================================================

class RetroGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Estado del juego
        this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timeTimer = 0;
        this.cameraX = 0;

        // Entidades y mundo
        this.level = new Level(this);
        this.player = new Player(this, 40, 192);
        this.enemies = [];
        this.floatingScores = [];

        // Sistema de Entrada (Teclado y Táctil)
        this.input = {
            left: false,
            right: false,
            jump: false,
            run: false
        };

        // Bucle de juego con tiempo fijo (Accumulator pattern a 60 FPS)
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.step = 1000 / 60; // 16.666 ms

        this.initDOM();
        this.initInput();
        this.initEnemies();
        this.updateHUD();

        // Iniciar bucle
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    initDOM() {
        this.hudScore = document.getElementById('hudScore');
        this.hudCoins = document.getElementById('hudCoins');
        this.hudWorld = document.getElementById('hudWorld');
        this.hudTime = document.getElementById('hudTime');
        this.hudLives = document.getElementById('hudLives');

        this.titleScreen = document.getElementById('titleScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.finalScoreText = document.getElementById('finalScoreText');
        this.victoryScoreText = document.getElementById('victoryScoreText');

        // Botones de acción
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());

        // Botones de cabina
        const audioBtn = document.getElementById('audioToggleBtn');
        audioBtn.addEventListener('click', () => {
            const isUnmuted = window.retroAudio.toggleMute();
            audioBtn.textContent = isUnmuted ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
            if (isUnmuted && this.state === 'PLAYING') {
                window.retroAudio.startBGM();
            }
        });

        const crtBtn = document.getElementById('crtToggleBtn');
        const scanlines = document.getElementById('scanlines');
        crtBtn.addEventListener('click', () => {
            scanlines.classList.toggle('disabled');
            crtBtn.textContent = scanlines.classList.contains('disabled') ? '📺 CRT: OFF' : '📺 CRT: ON';
        });

        document.getElementById('resetLevelBtn').addEventListener('click', () => {
            if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                this.restartLevel();
            }
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            const wrapper = document.querySelector('.arcade-container');
            if (!document.fullscreenElement) {
                wrapper.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            // Iniciar audio en primer gesto del usuario
            window.retroAudio.init();

            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                this.input.left = true;
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                this.input.right = true;
            } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyZ') {
                this.input.jump = true;
                e.preventDefault();
            } else if (e.shiftKey || e.code === 'KeyX') {
                this.input.run = true;
            } else if (e.code === 'Enter') {
                if (this.state === 'TITLE') this.startGame();
                else if (this.state === 'GAMEOVER' || this.state === 'VICTORY') this.restartGame();
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                this.input.left = false;
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                this.input.right = false;
            } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyZ') {
                this.input.jump = false;
            } else if (!e.shiftKey && e.code !== 'KeyX') {
                this.input.run = false;
            }
        });

        // Controles táctiles
        const bindTouch = (btnId, keyName) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                window.retroAudio.init();
                this.input[keyName] = true;
            }, { passive: false });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.input[keyName] = false;
            }, { passive: false });
            btn.addEventListener('touchcancel', () => {
                this.input[keyName] = false;
            });
        };

        bindTouch('touchLeft', 'left');
        bindTouch('touchRight', 'right');
        bindTouch('touchJump', 'jump');
        bindTouch('touchRun', 'run');
    }

    initEnemies() {
        this.enemies = [
            new Goomba(this, 22 * 16, 192),
            new Goomba(this, 42 * 16, 192),
            new Goomba(this, 53 * 16, 192),
            new Goomba(this, 55 * 16, 192),
            new Goomba(this, 81 * 16, 192),
            new Goomba(this, 83 * 16, 192),
            new Goomba(this, 97 * 16, 192),
            new Goomba(this, 102 * 16, 192),
            new Goomba(this, 120 * 16, 192),
            new Goomba(this, 123 * 16, 192)
        ];
    }

    startGame() {
        window.retroAudio.init();
        this.titleScreen.classList.remove('active');
        this.titleScreen.classList.add('hidden');
        this.state = 'PLAYING';
        this.restartLevel();
        window.retroAudio.startBGM();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pauseScreen.classList.remove('hidden');
            this.pauseScreen.classList.add('active');
            window.retroAudio.stopBGM();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.pauseScreen.classList.remove('active');
            this.pauseScreen.classList.add('hidden');
            window.retroAudio.startBGM();
        }
    }

    restartAfterDeath() {
        this.player.reset(Math.max(40, this.cameraX + 20), 192);
        this.updateHUD();
    }

    restartLevel() {
        this.cameraX = 0;
        this.time = 400;
        this.timeTimer = 0;
        this.level = new Level(this);
        this.player = new Player(this, 40, 192);
        this.initEnemies();
        this.floatingScores = [];
        this.updateHUD();
    }

    restartGame() {
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
        this.gameOverScreen.classList.remove('active');
        this.gameOverScreen.classList.add('hidden');
        this.victoryScreen.classList.remove('active');
        this.victoryScreen.classList.add('hidden');
        this.state = 'PLAYING';
        this.restartLevel();
        window.retroAudio.startBGM();
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        window.retroAudio.playGameOver();
        this.finalScoreText.textContent = `PUNTOS: ${String(this.score).padStart(6, '0')}`;
        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('active');
    }

    triggerVictory() {
        this.state = 'VICTORY';
        const timeBonus = this.time * 50;
        this.score += timeBonus;
        this.updateHUD();
        window.retroAudio.playStageClear();
        this.victoryScoreText.textContent = `PUNTUACIÓN FINAL: ${String(this.score).padStart(6, '0')}`;
        setTimeout(() => {
            this.victoryScreen.classList.remove('hidden');
            this.victoryScreen.classList.add('active');
        }, 1500);
    }

    addScore(points, x, y) {
        this.score += points;
        if (x !== undefined && y !== undefined) {
            this.floatingScores.push(new FloatingScore(`+${points}`, x, y));
        }
        this.updateHUD();
    }

    addCoin() {
        this.coins++;
        if (this.coins >= 100) {
            this.coins = 0;
            this.lives++;
        }
        this.updateHUD();
    }

    updateHUD() {
        this.hudScore.textContent = String(this.score).padStart(6, '0');
        this.hudCoins.textContent = `x${String(this.coins).padStart(2, '0')}`;
        this.hudTime.textContent = String(Math.max(0, Math.floor(this.time))).padStart(3, '0');
        this.hudLives.textContent = `x${this.lives}`;
    }

    // ======================================================================
    // ACTUALIZACIÓN DE FÍSICAS Y LÓGICA (60 FPS FIJO)
    // ======================================================================
    update() {
        if (this.state !== 'PLAYING') return;

        // 1. Contador de tiempo del nivel
        this.timeTimer++;
        if (this.timeTimer >= 24) { // Aproximadamente 1 unidad cada 0.4s
            this.timeTimer = 0;
            this.time--;
            this.updateHUD();
            if (this.time <= 0) {
                this.player.die();
            }
        }

        // 2. Actualizar Entidades
        this.player.update(this.input);
        this.level.update();

        // 3. Seguimiento suave de la cámara (no retrocede, estilo Mario clásico)
        if (this.player.x > this.cameraX + 110) {
            this.cameraX = Math.round(this.player.x - 110);
        }
        // Limitar cámara al final del nivel
        const maxCamera = (this.level.cols * 16) - 256;
        if (this.cameraX > maxCamera) {
            this.cameraX = maxCamera;
        }

        // 4. Actualizar y comprobar colisiones con Enemigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();

            // Comprobar colisión entre Mario y el Goomba si ambos están vivos y no aplastados
            if (!this.player.dead && !enemy.dead && !enemy.squashed && enemy.active) {
                if (PhysicsEngine.checkAABB(this.player, enemy)) {
                    // Detección de aplastamiento: Mario cae desde arriba
                    const playerBottom = this.player.y + this.player.h;
                    const isFallingOnTop = (this.player.vy > 0 && playerBottom <= enemy.y + 10);

                    if (isFallingOnTop) {
                        enemy.squash();
                        this.player.bounceFromStomp();
                    } else {
                        // Daño / pérdida de vida
                        this.player.die();
                    }
                }
            }

            if (enemy.dead) {
                this.enemies.splice(i, 1);
            }
        }

        // 5. Comprobar contacto con el Mástil de la Bandera de Meta
        if (!this.player.flagSliding && !this.player.walkingToCastle && !this.player.dead) {
            const pole = this.level.flagpole;
            if (this.player.x + this.player.w >= pole.x && this.player.x <= pole.x + 8) {
                if (this.player.y + this.player.h >= pole.topY) {
                    this.player.flagSliding = true;
                    this.player.vx = 0;
                    this.player.vy = 0;
                    this.player.x = pole.x - 4;
                    window.retroAudio.stopBGM();
                    window.retroAudio.playStageClear();
                    this.addScore(1000, pole.x, pole.topY);
                }
            }
        }

        // 6. Actualizar textos flotantes
        for (let i = this.floatingScores.length - 1; i >= 0; i--) {
            this.floatingScores[i].update();
            if (this.floatingScores[i].life <= 0) {
                this.floatingScores.splice(i, 1);
            }
        }
    }

    // ======================================================================
    // RENDERIZADO DEL JUEGO
    // ======================================================================
    render() {
        this.ctx.clearRect(0, 0, 256, 240);

        // 1. Dibujar Escenario y Baldosas
        this.level.render(this.ctx, this.cameraX);

        // 2. Dibujar Enemigos
        this.enemies.forEach(e => e.render(this.ctx, this.cameraX));

        // 3. Dibujar Jugador
        this.player.render(this.ctx, this.cameraX);

        // 4. Dibujar Puntos Flotantes
        this.floatingScores.forEach(fs => fs.render(this.ctx, this.cameraX));
    }

    // ======================================================================
    // GAME LOOP PRINCIPAL CON TIEMPO DELTA Y ACUMULADOR (60 FPS)
    // ======================================================================
    gameLoop(timestamp) {
        const elapsed = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Limitar elapsed para evitar espirales tras pausas de navegador
        const clampedElapsed = Math.min(elapsed, 100);
        this.accumulator += clampedElapsed;

        while (this.accumulator >= this.step) {
            this.update();
            this.accumulator -= this.step;
        }

        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Inicializar el juego al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    window.game = new RetroGame();
});

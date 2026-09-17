/**
 * CULEBRITA NEO-ARCADE: GAME ENGINE
 * Motor de juego a 60FPS con sistema de partículas, power-ups dinámicos, combos y controles fluidos.
 */

(function () {
    'use strict';

    // --- Configuración y Constantes ---
    const GRID_SIZE = 24; // 24x24 casillas
    const CANVAS_SIZE = 600;
    const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

    // Tipos de alimentos y probabilidades
    const ITEM_TYPES = {
        APPLE: { type: 'apple', color: '#ff0055', glow: '#ff0055', points: 100, icon: '🍏' },
        STAR: { type: 'star', color: '#ffd700', glow: '#ffe600', points: 500, icon: '⭐', duration: 10 },
        ICE: { type: 'ice', color: '#00f3ff', glow: '#00c3ff', points: 200, icon: '❄️', duration: 7 },
        QUANTUM: { type: 'quantum', color: '#d000ff', glow: '#bd00ff', points: 250, icon: '🌀', duration: 6 }
    };

    // Velocidades base por dificultad (en milisegundos por paso)
    const DIFFICULTY_CONFIG = {
        chill: { baseSpeed: 140, minSpeed: 100, speedStep: 2, wrapWalls: true, label: 'Chill' },
        arcade: { baseSpeed: 115, minSpeed: 55, speedStep: 3.5, wrapWalls: false, label: 'Arcade' },
        hardcore: { baseSpeed: 75, minSpeed: 42, speedStep: 2.5, wrapWalls: false, label: 'Insane' }
    };

    // --- Estado del Juego ---
    class Game {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = CANVAS_SIZE;
            this.canvas.height = CANVAS_SIZE;

            // Elementos de la interfaz (DOM)
            this.dom = {
                score: document.getElementById('scoreDisplay'),
                highScore: document.getElementById('highScoreDisplay'),
                comboBadge: document.getElementById('comboBadge'),
                powerupName: document.getElementById('powerupName'),
                powerupBar: document.getElementById('powerupProgressBar'),
                powerupContainer: document.getElementById('powerupContainer'),
                startOverlay: document.getElementById('startOverlay'),
                pauseOverlay: document.getElementById('pauseOverlay'),
                gameOverOverlay: document.getElementById('gameOverOverlay'),
                helpModal: document.getElementById('helpModal'),
                finalScore: document.getElementById('finalScore'),
                finalOrbs: document.getElementById('finalOrbs'),
                finalCombo: document.getElementById('finalCombo'),
                finalTime: document.getElementById('finalTime'),
                newRecordBadge: document.getElementById('newRecordBadge'),
                themeSelect: document.getElementById('themeSelect'),
                sfxToggleBtn: document.getElementById('sfxToggleBtn'),
                sfxIcon: document.getElementById('sfxIcon'),
                musicToggleBtn: document.getElementById('musicToggleBtn'),
                musicIcon: document.getElementById('musicIcon'),
                helpBtn: document.getElementById('helpBtn'),
                closeHelpBtn: document.getElementById('closeHelpBtn'),
                startPlayBtn: document.getElementById('startPlayBtn'),
                resumeBtn: document.getElementById('resumeBtn'),
                restartPauseBtn: document.getElementById('restartFromPauseBtn'),
                retryBtn: document.getElementById('retryBtn'),
                backToMenuBtn: document.getElementById('backToMenuBtn'),
                diffButtons: document.querySelectorAll('.diff-btn'),
                dpad: {
                    up: document.getElementById('dpadUp'),
                    left: document.getElementById('dpadLeft'),
                    center: document.getElementById('dpadPause'),
                    right: document.getElementById('dpadRight'),
                    down: document.getElementById('dpadDown')
                }
            };

            // Ajustes y persistencia
            this.selectedDiff = 'arcade';
            this.highScores = this.loadHighScores();
            this.soundMuted = localStorage.getItem('culebrita_sfx_muted') === 'true';
            this.musicActive = false;

            // Variables de partida
            this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
            this.snake = [];
            this.direction = { x: 1, y: 0 };
            this.nextDirections = []; // Cola para evitar suicidio por giros rápidos
            this.foods = [];
            this.particles = [];
            this.floatingTexts = [];
            
            this.score = 0;
            this.orbsEaten = 0;
            this.combo = 1;
            this.maxCombo = 1;
            this.comboTimer = 0;
            this.comboDuration = 3500; // 3.5 segundos para encadenar combo

            this.activePowerup = null; // { type, timeLeft, totalDuration }
            this.startTime = 0;
            this.elapsedTime = 0;

            // Bucle y tiempos
            this.lastTickTime = 0;
            this.gameSpeed = 115;
            this.screenShake = 0;

            // Inicializaciones
            this.applySavedTheme();
            this.updateAudioUI();
            this.updateHighScoreDisplay();
            this.bindEvents();
            this.initAnimationLoop();
        }

        loadHighScores() {
            try {
                const saved = localStorage.getItem('culebrita_highscores');
                return saved ? JSON.parse(saved) : { chill: 0, arcade: 0, hardcore: 0 };
            } catch (e) {
                return { chill: 0, arcade: 0, hardcore: 0 };
            }
        }

        saveHighScore(score) {
            if (score > (this.highScores[this.selectedDiff] || 0)) {
                this.highScores[this.selectedDiff] = score;
                try {
                    localStorage.setItem('culebrita_highscores', JSON.stringify(this.highScores));
                } catch (e) {}
                this.updateHighScoreDisplay();
                return true;
            }
            return false;
        }

        updateHighScoreDisplay() {
            const currentRecord = this.highScores[this.selectedDiff] || 0;
            this.dom.highScore.textContent = currentRecord.toLocaleString();
        }

        // --- Inicio y Reinicio de Partida ---
        startGame() {
            window.soundFX.init();
            window.soundFX.playClick();

            const config = DIFFICULTY_CONFIG[this.selectedDiff];
            this.gameSpeed = config.baseSpeed;
            this.score = 0;
            this.orbsEaten = 0;
            this.combo = 1;
            this.maxCombo = 1;
            this.comboTimer = 0;
            this.activePowerup = null;
            this.startTime = Date.now();
            this.elapsedTime = 0;

            this.dom.score.textContent = '0';
            this.dom.comboBadge.classList.add('hidden');
            this.updatePowerupHUD();

            // Configurar culebrita inicial (longitud 4)
            const midX = Math.floor(GRID_SIZE / 3);
            const midY = Math.floor(GRID_SIZE / 2);
            this.snake = [
                { x: midX, y: midY },
                { x: midX - 1, y: midY },
                { x: midX - 2, y: midY },
                { x: midX - 3, y: midY }
            ];
            this.direction = { x: 1, y: 0 };
            this.nextDirections = [];

            this.foods = [];
            this.particles = [];
            this.floatingTexts = [];
            this.spawnFood(ITEM_TYPES.APPLE);

            // Ocultar overlays
            this.dom.startOverlay.classList.remove('active');
            this.dom.startOverlay.classList.add('hidden');
            this.dom.pauseOverlay.classList.add('hidden');
            this.dom.gameOverOverlay.classList.add('hidden');

            this.state = 'PLAYING';
            this.lastTickTime = performance.now();

            if (this.musicActive) {
                window.soundFX.startMusic();
            }
        }

        togglePause() {
            if (this.state === 'PLAYING') {
                this.state = 'PAUSED';
                this.dom.pauseOverlay.classList.remove('hidden');
                this.dom.pauseOverlay.classList.add('active');
                window.soundFX.playClick();
                window.soundFX.stopMusic();
            } else if (this.state === 'PAUSED') {
                this.state = 'PLAYING';
                this.dom.pauseOverlay.classList.remove('active');
                this.dom.pauseOverlay.classList.add('hidden');
                window.soundFX.playClick();
                this.lastTickTime = performance.now();
                if (this.musicActive) {
                    window.soundFX.startMusic();
                }
            }
        }

        gameOver() {
            this.state = 'GAMEOVER';
            window.soundFX.playDie();
            window.soundFX.stopMusic();

            this.screenShake = 18;

            // Crear explosión de partículas en la cabeza de la serpiente
            const head = this.snake[0];
            const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
            const hy = head.y * CELL_SIZE + CELL_SIZE / 2;
            this.createExplosion(hx, hy, '#ff0055', 40);
            this.createExplosion(hx, hy, '#00f3ff', 25);

            // Calcular récords y estadísticas
            const isRecord = this.saveHighScore(this.score);
            const minutes = Math.floor(this.elapsedTime / 60);
            const seconds = Math.floor(this.elapsedTime % 60);
            const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            this.dom.finalScore.textContent = this.score.toLocaleString();
            this.dom.finalOrbs.textContent = this.orbsEaten;
            this.dom.finalCombo.textContent = `x${this.maxCombo}`;
            this.dom.finalTime.textContent = formattedTime;

            if (isRecord && this.score > 0) {
                this.dom.newRecordBadge.classList.remove('hidden');
            } else {
                this.dom.newRecordBadge.classList.add('hidden');
            }

            setTimeout(() => {
                this.dom.gameOverOverlay.classList.remove('hidden');
                this.dom.gameOverOverlay.classList.add('active');
            }, 550);
        }

        // --- Generación de Alimentos y Poderes ---
        spawnFood(forceType = null) {
            let type = forceType || ITEM_TYPES.APPLE;

            // Si es aleatorio, decidir si sale un powerup especial
            if (!forceType) {
                const rand = Math.random();
                if (rand < 0.12) {
                    type = ITEM_TYPES.STAR;
                } else if (rand < 0.20) {
                    type = ITEM_TYPES.ICE;
                } else if (rand < 0.26) {
                    type = ITEM_TYPES.QUANTUM;
                } else {
                    type = ITEM_TYPES.APPLE;
                }
            }

            // Buscar celda libre en la cuadrícula
            let emptyCells = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                    const occupiedBySnake = this.snake.some(s => s.x === x && s.y === y);
                    const occupiedByFood = this.foods.some(f => f.x === x && f.y === y);
                    if (!occupiedBySnake && !occupiedByFood) {
                        emptyCells.push({ x, y });
                    }
                }
            }

            if (emptyCells.length === 0) return; // Tablero lleno (¡victoria legendaria!)

            const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const foodItem = {
                x: cell.x,
                y: cell.y,
                ...type,
                spawnTime: performance.now(),
                pulse: 0,
                expires: type.duration ? performance.now() + (type.duration * 1000) : null
            };

            // Asegurar que siempre haya al menos una manzana roja normal en el tablero
            if (type.type !== 'apple' && !this.foods.some(f => f.type === 'apple')) {
                this.spawnFood(ITEM_TYPES.APPLE);
            }

            this.foods.push(foodItem);
        }

        // --- Control de Dirección ---
        changeDirection(newDir) {
            if (this.state !== 'PLAYING') return;

            // Comparar con el último giro en cola o la dirección actual
            const lastDir = this.nextDirections.length > 0 
                ? this.nextDirections[this.nextDirections.length - 1] 
                : this.direction;

            // Evitar giro suicida de 180 grados
            if (newDir.x + lastDir.x === 0 && newDir.y + lastDir.y === 0) {
                return;
            }

            // Si es la misma dirección, ignorar
            if (newDir.x === lastDir.x && newDir.y === lastDir.y) {
                return;
            }

            // Permitir máximo 2 giros en cola para respuesta instantánea
            if (this.nextDirections.length < 2) {
                this.nextDirections.push(newDir);
            }
        }

        // --- Actualización de la Lógica del Juego ---
        update(delta) {
            if (this.state !== 'PLAYING') return;

            this.elapsedTime = (Date.now() - this.startTime) / 1000;

            // Decrementar Combo si el tiempo expira
            if (this.combo > 1) {
                this.comboTimer -= delta;
                if (this.comboTimer <= 0) {
                    this.combo = 1;
                    this.dom.comboBadge.classList.add('hidden');
                }
            }

            // Actualizar Power-up Activo
            if (this.activePowerup) {
                this.activePowerup.timeLeft -= delta;
                const percent = Math.max(0, (this.activePowerup.timeLeft / this.activePowerup.totalDuration) * 100);
                this.dom.powerupBar.style.width = `${percent}%`;

                if (this.activePowerup.timeLeft <= 0) {
                    this.activePowerup = null;
                    this.updatePowerupHUD();
                }
            }

            // Expiración de alimentos temporales
            const now = performance.now();
            this.foods = this.foods.filter(f => {
                if (f.expires && now >= f.expires) {
                    // Si expira, crear pequeño humo de desvanecimiento
                    this.createExplosion(f.x * CELL_SIZE + CELL_SIZE / 2, f.y * CELL_SIZE + CELL_SIZE / 2, '#666', 8);
                    return false;
                }
                return true;
            });

            // Garantizar que siempre haya al menos una fruta
            if (this.foods.length === 0) {
                this.spawnFood(ITEM_TYPES.APPLE);
            }

            // Calcular velocidad efectiva según poder de Hielo
            const config = DIFFICULTY_CONFIG[this.selectedDiff];
            let currentStepSpeed = this.gameSpeed;
            if (this.activePowerup && this.activePowerup.type === 'ice') {
                currentStepSpeed *= 1.45; // Reloj ralentizado
            }

            // Comprobar si corresponde dar un paso en la cuadrícula
            if (now - this.lastTickTime >= currentStepSpeed) {
                this.lastTickTime = now;
                this.step();
            }
        }

        step() {
            // Sacar siguiente dirección de la cola
            if (this.nextDirections.length > 0) {
                this.direction = this.nextDirections.shift();
            }

            const head = this.snake[0];
            let nextX = head.x + this.direction.x;
            let nextY = head.y + this.direction.y;

            const config = DIFFICULTY_CONFIG[this.selectedDiff];
            const isQuantum = this.activePowerup && this.activePowerup.type === 'quantum';
            const allowWrap = config.wrapWalls || isQuantum;

            // Manejo de paredes
            if (allowWrap) {
                if (nextX < 0) nextX = GRID_SIZE - 1;
                if (nextX >= GRID_SIZE) nextX = 0;
                if (nextY < 0) nextY = GRID_SIZE - 1;
                if (nextY >= GRID_SIZE) nextY = 0;
            } else {
                if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                    this.gameOver();
                    return;
                }
            }

            // Manejo de colisión con el propio cuerpo
            if (!isQuantum) {
                const selfCollision = this.snake.slice(0, -1).some(segment => segment.x === nextX && segment.y === nextY);
                if (selfCollision) {
                    this.gameOver();
                    return;
                }
            }

            // Mover cabeza
            const newHead = { x: nextX, y: nextY };
            this.snake.unshift(newHead);

            // Comprobar si comió algún alimento
            const eatenIndex = this.foods.findIndex(f => f.x === nextX && f.y === nextY);

            if (eatenIndex !== -1) {
                const food = this.foods[eatenIndex];
                this.foods.splice(eatenIndex, 1);
                this.handleFoodEaten(food, newHead);
            } else {
                // Si no comió, retirar la cola
                this.snake.pop();
            }
        }

        handleFoodEaten(food, headPos) {
            this.orbsEaten++;

            // Manejar Combo
            this.comboTimer = this.comboDuration;
            if (this.combo < 5) {
                this.combo++;
            }
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

            // Mostrar insignia de combo
            if (this.combo > 1) {
                this.dom.comboBadge.textContent = `x${this.combo} COMBO!`;
                this.dom.comboBadge.classList.remove('hidden');
                if (this.combo >= 3) {
                    window.soundFX.playCombo();
                }
            }

            // Calcular puntaje con multiplicador
            const earnedPoints = food.points * this.combo;
            this.score += earnedPoints;
            this.dom.score.textContent = this.score.toLocaleString();

            // Partículas y texto flotante
            const fx = headPos.x * CELL_SIZE + CELL_SIZE / 2;
            const fy = headPos.y * CELL_SIZE + CELL_SIZE / 2;
            this.createExplosion(fx, fy, food.glow, 20);
            this.addFloatingText(`+${earnedPoints}`, fx, fy - 10, food.glow);

            // Aumentar velocidad gradualmente en modo Arcade e Insane
            const config = DIFFICULTY_CONFIG[this.selectedDiff];
            if (this.gameSpeed > config.minSpeed) {
                this.gameSpeed = Math.max(config.minSpeed, this.gameSpeed - config.speedStep);
            }

            // Lógica según tipo de alimento
            if (food.type === 'apple') {
                window.soundFX.playEat(this.combo);
                this.spawnFood(); // Generar siguiente fruta
            } else {
                // Power-up activado
                window.soundFX.playPowerUp(food.type);
                this.screenShake = 6;
                this.activatePowerup(food);
                this.spawnFood(ITEM_TYPES.APPLE);
            }
        }

        activatePowerup(food) {
            const names = {
                star: '⭐ ESTRELLA DORADA (+500)',
                ice: '❄️ CRIOGÉNICO (SLOW-MO)',
                quantum: '🌀 CUÁNTICO (FANTASMA)'
            };

            this.activePowerup = {
                type: food.type,
                timeLeft: (food.duration || 6) * 1000,
                totalDuration: (food.duration || 6) * 1000
            };

            this.updatePowerupHUD(names[food.type] || 'PODER ACTIVO');
            this.addFloatingText(names[food.type] || 'POWER UP!', CANVAS_SIZE / 2, 80, food.glow, 22);
        }

        updatePowerupHUD(name = null) {
            if (this.activePowerup && name) {
                this.dom.powerupName.textContent = name;
                this.dom.powerupBar.style.width = '100%';
                this.dom.powerupContainer.style.opacity = '1';
            } else {
                this.dom.powerupName.textContent = 'SIN PODER';
                this.dom.powerupBar.style.width = '0%';
                this.dom.powerupContainer.style.opacity = '0.4';
            }
        }

        // --- Sistema de Partículas y Efectos ---
        createExplosion(x, y, color, count = 16) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 1.5;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    size: Math.random() * 4 + 2,
                    alpha: 1,
                    decay: Math.random() * 0.03 + 0.02
                });
            }
        }

        addFloatingText(text, x, y, color = '#fff', size = 16) {
            this.floatingTexts.push({
                text,
                x,
                y,
                color,
                size,
                alpha: 1,
                vy: -1.2
            });
        }

        updateAndRenderEffects(ctx, delta) {
            // 1. Partículas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 2. Textos Flotantes
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.y += ft.vy;
                ft.alpha -= 0.02;

                if (ft.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = ft.alpha;
                ctx.fillStyle = ft.color;
                ctx.shadowBlur = 12;
                ctx.shadowColor = ft.color;
                ctx.font = `bold ${ft.size}px Orbitron, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            }
        }

        // --- Renderizado del Juego ---
        render() {
            const ctx = this.ctx;

            // Aplicar temblor de pantalla (Screen Shake)
            ctx.save();
            if (this.screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * this.screenShake;
                const shakeY = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(shakeX, shakeY);
                this.screenShake *= 0.88;
                if (this.screenShake < 0.2) this.screenShake = 0;
            }

            // Limpiar Canvas
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

            // Rejilla sutil en el fondo del canvas
            this.drawGrid(ctx);

            // Dibujar Alimentos
            this.drawFoods(ctx);

            // Dibujar Culebrita
            this.drawSnake(ctx);

            // Dibujar Partículas y Textos
            this.updateAndRenderEffects(ctx, 16);

            ctx.restore();
        }

        drawGrid(ctx) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, CANVAS_SIZE);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(CANVAS_SIZE, i);
                ctx.stroke();
            }
        }

        drawFoods(ctx) {
            const now = performance.now();
            this.foods.forEach(f => {
                const cx = f.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = f.y * CELL_SIZE + CELL_SIZE / 2;
                const radius = (CELL_SIZE / 2) - 2;

                // Animación de pulso
                const pulse = Math.sin((now - f.spawnTime) * 0.006) * 2.5;

                ctx.save();
                ctx.shadowColor = f.glow;
                ctx.shadowBlur = 18 + pulse;

                if (f.type === 'apple') {
                    // Manzana Neón Roja
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius + pulse * 0.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Brillo interior
                    ctx.fillStyle = '#ff99bb';
                    ctx.beginPath();
                    ctx.arc(cx - 3, cy - 3, radius * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (f.type === 'star') {
                    // Estrella Dorada
                    this.drawStar(ctx, cx, cy, 5, radius + 2 + pulse, (radius + 2 + pulse) / 2, f.color);
                } else if (f.type === 'ice') {
                    // Cristal de Hielo Diamante
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - radius - pulse);
                    ctx.lineTo(cx + radius + pulse, cy);
                    ctx.lineTo(cx, cy + radius + pulse);
                    ctx.lineTo(cx - radius - pulse, cy);
                    ctx.closePath();
                    ctx.fill();
                } else if (f.type === 'quantum') {
                    // Orbe Cuántico con Anillo
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, radius + 2, radius * 0.45, (now * 0.003) % (Math.PI * 2), 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            });
        }

        drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        drawSnake(ctx) {
            if (this.snake.length === 0) return;

            const isQuantum = this.activePowerup && this.activePowerup.type === 'quantum';
            const isIce = this.activePowerup && this.activePowerup.type === 'ice';

            // Colores según tema y poder activo
            let primaryColor = '#00f3ff';
            let secondaryColor = '#ff007f';
            if (isQuantum) {
                primaryColor = '#d000ff';
                secondaryColor = '#7928ca';
            } else if (isIce) {
                primaryColor = '#00f3ff';
                secondaryColor = '#80d8ff';
            }

            // Dibujar cuerpo de cola a cabeza
            for (let i = this.snake.length - 1; i >= 0; i--) {
                const seg = this.snake[i];
                const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
                const ratio = (this.snake.length - i) / this.snake.length;
                const segRadius = (CELL_SIZE / 2) - 1.5;

                ctx.save();

                // Modo Fantasma (Quantum) con transparencia
                if (isQuantum) {
                    ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.01 + i) * 0.25;
                }

                if (i === 0) {
                    // Cabeza de la culebrita
                    ctx.fillStyle = primaryColor;
                    ctx.shadowColor = primaryColor;
                    ctx.shadowBlur = 20;

                    ctx.beginPath();
                    ctx.arc(cx, cy, segRadius + 1, 0, Math.PI * 2);
                    ctx.fill();

                    // Ojos cibernéticos
                    this.drawEyes(ctx, cx, cy, segRadius, this.direction);
                } else {
                    // Segmentos del cuerpo con gradiente suave
                    const alpha = Math.max(0.35, ratio);
                    ctx.fillStyle = primaryColor;
                    ctx.shadowColor = primaryColor;
                    ctx.shadowBlur = 10 * alpha;
                    ctx.globalAlpha = isQuantum ? ctx.globalAlpha : alpha;

                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.max(4, segRadius * ratio), 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        drawEyes(ctx, cx, cy, radius, dir) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 6;

            const eyeOffset = radius * 0.45;
            const eyeSize = 3;

            let eye1X, eye1Y, eye2X, eye2Y;

            if (dir.x === 1) { // Derecha
                eye1X = cx + eyeOffset; eye1Y = cy - eyeOffset;
                eye2X = cx + eyeOffset; eye2Y = cy + eyeOffset;
            } else if (dir.x === -1) { // Izquierda
                eye1X = cx - eyeOffset; eye1Y = cy - eyeOffset;
                eye2X = cx - eyeOffset; eye2Y = cy + eyeOffset;
            } else if (dir.y === -1) { // Arriba
                eye1X = cx - eyeOffset; eye1Y = cy - eyeOffset;
                eye2X = cx + eyeOffset; eye2Y = cy - eyeOffset;
            } else { // Abajo
                eye1X = cx - eyeOffset; eye1Y = cy + eyeOffset;
                eye2X = cx + eyeOffset; eye2Y = cy + eyeOffset;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas negras con brillo
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(eye1X + dir.x, eye1Y + dir.y, 1.5, 0, Math.PI * 2);
            ctx.arc(eye2X + dir.x, eye2Y + dir.y, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // --- Bucle de Animación Principal (60 FPS) ---
        initAnimationLoop() {
            let lastTime = performance.now();

            const loop = (currentTime) => {
                const delta = currentTime - lastTime;
                lastTime = currentTime;

                this.update(delta);
                this.render();

                requestAnimationFrame(loop);
            };

            requestAnimationFrame(loop);
        }

        // --- Manejo de Entradas y Eventos ---
        bindEvents() {
            // Teclado
            window.addEventListener('keydown', (e) => {
                // Teclas de dirección
                switch (e.code) {
                    case 'ArrowUp':
                    case 'KeyW':
                        e.preventDefault();
                        this.changeDirection({ x: 0, y: -1 });
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        e.preventDefault();
                        this.changeDirection({ x: 0, y: 1 });
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                        e.preventDefault();
                        this.changeDirection({ x: -1, y: 0 });
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        e.preventDefault();
                        this.changeDirection({ x: 1, y: 0 });
                        break;
                    case 'Space':
                        e.preventDefault();
                        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                            this.togglePause();
                        } else if (this.state === 'MENU') {
                            this.startGame();
                        }
                        break;
                    case 'KeyR':
                        if (this.state === 'GAMEOVER' || this.state === 'PAUSED') {
                            this.startGame();
                        }
                        break;
                }
            });

            // Botón Iniciar Juego
            this.dom.startPlayBtn.addEventListener('click', () => this.startGame());

            // Botones de Pausa
            this.dom.resumeBtn.addEventListener('click', () => this.togglePause());
            this.dom.restartPauseBtn.addEventListener('click', () => this.startGame());

            // Botones de Game Over
            this.dom.retryBtn.addEventListener('click', () => this.startGame());
            this.dom.backToMenuBtn.addEventListener('click', () => {
                window.soundFX.playClick();
                this.dom.gameOverOverlay.classList.remove('active');
                this.dom.gameOverOverlay.classList.add('hidden');
                this.dom.startOverlay.classList.remove('hidden');
                this.dom.startOverlay.classList.add('active');
                this.state = 'MENU';
            });

            // Selector de Dificultad
            this.dom.diffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    window.soundFX.playClick();
                    this.dom.diffButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedDiff = btn.dataset.diff;
                    this.updateHighScoreDisplay();
                });
            });

            // Selector de Tema
            this.dom.themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                document.body.setAttribute('data-theme', theme);
                localStorage.setItem('culebrita_theme', theme);
                window.soundFX.playClick();
            });

            // Controles de Audio SFX
            this.dom.sfxToggleBtn.addEventListener('click', () => {
                this.soundMuted = !this.soundMuted;
                window.soundFX.setMute(this.soundMuted);
                localStorage.setItem('culebrita_sfx_muted', this.soundMuted);
                this.updateAudioUI();
                if (!this.soundMuted) window.soundFX.playClick();
            });

            // Música Synthwave
            this.dom.musicToggleBtn.addEventListener('click', () => {
                this.musicActive = window.soundFX.toggleMusic();
                this.updateAudioUI();
                if (this.musicActive && this.state !== 'PLAYING') {
                    // Reproducir pequeña preview si está en menú
                }
            });

            // Modal de Ayuda
            this.dom.helpBtn.addEventListener('click', () => {
                window.soundFX.playClick();
                this.dom.helpModal.classList.remove('hidden');
                this.dom.helpModal.classList.add('active');
            });
            this.dom.closeHelpBtn.addEventListener('click', () => {
                window.soundFX.playClick();
                this.dom.helpModal.classList.remove('active');
                this.dom.helpModal.classList.add('hidden');
            });

            // D-Pad Táctil Virtual
            const dpad = this.dom.dpad;
            const bindDpad = (btn, action) => {
                const handler = (e) => {
                    e.preventDefault();
                    btn.classList.add('pressed');
                    setTimeout(() => btn.classList.remove('pressed'), 140);
                    action();
                };
                btn.addEventListener('touchstart', handler, { passive: false });
                btn.addEventListener('mousedown', handler);
            };

            bindDpad(dpad.up, () => this.changeDirection({ x: 0, y: -1 }));
            bindDpad(dpad.down, () => this.changeDirection({ x: 0, y: 1 }));
            bindDpad(dpad.left, () => this.changeDirection({ x: -1, y: 0 }));
            bindDpad(dpad.right, () => this.changeDirection({ x: 1, y: 0 }));
            bindDpad(dpad.center, () => {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                } else if (this.state === 'MENU') {
                    this.startGame();
                }
            });

            // Soporte de Gestos Swipe en el Canvas
            let touchStartX = 0;
            let touchStartY = 0;

            this.canvas.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                if (this.state !== 'PLAYING') return;
                const touch = e.changedTouches[0];
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (Math.max(absDx, absDy) > 25) { // Umbral mínimo de swipe
                    if (absDx > absDy) {
                        this.changeDirection({ x: dx > 0 ? 1 : -1, y: 0 });
                    } else {
                        this.changeDirection({ x: 0, y: dy > 0 ? 1 : -1 });
                    }
                }
            }, { passive: true });
        }

        updateAudioUI() {
            this.dom.sfxIcon.textContent = this.soundMuted ? '🔇' : '🔊';
            this.dom.musicIcon.textContent = this.musicActive ? '🎶' : '🎵';
            this.dom.musicToggleBtn.style.borderColor = this.musicActive ? 'var(--color-primary)' : '';
            this.dom.musicToggleBtn.style.boxShadow = this.musicActive ? '0 0 10px var(--color-primary-glow)' : '';
        }

        applySavedTheme() {
            const savedTheme = localStorage.getItem('culebrita_theme') || 'cyber';
            document.body.setAttribute('data-theme', savedTheme);
            this.dom.themeSelect.value = savedTheme;
            window.soundFX.setMute(this.soundMuted);
        }
    }

    // Inicializar al cargar el DOM
    window.addEventListener('DOMContentLoaded', () => {
        window.gameInstance = new Game();
    });
})();

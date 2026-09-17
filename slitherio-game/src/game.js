// Motor Principal del Juego Slither.io (Neon Slither)

import { sound } from './audio.js';
import { Snake, SKINS } from './snake.js';
import { FoodManager } from './food.js';
import { Bot, BOT_NAMES } from './bot.js';

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // Configuración del mundo (Rango de mapa ampliado a 3200 - diámetro 6400px)
        this.worldRadius = 3200;
        this.targetBotCount = 18;

        // Entidades con orbes optimizados mediante Spatial Hash Grid
        this.foodManager = new FoodManager(this.worldRadius, 1800);
        this.player = null;
        this.snakes = [];
        this.respawnQueue = [];

        // Cámara
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1,
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Estado
        this.isRunning = false;
        this.animationFrameId = null;
        this.gameStartTime = 0;
        this.survivalTime = 0;
        this.selectedSkinIndex = 0;
        this.playerName = 'NeonPlayer';

        // Mouse / Input
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.isMouseDown = false;

        this.setupEventListeners();
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.width = window.innerWidth;
        this.camera.height = window.innerHeight;

        // Minimapa de alta definición
        this.minimapCanvas.width = 160;
        this.minimapCanvas.height = 160;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        // Ratón con radio mínimo para evitar atascarse en un punto fijo al hacer círculos
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            if (this.player && this.player.isAlive) {
                const cx = this.camera.width / 2;
                const cy = this.camera.height / 2;
                const dx = this.mouseX - cx;
                const dy = this.mouseY - cy;
                const dist = Math.hypot(dx, dy);

                // Evitar quedarse estático en un punto cuando el ratón está sobre el centro
                if (dist > 18) {
                    this.player.targetAngle = Math.atan2(dy, dx);
                }
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.setPlayerBoost(true);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.setPlayerBoost(false);
            }
        });

        // Teclado (Barra espaciadora para turbo)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.setPlayerBoost(true);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.setPlayerBoost(false);
            }
        });

        // Soporte Táctil para móviles y tablets
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.handleTouch(t.clientX, t.clientY);
                if (e.touches.length > 1) {
                    this.setPlayerBoost(true);
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.handleTouch(t.clientX, t.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.setPlayerBoost(false);
        });

        // Botón de silencio de audio
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const unmuted = sound.toggleMute();
                muteBtn.innerHTML = unmuted ? '🔊' : '🔇';
                muteBtn.classList.toggle('muted', !unmuted);
            });
        }
    }

    handleTouch(tx, ty) {
        if (!this.player || !this.player.isAlive) return;
        const cx = this.camera.width / 2;
        const cy = this.camera.height / 2;
        this.player.targetAngle = Math.atan2(ty - cy, tx - cx);
    }

    setPlayerBoost(boosting) {
        if (!this.player || !this.player.isAlive) return;
        if (boosting && this.player.mass > 12) {
            this.player.isBoosting = true;
            sound.startBoostSound();
        } else {
            this.player.isBoosting = false;
            sound.stopBoostSound();
        }
    }

    findSafeSpawnPoint(minDistFromPlayer = 950) {
        let bestX = 0;
        let bestY = 0;
        let maxClearance = -1;

        // Búsqueda inteligente de posición libre de serpientes
        for (let attempt = 0; attempt < 35; attempt++) {
            const r = 400 + Math.sqrt(Math.random()) * (this.worldRadius - 700);
            const theta = Math.random() * Math.PI * 2;
            const candX = Math.cos(theta) * r;
            const candY = Math.sin(theta) * r;

            let clearance = Infinity;

            // 1. Verificar distancia estricta a la cabeza y segmentos del jugador
            if (this.player && this.player.isAlive) {
                const pHeadDist = Math.hypot(candX - this.player.x, candY - this.player.y);
                if (pHeadDist < minDistFromPlayer) continue;
                if (pHeadDist < clearance) clearance = pHeadDist;

                const pSegments = this.player.getSegments();
                for (let i = 0; i < pSegments.length; i += 3) {
                    const segDist = Math.hypot(candX - pSegments[i].x, candY - pSegments[i].y);
                    if (segDist < minDistFromPlayer * 0.8) {
                        clearance = 0;
                        break;
                    }
                    if (segDist < clearance) clearance = segDist;
                }
                if (clearance === 0) continue;
            }

            // 2. Verificar distancia a bots existentes
            for (const s of this.snakes) {
                if (!s.isAlive) continue;
                const bDist = Math.hypot(candX - s.x, candY - s.y);
                if (bDist < 300) {
                    clearance = 0;
                    break;
                }
                if (bDist < clearance) clearance = bDist;
            }

            if (clearance > maxClearance) {
                maxClearance = clearance;
                bestX = candX;
                bestY = candY;
                if (clearance >= 1200) break; // Posición óptima
            }
        }

        // Si por alguna razón extrema no encuentra espacio libre, colocarlo lejos en un cuadrante opuesto
        if (maxClearance < 500 && this.player) {
            const pAngle = Math.atan2(this.player.y, this.player.x);
            const oppAngle = pAngle + Math.PI + (Math.random() - 0.5);
            bestX = Math.cos(oppAngle) * (this.worldRadius * 0.6);
            bestY = Math.sin(oppAngle) * (this.worldRadius * 0.6);
        }

        return { x: bestX, y: bestY };
    }

    start(name, skinIndex) {
        // Cancelar cualquier bucle de renderizado anterior para evitar acumulación de velocidad
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.playerName = name || 'Gusano' + Math.floor(Math.random() * 1000);
        this.selectedSkinIndex = skinIndex;

        // Iniciar audio context
        sound.init();

        // Inicializar gestor de comida en el mapa ampliado
        this.foodManager.init();

        // Crear jugador en el centro con puntuación y masa inicial auténtica (10)
        const playerSkin = SKINS[this.selectedSkinIndex] || SKINS[0];
        this.player = new Snake('player', this.playerName, 0, 0, playerSkin, false);
        this.player.mass = 10;
        this.player.score = 10;

        // Inicializar lista de serpientes
        this.snakes = [this.player];

        // Generar Bots iniciales en posiciones seguras lejos del centro/jugador
        for (let i = 0; i < this.targetBotCount; i++) {
            this.spawnBot(1000);
        }

        this.gameStartTime = Date.now();
        this.isRunning = true;

        // Ocultar menú de inicio y game over
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('hudOverlay').classList.remove('hidden');

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    spawnBot(minDistance = 900) {
        const pt = this.findSafeSpawnPoint(minDistance);
        const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
        const bot = new Bot('bot_' + Math.random().toString(36).substr(2, 6), name, pt.x, pt.y, skin);

        // Orientar el bot en dirección contraria al jugador para que nunca cargue hacia él al aparecer
        if (this.player && this.player.isAlive) {
            const angleAway = Math.atan2(pt.y - this.player.y, pt.x - this.player.x);
            bot.angle = angleAway + (Math.random() - 0.5) * 0.6;
            bot.targetAngle = bot.angle;
        }

        // Distribución de puntuación realista para los rivales
        const rand = Math.random();
        if (rand < 0.45) {
            bot.mass = 10 + Math.floor(Math.random() * 20);
        } else if (rand < 0.8) {
            bot.mass = 30 + Math.floor(Math.random() * 50);
        } else {
            bot.mass = 80 + Math.floor(Math.random() * 120);
        }
        bot.score = Math.floor(bot.mass);

        this.snakes.push(bot);
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    update() {
        const now = Date.now();
        if (this.player && this.player.isAlive) {
            this.survivalTime = Math.floor((now - this.gameStartTime) / 1000);
        }

        // 1. Actualizar Comida
        this.foodManager.update();

        // 2. IA de Bots
        for (const snake of this.snakes) {
            if (snake.isBot && snake.isAlive) {
                snake.think(this.worldRadius, this.snakes, this.foodManager);
            }
        }

        // 3. Actualizar Físicas de Serpientes
        for (const snake of this.snakes) {
            if (snake.isAlive) {
                snake.update(this.foodManager, snake === this.player ? sound : null);
                snake.checkFood(this.foodManager, sound, snake === this.player);
            }
        }

        // 4. Comprobar colisiones
        this.checkCollisions();

        // 5. Mantener población de bots
        const activeBots = this.snakes.filter(s => s.isBot && s.isAlive).length;
        if (activeBots < this.targetBotCount && Math.random() < 0.05) {
            this.spawnBot();
        }

        // 6. Actualizar cámara suavemente
        if (this.player && this.player.isAlive) {
            this.camera.x += (this.player.x - this.camera.x) * 0.12;
            this.camera.y += (this.player.y - this.camera.y) * 0.12;

            // Zoom adaptativo: mientras más grande sea la serpiente, más amplia es la visión
            this.camera.targetZoom = Math.max(0.65, 1.0 - (this.player.radius - 10) * 0.012);
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05;
        }

        // 7. Actualizar HUD
        this.updateHUD();
    }

    checkCollisions() {
        for (let i = 0; i < this.snakes.length; i++) {
            const snakeA = this.snakes[i];
            if (!snakeA.isAlive) continue;

            // A) Colisión contra la barrera circular del mundo
            const distFromCenter = Math.hypot(snakeA.x, snakeA.y);
            if (distFromCenter + snakeA.radius >= this.worldRadius) {
                snakeA.die(this.foodManager, snakeA === this.player ? sound : null);
                if (snakeA === this.player) this.handleGameOver();
                continue;
            }

            // B) Colisión contra otras serpientes (cápsula continua, imposible atravesar)
            for (let j = 0; j < this.snakes.length; j++) {
                if (i === j) continue;
                const snakeB = this.snakes[j];
                if (!snakeB.isAlive) continue;

                // 1. Choque Frontal Cabeza con Cabeza
                const headDx = snakeA.x - snakeB.x;
                const headDy = snakeA.y - snakeB.y;
                const headDistSq = headDx * headDx + headDy * headDy;
                const headHitRadius = (snakeA.radius + snakeB.radius) * 0.85;

                if (headDistSq < headHitRadius * headHitRadius) {
                    if (snakeA.mass <= snakeB.mass) {
                        snakeA.die(this.foodManager, snakeA === this.player ? sound : null);
                        if (snakeB === this.player) { this.player.kills++; sound.playKillSound(); }
                        if (snakeA === this.player) this.handleGameOver();
                    }
                    if (snakeB.mass <= snakeA.mass && snakeB.isAlive) {
                        snakeB.die(this.foodManager, snakeB === this.player ? sound : null);
                        if (snakeA === this.player) { this.player.kills++; sound.playKillSound(); }
                        if (snakeB === this.player) this.handleGameOver();
                    }
                    if (!snakeA.isAlive) break;
                }

                // 2. Choque de Cabeza de SnakeA contra el cuerpo de SnakeB (intersección continua de segmento a segmento)
                const bSegments = snakeB.getSegments();
                for (let s = 1; s < bSegments.length - 1; s++) {
                    const p1 = bSegments[s];
                    const p2 = bSegments[s + 1];

                    // Radio de colisión en este segmento del cuerpo
                    const factor = Math.max(0.4, 1 - (s / bSegments.length) * 0.45);
                    const segRadius = snakeB.radius * factor;
                    const hitDist = snakeA.radius * 0.95 + segRadius * 0.95;

                    // Distancia mínima desde la cabeza de snakeA hasta la línea continua entre p1 y p2
                    const l2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
                    let distSq;
                    if (l2 === 0) {
                        const dx = snakeA.x - p1.x;
                        const dy = snakeA.y - p1.y;
                        distSq = dx * dx + dy * dy;
                    } else {
                        let t = ((snakeA.x - p1.x) * (p2.x - p1.x) + (snakeA.y - p1.y) * (p2.y - p1.y)) / l2;
                        t = Math.max(0, Math.min(1, t));
                        const projX = p1.x + t * (p2.x - p1.x);
                        const projY = p1.y + t * (p2.y - p1.y);
                        const dx = snakeA.x - projX;
                        const dy = snakeA.y - projY;
                        distSq = dx * dx + dy * dy;
                    }

                    if (distSq < hitDist * hitDist) {
                        // Impacto sólido sin posibilidad de atravesar el cuerpo
                        snakeA.die(this.foodManager, snakeA === this.player ? sound : null);

                        if (snakeB === this.player && snakeA !== this.player) {
                            this.player.kills++;
                            sound.playKillSound();
                        }

                        if (snakeA === this.player) {
                            this.handleGameOver();
                        }
                        break;
                    }
                }

                if (!snakeA.isAlive) break;
            }
        }
    }

    handleGameOver() {
        sound.stopBoostSound();
        // Detener bucle y limpiar frameId para evitar acumulación
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        setTimeout(() => {
            const rank = this.getPlayerRank();
            document.getElementById('finalScore').textContent = this.player.score;
            document.getElementById('finalKills').textContent = this.player.kills;
            document.getElementById('finalTime').textContent = `${this.survivalTime}s`;
            document.getElementById('finalRank').textContent = `#${rank}`;
            document.getElementById('gameOverModal').classList.remove('hidden');
        }, 800);
    }

    getPlayerRank() {
        const sorted = [...this.snakes].filter(s => s.isAlive || s === this.player)
            .sort((a, b) => b.score - a.score);
        const index = sorted.findIndex(s => s === this.player);
        return index !== -1 ? index + 1 : sorted.length;
    }

    updateHUD() {
        if (!this.player) return;

        // Longitud y Kills
        const lengthEl = document.getElementById('hudLength');
        const rankEl = document.getElementById('hudRank');
        const killsEl = document.getElementById('hudKills');

        if (lengthEl) lengthEl.textContent = this.player.score;
        if (rankEl) rankEl.textContent = `#${this.getPlayerRank()} / ${this.snakes.filter(s => s.isAlive).length}`;
        if (killsEl) killsEl.textContent = this.player.kills;

        // Actualizar barra de turbo
        const boostBar = document.getElementById('boostFill');
        if (boostBar) {
            const boostPercent = Math.min(100, Math.max(0, ((this.player.mass - 12) / 25) * 100));
            boostBar.style.width = `${boostPercent}%`;
        }

        // Actualizar Leaderboard (Top 10)
        const sorted = [...this.snakes].filter(s => s.isAlive)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const listEl = document.getElementById('leaderboardList');
        if (listEl) {
            listEl.innerHTML = sorted.map((s, idx) => {
                const isUser = s === this.player;
                return `
                    <li class="${isUser ? 'highlight' : ''}">
                        <span class="rank-num">#${idx + 1}</span>
                        <span class="snake-name">${s.name}</span>
                        <span class="snake-score">${s.score}</span>
                    </li>
                `;
            }).join('');
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();

        // Centrar y aplicar escala de cámara
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 1. Dibujar Cuadrícula de Fondo Neón
        this.drawBackground(ctx);

        // 2. Dibujar Perímetro de Energía Circular
        this.drawWorldBoundary(ctx);

        // 3. Dibujar Comida y Orbes
        this.foodManager.draw(ctx, this.camera);

        // 4. Dibujar Serpientes
        // Dibujar bots primero y luego el jugador para que quede al frente
        for (const snake of this.snakes) {
            if (snake !== this.player) {
                snake.draw(ctx, this.camera);
            }
        }
        if (this.player) {
            this.player.draw(ctx, this.camera);
        }

        ctx.restore();

        // 5. Dibujar Radar / Minimapa
        this.drawMinimap();
    }

    drawBackground(ctx) {
        const gridSize = 120;
        const startX = Math.floor((this.camera.x - (this.camera.width / this.camera.zoom) / 2) / gridSize) * gridSize;
        const endX = startX + (this.camera.width / this.camera.zoom) + gridSize * 2;
        const startY = Math.floor((this.camera.y - (this.camera.height / this.camera.zoom) / 2) / gridSize) * gridSize;
        const endY = startY + (this.camera.height / this.camera.zoom) + gridSize * 2;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();

        // Puntos en intersecciones
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        for (let x = startX; x <= endX; x += gridSize) {
            for (let y = startY; y <= endY; y += gridSize) {
                if (x * x + y * y < this.worldRadius * this.worldRadius) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    drawWorldBoundary(ctx) {
        ctx.save();
        // Borde exterior oscuro
        ctx.beginPath();
        ctx.arc(0, 0, this.worldRadius, 0, Math.PI * 2);
        ctx.lineWidth = 16;
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.75)';
        ctx.shadowBlur = 28;
        ctx.shadowColor = '#ff0055';
        ctx.stroke();

        // Anillo de brillo interno
        ctx.beginPath();
        ctx.arc(0, 0, this.worldRadius - 10, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.restore();
    }

    drawMinimap() {
        const mCtx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        const radius = w / 2 - 6;

        mCtx.clearRect(0, 0, w, h);

        mCtx.save();
        mCtx.translate(w / 2, h / 2);

        // Fondo del radar
        mCtx.beginPath();
        mCtx.arc(0, 0, radius, 0, Math.PI * 2);
        mCtx.fillStyle = 'rgba(10, 15, 28, 0.85)';
        mCtx.fill();
        mCtx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        mCtx.lineWidth = 2;
        mCtx.stroke();

        // Círculos concéntricos de radar
        mCtx.beginPath();
        mCtx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        mCtx.stroke();

        // Escala de coordenadas relativas
        const scale = radius / this.worldRadius;

        // Dibujar bots en el minimapa
        for (const snake of this.snakes) {
            if (!snake.isAlive || snake === this.player) continue;
            const mx = snake.x * scale;
            const my = snake.y * scale;

            mCtx.beginPath();
            mCtx.arc(mx, my, 1.8, 0, Math.PI * 2);
            mCtx.fillStyle = 'rgba(255, 100, 120, 0.85)';
            mCtx.fill();
        }

        // Dibujar jugador en el radar
        if (this.player && this.player.isAlive) {
            const px = this.player.x * scale;
            const py = this.player.y * scale;

            mCtx.beginPath();
            mCtx.arc(px, py, 3.8, 0, Math.PI * 2);
            mCtx.fillStyle = '#00f2fe';
            mCtx.shadowBlur = 8;
            mCtx.shadowColor = '#00f2fe';
            mCtx.fill();

            mCtx.beginPath();
            mCtx.arc(px, py, 1.8, 0, Math.PI * 2);
            mCtx.fillStyle = '#ffffff';
            mCtx.fill();
        }

        mCtx.restore();
    }
}

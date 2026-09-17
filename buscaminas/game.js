// Buscaminas Deluxe - Lógica Principal del Juego

class MinesweeperGame {
    constructor() {
        this.difficulties = {
            easy: { cols: 9, rows: 9, mines: 10, name: 'Principiante' },
            medium: { cols: 16, rows: 16, mines: 40, name: 'Intermedio' },
            expert: { cols: 30, rows: 16, mines: 99, name: 'Experto' },
            custom: { cols: 20, rows: 15, mines: 35, name: 'Personalizado' }
        };

        this.currentDifficulty = 'easy';
        this.cols = 9;
        this.rows = 9;
        this.totalMines = 10;

        this.grid = []; // Array 2D [r][c]
        this.status = 'ready'; // 'ready' | 'playing' | 'won' | 'lost'
        this.firstClick = true;
        this.flagsPlaced = 0;
        this.revealedCount = 0;
        this.totalCells = 81;

        // Cronómetro
        this.timer = 0;
        this.timerInterval = null;

        // Modo táctil ('dig' | 'flag')
        this.inputMode = 'dig';

        // Elementos del DOM
        this.boardEl = document.getElementById('board');
        this.boardViewport = document.getElementById('board-viewport');
        this.minesCounterEl = document.getElementById('mines-counter');
        this.timerCounterEl = document.getElementById('timer-counter');
        this.faceBtn = document.getElementById('face-btn');
        this.faceIcon = document.getElementById('face-icon');
        this.gameConsole = document.getElementById('game-console');
        this.gameBanner = document.getElementById('game-banner');
        this.bannerTitle = document.getElementById('banner-title');
        this.bannerText = document.getElementById('banner-text');
        this.btnBannerReplay = document.getElementById('btn-banner-replay');

        // Modales
        this.modalCustom = document.getElementById('modal-custom');
        this.modalStats = document.getElementById('modal-stats');
        this.modalHelp = document.getElementById('modal-help');

        // Confetti Canvas
        this.canvas = document.getElementById('effects-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationFrameId = null;

        this.initCanvas();
        this.bindEvents();
        this.loadSettings();
        this.newGame(this.currentDifficulty);
    }

    initCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    bindEvents() {
        // Selector de dificultad
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diff = btn.dataset.difficulty;
                if (diff === 'custom') {
                    this.openCustomModal();
                } else {
                    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.newGame(diff);
                }
            });
        });

        // Botón carita
        this.faceBtn.addEventListener('click', () => {
            window.soundManager.playClick();
            this.newGame(this.currentDifficulty);
        });

        // Botones de la barra móvil
        const btnDig = document.getElementById('btn-mode-dig');
        const btnFlag = document.getElementById('btn-mode-flag');
        btnDig.addEventListener('click', () => {
            this.inputMode = 'dig';
            btnDig.classList.add('active');
            btnFlag.classList.remove('active');
            window.soundManager.playClick();
        });
        btnFlag.addEventListener('click', () => {
            this.inputMode = 'flag';
            btnFlag.classList.add('active');
            btnDig.classList.remove('active');
            window.soundManager.playClick();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            window.soundManager.playClick();
            this.newGame(this.currentDifficulty);
        });

        // Banner Replay
        this.btnBannerReplay.addEventListener('click', () => {
            this.gameBanner.classList.add('hidden');
            this.newGame(this.currentDifficulty);
        });

        // Botones cabecera
        const btnSound = document.getElementById('btn-sound');
        btnSound.addEventListener('click', () => {
            const isMuted = window.soundManager.toggleMute();
            btnSound.textContent = isMuted ? '🔇' : '🔊';
            btnSound.title = isMuted ? 'Sonido silenciado' : 'Sonido activado';
        });
        // Sincronizar icono inicial de sonido
        if (window.soundManager.muted) {
            btnSound.textContent = '🔇';
        }

        document.getElementById('btn-stats').addEventListener('click', () => this.openStatsModal());
        document.getElementById('btn-help').addEventListener('click', () => this.openHelpModal());

        // Cerrar modales
        document.getElementById('close-custom').addEventListener('click', () => this.closeCustomModal());
        document.getElementById('cancel-custom').addEventListener('click', () => this.closeCustomModal());
        document.getElementById('close-stats').addEventListener('click', () => this.closeStatsModal());
        document.getElementById('btn-close-stats-action').addEventListener('click', () => this.closeStatsModal());
        document.getElementById('close-help').addEventListener('click', () => this.closeHelpModal());
        document.getElementById('btn-close-help-action').addEventListener('click', () => this.closeHelpModal());

        // Borrar records
        document.getElementById('btn-reset-stats').addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar todos los récords guardados?')) {
                localStorage.removeItem('buscaminas_record_easy');
                localStorage.removeItem('buscaminas_record_medium');
                localStorage.removeItem('buscaminas_record_expert');
                this.updateStatsDisplay();
            }
        });

        // Formulario personalizado
        const customForm = document.getElementById('custom-form');
        const customColsInput = document.getElementById('custom-cols');
        const customRowsInput = document.getElementById('custom-rows');
        const customMinesInput = document.getElementById('custom-mines');
        const customMaxMinesSpan = document.getElementById('custom-max-mines');

        const updateMaxMines = () => {
            const cols = parseInt(customColsInput.value) || 9;
            const rows = parseInt(customRowsInput.value) || 9;
            const maxMines = Math.max(1, (cols * rows) - 9);
            customMinesInput.max = maxMines;
            customMaxMinesSpan.textContent = maxMines;
            if (parseInt(customMinesInput.value) > maxMines) {
                customMinesInput.value = Math.floor(maxMines * 0.2);
            }
        };

        customColsInput.addEventListener('input', updateMaxMines);
        customRowsInput.addEventListener('input', updateMaxMines);

        customForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cols = Math.min(35, Math.max(8, parseInt(customColsInput.value)));
            const rows = Math.min(25, Math.max(8, parseInt(customRowsInput.value)));
            const maxM = (cols * rows) - 9;
            const mines = Math.min(maxM, Math.max(1, parseInt(customMinesInput.value)));

            this.difficulties.custom = { cols, rows, mines, name: 'Personalizado' };
            this.closeCustomModal();

            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-custom-diff').classList.add('active');

            this.newGame('custom');
        });

        // Prevenir contextmenu en todo el tablero para usar clic derecho como bandera
        this.boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    loadSettings() {
        const savedDiff = localStorage.getItem('buscaminas_last_diff');
        if (savedDiff && this.difficulties[savedDiff]) {
            this.currentDifficulty = savedDiff;
            document.querySelectorAll('.diff-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.difficulty === savedDiff);
            });
        }
    }

    newGame(difficultyKey) {
        this.stopTimer();
        this.clearEffects();
        this.gameBanner.classList.add('hidden');
        this.gameConsole.classList.remove('shake');

        if (this.difficulties[difficultyKey]) {
            this.currentDifficulty = difficultyKey;
            localStorage.setItem('buscaminas_last_diff', difficultyKey);
        }

        const config = this.difficulties[this.currentDifficulty];
        this.cols = config.cols;
        this.rows = config.rows;
        this.totalMines = config.mines;
        this.totalCells = this.cols * this.rows;

        this.status = 'ready';
        this.firstClick = true;
        this.flagsPlaced = 0;
        this.revealedCount = 0;
        this.timer = 0;

        this.setFace('🙂');
        this.updateCounters();
        this.renderBoard();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        this.grid = [];

        this.boardEl.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;

        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const cellObj = {
                    r,
                    c,
                    isMine: false,
                    neighborMines: 0,
                    state: 'hidden', // 'hidden' | 'revealed' | 'flagged' | 'question'
                    element: null
                };

                const cellDiv = document.createElement('div');
                cellDiv.className = 'cell hidden';
                cellDiv.setAttribute('role', 'button');
                cellDiv.setAttribute('aria-label', `Casilla fila ${r + 1}, columna ${c + 1}`);
                cellDiv.dataset.row = r;
                cellDiv.dataset.col = c;

                this.setupCellInteractions(cellDiv, cellObj);

                cellObj.element = cellDiv;
                this.grid[r][c] = cellObj;
                this.boardEl.appendChild(cellDiv);
            }
        }
    }

    setupCellInteractions(element, cell) {
        let touchTimeout = null;
        let touchMoved = false;

        // Mousedown / Mouseup para la expresión de la cara
        element.addEventListener('mousedown', (e) => {
            if (this.status === 'playing' || this.status === 'ready') {
                if (e.button === 0) {
                    this.setFace('😮');
                    if (cell.state === 'revealed' && cell.neighborMines > 0) {
                        this.highlightNeighbors(cell.r, cell.c, true);
                    }
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.status === 'playing' || this.status === 'ready') {
                this.setFace('🙂');
                this.clearNeighborsHighlight();
            }
        });

        // Clic principal
        element.addEventListener('click', (e) => {
            if (this.status === 'lost' || this.status === 'won') return;

            if (this.inputMode === 'flag') {
                this.toggleFlag(cell);
            } else {
                this.handleCellPrimaryAction(cell);
            }
        });

        // Clic secundario (clic derecho)
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.status === 'lost' || this.status === 'won') return;
            this.toggleFlag(cell);
        });

        // Soporte Táctil Móvil (Pulsación larga para bandera)
        element.addEventListener('touchstart', (e) => {
            touchMoved = false;
            if (this.status === 'lost' || this.status === 'won') return;

            this.setFace('😮');
            touchTimeout = setTimeout(() => {
                if (!touchMoved && (cell.state === 'hidden' || cell.state === 'flagged' || cell.state === 'question')) {
                    this.toggleFlag(cell);
                    if (navigator.vibrate) navigator.vibrate(40);
                    touchTimeout = null;
                }
            }, 350);
        }, { passive: true });

        element.addEventListener('touchmove', () => {
            touchMoved = true;
            if (touchTimeout) clearTimeout(touchTimeout);
        }, { passive: true });

        element.addEventListener('touchend', () => {
            if (touchTimeout) {
                clearTimeout(touchTimeout);
                touchTimeout = null;
            }
            if (this.status === 'playing' || this.status === 'ready') {
                this.setFace('🙂');
            }
        }, { passive: true });
    }

    handleCellPrimaryAction(cell) {
        if (cell.state === 'flagged') {
            return; // No revelar si tiene bandera
        }

        if (cell.state === 'revealed') {
            // Chording: si se hace clic en casilla con número revelado
            if (cell.neighborMines > 0) {
                this.executeChord(cell);
            }
            return;
        }

        if (cell.state === 'hidden' || cell.state === 'question') {
            if (this.firstClick) {
                this.handleFirstClick(cell.r, cell.c);
            }
            this.revealCell(cell.r, cell.c);
        }
    }

    handleFirstClick(startR, startC) {
        this.firstClick = false;
        this.status = 'playing';
        this.startTimer();

        // Colocar minas asegurando que startR, startC y sus 8 vecinos estén 100% libres
        const protectedCoords = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = startR + dr;
                const nc = startC + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    protectedCoords.add(`${nr},${nc}`);
                }
            }
        }

        // Si la zona protegida deja menos casillas que minas requeridas, proteger solo la central
        let candidates = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!protectedCoords.has(`${r},${c}`)) {
                    candidates.push({ r, c });
                }
            }
        }

        if (candidates.length < this.totalMines) {
            candidates = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (r !== startR || c !== startC) {
                        candidates.push({ r, c });
                    }
                }
            }
        }

        // Barajar candidatos aleatoriamente (Fisher-Yates)
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // Asignar minas
        for (let i = 0; i < this.totalMines && i < candidates.length; i++) {
            const { r, c } = candidates[i];
            this.grid[r][c].isMine = true;
        }

        // Calcular conteo de vecinos para cada celda
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.grid[r][c].isMine) {
                    let count = 0;
                    this.forEachNeighbor(r, c, (nr, nc) => {
                        if (this.grid[nr][nc].isMine) count++;
                    });
                    this.grid[r][c].neighborMines = count;
                }
            }
        }
    }

    revealCell(r, c) {
        const cell = this.grid[r][c];
        if (cell.state !== 'hidden' && cell.state !== 'question') return;

        if (cell.isMine) {
            this.gameOverLost(cell);
            return;
        }

        // Revelar casilla
        cell.state = 'revealed';
        cell.element.classList.remove('hidden', 'question', 'flagged');
        cell.element.classList.add('revealed', 'animate-reveal');
        this.revealedCount++;

        if (cell.neighborMines > 0) {
            cell.element.textContent = cell.neighborMines;
            cell.element.dataset.num = cell.neighborMines;
            window.soundManager.playReveal();
        } else {
            // Casilla vacía (0 minas alrededor): expansión automática (Flood Fill)
            window.soundManager.playReveal();
            const queue = [{ r, c }];

            while (queue.length > 0) {
                const curr = queue.shift();

                this.forEachNeighbor(curr.r, curr.c, (nr, nc) => {
                    const neighbor = this.grid[nr][nc];
                    if ((neighbor.state === 'hidden' || neighbor.state === 'question') && !neighbor.isMine) {
                        neighbor.state = 'revealed';
                        neighbor.element.classList.remove('hidden', 'question', 'flagged');
                        neighbor.element.classList.add('revealed', 'animate-reveal');
                        this.revealedCount++;

                        if (neighbor.neighborMines > 0) {
                            neighbor.element.textContent = neighbor.neighborMines;
                            neighbor.element.dataset.num = neighbor.neighborMines;
                        } else {
                            queue.push({ r: nr, c: nc });
                        }
                    }
                });
            }
        }

        this.checkWinCondition();
    }

    executeChord(cell) {
        // Contar banderas adyacentes
        let flagCount = 0;
        const hiddenNeighbors = [];

        this.forEachNeighbor(cell.r, cell.c, (nr, nc) => {
            const neighbor = this.grid[nr][nc];
            if (neighbor.state === 'flagged') {
                flagCount++;
            } else if (neighbor.state === 'hidden' || neighbor.state === 'question') {
                hiddenNeighbors.push(neighbor);
            }
        });

        if (flagCount === cell.neighborMines) {
            window.soundManager.playChord();
            hiddenNeighbors.forEach(neighbor => {
                this.revealCell(neighbor.r, neighbor.c);
            });
        } else {
            // Efecto visual de no poder abrir aún
            this.highlightNeighbors(cell.r, cell.c, true);
            setTimeout(() => this.clearNeighborsHighlight(), 150);
        }
    }

    toggleFlag(cell) {
        if (cell.state === 'revealed') return;

        if (this.firstClick) {
            // Si pone bandera antes de cavar, permitimos marcar pero no arranca timer todavía
        }

        if (cell.state === 'hidden') {
            cell.state = 'flagged';
            cell.element.classList.remove('hidden');
            cell.element.classList.add('flagged');
            this.flagsPlaced++;
            window.soundManager.playFlag();
        } else if (cell.state === 'flagged') {
            cell.state = 'question';
            cell.element.classList.remove('flagged');
            cell.element.classList.add('question');
            this.flagsPlaced--;
            window.soundManager.playUnflag();
        } else if (cell.state === 'question') {
            cell.state = 'hidden';
            cell.element.classList.remove('question');
            cell.element.classList.add('hidden');
            window.soundManager.playUnflag();
        }

        this.updateCounters();
    }

    forEachNeighbor(r, c, callback) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    callback(nr, nc);
                }
            }
        }
    }

    highlightNeighbors(r, c, active) {
        this.clearNeighborsHighlight();
        this.forEachNeighbor(r, c, (nr, nc) => {
            const n = this.grid[nr][nc];
            if (n.state === 'hidden' || n.state === 'question') {
                n.element.classList.toggle('chording-active', active);
            }
        });
    }

    clearNeighborsHighlight() {
        document.querySelectorAll('.cell.chording-active').forEach(el => {
            el.classList.remove('chording-active');
        });
    }

    checkWinCondition() {
        // La condición de victoria estándar es haber descubierto todas las casillas sin mina
        const safeCells = this.totalCells - this.totalMines;
        if (this.revealedCount >= safeCells && this.status === 'playing') {
            this.gameOverWon();
        }
    }

    gameOverWon() {
        this.status = 'won';
        this.stopTimer();
        this.setFace('😎');
        window.soundManager.playWin();

        // Auto-colocar banderas en todas las minas que no tenían
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.isMine && cell.state !== 'flagged') {
                    cell.state = 'flagged';
                    cell.element.classList.remove('hidden', 'question');
                    cell.element.classList.add('flagged');
                }
            }
        }
        this.flagsPlaced = this.totalMines;
        this.updateCounters();

        // Guardar récord si aplica
        let isRecord = false;
        if (this.currentDifficulty !== 'custom') {
            const key = `buscaminas_record_${this.currentDifficulty}`;
            const currentBest = localStorage.getItem(key);
            if (!currentBest || this.timer < parseInt(currentBest)) {
                localStorage.setItem(key, this.timer);
                isRecord = true;
            }
        }

        // Iniciar confeti
        this.launchConfetti();

        // Mostrar Banner
        this.bannerTitle.textContent = isRecord ? '¡NUEVO RÉCORD! 🏆🎉' : '¡VICTORIA! 🎉';
        this.bannerText.textContent = `Has completado el tablero en ${this.timer} segundos.`;
        this.gameBanner.classList.remove('hidden');
    }

    gameOverLost(explodedCell) {
        this.status = 'lost';
        this.stopTimer();
        this.setFace('😵');
        window.soundManager.playExplosion();

        // Sacudida de pantalla
        this.gameConsole.classList.add('shake');
        setTimeout(() => this.gameConsole.classList.remove('shake'), 500);

        // Revelar el resto de las minas
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell === explodedCell) {
                    cell.element.classList.remove('hidden', 'question', 'flagged');
                    cell.element.classList.add('mine-exploded');
                } else if (cell.isMine && cell.state !== 'flagged') {
                    cell.element.classList.remove('hidden', 'question');
                    cell.element.classList.add('mine-revealed');
                } else if (!cell.isMine && cell.state === 'flagged') {
                    cell.element.classList.remove('flagged');
                    cell.element.classList.add('wrong-flag');
                }
            }
        }

        // Mostrar Banner
        this.bannerTitle.textContent = '¡BOOM! Has pisado una mina 💥';
        this.bannerText.textContent = `Tiempo jugado: ${this.timer} segundos.`;
        this.gameBanner.classList.remove('hidden');
    }

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            if (this.timer < 999) {
                this.timer++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateCounters() {
        const remaining = this.totalMines - this.flagsPlaced;
        const displayVal = Math.max(-99, Math.min(999, remaining));
        this.minesCounterEl.textContent = this.formatNumber(displayVal);
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        this.timerCounterEl.textContent = this.formatNumber(this.timer);
    }

    formatNumber(num) {
        if (num < 0) {
            const abs = Math.min(99, Math.abs(num));
            return `-${abs.toString().padStart(2, '0')}`;
        }
        return Math.min(999, num).toString().padStart(3, '0');
    }

    setFace(emoji) {
        this.faceIcon.textContent = emoji;
    }

    // --- Sistema de Confeti y Partículas ---
    launchConfetti() {
        this.clearEffects();
        const colors = ['#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#ef4444', '#ffffff'];
        this.particles = [];

        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.8) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 10,
                alpha: 1,
                decay: Math.random() * 0.008 + 0.004
            });
        }

        const render = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            let aliveCount = 0;
            for (let p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.28; // Gravedad
                p.vx *= 0.98; // Fricción aire
                p.rotation += p.vRot;
                p.alpha -= p.decay;

                if (p.alpha > 0) {
                    aliveCount++;
                    this.ctx.save();
                    this.ctx.globalAlpha = Math.max(0, p.alpha);
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate((p.rotation * Math.PI) / 180);
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    this.ctx.restore();
                }
            }

            if (aliveCount > 0) {
                this.animationFrameId = requestAnimationFrame(render);
            } else {
                this.clearEffects();
            }
        };

        this.animationFrameId = requestAnimationFrame(render);
    }

    clearEffects() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.particles = [];
    }

    // --- Modales ---
    openCustomModal() {
        const c = this.difficulties.custom;
        document.getElementById('custom-cols').value = c.cols;
        document.getElementById('custom-rows').value = c.rows;
        document.getElementById('custom-mines').value = c.mines;
        document.getElementById('custom-max-mines').textContent = (c.cols * c.rows) - 9;
        this.modalCustom.classList.remove('hidden');
    }
    closeCustomModal() {
        this.modalCustom.classList.add('hidden');
    }

    openStatsModal() {
        this.updateStatsDisplay();
        this.modalStats.classList.remove('hidden');
    }
    closeStatsModal() {
        this.modalStats.classList.add('hidden');
    }
    updateStatsDisplay() {
        ['easy', 'medium', 'expert'].forEach(d => {
            const val = localStorage.getItem(`buscaminas_record_${d}`);
            const el = document.getElementById(`record-${d}`);
            if (el) {
                el.textContent = val ? `${val} seg` : '-- seg';
            }
        });
    }

    openHelpModal() {
        this.modalHelp.classList.remove('hidden');
    }
    closeHelpModal() {
        this.modalHelp.classList.add('hidden');
    }
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    window.minesweeper = new MinesweeperGame();
});

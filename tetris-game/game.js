/**
 * TETRIS NEON ARCADE - MOTOR PRINCIPAL DEL JUEGO
 * Sistema SRS de rotación, 7-Bag randomizer, retención de pieza (Hold),
 * cola de próximas piezas, efectos de partículas, combo toasts y controles táctiles.
 */

// Definición de Tetrominoes (Matrices 0 = vacío, 1 = bloque)
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.8)',
    border: '#a6faff'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#2979ff',
    glow: 'rgba(41, 121, 255, 0.8)',
    border: '#82b1ff'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff9100',
    glow: 'rgba(255, 145, 0, 0.8)',
    border: '#ffd180'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffea00',
    glow: 'rgba(255, 234, 0, 0.8)',
    border: '#ffff8d'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00e676',
    glow: 'rgba(0, 230, 118, 0.8)',
    border: '#b9f6ca'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#d500f9',
    glow: 'rgba(213, 0, 249, 0.8)',
    border: '#ea80fc'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff1744',
    glow: 'rgba(255, 23, 68, 0.8)',
    border: '#ff8a80'
  }
};

// SRS Wall Kick Offsets (para rotaciones J, L, S, T, Z)
const WALL_KICKS_NORMAL = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3->2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
};

// SRS Wall Kick Offsets (para I)
const WALL_KICKS_I = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
};

class TetrisGame {
  constructor() {
    this.cols = 10;
    this.rows = 20;
    this.blockSize = 30;

    // Elementos del DOM
    this.canvas = document.getElementById('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');

    this.nextCanvases = [
      document.getElementById('next-canvas-1'),
      document.getElementById('next-canvas-2'),
      document.getElementById('next-canvas-3')
    ].map(c => c ? c.getContext('2d') : null);

    this.scoreEl = document.getElementById('score-val');
    this.bestEl = document.getElementById('best-val');
    this.levelEl = document.getElementById('level-val');
    this.linesEl = document.getElementById('lines-val');

    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreEl = document.getElementById('final-score-val');
    this.finalBestEl = document.getElementById('final-best-val');
    this.comboToast = document.getElementById('combo-toast');

    // Motor de Audio
    this.audio = new TetrisAudioEngine();

    // Tablero (0 = vacío, string de color = ocupado)
    this.board = this.createBoard();

    // 7-Bag Randomizer
    this.bag = [];
    this.nextQueue = [];

    // Pieza actual & Hold
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;

    // Estado del juego
    this.score = 0;
    this.bestScore = this.loadBestScore();
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;

    this.isPaused = false;
    this.isGameOver = false;

    // Bucle y tiempos
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;

    // Partículas y animaciones
    this.particles = [];
    this.clearingLines = []; // Líneas en animación de borrado
    this.clearAnimTime = 0;

    // Configuración inicial
    this.bestEl.textContent = this.bestScore.toLocaleString();
    this.initEvents();
    this.initTouchControls();
    this.restart();

    // Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createBoard() {
    return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
  }

  loadBestScore() {
    try {
      return parseInt(localStorage.getItem('tetris_neon_best')) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestScore() {
    try {
      localStorage.setItem('tetris_neon_best', this.bestScore.toString());
    } catch (e) {}
  }

  restart() {
    this.board = this.createBoard();
    this.bag = [];
    this.nextQueue = [];
    this.fillQueue();

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.backToBack = false;
    this.dropInterval = 1000;
    this.holdPiece = null;
    this.canHold = true;
    this.isGameOver = false;
    this.isPaused = false;
    this.particles = [];
    this.clearingLines = [];

    this.updateStatsUI();
    this.gameoverOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');

    this.spawnPiece();
    this.drawHold();
    this.drawNextQueue();
  }

  // Generador 7-Bag
  fillQueue() {
    while (this.nextQueue.length < 5) {
      if (this.bag.length === 0) {
        this.bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'].sort(() => Math.random() - 0.5);
      }
      this.nextQueue.push(this.bag.pop());
    }
  }

  spawnPiece() {
    this.fillQueue();
    const type = this.nextQueue.shift();
    this.fillQueue();

    const def = TETROMINOES[type];
    const shape = def.shape.map(r => [...r]);

    this.currentPiece = {
      type,
      shape,
      color: def.color,
      glow: def.glow,
      border: def.border,
      rotation: 0,
      x: Math.floor((this.cols - shape[0].length) / 2),
      y: type === 'I' ? -1 : 0
    };

    this.canHold = true;
    this.drawNextQueue();

    // Comprobar colisión al inicio (Game Over)
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.triggerGameOver();
    }
  }

  // Comprobar colisiones
  checkCollision(x, y, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;

          // Fuera de límites horizontales o fondo
          if (newX < 0 || newX >= this.cols || newY >= this.rows) {
            return true;
          }

          // Casilla ocupada en el tablero (arriba de y=0 se permite para spawn)
          if (newY >= 0 && this.board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Rotar matriz 90 grados
  rotateMatrix(matrix, dir = 1) {
    const N = matrix.length;
    const res = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (dir > 0) {
          res[c][N - 1 - r] = matrix[r][c];
        } else {
          res[N - 1 - c][r] = matrix[r][c];
        }
      }
    }
    return res;
  }

  // Intento de rotación con SRS Wall Kicks
  rotatePiece(dir = 1) {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (this.currentPiece.type === 'O') return; // El cuadrado no necesita rotación

    const oldRot = this.currentPiece.rotation;
    const newRot = (oldRot + dir + 4) % 4;
    const rotatedShape = this.rotateMatrix(this.currentPiece.shape, dir);

    const kickTable = this.currentPiece.type === 'I' ? WALL_KICKS_I : WALL_KICKS_NORMAL;
    const kickKey = `${oldRot}->${newRot}`;
    const kicks = kickTable[kickKey] || [[0, 0]];

    for (const [kx, ky] of kicks) {
      // Nota: SRS ky es invertido con respecto a coordenadas de canvas
      if (!this.checkCollision(this.currentPiece.x + kx, this.currentPiece.y - ky, rotatedShape)) {
        this.currentPiece.x += kx;
        this.currentPiece.y -= ky;
        this.currentPiece.shape = rotatedShape;
        this.currentPiece.rotation = newRot;
        this.audio.playRotate();
        return;
      }
    }
  }

  movePiece(dx) {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return false;
    if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y, this.currentPiece.shape)) {
      this.currentPiece.x += dx;
      this.audio.playMove();
      return true;
    }
    return false;
  }

  softDrop() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      this.score += 1;
      this.updateStatsUI();
      this.dropCounter = 0;
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    let dropDist = 0;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      dropDist++;
    }
    this.score += dropDist * 2;
    this.audio.playHardDrop();
    this.createDropParticles(this.currentPiece);
    this.lockPiece();
  }

  hold() {
    if (!this.currentPiece || !this.canHold || this.isPaused || this.isGameOver) return;

    this.audio.playHold();
    const curType = this.currentPiece.type;

    if (!this.holdPiece) {
      this.holdPiece = curType;
      this.spawnPiece();
    } else {
      const nextType = this.holdPiece;
      this.holdPiece = curType;

      const def = TETROMINOES[nextType];
      const shape = def.shape.map(r => [...r]);
      this.currentPiece = {
        type: nextType,
        shape,
        color: def.color,
        glow: def.glow,
        border: def.border,
        rotation: 0,
        x: Math.floor((this.cols - shape[0].length) / 2),
        y: nextType === 'I' ? -1 : 0
      };
    }

    this.canHold = false;
    this.drawHold();
  }

  // Proyección fantasma (Ghost piece)
  getGhostY() {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, gy + 1, this.currentPiece.shape)) {
      gy++;
    }
    return gy;
  }

  // Fijar pieza en el tablero
  lockPiece() {
    const { x, y, shape, color, border } = this.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardY = y + r;
          const boardX = x + c;
          if (boardY >= 0 && boardY < this.rows) {
            this.board[boardY][boardX] = { color, border };
          }
        }
      }
    }

    this.currentPiece = null;
    this.checkLines();
  }

  checkLines() {
    const fullRows = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.board[r].every(cell => cell !== 0)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      this.clearingLines = fullRows;
      this.clearAnimTime = Date.now();

      // Efectos de partículas en las líneas
      fullRows.forEach(r => {
        this.createLineClearParticles(r);
      });

      this.audio.playLineClear(fullRows.length);

      // Puntos y combos
      this.combo++;
      const isTetris = fullRows.length === 4;
      let basePoints = [0, 100, 300, 500, 800][fullRows.length] * this.level;

      if (isTetris) {
        if (this.backToBack) basePoints = Math.floor(basePoints * 1.5);
        this.backToBack = true;
      } else {
        this.backToBack = false;
      }

      if (this.combo > 0) {
        basePoints += 50 * this.combo * this.level;
      }

      this.score += basePoints;
      this.lines += fullRows.length;

      // Actualizar Toast de combo / Tetris
      let toastMsg = fullRows.length === 4 ? '¡TETRIS! 🔥' : `${fullRows.length} LÍNEA${fullRows.length > 1 ? 'S' : ''}`;
      if (this.combo > 0) toastMsg += `\nCOMBO x${this.combo + 1}`;
      this.showToast(toastMsg);

      // Subir nivel cada 10 líneas
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.dropInterval = Math.max(80, 1000 - (this.level - 1) * 85);
        this.audio.playLevelUp();
        this.showToast(`¡NIVEL ${this.level}! ⭐`);
      }

      this.updateStatsUI();

      // Esperar breve animación antes de compactar
      setTimeout(() => {
        this.collapseLines(fullRows);
        this.clearingLines = [];
        this.spawnPiece();
      }, 160);
    } else {
      this.combo = -1;
      this.spawnPiece();
    }
  }

  collapseLines(fullRows) {
    fullRows.forEach(rowIdx => {
      this.board.splice(rowIdx, 1);
      this.board.unshift(Array(this.cols).fill(0));
    });
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.audio.playGameOver();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }
    this.finalScoreEl.textContent = this.score.toLocaleString();
    this.finalBestEl.textContent = this.bestScore.toLocaleString();
    this.gameoverOverlay.classList.remove('hidden');
  }

  togglePause(override) {
    if (this.isGameOver) return;
    this.isPaused = override !== undefined ? override : !this.isPaused;
    this.pauseOverlay.classList.toggle('hidden', !this.isPaused);
    if (this.isPaused) {
      this.audio.stopMusic();
    } else if (this.audio.musicEnabled) {
      this.audio.startMusic();
    }
  }

  showToast(text) {
    if (!this.comboToast) return;
    this.comboToast.innerHTML = text.replace('\n', '<br>');
    this.comboToast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.comboToast.classList.add('hidden');
    }, 700);
  }

  updateStatsUI() {
    this.scoreEl.textContent = this.score.toLocaleString();
    this.levelEl.textContent = this.level;
    this.linesEl.textContent = this.lines;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestEl.textContent = this.bestScore.toLocaleString();
    }
  }

  // --- RENDERIZADO VISUAL ---

  drawBlock(ctx, x, y, size, color, border, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Relleno Neón
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Bisel brillante superior e izquierdo
    ctx.fillStyle = border || '#fff';
    ctx.shadowBlur = 0;
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);

    // Sombra interna inferior
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 1, y + size - 3, size - 2, 2);
    ctx.fillRect(x + size - 3, y + 1, 2, size - 2);

    ctx.restore();
  }

  drawGhostBlock(ctx, x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.restore();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Tablero fijo
    for (let r = 0; r < this.rows; r++) {
      const isClearing = this.clearingLines.includes(r);
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        if (cell) {
          if (isClearing) {
            // Flash blanco durante borrado de línea
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(c * this.blockSize + 1, r * this.blockSize + 1, this.blockSize - 2, this.blockSize - 2);
          } else {
            this.drawBlock(this.ctx, c * this.blockSize, r * this.blockSize, this.blockSize, cell.color, cell.border);
          }
        }
      }
    }

    // 2. Pieza actual y fantasma
    if (this.currentPiece && !this.isGameOver) {
      const gy = this.getGhostY();

      // Dibujar Fantasma
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c]) {
            const bx = (this.currentPiece.x + c) * this.blockSize;
            const by = (gy + r) * this.blockSize;
            if (by >= 0) {
              this.drawGhostBlock(this.ctx, bx, by, this.blockSize, this.currentPiece.color);
            }
          }
        }
      }

      // Dibujar Pieza Viva
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c]) {
            const bx = (this.currentPiece.x + c) * this.blockSize;
            const by = (this.currentPiece.y + r) * this.blockSize;
            if (by >= 0) {
              this.drawBlock(this.ctx, bx, by, this.blockSize, this.currentPiece.color, this.currentPiece.border);
            }
          }
        }
      }
    }

    // 3. Partículas
    this.updateAndDrawParticles();
  }

  // Previsualización de pieza en canvas pequeño (Hold o Next)
  drawPiecePreview(ctx, type, canvasW, canvasH) {
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (!type) return;

    const def = TETROMINOES[type];
    const shape = def.shape;
    const bSize = type === 'I' ? 16 : 20;

    const pieceW = shape[0].length * bSize;
    const pieceH = shape.length * bSize;
    const offX = Math.floor((canvasW - pieceW) / 2);
    const offY = Math.floor((canvasH - pieceH) / 2);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.drawBlock(ctx, offX + c * bSize, offY + r * bSize, bSize, def.color, def.border);
        }
      }
    }
  }

  drawHold() {
    if (!this.holdCtx) return;
    this.drawPiecePreview(this.holdCtx, this.holdPiece, this.holdCanvas.width, this.holdCanvas.height);
  }

  drawNextQueue() {
    this.nextCanvases.forEach((ctx, idx) => {
      if (ctx && this.nextQueue[idx]) {
        const can = ctx.canvas;
        this.drawPiecePreview(ctx, this.nextQueue[idx], can.width, can.height);
      }
    });
  }

  // --- SISTEMA DE PARTÍCULAS ---

  createLineClearParticles(row) {
    const y = row * this.blockSize + this.blockSize / 2;
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: ['#00f0ff', '#ffea00', '#d500f9', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  }

  createDropParticles(piece) {
    const gy = this.getGhostY();
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const bx = (piece.x + c) * this.blockSize + this.blockSize / 2;
          const by = (gy + r + 1) * this.blockSize;
          for (let i = 0; i < 4; i++) {
            this.particles.push({
              x: bx + (Math.random() - 0.5) * 16,
              y: by - 2,
              vx: (Math.random() - 0.5) * 4,
              vy: -(Math.random() * 3 + 1),
              color: piece.color,
              size: Math.random() * 3 + 1.5,
              life: 0.8,
              decay: 0.05
            });
          }
        }
      }
    }
  }

  updateAndDrawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  // --- BUCLE PRINCIPAL ---

  animate(time = 0) {
    const delta = time - this.lastTime;
    this.lastTime = time;

    if (!this.isPaused && !this.isGameOver) {
      this.dropCounter += delta;
      if (this.dropCounter > this.dropInterval) {
        this.dropCounter = 0;
        if (this.currentPiece) {
          if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
          } else {
            this.lockPiece();
          }
        }
      }
    }

    this.draw();
    requestAnimationFrame(this.animate);
  }

  // --- EVENTOS DE TECLADO Y BOTONES ---

  initEvents() {
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.isGameOver) {
        if (e.key === 'Enter' || e.key === ' ') this.restart();
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'p' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (this.isPaused) return;

      if (e.key === 'ArrowLeft' || key === 'a') {
        this.movePiece(-1);
      } else if (e.key === 'ArrowRight' || key === 'd') {
        this.movePiece(1);
      } else if (e.key === 'ArrowDown' || key === 's') {
        this.softDrop();
      } else if (e.key === 'ArrowUp' || key === 'w' || key === 'x') {
        this.rotatePiece(1);
      } else if (key === 'z') {
        this.rotatePiece(-1);
      } else if (e.key === ' ') {
        this.hardDrop();
      } else if (key === 'c' || e.key === 'Shift') {
        this.hold();
      }
    });

    // Botones de la UI
    document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
      e.currentTarget.blur();
      const on = this.audio.toggleSound();
      document.getElementById('sound-icon').textContent = on ? '🔊' : '🔇';
    });

    document.getElementById('btn-music-toggle').addEventListener('click', (e) => {
      e.currentTarget.blur();
      const on = this.audio.toggleMusic();
      document.getElementById('music-icon').textContent = on ? '🎵' : '🔇';
    });

    document.getElementById('btn-pause-toggle').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-restart-pause').addEventListener('click', () => this.restart());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restart());
  }

  // Controles Táctiles para Móvil
  initTouchControls() {
    const bindTouch = (id, action, repeat = false) => {
      const el = document.getElementById(id);
      if (!el) return;

      let interval = null;
      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.init();
        el.classList.add('active');
        action();

        if (repeat) {
          clearInterval(interval);
          interval = setInterval(action, 110);
        }
      };

      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });

      // Soporte para clics con ratón también
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    bindTouch('t-btn-left', () => this.movePiece(-1), true);
    bindTouch('t-btn-right', () => this.movePiece(1), true);
    bindTouch('t-btn-down', () => this.softDrop(), true);
    bindTouch('t-btn-rotate-cw', () => this.rotatePiece(1));
    bindTouch('t-btn-rotate-ccw', () => this.rotatePiece(-1));
    bindTouch('t-btn-harddrop', () => this.hardDrop());
    bindTouch('t-btn-hold', () => this.hold());
  }
}

// Iniciar al cargar DOM
window.addEventListener('DOMContentLoaded', () => {
  window.tetrisGame = new TetrisGame();
});

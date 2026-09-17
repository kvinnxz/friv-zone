/**
 * DONKEY KONG ARCADE 1981 - MOTOR DE JUEGO (NIVEL 50m ELEVADORES)
 * Recreación fiel de la pantalla de elevadores mostrada en la captura del usuario.
 * Mario (Jumpman), Donkey Kong, Pauline, elevadores móviles, escaleras,
 * bolas de fuego, sombrilla y cartera coleccionables, HUD retro y controles táctiles.
 */

class DonkeyKongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;   // 448
    this.height = this.canvas.height; // 512

    this.audio = new DonkeyKongAudio();

    // Estado del juego
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.lives = 3;
    this.level = 2; // Nivel 2: Los Elevadores (50m)
    this.bonus = 5000;
    this.bonusTimer = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.stageClear = false;
    this.stageClearTimer = 0;
    this.marioDead = false;
    this.marioDeathTimer = 0;

    // Mario (Jumpman)
    this.mario = {
      x: 60,
      y: 440,
      w: 18,
      h: 22,
      vx: 0,
      vy: 0,
      speed: 2.2,
      jumpPower: -6.8,
      gravity: 0.35,
      grounded: true,
      facing: 'right',
      isClimbing: false,
      currentLadder: null,
      onElevator: null,
      frame: 0,
      walkTimer: 0
    };

    // Donkey Kong en la cima
    this.dk = {
      x: 55,
      y: 110,
      w: 64,
      h: 56,
      state: 'idle', // 'idle', 'chest-beat', 'roar'
      animTimer: 0,
      chestBeatFrame: 0
    };

    // Pauline pidiendo auxilio
    this.pauline = {
      x: 185,
      y: 65,
      w: 22,
      h: 30,
      frame: 0,
      timer: 0,
      cryingHelp: true
    };

    // Coleccionables de Pauline
    this.items = [
      { type: 'umbrella', x: 26, y: 242, w: 20, h: 20, collected: false, points: 300 },
      { type: 'purse', x: 405, y: 172, w: 18, h: 16, collected: false, points: 500 }
    ];

    // Vigas metálicas (Plataformas horizontales estilo viga rosa de Donkey Kong)
    this.girders = [
      // Suelo inferior
      { x: 0, y: 476, w: 448, h: 18 },

      // Nivel 1 (plataformas inferiores izquierda y derecha)
      { x: 16, y: 412, w: 48, h: 16 },
      { x: 240, y: 412, w: 48, h: 16 },
      { x: 340, y: 412, w: 50, h: 16 },

      // Nivel 2
      { x: 16, y: 344, w: 48, h: 16 },
      { x: 112, y: 344, w: 60, h: 16 },
      { x: 300, y: 344, w: 48, h: 16 },
      { x: 388, y: 344, w: 48, h: 16 },

      // Nivel 3
      { x: 16, y: 266, w: 48, h: 16 },
      { x: 112, y: 266, w: 60, h: 16 },
      { x: 250, y: 266, w: 50, h: 16 },
      { x: 350, y: 266, w: 50, h: 16 },

      // Nivel 4 (Viga de Pauline / Viga de Donkey Kong)
      { x: 16, y: 172, w: 180, h: 18 }, // Donkey Kong Platform
      { x: 240, y: 172, w: 56, h: 16 },
      { x: 310, y: 172, w: 70, h: 16 },
      { x: 400, y: 196, w: 40, h: 16 },

      // Cima: Viga elevada de Pauline
      { x: 170, y: 108, w: 85, h: 16 }
    ];

    // Escaleras turquesa (Cyan ladders)
    this.ladders = [
      // Conexiones inferiores
      { x: 32, y: 412, w: 14, h: 64 },
      { x: 360, y: 412, w: 14, h: 64 },

      // Conexiones medias
      { x: 32, y: 344, w: 14, h: 68 },
      { x: 410, y: 344, w: 14, h: 68 },
      { x: 130, y: 266, w: 14, h: 78 },
      { x: 320, y: 266, w: 14, h: 78 },

      // Conexiones superiores
      { x: 32, y: 266, w: 14, h: 78 },
      { x: 370, y: 196, w: 14, h: 70 },
      { x: 418, y: 196, w: 14, h: 70 },
      { x: 130, y: 172, w: 14, h: 94 },

      // Escaleras que llevan a Pauline
      { x: 176, y: 108, w: 14, h: 64 },
      { x: 244, y: 108, w: 14, h: 64 }
    ];

    // Columnas de Elevadores (Montacargas automáticos)
    // Eje 1 (Izquierdo): x = 84, sube hacia arriba
    // Eje 2 (Derecho): x = 208, baja hacia abajo
    this.elevatorShafts = [
      {
        id: 'left-up',
        x: 84,
        topY: 175,
        bottomY: 470,
        speed: -1.2,
        platforms: [
          { y: 220, w: 28, h: 8 },
          { y: 320, w: 28, h: 8 },
          { y: 420, w: 28, h: 8 }
        ]
      },
      {
        id: 'right-down',
        x: 208,
        topY: 175,
        bottomY: 470,
        speed: 1.2,
        platforms: [
          { y: 200, w: 28, h: 8 },
          { y: 300, w: 28, h: 8 },
          { y: 400, w: 28, h: 8 }
        ]
      }
    ];

    // Bolas de Fuego (Firefoxes)
    this.fireballs = [
      { x: 340, y: 458, w: 16, h: 16, vx: 1.2, frame: 0, timer: 0, girderY: 476 },
      { x: 130, y: 328, w: 16, h: 16, vx: -1.0, frame: 0, timer: 0, girderY: 344 },
      { x: 330, y: 250, w: 16, h: 16, vx: 1.1, frame: 0, timer: 0, girderY: 266 }
    ];

    // Resortes saltarines de Donkey Kong (Springs)
    this.springs = [];
    this.springSpawnTimer = 0;

    // Partículas y texto flotante de puntos
    this.scorePopups = [];

    // Inputs
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false
    };

    // Elementos de la interfaz
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalBestEl = document.getElementById('final-best');

    this.initEvents();
    this.initTouchControls();

    // Bucle
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('dk_arcade_high_score')) || 15000;
    } catch (e) {
      return 15000;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem('dk_arcade_high_score', this.highScore.toString());
    } catch (e) {}
  }

  restartGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 2;
    this.isGameOver = false;
    this.stageClear = false;
    this.marioDead = false;
    this.gameoverOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.resetStage();
  }

  resetStage() {
    this.bonus = 5000;
    this.bonusTimer = 0;
    this.stageClear = false;
    this.marioDead = false;

    this.mario.x = 60;
    this.mario.y = 440;
    this.mario.vx = 0;
    this.mario.vy = 0;
    this.mario.grounded = true;
    this.mario.isClimbing = false;
    this.mario.currentLadder = null;
    this.mario.onElevator = null;
    this.mario.facing = 'right';

    this.items.forEach(it => it.collected = false);
    this.springs = [];
  }

  // --- LÓGICA DE ACTUALIZACIÓN ---

  update(dt) {
    if (this.isPaused || this.isGameOver) return;

    // Bonus timer descendente arcade
    this.bonusTimer += dt;
    if (this.bonusTimer > 1000) {
      this.bonusTimer = 0;
      if (this.bonus > 0) this.bonus = Math.max(0, this.bonus - 100);
      if (this.bonus === 0 && !this.marioDead) {
        this.killMario();
      }
    }

    // Animación de Donkey Kong
    this.updateDK(dt);

    // Animación de Pauline
    this.updatePauline(dt);

    // Movimiento de Elevadores
    this.updateElevators();

    // Movimiento de Bolas de Fuego
    this.updateFireballs(dt);

    // Lanzamiento y física de Resortes (Springs)
    this.updateSprings();

    // Actualización de Mario
    if (!this.marioDead && !this.stageClear) {
      this.updateMario();
      this.checkCollisions();
    } else if (this.marioDead) {
      this.marioDeathTimer += dt;
      if (this.marioDeathTimer > 2000) {
        this.marioDeathTimer = 0;
        this.lives--;
        if (this.lives <= 0) {
          this.triggerGameOver();
        } else {
          this.resetStage();
        }
      }
    } else if (this.stageClear) {
      this.stageClearTimer += dt;
      if (this.stageClearTimer > 3000) {
        this.stageClearTimer = 0;
        this.score += this.bonus;
        this.level++;
        this.resetStage();
      }
    }

    // Actualizar textos flotantes de puntuación
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const p = this.scorePopups[i];
      p.y -= 0.6;
      p.life -= 0.02;
      if (p.life <= 0) this.scorePopups.splice(i, 1);
    }
  }

  updateDK(dt) {
    this.dk.animTimer += dt;
    if (this.dk.animTimer > 400) {
      this.dk.animTimer = 0;
      this.dk.chestBeatFrame = (this.dk.chestBeatFrame + 1) % 4;
      if (this.dk.chestBeatFrame === 1 || this.dk.chestBeatFrame === 3) {
        this.audio.playDKRoar();
      }
    }
  }

  updatePauline(dt) {
    this.pauline.timer += dt;
    if (this.pauline.timer > 300) {
      this.pauline.timer = 0;
      this.pauline.frame = (this.pauline.frame + 1) % 2;
    }
  }

  updateElevators() {
    this.elevatorShafts.forEach(shaft => {
      shaft.platforms.forEach(plat => {
        plat.y += shaft.speed;

        // Bucle continuo: si sale por arriba, reaparece abajo y viceversa
        if (shaft.speed < 0 && plat.y < shaft.topY) {
          plat.y = shaft.bottomY;
        } else if (shaft.speed > 0 && plat.y > shaft.bottomY) {
          plat.y = shaft.topY;
        }
      });
    });
  }

  updateFireballs(dt) {
    this.fireballs.forEach(fb => {
      fb.timer += dt;
      if (fb.timer > 150) {
        fb.timer = 0;
        fb.frame = (fb.frame + 1) % 2;
      }

      fb.x += fb.vx;

      // Rebotar en los bordes de la pantalla o límites
      if (fb.x < 16 || fb.x > 416) {
        fb.vx *= -1;
      }
    });
  }

  updateSprings() {
    this.springSpawnTimer++;
    if (this.springSpawnTimer > 280) {
      this.springSpawnTimer = 0;
      // Generar resorte desde Donkey Kong
      this.springs.push({
        x: 180,
        y: 165,
        w: 16,
        h: 16,
        vx: 2.2,
        vy: 0,
        bounceY: 165
      });
    }

    for (let i = this.springs.length - 1; i >= 0; i--) {
      const sp = this.springs[i];
      sp.x += sp.vx;
      sp.vy += 0.35;
      sp.y += sp.vy;

      // Rebotar en la viga superior
      if (sp.y >= sp.bounceY) {
        sp.y = sp.bounceY;
        sp.vy = -5.5; // Salto del resorte
      }

      // Si sobrepasa el borde derecho, cae al vacío
      if (sp.x > 380) {
        sp.bounceY = 550; // Dejarlo caer
      }

      // Eliminar al salir de pantalla
      if (sp.y > 520) {
        this.springs.splice(i, 1);
      }
    }
  }

  updateMario() {
    const m = this.mario;

    // Movimiento en escalera
    if (m.isClimbing) {
      m.vx = 0;
      m.vy = 0;
      m.onElevator = null;

      if (this.keys.up) {
        m.vy = -1.8;
        this.audio.playClimb();
      } else if (this.keys.down) {
        m.vy = 1.8;
        this.audio.playClimb();
      }

      m.y += m.vy;

      // Salir de la escalera arriba o abajo
      const lad = m.currentLadder;
      if (lad) {
        m.x = lad.x + (lad.w - m.w) / 2; // Centrar
        if (m.y + m.h < lad.y || m.y > lad.y + lad.h) {
          m.isClimbing = false;
          m.currentLadder = null;
        }
      }
      return;
    }

    // Comprobar si puede empezar a escalar escalera
    if (this.keys.up || this.keys.down) {
      const lad = this.findNearbyLadder();
      if (lad) {
        m.isClimbing = true;
        m.currentLadder = lad;
        m.grounded = false;
        m.onElevator = null;
        m.x = lad.x + (lad.w - m.w) / 2;
        return;
      }
    }

    // Movimiento horizontal en el suelo o aire
    m.vx = 0;
    if (this.keys.left) {
      m.vx = -m.speed;
      m.facing = 'left';
    } else if (this.keys.right) {
      m.vx = m.speed;
      m.facing = 'right';
    }

    m.x += m.vx;

    // Límites de pantalla
    m.x = Math.max(10, Math.min(this.width - m.w - 10, m.x));

    // Salto
    if (this.keys.jump && m.grounded && !m.isClimbing) {
      m.vy = m.jumpPower;
      m.grounded = false;
      m.onElevator = null;
      this.audio.playJump();
    }

    // Gravedad
    m.vy += m.gravity;
    m.y += m.vy;

    // Chequeo de anclaje en elevadores móviles
    let landedOnElevator = false;
    this.elevatorShafts.forEach(shaft => {
      shaft.platforms.forEach(plat => {
        const platX = shaft.x;
        const platY = plat.y;
        const platW = plat.w;
        const platH = plat.h;

        // Comprobar si Mario aterriza sobre la plataforma del elevador
        if (m.vy >= 0 &&
            m.x + m.w > platX && m.x < platX + platW &&
            m.y + m.h >= platY && m.y + m.h <= platY + platH + 8) {
          m.y = platY - m.h;
          m.vy = 0;
          m.grounded = true;
          m.onElevator = { shaft, plat };
          landedOnElevator = true;

          // Mover a Mario junto con el elevador
          m.y += shaft.speed;

          // Si el elevador llega al límite superior o inferior absoluto, Mario es aplastado
          if (plat.y <= shaft.topY + 4 || plat.y >= shaft.bottomY - 4) {
            this.killMario();
          }
        }
      });
    });

    if (!landedOnElevator) {
      m.onElevator = null;

      // Colisión con vigas (Girders)
      m.grounded = false;
      for (const g of this.girders) {
        if (m.vy >= 0 &&
            m.x + m.w > g.x && m.x < g.x + g.w &&
            m.y + m.h >= g.y && m.y + m.h <= g.y + g.h + 6) {
          m.y = g.y - m.h;
          m.vy = 0;
          m.grounded = true;
          break;
        }
      }
    }

    // Caída fatal al abismo inferior
    if (m.y > 490) {
      this.killMario();
    }

    // Audio de pasos
    if (m.grounded && m.vx !== 0) {
      m.walkTimer++;
      if (m.walkTimer > 12) {
        m.walkTimer = 0;
        m.frame = (m.frame + 1) % 2;
        this.audio.playStep();
      }
    }
  }

  findNearbyLadder() {
    const m = this.mario;
    for (const lad of this.ladders) {
      if (m.x + m.w > lad.x && m.x < lad.x + lad.w &&
          m.y + m.h >= lad.y && m.y <= lad.y + lad.h) {
        return lad;
      }
    }
    return null;
  }

  checkCollisions() {
    const m = this.mario;

    // 1. Recolección de Items de Pauline (Sombrilla y Cartera)
    this.items.forEach(it => {
      if (!it.collected &&
          m.x + m.w > it.x && m.x < it.x + it.w &&
          m.y + m.h > it.y && m.y < it.y + it.h) {
        it.collected = true;
        this.score += it.points;
        this.audio.playItemCollect();
        this.scorePopups.push({ text: `+${it.points}`, x: it.x, y: it.y - 10, life: 1.0 });
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.saveHighScore();
        }
      }
    });

    // 2. Colisión con Bolas de Fuego
    for (const fb of this.fireballs) {
      const dist = Math.hypot((m.x + m.w / 2) - (fb.x + fb.w / 2), (m.y + m.h / 2) - (fb.y + fb.h / 2));
      if (dist < 14) {
        this.killMario();
        return;
      }
    }

    // 3. Colisión con Resortes (Springs)
    for (const sp of this.springs) {
      const dist = Math.hypot((m.x + m.w / 2) - (sp.x + sp.w / 2), (m.y + m.h / 2) - (sp.y + sp.h / 2));
      if (dist < 14) {
        this.killMario();
        return;
      }
    }

    // 4. Victoria al alcanzar la viga de Pauline
    if (m.x + m.w > this.pauline.x - 10 && m.x < this.pauline.x + this.pauline.w + 10 &&
        m.y <= this.pauline.y + this.pauline.h + 4) {
      this.triggerStageClear();
    }
  }

  killMario() {
    if (this.marioDead || this.stageClear) return;
    this.marioDead = true;
    this.marioDeathTimer = 0;
    this.audio.playDeath();
  }

  triggerStageClear() {
    if (this.stageClear) return;
    this.stageClear = true;
    this.stageClearTimer = 0;
    this.audio.playVictory();
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.finalScoreEl.textContent = this.score.toString().padStart(6, '0');
    this.finalBestEl.textContent = this.highScore.toString().padStart(6, '0');
    this.gameoverOverlay.classList.remove('hidden');
  }

  togglePause(override) {
    if (this.isGameOver) return;
    this.isPaused = override !== undefined ? override : !this.isPaused;
    this.pauseOverlay.classList.toggle('hidden', !this.isPaused);
  }

  // --- RENDERIZADO ARCADE (Canvas 448x512) ---

  draw() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 1. HUD Superior Arcade
    this.drawHUD();

    // 2. Vigas Metálicas (Pink Girders)
    this.drawGirders();

    // 3. Escaleras (Cyan Ladders)
    this.drawLadders();

    // 4. Columnas y Plataformas de Elevadores
    this.drawElevators();

    // 5. Coleccionables (Sombrilla y Bolso)
    this.drawItems();

    // 6. Donkey Kong
    this.drawDonkeyKong();

    // 7. Pauline
    this.drawPauline();

    // 8. Bolas de Fuego y Resortes
    this.drawHazards();

    // 9. Jumpman / Mario
    this.drawMario();

    // 10. Textos emergentes de puntos
    this.drawScorePopups();
  }

  drawHUD() {
    const ctx = this.ctx;
    ctx.font = '10px "Press Start 2P", monospace';

    // 1UP & Puntuación
    ctx.fillStyle = '#ff1e27';
    ctx.fillText('1UP', 40, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.score.toString().padStart(6, '0'), 25, 36);

    // Vidas de Mario en iconos miniatura
    for (let i = 0; i < this.lives; i++) {
      this.drawMiniMarioIcon(ctx, 25 + i * 16, 42);
    }

    // HIGH SCORE
    ctx.fillStyle = '#ff1e27';
    ctx.fillText('HIGH SCORE', 160, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.highScore.toString().padStart(6, '0'), 185, 36);

    // Nivel L=02
    ctx.fillStyle = '#0077ff';
    ctx.fillText(`L=${this.level.toString().padStart(2, '0')}`, 340, 60);

    // Caja de BONUS
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(340, 72, 85, 42);
    ctx.fillStyle = '#f52a7b';
    ctx.fillText('BONUS', 350, 88);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.bonus.toString().padStart(4, '0'), 360, 104);
  }

  drawMiniMarioIcon(ctx, x, y) {
    ctx.fillStyle = '#ff1e27';
    ctx.fillRect(x + 2, y, 6, 4); // gorra
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x + 2, y + 4, 6, 4); // cara
    ctx.fillStyle = '#0077ff';
    ctx.fillRect(x + 1, y + 8, 8, 5); // overol
  }

  drawGirders() {
    const ctx = this.ctx;
    this.girders.forEach(g => {
      // Color principal de viga rosa arcade de Donkey Kong
      ctx.fillStyle = '#f52a7b';
      ctx.fillRect(g.x, g.y, g.w, 4);
      ctx.fillRect(g.x, g.y + g.h - 4, g.w, 4);

      // Dibujar celosías / triangulaciones
      const step = 14;
      ctx.strokeStyle = '#f52a7b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = g.x; x < g.x + g.w; x += step) {
        ctx.moveTo(x, g.y + 2);
        ctx.lineTo(x + step / 2, g.y + g.h - 2);
        ctx.lineTo(x + step, g.y + 2);
      }
      ctx.stroke();
    });
  }

  drawLadders() {
    const ctx = this.ctx;
    this.ladders.forEach(lad => {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;

      // Largueros laterales
      ctx.beginPath();
      ctx.moveTo(lad.x, lad.y);
      ctx.lineTo(lad.x, lad.y + lad.h);
      ctx.moveTo(lad.x + lad.w, lad.y);
      ctx.lineTo(lad.x + lad.w, lad.y + lad.h);
      ctx.stroke();

      // Peldaños
      const rungs = Math.floor(lad.h / 8);
      ctx.beginPath();
      for (let i = 1; i < rungs; i++) {
        const ry = lad.y + i * 8;
        ctx.moveTo(lad.x, ry);
        ctx.lineTo(lad.x + lad.w, ry);
      }
      ctx.stroke();
    });
  }

  drawElevators() {
    const ctx = this.ctx;
    this.elevatorShafts.forEach(shaft => {
      // Eje / Cordel guía vertical
      ctx.strokeStyle = '#f52a7b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(shaft.x + 14, shaft.topY);
      ctx.lineTo(shaft.x + 14, shaft.bottomY);
      ctx.stroke();

      // Polea superior e inferior
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(shaft.x + 6, shaft.topY - 8, 16, 8);
      ctx.fillRect(shaft.x + 6, shaft.bottomY, 16, 8);

      // Plataformas móviles del elevador
      shaft.platforms.forEach(plat => {
        ctx.fillStyle = '#f52a7b';
        ctx.fillRect(shaft.x, plat.y, plat.w, plat.h);

        // Borde superior brillante blanco/amarillo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(shaft.x + 2, plat.y, plat.w - 4, 2);
      });
    });
  }

  drawItems() {
    const ctx = this.ctx;
    this.items.forEach(it => {
      if (it.collected) return;
      if (it.type === 'umbrella') {
        // Sombrilla rosa de Pauline
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(it.x + 10, it.y + 8, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#f52a7b';
        ctx.beginPath();
        ctx.arc(it.x + 10, it.y + 8, 6, Math.PI, 0);
        ctx.fill();
        // Mango
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(it.x + 10, it.y + 8);
        ctx.lineTo(it.x + 10, it.y + 16);
        ctx.stroke();
      } else if (it.type === 'purse') {
        // Cartera rosa de Pauline
        ctx.fillStyle = '#f52a7b';
        ctx.fillRect(it.x + 2, it.y + 4, 14, 10);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(it.x + 9, it.y + 4, 5, Math.PI, 0);
        ctx.stroke();
      }
    });
  }

  drawDonkeyKong() {
    const ctx = this.ctx;
    const dk = this.dk;

    // Cuerpo de Donkey Kong (Pelaje marrón y pecho rojo brillante)
    ctx.fillStyle = '#7a3818';
    ctx.fillRect(dk.x + 10, dk.y + 12, 44, 38);

    // Pecho rojo/anaranjado
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(dk.x + 18, dk.y + 20, 28, 24);

    // Cabeza
    ctx.fillStyle = '#7a3818';
    ctx.fillRect(dk.x + 18, dk.y + 2, 28, 18);

    // Cara y ojos
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(dk.x + 22, dk.y + 8, 20, 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(dk.x + 25, dk.y + 10, 3, 3);
    ctx.fillRect(dk.x + 36, dk.y + 10, 3, 3);

    // Brazos animados golpeándose el pecho
    ctx.fillStyle = '#7a3818';
    if (dk.chestBeatFrame === 0 || dk.chestBeatFrame === 2) {
      // Brazos a los lados
      ctx.fillRect(dk.x, dk.y + 18, 12, 24);
      ctx.fillRect(dk.x + 52, dk.y + 18, 12, 24);
    } else {
      // Brazos sobre el pecho (golpe de gorila)
      ctx.fillRect(dk.x + 8, dk.y + 24, 18, 14);
      ctx.fillRect(dk.x + 38, dk.y + 24, 18, 14);
    }

    // Piernas
    ctx.fillStyle = '#7a3818';
    ctx.fillRect(dk.x + 12, dk.y + 48, 14, 8);
    ctx.fillRect(dk.x + 38, dk.y + 48, 14, 8);
  }

  drawPauline() {
    const ctx = this.ctx;
    const p = this.pauline;

    // Cabello rubio / castaño
    ctx.fillStyle = '#d48817';
    ctx.fillRect(p.x + 4, p.y, 14, 8);

    // Cara
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(p.x + 6, p.y + 6, 10, 6);

    // Vestido rosa
    ctx.fillStyle = '#f52a7b';
    ctx.fillRect(p.x + 3, p.y + 12, 16, 14);

    // Brazos animados pidiendo auxilio
    ctx.fillStyle = '#ffcc99';
    if (p.frame === 0) {
      ctx.fillRect(p.x - 2, p.y + 8, 5, 8);
      ctx.fillRect(p.x + 19, p.y + 12, 5, 8);
    } else {
      ctx.fillRect(p.x - 2, p.y + 12, 5, 8);
      ctx.fillRect(p.x + 19, p.y + 8, 5, 8);
    }

    // Bocadillo de "HELP!"
    if (p.cryingHelp && !this.stageClear) {
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HELP!', p.x - 14, p.y - 6);
    }

    // Corazón si se completa el nivel
    if (this.stageClear) {
      ctx.fillStyle = '#ff1e27';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('♥', p.x + 6, p.y - 8);
    }
  }

  drawHazards() {
    const ctx = this.ctx;

    // Bolas de fuego
    this.fireballs.forEach(fb => {
      ctx.fillStyle = fb.frame === 0 ? '#ffea00' : '#ff3b30';
      ctx.beginPath();
      ctx.arc(fb.x + fb.w / 2, fb.y + fb.h / 2, fb.w / 2, 0, Math.PI * 2);
      ctx.fill();

      // Centro blanco incandescente
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fb.x + fb.w / 2, fb.y + fb.h / 2, fb.w / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Resortes
    this.springs.forEach(sp => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x + sp.w / 2, sp.y + sp.h / 2, sp.w / 2, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  drawMario() {
    const ctx = this.ctx;
    const m = this.mario;

    if (this.marioDead) {
      // Sprite de Mario derrotado (acostado)
      ctx.fillStyle = '#0077ff';
      ctx.fillRect(m.x, m.y + 12, m.w + 4, 8);
      ctx.fillStyle = '#ff1e27';
      ctx.fillRect(m.x + 2, m.y + 6, 8, 6);
      return;
    }

    // Gorra roja
    ctx.fillStyle = '#ff1e27';
    ctx.fillRect(m.facing === 'right' ? m.x + 4 : m.x + 2, m.y, 12, 4);

    // Cara
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(m.x + 4, m.y + 4, 10, 6);

    // Ojo y bigote
    ctx.fillStyle = '#000000';
    if (m.facing === 'right') {
      ctx.fillRect(m.x + 11, m.y + 5, 2, 2);
      ctx.fillRect(m.x + 10, m.y + 8, 4, 2);
    } else {
      ctx.fillRect(m.x + 5, m.y + 5, 2, 2);
      ctx.fillRect(m.x + 4, m.y + 8, 4, 2);
    }

    // Overol azul y camisa roja
    ctx.fillStyle = '#0077ff';
    ctx.fillRect(m.x + 3, m.y + 10, 12, 8);
    ctx.fillStyle = '#ff1e27';
    ctx.fillRect(m.facing === 'right' ? m.x + 1 : m.x + 13, m.y + 10, 4, 6);

    // Piernas animadas
    ctx.fillStyle = '#0077ff';
    if (!m.grounded) {
      // Salto en el aire
      ctx.fillRect(m.x + 1, m.y + 18, 5, 4);
      ctx.fillRect(m.x + 12, m.y + 16, 5, 4);
    } else if (m.vx !== 0 && m.frame === 1) {
      // Paso 1
      ctx.fillRect(m.x + 1, m.y + 18, 6, 4);
      ctx.fillRect(m.x + 11, m.y + 18, 6, 4);
    } else {
      // Parado / Paso 2
      ctx.fillRect(m.x + 3, m.y + 18, 5, 4);
      ctx.fillRect(m.x + 10, m.y + 18, 5, 4);
    }
  }

  drawScorePopups() {
    const ctx = this.ctx;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    this.scorePopups.forEach(p => {
      ctx.fillText(p.text, p.x, p.y);
    });
  }

  // --- BUCLE PRINCIPAL ---

  loop(time = 0) {
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  }

  // --- ENLACE DE EVENTOS ---

  initEvents() {
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();

      if (key === 'p' || e.key === 'Escape') {
        this.togglePause();
        return;
      }

      if (this.isPaused || this.isGameOver) return;

      if (e.key === 'ArrowLeft' || key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || key === 'd') this.keys.right = true;
      if (e.key === 'ArrowUp' || key === 'w') this.keys.up = true;
      if (e.key === 'ArrowDown' || key === 's') this.keys.down = true;
      if (e.key === ' ' || key === 'z') this.keys.jump = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || key === 'd') this.keys.right = false;
      if (e.key === 'ArrowUp' || key === 'w') this.keys.up = false;
      if (e.key === 'ArrowDown' || key === 's') this.keys.down = false;
      if (e.key === ' ' || key === 'z') this.keys.jump = false;
    });

    // Botones de UI
    document.getElementById('btn-toggle-sound').addEventListener('click', (e) => {
      e.currentTarget.blur();
      const on = this.audio.toggleSound();
      e.currentTarget.textContent = on ? '🔊 SONIDO' : '🔇 MUTE';
    });

    document.getElementById('btn-toggle-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-restart-pause').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restartGame());
  }

  initTouchControls() {
    const bindBtn = (id, keyName) => {
      const el = document.getElementById(id);
      if (!el) return;

      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.init();
        el.classList.add('pressed');
        this.keys[keyName] = true;
      };

      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('pressed');
        this.keys[keyName] = false;
      };

      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    bindBtn('vbtn-left', 'left');
    bindBtn('vbtn-right', 'right');
    bindBtn('vbtn-up', 'up');
    bindBtn('vbtn-down', 'down');
    bindBtn('vbtn-jump', 'jump');
  }
}

// Iniciar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.dkGame = new DonkeyKongGame();
});

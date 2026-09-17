/**
 * NEON SURGE: CHRONO SURVIVOR
 * High-performance Arcade Game Engine with Canvas 2D, Particle Physics,
 * Dynamic Combo Multipliers, and Bullet-Time Mechanics.
 */

(function () {
  'use strict';

  // --- CANVAS & CONTEXT SETUP ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- DOM UI REFERENCES ---
  const ui = {
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    crtOverlay: document.getElementById('crtOverlay'),
    shieldFill: document.getElementById('shieldFill'),
    shieldVal: document.getElementById('shieldVal'),
    chronoFill: document.getElementById('chronoFill'),
    chronoVal: document.getElementById('chronoVal'),
    overdriveFill: document.getElementById('overdriveFill'),
    overdriveVal: document.getElementById('overdriveVal'),
    currentScore: document.getElementById('currentScore'),
    multiplierBadge: document.getElementById('multiplierBadge'),
    empStatusText: document.getElementById('empStatusText'),
    startBestScore: document.getElementById('startBestScore'),
    finalScore: document.getElementById('finalScore'),
    finalCombo: document.getElementById('finalCombo'),
    recordScore: document.getElementById('recordScore'),
    newRecordAlert: document.getElementById('newRecordAlert'),
    btnStart: document.getElementById('btnStartGame'),
    btnRestart: document.getElementById('btnRestartGame'),
    btnResume: document.getElementById('btnResumeGame'),
    btnAbandon: document.getElementById('btnAbandonGame'),
    btnAudio: document.getElementById('btnAudio'),
    btnScanlines: document.getElementById('btnScanlines'),
    btnPause: document.getElementById('btnPause')
  };

  // --- GAME STATE ---
  const state = {
    mode: 'START', // START, PLAYING, PAUSED, GAMEOVER
    score: 0,
    highScore: parseInt(localStorage.getItem('neon_surge_high_score') || '0', 10),
    combo: 1.0,
    maxCombo: 1.0,
    comboTimer: 0,
    timeScale: 1.0,
    targetTimeScale: 1.0,
    screenShake: 0,
    lastTime: 0,
    wave: 1,
    waveTimer: 0,
    bossActive: false
  };

  ui.startBestScore.textContent = state.highScore.toLocaleString();

  // --- INPUT CONTROLLER ---
  const input = {
    keys: {},
    mouse: { x: width / 2, y: height / 2, isDown: false, rightDown: false },
    touchActive: false
  };

  window.addEventListener('keydown', (e) => {
    input.keys[e.code] = true;
    if (e.code === 'KeyE' && state.mode === 'PLAYING') {
      player.triggerEMP();
    }
    if ((e.code === 'KeyP' || e.code === 'Escape') && (state.mode === 'PLAYING' || state.mode === 'PAUSED')) {
      togglePause();
    }
    if (e.code === 'Space' && state.mode === 'PLAYING') {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    input.keys[e.code] = false;
  });

  window.addEventListener('mousemove', (e) => {
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) input.mouse.isDown = true;
    if (e.button === 2) {
      e.preventDefault();
      input.mouse.rightDown = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.mouse.isDown = false;
    if (e.button === 2) {
      e.preventDefault();
      input.mouse.rightDown = false;
    }
  });

  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // Touch Support
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      input.mouse.x = e.touches[0].clientX;
      input.mouse.y = e.touches[0].clientY;
      input.mouse.isDown = true;
      input.touchActive = true;
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      input.mouse.x = e.touches[0].clientX;
      input.mouse.y = e.touches[0].clientY;
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    input.mouse.isDown = false;
  });

  // --- ENTITY COLLECTIONS ---
  let player = null;
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let particles = [];
  let powerups = [];
  let shockwaves = [];
  let floatingTexts = [];
  let backgroundStars = [];

  // --- BACKGROUND GRID & STARS INITIALIZATION ---
  function initBackground() {
    backgroundStars = [];
    for (let i = 0; i < 90; i++) {
      backgroundStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#00f3ff' : (Math.random() > 0.5 ? '#ff0077' : '#ffffff'),
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }
  initBackground();

  // --- PLAYER CLASS ---
  class Player {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = width / 2;
      this.y = height / 2;
      this.vx = 0;
      this.vy = 0;
      this.angle = -Math.PI / 2;
      this.radius = 18;
      this.maxSpeed = 380;
      this.acceleration = 1200;
      this.friction = 0.88;

      this.shield = 100;
      this.maxShield = 100;
      this.chrono = 100;
      this.maxChrono = 100;
      this.isChronoActive = false;

      this.overdrive = 0;
      this.maxOverdrive = 100;
      this.isOverdrive = false;
      this.overdriveDuration = 0;

      this.empCooldown = 0;
      this.maxEmpCooldown = 15; // 15 seconds

      this.fireTimer = 0;
      this.fireRate = 0.11; // Seconds between shots

      this.invulnerableTimer = 0;
      this.ghostTrail = [];
    }

    update(dt) {
      // 1. Bullet-Time (Chrono Shift) Logic
      const wantsChrono = input.keys['Space'] || input.mouse.rightDown;
      if (wantsChrono && this.chrono > 5) {
        if (!this.isChronoActive) {
          this.isChronoActive = true;
          window.soundEngine.playChronoStart();
        }
        this.chrono = Math.max(0, this.chrono - 35 * dt);
        state.targetTimeScale = 0.22;
      } else {
        if (this.isChronoActive) {
          this.isChronoActive = false;
          window.soundEngine.playChronoEnd();
        }
        this.chrono = Math.min(this.maxChrono, this.chrono + 14 * dt);
        state.targetTimeScale = 1.0;
      }

      // 2. Overdrive Status
      if (this.isOverdrive) {
        this.overdriveDuration -= dt;
        this.overdrive = (this.overdriveDuration / 8.0) * 100;
        if (this.overdriveDuration <= 0) {
          this.isOverdrive = false;
          this.overdrive = 0;
        }
      }

      // 3. EMP Cooldown
      if (this.empCooldown > 0) {
        this.empCooldown = Math.max(0, this.empCooldown - dt);
      }

      // 4. Movement Input (WASD or Arrow Keys)
      let moveX = 0;
      let moveY = 0;
      if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

      // When bullet-time is active, player retains agility
      const playerSpeedMultiplier = this.isChronoActive ? 1.6 : 1.0;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      // Accelerate
      this.vx += moveX * this.acceleration * playerSpeedMultiplier * dt;
      this.vy += moveY * this.acceleration * playerSpeedMultiplier * dt;

      // Friction & Clamping
      this.vx *= this.friction;
      this.vy *= this.friction;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > this.maxSpeed * playerSpeedMultiplier) {
        this.vx = (this.vx / speed) * this.maxSpeed * playerSpeedMultiplier;
        this.vy = (this.vy / speed) * this.maxSpeed * playerSpeedMultiplier;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Screen Boundary Collision
      const margin = 24;
      if (this.x < margin) { this.x = margin; this.vx = 0; }
      if (this.x > width - margin) { this.x = width - margin; this.vx = 0; }
      if (this.y < margin) { this.y = margin; this.vy = 0; }
      if (this.y > height - margin) { this.y = height - margin; this.vy = 0; }

      // Aiming Angle (Towards Mouse Cursor)
      this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

      // Invulnerability Countdown
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= dt;
      }

      // 5. Thruster Particles
      if (Math.hypot(this.vx, this.vy) > 15 || Math.random() < 0.3) {
        const backAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const pSpeed = Math.random() * 80 + 40;
        particles.push(new Particle(
          this.x - Math.cos(this.angle) * 16,
          this.y - Math.sin(this.angle) * 16,
          Math.cos(backAngle) * pSpeed,
          Math.sin(backAngle) * pSpeed,
          this.isOverdrive ? '#ff0077' : (this.isChronoActive ? '#a82bff' : '#00f3ff'),
          Math.random() * 3 + 2,
          0.3
        ));
      }

      // Ghost trail during Chrono Shift or Overdrive
      if (this.isChronoActive || this.isOverdrive) {
        if (Math.random() < 0.4) {
          this.ghostTrail.push({
            x: this.x,
            y: this.y,
            angle: this.angle,
            alpha: 0.6,
            color: this.isOverdrive ? '#ff0077' : '#a82bff'
          });
        }
      }

      // Update Ghost Trails
      for (let i = this.ghostTrail.length - 1; i >= 0; i--) {
        this.ghostTrail[i].alpha -= dt * 2.5;
        if (this.ghostTrail[i].alpha <= 0) {
          this.ghostTrail.splice(i, 1);
        }
      }

      // 6. Weapon Firing (Left Mouse Click or Auto-fire if holding)
      this.fireTimer -= dt;
      const currentFireRate = this.isOverdrive ? this.fireRate * 0.5 : this.fireRate;

      if ((input.mouse.isDown || input.touchActive) && this.fireTimer <= 0) {
        this.shoot();
        this.fireTimer = currentFireRate;
      }
    }

    shoot() {
      const tipX = this.x + Math.cos(this.angle) * 22;
      const tipY = this.y + Math.sin(this.angle) * 22;

      if (this.isOverdrive) {
        // Triple Spread Plasma
        bullets.push(new Bullet(tipX, tipY, this.angle, 800, true));
        bullets.push(new Bullet(tipX, tipY, this.angle - 0.18, 760, true));
        bullets.push(new Bullet(tipX, tipY, this.angle + 0.18, 760, true));
        window.soundEngine.playTriShoot();
        addScreenShake(2.5);
      } else {
        // Dual Wing Plasma
        const wingDist = 12;
        const leftWingX = this.x + Math.cos(this.angle + Math.PI / 2) * wingDist;
        const leftWingY = this.y + Math.sin(this.angle + Math.PI / 2) * wingDist;
        const rightWingX = this.x + Math.cos(this.angle - Math.PI / 2) * wingDist;
        const rightWingY = this.y + Math.sin(this.angle - Math.PI / 2) * wingDist;

        bullets.push(new Bullet(leftWingX, leftWingY, this.angle, 750, false));
        bullets.push(new Bullet(rightWingX, rightWingY, this.angle, 750, false));
        window.soundEngine.playShoot();
        addScreenShake(1.2);
      }
    }

    triggerEMP() {
      if (this.empCooldown > 0) return;
      this.empCooldown = this.maxEmpCooldown;
      window.soundEngine.playEmp();
      addScreenShake(15);

      // Create visual shockwave
      shockwaves.push(new Shockwave(this.x, this.y, '#ffe600', 800, 4));

      // Destroy all enemy bullets
      for (const eb of enemyBullets) {
        createExplosion(eb.x, eb.y, '#ffe600', 6, 0.4);
      }
      enemyBullets = [];

      // Heavily damage and knockback enemies
      for (const enemy of enemies) {
        enemy.takeDamage(120);
        const knockAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        enemy.x += Math.cos(knockAngle) * 60;
        enemy.y += Math.sin(knockAngle) * 60;
      }

      floatingTexts.push(new FloatingText(this.x, this.y - 30, '¡EMP DETONADO!', '#ffe600', 22));
    }

    takeDamage(amount) {
      if (this.invulnerableTimer > 0) return;

      this.shield -= amount;
      this.invulnerableTimer = 0.8;
      addScreenShake(12);
      window.soundEngine.playHit();

      // Sparks
      createExplosion(this.x, this.y, '#00f3ff', 18, 0.7);

      // Reset Combo Multiplier on damage
      if (state.combo > 1.0) {
        state.combo = 1.0;
        updateComboUI();
      }

      if (this.shield <= 0) {
        this.shield = 0;
        gameOver();
      }
    }

    addOverdrive(amount) {
      if (this.isOverdrive) return;
      this.overdrive = Math.min(this.maxOverdrive, this.overdrive + amount);
      if (this.overdrive >= this.maxOverdrive) {
        this.activateOverdrive();
      }
    }

    activateOverdrive() {
      this.isOverdrive = true;
      this.overdriveDuration = 8.0;
      this.overdrive = 100;
      window.soundEngine.playLaserBeam();
      shockwaves.push(new Shockwave(this.x, this.y, '#ff0077', 400, 3));
      floatingTexts.push(new FloatingText(this.x, this.y - 40, '★ MODO OVERDRIVE ★', '#ff0077', 26));
      addScreenShake(8);
    }

    draw(ctx) {
      // Draw ghost trails
      for (const g of this.ghostTrail) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);
        ctx.strokeStyle = g.color;
        ctx.globalAlpha = g.alpha * 0.4;
        ctx.lineWidth = 2;
        this.drawShipGeometry(ctx);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Flashing when invulnerable
      if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Energy Shield Bubble
      if (this.shield > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = this.isOverdrive ? 'rgba(255, 0, 119, 0.6)' : 'rgba(0, 243, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.shadowColor = this.isOverdrive ? '#ff0077' : '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Main Ship
      this.drawShipGeometry(ctx);

      ctx.restore();
    }

    drawShipGeometry(ctx) {
      const mainColor = this.isOverdrive ? '#ff0077' : (this.isChronoActive ? '#a82bff' : '#00f3ff');
      
      // Neon Glow
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 14;

      // Hull
      ctx.beginPath();
      ctx.moveTo(20, 0); // Tip
      ctx.lineTo(-14, -14); // Left wing
      ctx.lineTo(-8, 0); // Center rear
      ctx.lineTo(-14, 14); // Right wing
      ctx.closePath();

      ctx.fillStyle = '#0a0d1f';
      ctx.fill();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Wing Stripes
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(-10, -11);
      ctx.moveTo(0, 7);
      ctx.lineTo(-10, 11);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cockpit Reactor Core
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
  }

  // --- BULLET CLASS ---
  class Bullet {
    constructor(x, y, angle, speed, isOverdrive = false) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.angle = angle;
      this.isOverdrive = isOverdrive;
      this.radius = isOverdrive ? 5 : 3.5;
      this.damage = isOverdrive ? 35 : 18;
      this.alive = true;
      this.color = isOverdrive ? '#ff0077' : '#00f3ff';
      this.life = 1.2;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0 || this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.radius * 2;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Core white laser
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(8, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.radius;
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- ENEMY BULLET CLASS ---
  class EnemyBullet {
    constructor(x, y, vx, vy, color = '#ff3300', radius = 4.5) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.radius = radius;
      this.alive = true;
    }

    update(dt) {
      this.x += this.vx * state.timeScale * dt;
      this.y += this.vy * state.timeScale * dt;
      if (this.x < -30 || this.x > width + 30 || this.y < -30 || this.y > height + 30) {
        this.alive = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
  }

  // --- ENEMY BASE & SUBCLASSES ---
  class Enemy {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.alive = true;
      this.hitFlash = 0;
      this.rotation = 0;

      switch (type) {
        case 'DRONE':
          this.radius = 14;
          this.hp = 25;
          this.speed = 170 + Math.random() * 40;
          this.color = '#ff4400';
          this.scoreVal = 100;
          break;
        case 'HUNTER':
          this.radius = 18;
          this.hp = 50;
          this.speed = 130;
          this.color = '#ff0055';
          this.scoreVal = 220;
          this.shootTimer = 1.8 + Math.random();
          break;
        case 'TURRET':
          this.radius = 24;
          this.hp = 110;
          this.speed = 60;
          this.color = '#9d00ff';
          this.scoreVal = 400;
          this.shootTimer = 2.4;
          break;
        case 'CHARGER':
          this.radius = 16;
          this.hp = 40;
          this.speed = 90;
          this.chargeSpeed = 550;
          this.color = '#ffe600';
          this.scoreVal = 280;
          this.state = 'STALK'; // STALK, TELEGRAPH, CHARGE
          this.stateTimer = 2.0;
          this.chargeDir = { x: 0, y: 0 };
          break;
        case 'BOSS':
          this.radius = 48;
          this.hp = 850 + state.wave * 250;
          this.maxHp = this.hp;
          this.speed = 40;
          this.color = '#ff0044';
          this.scoreVal = 3000;
          this.attackTimer = 1.5;
          this.attackPhase = 0;
          this.shieldAngle = 0;
          break;
      }
    }

    update(dt) {
      if (this.hitFlash > 0) this.hitFlash -= dt * 6;

      const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
      const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

      switch (this.type) {
        case 'DRONE':
          this.x += Math.cos(angleToPlayer) * this.speed * state.timeScale * dt;
          this.y += Math.sin(angleToPlayer) * this.speed * state.timeScale * dt;
          this.rotation += 4 * state.timeScale * dt;
          break;

        case 'HUNTER':
          // Keep a medium distance while circling
          const targetDist = 260;
          let moveAngle = angleToPlayer;
          if (distToPlayer < targetDist - 30) moveAngle += Math.PI; // Back up
          else if (distToPlayer > targetDist + 30) moveAngle = angleToPlayer; // Approach
          else moveAngle += Math.PI / 2; // Circle

          this.x += Math.cos(moveAngle) * this.speed * state.timeScale * dt;
          this.y += Math.sin(moveAngle) * this.speed * state.timeScale * dt;
          this.rotation = angleToPlayer;

          this.shootTimer -= state.timeScale * dt;
          if (this.shootTimer <= 0) {
            this.shootTimer = 2.0 + Math.random() * 0.5;
            const bSpeed = 260;
            enemyBullets.push(new EnemyBullet(
              this.x, this.y,
              Math.cos(angleToPlayer) * bSpeed,
              Math.sin(angleToPlayer) * bSpeed,
              '#ff0055',
              4.5
            ));
          }
          break;

        case 'TURRET':
          // Slow patrol
          this.x += Math.cos(angleToPlayer) * this.speed * state.timeScale * dt;
          this.y += Math.sin(angleToPlayer) * this.speed * state.timeScale * dt;
          this.rotation += 1.2 * state.timeScale * dt;

          this.shootTimer -= state.timeScale * dt;
          if (this.shootTimer <= 0) {
            this.shootTimer = 2.6;
            // 8-way radial pulse
            const count = 8;
            for (let i = 0; i < count; i++) {
              const fireAngle = (Math.PI * 2 / count) * i + this.rotation;
              enemyBullets.push(new EnemyBullet(
                this.x, this.y,
                Math.cos(fireAngle) * 180,
                Math.sin(fireAngle) * 180,
                '#a82bff',
                4.5
              ));
            }
          }
          break;

        case 'CHARGER':
          this.stateTimer -= state.timeScale * dt;
          if (this.state === 'STALK') {
            this.x += Math.cos(angleToPlayer) * this.speed * state.timeScale * dt;
            this.y += Math.sin(angleToPlayer) * this.speed * state.timeScale * dt;
            this.rotation = angleToPlayer;
            if (this.stateTimer <= 0) {
              this.state = 'TELEGRAPH';
              this.stateTimer = 0.8;
              this.chargeDir = { x: Math.cos(angleToPlayer), y: Math.sin(angleToPlayer) };
            }
          } else if (this.state === 'TELEGRAPH') {
            // Charging lock-on telegraph
            this.rotation = Math.atan2(this.chargeDir.y, this.chargeDir.x);
            if (this.stateTimer <= 0) {
              this.state = 'CHARGE';
              this.stateTimer = 0.7;
            }
          } else if (this.state === 'CHARGE') {
            this.x += this.chargeDir.x * this.chargeSpeed * state.timeScale * dt;
            this.y += this.chargeDir.y * this.chargeSpeed * state.timeScale * dt;
            if (this.stateTimer <= 0) {
              this.state = 'STALK';
              this.stateTimer = 2.2;
            }
          }
          break;

        case 'BOSS':
          this.rotation += 0.5 * state.timeScale * dt;
          this.shieldAngle += 1.8 * state.timeScale * dt;

          // Slow drift towards screen center or player
          const centerX = width / 2;
          const centerY = height / 3;
          const driftAngle = Math.atan2(centerY - this.y, centerX - this.x);
          this.x += Math.cos(driftAngle) * this.speed * state.timeScale * dt;
          this.y += Math.sin(driftAngle) * this.speed * state.timeScale * dt;

          this.attackTimer -= state.timeScale * dt;
          if (this.attackTimer <= 0) {
            this.attackTimer = 1.4;
            this.attackPhase = (this.attackPhase + 1) % 3;

            if (this.attackPhase === 0) {
              // Targeted 3-burst
              for (let i = -1; i <= 1; i++) {
                const a = angleToPlayer + i * 0.16;
                enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(a) * 280, Math.sin(a) * 280, '#ff0055', 6));
              }
            } else if (this.attackPhase === 1) {
              // 12-way nova ring
              for (let i = 0; i < 12; i++) {
                const a = (Math.PI * 2 / 12) * i + this.shieldAngle;
                enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(a) * 200, Math.sin(a) * 200, '#ffe600', 5));
              }
            } else {
              // Spawn support drone
              enemies.push(new Enemy(this.x + Math.cos(this.shieldAngle) * 60, this.y + Math.sin(this.shieldAngle) * 60, 'DRONE'));
            }
          }
          break;
      }
    }

    takeDamage(amount) {
      this.hp -= amount;
      this.hitFlash = 1.0;
      if (this.hp <= 0 && this.alive) {
        this.die();
      }
    }

    die() {
      this.alive = false;
      addScore(this.scoreVal);
      player.addOverdrive(this.type === 'BOSS' ? 100 : 8);

      // Sound & Particles
      const intensity = this.type === 'BOSS' ? 3.0 : (this.type === 'TURRET' ? 1.6 : 1.0);
      window.soundEngine.playExplosion(intensity);
      createExplosion(this.x, this.y, this.color, this.type === 'BOSS' ? 60 : 25, intensity);
      addScreenShake(this.type === 'BOSS' ? 18 : 4);

      // Power-up chance
      const dropRoll = Math.random();
      if (this.type === 'BOSS' || dropRoll < 0.25) {
        const types = ['SHIELD', 'CHRONO', 'OVERDRIVE', 'EMP'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        powerups.push(new PowerUp(this.x, this.y, chosen));
      }

      if (this.type === 'BOSS') {
        state.bossActive = false;
        shockwaves.push(new Shockwave(this.x, this.y, '#ff0077', 900, 5));
        floatingTexts.push(new FloatingText(this.x, this.y, '¡TITÁN CYBER ELIMINADO!', '#ffe600', 28));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Telegraph laser for Charger
      if (this.type === 'CHARGER' && this.state === 'TELEGRAPH') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.chargeDir.x * 600, this.chargeDir.y * 600);
        ctx.strokeStyle = `rgba(255, 230, 0, ${0.4 + Math.random() * 0.4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.rotate(this.rotation);

      const drawColor = this.hitFlash > 0 ? '#ffffff' : this.color;
      ctx.shadowColor = drawColor;
      ctx.shadowBlur = 12;

      switch (this.type) {
        case 'DRONE':
          // Diamond Fighter
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(0, -10);
          ctx.lineTo(-10, 0);
          ctx.lineTo(0, 10);
          ctx.closePath();
          ctx.fillStyle = '#160d1b';
          ctx.fill();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;

        case 'HUNTER':
          // Sharp Chevron
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-14, -14);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-14, 14);
          ctx.closePath();
          ctx.fillStyle = '#1b0914';
          ctx.fill();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          break;

        case 'TURRET':
          // Hexagon
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            const hx = Math.cos(a) * 22;
            const hy = Math.sin(a) * 22;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fillStyle = '#140822';
          ctx.fill();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Inner pulsing eye
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fillStyle = drawColor;
          ctx.fill();
          break;

        case 'CHARGER':
          // Angular Spike
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-12, -8);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-12, 8);
          ctx.closePath();
          ctx.fillStyle = '#211d08';
          ctx.fill();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          break;

        case 'BOSS':
          // Huge Fortress
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI / 4) * i;
            const bx = Math.cos(a) * 44;
            const by = Math.sin(a) * 44;
            if (i === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.closePath();
          ctx.fillStyle = '#250810';
          ctx.fill();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Rotating Shield Rings
          ctx.beginPath();
          ctx.arc(0, 0, 30, this.shieldAngle, this.shieldAngle + Math.PI * 1.5);
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Core
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fillStyle = drawColor;
          ctx.fill();
          break;
      }

      ctx.restore();

      // Boss Health Bar Over Head
      if (this.type === 'BOSS') {
        const barW = 120;
        const barH = 8;
        const barX = this.x - barW / 2;
        const barY = this.y - 65;
        const pct = Math.max(0, this.hp / this.maxHp);

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillRect(barX, barY, barW * pct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.restore();
      }
    }
  }

  // --- POWERUP CLASS ---
  class PowerUp {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // SHIELD, CHRONO, OVERDRIVE, EMP
      this.radius = 14;
      this.alive = true;
      this.life = 10.0;
      this.bob = Math.random() * Math.PI * 2;

      switch (type) {
        case 'SHIELD': this.color = '#00f3ff'; this.label = '+ESC'; break;
        case 'CHRONO': this.color = '#a82bff'; this.label = '+CHR'; break;
        case 'OVERDRIVE': this.color = '#ff0077'; this.label = '+PWR'; break;
        case 'EMP': this.color = '#ffe600'; this.label = 'EMP'; break;
      }
    }

    update(dt) {
      this.life -= dt;
      this.bob += dt * 4;
      if (this.life <= 0) this.alive = false;

      // Magnet pull towards player if close
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      if (d < 160) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * 280 * dt;
        this.y += Math.sin(angle) * 280 * dt;
      }
    }

    apply() {
      this.alive = false;
      window.soundEngine.playPowerup();
      createExplosion(this.x, this.y, this.color, 16, 0.6);

      switch (this.type) {
        case 'SHIELD':
          player.shield = Math.min(player.maxShield, player.shield + 40);
          floatingTexts.push(new FloatingText(this.x, this.y, '+40% ESCUDO', this.color, 18));
          break;
        case 'CHRONO':
          player.chrono = Math.min(player.maxChrono, player.chrono + 50);
          floatingTexts.push(new FloatingText(this.x, this.y, '+50% CHRONO', this.color, 18));
          break;
        case 'OVERDRIVE':
          player.activateOverdrive();
          break;
        case 'EMP':
          player.empCooldown = 0;
          floatingTexts.push(new FloatingText(this.x, this.y, 'EMP CARGADO', this.color, 18));
          break;
      }
    }

    draw(ctx) {
      const bobY = this.y + Math.sin(this.bob) * 4;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, bobY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(7, 10, 26, 0.85)';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.x, bobY);
      ctx.restore();
    }
  }

  // --- PARTICLE CLASS ---
  class Particle {
    constructor(x, y, vx, vy, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.life -= dt;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function createExplosion(x, y, color, count = 20, intensity = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 260 + 60) * intensity;
      particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        Math.random() * 4 + 2,
        Math.random() * 0.5 + 0.3
      ));
    }
  }

  // --- SHOCKWAVE CLASS ---
  class Shockwave {
    constructor(x, y, color, maxRadius = 400, speed = 3) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = maxRadius;
      this.color = color;
      this.speed = speed;
      this.alive = true;
    }

    update(dt) {
      this.radius += this.maxRadius * this.speed * dt;
      if (this.radius >= this.maxRadius) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const alpha = 1 - (this.radius / this.maxRadius);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4 * alpha;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- FLOATING TEXT ---
  class FloatingText {
    constructor(x, y, text, color = '#fff', size = 18) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.size = size;
      this.life = 1.0;
      this.maxLife = 1.0;
    }

    update(dt) {
      this.y -= 40 * dt;
      this.life -= dt;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${this.size}px Orbitron, sans-serif`;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // --- COMBO & SCORING ---
  function addScore(points) {
    const scored = Math.round(points * state.combo);
    state.score += scored;
    state.comboTimer = 3.5; // Combo expires after 3.5 seconds
    state.combo = Math.min(16.0, Number((state.combo + 0.1).toFixed(1)));
    if (state.combo > state.maxCombo) {
      state.maxCombo = state.combo;
    }
    window.soundEngine.playCombo(Math.floor(state.combo));
    updateComboUI(true);
  }

  function updateComboUI(bump = false) {
    ui.multiplierBadge.textContent = `COMBO x${state.combo.toFixed(1)}`;
    if (bump) {
      ui.multiplierBadge.classList.add('pulse');
      setTimeout(() => ui.multiplierBadge.classList.remove('pulse'), 150);
    }
  }

  function addScreenShake(amount) {
    state.screenShake = Math.max(state.screenShake, amount);
  }

  // --- SPAWN CONTROLLER ---
  let spawnTimer = 0;

  function handleSpawning(dt) {
    state.waveTimer += dt;
    spawnTimer -= dt;

    // Trigger Boss every 80 seconds or every 3000 score milestones
    if (!state.bossActive && state.score > 2500 && Math.floor(state.score / 3000) > Math.floor((state.score - 500) / 3000)) {
      spawnBoss();
      return;
    }

    if (spawnTimer <= 0) {
      const rate = Math.max(0.6, 2.2 - (state.wave * 0.18));
      spawnTimer = rate;

      // Random edge spawn position
      let sx, sy;
      if (Math.random() < 0.5) {
        sx = Math.random() < 0.5 ? -30 : width + 30;
        sy = Math.random() * height;
      } else {
        sx = Math.random() * width;
        sy = Math.random() < 0.5 ? -30 : height + 30;
      }

      // Pick enemy type based on wave
      const roll = Math.random();
      let enemyType = 'DRONE';
      if (state.wave >= 2 && roll < 0.35) {
        enemyType = 'HUNTER';
      } else if (state.wave >= 3 && roll < 0.2) {
        enemyType = 'CHARGER';
      } else if (state.wave >= 4 && roll < 0.15) {
        enemyType = 'TURRET';
      }

      enemies.push(new Enemy(sx, sy, enemyType));

      // Wave advancement
      if (state.waveTimer > 35) {
        state.wave++;
        state.waveTimer = 0;
        floatingTexts.push(new FloatingText(width / 2, height / 2 - 80, `¡OLEADA ${state.wave}!`, '#00f3ff', 30));
        window.soundEngine.playPowerup();
      }
    }
  }

  function spawnBoss() {
    state.bossActive = true;
    enemies.push(new Enemy(width / 2, -60, 'BOSS'));
    floatingTexts.push(new FloatingText(width / 2, height / 2 - 100, 'ALERTA: TITÁN DESTRUIDOR', '#ff0055', 34));
    addScreenShake(14);
    window.soundEngine.playLaserBeam();
  }

  // --- COLLISION RESOLUTION ---
  function checkCollisions() {
    // 1. Player Bullets vs Enemies
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (!b.alive) continue;

      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (!e.alive) continue;

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          b.alive = false;
          e.takeDamage(b.damage);
          createExplosion(b.x, b.y, b.color, 8, 0.4);
          break;
        }
      }
    }

    // 2. Enemy Bullets vs Player
    for (let ebi = enemyBullets.length - 1; ebi >= 0; ebi--) {
      const eb = enemyBullets[ebi];
      if (!eb.alive) continue;

      const dist = Math.hypot(eb.x - player.x, eb.y - player.y);
      if (dist < eb.radius + player.radius) {
        eb.alive = false;
        player.takeDamage(20);
      }
    }

    // 3. Enemies vs Player (Ramming)
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (!e.alive) continue;

      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < e.radius + player.radius) {
        player.takeDamage(30);
        if (e.type !== 'BOSS') {
          e.takeDamage(100); // Crash damages enemy too
        }
      }
    }

    // 4. Player vs Power-ups
    for (let pi = powerups.length - 1; pi >= 0; pi--) {
      const p = powerups[pi];
      if (!p.alive) continue;

      const dist = Math.hypot(p.x - player.x, p.y - player.y);
      if (dist < p.radius + player.radius + 10) {
        p.apply();
      }
    }
  }

  // --- GAME LOOP ---
  function gameLoop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const rawDt = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    if (state.mode === 'PLAYING') {
      // Smoothly blend time scale for bullet-time transitions
      state.timeScale += (state.targetTimeScale - state.timeScale) * 12 * rawDt;
      window.soundEngine.setTimeScale(state.timeScale);

      const dt = rawDt;

      // Update Combo Expiration
      if (state.combo > 1.0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
          state.combo = Math.max(1.0, Number((state.combo - dt * 2).toFixed(1)));
          updateComboUI();
        }
      }

      // Update Entities
      player.update(dt);

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt);
        if (!bullets[i].alive) bullets.splice(i, 1);
      }

      // Enemy Bullets
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].update(dt);
        if (!enemyBullets[i].alive) enemyBullets.splice(i, 1);
      }

      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(dt);
        if (!enemies[i].alive) enemies.splice(i, 1);
      }

      // Power-ups
      for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update(dt);
        if (!powerups[i].alive) powerups.splice(i, 1);
      }

      // Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].update(dt);
        if (!shockwaves[i].alive) shockwaves.splice(i, 1);
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      // Floating Texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update(dt);
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
      }

      // Collisions & Spawning
      checkCollisions();
      handleSpawning(dt);

      // Update HUD
      updateHUD();
    }

    // --- RENDER PASS ---
    render();

    requestAnimationFrame(gameLoop);
  }

  // --- RENDER PASS ---
  function render() {
    ctx.save();

    // Screen Shake Application
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake * 2;
      const sy = (Math.random() - 0.5) * state.screenShake * 2;
      ctx.translate(sx, sy);
      state.screenShake *= 0.90;
      if (state.screenShake < 0.1) state.screenShake = 0;
    }

    // Clear Canvas with Slight Trail Fade
    ctx.fillStyle = 'rgba(7, 7, 18, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Parallax Cyber Grid & Stars
    drawBackground(ctx);

    // 2. Draw Shockwaves
    for (const sw of shockwaves) sw.draw(ctx);

    // 3. Draw Power-ups
    for (const p of powerups) p.draw(ctx);

    // 4. Draw Bullets & Enemy Bullets
    for (const b of bullets) b.draw(ctx);
    for (const eb of enemyBullets) eb.draw(ctx);

    // 5. Draw Enemies
    for (const e of enemies) e.draw(ctx);

    // 6. Draw Player
    if (player && state.mode !== 'START') {
      player.draw(ctx);
    }

    // 7. Draw Particles with Additive Glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) p.draw(ctx);
    ctx.restore();

    // 8. Draw Floating Texts
    for (const ft of floatingTexts) ft.draw(ctx);

    // 9. Bullet Time Chromatic Vignette
    if (state.timeScale < 0.9 && state.mode === 'PLAYING') {
      drawChronoVignette(ctx);
    }

    ctx.restore();
  }

  function drawBackground(ctx) {
    // Parallax Grid
    const gridSize = 64;
    const shiftX = (player ? player.x * 0.05 : 0) % gridSize;
    const shiftY = (player ? player.y * 0.05 : 0) % gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = -shiftX; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = -shiftY; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Parallax Stars
    for (const star of backgroundStars) {
      star.y += star.speed * (player ? (player.vy * 0.0005 + 1) : 1);
      if (star.y > height) star.y = 0;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawChronoVignette(ctx) {
    const intensity = (1.0 - state.timeScale) / 0.8;
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.7);
    grad.addColorStop(0, 'rgba(168, 43, 255, 0)');
    grad.addColorStop(1, `rgba(168, 43, 255, ${0.35 * intensity})`);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // --- HUD UPDATER ---
  function updateHUD() {
    if (!player) return;

    // Shield
    const sPct = Math.max(0, Math.min(100, player.shield));
    ui.shieldFill.style.width = sPct + '%';
    ui.shieldVal.textContent = Math.round(sPct) + '%';

    // Chrono
    const cPct = Math.max(0, Math.min(100, player.chrono));
    ui.chronoFill.style.width = cPct + '%';
    ui.chronoVal.textContent = Math.round(cPct) + '%';

    // Overdrive
    const oPct = Math.max(0, Math.min(100, player.overdrive));
    ui.overdriveFill.style.width = oPct + '%';
    ui.overdriveVal.textContent = Math.round(oPct) + '%';

    // Score
    ui.currentScore.textContent = state.score.toString().padStart(6, '0');

    // EMP Status
    if (player.empCooldown <= 0) {
      ui.empStatusText.textContent = 'EMP LISTO';
      ui.empStatusText.className = 'emp-ready';
    } else {
      ui.empStatusText.textContent = `RECARGA ${Math.ceil(player.empCooldown)}s`;
      ui.empStatusText.className = 'emp-charging';
    }
  }

  // --- GAME FLOW CONTROLS ---
  function startGame() {
    window.soundEngine.init();
    window.soundEngine.startMusic();

    state.score = 0;
    state.combo = 1.0;
    state.maxCombo = 1.0;
    state.wave = 1;
    state.waveTimer = 0;
    state.bossActive = false;
    state.timeScale = 1.0;
    state.targetTimeScale = 1.0;

    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    shockwaves = [];
    floatingTexts = [];

    player = new Player();
    state.mode = 'PLAYING';

    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');

    updateComboUI();
    updateHUD();

    floatingTexts.push(new FloatingText(width / 2, height / 2, '¡SISTEMAS EN LÍNEA!', '#00f3ff', 32));
  }

  function gameOver() {
    state.mode = 'GAMEOVER';
    window.soundEngine.playGameOver();
    window.soundEngine.stopMusic();

    const isNewRecord = state.score > state.highScore;
    if (isNewRecord) {
      state.highScore = state.score;
      localStorage.setItem('neon_surge_high_score', state.highScore.toString());
      ui.newRecordAlert.style.display = 'block';
    } else {
      ui.newRecordAlert.style.display = 'none';
    }

    ui.finalScore.textContent = state.score.toLocaleString();
    ui.finalCombo.textContent = `x${state.maxCombo.toFixed(1)}`;
    ui.recordScore.textContent = state.highScore.toLocaleString();

    ui.gameOverScreen.classList.remove('hidden');
  }

  function togglePause() {
    if (state.mode === 'PLAYING') {
      state.mode = 'PAUSED';
      ui.pauseScreen.classList.remove('hidden');
    } else if (state.mode === 'PAUSED') {
      state.mode = 'PLAYING';
      ui.pauseScreen.classList.add('hidden');
    }
  }

  // --- BUTTON EVENT LISTENERS ---
  ui.btnStart.addEventListener('click', startGame);
  ui.btnRestart.addEventListener('click', startGame);
  ui.btnResume.addEventListener('click', togglePause);
  ui.btnAbandon.addEventListener('click', () => {
    state.mode = 'START';
    ui.pauseScreen.classList.add('hidden');
    ui.startScreen.classList.remove('hidden');
    window.soundEngine.stopMusic();
    ui.startBestScore.textContent = state.highScore.toLocaleString();
  });

  ui.btnAudio.addEventListener('click', () => {
    window.soundEngine.init();
    const muted = window.soundEngine.toggleMute();
    ui.btnAudio.textContent = muted ? '🔇 MUTED' : '🔊 AUDIO';
    ui.btnAudio.style.color = muted ? '#ff0055' : 'var(--text-main)';
  });

  ui.btnScanlines.addEventListener('click', () => {
    ui.crtOverlay.classList.toggle('disabled');
    const active = !ui.crtOverlay.classList.contains('disabled');
    ui.btnScanlines.style.borderColor = active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)';
  });

  ui.btnPause.addEventListener('click', () => {
    if (state.mode === 'PLAYING' || state.mode === 'PAUSED') {
      togglePause();
    }
  });

  // Initialize player instance for background preview
  player = new Player();

  // Start animation loop
  requestAnimationFrame(gameLoop);
})();

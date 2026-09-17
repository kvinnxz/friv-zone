// Main Game Loop, Camera, Input & Logic for Hollow Knight: Silksong Web

class SilksongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.spoolCanvas = document.getElementById('spoolCanvas');
    this.spoolCtx = this.spoolCanvas ? this.spoolCanvas.getContext('2d') : null;

    // Game Objects
    this.world = new GameWorld();
    this.player = new Hornet(320, 1640); // Safe start on moss floor
    this.respawnPoint = { x: 320, y: 1640 };

    // Viewport & Camera
    this.camera = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      targetX: 0,
      targetY: 0,
      lookAhead: 0
    };

    // Screen Shake & Hit Stop
    this.shakeIntensity = 0;
    this.hitStopTimer = 0;

    this.enemies = [
      new BellCrawler(700, 1640),
      new MossWeaverDrone(850, 1260),
      new BellCrawler(1380, 1400),
      new MossWeaverDrone(2100, 1420),
      new BellCrawler(2700, 1600)
    ];

    this.boss = new BellVanguardBoss(3950, 1550);
    this.bossEncountered = false;

    this.projectiles = []; // Projectiles in flight

    // Inputs
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      dash: false,
      attack: false,
      harpoon: false,
      bind: false
    };

    // State
    this.lastTime = 0;
    this.isPaused = false;
    this.benchNear = false;
    this.victory = false;

    this.resize();
    this.snapCameraToPlayer();
    this.initEvents();
    this.initVirtualControls();
    this.updateHUD();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
  }

  snapCameraToPlayer() {
    const rawX = this.player.x + this.player.w / 2 - this.camera.width / 2;
    const rawY = this.player.y + this.player.h / 2 - this.camera.height / 2;
    this.camera.x = Math.max(0, Math.min(this.world.width - this.camera.width, rawX));
    this.camera.y = Math.max(0, Math.min(this.world.height - this.camera.height, rawY));
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.snapCameraToPlayer();
    });

    // Keyboard controls (supports both e.code and e.key, uppercase & lowercase)
    window.addEventListener('keydown', (e) => {
      if (window.soundEngine) {
        window.soundEngine.init();
      }

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      // Prevent scrolling page with arrows or spacebar
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space'].includes(key)) {
        e.preventDefault();
      }

      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        this.keys.left = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        this.keys.right = true;
      }
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        this.keys.up = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        this.keys.down = true;
      }
      if (code === 'Space' || code === 'KeyZ' || key === ' ' || key === 'spacebar' || key === 'z') {
        this.keys.jump = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyC' || key === 'shift' || key === 'c') {
        this.keys.dash = true;
      }
      if (code === 'KeyJ' || code === 'KeyX' || key === 'j' || key === 'x') {
        this.keys.attack = true;
      }
      if (code === 'KeyK' || code === 'KeyV' || key === 'k' || key === 'v') {
        this.keys.harpoon = true;
      }
      if (code === 'KeyQ' || code === 'KeyE' || key === 'q' || key === 'e') {
        this.keys.bind = true;
      }
      if (code === 'KeyB' || key === 'b') {
        if (this.benchNear) {
          this.restAtBench();
        }
      }
      if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        this.keys.right = false;
      }
      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        this.keys.up = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        this.keys.down = false;
      }
      if (code === 'Space' || code === 'KeyZ' || key === ' ' || key === 'spacebar' || key === 'z') {
        this.keys.jump = false;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyC' || key === 'shift' || key === 'c') {
        this.keys.dash = false;
      }
      if (code === 'KeyJ' || code === 'KeyX' || key === 'j' || key === 'x') {
        this.keys.attack = false;
      }
      if (code === 'KeyK' || code === 'KeyV' || key === 'k' || key === 'v') {
        this.keys.harpoon = false;
      }
      if (code === 'KeyQ' || code === 'KeyE' || key === 'q' || key === 'e') {
        this.keys.bind = false;
      }
    });

    // Global Mouse click controls
    window.addEventListener('mousedown', (e) => {
      if (window.soundEngine) {
        window.soundEngine.init();
      }
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.virtual-btn')) {
        return;
      }
      if (e.button === 0) {
        this.keys.attack = true;
      } else if (e.button === 2) {
        e.preventDefault();
        this.keys.harpoon = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.attack = false;
      if (e.button === 2) this.keys.harpoon = false;
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent context menu to allow needle harpoon on right click
      if (e.target === this.canvas || e.target.id === 'game-container') {
        e.preventDefault();
      }
    });

    // Audio toggle button
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const muted = window.soundEngine.toggleMute();
        audioBtn.textContent = muted ? '🔇' : '🎵';
      });
    }

    // Modal buttons
    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => this.respawn());
    }

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.togglePause(false));
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => location.reload());
    }
  }

  // On-screen Touch & Mouse Virtual Buttons (for mobile or click-to-play)
  initVirtualControls() {
    const bindBtn = (id, keyName) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.soundEngine) window.soundEngine.init();
        this.keys[keyName] = true;
        el.classList.add('pressed');
      };
      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.keys[keyName] = false;
        el.classList.remove('pressed');
      };
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
    };

    bindBtn('vbtn-left', 'left');
    bindBtn('vbtn-right', 'right');
    bindBtn('vbtn-up', 'up');
    bindBtn('vbtn-down', 'down');
    bindBtn('vbtn-jump', 'jump');
    bindBtn('vbtn-attack', 'attack');
    bindBtn('vbtn-dash', 'dash');
    bindBtn('vbtn-heal', 'bind');

    // On-screen bench rest button
    const benchPrompt = document.getElementById('bench-prompt');
    if (benchPrompt) {
      benchPrompt.addEventListener('click', () => {
        if (this.benchNear) this.restAtBench();
      });
    }
  }

  togglePause(override) {
    this.isPaused = override !== undefined ? override : !this.isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
      pauseScreen.classList.toggle('active', this.isPaused);
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('active');
      setTimeout(() => toast.classList.remove('active'), 2800);
    }
  }

  restAtBench() {
    this.player.isResting = true;
    this.player.health = this.player.maxHealth;
    this.player.silk = this.player.maxSilk;
    this.respawnPoint = { x: this.world.bench.x + 20, y: this.world.bench.y };
    window.soundEngine.playBenchRest();
    window.particleEngine.createSilkBurst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 25);
    this.showToast('Descanso en el Banco - Máscaras y Seda restauradas');
    this.updateHUD();
  }

  respawn() {
    this.player.isDead = false;
    this.player.health = this.player.maxHealth;
    this.player.silk = 4;
    this.player.x = this.respawnPoint.x;
    this.player.y = this.respawnPoint.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.projectiles = [];

    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) deathScreen.classList.remove('active');

    this.snapCameraToPlayer();
    this.updateHUD();
    this.showToast('La Tejedora despierta una vez más...');
  }

  triggerScreenShake(amount) {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }

  triggerHitStop(frames = 3) {
    this.hitStopTimer = frames * 0.016;
  }

  // --- Main Update Loop ---
  update(dt) {
    if (this.isPaused) return;

    // Hit-stop frame freeze for punchy combat feel
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // Screen Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // 1. Update World & Interactive Objects
    this.world.update(dt, this.player);

    // 2. Update Hornet
    this.player.update(dt, this.keys, this.world, window.particleEngine, window.soundEngine);

    // Safety: prevent falling into void
    if (this.player.y > 1920) {
      this.player.x = 180;
      this.player.y = 1620;
      this.player.vx = 0;
      this.player.vy = 0;
      this.snapCameraToPlayer();
    }

    // Bench vicinity check
    const benchDist = Math.hypot(
      (this.world.bench.x + this.world.bench.w / 2) - (this.player.x + this.player.w / 2),
      (this.world.bench.y + this.world.bench.h / 2) - (this.player.y + this.player.h / 2)
    );
    this.benchNear = benchDist < 80;
    const benchPrompt = document.getElementById('bench-prompt');
    if (benchPrompt) {
      benchPrompt.classList.toggle('visible', this.benchNear && !this.player.isResting);
    }

    // 3. Update Enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        if (enemy instanceof BellCrawler) {
          enemy.update(dt, this.world, this.player, window.particleEngine, window.soundEngine);
        } else if (enemy instanceof MossWeaverDrone) {
          enemy.update(dt, this.player, this.projectiles, window.particleEngine, window.soundEngine);
        }
      }
    }

    // 4. Boss Arena Trigger & Update
    if (!this.bossEncountered && this.player.x > 3240) {
      this.bossEncountered = true;
      this.world.arenaGate.closed = true;
      this.world.arenaGate.targetY = 1180; // slams shut
      this.triggerScreenShake(12);
      window.soundEngine.playBossSlam();
      const bossHud = document.getElementById('boss-hud');
      if (bossHud) bossHud.classList.add('active');
      this.showToast('Vanguardia de Campana despierta');
    }

    if (this.bossEncountered && !this.boss.isDead) {
      this.boss.update(dt, this.world, this.player, this.projectiles, window.particleEngine, window.soundEngine);
    } else if (this.boss.isDead && !this.victory) {
      this.victory = true;
      setTimeout(() => {
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) victoryScreen.classList.add('active');
      }, 1800);
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Projectile vs Player
      if (p.isEnemy && !this.player.isDead) {
        const pDist = Math.hypot(this.player.x + this.player.w / 2 - p.x, this.player.y + this.player.h / 2 - p.y);
        if (pDist < p.radius + 18) {
          this.player.takeDamage(1, window.soundEngine, window.particleEngine);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Despawn
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Handle Combat Collisions
    this.handleCombatCollisions();

    // 7. Update Particles
    window.particleEngine.update();

    // 8. Update Camera
    this.updateCamera(dt);

    // 9. Check Hornet Death
    if (this.player.isDead) {
      const deathScreen = document.getElementById('death-screen');
      if (deathScreen && !deathScreen.classList.contains('active')) {
        deathScreen.classList.add('active');
      }
    }

    // 10. Sync HUD
    this.updateHUD();
  }

  handleCombatCollisions() {
    // Attack box collisions
    if (this.player.isAttacking && this.player.attackBox) {
      const ab = this.player.attackBox;
      const isPogo = ab.type === 'pogo';

      // Vs Enemies
      for (const enemy of this.enemies) {
        if (!enemy.isDead) {
          if (
            ab.x < enemy.x + enemy.w &&
            ab.x + ab.w > enemy.x &&
            ab.y < enemy.y + enemy.h &&
            ab.y + ab.h > enemy.y
          ) {
            const hitSuccess = enemy.takeHit(
              isPogo ? 35 : 20,
              this.player.x + this.player.w / 2,
              isPogo,
              window.particleEngine,
              window.soundEngine
            );
            this.triggerHitStop(4);
            this.triggerScreenShake(5);
            if (hitSuccess) {
              this.player.gainSilk(1.8, window.soundEngine);
            }
            if (isPogo) {
              this.player.bouncePogo(window.particleEngine, window.soundEngine);
            }
          }
        }
      }

      // Vs Boss
      if (this.bossEncountered && !this.boss.isDead) {
        const b = this.boss;
        if (
          ab.x < b.x + b.w &&
          ab.x + ab.w > b.x &&
          ab.y < b.y + b.h &&
          ab.y + ab.h > b.y
        ) {
          const hitSuccess = b.takeHit(isPogo ? 25 : 16, window.particleEngine, window.soundEngine);
          this.triggerHitStop(5);
          this.triggerScreenShake(7);
          if (hitSuccess) {
            this.player.gainSilk(1.5, window.soundEngine);
          }
          if (isPogo) {
            this.player.bouncePogo(window.particleEngine, window.soundEngine);
          }
        }
      }

      // Vs Resonating Bells
      for (const bell of this.world.bells) {
        if (
          ab.x < bell.x + bell.w &&
          ab.x + ab.w > bell.x &&
          ab.y < bell.y + bell.h &&
          ab.y + ab.h > bell.y
        ) {
          this.world.strikeBell(bell, window.particleEngine, window.soundEngine);
          this.triggerHitStop(3);
          this.triggerScreenShake(6);
          if (isPogo) {
            this.player.bouncePogo(window.particleEngine, window.soundEngine);
          }
        }
      }

      // Vs Breakable Cocoons
      for (const cocoon of this.world.cocoons) {
        if (
          !cocoon.broken &&
          ab.x < cocoon.x + cocoon.w &&
          ab.x + ab.w > cocoon.x &&
          ab.y < cocoon.y + cocoon.h &&
          ab.y + ab.h > cocoon.y
        ) {
          this.world.strikeCocoon(cocoon, window.particleEngine, window.soundEngine);
          this.player.gainSilk(2.5, window.soundEngine);
          this.triggerHitStop(3);
        }
      }
    }

    // Harpoon grapple vs Silk Rings
    if (this.player.isHarpooning && this.player.harpoon && !this.player.harpoon.isHooked) {
      const hp = this.player.harpoon;
      for (const ring of this.world.silkRings) {
        const dist = Math.hypot(hp.x - ring.x, hp.y - ring.y);
        if (dist < ring.radius + 15) {
          // Hooked into ring!
          hp.isHooked = true;
          hp.hookX = ring.x;
          hp.hookY = ring.y;
          window.soundEngine.playPogoClank();
          window.particleEngine.createShockwave(ring.x, ring.y, 70, '#f4d06f');
          window.particleEngine.createSilkBurst(ring.x, ring.y, 16);
          break;
        }
      }
    }

    // Collect Rosary Beads
    for (const bead of this.world.beads) {
      if (!bead.collected) {
        const bDist = Math.hypot(
          (this.player.x + this.player.w / 2) - bead.x,
          (this.player.y + this.player.h / 2) - bead.y
        );
        if (bDist < 35) {
          bead.collected = true;
          this.player.rosaries += 5;
          window.soundEngine.playSilkCollect();
          window.particleEngine.createSparks(bead.x, bead.y, 8, '#f4d06f', 4);
        }
      }
    }
  }

  updateCamera(dt) {
    // Lookahead in facing direction
    const targetLook = this.player.facing * 120;
    this.camera.lookAhead += (targetLook - this.camera.lookAhead) * 0.06;

    // Smooth camera tracking with world boundary clamping
    let targetCamX = this.player.x + this.player.w / 2 - this.camera.width / 2 + this.camera.lookAhead;
    let targetCamY = this.player.y + this.player.h / 2 - this.camera.height / 2;

    targetCamX = Math.max(0, Math.min(this.world.width - this.camera.width, targetCamX));
    targetCamY = Math.max(0, Math.min(this.world.height - this.camera.height, targetCamY));

    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Apply Screen Shake
    if (this.shakeIntensity > 0) {
      this.camera.x += (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.camera.y += (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
  }

  updateHUD() {
    // 1. Update Hornet Masks
    const maskRows = document.getElementById('masks-row');
    if (maskRows) {
      const masks = maskRows.querySelectorAll('.mask-icon');
      masks.forEach((m, idx) => {
        if (idx < this.player.health) {
          m.classList.remove('lost');
        } else {
          m.classList.add('lost');
        }
      });
    }

    // 2. Update Silk Spool HUD Canvas
    const spoolContainer = document.querySelector('.silk-spool-container');
    if (spoolContainer) {
      if (this.player.silk >= 6) {
        spoolContainer.classList.add('full-silk');
      } else {
        spoolContainer.classList.remove('full-silk');
      }
    }

    if (this.spoolCtx && this.spoolCanvas) {
      const ctx = this.spoolCtx;
      const w = this.spoolCanvas.width;
      const h = this.spoolCanvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw Silk filaments along circumference
      const maxSlots = 8;
      const cx = w / 2;
      const cy = h / 2;
      const r = 30;

      for (let i = 0; i < maxSlots; i++) {
        const angle = (i / maxSlots) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * (r - 7);
        const y1 = cy + Math.sin(angle) * (r - 7);
        const x2 = cx + Math.cos(angle) * (r + 4);
        const y2 = cy + Math.sin(angle) * (r + 4);

        ctx.strokeStyle = i < Math.floor(this.player.silk) ? '#ffffff' : 'rgba(115, 72, 84, 0.4)';
        ctx.lineWidth = i < Math.floor(this.player.silk) ? 3.5 : 2;
        if (i < Math.floor(this.player.silk)) {
          ctx.shadowColor = '#f4d06f';
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // 3. Update Rosary Counter
    const rosaryCountEl = document.getElementById('rosary-count');
    if (rosaryCountEl) {
      rosaryCountEl.textContent = this.player.rosaries;
    }

    // 4. Update Boss Bar
    if (this.bossEncountered) {
      const bossFill = document.getElementById('boss-bar-fill');
      const bossGhost = document.getElementById('boss-bar-ghost');
      const hpPercent = Math.max(0, (this.boss.health / this.boss.maxHealth) * 100);
      if (bossFill) bossFill.style.width = `${hpPercent}%`;
      if (bossGhost) bossGhost.style.width = `${hpPercent}%`;
    }
  }

  // --- Main Render Loop ---
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Render World & Backgrounds
    this.world.render(this.ctx, this.camera);

    // 2. Render Enemies
    for (const enemy of this.enemies) {
      enemy.render(this.ctx, this.camera);
    }

    // 3. Render Boss
    if (this.bossEncountered) {
      this.boss.render(this.ctx, this.camera);
    }

    // 4. Render Projectiles
    for (const p of this.projectiles) {
      const px = p.x - this.camera.x;
      const py = p.y - this.camera.y;
      this.ctx.save();
      if (p.isRing) {
        this.ctx.strokeStyle = '#d4a373';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#f4d06f';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (p.isShockwave) {
        this.ctx.fillStyle = '#ff5252';
        this.ctx.shadowColor = 'rgba(255, 82, 82, 0.8)';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#a3d19d';
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 5. Render Hornet
    this.player.render(this.ctx, this.camera);

    // 6. Render Particles & Slash VFX
    window.particleEngine.render(this.ctx, this.camera);
  }

  // Engine loop
  start() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // clamp dt
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Guaranteed Startup
function launchGame() {
  if (window.gameInstance) return;
  window.gameInstance = new SilksongGame();
  window.gameInstance.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', launchGame);
  window.addEventListener('load', launchGame);
} else {
  launchGame();
}

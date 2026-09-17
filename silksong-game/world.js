// World Map, Levels, Collisions & Interactive Elements for Silksong Web

class GameWorld {
  constructor() {
    this.width = 4600;
    this.height = 2000;

    // Static solid platforms and walls [x, y, w, h, type: 'rock'|'moss'|'brass']
    this.colliders = [
      // --- Zone 1: Moss Grotto (Cavern Entrance & Platforms) ---
      // Ground floor
      { x: 0, y: 1700, w: 1800, h: 300, type: 'moss' },
      // Left boundary wall
      { x: -50, y: 0, w: 80, h: 2000, type: 'rock' },
      // Platforms in cavern
      { x: 260, y: 1540, w: 220, h: 30, type: 'moss' },
      { x: 580, y: 1380, w: 200, h: 30, type: 'moss' },
      { x: 220, y: 1220, w: 240, h: 30, type: 'moss' },
      { x: 560, y: 1060, w: 260, h: 30, type: 'moss' },
      
      // Vertical shaft with wall-jump walls
      { x: 920, y: 800, w: 50, h: 700, type: 'rock' }, // Wall 1 for wall jump
      { x: 1120, y: 800, w: 50, h: 700, type: 'rock' }, // Wall 2 for wall jump

      // Upper ledge from shaft
      { x: 800, y: 800, w: 120, h: 30, type: 'moss' },
      { x: 1170, y: 800, w: 350, h: 40, type: 'moss' },

      // Spike hazard pit in grotto
      { x: 1800, y: 1800, w: 600, h: 200, type: 'spike_pit' },
      // Floating stepping stones over spikes
      { x: 1920, y: 1650, w: 90, h: 25, type: 'rock' },
      { x: 2150, y: 1650, w: 90, h: 25, type: 'rock' },

      // --- Zone 2: The Weaver's Bench & Sanctum Hub ---
      // Bench floor
      { x: 1250, y: 1450, w: 550, h: 250, type: 'brass' },
      { x: 1800, y: 1450, w: 40, h: 250, type: 'brass' },

      // Mid-level transition to Bell Sanctum
      { x: 2400, y: 1650, w: 700, h: 350, type: 'brass' },
      { x: 2550, y: 1480, w: 240, h: 30, type: 'brass' },
      { x: 2900, y: 1320, w: 200, h: 30, type: 'brass' },

      // High Bell Shaft
      { x: 2350, y: 900, w: 60, h: 600, type: 'brass' },
      { x: 2650, y: 900, w: 60, h: 450, type: 'brass' },
      { x: 2410, y: 1100, w: 180, h: 30, type: 'brass' },

      // --- Zone 3: Steel Bell Vanguard Arena (Grand Sanctum) ---
      // Arena floor (wide and dramatic)
      { x: 3100, y: 1680, w: 1500, h: 320, type: 'brass' },
      // Arena ceiling
      { x: 3100, y: 900, w: 1500, h: 100, type: 'brass' },
      // Right arena boundary
      { x: 4550, y: 0, w: 100, h: 2000, type: 'brass' },
      // Arena entrance arch
      { x: 3100, y: 900, w: 60, h: 580, type: 'brass' }
    ];

    // Spikes (Hazard zones that damage Hornet and allow pogo bouncing!)
    this.spikes = [
      { x: 1800, y: 1760, w: 600, h: 40 },
      { x: 620, y: 1660, w: 160, h: 40 }
    ];

    // Interactive Silk Grapple Rings (Hornet can hook with harpoon or leap towards)
    this.silkRings = [
      { x: 400, y: 1370, radius: 18, active: true },
      { x: 700, y: 920, radius: 18, active: true },
      { x: 2030, y: 1500, radius: 18, active: true },
      { x: 2800, y: 1180, radius: 18, active: true },
      { x: 3750, y: 1150, radius: 22, active: true } // Arena high ring!
    ];

    // Resonating Brass Bells (Strike with needle to trigger chime & open gates)
    this.bells = [
      { x: 620, y: 980, w: 40, h: 56, rung: false, angle: 0, swingVel: 0 },
      { x: 2480, y: 1020, w: 45, h: 62, rung: false, angle: 0, swingVel: 0 },
      { x: 3820, y: 970, w: 75, h: 95, rung: false, angle: 0, swingVel: 0, isGreatBell: true }
    ];

    // Breakable Silk Cocoons (Yield silk & rosary beads when struck)
    this.cocoons = [
      { x: 340, y: 1180, w: 32, h: 45, broken: false },
      { x: 1350, y: 760, w: 36, h: 50, broken: false },
      { x: 2680, y: 1440, w: 34, h: 46, broken: false }
    ];

    // Checkpoint Bench
    this.bench = {
      x: 1450,
      y: 1420,
      w: 80,
      h: 30,
      active: false
    };

    // Bell Gate (opens when high bell is rung)
    this.bellGate = {
      x: 3100,
      y: 1480,
      w: 24,
      h: 200,
      opened: false,
      currentY: 1480,
      targetY: 1480
    };

    // Boss Arena Trap Gate (slams down during boss fight)
    this.arenaGate = {
      x: 3180,
      y: 1180,
      w: 28,
      h: 500,
      closed: false,
      currentY: 900,
      targetY: 900
    };

    // Collectible Rosary Beads dropped in world
    this.beads = [
      { x: 280, y: 1490, collected: false, floatOffset: 0 },
      { x: 1360, y: 730, collected: false, floatOffset: 0.5 },
      { x: 2050, y: 1610, collected: false, floatOffset: 1.0 },
      { x: 2950, y: 1280, collected: false, floatOffset: 1.5 }
    ];

    // Atmospheric Lanterns
    this.lanterns = [
      { x: 180, y: 1510, color: '#f4d06f', radius: 140 },
      { x: 1450, y: 1380, color: '#f4d06f', radius: 220 }, // Bench lantern
      { x: 2500, y: 1440, color: '#d4a373', radius: 160 },
      { x: 3300, y: 1580, color: '#c72c41', radius: 180 }, // Arena crimson lantern
      { x: 4300, y: 1580, color: '#c72c41', radius: 180 }
    ];
  }

  update(dt, player) {
    // Update bell swing physics
    for (const bell of this.bells) {
      if (Math.abs(bell.angle) > 0.001 || Math.abs(bell.swingVel) > 0.001) {
        const springForce = -bell.angle * 12;
        const damping = 0.94;
        bell.swingVel = (bell.swingVel + springForce * dt) * damping;
        bell.angle += bell.swingVel * dt;
      }
    }

    // Update bell gate sliding
    if (this.bellGate.opened) {
      this.bellGate.targetY = 1260; // slides upward into ceiling
    }
    this.bellGate.currentY += (this.bellGate.targetY - this.bellGate.currentY) * 0.08;

    // Update arena gate sliding
    this.arenaGate.currentY += (this.arenaGate.targetY - this.arenaGate.currentY) * 0.12;

    // Update floating beads
    for (const bead of this.beads) {
      if (!bead.collected) {
        bead.floatOffset += dt * 3;
      }
    }
  }

  // Strike bell with needle
  strikeBell(bell, particleEngine, soundEngine) {
    bell.rung = true;
    bell.swingVel = 14;
    soundEngine.playBellStrike();
    particleEngine.createShockwave(bell.x + bell.w / 2, bell.y + bell.h / 2, 130, 'rgba(212, 163, 115, 0.9)');
    particleEngine.createSparks(bell.x + bell.w / 2, bell.y + bell.h / 2, 20, '#f4d06f', 8);

    // Open the Bell Gate to the sanctum
    this.bellGate.opened = true;
  }

  // Strike breakable cocoon
  strikeCocoon(cocoon, particleEngine, soundEngine) {
    if (cocoon.broken) return;
    cocoon.broken = true;
    soundEngine.playEnemyHit();
    particleEngine.createSilkBurst(cocoon.x + cocoon.w / 2, cocoon.y + cocoon.h / 2, 24);
    particleEngine.createSparks(cocoon.x + cocoon.w / 2, cocoon.y + cocoon.h / 2, 10, '#ffffff', 6);

    // Spawn rosary beads
    for (let i = 0; i < 3; i++) {
      this.beads.push({
        x: cocoon.x + cocoon.w / 2 + (Math.random() - 0.5) * 30,
        y: cocoon.y + cocoon.h / 2 - 10,
        collected: false,
        floatOffset: Math.random() * Math.PI
      });
    }
  }

  // Check collision with solid colliders
  checkCollision(entity) {
    // Normal colliders
    for (const col of this.colliders) {
      if (col.type === 'spike_pit') continue;
      if (
        entity.x < col.x + col.w &&
        entity.x + entity.w > col.x &&
        entity.y < col.y + col.h &&
        entity.y + entity.h > col.y
      ) {
        return col;
      }
    }

    // Bell gate collider
    if (!this.bellGate.opened) {
      const g = this.bellGate;
      if (
        entity.x < g.x + g.w &&
        entity.x + entity.w > g.x &&
        entity.y < g.currentY + g.h &&
        entity.y + entity.h > g.currentY
      ) {
        return { x: g.x, y: g.currentY, w: g.w, h: g.h, type: 'brass' };
      }
    }

    // Arena gate collider
    if (this.arenaGate.closed) {
      const ag = this.arenaGate;
      if (
        entity.x < ag.x + ag.w &&
        entity.x + entity.w > ag.x &&
        entity.y < ag.currentY + ag.h &&
        entity.y + entity.h > ag.currentY
      ) {
        return { x: ag.x, y: ag.currentY, w: ag.w, h: ag.h, type: 'brass' };
      }
    }

    return null;
  }

  // Check spikes collision
  checkSpikeCollision(box) {
    for (const s of this.spikes) {
      if (
        box.x < s.x + s.w &&
        box.x + box.w > s.x &&
        box.y < s.y + s.h &&
        box.y + box.h > s.y
      ) {
        return s;
      }
    }
    return null;
  }

  render(ctx, camera) {
    ctx.save();

    // 1. Far Parallax Background (Gothic Arches, Dark Citadel Silhouette, Fog)
    this.renderParallaxBackground(ctx, camera);

    // 2. Solid Colliders / Architecture
    for (const col of this.colliders) {
      if (col.type === 'spike_pit') continue;
      const rx = col.x - camera.x;
      const ry = col.y - camera.y;
      if (rx + col.w < -50 || rx > camera.width + 50 || ry + col.h < -50 || ry > camera.height + 50) continue;

      ctx.save();
      if (col.type === 'moss') {
        // Moss Grotto Stone & Overgrowth
        ctx.fillStyle = '#171a17';
        ctx.fillRect(rx, ry, col.w, col.h);

        // Moss trim top
        ctx.fillStyle = '#3a5a40';
        ctx.fillRect(rx, ry, col.w, 6);
        ctx.fillStyle = '#588157';
        ctx.fillRect(rx, ry + 2, col.w, 2);

        // Subtle rocky texture borders
        ctx.strokeStyle = '#283618';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, col.w, col.h);
      } else if (col.type === 'brass') {
        // Bell Sanctum Brass Architecture
        ctx.fillStyle = '#151114';
        ctx.fillRect(rx, ry, col.w, col.h);

        // Ornate Brass Edge Trims
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(rx, ry, col.w, 4);
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(rx, ry, col.w, 1.5);

        // Ornate engraving lines
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 4, ry + 4, col.w - 8, col.h - 8);
      } else {
        // Raw ancient rock
        ctx.fillStyle = '#101014';
        ctx.fillRect(rx, ry, col.w, col.h);
        ctx.strokeStyle = '#22222a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, col.w, col.h);
      }
      ctx.restore();
    }

    // 3. Spikes (Lethal brambles / needle hazards)
    for (const s of this.spikes) {
      const rx = s.x - camera.x;
      const ry = s.y - camera.y;
      if (rx + s.w < 0 || rx > camera.width || ry + s.h < 0 || ry > camera.height) continue;

      ctx.save();
      ctx.fillStyle = '#ff3d52';
      ctx.shadowColor = 'rgba(255, 61, 82, 0.6)';
      ctx.shadowBlur = 8;
      const spikeW = 16;
      const count = Math.floor(s.w / spikeW);
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(rx + i * spikeW, ry + s.h);
        ctx.lineTo(rx + i * spikeW + spikeW / 2, ry);
        ctx.lineTo(rx + (i + 1) * spikeW, ry + s.h);
        ctx.closePath();
        ctx.fill();

        // Inner sharp needle shine
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Bell Gate
    const bgx = this.bellGate.x - camera.x;
    const bgy = this.bellGate.currentY - camera.y;
    ctx.save();
    ctx.fillStyle = '#3a2b25';
    ctx.fillRect(bgx, bgy, this.bellGate.w, this.bellGate.h);
    // Gate bars
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 2;
    for (let by = bgy; by < bgy + this.bellGate.h; by += 20) {
      ctx.beginPath();
      ctx.moveTo(bgx, by);
      ctx.lineTo(bgx + this.bellGate.w, by);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Arena Gate
    const agx = this.arenaGate.x - camera.x;
    const agy = this.arenaGate.currentY - camera.y;
    ctx.save();
    ctx.fillStyle = '#2b1b22';
    ctx.fillRect(agx, agy, this.arenaGate.w, this.arenaGate.h);
    ctx.strokeStyle = '#c72c41';
    ctx.lineWidth = 2;
    ctx.strokeRect(agx, agy, this.arenaGate.w, this.arenaGate.h);
    ctx.restore();

    // 6. Silk Grapple Rings
    for (const ring of this.silkRings) {
      const rx = ring.x - camera.x;
      const ry = ring.y - camera.y;
      ctx.save();
      // Glow
      ctx.shadowColor = 'rgba(244, 208, 111, 0.8)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#f4d06f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Hanging silk thread
      ctx.strokeStyle = 'rgba(243, 245, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry - ring.radius);
      ctx.lineTo(rx, ry - 90);
      ctx.stroke();

      // Inner jewel
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Resonating Bells
    for (const bell of this.bells) {
      const bx = bell.x - camera.x;
      const by = bell.y - camera.y;
      ctx.save();
      ctx.translate(bx + bell.w / 2, by);
      ctx.rotate(bell.angle);

      // Bell chain/mount
      ctx.strokeStyle = '#634b35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -60);
      ctx.stroke();

      // Bell shape
      ctx.fillStyle = bell.isGreatBell ? '#8a623a' : '#d4a373';
      ctx.shadowColor = 'rgba(212, 163, 115, 0.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-bell.w * 0.35, 0);
      ctx.lineTo(bell.w * 0.35, 0);
      ctx.quadraticCurveTo(bell.w * 0.45, bell.h * 0.6, bell.w * 0.55, bell.h);
      ctx.lineTo(-bell.w * 0.55, bell.h);
      ctx.quadraticCurveTo(-bell.w * 0.45, bell.h * 0.6, -bell.w * 0.35, 0);
      ctx.closePath();
      ctx.fill();

      // Bell rim
      ctx.strokeStyle = '#f4d06f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, bell.h, bell.w * 0.55, bell.h * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Clapper
      ctx.fillStyle = '#3a2618';
      ctx.beginPath();
      ctx.arc(0, bell.h + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 8. Cocoons
    for (const c of this.cocoons) {
      if (c.broken) continue;
      const cx = c.x - camera.x;
      const cy = c.y - camera.y;
      ctx.save();
      // Silk strands holding cocoon
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + c.w / 2, cy);
      ctx.lineTo(cx + c.w / 2, cy - 35);
      ctx.stroke();

      // Cocoon body
      ctx.fillStyle = '#f3f5f8';
      ctx.shadowColor = 'rgba(244, 208, 111, 0.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(cx + c.w / 2, cy + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thread wraps
      ctx.strokeStyle = '#c4b5a5';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx + c.w / 2, cy + (c.h / 4) * i, c.w * 0.45, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 9. Checkpoint Bench
    const bnx = this.bench.x - camera.x;
    const bny = this.bench.y - camera.y;
    ctx.save();
    // Bench seat
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(bnx, bny + 14, this.bench.w, 10);
    // Bench legs
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(bnx + 6, bny + 24, 6, 16);
    ctx.fillRect(bnx + this.bench.w - 12, bny + 24, 6, 16);
    // Ornate backrest
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bnx, bny + 14);
    ctx.quadraticCurveTo(bnx + this.bench.w / 2, bny - 12, bnx + this.bench.w, bny + 14);
    ctx.stroke();

    // Resting glow
    ctx.shadowColor = 'rgba(244, 208, 111, 0.7)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(244, 208, 111, 0.15)';
    ctx.beginPath();
    ctx.arc(bnx + this.bench.w / 2, bny + 15, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 10. Rosary Beads
    for (const bead of this.beads) {
      if (bead.collected) continue;
      const bx = bead.x - camera.x;
      const by = bead.y - camera.y + Math.sin(bead.floatOffset) * 4;
      ctx.save();
      ctx.shadowColor = 'rgba(244, 208, 111, 0.9)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff2a3';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 11. Lantern Lights (Dramatic Lighting Overlay)
    for (const l of this.lanterns) {
      const lx = l.x - camera.x;
      const ly = l.y - camera.y;
      if (lx < -200 || lx > camera.width + 200 || ly < -200 || ly > camera.height + 200) continue;

      ctx.save();
      // Lantern body
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(lx - 5, ly - 8, 10, 14);
      // Light radial aura
      const grad = ctx.createRadialGradient(lx, ly, 5, lx, ly, l.radius);
      grad.addColorStop(0, l.color);
      grad.addColorStop(0.3, 'rgba(244, 208, 111, 0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, l.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // Parallax Background Renderer
  renderParallaxBackground(ctx, camera) {
    const w = camera.width;
    const h = camera.height;

    // Distant Far Layer (Speed 0.15)
    ctx.save();
    const farOffsetX = (camera.x * 0.15) % 800;
    ctx.fillStyle = '#0a0910';
    ctx.fillRect(0, 0, w, h);

    // Distant gothic pillars & arches
    ctx.fillStyle = '#121019';
    for (let x = -farOffsetX - 800; x < w + 800; x += 320) {
      ctx.fillRect(x, h - 500, 70, 500);
      // Arch tops
      ctx.beginPath();
      ctx.arc(x + 160, h - 450, 110, Math.PI, 0);
      ctx.lineWidth = 25;
      ctx.strokeStyle = '#121019';
      ctx.stroke();
    }

    // Midground Layer (Speed 0.4)
    const midOffsetX = (camera.x * 0.4) % 1000;
    ctx.fillStyle = '#171420';
    for (let x = -midOffsetX - 1000; x < w + 1000; x += 480) {
      // Ancient Pharloom bell towers silhouette
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 50, h - 380);
      ctx.lineTo(x + 90, h - 440);
      ctx.lineTo(x + 130, h - 380);
      ctx.lineTo(x + 180, h);
      ctx.closePath();
      ctx.fill();

      // Hanging chains
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 90, 0);
      ctx.lineTo(x + 90, h - 440);
      ctx.stroke();
    }

    // Deep atmospheric mist gradient
    const mistGrad = ctx.createLinearGradient(0, h * 0.4, 0, h);
    mistGrad.addColorStop(0, 'rgba(10, 9, 14, 0)');
    mistGrad.addColorStop(1, 'rgba(18, 14, 24, 0.7)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    ctx.restore();
  }
}

window.GameWorld = GameWorld;

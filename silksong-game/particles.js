// Particle & Visual Effects Engine for Hollow Knight: Silksong

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.slashTrails = [];
    this.shockwaves = [];
    this.ambientSpores = [];
    this.silkRibbons = [];
    this.initAmbientSpores(120);
  }

  initAmbientSpores(count) {
    for (let i = 0; i < count; i++) {
      this.ambientSpores.push({
        x: Math.random() * 5000,
        y: Math.random() * 2000,
        radius: Math.random() * 2.2 + 0.8,
        color: Math.random() > 0.4 ? 'rgba(163, 209, 157, 0.4)' : 'rgba(244, 208, 111, 0.35)',
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.02 + Math.random() * 0.02
      });
    }
  }

  // Basic spark / burst particle
  createSparks(x, y, count = 12, color = '#f4d06f', speed = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: Math.random() * 3.5 + 1.5,
        color: color,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.03,
        gravity: 0.15
      });
    }
  }

  // Silk threads burst (when hitting enemies or binding silk)
  createSilkBurst(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        length: Math.random() * 18 + 8,
        color: '#f3f5f8',
        isThread: true,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
        friction: 0.94
      });
    }
  }

  // Hornet Needle Slash Arc Effect
  createSlashArc(x, y, dirX, dirY, type = 'normal') {
    this.slashTrails.push({
      x,
      y,
      dirX,
      dirY,
      type, // 'normal', 'up', 'pogo'
      life: 1.0,
      decay: 0.08, // fades in ~12 frames
      scale: type === 'pogo' ? 1.3 : 1.1,
      angle: type === 'pogo' ? (dirX > 0 ? 0.75 : 2.4) : (type === 'up' ? -Math.PI / 2 : (dirX > 0 ? 0 : Math.PI))
    });
  }

  // Ground shockwaves from boss slams or heavy pogo hits
  createShockwave(x, y, maxRadius = 90, color = 'rgba(212, 163, 115, 0.8)') {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 1,
      speed: 6.5
    });
  }

  // Silk Ribbon Trail for Dash
  addSilkRibbon(x, y, dir) {
    this.silkRibbons.push({
      x,
      y,
      dir,
      alpha: 0.8,
      decay: 0.045,
      width: 14
    });
  }

  // Healing cocoon particles (Silk Bind)
  createSilkBindAura(hornetX, hornetY) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 45 + Math.random() * 20;
      this.particles.push({
        x: hornetX + Math.cos(angle) * dist,
        y: hornetY + Math.sin(angle) * dist,
        targetX: hornetX,
        targetY: hornetY,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#f4d06f',
        isAura: true,
        alpha: 0.9,
        decay: 0.03
      });
    }
  }

  update() {
    // Regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.isAura) {
        // Move towards Hornet center
        p.x += (p.targetX - p.x) * 0.15;
        p.y += (p.targetY - p.y) * 0.15;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        if (p.friction) {
          p.vx *= p.friction;
          p.vy *= p.friction;
        }
      }
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Slash trails
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      const st = this.slashTrails[i];
      st.life -= st.decay;
      if (st.life <= 0) {
        this.slashTrails.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Silk ribbons
    for (let i = this.silkRibbons.length - 1; i >= 0; i--) {
      const r = this.silkRibbons[i];
      r.alpha -= r.decay;
      r.width *= 0.92;
      if (r.alpha <= 0) {
        this.silkRibbons.splice(i, 1);
      }
    }

    // Ambient spores update
    for (const spore of this.ambientSpores) {
      spore.phase += spore.phaseSpeed;
      spore.x += spore.vx + Math.sin(spore.phase) * 0.3;
      spore.y += spore.vy;
      if (spore.y < 0) spore.y = 2000;
      if (spore.x < 0) spore.x = 5000;
      if (spore.x > 5000) spore.x = 0;
    }
  }

  render(ctx, camera) {
    ctx.save();

    // 1. Render Ambient Spores (in world space)
    for (const s of this.ambientSpores) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      if (sx < -20 || sx > camera.width + 20 || sy < -20 || sy > camera.height + 20) continue;
      ctx.beginPath();
      ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }

    // 2. Render Silk Dash Ribbons
    for (const r of this.silkRibbons) {
      const rx = r.x - camera.x;
      const ry = r.y - camera.y;
      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(rx, ry, Math.max(0.5, r.width * 2), Math.max(0.5, r.width * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Shockwaves
    for (const sw of this.shockwaves) {
      const sx = sw.x - camera.x;
      const sy = sw.y - camera.y;
      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(0.5, sw.radius), Math.max(0.5, sw.radius * 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Slash Arcs (Silksong White Silk Blade Arc)
    for (const st of this.slashTrails) {
      const sx = st.x - camera.x;
      const sy = st.y - camera.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(st.angle);
      ctx.globalAlpha = st.life;

      // Arc geometry
      ctx.beginPath();
      const r = 48 * st.scale;
      ctx.arc(0, 0, r, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.lineWidth = 14 * st.life;
      ctx.strokeStyle = st.type === 'pogo' ? '#f4d06f' : '#ffffff';
      ctx.shadowColor = st.type === 'pogo' ? 'rgba(244, 208, 111, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 18;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Sharp inner white streak
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.96, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.lineWidth = 4 * st.life;
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      ctx.restore();
    }

    // 5. Render Particles / Threads
    for (const p of this.particles) {
      const px = p.x - camera.x;
      const py = p.y - camera.y;
      if (px < -30 || px > camera.width + 30 || py < -30 || py > camera.height + 30) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.isThread) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - p.vx * 2.5, py - p.vy * 2.5);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

window.particleEngine = new ParticleSystem();

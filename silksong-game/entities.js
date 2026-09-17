// Entities Engine: Hornet, Enemies, Projectiles & Boss for Silksong Web

// ================= HORNET =================
class Hornet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 54;
    this.vx = 0;
    this.vy = 0;

    // Movement attributes
    this.speed = 360;
    this.jumpForce = -640;
    this.gravity = 1400;
    this.dashSpeed = 820;
    this.facing = 1; // 1 = right, -1 = left

    // State machine
    this.isGrounded = false;
    this.isWallSliding = false;
    this.wallDir = 0; // -1 = left wall, 1 = right wall
    this.canDoubleJump = true;
    this.canDash = true;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;

    // Combat & Silk
    this.maxHealth = 5;
    this.health = 5;
    this.maxSilk = 8;
    this.silk = 3; // Start with some silk
    this.rosaries = 0;

    // Attacks
    this.isAttacking = false;
    this.attackType = 'normal'; // 'normal', 'up', 'pogo'
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackBox = null;

    // Silk Bind (Heal)
    this.isBinding = false;
    this.bindTimer = 0;
    this.bindDuration = 0.65;

    // Silk Harpoon (Needle Grapple Throw)
    this.isHarpooning = false;
    this.harpoon = null; // { x, y, targetX, targetY, isHooked, pullTimer }

    // Invulnerability & Hit flash
    this.invulnerableTimer = 0;
    this.isResting = false;
    this.isDead = false;

    // Animation variables
    this.animTime = 0;
    this.capeSway = 0;
  }

  update(dt, input, world, particleEngine, soundEngine) {
    if (this.isDead) return;

    this.animTime += dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Resting at bench
    if (this.isResting) {
      this.vx = 0;
      this.vy = 0;
      if (input.jump || input.left || input.right || input.attack) {
        this.isResting = false;
      }
      return;
    }

    // Handle Silk Binding (Healing)
    if (input.bind && this.isGrounded && this.silk >= 6 && this.health < this.maxHealth) {
      this.isBinding = true;
      this.bindTimer += dt;
      this.vx = 0;
      particleEngine.createSilkBindAura(this.x + this.w / 2, this.y + this.h / 2);

      if (this.bindTimer >= this.bindDuration) {
        // Heal complete!
        this.health = Math.min(this.maxHealth, this.health + 3);
        this.silk = 0;
        this.isBinding = false;
        this.bindTimer = 0;
        soundEngine.playSilkHeal();
        particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 35);
        particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h / 2, 80, '#f4d06f');
      }
      return;
    } else {
      if (this.isBinding && !input.bind) {
        this.isBinding = false;
        this.bindTimer = 0;
      }
    }

    // Handle Silk Harpoon zip pull
    if (this.isHarpooning && this.harpoon) {
      const h = this.harpoon;
      h.time += dt;
      if (h.isHooked) {
        const dx = h.hookX - (this.x + this.w / 2);
        const dy = h.hookY - (this.y + this.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist > 30 && h.time < 0.6) {
          this.vx = (dx / dist) * 950;
          this.vy = (dy / dist) * 950;
          particleEngine.addSilkRibbon(this.x + this.w / 2, this.y + this.h / 2, this.facing);
        } else {
          this.isHarpooning = false;
          this.harpoon = null;
          this.vy = -350; // Pop jump at end of grapple
        }
      } else {
        // Harpoon projectile flying
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        if (h.time > 0.35) {
          this.isHarpooning = false;
          this.harpoon = null;
        }
      }
    }

    // Handle Attack Action
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackBox = null;
      }
    }

    if (input.attack && !this.isAttacking && this.attackCooldown <= 0) {
      this.triggerAttack(input, particleEngine, soundEngine);
    }

    // Harpoon trigger
    if (input.harpoon && !this.isHarpooning && this.silk >= 1) {
      this.triggerHarpoon(soundEngine);
    }

    // Handle Dash Action
    if (input.dash && this.canDash && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 0.22;
      this.dashCooldown = 0.6;
      this.canDash = false;
      this.vy = 0;
      soundEngine.playDash();
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.facing * this.dashSpeed;
      this.vy = 0;
      particleEngine.addSilkRibbon(this.x + this.w / 2, this.y + this.h / 2, this.facing);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else if (!this.isHarpooning) {
      // Normal horizontal movement
      if (input.left) {
        this.vx = -this.speed;
        this.facing = -1;
      } else if (input.right) {
        this.vx = this.speed;
        this.facing = 1;
      } else {
        this.vx = 0;
      }

      // Gravity
      if (!this.isWallSliding) {
        this.vy += this.gravity * dt;
      } else {
        // Slow wall slide
        this.vy = Math.min(this.vy + this.gravity * dt * 0.3, 140);
      }

      // Jump & Wall Jump
      if (input.jump && (this.isGrounded || this.isWallSliding || this.canDoubleJump)) {
        if (this.isGrounded) {
          this.vy = this.jumpForce;
          this.isGrounded = false;
          soundEngine.playJump();
          particleEngine.createSparks(this.x + this.w / 2, this.y + this.h, 6, '#ffffff', 3);
        } else if (this.isWallSliding) {
          // Wall jump diagonally away
          this.vy = this.jumpForce * 0.95;
          this.vx = -this.wallDir * this.speed * 1.3;
          this.facing = -this.wallDir;
          this.isWallSliding = false;
          soundEngine.playJump();
          particleEngine.createSparks(this.x + (this.wallDir > 0 ? this.w : 0), this.y + this.h / 2, 8, '#ffffff', 4);
        } else if (this.canDoubleJump) {
          // Double jump with silk wings
          this.vy = this.jumpForce * 0.85;
          this.canDoubleJump = false;
          soundEngine.playJump();
          particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h, 10);
        }
        input.jump = false; // consume jump
      }
    }

    // Apply movement & resolve collisions with world
    this.moveAndCollide(dt, world, particleEngine, soundEngine);

    // Cape sway physics
    this.capeSway = Math.sin(this.animTime * 12) * (Math.abs(this.vx) > 10 ? 8 : 2);
  }

  triggerAttack(input, particleEngine, soundEngine) {
    this.isAttacking = true;
    this.attackTimer = 0.22;
    this.attackCooldown = 0.32;

    if (!this.isGrounded && input.down) {
      // Pogo: Silksong's signature 45-degree downward needle plunge!
      this.attackType = 'pogo';
      this.attackBox = {
        x: this.x + (this.facing > 0 ? 10 : -35),
        y: this.y + this.h - 5,
        w: 55,
        h: 40,
        type: 'pogo'
      };
      this.vy = 400;
      this.vx = this.facing * 200;
      soundEngine.playSlash('pogo');
      particleEngine.createSlashArc(this.x + this.w / 2 + this.facing * 20, this.y + this.h, this.facing, 1, 'pogo');
    } else if (input.up) {
      // Up slash
      this.attackType = 'up';
      this.attackBox = {
        x: this.x - 10,
        y: this.y - 35,
        w: 52,
        h: 45,
        type: 'up'
      };
      soundEngine.playSlash('up');
      particleEngine.createSlashArc(this.x + this.w / 2, this.y - 15, this.facing, -1, 'up');
    } else {
      // Normal forward needle slash
      this.attackType = 'normal';
      this.attackBox = {
        x: this.facing > 0 ? this.x + this.w - 5 : this.x - 45,
        y: this.y + 6,
        w: 50,
        h: 40,
        type: 'normal'
      };
      soundEngine.playSlash('normal');
      particleEngine.createSlashArc(this.x + this.w / 2 + this.facing * 25, this.y + this.h / 2, this.facing, 0, 'normal');
    }
  }

  triggerHarpoon(soundEngine) {
    this.isHarpooning = true;
    this.silk = Math.max(0, this.silk - 1);
    soundEngine.playHarpoon();
    const throwDir = this.facing;
    this.harpoon = {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2 - 6,
      vx: throwDir * 1100,
      vy: -100,
      targetX: null,
      targetY: null,
      isHooked: false,
      hookX: 0,
      hookY: 0,
      time: 0
    };
  }

  moveAndCollide(dt, world, particleEngine, soundEngine) {
    // 1. Horizontal Movement with contracted vertical hitbox (so floor is NEVER treated as a wall)
    this.x += this.vx * dt;
    const hBox = {
      x: this.x,
      y: this.y + 4,
      w: this.w,
      h: this.h - 10
    };
    let col = world.checkCollision(hBox);
    this.isWallSliding = false;
    this.wallDir = 0;

    if (col) {
      if (this.vx > 0) {
        this.x = col.x - this.w;
        if (!this.isGrounded && this.vy > 0) {
          this.isWallSliding = true;
          this.wallDir = 1;
        }
      } else if (this.vx < 0) {
        this.x = col.x + col.w;
        if (!this.isGrounded && this.vy > 0) {
          this.isWallSliding = true;
          this.wallDir = -1;
        }
      }
      this.vx = 0;
    }

    // World horizontal boundary clamp
    if (this.x < 35) this.x = 35;
    if (this.x > world.width - 60) this.x = world.width - 60;

    // 2. Vertical Movement with contracted horizontal hitbox
    this.y += this.vy * dt;
    const vBox = {
      x: this.x + 4,
      y: this.y,
      w: this.w - 8,
      h: this.h
    };
    col = world.checkCollision(vBox);

    if (col) {
      if (this.vy > 0) {
        this.y = col.y - this.h;
        this.isGrounded = true;
        this.canDoubleJump = true;
        this.canDash = true;
      } else if (this.vy < 0) {
        this.y = col.y + col.h;
      }
      this.vy = 0;
    } else {
      this.isGrounded = false;
    }

    // Hazard Spikes Collision
    const spikeCol = world.checkSpikeCollision(this);
    if (spikeCol) {
      // If doing downward pogo attack, bounce off spikes unharmed!
      if (this.isAttacking && this.attackType === 'pogo') {
        this.bouncePogo(particleEngine, soundEngine);
      } else {
        this.takeDamage(1, soundEngine, particleEngine);
        this.vy = -450;
        this.y -= 15;
      }
    }
  }

  // Pogo bounce upward
  bouncePogo(particleEngine, soundEngine) {
    this.vy = -620; // High bounce!
    this.canDoubleJump = true;
    this.canDash = true;
    this.attackTimer = 0;
    this.isAttacking = false;
    this.attackBox = null;
    soundEngine.playPogoClank();
    particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h, 60, '#f4d06f');
    particleEngine.createSparks(this.x + this.w / 2, this.y + this.h, 15, '#f4d06f', 7);
    this.gainSilk(1.5, soundEngine);
  }

  gainSilk(amount, soundEngine) {
    const prev = this.silk;
    this.silk = Math.min(this.maxSilk, this.silk + amount);
    if (this.silk > prev) {
      soundEngine.playSilkCollect();
    }
  }

  takeDamage(amount, soundEngine, particleEngine) {
    if (this.invulnerableTimer > 0 || this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 1.2;
    soundEngine.playPlayerHurt();
    particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 20, '#c72c41', 8);

    if (this.health <= 0) {
      this.isDead = true;
      soundEngine.playBossSlam();
    }
  }

  render(ctx, camera) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    ctx.save();

    // Invulnerability flicker
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 18) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Harpoon thread render if active
    if (this.isHarpooning && this.harpoon) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(rx + this.w / 2, ry + this.h / 2 - 8);
      ctx.lineTo(this.harpoon.x - camera.x, this.harpoon.y - camera.y);
      ctx.stroke();

      // Needle tip
      const tipX = this.harpoon.x - camera.x;
      const tipY = this.harpoon.y - camera.y;
      ctx.fillStyle = '#f3f5f8';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Flip context horizontally if facing left
    ctx.translate(rx + this.w / 2, ry + this.h / 2);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Silk Binding (Healing Cocoon Animation)
    if (this.isBinding) {
      ctx.save();
      ctx.strokeStyle = '#f4d06f';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(244, 208, 111, 0.9)';
      ctx.shadowBlur = 15;
      const cocoonProgress = this.bindTimer / this.bindDuration;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24 + cocoonProgress * 8, 30 + cocoonProgress * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Hornet's Flowing Crimson Cloak
    ctx.save();
    ctx.fillStyle = '#b71c1c';
    ctx.shadowColor = 'rgba(183, 28, 28, 0.7)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    // Neck collar
    ctx.moveTo(0, -10);
    // Front drape
    ctx.quadraticCurveTo(12, 10, 8, 24);
    // Cloak hem (with fluid sway)
    const hemBackX = -18 - (this.isDashing ? 14 : 0) + this.capeSway;
    ctx.quadraticCurveTo(-4, 28, hemBackX, 22);
    // Back drape
    ctx.quadraticCurveTo(-12, 4, 0, -10);
    ctx.closePath();
    ctx.fill();

    // Darker inner cloak fold
    ctx.fillStyle = '#7f0000';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(6, 12, 2, 22);
    ctx.lineTo(-6, 21);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Insectoid Legs (dangling or running)
    ctx.strokeStyle = '#1b1b1f';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (this.isGrounded && Math.abs(this.vx) > 20) {
      const legCycle = Math.sin(this.animTime * 18) * 8;
      // Front leg
      ctx.beginPath();
      ctx.moveTo(2, 18);
      ctx.lineTo(6 + legCycle, 27);
      ctx.stroke();
      // Back leg
      ctx.beginPath();
      ctx.moveTo(-4, 18);
      ctx.lineTo(-2 - legCycle, 27);
      ctx.stroke();
    } else {
      // Idle / Air legs
      ctx.beginPath();
      ctx.moveTo(2, 18);
      ctx.lineTo(4, 27);
      ctx.moveTo(-4, 18);
      ctx.lineTo(-2, 27);
      ctx.stroke();
    }

    // 3. Hornet's Porcelain Mask & Curved Horns
    ctx.save();
    ctx.fillStyle = '#f8f9fa';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    // Mask chin
    ctx.moveTo(2, -8);
    // Right cheek & horn
    ctx.quadraticCurveTo(10, -18, 12, -32);
    ctx.quadraticCurveTo(8, -26, 4, -18);
    // Mask forehead notch
    ctx.lineTo(0, -20);
    // Left cheek & horn
    ctx.lineTo(-4, -18);
    ctx.quadraticCurveTo(-8, -26, -12, -32);
    ctx.quadraticCurveTo(-10, -18, -2, -8);
    ctx.closePath();
    ctx.fill();

    // Hornet's Piercing Black Eyes
    ctx.fillStyle = '#0a090e';
    ctx.beginPath();
    ctx.ellipse(3, -14, 2.2, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-3, -14, 2.2, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Hornet's Needle Weapon
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5;

    if (this.isAttacking) {
      if (this.attackType === 'pogo') {
        // Angled 45 deg down
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.lineTo(24, 34);
        ctx.stroke();
      } else if (this.attackType === 'up') {
        // Pointed straight up
        ctx.beginPath();
        ctx.moveTo(2, -15);
        ctx.lineTo(4, -42);
        ctx.stroke();
      } else {
        // Pointed straight forward
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(38, -2);
        ctx.stroke();
      }
    } else {
      // Slung comfortably in hand / across back
      ctx.beginPath();
      ctx.moveTo(-14, 16);
      ctx.lineTo(16, -22);
      ctx.stroke();
      // Needle eyelet hole
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-13, 15, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }
}

// ================= BELL CRAWLER (MINERO DE CAMPANA) =================
class BellCrawler {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 46;
    this.h = 36;
    this.vx = 80;
    this.vy = 0;
    this.facing = 1;
    this.maxHealth = 40;
    this.health = 40;
    this.isDead = false;
    this.patrolLeft = x - 180;
    this.patrolRight = x + 180;
    this.hurtTimer = 0;
  }

  update(dt, world, player, particleEngine, soundEngine) {
    if (this.isDead) return;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    // Turn at edges or walls
    if (this.x <= this.patrolLeft) {
      this.facing = 1;
    } else if (this.x >= this.patrolRight) {
      this.facing = -1;
    }

    this.vx = this.facing * 75;
    this.x += this.vx * dt;

    // Apply simple gravity
    this.vy += 1200 * dt;
    this.y += this.vy * dt;
    const col = world.checkCollision(this);
    if (col) {
      this.y = col.y - this.h;
      this.vy = 0;
    }

    // Damage player on contact
    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine, particleEngine);
    }
  }

  takeHit(damage, fromX, isPogo, particleEngine, soundEngine) {
    // Frontal shield check: if hit from the front, bounce off carapace!
    const hitFromFront = (this.facing === 1 && fromX > this.x) || (this.facing === -1 && fromX < this.x);
    
    if (hitFromFront && !isPogo) {
      soundEngine.playPogoClank();
      particleEngine.createSparks(this.x + (this.facing > 0 ? this.w : 0), this.y + this.h / 2, 12, '#d4a373', 6);
      return false; // Carapace blocked!
    }

    this.health -= damage;
    this.hurtTimer = 0.2;
    soundEngine.playEnemyHit();
    particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 14);

    if (this.health <= 0) {
      this.isDead = true;
      particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 20, '#d4a373', 7);
    }
    return true;
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    ctx.save();
    if (this.hurtTimer > 0) {
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = '#2b2126';
    }

    // Beetle Carapace Shell
    ctx.beginPath();
    ctx.ellipse(rx + this.w / 2, ry + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brass Helmet / Shield Dome
    ctx.fillStyle = '#8a623a';
    ctx.beginPath();
    const shieldX = this.facing > 0 ? rx + this.w * 0.6 : rx + this.w * 0.4;
    ctx.arc(shieldX, ry + this.h * 0.45, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing Amber Eyes
    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 6;
    const eyeX = this.facing > 0 ? rx + this.w - 8 : rx + 8;
    ctx.beginPath();
    ctx.arc(eyeX, ry + 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ================= MOSS WEAVER DRONE (MOSCA TEJEDORA) =================
class MossWeaverDrone {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = 36;
    this.h = 32;
    this.maxHealth = 25;
    this.health = 25;
    this.isDead = false;
    this.time = Math.random() * Math.PI * 2;
    this.shootTimer = 2.0;
    this.hurtTimer = 0;
  }

  update(dt, player, projectiles, particleEngine, soundEngine) {
    if (this.isDead) return;
    this.time += dt * 3;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    // Hover floating
    this.y = this.baseY + Math.sin(this.time) * 22;

    // Target player & shoot silk dart
    this.shootTimer -= dt;
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    if (this.shootTimer <= 0 && distToPlayer < 480) {
      this.shootTimer = 2.4;
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      projectiles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: Math.cos(angle) * 320,
        vy: Math.sin(angle) * 320,
        radius: 5,
        isEnemy: true,
        life: 3.5
      });
      soundEngine.playSlash('normal');
      particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 6);
    }

    // Contact damage
    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine, particleEngine);
    }
  }

  takeHit(damage, particleEngine, soundEngine) {
    this.health -= damage;
    this.hurtTimer = 0.2;
    soundEngine.playEnemyHit();
    particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 16);

    if (this.health <= 0) {
      this.isDead = true;
      particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 22, '#588157', 7);
    }
    return true;
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    ctx.save();
    // Translucent Insectoid Wings
    ctx.fillStyle = 'rgba(163, 209, 157, 0.4)';
    const wingSpread = Math.sin(this.time * 6) * 12;
    ctx.beginPath();
    ctx.ellipse(rx + 8, ry - 6, 14, 6 + wingSpread, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rx + this.w - 8, ry - 6, 14, 6 - wingSpread, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Moss body
    ctx.fillStyle = this.hurtTimer > 0 ? '#fff' : '#283618';
    ctx.beginPath();
    ctx.ellipse(rx + this.w / 2, ry + this.h / 2, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moss spore markings
    ctx.fillStyle = '#a3d19d';
    ctx.beginPath();
    ctx.arc(rx + this.w / 2, ry + this.h / 2 - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ================= BOSS: STEEL BELL VANGUARD (VANGUARDIA DE CAMPANA) =================
class BellVanguardBoss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 78;
    this.h = 104;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    this.maxHealth = 280;
    this.health = 280;
    this.isDead = false;
    this.phase = 1; // 1 = Normal, 2 = Frenzy (under 140 HP)

    this.state = 'idle'; // 'idle', 'thrust', 'slam_jump', 'slam_fall', 'bell_spin'
    this.stateTimer = 1.5;
    this.hurtTimer = 0;
    this.isGrounded = true;
    this.spinShield = false;
  }

  update(dt, world, player, projectiles, particleEngine, soundEngine) {
    if (this.isDead) return;

    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    this.stateTimer -= dt;

    // Check Phase 2 transition
    if (this.phase === 1 && this.health <= 140) {
      this.phase = 2;
      soundEngine.playBossSlam();
      particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h, 150, '#c72c41');
      particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 35, '#c72c41', 9);
    }

    // Facing player
    if (this.state === 'idle') {
      this.facing = player.x > this.x ? 1 : -1;
    }

    // State Machine logic
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.spinShield = false;
        if (this.stateTimer <= 0) {
          // Choose next attack
          const dist = Math.abs(player.x - this.x);
          const rand = Math.random();

          if (rand < 0.45) {
            // Thrust across arena
            this.state = 'thrust';
            this.stateTimer = this.phase === 2 ? 0.6 : 0.8;
            this.vx = this.facing * (this.phase === 2 ? 650 : 520);
            soundEngine.playSlash('normal');
            particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 10, '#f4d06f', 5);
          } else if (rand < 0.8) {
            // Leap into air for Bell Ground Slam
            this.state = 'slam_jump';
            this.stateTimer = 0.5;
            this.vy = -750;
            this.vx = (player.x - this.x) * 1.2;
            soundEngine.playJump();
          } else {
            // Bell Spin (deflects & fires resonant ring projectiles)
            this.state = 'bell_spin';
            this.stateTimer = 1.4;
            this.spinShield = true;
            soundEngine.playBellStrike();
            particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h / 2, 100, '#d4a373');

            // Fire sound rings left & right
            [-1, 1].forEach(dir => {
              projectiles.push({
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                vx: dir * 380,
                vy: 0,
                radius: 12,
                isRing: true,
                isEnemy: true,
                life: 3.0
              });
            });
          }
        }
        break;

      case 'thrust':
        particleEngine.addSilkRibbon(this.x + this.w / 2, this.y + this.h / 2, this.facing);
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = this.phase === 2 ? 0.5 : 0.9;
        }
        break;

      case 'slam_jump':
        this.vy += 1200 * dt;
        if (this.vy > 100) {
          this.state = 'slam_fall';
          this.vy = 850; // fast downward slam
        }
        break;

      case 'slam_fall':
        // falling down
        break;

      case 'bell_spin':
        this.vx = 0;
        if (Math.random() < 0.25) {
          particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 4, '#d4a373', 4);
        }
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.spinShield = false;
          this.stateTimer = this.phase === 2 ? 0.4 : 0.8;
        }
        break;
    }

    // World movement & gravity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.state !== 'slam_fall' && this.state !== 'slam_jump') {
      this.vy += 1300 * dt;
    }

    const col = world.checkCollision(this);
    if (col) {
      if (this.vy > 0) {
        this.y = col.y - this.h;
        this.vy = 0;
        this.isGrounded = true;

        if (this.state === 'slam_fall') {
          // SLAM IMPACT! Create double ground shockwaves
          this.state = 'idle';
          this.stateTimer = 0.7;
          soundEngine.playBossSlam();
          particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h, 160, '#d4a373');

          // Ground shockwave projectiles
          [-1, 1].forEach(dir => {
            projectiles.push({
              x: this.x + this.w / 2,
              y: this.y + this.h - 14,
              vx: dir * 420,
              vy: 0,
              radius: 14,
              isShockwave: true,
              isEnemy: true,
              life: 1.8
            });
          });
        }
      }
    }

    // Contact damage to player
    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine, particleEngine);
    }
  }

  takeHit(damage, particleEngine, soundEngine) {
    if (this.isDead) return false;

    if (this.spinShield) {
      // Bell spin blocks attacks!
      soundEngine.playPogoClank();
      particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 15, '#d4a373', 7);
      return false;
    }

    this.health -= damage;
    this.hurtTimer = 0.18;
    soundEngine.playEnemyHit();
    particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 16);

    if (this.health <= 0) {
      this.isDead = true;
      soundEngine.playBossSlam();
      particleEngine.createShockwave(this.x + this.w / 2, this.y + this.h / 2, 220, '#f4d06f');
      particleEngine.createSilkBurst(this.x + this.w / 2, this.y + this.h / 2, 50);
      particleEngine.createSparks(this.x + this.w / 2, this.y + this.h / 2, 45, '#d4a373', 10);
    }
    return true;
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const rx = this.x - camera.x;
    const ry = this.y - camera.y;

    ctx.save();
    ctx.translate(rx + this.w / 2, ry + this.h / 2);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Boss hurt flash
    const isHurt = this.hurtTimer > 0;

    // 1. Heavy Armored Insect Body
    ctx.fillStyle = isHurt ? '#fff' : (this.phase === 2 ? '#241219' : '#1a161f');
    ctx.beginPath();
    ctx.ellipse(0, 10, this.w * 0.45, this.h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Brass Plate Armor
    ctx.fillStyle = isHurt ? '#fff' : '#734d28';
    ctx.beginPath();
    ctx.arc(0, -12, 26, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = this.phase === 2 ? '#ff5252' : '#d4a373';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Ornate Horned Bell Helmet
    ctx.fillStyle = isHurt ? '#fff' : '#8a623a';
    ctx.beginPath();
    ctx.moveTo(-22, -25);
    ctx.lineTo(22, -25);
    ctx.lineTo(28, -48);
    ctx.lineTo(0, -56);
    ctx.lineTo(-28, -48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Glowing Visor Slit
    ctx.fillStyle = this.phase === 2 ? '#ff2a2a' : '#ffb703';
    ctx.shadowColor = this.phase === 2 ? '#ff2a2a' : '#ffb703';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.fillRect(4, -38, 14, 5);

    // 5. Massive Bell Lance Staff
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.lineTo(45, -20);
    ctx.stroke();

    // Great Bell Head on Staff
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.arc(52, -26, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spin shield visual
    if (this.spinShield) {
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.Hornet = Hornet;
window.BellCrawler = BellCrawler;
window.MossWeaverDrone = MossWeaverDrone;
window.BellVanguardBoss = BellVanguardBoss;

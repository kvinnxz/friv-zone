// ==========================================================================
// ENTITIES: Jugador (Mario), Enemigos (Goomba), Efectos y Partículas
// ==========================================================================

class Player {
    constructor(game, x = 40, y = 192) {
        this.game = game;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.w = 12;            // Hitbox precisa estilo NES
        this.h = 16;
        this.vx = 0;
        this.vy = 0;
        this.facing = 'right';
        this.grounded = false;
        this.skidding = false;
        
        // Estado de salto dinámico
        this.jumpTimer = 0;
        this.isJumping = false;
        this.canJump = true;

        // Estados especiales
        this.dead = false;
        this.deadTimer = 0;
        this.flagSliding = false;
        this.flagFinished = false;
        this.walkingToCastle = false;
        this.animTicks = 0;
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.deadTimer = 90;
        this.vy = -6.2;
        this.vx = 0;
        window.retroAudio.playDie();
        this.game.lives--;
        this.game.updateHUD();
    }

    bounceFromStomp() {
        this.vy = -4.2;
        this.jumpTimer = 6;
        this.isJumping = true;
    }

    onCeilingHit(tileX, tileY) {
        // Al chocar contra el techo, interactuar con el bloque
        this.game.level.hitBlock(tileX, tileY, this);
    }

    update(input) {
        // Lógica de muerte
        if (this.dead) {
            this.deadTimer--;
            this.y += this.vy;
            this.vy += 0.26;
            if (this.deadTimer <= 0) {
                if (this.game.lives > 0) {
                    this.game.restartAfterDeath();
                } else {
                    this.game.triggerGameOver();
                }
            }
            return;
        }

        // Lógica de cinemática de bandera al ganar
        if (this.flagSliding) {
            if (this.y < 192) {
                this.y += 2.0;
            } else {
                this.flagSliding = false;
                this.walkingToCastle = true;
                this.facing = 'right';
            }
            return;
        }

        if (this.walkingToCastle) {
            this.vx = 1.2;
            this.x += this.vx;
            this.animTicks++;
            PhysicsEngine.resolveMapCollisions(this, this.game.level);
            if (this.x >= this.game.level.castleDoorX) {
                this.walkingToCastle = false;
                this.game.triggerVictory();
            }
            return;
        }

        const P = window.PHYSICS;
        const isRunning = input.run;
        const maxSpeed = isRunning ? P.MAX_RUN_SPEED : P.MAX_WALK_SPEED;
        const accel = isRunning ? P.RUN_ACCEL : P.ACCEL;

        // 1. Controles Horizontales (Izquierda / Derecha)
        this.skidding = false;
        if (input.left && !input.right) {
            this.facing = 'left';
            if (this.vx > 0.3 && this.grounded) {
                // Derrape brusco hacia la izquierda
                this.vx -= P.SKID_DECEL;
                this.skidding = true;
            } else {
                this.vx = Math.max(-maxSpeed, this.vx - accel);
            }
        } else if (input.right && !input.left) {
            this.facing = 'right';
            if (this.vx < -0.3 && this.grounded) {
                // Derrape brusco hacia la derecha
                this.vx += P.SKID_DECEL;
                this.skidding = true;
            } else {
                this.vx = Math.min(maxSpeed, this.vx + accel);
            }
        } else {
            // Fricción al soltar teclas
            if (this.grounded) {
                this.vx *= P.FRICTION;
                if (Math.abs(this.vx) < 0.05) this.vx = 0;
            } else {
                this.vx *= P.AIR_DRAG;
            }
        }

        // 2. Sistema de Salto Dinámico y Variable estilo NES
        if (input.jump) {
            if (this.grounded && this.canJump) {
                // Inicio del impulso de salto
                this.vy = P.INITIAL_JUMP_FORCE;
                this.grounded = false;
                this.isJumping = true;
                this.jumpTimer = P.MAX_JUMP_FRAMES;
                this.canJump = false;
                window.retroAudio.playJump();
            } else if (this.isJumping && this.jumpTimer > 0) {
                // Mantener botón prolonga el impulso vertical
                this.vy += P.JUMP_HOLD_BOOST;
                this.jumpTimer--;
            }
        } else {
            // Si el jugador suelta el botón antes, el salto se corta suavemente
            this.isJumping = false;
            this.jumpTimer = 0;
            if (this.grounded) {
                this.canJump = true;
            }
        }

        // 3. Aplicación de Gravedad
        if (!this.grounded) {
            // Gravedad aumentada al caer o si no sostiene el salto
            const currentGravity = (this.vy > 0 || !input.jump) ? P.FALL_GRAVITY : P.GRAVITY;
            this.vy = Math.min(P.MAX_FALL_SPEED, this.vy + currentGravity);
        }

        // 4. Resolución de Colisiones AABB con el Nivel
        PhysicsEngine.resolveMapCollisions(this, this.game.level);

        // Evitar que Mario retroceda fuera del campo visible de la cámara
        if (this.x < this.game.cameraX) {
            this.x = this.game.cameraX;
            if (this.vx < 0) this.vx = 0;
        }

        // Caída al vacío (fosos)
        if (this.y > 240) {
            this.die();
        }

        // Ticks de animación
        if (this.grounded && Math.abs(this.vx) > 0.1) {
            this.animTicks += Math.abs(this.vx) * 0.7;
        }
    }

    render(ctx, cameraX) {
        const renderX = Math.round(this.x - cameraX - 2);
        const renderY = Math.round(this.y);
        const flip = (this.facing === 'left');

        if (this.dead) {
            window.sprites.draw(ctx, 'mario_die', renderX, renderY, false);
            return;
        }

        if (!this.grounded) {
            // Sprite en el aire
            window.sprites.draw(ctx, 'mario_jump', renderX, renderY, flip);
        } else if (this.skidding) {
            // Sprite derrapando
            window.sprites.draw(ctx, 'mario_skid', renderX, renderY, flip);
        } else if (Math.abs(this.vx) > 0.15) {
            // Animación de carrera (2 fotogramas)
            const frame = Math.floor(this.animTicks / 6) % 2;
            window.sprites.draw(ctx, `mario_run_${frame}`, renderX, renderY, flip);
        } else {
            // Sprite en reposo
            window.sprites.draw(ctx, 'mario_idle', renderX, renderY, flip);
        }
    }
}

// ==========================================================================
// ENEMIGO: Goomba Clásico con IA de Patrulla y Aplastamiento
// ==========================================================================
class Goomba {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = -0.55;         // Velocidad de patrulla horizontal
        this.vy = 0;
        this.grounded = false;
        this.squashed = false;
        this.squashTimer = 0;
        this.dead = false;
        this.active = false;
        this.animTicks = Math.floor(Math.random() * 10);
    }

    onWallHit(side) {
        // Al chocar contra una tubería o muro, invierte de marcha
        if (side === 'left') {
            this.vx = Math.abs(this.vx);
        } else if (side === 'right') {
            this.vx = -Math.abs(this.vx);
        }
    }

    squash() {
        if (this.squashed || this.dead) return;
        this.squashed = true;
        this.squashTimer = 30; // Mostrar aplastado durante 0.5 segundos
        this.vx = 0;
        this.vy = 0;
        window.retroAudio.playStomp();
        this.game.addScore(100, this.x + 8, this.y);
    }

    update() {
        if (this.dead) return;

        // Activar al entrar en el rango de la cámara
        if (!this.active) {
            if (this.x < this.game.cameraX + 280) {
                this.active = true;
            } else {
                return;
            }
        }

        if (this.squashed) {
            this.squashTimer--;
            if (this.squashTimer <= 0) {
                this.dead = true;
            }
            return;
        }

        // Aplicar gravedad al Goomba
        if (!this.grounded) {
            this.vy = Math.min(6.0, this.vy + window.PHYSICS.GRAVITY);
        }

        // Movimiento y colisión AABB con el entorno
        PhysicsEngine.resolveMapCollisions(this, this.game.level);

        // Caída por fosos
        if (this.y > 250) {
            this.dead = true;
        }

        this.animTicks++;
    }

    render(ctx, cameraX) {
        if (this.dead || !this.active) return;
        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);

        if (this.squashed) {
            window.sprites.draw(ctx, 'goomba_flat', renderX, renderY);
        } else {
            const frame = Math.floor(this.animTicks / 12) % 2;
            window.sprites.draw(ctx, `goomba_${frame}`, renderX, renderY);
        }
    }
}

// ==========================================================================
// PARTÍCULAS Y EFECTOS VISUALES
// ==========================================================================

// Moneda que salta del bloque '?'
class CoinPop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.vy = -4.5;
        this.dead = false;
        this.animTicks = 0;
    }

    update() {
        this.y += this.vy;
        this.vy += 0.35; // Gravedad
        this.animTicks++;
        if (this.vy > 0 && this.y >= this.startY - 4) {
            this.dead = true;
        }
    }

    render(ctx, cameraX) {
        if (this.dead) return;
        const frame = Math.floor(this.animTicks / 4) % 3;
        window.sprites.draw(ctx, `coin_${frame}`, this.x - cameraX, this.y);
    }
}

// Bloque rebotando al ser golpeado desde abajo
class BouncingBlock {
    constructor(tileX, tileY, spriteKey) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.x = tileX * 16;
        this.y = tileY * 16;
        this.startY = this.y;
        this.offsetY = 0;
        this.vy = -2.8;
        this.spriteKey = spriteKey;
        this.dead = false;
    }

    update() {
        this.offsetY += this.vy;
        this.vy += 0.45;
        if (this.offsetY >= 0) {
            this.offsetY = 0;
            this.dead = true;
        }
    }

    render(ctx, cameraX) {
        window.sprites.draw(ctx, this.spriteKey, this.x - cameraX, this.y + this.offsetY);
    }
}

// Texto de puntos flotantes (+100, +200)
class FloatingScore {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.life = 40;
    }

    update() {
        this.y -= 0.6;
        this.life--;
    }

    render(ctx, cameraX) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.text, Math.round(this.x - cameraX), Math.round(this.y));
        ctx.restore();
    }
}

window.Player = Player;
window.Goomba = Goomba;
window.CoinPop = CoinPop;
window.BouncingBlock = BouncingBlock;
window.FloatingScore = FloatingScore;

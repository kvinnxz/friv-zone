// Main Game Loop, Player Entity, and Game State Management for Super Mario Bros

class Mario {
    constructor(game) {
        this.game = game;
        this.reset(40, 192);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = 16;
        this.h = 16;
        this.facing = 'right';
        this.grounded = false;
        this.isSuper = false;
        this.isGrowing = false;
        this.growthTimer = 0;
        this.invulnerable = 0;
        this.dead = false;
        this.deadTimer = 0;
        this.animTicks = 0;
        this.skidding = false;
        this.flagSliding = false;
        this.walkingToCastle = false;
    }

    grow() {
        if (!this.isSuper) {
            this.isSuper = true;
            this.isGrowing = true;
            this.growthTimer = 35;
            this.h = 32;
            this.y -= 16;
            window.sounds.playPowerup();
            this.game.addScore(1000, this.x + 8, this.y);
        }
    }

    shrink() {
        this.isSuper = false;
        this.isGrowing = true;
        this.growthTimer = 35;
        this.h = 16;
        this.invulnerable = 120; // 2 seconds of invulnerability
        window.sounds.playPipe();
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.deadTimer = 90;
        this.vy = -6.5;
        this.vx = 0;
        window.sounds.playDie();
        this.game.lives--;
        this.game.updateHUD();
    }

    update(keys) {
        if (this.dead) {
            this.deadTimer--;
            this.y += this.vy;
            this.vy += 0.28;
            if (this.deadTimer <= 0) {
                if (this.game.lives > 0) {
                    this.game.restartLife();
                } else {
                    this.game.setState('GAMEOVER');
                }
            }
            return;
        }

        if (this.growthTimer > 0) {
            this.growthTimer--;
            if (this.growthTimer === 0) this.isGrowing = false;
            return; // Pause movement during powerup growth flash
        }

        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        // Flagpole celebration automation
        if (this.flagSliding) {
            if (this.y < this.game.level.flagpole.y + this.game.level.flagpole.height - this.h) {
                this.y += 2.5;
                this.game.level.flagpole.flagY = Math.min(
                    this.game.level.flagpole.y + this.game.level.flagpole.height - 16,
                    this.game.level.flagpole.flagY + 2.5
                );
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
            this.grounded = true;
            if (this.x >= this.game.level.castle.x + 20) {
                this.walkingToCastle = false;
                this.game.setState('WIN');
            }
            return;
        }

        // Standard Gameplay Input & Movement
        const accel = keys.run ? 0.22 : 0.14;
        const maxSpeed = keys.run ? 3.4 : 2.2;
        const friction = this.grounded ? 0.84 : 0.94;

        this.skidding = false;

        if (keys.left) {
            if (this.vx > 0.6 && this.grounded) {
                this.skidding = true;
                this.vx -= accel * 2.2;
                if (Math.random() < 0.3) {
                    this.game.particles.push(new Particle(this.x + 8, this.y + this.h, 0.5, -0.5, 'dust'));
                }
            } else {
                this.vx -= accel;
                this.facing = 'left';
            }
        } else if (keys.right) {
            if (this.vx < -0.6 && this.grounded) {
                this.skidding = true;
                this.vx += accel * 2.2;
                if (Math.random() < 0.3) {
                    this.game.particles.push(new Particle(this.x + 8, this.y + this.h, -0.5, -0.5, 'dust'));
                }
            } else {
                this.vx += accel;
                this.facing = 'right';
            }
        } else {
            this.vx *= friction;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
        }

        // Clamp speed
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;

        // Jump physics (variable height)
        if (keys.jump && this.grounded && !this.jumpConsumed) {
            this.vy = -5.8;
            this.grounded = false;
            this.jumpConsumed = true;
            window.sounds.playJump(this.isSuper);
        }

        if (!keys.jump) {
            this.jumpConsumed = false;
            if (this.vy < -2.2) {
                this.vy = -2.2; // Cut jump short if button released
            }
        }

        // Apply gravity
        this.vy += 0.35;
        if (this.vy > 4.8) this.vy = 4.8;

        // Prevent moving left past the camera
        if (this.x < this.game.cameraX) {
            this.x = this.game.cameraX;
            this.vx = Math.max(0, this.vx);
        }

        // Resolve tile physics
        window.Physics.updateEntityTiles(this, this.game.level, true);

        // Check if Mario fell down a pit
        if (this.y > 250) {
            this.die();
            return;
        }

        // Check Items Collision (Mushroom)
        for (let i = this.game.level.items.length - 1; i >= 0; i--) {
            const item = this.game.level.items[i];
            if (window.Physics.AABB(this, item)) {
                this.grow();
                item.dead = true;
            }
        }

        // Check Enemies Collision
        for (const enemy of this.game.level.enemies) {
            if (enemy.dead) continue;

            if (window.Physics.AABB(this, enemy)) {
                // Stomp check: Mario is falling and his bottom half lands in enemy upper section
                const isFalling = this.vy > 0;
                const hitFromTop = (this.y + this.h - this.vy) <= (enemy.y + enemy.h * 0.6);

                if (isFalling && hitFromTop) {
                    this.vy = keys.jump ? -5.5 : -3.8; // higher bounce if holding jump
                    enemy.stomp(this);
                } else {
                    // Koopa shell kick check if shell is motionless
                    if (enemy instanceof window.Koopa && enemy.isShell && !enemy.shellSliding) {
                        const kickDir = this.x < enemy.x ? 1 : -1;
                        enemy.kick(kickDir, this);
                    } else if (this.invulnerable <= 0) {
                        // Damage Mario
                        if (this.isSuper) {
                            this.shrink();
                        } else {
                            this.die();
                        }
                    }
                }
            }
        }

        // Check Flagpole Collision
        const flag = this.game.level.flagpole;
        if (!flag.reached && this.x + this.w >= flag.x && this.x <= flag.x + 8) {
            flag.reached = true;
            this.flagSliding = true;
            this.vx = 0;
            this.vy = 0;
            this.x = flag.x - 6;
            window.sounds.playStageClear();
            this.game.addScore(1500, flag.x, this.y);
        }

        // Animation counter
        if (Math.abs(this.vx) > 0.1 && this.grounded) {
            this.animTicks += Math.abs(this.vx) * 0.45;
        }
    }

    render(ctx, cameraX) {
        if (this.dead) {
            const dieSpr = window.sprites.get('mario_die');
            if (dieSpr) {
                ctx.drawImage(dieSpr, Math.round(this.x - cameraX), Math.round(this.y));
            }
            return;
        }

        // Flashing visibility during invulnerability or growth
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 4) % 2 === 0) {
            return;
        }

        const prefix = this.isSuper ? 'super_mario_' : 'mario_';
        let sprName = 'idle';

        if (!this.grounded) {
            sprName = 'jump';
        } else if (this.skidding) {
            sprName = 'skid';
        } else if (Math.abs(this.vx) > 0.1) {
            const frame = Math.floor(this.animTicks % 3);
            sprName = `run_${frame}`;
        }

        const spr = window.sprites.get(`${prefix}${sprName}`) || window.sprites.get(`${prefix}idle`);
        if (!spr) return;

        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);

        ctx.save();
        if (this.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(spr, -renderX - 16, renderY);
        } else {
            ctx.drawImage(spr, renderX, renderY);
        }
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.state = 'TITLE'; // TITLE, PLAYING, PAUSED, WIN, GAMEOVER
        this.cameraX = 0;
        this.gameTicks = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.timeTimer = 0;

        this.particles = [];
        this.keys = { left: false, right: false, up: false, down: false, jump: false, run: false };

        this.level = new window.Level(this);
        this.player = new Mario(this);

        this.setupInputs();
        this.setupUI();
        this.updateHUD();

        this.lastTime = 0;
        requestAnimationFrame((time) => this.loop(time));
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyZ') this.keys.jump = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') this.keys.run = true;

            // Start game or pause
            if (this.state === 'TITLE' && (e.code === 'Enter' || e.code === 'Space')) {
                this.startGame();
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyZ') this.keys.jump = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') this.keys.run = false;
        });

        // Touch & Virtual Gamepad buttons
        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const press = (e) => {
                e.preventDefault();
                this.keys[key] = true;
                if (this.state === 'TITLE') this.startGame();
            };
            const release = (e) => {
                e.preventDefault();
                this.keys[key] = false;
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        };

        bindBtn('btnLeft', 'left');
        bindBtn('btnRight', 'right');
        bindBtn('btnA', 'jump');
        bindBtn('btnB', 'run');
    }

    setupUI() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const muted = window.sounds.toggleMute();
                muteBtn.textContent = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
            });
        }

        const restartBtns = document.querySelectorAll('.restart-btn');
        restartBtns.forEach(btn => {
            btn.addEventListener('click', () => this.resetGame());
        });

        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause());
        }
    }

    startGame() {
        window.sounds.init();
        window.sounds.startMusic();
        this.state = 'PLAYING';
        document.getElementById('titleScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('winScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            window.sounds.stopMusic();
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            window.sounds.startMusic();
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }

    setState(newState) {
        this.state = newState;
        if (newState === 'GAMEOVER') {
            window.sounds.stopMusic();
            document.getElementById('gameOverScreen').classList.remove('hidden');
        } else if (newState === 'WIN') {
            document.getElementById('winScreen').classList.remove('hidden');
        }
    }

    restartLife() {
        this.player.reset(this.cameraX + 40, 192);
    }

    resetGame() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.time = 400;
        this.cameraX = 0;
        this.particles = [];
        this.level = new window.Level(this);
        this.player = new Mario(this);
        this.updateHUD();
        this.startGame();
    }

    addScore(amount, x, y) {
        this.score += amount;
        this.updateHUD();
        if (x !== undefined && y !== undefined) {
            this.particles.push(new Particle(x, y, 0, -1.2, 'score', `+${amount}`));
        }
    }

    addCoin() {
        this.coins++;
        if (this.coins >= 100) {
            this.coins = 0;
            this.lives++;
            window.sounds.playPowerup();
            this.particles.push(new Particle(this.player.x, this.player.y, 0, -1.2, 'score', '1UP'));
        }
        this.updateHUD();
    }

    updateHUD() {
        const hudScore = document.getElementById('hudScore');
        const hudCoins = document.getElementById('hudCoins');
        const hudWorld = document.getElementById('hudWorld');
        const hudTime = document.getElementById('hudTime');
        const hudLives = document.getElementById('hudLives');

        if (hudScore) hudScore.textContent = String(this.score).padStart(6, '0');
        if (hudCoins) hudCoins.textContent = `x${String(this.coins).padStart(2, '0')}`;
        if (hudWorld) hudWorld.textContent = '1-1';
        if (hudTime) hudTime.textContent = String(Math.floor(this.time)).padStart(3, '0');
        if (hudLives) hudLives.textContent = `x${this.lives}`;
    }

    update() {
        this.gameTicks++;

        if (this.state === 'PLAYING') {
            // Decrement level timer
            this.timeTimer++;
            if (this.timeTimer >= 60) {
                this.timeTimer = 0;
                this.time = Math.max(0, this.time - 1);
                this.updateHUD();
                if (this.time === 0) {
                    this.player.die();
                }
            }

            // Update player
            this.player.update(this.keys);

            // Camera follow (only scrolls forward, never backwards)
            const targetCamX = this.player.x - 110;
            if (targetCamX > this.cameraX) {
                this.cameraX = targetCamX;
            }

            // Check enemy spawns near camera view
            this.level.checkEnemySpawns(this.cameraX);

            // Update level & entities
            this.level.update();

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const alive = this.particles[i].update();
                if (!alive) this.particles.splice(i, 1);
            }
        }
    }

    render() {
        // Clear background sky blue
        this.ctx.fillStyle = '#6B8CFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render level tiles, scenery, flagpole, enemies, items
        this.level.render(this.ctx, this.cameraX);

        // Render Mario
        this.player.render(this.ctx, this.cameraX);

        // Render Particles
        for (const p of this.particles) {
            p.render(this.ctx, this.cameraX);
        }
    }

    loop(time) {
        this.update();
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

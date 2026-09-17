// Level definition, tilemap representation, and scenery for World 1-1

class Level {
    constructor(game) {
        this.game = game;
        this.tileSize = 16;
        this.widthInTiles = 220;
        this.heightInTiles = 15; // 240px / 16px = 15 tiles
        this.tiles = [];
        this.bumpingBlocks = [];
        this.scenery = [];
        this.enemies = [];
        this.items = [];
        this.flagpole = { x: 198 * 16, y: 3 * 16, height: 10 * 16, flagY: 3 * 16, reached: false };
        this.castle = { x: 204 * 16, y: 7 * 16 };

        this.initMap();
        this.buildWorld1_1();
    }

    initMap() {
        this.tiles = Array(this.heightInTiles).fill(null).map(() => Array(this.widthInTiles).fill(0));
    }

    setTile(tx, ty, id) {
        if (ty >= 0 && ty < this.heightInTiles && tx >= 0 && tx < this.widthInTiles) {
            this.tiles[ty][tx] = id;
        }
    }

    getTile(tx, ty) {
        if (ty >= 0 && ty < this.heightInTiles && tx >= 0 && tx < this.widthInTiles) {
            return this.tiles[ty][tx];
        }
        return 0;
    }

    isSolidTile(tx, ty) {
        const t = this.getTile(tx, ty);
        // Solid tiles: 1 (ground), 2 (brick), 3 (question_coin), 4 (question_mush), 5 (empty_block), 6 (stone), 7-10 (pipes)
        return (t >= 1 && t <= 10) || t === 11;
    }

    buildWorld1_1() {
        // Scenery elements
        const addCloud = (x, y) => this.scenery.push({ type: 'cloud', x: x * 16, y: y * 16 });
        const addBush = (x, y) => this.scenery.push({ type: 'bush', x: x * 16, y: y * 16 });
        const addHill = (x, y) => this.scenery.push({ type: 'hill', x: x * 16, y: y * 16 });

        // Clouds, hills & bushes in background
        for (let x = 0; x < 210; x += 48) {
            addCloud(x + 8, 3);
            addCloud(x + 20, 2);
            addCloud(x + 36, 3);
            addHill(x, 11);
            addHill(x + 16, 12);
            addBush(x + 11, 12);
            addBush(x + 23, 12);
            addBush(x + 41, 12);
        }

        // Base ground from tile 0 to 215, with classic pits at 69-71, 86-88, 153-155
        const pits = [[69, 71], [86, 89], [153, 155]];
        for (let x = 0; x < this.widthInTiles; x++) {
            let isPit = pits.some(([start, end]) => x >= start && x <= end);
            if (!isPit) {
                this.setTile(x, 13, 1); // ground top
                this.setTile(x, 14, 1); // ground bottom
            }
        }

        // Helper to place pipes
        const addPipe = (tx, height) => {
            const topY = 13 - height;
            this.setTile(tx, topY, 7); // pipe top left
            this.setTile(tx + 1, topY, 8); // pipe top right
            for (let y = topY + 1; y < 13; y++) {
                this.setTile(tx, y, 9); // pipe body left
                this.setTile(tx + 1, y, 10); // pipe body right
            }
        };

        // Standard Pipes
        addPipe(28, 2);
        addPipe(38, 3);
        addPipe(46, 4);
        addPipe(57, 4);
        addPipe(163, 2);
        addPipe(179, 2);

        // Blocks Setup
        // First ? block
        this.setTile(16, 9, 3); // question coin

        // Brick and ? block cluster 1
        this.setTile(20, 9, 2); // brick
        this.setTile(21, 9, 4); // question mushroom
        this.setTile(22, 9, 2); // brick
        this.setTile(23, 9, 3); // question coin
        this.setTile(24, 9, 2); // brick

        // Elevated single ? block
        this.setTile(22, 5, 3);

        // Row of bricks and hidden items
        this.setTile(64, 9, 2);
        this.setTile(65, 9, 4); // super mushroom!
        this.setTile(66, 9, 2);

        // High floating platform with coins
        for (let x = 77; x <= 84; x++) {
            this.setTile(x, 5, 2);
        }
        for (let x = 80; x <= 87; x++) {
            this.setTile(x, 9, 2);
        }
        this.setTile(88, 9, 3); // question block
        this.setTile(89, 9, 2);

        // Bricks with coins and question marks
        this.setTile(94, 9, 2);
        this.setTile(95, 9, 3);
        this.setTile(96, 9, 2);
        this.setTile(100, 5, 3);
        this.setTile(101, 5, 3);
        this.setTile(106, 9, 3);
        this.setTile(109, 9, 4); // mushroom

        // Floating multi-level bricks
        for (let x = 118; x <= 120; x++) this.setTile(x, 9, 2);
        for (let x = 121; x <= 123; x++) this.setTile(x, 5, 2);
        for (let x = 128; x <= 130; x++) this.setTile(x, 5, 2);
        this.setTile(129, 9, 2);

        // Staircases before pit (Stone blocks)
        const addStaircase = (startX, height, direction = 'up') => {
            for (let step = 0; step < height; step++) {
                const tx = direction === 'up' ? startX + step : startX + (height - 1 - step);
                for (let y = 12; y >= 13 - (step + 1); y--) {
                    this.setTile(tx, y, 6); // stone
                }
            }
        };

        addStaircase(134, 4, 'up');
        addStaircase(140, 4, 'down');

        addStaircase(148, 4, 'up');
        addStaircase(155, 4, 'down');

        // Final giant staircase to flagpole
        for (let step = 0; step < 8; step++) {
            const tx = 181 + step;
            for (let y = 12; y >= 13 - (step + 1); y--) {
                this.setTile(tx, y, 6);
            }
        }
        // Flag base stone block
        this.setTile(198, 12, 6);

        // Castle setup at x=204
        for (let y = 7; y <= 12; y++) {
            for (let x = 202; x <= 208; x++) {
                this.setTile(x, y, 11); // castle brick
            }
        }
        // Castle doorway
        this.setTile(205, 11, 12);
        this.setTile(205, 12, 12);

        // Initial Enemies
        this.enemySpawns = [
            { type: 'goomba', x: 22 * 16, y: 12 * 16 },
            { type: 'goomba', x: 41 * 16, y: 12 * 16 },
            { type: 'goomba', x: 51 * 16, y: 12 * 16 },
            { type: 'goomba', x: 53 * 16, y: 12 * 16 },
            { type: 'koopa',  x: 82 * 16, y: 4 * 16 },
            { type: 'goomba', x: 97 * 16, y: 12 * 16 },
            { type: 'goomba', x: 99 * 16, y: 12 * 16 },
            { type: 'koopa',  x: 107 * 16, y: 12 * 16 },
            { type: 'goomba', x: 124 * 16, y: 12 * 16 },
            { type: 'goomba', x: 126 * 16, y: 12 * 16 },
            { type: 'goomba', x: 170 * 16, y: 12 * 16 },
            { type: 'goomba', x: 172 * 16, y: 12 * 16 },
            { type: 'koopa',  x: 177 * 16, y: 12 * 16 }
        ];
    }

    // Activate enemies when Mario nears them
    checkEnemySpawns(cameraX) {
        const spawnLimitX = cameraX + 300;
        for (let i = this.enemySpawns.length - 1; i >= 0; i--) {
            const spawn = this.enemySpawns[i];
            if (spawn.x <= spawnLimitX) {
                if (spawn.type === 'goomba') {
                    this.enemies.push(new Goomba(spawn.x, spawn.y));
                } else if (spawn.type === 'koopa') {
                    this.enemies.push(new Koopa(spawn.x, spawn.y));
                }
                this.enemySpawns.splice(i, 1);
            }
        }
    }

    bumpTile(tx, ty, player) {
        const tileId = this.getTile(tx, ty);
        if (tileId === 0) return;

        // Brick Block
        if (tileId === 2) {
            if (player.isSuper) {
                // Super Mario shatters the brick!
                this.setTile(tx, ty, 0);
                window.sounds.playBlockBreak();
                player.game.addScore(50, tx * 16 + 8, ty * 16);

                // 4 Debris pieces
                player.game.particles.push(
                    new Particle(tx * 16 + 4, ty * 16 + 4, -1.8, -4.5, 'debris'),
                    new Particle(tx * 16 + 12, ty * 16 + 4, 1.8, -4.5, 'debris'),
                    new Particle(tx * 16 + 4, ty * 16 + 12, -1.2, -2.5, 'debris'),
                    new Particle(tx * 16 + 12, ty * 16 + 12, 1.2, -2.5, 'debris')
                );
            } else {
                // Small Mario bumps the brick
                window.sounds.playBlockBump();
                this.bumpingBlocks.push({ tx, ty, originalId: 2, timer: 0 });
            }
        }
        // Question block with coin
        else if (tileId === 3) {
            this.setTile(tx, ty, 5); // becomes empty block
            window.sounds.playCoin();
            player.game.addCoin();
            player.game.addScore(200, tx * 16 + 8, (ty - 1) * 16);
            player.game.particles.push(
                new Particle(tx * 16 + 8, ty * 16 - 4, 0, -4.5, 'coin_bounce')
            );
            this.bumpingBlocks.push({ tx, ty, originalId: 5, timer: 0 });
        }
        // Question block with mushroom
        else if (tileId === 4) {
            this.setTile(tx, ty, 5); // becomes empty block
            window.sounds.playPowerupAppear();
            this.bumpingBlocks.push({ tx, ty, originalId: 5, timer: 0 });
            this.items.push(new Mushroom(tx * 16, ty * 16 - 16));
        }
        // Already empty block
        else if (tileId === 5 || tileId === 6) {
            window.sounds.playBlockBump();
            this.bumpingBlocks.push({ tx, ty, originalId: tileId, timer: 0 });
        }
    }

    update() {
        // Update bouncing blocks
        for (let i = this.bumpingBlocks.length - 1; i >= 0; i--) {
            const b = this.bumpingBlocks[i];
            b.timer++;
            if (b.timer > 10) {
                this.bumpingBlocks.splice(i, 1);
            }
        }

        // Update items (Mushrooms)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(this);
            if (item.dead || item.y > 260) {
                this.items.splice(i, 1);
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this);
            if (enemy.dead && enemy.removeTimer <= 0) {
                this.enemies.splice(i, 1);
            } else if (enemy.y > 270) {
                this.enemies.splice(i, 1);
            }
        }
    }

    render(ctx, cameraX) {
        const startCol = Math.max(0, Math.floor(cameraX / this.tileSize));
        const endCol = Math.min(this.widthInTiles - 1, Math.ceil((cameraX + 270) / this.tileSize));

        // Render Background Scenery
        for (const s of this.scenery) {
            const renderX = Math.round(s.x - cameraX);
            if (renderX < -60 || renderX > 280) continue;

            if (s.type === 'cloud') {
                const puff = window.sprites.get('cloud_puff');
                if (puff) {
                    ctx.drawImage(puff, renderX, s.y);
                    ctx.drawImage(puff, renderX + 12, s.y - 4);
                    ctx.drawImage(puff, renderX + 24, s.y);
                }
            } else if (s.type === 'bush') {
                const puff = window.sprites.get('bush_puff');
                if (puff) {
                    ctx.drawImage(puff, renderX, s.y);
                    ctx.drawImage(puff, renderX + 10, s.y - 3);
                    ctx.drawImage(puff, renderX + 20, s.y);
                }
            } else if (s.type === 'hill') {
                ctx.fillStyle = '#00A800';
                ctx.beginPath();
                ctx.arc(renderX + 24, s.y + 24, 24, Math.PI, 0);
                ctx.fill();
            }
        }

        // Question mark animation frame
        const qFrame = Math.floor((this.game.gameTicks / 15) % 3);

        // Render Tiles
        for (let ty = 0; ty < this.heightInTiles; ty++) {
            for (let tx = startCol; tx <= endCol; tx++) {
                const t = this.tiles[ty][tx];
                if (t === 0) continue;

                let spr = null;
                if (t === 1) spr = window.sprites.get('ground');
                else if (t === 2) spr = window.sprites.get('brick');
                else if (t === 3 || t === 4) spr = window.sprites.get(`question_${qFrame}`);
                else if (t === 5) spr = window.sprites.get('empty_block');
                else if (t === 6) spr = window.sprites.get('stone');
                else if (t === 7) spr = window.sprites.get('pipe_top_left');
                else if (t === 8) spr = window.sprites.get('pipe_top_right');
                else if (t === 9) spr = window.sprites.get('pipe_body_left');
                else if (t === 10) spr = window.sprites.get('pipe_body_right');
                else if (t === 11) spr = window.sprites.get('castle_brick');
                else if (t === 12) spr = window.sprites.get('castle_door');

                let bumpY = 0;
                const bumping = this.bumpingBlocks.find(b => b.tx === tx && b.ty === ty);
                if (bumping) {
                    bumpY = -Math.sin((bumping.timer / 10) * Math.PI) * 6;
                }

                if (spr) {
                    ctx.drawImage(spr, Math.round(tx * this.tileSize - cameraX), Math.round(ty * this.tileSize + bumpY));
                }
            }
        }

        // Render Flagpole
        const flagX = Math.round(this.flagpole.x - cameraX);
        const ball = window.sprites.get('flag_ball');
        const pole = window.sprites.get('flag_pole');
        const banner = window.sprites.get('flag_banner');

        if (ball && pole && banner) {
            ctx.drawImage(ball, flagX - 4, this.flagpole.y - 8);
            for (let py = this.flagpole.y; py < this.flagpole.y + this.flagpole.height; py += 16) {
                ctx.drawImage(pole, flagX, py);
            }
            ctx.drawImage(banner, flagX - 14, this.flagpole.flagY);
        }

        // Render Items
        for (const item of this.items) {
            item.render(ctx, cameraX);
        }

        // Render Enemies
        for (const enemy of this.enemies) {
            enemy.render(ctx, cameraX);
        }
    }
}

// Super Mushroom Entity
class Mushroom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = 1.0;
        this.vy = 0;
        this.grounded = false;
        this.dead = false;
    }

    onWallCollide() {
        this.vx = -this.vx;
    }

    update(level) {
        this.vy += 0.3; // gravity
        if (this.vy > 4) this.vy = 4;
        window.Physics.updateEntityTiles(this, level);
    }

    render(ctx, cameraX) {
        const spr = window.sprites.get('mushroom');
        if (spr) {
            ctx.drawImage(spr, Math.round(this.x - cameraX), Math.round(this.y));
        }
    }
}

// Goomba Enemy
class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = -0.7;
        this.vy = 0;
        this.grounded = false;
        this.dead = false;
        this.removeTimer = 0;
        this.animTicks = 0;
    }

    onWallCollide() {
        this.vx = -this.vx;
    }

    stomp(player) {
        this.dead = true;
        this.removeTimer = 25;
        this.vx = 0;
        window.sounds.playStomp();
        player.game.addScore(100, this.x + 8, this.y);
    }

    update(level) {
        if (this.dead) {
            this.removeTimer--;
            return;
        }
        this.animTicks++;
        this.vy += 0.3;
        if (this.vy > 4) this.vy = 4;
        window.Physics.updateEntityTiles(this, level);
    }

    render(ctx, cameraX) {
        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);
        if (this.dead) {
            const flat = window.sprites.get('goomba_flat');
            if (flat) ctx.drawImage(flat, renderX, renderY);
        } else {
            const frame = Math.floor((this.animTicks / 10) % 2);
            const spr = window.sprites.get(`goomba_${frame}`);
            if (spr) ctx.drawImage(spr, renderX, renderY);
        }
    }
}

// Koopa Troopa Enemy
class Koopa {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 24;
        this.vx = -0.6;
        this.vy = 0;
        this.grounded = false;
        this.isShell = false;
        this.shellSliding = false;
        this.dead = false;
        this.animTicks = 0;
    }

    onWallCollide() {
        this.vx = -this.vx;
        if (this.shellSliding) {
            window.sounds.playBlockBump();
        }
    }

    stomp(player) {
        if (!this.isShell) {
            this.isShell = true;
            this.h = 16;
            this.y += 8;
            this.vx = 0;
            window.sounds.playStomp();
            player.game.addScore(100, this.x + 8, this.y);
        } else {
            if (this.shellSliding) {
                // Stop sliding shell
                this.shellSliding = false;
                this.vx = 0;
                window.sounds.playStomp();
            } else {
                // Kick shell
                this.kick(player.x < this.x ? 1 : -1, player);
            }
        }
    }

    kick(dir, player) {
        this.shellSliding = true;
        this.vx = dir * 3.8;
        window.sounds.playKick();
        player.game.addScore(400, this.x + 8, this.y);
    }

    update(level) {
        this.animTicks++;
        this.vy += 0.3;
        if (this.vy > 4) this.vy = 4;
        window.Physics.updateEntityTiles(this, level);

        // Shell wipes out other enemies when sliding
        if (this.isShell && this.shellSliding) {
            for (const other of level.enemies) {
                if (other !== this && !other.dead && window.Physics.AABB(this, other)) {
                    other.dead = true;
                    other.removeTimer = 20;
                    window.sounds.playKick();
                    level.game.addScore(200, other.x + 8, other.y);
                }
            }
        }
    }

    render(ctx, cameraX) {
        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);
        if (this.isShell) {
            const spr = window.sprites.get('koopa_shell');
            if (spr) ctx.drawImage(spr, renderX, renderY);
        } else {
            const frame = Math.floor((this.animTicks / 10) % 2);
            const spr = window.sprites.get(`koopa_${frame}`);
            if (spr) {
                ctx.save();
                if (this.vx > 0) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(spr, -renderX - 16, renderY);
                } else {
                    ctx.drawImage(spr, renderX, renderY);
                }
                ctx.restore();
            }
        }
    }
}

window.Level = Level;
window.Mushroom = Mushroom;
window.Goomba = Goomba;
window.Koopa = Koopa;

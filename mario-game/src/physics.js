// Physics engine and collision resolution for Super Mario Bros

class Physics {
    static AABB(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    // Resolves entity movement against tilemap
    static updateEntityTiles(entity, level, isPlayer = false) {
        const TILE_SIZE = 16;

        // Apply horizontal movement
        entity.x += entity.vx;

        // Check horizontal tile collisions
        let leftTile = Math.floor(entity.x / TILE_SIZE);
        let rightTile = Math.floor((entity.x + entity.w - 0.01) / TILE_SIZE);
        let topTile = Math.floor(entity.y / TILE_SIZE);
        let bottomTile = Math.floor((entity.y + entity.h - 0.01) / TILE_SIZE);

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (level.isSolidTile(tx, ty)) {
                    if (entity.vx > 0) {
                        entity.x = tx * TILE_SIZE - entity.w;
                        if (!isPlayer) entity.onWallCollide('right');
                        entity.vx = 0;
                    } else if (entity.vx < 0) {
                        entity.x = (tx + 1) * TILE_SIZE;
                        if (!isPlayer) entity.onWallCollide('left');
                        entity.vx = 0;
                    }
                }
            }
        }

        // Apply vertical movement
        entity.y += entity.vy;

        leftTile = Math.floor(entity.x / TILE_SIZE);
        rightTile = Math.floor((entity.x + entity.w - 0.01) / TILE_SIZE);
        topTile = Math.floor(entity.y / TILE_SIZE);
        bottomTile = Math.floor((entity.y + entity.h - 0.01) / TILE_SIZE);

        entity.grounded = false;

        for (let ty = topTile; ty <= bottomTile; ty++) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (level.isSolidTile(tx, ty)) {
                    if (entity.vy > 0) {
                        // Landing on tile
                        entity.y = ty * TILE_SIZE - entity.h;
                        entity.vy = 0;
                        entity.grounded = true;
                    } else if (entity.vy < 0) {
                        // Hitting tile from below
                        entity.y = (ty + 1) * TILE_SIZE;
                        entity.vy = 0;
                        if (isPlayer) {
                            level.bumpTile(tx, ty, entity);
                        }
                    }
                }
            }
        }
    }
}

// Particle class for brick fragments, dust and score indicators
class Particle {
    constructor(x, y, vx, vy, type, text = '') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'debris', 'dust', 'score', 'coin_bounce'
        this.text = text;
        this.life = 0;
        this.maxLife = type === 'score' ? 45 : (type === 'coin_bounce' ? 30 : 60);
        this.rotation = 0;
        this.vRot = (Math.random() - 0.5) * 0.4;
    }

    update() {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'debris') {
            this.vy += 0.35; // gravity
            this.rotation += this.vRot;
        } else if (this.type === 'coin_bounce') {
            this.vy += 0.4;
        } else if (this.type === 'dust') {
            this.vx *= 0.88;
            this.vy *= 0.88;
        } else if (this.type === 'score') {
            this.vy *= 0.95;
        }

        return this.life < this.maxLife;
    }

    render(ctx, cameraX) {
        const renderX = Math.round(this.x - cameraX);
        const renderY = Math.round(this.y);

        if (this.type === 'debris') {
            const spr = window.sprites.get('debris');
            if (spr) {
                ctx.save();
                ctx.translate(renderX, renderY);
                ctx.rotate(this.rotation);
                ctx.drawImage(spr, -4, -4);
                ctx.restore();
            }
        } else if (this.type === 'coin_bounce') {
            const frame = Math.floor((this.life / 4) % 4);
            const spr = window.sprites.get(`coin_${frame}`);
            if (spr) {
                ctx.drawImage(spr, renderX - 8, renderY - 8);
            }
        } else if (this.type === 'dust') {
            ctx.fillStyle = `rgba(240, 240, 240, ${1 - this.life / this.maxLife})`;
            const size = 3 * (1 - this.life / this.maxLife);
            ctx.beginPath();
            ctx.arc(renderX, renderY, size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'score') {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.strokeText(this.text, renderX, renderY);
            ctx.fillText(this.text, renderX, renderY);
        }
    }
}

window.Physics = Physics;
window.Particle = Particle;

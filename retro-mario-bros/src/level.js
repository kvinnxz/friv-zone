// ==========================================================================
// LEVEL ENGINE: Mapa de Baldosas (World 1-1), Tuberías, Bloques y Escenario
// ==========================================================================

class Level {
    constructor(game) {
        this.game = game;
        this.tileSize = 16;
        this.rows = 15; // 15 * 16 = 240 px
        this.cols = 180; // Longitud del nivel
        this.map = [];
        this.bouncingBlocks = [];
        this.coinPops = [];
        this.flagpole = { x: 156 * 16, topY: 3 * 16, bottomY: 12 * 16, flagY: 3 * 16 + 4 };
        this.castleDoorX = 168 * 16 + 8;
        this.animTicks = 0;

        this.initLevelLayout();
    }

    initLevelLayout() {
        // Inicializar matriz vacía (aire)
        this.map = [];
        for (let r = 0; r < this.rows; r++) {
            this.map[r] = new Array(this.cols).fill(null);
        }

        // 1. Suelo base (filas 13 y 14) con huecos/fosos clásicos
        for (let c = 0; c < this.cols; c++) {
            // Dejar fosos en columnas específicas
            const isPit = (c >= 68 && c <= 70) || (c >= 85 && c <= 88) || (c >= 140 && c <= 142);
            if (!isPit) {
                this.map[13][c] = 'ground';
                this.map[14][c] = 'ground';
            }
        }

        // 2. Primera tanda de bloques (como en World 1-1)
        // Bloque '?' solitario
        this.map[9][16] = 'qblock_coin';
        
        // Fila de bloques ladrillo y ?
        this.map[9][20] = 'brick';
        this.map[9][21] = 'qblock_coin';
        this.map[9][22] = 'brick';
        this.map[9][23] = 'qblock_coin';
        this.map[9][24] = 'brick';

        // Bloque '?' elevado
        this.map[5][22] = 'qblock_coin';

        // 3. Tuberías de diferentes alturas
        this.addPipe(28, 2); // Tubería baja (2 bloques de altura)
        this.addPipe(38, 3); // Tubería media (3 bloques de altura)
        this.addPipe(46, 4); // Tubería alta (4 bloques de altura)
        this.addPipe(57, 4); // Tubería alta

        // 4. Bloques después de la cuarta tubería
        this.map[9][64] = 'qblock_coin';
        this.map[9][77] = 'brick';
        this.map[9][78] = 'qblock_coin';
        this.map[9][79] = 'brick';

        // Plataforma superior de ladrillos
        for (let c = 80; c <= 87; c++) {
            this.map[5][c] = 'brick';
        }
        for (let c = 91; c <= 94; c++) {
            this.map[5][c] = 'brick';
        }
        this.map[5][94] = 'qblock_coin';

        this.map[9][94] = 'brick';
        this.map[9][100] = 'brick';
        this.map[9][101] = 'brick';
        this.map[9][105] = 'qblock_coin';
        this.map[9][108] = 'qblock_coin';
        this.map[9][111] = 'qblock_coin';

        // 5. Tuberías intermedias
        this.addPipe(116, 2);
        this.addPipe(126, 3);

        // 6. Pirámides de bloques escalonados antes de la bandera
        this.buildStairs(132, 4, true);   // Escalera hacia arriba
        this.buildStairs(144, 4, false);  // Escalera hacia abajo
        this.buildStairs(148, 8, true);   // Gran escalera final hacia el mástil
    }

    addPipe(col, height) {
        const baseRow = 13;
        const topRow = baseRow - height;

        // Cabeza de la tubería
        this.map[topRow][col] = 'pipe_tl';
        this.map[topRow][col + 1] = 'pipe_tr';

        // Cuerpo / fuste de la tubería
        for (let r = topRow + 1; r < baseRow; r++) {
            this.map[r][col] = 'pipe_sl';
            this.map[r][col + 1] = 'pipe_sr';
        }
    }

    buildStairs(startCol, height, asc = true) {
        const baseRow = 12;
        for (let step = 0; step < height; step++) {
            const col = asc ? (startCol + step) : (startCol + step);
            const currentHeight = asc ? (step + 1) : (height - step);
            for (let h = 0; h < currentHeight; h++) {
                this.map[baseRow - h][col] = 'ground';
            }
        }
    }

    isSolid(col, row) {
        if (row >= this.rows) return false;
        if (row < 0 || col < 0 || col >= this.cols) return false;
        const tile = this.map[row][col];
        return (tile !== null && tile !== undefined);
    }

    hitBlock(col, row, player) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        const tile = this.map[row][col];
        if (!tile) return;

        if (tile === 'qblock_coin') {
            // Cambiar a bloque gastado e impulsar moneda dorada
            this.map[row][col] = 'empty_block';
            this.bouncingBlocks.push(new BouncingBlock(col, row, 'empty_block'));
            this.coinPops.push(new CoinPop(col * 16, (row - 1) * 16));
            window.retroAudio.playCoin();
            this.game.addCoin();
            this.game.addScore(200, col * 16 + 8, (row - 1) * 16);
        } else if (tile === 'brick') {
            // Bloque de ladrillos rebota con un golpe seco
            this.bouncingBlocks.push(new BouncingBlock(col, row, 'brick'));
            window.retroAudio.playBump();
            this.game.addScore(50, col * 16 + 8, (row - 1) * 16);
        } else if (tile === 'empty_block' || tile.startsWith('pipe') || tile === 'ground') {
            window.retroAudio.playBump();
        }
    }

    update() {
        this.animTicks++;

        // Actualizar bloques rebotando
        for (let i = this.bouncingBlocks.length - 1; i >= 0; i--) {
            this.bouncingBlocks[i].update();
            if (this.bouncingBlocks[i].dead) {
                this.bouncingBlocks.splice(i, 1);
            }
        }

        // Actualizar monedas que saltan
        for (let i = this.coinPops.length - 1; i >= 0; i--) {
            this.coinPops[i].update();
            if (this.coinPops[i].dead) {
                this.coinPops.splice(i, 1);
            }
        }
    }

    // Renderizar nubes, colinas y arbustos de fondo con efecto retro
    renderBackground(ctx, cameraX) {
        // Cielo azul NES
        ctx.fillStyle = '#5c94fc';
        ctx.fillRect(0, 0, 256, 240);

        // Nubes suaves (desplazamiento parallax suave)
        ctx.fillStyle = '#ffffff';
        const cloudParallax = cameraX * 0.25;
        const cloudPositions = [40, 120, 230, 360, 520, 700, 950, 1200, 1500, 1800, 2100];
        cloudPositions.forEach((cx, idx) => {
            const drawX = Math.round(cx - cloudParallax);
            if (drawX > -60 && drawX < 300) {
                const cy = 35 + (idx % 3) * 18;
                // Dibujar forma de nube pixelada retro
                ctx.fillRect(drawX + 8, cy, 24, 12);
                ctx.fillRect(drawX, cy + 4, 40, 10);
                ctx.fillRect(drawX + 4, cy + 2, 32, 12);
            }
        });

        // Colinas verdes redondeadas (paralaje medio)
        const hillParallax = cameraX * 0.5;
        const hillPositions = [20, 180, 420, 680, 960, 1300, 1600, 2000];
        hillPositions.forEach((hx, idx) => {
            const drawX = Math.round(hx - hillParallax);
            if (drawX > -80 && drawX < 320) {
                const baseH = (idx % 2 === 0) ? 36 : 24;
                const baseY = 208 - baseH;
                ctx.fillStyle = '#00a800';
                ctx.beginPath();
                ctx.arc(drawX + 40, 208, baseH + 10, Math.PI, 0, false);
                ctx.fill();
                // Detalle oscuro
                ctx.fillStyle = '#006800';
                ctx.fillRect(drawX + 38, baseY + 6, 4, 4);
                ctx.fillRect(drawX + 32, baseY + 12, 4, 4);
                ctx.fillRect(drawX + 44, baseY + 12, 4, 4);
            }
        });
    }

    // Renderizar baldosas visibles en pantalla
    render(ctx, cameraX) {
        this.renderBackground(ctx, cameraX);

        const startCol = Math.max(0, Math.floor(cameraX / this.tileSize) - 1);
        const endCol = Math.min(this.cols - 1, Math.ceil((cameraX + 256) / this.tileSize) + 1);

        // Frame de animación para bloques con signo de interrogación
        const qFrame = Math.floor(this.animTicks / 15) % 2;

        for (let r = 0; r < this.rows; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = this.map[r][c];
                if (!tile) continue;

                // Si hay un bloque rebotando en esta casilla, ocultar la baldosa base
                const isBouncing = this.bouncingBlocks.some(b => b.tileX === c && b.tileY === r);
                if (isBouncing) continue;

                const drawX = Math.round(c * this.tileSize - cameraX);
                const drawY = r * this.tileSize;

                if (tile === 'qblock_coin') {
                    window.sprites.draw(ctx, `qblock_${qFrame}`, drawX, drawY);
                } else {
                    window.sprites.draw(ctx, tile, drawX, drawY);
                }
            }
        }

        // Renderizar Mástil y Bandera de Meta
        this.renderFlagpole(ctx, cameraX);

        // Renderizar Castillo de Meta
        this.renderCastle(ctx, cameraX);

        // Renderizar bloques saltarines
        this.bouncingBlocks.forEach(b => b.render(ctx, cameraX));

        // Renderizar monedas recolectadas
        this.coinPops.forEach(c => c.render(ctx, cameraX));
    }

    renderFlagpole(ctx, cameraX) {
        const poleX = Math.round(this.flagpole.x - cameraX);
        if (poleX < -20 || poleX > 280) return;

        // Poste vertical
        ctx.fillStyle = '#00a800';
        ctx.fillRect(poleX + 7, this.flagpole.topY + 8, 2, this.flagpole.bottomY - this.flagpole.topY + 8);

        // Bola superior del poste
        window.sprites.draw(ctx, 'pole_top', poleX, this.flagpole.topY - 8);

        // Bandera triangular verde
        window.sprites.draw(ctx, 'flag', poleX - 10, this.flagpole.flagY);
    }

    renderCastle(ctx, cameraX) {
        const cx = Math.round(164 * 16 - cameraX);
        if (cx < -100 || cx > 350) return;

        // Base del castillo
        ctx.fillStyle = '#b84418';
        ctx.fillRect(cx, 144, 80, 64);

        // Almenas del castillo
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(cx + i * 16 + 2, 134, 12, 10);
        }

        // Torre central superior
        ctx.fillRect(cx + 24, 110, 32, 24);
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(cx + 26 + i * 14, 102, 10, 8);
        }

        // Puerta del castillo (arco oscuro)
        ctx.fillStyle = '#000000';
        ctx.fillRect(cx + 32, 176, 16, 32);
        ctx.beginPath();
        ctx.arc(cx + 40, 176, 8, Math.PI, 0);
        ctx.fill();
    }
}

window.Level = Level;

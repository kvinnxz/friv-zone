// ==========================================================================
// SPRITE GENERATOR: Renderizado Pixel-Art Procedural (Estilo NES 16x16)
// Dibuja cada sprite en un OffscreenCanvas para máxima velocidad a 60 FPS
// ==========================================================================

const NES_COLORS = {
    TRANSPARENT: 'rgba(0,0,0,0)',
    RED: '#d82800',
    BROWN: '#884400',
    DARK_BROWN: '#4c2400',
    BEIGE: '#fc9838',
    WHITE: '#ffffff',
    BLACK: '#000000',
    GOLD: '#f8b800',
    LIGHT_GOLD: '#fce4a0',
    BRICK_ORANGE: '#b84418',
    BRICK_DARK: '#5c1400',
    BRICK_LIGHT: '#fc7460',
    GREEN_DARK: '#006800',
    GREEN_MED: '#00a800',
    GREEN_LIGHT: '#80d010',
    PIPE_HIGHLIGHT: '#a8e820',
    SKY_BLUE: '#5c94fc',
    CLOUD_WHITE: '#fcfcfc',
    CLOUD_BORDER: '#80a0e0',
    HILL_DOTS: '#004800'
};

class SpriteEngine {
    constructor() {
        this.cache = {};
        this.initAllSprites();
    }

    // Helper para crear un canvas de 16x16 (o w x h) a partir de una matriz de strings
    createTile(w, h, map, palette) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        for (let y = 0; y < h; y++) {
            const row = map[y] || '';
            for (let x = 0; x < w; x++) {
                const char = row[x];
                if (char && palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        return c;
    }

    initAllSprites() {
        this.initTerrain();
        this.initMario();
        this.initGoomba();
        this.initItems();
    }

    initTerrain() {
        // Bloque de suelo clásico NES
        const groundPalette = {
            '.': NES_COLORS.TRANSPARENT,
            'b': NES_COLORS.DARK_BROWN,
            'o': NES_COLORS.BRICK_ORANGE,
            'l': NES_COLORS.BEIGE,
            'k': NES_COLORS.BLACK
        };
        const groundMap = [
            'llllllllllllllll',
            'loooooooooooooob',
            'loobbbbbbbbbboob',
            'lobllllllllllbob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'loblooooooooblob',
            'lobbbbbbbbbbblob',
            'loooooooooooooob',
            'lbbbbbbbbbbbbbbb',
            'kkkkkkkkkkkkkkkk'
        ];
        this.cache['ground'] = this.createTile(16, 16, groundMap, groundPalette);

        // Bloque de Ladrillos (Bricks)
        const brickPalette = {
            'k': NES_COLORS.BLACK,
            'o': NES_COLORS.BRICK_ORANGE,
            'l': NES_COLORS.BRICK_LIGHT,
            'd': NES_COLORS.BRICK_DARK
        };
        const brickMap = [
            'llllllllklllllll',
            'loooooodkloooood',
            'loooooodkloooood',
            'ddddddddkddddddd',
            'kkkkkkkkkkkkkkkk',
            'llllkllllllllkll',
            'loodkloooooodklo',
            'loodkloooooodklo',
            'ddddkddddddddkdd',
            'kkkkkkkkkkkkkkkk',
            'llllllllklllllll',
            'loooooodkloooood',
            'loooooodkloooood',
            'ddddddddkddddddd',
            'kkkkkkkkkkkkkkkk',
            'dddddddddddddddd'
        ];
        this.cache['brick'] = this.createTile(16, 16, brickMap, brickPalette);

        // Bloque de interrogación '?' (Animación de 3 frames)
        const qPalette1 = {
            'k': NES_COLORS.BLACK,
            'g': NES_COLORS.GOLD,
            'l': NES_COLORS.LIGHT_GOLD,
            'b': NES_COLORS.DARK_BROWN
        };
        const qMap1 = [
            'llllllllllllllll',
            'lggggggggggggggb',
            'lgllllkkkkllllgb',
            'lglllkkggkklllgb',
            'lglllkkggkklllgb',
            'lgllllllkkllllgb',
            'lglllllkklllllgb',
            'lgllllkkllllllgb',
            'lgllllkkllllllgb',
            'lgllllllllllllgb',
            'lgllllkkllllllgb',
            'lgllllkkllllllgb',
            'lgllllllllllllgb',
            'lggggggggggggggb',
            'lbbbbbbbbbbbbbbb',
            'kkkkkkkkkkkkkkkk'
        ];
        this.cache['qblock_0'] = this.createTile(16, 16, qMap1, qPalette1);

        const qPalette2 = { ...qPalette1, 'g': '#e09800', 'l': '#fff0b0' };
        this.cache['qblock_1'] = this.createTile(16, 16, qMap1, qPalette2);

        // Bloque gastado / inerte
        const emptyPalette = {
            'b': NES_COLORS.DARK_BROWN,
            'o': '#9e5210',
            'k': NES_COLORS.BLACK,
            'd': '#542800'
        };
        const emptyMap = [
            'oooooooooooooooo',
            'obbbbbbbbbbbbbbd',
            'obkkkkkkkkkkkkbd',
            'obkddddddddddkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkd        dkbd',
            'obkddddddddddkbd',
            'obkkkkkkkkkkkkbd',
            'oddddddddddddddd',
            'kkkkkkkkkkkkkkkk'
        ];
        this.cache['empty_block'] = this.createTile(16, 16, emptyMap, emptyPalette);

        // Tuberías verdes (4 partes: top-left, top-right, shaft-left, shaft-right)
        const pipePalette = {
            'k': NES_COLORS.BLACK,
            'l': NES_COLORS.PIPE_HIGHLIGHT,
            'g': NES_COLORS.GREEN_MED,
            'd': NES_COLORS.GREEN_DARK,
            'w': NES_COLORS.WHITE
        };
        const pTopLeft = [
            'kkkkkkkkkkkkkkkk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kwwllggggddddddk',
            'kkkkkkkkkkkkkkkk'
        ];
        const pTopRight = [
            'kkkkkkkkkkkkkkkk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kddddddddddddddk',
            'kkkkkkkkkkkkkkkk'
        ];
        const pShaftLeft = [
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk ',
            '  kwwllgggddddk '
        ];
        const pShaftRight = [
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk ',
            ' kddddddddddddk '
        ];
        this.cache['pipe_tl'] = this.createTile(16, 16, pTopLeft, pipePalette);
        this.cache['pipe_tr'] = this.createTile(16, 16, pTopRight, pipePalette);
        this.cache['pipe_sl'] = this.createTile(16, 16, pShaftLeft, pipePalette);
        this.cache['pipe_sr'] = this.createTile(16, 16, pShaftRight, pipePalette);
    }

    initMario() {
        const p = {
            '.': NES_COLORS.TRANSPARENT,
            'r': NES_COLORS.RED,
            'b': NES_COLORS.BROWN,
            's': NES_COLORS.BEIGE, // Piel
            'k': NES_COLORS.BLACK
        };

        // Mario Pequeño: Parado (Idle)
        const idleMap = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '....bbrbb.......',
            '..bbbrrrbbrr....',
            '.bbbbbrrrrbbbb..',
            '.ss.brsrrrsb.ss.',
            'sss.rrrrrrrr.sss',
            'ss..rrrrrrrr..ss',
            '....rrr..rrr....',
            '...bbb....bbb...',
            '..bbbb....bbbb..'
        ];
        this.cache['mario_idle'] = this.createTile(16, 16, idleMap, p);

        // Mario Pequeño: Corriendo Frame 1
        const run1Map = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '....bbrbbr......',
            '..bbbrrrbb......',
            '.bbbbbrrrr......',
            '.ss.brsrrrb.....',
            'sss.rrrrrrr.....',
            'ss..rrrrrrr.....',
            '....rrr..rr.....',
            '....bbb...bbb...',
            '.....bbb..bbbb..'
        ];
        this.cache['mario_run_0'] = this.createTile(16, 16, run1Map, p);

        // Mario Pequeño: Corriendo Frame 2
        const run2Map = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '.....rbrbb......',
            '....rrrbbrbb....',
            '....rrrrbbbb....',
            '....rsrrrsb.....',
            '...srrrrrrrs....',
            '..ssrrrrrrrr....',
            '..bbb....rrr....',
            '.bbbb.....bb....',
            '..........bbb...'
        ];
        this.cache['mario_run_1'] = this.createTile(16, 16, run2Map, p);

        // Mario Pequeño: Derrapando (Skid / Frenazo)
        const skidMap = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '....bbrbbb......',
            '..bbbrrrbb......',
            '.bbbbbrrrr......',
            '.ss.brsrrrs.....',
            'sss.rrrrrrr.s...',
            'ss..rrrrrrr.ss..',
            '....bbb..rrr....',
            '...bbbb...bbb...',
            '..........bbbb..'
        ];
        this.cache['mario_skid'] = this.createTile(16, 16, skidMap, p);

        // Mario Pequeño: Saltando
        const jumpMap = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '...ssbbrbb......',
            '..sssbrrrbb.....',
            '..ss.brrrrbbbb..',
            '.....rsrrrbsb...',
            '....rrrrrrrr....',
            '...rrrr..rrr....',
            '..bbbb...bbb....',
            '.bbbb.....bbb...',
            '................'
        ];
        this.cache['mario_jump'] = this.createTile(16, 16, jumpMap, p);

        // Mario Muerte
        const dieMap = [
            '.....rrrrr......',
            '....rrrrrrrrr...',
            '....bbbssbs.....',
            '...bsbsssbsbb...',
            '...bsbssssbsbb..',
            '...bbsssssbbbb..',
            '.....sssssss....',
            '.....bbrbb......',
            '....bbbrrrbb....',
            '...bbbbbrrrrbb..',
            '..ss.brsrrrsb.ss',
            '..ss.rrrrrrrr.ss',
            '.....rrrrrrrr...',
            '....bbb....bbb..',
            '...bbbb....bbbb.',
            '................'
        ];
        this.cache['mario_die'] = this.createTile(16, 16, dieMap, p);
    }

    initGoomba() {
        const gp = {
            '.': NES_COLORS.TRANSPARENT,
            'b': '#b84418', // Marrón seta
            'd': NES_COLORS.BLACK,
            's': '#fce4a0', // Cara clara
            'w': NES_COLORS.WHITE
        };

        // Goomba Paso 1
        const gWalk1 = [
            '......bbbb......',
            '....bbbbbbbb....',
            '...bbbbbbbbbb...',
            '..bbbbbbbbbbbb..',
            '..bbbbbbbbbbbb..',
            '.bbbbbbbbbbbbbb.',
            '.bbbwdbbbbdwbbb.',
            'bbbbwdbbbbdwbbbb',
            'bbbbwdbbbbdwbbbb',
            'bbbbssbbbbssbbbb',
            '.bbssssssssssbb.',
            '..ssssssssssss..',
            '...ssssssssss...',
            '..dddd....dddd..',
            '.dddddd..dddddd.',
            '.dddddd..dddddd.'
        ];
        this.cache['goomba_0'] = this.createTile(16, 16, gWalk1, gp);

        // Goomba Paso 2 (pies desplazados)
        const gWalk2 = [
            '......bbbb......',
            '....bbbbbbbb....',
            '...bbbbbbbbbb...',
            '..bbbbbbbbbbbb..',
            '..bbbbbbbbbbbb..',
            '.bbbbbbbbbbbbbb.',
            '.bbbwdbbbbdwbbb.',
            'bbbbwdbbbbdwbbbb',
            'bbbbwdbbbbdwbbbb',
            'bbbbssbbbbssbbbb',
            '.bbssssssssssbb.',
            '..ssssssssssss..',
            '...ssssssssss...',
            '.dddddd...dddd..',
            '.dddddd..dddddd.',
            '..dddd....dddd..'
        ];
        this.cache['goomba_1'] = this.createTile(16, 16, gWalk2, gp);

        // Goomba Aplastado
        const gFlat = [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '....bbbbbbbb....',
            '..bbbbbbbbbbbb..',
            'bbbbwdbbbbdwbbbb',
            'bbbbssbbbbssbbbb',
            '..ssssssssssss..',
            '.dddddddddddddd.',
            'dddddddddddddddd',
            'dddddddddddddddd'
        ];
        this.cache['goomba_flat'] = this.createTile(16, 16, gFlat, gp);
    }

    initItems() {
        // Moneda giratoria (3 fotogramas)
        const cp = {
            '.': NES_COLORS.TRANSPARENT,
            'g': NES_COLORS.GOLD,
            'l': NES_COLORS.LIGHT_GOLD,
            'd': '#a07800',
            'w': NES_COLORS.WHITE
        };
        const c1 = [
            '.....wllll......',
            '...wllgggglld...',
            '..wlgggd..dggd..',
            '.wlgggd....dggd.',
            '.wlgggd....dggd.',
            'wlgggd......dggd',
            'wlgggd......dggd',
            'wlgggd......dggd',
            'wlgggd......dggd',
            'wlgggd......dggd',
            '.wlgggd....dggd.',
            '.wlgggd....dggd.',
            '..wlgggd..dggd..',
            '...wllgggglld...',
            '.....wllll......',
            '................'
        ];
        const c2 = [
            '......wll.......',
            '....wllggld.....',
            '...wlgg..ggd....',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '..wlgd....dgd...',
            '...wlgg..ggd....',
            '....wllggld.....',
            '......wll.......',
            '................'
        ];
        const c3 = [
            '.......wl.......',
            '......wlld......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wggd......',
            '......wlld......',
            '.......wl.......',
            '................'
        ];
        this.cache['coin_0'] = this.createTile(16, 16, c1, cp);
        this.cache['coin_1'] = this.createTile(16, 16, c2, cp);
        this.cache['coin_2'] = this.createTile(16, 16, c3, cp);

        // Banderín de meta
        const flagPal = {
            '.': NES_COLORS.TRANSPARENT,
            'g': NES_COLORS.GREEN_MED,
            'l': NES_COLORS.GREEN_LIGHT,
            'w': NES_COLORS.WHITE,
            'k': NES_COLORS.BLACK
        };
        const flagMap = [
            'ggllll..........',
            'ggggllll........',
            'ggggggllll......',
            'ggggggggllll....',
            'ggggggggggllll..',
            'ggggggggllll....',
            'ggggggllll......',
            'ggggllll........',
            'ggllll..........',
            'g...............',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................'
        ];
        this.cache['flag'] = this.createTile(16, 16, flagMap, flagPal);

        // Bola de poste de meta
        const ballPal = {
            '.': NES_COLORS.TRANSPARENT,
            'g': NES_COLORS.GREEN_MED,
            'l': NES_COLORS.GREEN_LIGHT,
            'w': NES_COLORS.WHITE
        };
        const ballMap = [
            '.....llll.......',
            '...llwwwwll.....',
            '..llwwwwwwll....',
            '..llwwggggll....',
            '..llwwggggll....',
            '..llggggggll....',
            '...llggggll.....',
            '.....llll.......',
            '......gg........',
            '......gg........',
            '......gg........',
            '......gg........',
            '......gg........',
            '......gg........',
            '......gg........',
            '......gg........'
        ];
        this.cache['pole_top'] = this.createTile(16, 16, ballMap, ballPal);
    }

    // Renderiza un sprite por clave
    draw(ctx, key, x, y, flipX = false) {
        const sprite = this.cache[key];
        if (!sprite) return;
        ctx.save();
        if (flipX) {
            ctx.translate(Math.round(x) + sprite.width, Math.round(y));
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0);
        } else {
            ctx.drawImage(sprite, Math.round(x), Math.round(y));
        }
        ctx.restore();
    }
}

// Instancia global del generador de sprites
window.sprites = new SpriteEngine();

// Sprite Generator and Cache for Super Mario Bros
// Generates pixel-perfect 8-bit sprites into offscreen canvases for blazing fast rendering

class SpriteManager {
    constructor() {
        this.cache = {};
        this.initPalette();
        this.buildSprites();
    }

    initPalette() {
        this.colors = {
            // Mario colors
            M_RED: '#D82800',
            M_BROWN: '#887000',
            M_SKIN: '#FCE0A8',
            M_WHITE: '#FFFFFF',
            M_BLACK: '#000000',

            // Environment
            GROUND_TOP: '#E4A400',
            GROUND_BODY: '#C84C0C',
            GROUND_SHADOW: '#000000',
            BRICK_MAIN: '#B84418',
            BRICK_LINE: '#000000',
            BRICK_LIGHT: '#F87858',
            QUESTION_MAIN: '#FC9838',
            QUESTION_LIGHT: '#FCE0A8',
            QUESTION_DARK: '#A43800',
            EMPTY_BLOCK: '#8C5020',
            STONE_BLOCK: '#D8A038',
            STONE_SHADOW: '#000000',

            // Pipe
            PIPE_LIGHT: '#00D800',
            PIPE_MAIN: '#00A800',
            PIPE_DARK: '#005000',
            PIPE_SHADOW: '#000000',

            // Scenery
            SKY_BLUE: '#6B8CFF',
            CLOUD_WHITE: '#FFFFFF',
            CLOUD_BORDER: '#000000',
            HILL_LIGHT: '#5CE430',
            HILL_DARK: '#008000',
            HILL_BORDER: '#004000',

            // Enemies
            GOOMBA_BODY: '#A84000',
            GOOMBA_SKIN: '#FCE0A8',
            GOOMBA_FEET: '#000000',
            KOOPA_GREEN: '#00A800',
            KOOPA_YELLOW: '#F8B800',
            KOOPA_WHITE: '#FFFFFF',

            // Items
            MUSH_RED: '#E42800',
            MUSH_SPOT: '#FFFFFF',
            MUSH_FACE: '#FCE0A8',
            COIN_GOLD: '#FCD844',
            COIN_DARK: '#C48800'
        };
    }

    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { c, ctx };
    }

    drawPixelMatrix(ctx, matrix, colorMap, scale = 1) {
        for (let y = 0; y < matrix.length; y++) {
            const row = matrix[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char !== ' ' && char !== '.' && colorMap[char]) {
                    ctx.fillStyle = colorMap[char];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
    }

    buildSprites() {
        const C = this.colors;

        // 1. GROUND TILE (16x16)
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.GROUND_BODY;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.GROUND_TOP;
            ctx.fillRect(0, 0, 16, 4);
            ctx.fillStyle = C.GROUND_SHADOW;
            ctx.fillRect(0, 4, 16, 1);
            // Brick texture dots
            ctx.fillStyle = C.GROUND_SHADOW;
            ctx.fillRect(4, 8, 2, 2);
            ctx.fillRect(12, 12, 2, 2);
            ctx.fillRect(8, 14, 2, 2);
            this.cache['ground'] = c;
        }

        // 2. BRICK BLOCK (16x16)
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.BRICK_MAIN;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.BRICK_LINE;
            // Horizontal grout
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 8, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            // Vertical grout
            ctx.fillRect(0, 0, 1, 8);
            ctx.fillRect(8, 0, 1, 8);
            ctx.fillRect(4, 8, 1, 8);
            ctx.fillRect(12, 8, 1, 8);
            // Highlights
            ctx.fillStyle = C.BRICK_LIGHT;
            ctx.fillRect(1, 1, 6, 1);
            ctx.fillRect(9, 1, 6, 1);
            ctx.fillRect(5, 9, 6, 1);
            ctx.fillRect(13, 9, 2, 1);
            ctx.fillRect(1, 9, 2, 1);
            this.cache['brick'] = c;
        }

        // 3. QUESTION BLOCK ANIMATED (16x16, 3 frames)
        for (let frame = 0; frame < 3; frame++) {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.QUESTION_MAIN;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.BRICK_LINE;
            ctx.strokeRect(0.5, 0.5, 15, 15);

            // Screws at corners
            ctx.fillRect(1, 1, 1, 1);
            ctx.fillRect(14, 1, 1, 1);
            ctx.fillRect(1, 14, 1, 1);
            ctx.fillRect(14, 14, 1, 1);

            // Question mark
            ctx.fillStyle = frame === 1 ? C.QUESTION_LIGHT : (frame === 2 ? C.QUESTION_DARK : C.BRICK_LINE);
            // '?' Shape
            ctx.fillRect(5, 3, 6, 2);
            ctx.fillRect(9, 5, 2, 2);
            ctx.fillRect(7, 7, 2, 2);
            ctx.fillRect(7, 10, 2, 2);

            this.cache[`question_${frame}`] = c;
        }

        // 4. EMPTY BLOCK (16x16)
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.EMPTY_BLOCK;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.BRICK_LINE;
            ctx.strokeRect(0.5, 0.5, 15, 15);
            ctx.fillRect(1, 1, 1, 1);
            ctx.fillRect(14, 1, 1, 1);
            ctx.fillRect(1, 14, 1, 1);
            ctx.fillRect(14, 14, 1, 1);
            this.cache['empty_block'] = c;
        }

        // 5. STONE / STEP BLOCK (16x16)
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.STONE_BLOCK;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.STONE_SHADOW;
            ctx.strokeRect(0.5, 0.5, 15, 15);
            ctx.fillRect(2, 2, 1, 1);
            ctx.fillRect(13, 2, 1, 1);
            ctx.fillRect(2, 13, 1, 1);
            ctx.fillRect(13, 13, 1, 1);
            this.cache['stone'] = c;
        }

        // 6. PIPES (16x16 parts)
        // Pipe Top Left
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.PIPE_LIGHT;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.PIPE_MAIN;
            ctx.fillRect(6, 0, 10, 16);
            ctx.fillStyle = C.PIPE_DARK;
            ctx.fillRect(13, 0, 3, 16);
            ctx.fillStyle = C.PIPE_SHADOW;
            ctx.fillRect(0, 0, 1, 16);
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            this.cache['pipe_top_left'] = c;
        }
        // Pipe Top Right
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.PIPE_MAIN;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = C.PIPE_DARK;
            ctx.fillRect(6, 0, 8, 16);
            ctx.fillStyle = C.PIPE_SHADOW;
            ctx.fillRect(14, 0, 2, 16);
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            this.cache['pipe_top_right'] = c;
        }
        // Pipe Body Left
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.PIPE_LIGHT;
            ctx.fillRect(2, 0, 14, 16);
            ctx.fillStyle = C.PIPE_MAIN;
            ctx.fillRect(7, 0, 9, 16);
            ctx.fillStyle = C.PIPE_DARK;
            ctx.fillRect(13, 0, 3, 16);
            ctx.fillStyle = C.PIPE_SHADOW;
            ctx.fillRect(2, 0, 1, 16);
            this.cache['pipe_body_left'] = c;
        }
        // Pipe Body Right
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.PIPE_MAIN;
            ctx.fillRect(0, 0, 14, 16);
            ctx.fillStyle = C.PIPE_DARK;
            ctx.fillRect(5, 0, 8, 16);
            ctx.fillStyle = C.PIPE_SHADOW;
            ctx.fillRect(13, 0, 1, 16);
            this.cache['pipe_body_right'] = c;
        }

        // 7. MARIO SMALL (16x16)
        const marioMap = {
            'R': C.M_RED,
            'B': C.M_BROWN,
            'S': C.M_SKIN,
            'W': C.M_WHITE,
            'K': C.M_BLACK
        };

        // Small Mario Idle
        const mIdle = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSSRBBRBBRSS   ",
            " SS RRRRRRR SS  ",
            "   RRRRRRRRR    ",
            "   BBB   BBB    ",
            "  BBBB   BBBB   ",
            "  BBB     BBB   "
        ];
        this.cache['mario_idle'] = this.renderMatrix(mIdle, marioMap, 16, 16);

        // Small Mario Run 1
        const mRun1 = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSSRBBRBBRSS   ",
            " SS RRRRRRR     ",
            "   RRRRRR       ",
            "    BBBBBB      ",
            "   BBBBBBBB     ",
            "  BBBB  BBBB    "
        ];
        this.cache['mario_run_0'] = this.renderMatrix(mRun1, marioMap, 16, 16);

        // Small Mario Run 2
        const mRun2 = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSSRBBRBBRSS   ",
            " SS RRRRRRR     ",
            "   RRRRRRRRR    ",
            "  BBB    BBBB   ",
            " BBBB     BBBB  ",
            " BBB       BBB  "
        ];
        this.cache['mario_run_1'] = this.renderMatrix(mRun2, marioMap, 16, 16);

        // Small Mario Run 3
        const mRun3 = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSSRBBRBBRSS   ",
            "  SSRRRRRRRSS   ",
            "  RRRRRRRRRRR   ",
            "   BBB   BBB    ",
            "  BBBB    BBBB  ",
            " BBBB      BBBB "
        ];
        this.cache['mario_run_2'] = this.renderMatrix(mRun3, marioMap, 16, 16);

        // Small Mario Jump
        const mJump = [
            "  SS RRRRR      ",
            "  SSSRRRRRRRR   ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "  RRRRBRRRRR    ",
            " RRRRRBRRBRRR   ",
            "RRRRRRBBBBBRRR  ",
            "RR  RBBRBBR  RR ",
            "    RRRRRRR     ",
            "   RRRRRRRRR    ",
            "  BBBB  BBBB    ",
            " BBBB    BBBB   ",
            "                "
        ];
        this.cache['mario_jump'] = this.renderMatrix(mJump, marioMap, 16, 16);

        // Small Mario Skid
        const mSkid = [
            "       RRRRR    ",
            "    RRRRRRRRR   ",
            "    BBBSSBS     ",
            "   BSBSSSBS     ",
            "   BSBBSSSBSS   ",
            "   BBSSSSBBBB   ",
            "     SSSSSSSS   ",
            "    RRBRRR      ",
            "   RRRBRRBRRR   ",
            "  RRRRBBBBBRRR  ",
            "  SSSRBBRBBRSS  ",
            "  SS RRRRRRR SS ",
            "    RRRRRRRRR   ",
            "   BBBBBBBB     ",
            "  BBBBBBBBB     ",
            " BBBB   BBBB    "
        ];
        this.cache['mario_skid'] = this.renderMatrix(mSkid, marioMap, 16, 16);

        // Small Mario Die
        const mDie = [
            "    RRRRR       ",
            "   RRRRRRRRR    ",
            "   BBBSSBS      ",
            "  BSBSSSBS      ",
            "  BSBBSSSBSS    ",
            "  BBSSSSBBBB    ",
            "    SSSSSSSS    ",
            "   RRBRRR       ",
            "  RRRBRRBRRR    ",
            " RRRRBBBBBRRR   ",
            " SSSRBBRBBRSS   ",
            " SS RRRRRRR SS  ",
            "   RRRRRRRRR    ",
            "   BBB   BBB    ",
            "  BBBB   BBBB   ",
            "  BBB     BBB   "
        ];
        this.cache['mario_die'] = this.renderMatrix(mDie, marioMap, 16, 16);

        // 8. SUPER MARIO (16x32)
        const superMarioMap = {
            'R': C.M_RED,
            'B': C.M_BROWN,
            'S': C.M_SKIN,
            'W': C.M_WHITE
        };
        // Super Mario Idle (16x32)
        const sIdle = [
            "     RRRRR      ",
            "    RRRRRRRRR   ",
            "    BBBSSBS     ",
            "   BSBSSSBS     ",
            "   BSBBSSSBSS   ",
            "   BBSSSSBBBB   ",
            "     SSSSSSSS   ",
            "    RRRBRRR     ",
            "   RRRRBRRR     ",
            "  RRRRRBRRRRR   ",
            "  RRRRBBBBBRR   ",
            "  SSSRBBRBBRS   ",
            "  SSSRBBRBBRSS  ",
            "  SS RBBBBBRSS  ",
            "     RRRRRR     ",
            "    RRRRRRRR    ",
            "   RRRRRRRRRR   ",
            "  RRRRRRRRRRRR  ",
            "  BBBBRRRRBBBB  ",
            "  BBBBBBBBBBBB  ",
            "  BBBBBBBBBBBB  ",
            "  BBBBBBBBBBBB  ",
            "  BBBBBBBBBBBB  ",
            "  BBB      BBB  ",
            "  BBB      BBB  ",
            "  BBB      BBB  ",
            "  BBB      BBB  ",
            "  BBB      BBB  ",
            "  BBB      BBB  ",
            " BBBB      BBBB ",
            "BBBBB      BBBBB",
            "BBBB        BBBB"
        ];
        this.cache['super_mario_idle'] = this.renderMatrix(sIdle, superMarioMap, 16, 32);

        // Super Mario Run 1
        const sRun1 = [...sIdle];
        sRun1[28] = " BBBBB     BBBB ";
        sRun1[29] = "BBBBBB     BBBBB";
        sRun1[30] = "BBBBB       BBB ";
        this.cache['super_mario_run_0'] = this.renderMatrix(sRun1, superMarioMap, 16, 32);

        // Super Mario Run 2
        const sRun2 = [...sIdle];
        sRun2[27] = "  BBB       BBB ";
        sRun2[28] = " BBBB       BBBB";
        sRun2[29] = "BBBBB       BBBB";
        this.cache['super_mario_run_1'] = this.renderMatrix(sRun2, superMarioMap, 16, 32);
        this.cache['super_mario_run_2'] = this.cache['super_mario_run_0'];

        // Super Mario Jump
        const sJump = [...sIdle];
        sJump[25] = "  BBBB     BBBB ";
        sJump[26] = " BBBBB     BBBBB";
        sJump[27] = "BBBB        BBBB";
        sJump[28] = "                ";
        sJump[29] = "                ";
        sJump[30] = "                ";
        sJump[31] = "                ";
        this.cache['super_mario_jump'] = this.renderMatrix(sJump, superMarioMap, 16, 32);
        this.cache['super_mario_skid'] = this.cache['super_mario_idle'];

        // 9. GOOMBA (16x16)
        const goombaMap = {
            'B': C.GOOMBA_BODY,
            'S': C.GOOMBA_SKIN,
            'K': C.GOOMBA_FEET,
            'W': C.M_WHITE
        };
        const gWalk1 = [
            "     BBBBBB     ",
            "    BBBBBBBB    ",
            "   BBBBBBBBBB   ",
            "  BBBBBBBBBBBB  ",
            " BBBBWKBBKWBBBB ",
            " BBBBWKBBKWBBBB ",
            "BBBBBWKBBKWBBBBB",
            "BBBBSSSSSSSSBBBB",
            "   SSSSSSSSSS   ",
            "   SSSSSSSSSS   ",
            "   SSSSSSSSSS   ",
            "  SSSSSSSSSSSS  ",
            "  KKKK    KKKK  ",
            " KKKKKK  KKKKKK ",
            " KKKKKK  KKKKKK ",
            "  KKKK    KKKK  "
        ];
        this.cache['goomba_0'] = this.renderMatrix(gWalk1, goombaMap, 16, 16);

        // Goomba Walk 2 (feet flip)
        const gWalk2 = [
            "     BBBBBB     ",
            "    BBBBBBBB    ",
            "   BBBBBBBBBB   ",
            "  BBBBBBBBBBBB  ",
            " BBBBWKBBKWBBBB ",
            " BBBBWKBBKWBBBB ",
            "BBBBBWKBBKWBBBBB",
            "BBBBSSSSSSSSBBBB",
            "   SSSSSSSSSS   ",
            "   SSSSSSSSSS   ",
            "   SSSSSSSSSS   ",
            "  SSSSSSSSSSSS  ",
            "   KKKK  KKKK   ",
            "  KKKKKKKKKKKK  ",
            "  KKKKKKKKKKKK  ",
            "   KKKK  KKKK   "
        ];
        this.cache['goomba_1'] = this.renderMatrix(gWalk2, goombaMap, 16, 16);

        // Goomba Squished
        const gFlat = [
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "     BBBBBB     ",
            "  BBBBBBBBBBBB  ",
            " BBBBWKBBKWBBBB ",
            "BBBBBWKBBKWBBBBB",
            "BBBBSSSSSSSSBBBB",
            "  SSSSSSSSSSSS  ",
            " KKKKKKKKKKKKKK ",
            " KKKKKKKKKKKKKK "
        ];
        this.cache['goomba_flat'] = this.renderMatrix(gFlat, goombaMap, 16, 16);

        // 10. KOOPA TROOPA (16x24)
        const koopaMap = {
            'G': C.KOOPA_GREEN,
            'Y': C.KOOPA_YELLOW,
            'W': C.KOOPA_WHITE,
            'K': C.M_BLACK
        };
        const kWalk1 = [
            "      YYYY      ",
            "     YYYYYY     ",
            "    YYYYWKY     ",
            "    YYYYWWW     ",
            "    YYYYYYY     ",
            "     YYYY       ",
            "    GGGGGG      ",
            "   GGGGGGGG     ",
            "  GGWWGGWWGG    ",
            "  GGWWGGWWGG    ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            "  GGGGGGGGGG    ",
            "   GGGGGGGG     ",
            "    YYYY        ",
            "    YYYYYY      ",
            "   YYYYYYYY     ",
            "   YY    YY     ",
            "  YYY    YYY    ",
            " YYYY    YYYY   ",
            " YYYY    YYYY   ",
            "  YY      YY    "
        ];
        this.cache['koopa_0'] = this.renderMatrix(kWalk1, koopaMap, 16, 24);

        // Koopa Walk 2
        const kWalk2 = [
            "      YYYY      ",
            "     YYYYYY     ",
            "    YYYYWKY     ",
            "    YYYYWWW     ",
            "    YYYYYYY     ",
            "     YYYY       ",
            "    GGGGGG      ",
            "   GGGGGGGG     ",
            "  GGWWGGWWGG    ",
            "  GGWWGGWWGG    ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            " GGGGGGGGGGGG   ",
            "  GGGGGGGGGG    ",
            "   GGGGGGGG     ",
            "     YYYY       ",
            "    YYYYYY      ",
            "    YYYYYY      ",
            "    YY  YY      ",
            "   YYYYYYYY     ",
            "  YYYY  YYYY    ",
            "  YYYY  YYYY    ",
            "   YY    YY     "
        ];
        this.cache['koopa_1'] = this.renderMatrix(kWalk2, koopaMap, 16, 24);

        // Koopa Shell (16x16)
        const kShell = [
            "                ",
            "     GGGGGG     ",
            "   GGGGGGGGGG   ",
            "  GGGGGGGGGGGG  ",
            " GGGGGGGGGGGGGG ",
            " GGGWWGGGGWWGGG ",
            " GGGWWGGGGWWGGG ",
            "GGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGG",
            " GGGGGGGGGGGGGG ",
            "  GGGGGGGGGGGG  ",
            "   GGGGGGGGGG   ",
            "     GGGGGG     ",
            "    YYYYYYYY    ",
            "    YYYYYYYY    "
        ];
        this.cache['koopa_shell'] = this.renderMatrix(kShell, koopaMap, 16, 16);

        // 11. SUPER MUSHROOM (16x16)
        const mushMap = {
            'R': C.MUSH_RED,
            'W': C.MUSH_SPOT,
            'S': C.MUSH_FACE,
            'K': C.M_BLACK
        };
        const mushroom = [
            "     RRRRRR     ",
            "   RRWWWWWWWRR  ",
            "  RRWWWWWWWWWRR ",
            " RRWWWRRRRRWWWRR",
            " RRWWRRRRRRRWWRR",
            "RRRWWRRRRRRRWWRR",
            "RRRRWRRRRRRRWRRR",
            " RRRRRRRRRRRRRR ",
            "    SSSSSSSS    ",
            "   SSSSSSSSSS   ",
            "   SSKSSSSKSS   ",
            "   SSKSSSSKSS   ",
            "   SSSSSSSSSS   ",
            "   SSSSSSSSSS   ",
            "    SSSSSSSS    ",
            "                "
        ];
        this.cache['mushroom'] = this.renderMatrix(mushroom, mushMap, 16, 16);

        // 12. COIN ANIMATED (16x16, 4 frames)
        for (let i = 0; i < 4; i++) {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.COIN_GOLD;
            let w = 10;
            let x = 3;
            if (i === 1 || i === 3) { w = 6; x = 5; }
            else if (i === 2) { w = 2; x = 7; }

            ctx.fillRect(x, 2, w, 12);
            ctx.fillStyle = C.COIN_DARK;
            ctx.strokeRect(x + 0.5, 2.5, w - 1, 11);
            if (w > 4) {
                ctx.fillStyle = C.CLOUD_WHITE;
                ctx.fillRect(x + 2, 4, 1, 8);
            }
            this.cache[`coin_${i}`] = c;
        }

        // 13. CLOUD PARTS & BUSH PARTS
        // Cloud segment
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.CLOUD_WHITE;
            ctx.beginPath();
            ctx.arc(8, 8, 7, 0, Math.PI * 2);
            ctx.fill();
            this.cache['cloud_puff'] = c;
        }

        // Bush segment
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.HILL_DARK;
            ctx.beginPath();
            ctx.arc(8, 8, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = C.HILL_LIGHT;
            ctx.beginPath();
            ctx.arc(7, 7, 4, 0, Math.PI * 2);
            ctx.fill();
            this.cache['bush_puff'] = c;
        }

        // 14. CASTLE & FLAG ELEMENTS
        // Flagpole Ball
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.HILL_LIGHT;
            ctx.beginPath();
            ctx.arc(8, 8, 5, 0, Math.PI * 2);
            ctx.fill();
            this.cache['flag_ball'] = c;
        }
        // Flagpole Pole
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.HILL_LIGHT;
            ctx.fillRect(7, 0, 2, 16);
            this.cache['flag_pole'] = c;
        }
        // Flag Banner
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = C.HILL_LIGHT;
            ctx.beginPath();
            ctx.moveTo(16, 2);
            ctx.lineTo(0, 8);
            ctx.lineTo(16, 14);
            ctx.closePath();
            ctx.fill();
            this.cache['flag_banner'] = c;
        }
        // Castle Brick
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#404040';
            ctx.strokeRect(0.5, 0.5, 15, 15);
            ctx.fillRect(0, 8, 16, 1);
            this.cache['castle_brick'] = c;
        }
        // Castle Door
        {
            const { c, ctx } = this.createCanvas(16, 16);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 16, 16);
            this.cache['castle_door'] = c;
        }

        // 15. BRICK DEBRIS (8x8)
        {
            const { c, ctx } = this.createCanvas(8, 8);
            ctx.fillStyle = C.BRICK_MAIN;
            ctx.fillRect(1, 1, 6, 6);
            ctx.fillStyle = C.BRICK_LIGHT;
            ctx.fillRect(1, 1, 6, 2);
            ctx.fillStyle = C.BRICK_LINE;
            ctx.strokeRect(0.5, 0.5, 7, 7);
            this.cache['debris'] = c;
        }
    }

    renderMatrix(matrix, colorMap, w, h) {
        const { c, ctx } = this.createCanvas(w, h);
        this.drawPixelMatrix(ctx, matrix, colorMap);
        return c;
    }

    get(name) {
        return this.cache[name] || null;
    }
}

window.sprites = new SpriteManager();

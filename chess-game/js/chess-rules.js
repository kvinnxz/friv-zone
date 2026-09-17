/**
 * ChessRules - Motor de reglas de ajedrez puro
 * Implementa todas las reglas estándar de la FIDE:
 * - Movimientos de todas las piezas
 * - Enroque corto y largo (con verificación de no pasar por jaque)
 * - Captura al paso (En Passant)
 * - Promoción de peón (Dama, Torre, Alfil, Caballo)
 * - Detección de Jaque, Jaque Mate, Tablas por ahogado y material insuficiente
 * - Notación algebraica estándar (SAN)
 */

class ChessGame {
    constructor(fen) {
        this.reset(fen);
    }

    reset(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.turn = 'w';
        this.castling = { w: { k: true, q: true }, b: { k: true, q: true } };
        this.enPassant = null; // { r, c }
        this.halfMoves = 0;
        this.fullMoves = 1;
        this.history = [];
        this.positionCounts = {};

        this.loadFen(fen);
    }

    loadFen(fen) {
        const parts = fen.trim().split(/\s+/);
        const rows = parts[0].split('/');

        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let r = 0; r < 8; r++) {
            let c = 0;
            for (const char of rows[r]) {
                if (char >= '1' && char <= '8') {
                    c += parseInt(char, 10);
                } else {
                    const color = char === char.toUpperCase() ? 'w' : 'b';
                    const type = char.toLowerCase();
                    this.board[r][c] = { color, type };
                    c++;
                }
            }
        }

        this.turn = parts[1] === 'b' ? 'b' : 'w';

        const castlingStr = parts[2] || '-';
        this.castling = {
            w: { k: castlingStr.includes('K'), q: castlingStr.includes('Q') },
            b: { k: castlingStr.includes('k'), q: castlingStr.includes('q') }
        };

        const epStr = parts[3] || '-';
        if (epStr !== '-') {
            const file = epStr.charCodeAt(0) - 97;
            const rank = 8 - parseInt(epStr[1], 10);
            this.enPassant = { r: rank, c: file };
        } else {
            this.enPassant = null;
        }

        this.halfMoves = parseInt(parts[4] || '0', 10);
        this.fullMoves = parseInt(parts[5] || '1', 10);
        this.updatePositionCount();
    }

    toFen() {
        let fen = '';
        for (let r = 0; r < 8; r++) {
            let empty = 0;
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                }
            }
            if (empty > 0) fen += empty;
            if (r < 7) fen += '/';
        }

        fen += ` ${this.turn} `;

        let castlingStr = '';
        if (this.castling.w.k) castlingStr += 'K';
        if (this.castling.w.q) castlingStr += 'Q';
        if (this.castling.b.k) castlingStr += 'k';
        if (this.castling.b.q) castlingStr += 'q';
        fen += castlingStr || '-';

        fen += ' ';
        if (this.enPassant) {
            const file = String.fromCharCode(97 + this.enPassant.c);
            const rank = 8 - this.enPassant.r;
            fen += `${file}${rank}`;
        } else {
            fen += '-';
        }

        fen += ` ${this.halfMoves} ${this.fullMoves}`;
        return fen;
    }

    clone() {
        const copy = new ChessGame();
        copy.board = this.board.map(row => row.map(cell => (cell ? { ...cell } : null)));
        copy.turn = this.turn;
        copy.castling = {
            w: { ...this.castling.w },
            b: { ...this.castling.b }
        };
        copy.enPassant = this.enPassant ? { ...this.enPassant } : null;
        copy.halfMoves = this.halfMoves;
        copy.fullMoves = this.fullMoves;
        copy.positionCounts = { ...this.positionCounts };
        return copy;
    }

    getPiece(r, c) {
        if (r < 0 || r > 7 || c < 0 || c > 7) return null;
        return this.board[r][c];
    }

    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === 'k' && p.color === color) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    isSquareAttacked(r, c, byColor) {
        // Peones atacantes
        const pawnDir = byColor === 'w' ? 1 : -1;
        const pawnFromR = r + pawnDir;
        if (pawnFromR >= 0 && pawnFromR <= 7) {
            for (const pawnFromC of [c - 1, c + 1]) {
                if (pawnFromC >= 0 && pawnFromC <= 7) {
                    const p = this.board[pawnFromR][pawnFromC];
                    if (p && p.color === byColor && p.type === 'p') return true;
                }
            }
        }

        // Caballos atacantes
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const p = this.board[nr][nc];
                if (p && p.color === byColor && p.type === 'n') return true;
            }
        }

        // Rey atacante adyacente
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const p = this.board[nr][nc];
                    if (p && p.color === byColor && p.type === 'k') return true;
                }
            }
        }

        // Rayos diagonales (Alfil / Dama)
        const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagDirs) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }

        // Rayos rectilíneos (Torre / Dama)
        const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of straightDirs) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const p = this.board[nr][nc];
                if (p) {
                    if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }

        return false;
    }

    inCheck(color = this.turn) {
        const king = this.findKing(color);
        if (!king) return false;
        const enemy = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(king.r, king.c, enemy);
    }

    getPseudoMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece || piece.color !== this.turn) return [];

        const moves = [];
        const { color, type } = piece;
        const enemy = color === 'w' ? 'b' : 'w';

        if (type === 'p') {
            const dir = color === 'w' ? -1 : 1;
            const startRank = color === 'w' ? 6 : 1;
            const promoRank = color === 'w' ? 0 : 7;

            // 1 paso adelante
            const nr = r + dir;
            if (nr >= 0 && nr <= 7 && !this.board[nr][c]) {
                if (nr === promoRank) {
                    for (const promo of ['q', 'r', 'b', 'n']) {
                        moves.push({ from: { r, c }, to: { r: nr, c }, promotion: promo });
                    }
                } else {
                    moves.push({ from: { r, c }, to: { r: nr, c } });

                    // 2 pasos adelante desde posición inicial
                    const nr2 = r + 2 * dir;
                    if (r === startRank && !this.board[nr2][c]) {
                        moves.push({ from: { r, c }, to: { r: nr2, c }, isDoublePawn: true });
                    }
                }
            }

            // Capturas diagonales y En Passant
            for (const dc of [-1, 1]) {
                const nc = c + dc;
                if (nc >= 0 && nc <= 7 && nr >= 0 && nr <= 7) {
                    const target = this.board[nr][nc];
                    if (target && target.color === enemy) {
                        if (nr === promoRank) {
                            for (const promo of ['q', 'r', 'b', 'n']) {
                                moves.push({ from: { r, c }, to: { r: nr, c: nc }, promotion: promo, captured: target });
                            }
                        } else {
                            moves.push({ from: { r, c }, to: { r: nr, c: nc }, captured: target });
                        }
                    } else if (!target && this.enPassant && this.enPassant.r === nr && this.enPassant.c === nc) {
                        // En Passant
                        moves.push({
                            from: { r, c },
                            to: { r: nr, c: nc },
                            isEnPassant: true,
                            captured: this.board[r][nc]
                        });
                    }
                }
            }
        } else if (type === 'n') {
            const knightDirs = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [dr, dc] of knightDirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const target = this.board[nr][nc];
                    if (!target) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                    } else if (target.color === enemy) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc }, captured: target });
                    }
                }
            }
        } else if (type === 'b' || type === 'r' || type === 'q') {
            const directions = [];
            if (type === 'b' || type === 'q') directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
            if (type === 'r' || type === 'q') directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);

            for (const [dr, dc] of directions) {
                let nr = r + dr, nc = c + dc;
                while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                    const target = this.board[nr][nc];
                    if (!target) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                    } else {
                        if (target.color === enemy) {
                            moves.push({ from: { r, c }, to: { r: nr, c: nc }, captured: target });
                        }
                        break;
                    }
                    nr += dr;
                    nc += dc;
                }
            }
        } else if (type === 'k') {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                        const target = this.board[nr][nc];
                        if (!target) {
                            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                        } else if (target.color === enemy) {
                            moves.push({ from: { r, c }, to: { r: nr, c: nc }, captured: target });
                        }
                    }
                }
            }

            // Enroque
            const rank = color === 'w' ? 7 : 0;
            if (r === rank && c === 4 && !this.inCheck(color)) {
                // Enroque corto (Kingside)
                if (this.castling[color].k &&
                    !this.board[rank][5] && !this.board[rank][6] &&
                    this.board[rank][7] && this.board[rank][7].type === 'r' && this.board[rank][7].color === color &&
                    !this.isSquareAttacked(rank, 5, enemy) &&
                    !this.isSquareAttacked(rank, 6, enemy)) {
                    moves.push({ from: { r, c }, to: { r: rank, c: 6 }, isCastleK: true });
                }

                // Enroque largo (Queenside)
                if (this.castling[color].q &&
                    !this.board[rank][3] && !this.board[rank][2] && !this.board[rank][1] &&
                    this.board[rank][0] && this.board[rank][0].type === 'r' && this.board[rank][0].color === color &&
                    !this.isSquareAttacked(rank, 3, enemy) &&
                    !this.isSquareAttacked(rank, 2, enemy)) {
                    moves.push({ from: { r, c }, to: { r: rank, c: 2 }, isCastleQ: true });
                }
            }
        }

        return moves;
    }

    makeMove(move) {
        const { from, to, promotion, isCastleK, isCastleQ, isEnPassant, isDoublePawn } = move;
        const movingPiece = this.board[from.r][from.c];
        const capturedPiece = move.captured || this.board[to.r][to.c];

        const undoState = {
            move,
            movingPiece: { ...movingPiece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : null,
            castling: {
                w: { ...this.castling.w },
                b: { ...this.castling.b }
            },
            enPassant: this.enPassant ? { ...this.enPassant } : null,
            halfMoves: this.halfMoves,
            fullMoves: this.fullMoves
        };

        // Mover la pieza
        this.board[from.r][from.c] = null;

        if (promotion) {
            this.board[to.r][to.c] = { color: movingPiece.color, type: promotion };
        } else {
            this.board[to.r][to.c] = movingPiece;
        }

        // Manejo especial de En Passant
        if (isEnPassant) {
            this.board[from.r][to.c] = null;
        }

        // Manejo de Enroque
        if (isCastleK) {
            this.board[from.r][5] = this.board[from.r][7];
            this.board[from.r][7] = null;
        } else if (isCastleQ) {
            this.board[from.r][3] = this.board[from.r][0];
            this.board[from.r][0] = null;
        }

        // Derechos de enroque
        if (movingPiece.type === 'k') {
            this.castling[movingPiece.color].k = false;
            this.castling[movingPiece.color].q = false;
        } else if (movingPiece.type === 'r') {
            if (from.r === 7 && from.c === 0) this.castling.w.q = false;
            if (from.r === 7 && from.c === 7) this.castling.w.k = false;
            if (from.r === 0 && from.c === 0) this.castling.b.q = false;
            if (from.r === 0 && from.c === 7) this.castling.b.k = false;
        }

        if (capturedPiece && capturedPiece.type === 'r') {
            if (to.r === 7 && to.c === 0) this.castling.w.q = false;
            if (to.r === 7 && to.c === 7) this.castling.w.k = false;
            if (to.r === 0 && to.c === 0) this.castling.b.q = false;
            if (to.r === 0 && to.c === 7) this.castling.b.k = false;
        }

        if (isDoublePawn) {
            const epRank = (from.r + to.r) / 2;
            this.enPassant = { r: epRank, c: from.c };
        } else {
            this.enPassant = null;
        }

        if (movingPiece.type === 'p' || capturedPiece) {
            this.halfMoves = 0;
        } else {
            this.halfMoves++;
        }

        if (this.turn === 'b') {
            this.fullMoves++;
        }

        this.turn = this.turn === 'w' ? 'b' : 'w';

        this.updatePositionCount();
        return undoState;
    }

    unmakeMove(undoState) {
        const { move, movingPiece, capturedPiece, castling, enPassant, halfMoves, fullMoves } = undoState;
        const { from, to, isCastleK, isCastleQ, isEnPassant } = move;

        const currentPosKey = this.getPositionHash();
        if (this.positionCounts[currentPosKey]) {
            this.positionCounts[currentPosKey]--;
            if (this.positionCounts[currentPosKey] <= 0) {
                delete this.positionCounts[currentPosKey];
            }
        }

        this.board[from.r][from.c] = movingPiece;
        this.board[to.r][to.c] = null;

        if (capturedPiece) {
            if (isEnPassant) {
                this.board[from.r][to.c] = capturedPiece;
            } else {
                this.board[to.r][to.c] = capturedPiece;
            }
        }

        if (isCastleK) {
            this.board[from.r][7] = this.board[from.r][5];
            this.board[from.r][5] = null;
        } else if (isCastleQ) {
            this.board[from.r][0] = this.board[from.r][3];
            this.board[from.r][3] = null;
        }

        this.castling = castling;
        this.enPassant = enPassant;
        this.halfMoves = halfMoves;
        this.fullMoves = fullMoves;
        this.turn = movingPiece.color;
    }

    getLegalMoves(filterFrom = null) {
        const legal = [];
        const turn = this.turn;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (filterFrom && (filterFrom.r !== r || filterFrom.c !== c)) continue;

                const piece = this.board[r][c];
                if (piece && piece.color === turn) {
                    const pseudo = this.getPseudoMoves(r, c);
                    for (const m of pseudo) {
                        const undo = this.makeMove(m);
                        const leavesKingInCheck = this.inCheck(turn);
                        this.unmakeMove(undo);

                        if (!leavesKingInCheck) {
                            legal.push(m);
                        }
                    }
                }
            }
        }
        return legal;
    }

    playMove(move) {
        const san = this.moveToSan(move);
        const undoState = this.makeMove(move);
        const inCheck = this.inCheck(this.turn);
        const hasLegalMoves = this.getLegalMoves().length > 0;
        const isCheckmate = inCheck && !hasLegalMoves;

        let formattedSan = san;
        if (isCheckmate) {
            formattedSan = san.replace('+', '') + '#';
        } else if (inCheck && !san.includes('+')) {
            formattedSan += '+';
        }

        const historyItem = {
            san: formattedSan,
            move,
            undoState,
            fenBefore: undoState,
            fenAfter: this.toFen(),
            captured: undoState.capturedPiece
        };

        this.history.push(historyItem);
        return historyItem;
    }

    undoMove() {
        if (this.history.length === 0) return null;
        const last = this.history.pop();
        this.unmakeMove(last.undoState);
        return last;
    }

    getPositionHash() {
        let h = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                h += p ? `${p.color}${p.type}` : '.';
            }
        }
        h += `_${this.turn}`;
        h += `_${this.castling.w.k ? 1 : 0}${this.castling.w.q ? 1 : 0}${this.castling.b.k ? 1 : 0}${this.castling.b.q ? 1 : 0}`;
        h += `_${this.enPassant ? `${this.enPassant.r}${this.enPassant.c}` : '-'}`;
        return h;
    }

    updatePositionCount() {
        const hash = this.getPositionHash();
        this.positionCounts[hash] = (this.positionCounts[hash] || 0) + 1;
    }

    isThreefoldRepetition() {
        const hash = this.getPositionHash();
        return (this.positionCounts[hash] || 0) >= 3;
    }

    isInsufficientMaterial() {
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type !== 'k') {
                    pieces.push({ ...p, r, c });
                }
            }
        }

        if (pieces.length === 0) return true;

        if (pieces.length === 1) {
            return pieces[0].type === 'n' || pieces[0].type === 'b';
        }

        if (pieces.length === 2 && pieces[0].type === 'b' && pieces[1].type === 'b' && pieces[0].color !== pieces[1].color) {
            const sqColor0 = (pieces[0].r + pieces[0].c) % 2;
            const sqColor1 = (pieces[1].r + pieces[1].c) % 2;
            return sqColor0 === sqColor1;
        }

        return false;
    }

    getGameStatus() {
        const legalMoves = this.getLegalMoves();
        const check = this.inCheck(this.turn);

        if (legalMoves.length === 0) {
            if (check) {
                return {
                    over: true,
                    winner: this.turn === 'w' ? 'b' : 'w',
                    reason: 'checkmate',
                    description: `¡Jaque Mate! Ganan las ${this.turn === 'w' ? 'Negras' : 'Blancas'}.`
                };
            } else {
                return {
                    over: true,
                    winner: null,
                    reason: 'stalemate',
                    description: 'Tablas por ahogado.'
                };
            }
        }

        if (this.halfMoves >= 100) {
            return {
                over: true,
                winner: null,
                reason: 'fifty-move',
                description: 'Tablas por la regla de los 50 movimientos.'
            };
        }

        if (this.isThreefoldRepetition()) {
            return {
                over: true,
                winner: null,
                reason: 'threefold',
                description: 'Tablas por triple repetición de posición.'
            };
        }

        if (this.isInsufficientMaterial()) {
            return {
                over: true,
                winner: null,
                reason: 'insufficient',
                description: 'Tablas por material insuficiente.'
            };
        }

        return {
            over: false,
            inCheck: check,
            turn: this.turn
        };
    }

    moveToSan(move) {
        if (move.isCastleK) return 'O-O';
        if (move.isCastleQ) return 'O-O-O';

        const { from, to, promotion } = move;
        const piece = this.board[from.r][from.c];
        const isCapture = !!(move.captured || this.board[to.r][to.c] || move.isEnPassant);
        const toSquare = `${String.fromCharCode(97 + to.c)}${8 - to.r}`;
        const fromFile = String.fromCharCode(97 + from.c);

        if (piece.type === 'p') {
            let san = '';
            if (isCapture) {
                san = `${fromFile}x${toSquare}`;
            } else {
                san = toSquare;
            }
            if (promotion) {
                san += `=${promotion.toUpperCase()}`;
            }
            return san;
        }

        const pieceLetter = piece.type.toUpperCase();

        const others = this.getLegalMoves().filter(m =>
            m.to.r === to.r &&
            m.to.c === to.c &&
            (m.from.r !== from.r || m.from.c !== from.c) &&
            this.board[m.from.r][m.from.c] &&
            this.board[m.from.r][m.from.c].type === piece.type
        );

        let disambiguation = '';
        if (others.length > 0) {
            const sameFile = others.some(m => m.from.c === from.c);
            const sameRank = others.some(m => m.from.r === from.r);

            if (!sameFile) {
                disambiguation = fromFile;
            } else if (!sameRank) {
                disambiguation = `${8 - from.r}`;
            } else {
                disambiguation = `${fromFile}${8 - from.r}`;
            }
        }

        return `${pieceLetter}${disambiguation}${isCapture ? 'x' : ''}${toSquare}`;
    }

    getMaterial() {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        const score = { w: 0, b: 0 };
        const pieces = { w: [], b: [] };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p) {
                    score[p.color] += values[p.type];
                    pieces[p.color].push(p.type);
                }
            }
        }

        return {
            whiteScore: score.w,
            blackScore: score.b,
            diff: score.w - score.b,
            pieces
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessGame };
}
if (typeof window !== 'undefined') {
    window.ChessGame = ChessGame;
}

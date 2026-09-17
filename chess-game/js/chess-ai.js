/**
 * ChessAI - Motor de Inteligencia Artificial para Ajedrez
 * Implementa Minimax con poda Alfa-Beta, Tablas Posicionales (PST),
 * ordenamiento de movimientos (MVV-LVA) y búsqueda de quietud (Quiescence Search).
 */

class ChessAI {
    constructor() {
        // Valores de piezas en centipeones
        this.pieceValues = {
            p: 100,
            n: 320,
            b: 330,
            r: 500,
            q: 900,
            k: 20000
        };

        // Tablas de valores posicionales de piezas (Piece-Square Tables - PST)
        // Desde la perspectiva de las blancas (fila 0 = rango 8, fila 7 = rango 1)
        this.pst = {
            p: [
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [ 5,  5, 10, 27, 27, 10,  5,  5],
                [ 0,  0,  0, 25, 25,  0,  0,  0],
                [ 5, -5,-10,  0,  0,-10, -5,  5],
                [ 5, 10, 10,-25,-25, 10, 10,  5],
                [ 0,  0,  0,  0,  0,  0,  0,  0]
            ],
            n: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            b: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  0, 10, 15, 15, 10,  0,-10],
                [-10,  5,  5, 15, 15,  5,  5,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            r: [
                [ 0,  0,  0,  5,  5,  0,  0,  0],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [ 5, 10, 10, 10, 10, 10, 10,  5],
                [ 0,  0,  0,  0,  0,  0,  0,  0]
            ],
            q: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [  0,  0,  5,  5,  5,  5,  0, -5],
                [ -5,  0,  5,  5,  5,  5,  0, -5],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            k: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [ 20, 20,  0,  0,  0,  0, 20, 20],
                [ 20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };

        this.nodesEvaluated = 0;
    }

    /**
     * Evalúa la posición estática del tablero.
     * Retorna un valor positivo si las blancas tienen ventaja, negativo si las negras la tienen.
     */
    evaluate(game) {
        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board[r][c];
                if (!piece) continue;

                const val = this.pieceValues[piece.type];
                let pstVal = 0;

                if (piece.color === 'w') {
                    pstVal = this.pst[piece.type][r][c];
                    score += val + pstVal;
                } else {
                    // Para las negras, invertimos la fila (7 - r)
                    pstVal = this.pst[piece.type][7 - r][c];
                    score -= (val + pstVal);
                }
            }
        }

        return score;
    }

    /**
     * Ordena movimientos heurísticamente para maximizar podas Alfa-Beta.
     * MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
     */
    orderMoves(game, moves) {
        return moves.map(m => {
            let score = 0;
            const piece = game.board[m.from.r][m.from.c];
            const captured = m.captured || game.board[m.to.r][m.to.c];

            if (captured) {
                // Captura: premiar víctima valiosa tomada por atacante de menor valor
                const victimVal = this.pieceValues[captured.type] || 0;
                const attackerVal = this.pieceValues[piece ? piece.type : 'p'] || 0;
                score += 10000 + (victimVal * 10 - attackerVal);
            }

            if (m.promotion) {
                score += 9000;
            }

            if (m.isCastleK || m.isCastleQ) {
                score += 500;
            }

            return { move: m, score };
        }).sort((a, b) => b.score - a.score).map(item => item.move);
    }

    /**
     * Búsqueda de quietud (Quiescence Search)
     * Resuelve intercambios pendientes de piezas en nodos hoja para evitar el efecto horizonte.
     */
    quiescence(game, alpha, beta, isMaximizing, depthLeft = 3) {
        this.nodesEvaluated++;
        const standPat = this.evaluate(game);

        if (isMaximizing) {
            if (standPat >= beta) return beta;
            if (standPat > alpha) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (standPat < beta) beta = standPat;
        }

        if (depthLeft <= 0) return standPat;

        // Solo movimientos que sean capturas
        const captures = game.getLegalMoves().filter(m => m.captured || m.isEnPassant || game.board[m.to.r][m.to.c]);
        const orderedCaptures = this.orderMoves(game, captures);

        if (isMaximizing) {
            for (const move of orderedCaptures) {
                const undo = game.makeMove(move);
                const score = this.quiescence(game, alpha, beta, false, depthLeft - 1);
                game.unmakeMove(undo);

                if (score >= beta) return beta;
                if (score > alpha) alpha = score;
            }
            return alpha;
        } else {
            for (const move of orderedCaptures) {
                const undo = game.makeMove(move);
                const score = this.quiescence(game, alpha, beta, true, depthLeft - 1);
                game.unmakeMove(undo);

                if (score <= alpha) return alpha;
                if (score < beta) beta = score;
            }
            return beta;
        }
    }

    /**
     * Algoritmo Minimax con Poda Alfa-Beta
     */
    minimax(game, depth, alpha, beta, isMaximizing, useQuiescence = true) {
        this.nodesEvaluated++;

        const status = game.getGameStatus();
        if (status.over) {
            if (status.winner === 'w') return 100000 + depth;
            if (status.winner === 'b') return -100000 - depth;
            return 0; // Tablas
        }

        if (depth === 0) {
            if (useQuiescence) {
                return this.quiescence(game, alpha, beta, isMaximizing, 3);
            }
            return this.evaluate(game);
        }

        const legalMoves = game.getLegalMoves();
        const orderedMoves = this.orderMoves(game, legalMoves);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of orderedMoves) {
                const undo = game.makeMove(move);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, false, useQuiescence);
                game.unmakeMove(undo);

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Poda Beta
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of orderedMoves) {
                const undo = game.makeMove(move);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, true, useQuiescence);
                game.unmakeMove(undo);

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Poda Alfa
            }
            return minEval;
        }
    }

    /**
     * Encuentra la mejor jugada para el bot según el nivel seleccionado
     * @param {ChessGame} game 
     * @param {string} difficulty ('easy' | 'medium' | 'hard')
     * @returns {Promise<{ move: Object, evalScore: number, nodes: number }>}
     */
    async getBestMove(game, difficulty = 'medium') {
        this.nodesEvaluated = 0;
        const legalMoves = game.getLegalMoves();
        if (legalMoves.length === 0) return null;

        const isBotWhite = game.turn === 'w';

        // Pequeño retardo asíncrono para permitir actualizar la UI ("Pensando...")
        await new Promise(resolve => setTimeout(resolve, 300));

        // Nivel Fácil: movimientos aleatorios con sesgo ocasional hacia capturas
        if (difficulty === 'easy') {
            const captures = legalMoves.filter(m => m.captured || m.isEnPassant);
            // 40% de probabilidad de tomar una captura si existe, de lo contrario aleatorio
            if (captures.length > 0 && Math.random() < 0.4) {
                const randomCapture = captures[Math.floor(Math.random() * captures.length)];
                return { move: randomCapture, evalScore: 0, nodes: 1 };
            }
            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            return { move: randomMove, evalScore: 0, nodes: 1 };
        }

        // Nivel Medio: Profundidad 2 o 3 con PST y poda
        // Nivel Difícil: Profundidad 3 o 4 con búsqueda de quietud y poda avanzada
        const depth = difficulty === 'hard' ? 3 : 2;
        const useQuiescence = difficulty === 'hard';

        let bestMove = null;
        let bestEval = isBotWhite ? -Infinity : Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        const orderedMoves = this.orderMoves(game, legalMoves);

        for (const move of orderedMoves) {
            const undo = game.makeMove(move);
            const evaluation = this.minimax(game, depth - 1, alpha, beta, !isBotWhite, useQuiescence);
            game.unmakeMove(undo);

            if (isBotWhite) {
                if (evaluation > bestEval) {
                    bestEval = evaluation;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evaluation);
            } else {
                if (evaluation < bestEval) {
                    bestEval = evaluation;
                    bestMove = move;
                }
                beta = Math.min(beta, evaluation);
            }
        }

        // Si por alguna razón no se asignó (ej. todos iguales), tomar el primero
        if (!bestMove) {
            bestMove = legalMoves[0];
        }

        return {
            move: bestMove,
            evalScore: bestEval,
            nodes: this.nodesEvaluated
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessAI };
}
if (typeof window !== 'undefined') {
    window.ChessAI = ChessAI;
}

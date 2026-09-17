/**
 * ChessApp - Controlador principal de la interfaz y flujo de la partida
 */

class ChessApp {
    constructor() {
        this.game = new ChessGame();
        this.ai = new ChessAI();
        this.audio = new ChessAudio();

        // Configuración
        this.gameMode = 'bot'; // 'bot' o 'pvp'
        this.playerColor = 'w'; // En modo bot, bando del humano
        this.difficulty = 'medium';
        this.flipped = false;
        this.selectedSquare = null; // { r, c }
        this.legalMovesForSelected = [];
        this.lastMove = null; // { from: {r,c}, to: {r,c} }
        this.isBotThinking = false;
        this.pendingPromotion = null; // { from, to }

        // Elementos DOM
        this.boardEl = document.getElementById('chessboard');
        this.movesBodyEl = document.getElementById('movesBody');
        this.movesScrollEl = document.getElementById('movesScroll');
        this.evalBarWhite = document.getElementById('evalBarWhite');
        this.evalScoreText = document.getElementById('evalScoreText');
        this.gameMoveCountEl = document.getElementById('gameMoveCount');
        this.gameStatusDetailEl = document.getElementById('gameStatusDetail');

        this.botPlayerBar = document.getElementById('botPlayerBar');
        this.humanPlayerBar = document.getElementById('humanPlayerBar');
        this.botAvatar = document.getElementById('botAvatar');
        this.botStatusDot = document.getElementById('botStatusDot');
        this.botStatusText = document.getElementById('botStatusText');
        this.humanStatusDot = document.getElementById('humanStatusDot');
        this.humanStatusText = document.getElementById('humanStatusText');
        this.botCapturedEl = document.getElementById('botCaptured');
        this.humanCapturedEl = document.getElementById('humanCaptured');

        this.sideSelectorSection = document.getElementById('sideSelectorSection');
        this.diffSelectorSection = document.getElementById('diffSelectorSection');

        // Modales
        this.promotionModal = document.getElementById('promotionModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.gameOverIcon = document.getElementById('gameOverIcon');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverReason = document.getElementById('gameOverReason');

        this.init();
    }

    init() {
        this.renderBoard();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Selector de Modo de Juego (Bot vs 2 Jugadores)
        const btnModeBot = document.getElementById('btnModeBot');
        const btnModePvP = document.getElementById('btnModePvP');
        if (btnModeBot && btnModePvP) {
            btnModeBot.addEventListener('click', () => {
                if (this.gameMode === 'bot') return;
                this.gameMode = 'bot';
                btnModeBot.classList.add('active');
                btnModePvP.classList.remove('active');
                if (this.sideSelectorSection) this.sideSelectorSection.style.display = 'flex';
                if (this.diffSelectorSection) this.diffSelectorSection.style.display = 'flex';
                this.startNewGame();
            });
            btnModePvP.addEventListener('click', () => {
                if (this.gameMode === 'pvp') return;
                this.gameMode = 'pvp';
                btnModePvP.classList.add('active');
                btnModeBot.classList.remove('active');
                if (this.sideSelectorSection) this.sideSelectorSection.style.display = 'none';
                if (this.diffSelectorSection) this.diffSelectorSection.style.display = 'none';
                this.startNewGame();
            });
        }

        // Selector de tema
        const themeSelect = document.getElementById('themeSelect');
        themeSelect.addEventListener('change', (e) => {
            document.body.className = e.target.value;
        });

        // Botón de sonido
        const btnSound = document.getElementById('btnSound');
        const soundIconOn = document.getElementById('soundIconOn');
        const soundIconOff = document.getElementById('soundIconOff');
        btnSound.addEventListener('click', () => {
            const enabled = this.audio.toggleSound();
            soundIconOn.style.display = enabled ? 'block' : 'none';
            soundIconOff.style.display = enabled ? 'none' : 'block';
        });

        // Selector de Bando
        const btnSideWhite = document.getElementById('btnSideWhite');
        const btnSideBlack = document.getElementById('btnSideBlack');
        if (btnSideWhite && btnSideBlack) {
            btnSideWhite.addEventListener('click', () => {
                if (this.playerColor === 'w') return;
                btnSideWhite.classList.add('active');
                btnSideBlack.classList.remove('active');
                this.setPlayerSide('w');
            });
            btnSideBlack.addEventListener('click', () => {
                if (this.playerColor === 'b') return;
                btnSideBlack.classList.add('active');
                btnSideWhite.classList.remove('active');
                this.setPlayerSide('b');
            });
        }

        // Dificultad
        const diffTabs = document.querySelectorAll('.difficulty-tabs .diff-tab');
        diffTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                diffTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.difficulty = tab.dataset.level;
            });
        });

        // Botones de acción
        document.getElementById('btnNewGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('btnUndo').addEventListener('click', () => this.handleUndo());
        document.getElementById('btnFlip').addEventListener('click', () => this.toggleFlip());
        document.getElementById('btnRestartModal').addEventListener('click', () => {
            this.gameOverModal.classList.remove('open');
            this.startNewGame();
        });

        // Modal de Promoción
        document.querySelectorAll('.promo-option').forEach(option => {
            option.addEventListener('click', () => {
                const promo = option.dataset.promo;
                this.completePromotion(promo);
            });
        });

        // Eventos táctiles y ratón para Drag and Drop
        this.setupDragAndDrop();
    }

    setPlayerSide(color) {
        this.playerColor = color;
        this.flipped = (color === 'b');
        this.startNewGame();
    }

    startNewGame() {
        this.game.reset();
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.isBotThinking = false;
        this.pendingPromotion = null;
        this.gameOverModal.classList.remove('open');
        this.promotionModal.classList.remove('open');

        // Actualizar nombres y etiquetas
        const humanNameEl = document.querySelector('#humanPlayerBar .player-name');
        const botNameEl = document.querySelector('#botPlayerBar .player-name');
        const botRoleBadge = document.querySelector('#botPlayerBar .player-role-badge');

        if (this.gameMode === 'pvp') {
            if (humanNameEl) humanNameEl.textContent = 'Jugador 1 (Blancas)';
            if (botNameEl) botNameEl.textContent = 'Jugador 2 (Negras)';
            if (botRoleBadge) {
                botRoleBadge.textContent = 'HUMANO';
                botRoleBadge.className = 'player-role-badge human';
            }
            if (this.botAvatar) this.botAvatar.textContent = '👤';
            this.flipped = false;
        } else {
            if (botRoleBadge) {
                botRoleBadge.textContent = 'BOT';
                botRoleBadge.className = 'player-role-badge bot';
            }
            if (this.botAvatar) this.botAvatar.textContent = '🤖';

            if (this.playerColor === 'w') {
                if (humanNameEl) humanNameEl.textContent = 'Tú (Blancas)';
                if (botNameEl) botNameEl.textContent = 'DeepBot AI (Negras)';
                this.flipped = false;
            } else {
                if (humanNameEl) humanNameEl.textContent = 'Tú (Negras)';
                if (botNameEl) botNameEl.textContent = 'DeepBot AI (Blancas)';
                this.flipped = true;
            }
        }

        this.renderBoard();
        this.updateUI();

        // Si el jugador juega con negras en modo bot, el bot empieza
        if (this.gameMode === 'bot' && this.playerColor === 'b') {
            this.triggerBotMove();
        }
    }

    toggleFlip() {
        this.flipped = !this.flipped;
        this.renderBoard();
        this.updateUI();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';

        for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            for (let colIdx = 0; colIdx < 8; colIdx++) {
                const r = this.flipped ? 7 - rowIdx : rowIdx;
                const c = this.flipped ? 7 - colIdx : colIdx;

                const square = document.createElement('div');
                square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.r = r;
                square.dataset.c = c;

                // Coordenadas en los bordes
                if (colIdx === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'coord-rank';
                    rankLabel.textContent = `${8 - r}`;
                    square.appendChild(rankLabel);
                }
                if (rowIdx === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'coord-file';
                    fileLabel.textContent = String.fromCharCode(97 + c);
                    square.appendChild(fileLabel);
                }

                // Clic en la casilla
                square.addEventListener('click', () => this.handleSquareClick(r, c));

                this.boardEl.appendChild(square);
            }
        }

        this.refreshBoardPieces();
    }

    refreshBoardPieces() {
        const squares = this.boardEl.querySelectorAll('.square');
        const inCheck = this.game.inCheck(this.game.turn);
        const kingPos = inCheck ? this.game.findKing(this.game.turn) : null;

        squares.forEach(sq => {
            const r = parseInt(sq.dataset.r, 10);
            const c = parseInt(sq.dataset.c, 10);

            // Limpiar clases de estado anteriores
            sq.classList.remove('selected', 'last-move', 'hint-move', 'hint-capture', 'in-check');

            // Resaltar última jugada
            if (this.lastMove && (
                (this.lastMove.from.r === r && this.lastMove.from.c === c) ||
                (this.lastMove.to.r === r && this.lastMove.to.c === c)
            )) {
                sq.classList.add('last-move');
            }

            // Resaltar casilla seleccionada
            if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                sq.classList.add('selected');
            }

            // Resaltar rey en jaque
            if (kingPos && kingPos.r === r && kingPos.c === c) {
                sq.classList.add('in-check');
            }

            // Resaltar movimientos legales sugeridos
            const hintMove = this.legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
            if (hintMove) {
                const targetPiece = this.game.getPiece(r, c);
                if (targetPiece || hintMove.isEnPassant) {
                    sq.classList.add('hint-capture');
                } else {
                    sq.classList.add('hint-move');
                }
            }

            // Eliminar pieza vieja si existe
            const existingPiece = sq.querySelector('.piece');
            if (existingPiece) existingPiece.remove();

            // Dibujar pieza actual
            const piece = this.game.getPiece(r, c);
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece';
                pieceDiv.dataset.r = r;
                pieceDiv.dataset.c = c;
                pieceDiv.innerHTML = PIECE_SVGS[`${piece.color}${piece.type}`] || '';
                sq.appendChild(pieceDiv);
            }
        });
    }

    isCurrentPlayerTurn() {
        if (this.gameMode === 'pvp') return true;
        return this.game.turn === this.playerColor;
    }

    handleSquareClick(r, c) {
        if (this.isBotThinking) return;
        if (!this.isCurrentPlayerTurn()) return;

        // Si ya había una casilla seleccionada, intentamos mover
        if (this.selectedSquare) {
            const move = this.legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);

            if (move) {
                const piece = this.game.getPiece(this.selectedSquare.r, this.selectedSquare.c);
                const isPawnPromo = piece && piece.type === 'p' && (r === 0 || r === 7);

                if (isPawnPromo) {
                    this.openPromotionModal({ r: this.selectedSquare.r, c: this.selectedSquare.c }, { r, c }, piece.color);
                    return;
                }

                this.executeMove(move);
                this.selectedSquare = null;
                this.legalMovesForSelected = [];
                return;
            }
        }

        // Seleccionar una pieza del turno actual
        const piece = this.game.getPiece(r, c);
        const canSelect = piece && (this.gameMode === 'pvp' ? piece.color === this.game.turn : piece.color === this.playerColor);
        if (canSelect) {
            this.selectedSquare = { r, c };
            this.legalMovesForSelected = this.game.getLegalMoves({ r, c });
        } else {
            this.selectedSquare = null;
            this.legalMovesForSelected = [];
        }

        this.refreshBoardPieces();
    }

    setupDragAndDrop() {
        let draggedPiece = null;
        let startR = null, startC = null;
        let ghostEl = null;

        const onPointerDown = (e) => {
            if (this.isBotThinking) return;
            if (!this.isCurrentPlayerTurn()) return;

            const pieceEl = e.target.closest('.piece');
            if (!pieceEl) return;

            const r = parseInt(pieceEl.dataset.r, 10);
            const c = parseInt(pieceEl.dataset.c, 10);
            const piece = this.game.getPiece(r, c);

            const canSelect = piece && (this.gameMode === 'pvp' ? piece.color === this.game.turn : piece.color === this.playerColor);
            if (!canSelect) return;

            draggedPiece = pieceEl;
            startR = r;
            startC = c;

            this.selectedSquare = { r, c };
            this.legalMovesForSelected = this.game.getLegalMoves({ r, c });
            this.refreshBoardPieces();

            // Crear elemento fantasma que sigue el puntero
            ghostEl = document.createElement('div');
            ghostEl.className = 'drag-ghost';
            ghostEl.innerHTML = pieceEl.innerHTML;
            document.body.appendChild(ghostEl);

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            ghostEl.style.left = `${clientX}px`;
            ghostEl.style.top = `${clientY}px`;

            pieceEl.classList.add('dragging');
        };

        const onPointerMove = (e) => {
            if (!draggedPiece || !ghostEl) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            ghostEl.style.left = `${clientX}px`;
            ghostEl.style.top = `${clientY}px`;
        };

        const onPointerUp = (e) => {
            if (!draggedPiece) return;

            draggedPiece.classList.remove('dragging');
            if (ghostEl) {
                ghostEl.remove();
                ghostEl = null;
            }

            const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
            const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

            const elemBelow = document.elementFromPoint(clientX, clientY);
            const squareBelow = elemBelow ? elemBelow.closest('.square') : null;

            if (squareBelow) {
                const targetR = parseInt(squareBelow.dataset.r, 10);
                const targetC = parseInt(squareBelow.dataset.c, 10);

                if (targetR !== startR || targetC !== startC) {
                    const move = this.legalMovesForSelected.find(m => m.to.r === targetR && m.to.c === targetC);
                    if (move) {
                        const piece = this.game.getPiece(startR, startC);
                        const isPawnPromo = piece && piece.type === 'p' && (targetR === 0 || targetR === 7);

                        if (isPawnPromo) {
                            this.openPromotionModal({ r: startR, c: startC }, { r: targetR, c: targetC }, piece.color);
                            draggedPiece = null;
                            return;
                        }

                        this.executeMove(move);
                        this.selectedSquare = null;
                        this.legalMovesForSelected = [];
                        draggedPiece = null;
                        return;
                    }
                }
            }

            draggedPiece = null;
            this.refreshBoardPieces();
        };

        this.boardEl.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        this.boardEl.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });
    }

    openPromotionModal(from, to, pieceColor = this.game.turn) {
        this.pendingPromotion = { from, to };
        const color = pieceColor;

        document.getElementById('promoQueenSvg').innerHTML = PIECE_SVGS[`${color}q`];
        document.getElementById('promoRookSvg').innerHTML = PIECE_SVGS[`${color}r`];
        document.getElementById('promoBishopSvg').innerHTML = PIECE_SVGS[`${color}b`];
        document.getElementById('promoKnightSvg').innerHTML = PIECE_SVGS[`${color}n`];

        this.promotionModal.classList.add('open');
    }

    completePromotion(promoType) {
        this.promotionModal.classList.remove('open');
        if (!this.pendingPromotion) return;

        const { from, to } = this.pendingPromotion;
        const move = this.legalMovesForSelected.find(m =>
            m.to.r === to.r && m.to.c === to.c && m.promotion === promoType
        ) || { from, to, promotion: promoType };

        this.pendingPromotion = null;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];

        this.executeMove(move);
    }

    async executeMove(move) {
        const isCapture = !!(move.captured || this.game.getPiece(move.to.r, move.to.c) || move.isEnPassant);
        const isCastle = move.isCastleK || move.isCastleQ;

        this.game.playMove(move);
        this.lastMove = move;

        if (this.game.inCheck(this.game.turn)) {
            this.audio.playCheck();
        } else if (isCastle) {
            this.audio.playCastle();
        } else if (isCapture) {
            this.audio.playCapture();
        } else {
            this.audio.playMove();
        }

        this.refreshBoardPieces();
        this.updateUI();

        const status = this.game.getGameStatus();
        if (status.over) {
            this.handleGameOver(status);
            return;
        }

        // Si estamos en modo Bot y ahora le toca al bot
        if (this.gameMode === 'bot' && this.game.turn !== this.playerColor) {
            await this.triggerBotMove();
        }
    }

    async triggerBotMove() {
        this.isBotThinking = true;
        this.updateTurnUI();

        try {
            const result = await this.ai.getBestMove(this.game, this.difficulty);
            if (result && result.move) {
                const move = result.move;
                const isCapture = !!(move.captured || this.game.getPiece(move.to.r, move.to.c) || move.isEnPassant);
                const isCastle = move.isCastleK || move.isCastleQ;

                this.game.playMove(move);
                this.lastMove = move;

                if (this.game.inCheck(this.game.turn)) {
                    this.audio.playCheck();
                } else if (isCastle) {
                    this.audio.playCastle();
                } else if (isCapture) {
                    this.audio.playCapture();
                } else {
                    this.audio.playMove();
                }
            }
        } catch (err) {
            console.error('Error en turno del bot:', err);
        } finally {
            this.isBotThinking = false;
            this.refreshBoardPieces();
            this.updateUI();

            const status = this.game.getGameStatus();
            if (status.over) {
                this.handleGameOver(status);
            }
        }
    }

    handleUndo() {
        if (this.isBotThinking) return;

        if (this.gameMode === 'bot') {
            // En modo bot deshaz bot + jugador
            if (this.game.history.length >= 2) {
                this.game.undoMove();
                this.game.undoMove();
            } else if (this.game.history.length === 1) {
                this.game.undoMove();
            }
        } else {
            // En modo PvP deshaz 1 turno humano
            if (this.game.history.length >= 1) {
                this.game.undoMove();
            }
        }

        const lastHistory = this.game.history[this.game.history.length - 1];
        this.lastMove = lastHistory ? lastHistory.move : null;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];

        this.refreshBoardPieces();
        this.updateUI();
    }

    updateUI() {
        this.updateTurnUI();
        this.updateMovesTable();
        this.updateMaterialAndCaptured();
        this.updateEvaluationBar();
    }

    updateTurnUI() {
        const turn = this.game.turn;
        this.gameMoveCountEl.textContent = `Turno ${this.game.fullMoves}`;

        if (this.gameMode === 'pvp') {
            const isWhiteTurn = turn === 'w';
            if (isWhiteTurn) {
                this.humanPlayerBar.classList.add('active-turn');
                this.botPlayerBar.classList.remove('active-turn');
                this.humanStatusDot.classList.add('active');
                this.humanStatusText.textContent = 'Mueven Blancas';
                this.botStatusDot.classList.remove('active');
                this.botStatusText.textContent = 'Esperando';
                this.gameStatusDetailEl.textContent = this.game.inCheck('w') ? '¡Blancas en Jaque!' : 'Turno de Blancas';
            } else {
                this.botPlayerBar.classList.add('active-turn');
                this.humanPlayerBar.classList.remove('active-turn');
                this.botStatusDot.classList.add('active');
                this.botStatusText.textContent = 'Mueven Negras';
                this.humanStatusDot.classList.remove('active');
                this.humanStatusText.textContent = 'Esperando';
                this.gameStatusDetailEl.textContent = this.game.inCheck('b') ? '¡Negras en Jaque!' : 'Turno de Negras';
            }
            return;
        }

        // Modo Bot
        const isHumanTurn = turn === this.playerColor;

        if (this.isBotThinking) {
            this.botPlayerBar.classList.add('active-turn');
            this.humanPlayerBar.classList.remove('active-turn');
            this.botAvatar.classList.add('bot-thinking');
            this.botStatusDot.classList.add('active');
            this.botStatusText.textContent = 'Calculando jugada...';
            this.humanStatusDot.classList.remove('active');
            this.humanStatusText.textContent = 'Esperando al bot';
            this.gameStatusDetailEl.textContent = 'DeepBot AI está pensando...';
        } else if (isHumanTurn) {
            this.humanPlayerBar.classList.add('active-turn');
            this.botPlayerBar.classList.remove('active-turn');
            this.botAvatar.classList.remove('bot-thinking');
            this.humanStatusDot.classList.add('active');
            this.humanStatusText.textContent = 'Tu turno';
            this.botStatusDot.classList.remove('active');
            this.botStatusText.textContent = 'Esperando';

            if (this.game.inCheck(this.playerColor)) {
                this.gameStatusDetailEl.textContent = '¡Estás en Jaque!';
            } else {
                this.gameStatusDetailEl.textContent = 'Tu turno de mover';
            }
        } else {
            this.botPlayerBar.classList.add('active-turn');
            this.humanPlayerBar.classList.remove('active-turn');
            this.botAvatar.classList.remove('bot-thinking');
            this.botStatusDot.classList.add('active');
            this.botStatusText.textContent = 'Turno del bot';
            this.humanStatusDot.classList.remove('active');
            this.humanStatusText.textContent = 'Esperando';
            this.gameStatusDetailEl.textContent = 'Turno de DeepBot AI';
        }
    }

    updateMovesTable() {
        this.movesBodyEl.innerHTML = '';
        const history = this.game.history;

        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const whiteMove = history[i];
            const blackMove = history[i + 1];

            const tr = document.createElement('tr');

            const tdNum = document.createElement('td');
            tdNum.className = 'move-num';
            tdNum.textContent = `${moveNum}.`;

            const tdWhite = document.createElement('td');
            tdWhite.className = `move-cell ${i === history.length - 1 ? 'active-move' : ''}`;
            tdWhite.textContent = whiteMove ? whiteMove.san : '';

            const tdBlack = document.createElement('td');
            tdBlack.className = `move-cell ${i + 1 === history.length - 1 ? 'active-move' : ''}`;
            tdBlack.textContent = blackMove ? blackMove.san : '';

            tr.appendChild(tdNum);
            tr.appendChild(tdWhite);
            tr.appendChild(tdBlack);
            this.movesBodyEl.appendChild(tr);
        }

        // Auto-scroll al final del historial
        this.movesScrollEl.scrollTop = this.movesScrollEl.scrollHeight;
    }

    updateMaterialAndCaptured() {
        // Calcular piezas capturadas comparando con el inventario inicial
        const initial = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        const currentW = { p: 0, n: 0, b: 0, r: 0, q: 0 };
        const currentB = { p: 0, n: 0, b: 0, r: 0, q: 0 };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.game.getPiece(r, c);
                if (p && p.type !== 'k') {
                    if (p.color === 'w') currentW[p.type]++;
                    else currentB[p.type]++;
                }
            }
        }

        // Piezas capturadas por el jugador humano (piezas negras perdidas)
        const capturedByHuman = [];
        // Piezas capturadas por el bot (piezas blancas perdidas)
        const capturedByBot = [];

        const pieceOrder = ['q', 'r', 'b', 'n', 'p'];
        for (const type of pieceOrder) {
            const lostB = Math.max(0, initial[type] - currentB[type]);
            for (let i = 0; i < lostB; i++) capturedByHuman.push({ color: 'b', type });

            const lostW = Math.max(0, initial[type] - currentW[type]);
            for (let i = 0; i < lostW; i++) capturedByBot.push({ color: 'w', type });
        }

        // Renderizar en UI
        this.renderCapturedList(this.humanCapturedEl, capturedByHuman, this.game.getMaterial().diff);
        this.renderCapturedList(this.botCapturedEl, capturedByBot, -this.game.getMaterial().diff);
    }

    renderCapturedList(container, pieces, scoreDiff) {
        container.innerHTML = '';
        pieces.forEach(p => {
            const span = document.createElement('span');
            span.className = 'captured-icon';
            span.innerHTML = PIECE_SVGS[`${p.color}${p.type}`] || '';
            container.appendChild(span);
        });

        if (scoreDiff > 0) {
            const badge = document.createElement('span');
            badge.className = 'captured-diff';
            badge.textContent = `+${scoreDiff}`;
            container.appendChild(badge);
        }
    }

    updateEvaluationBar() {
        const rawScore = this.ai.evaluate(this.game); // + favorable a blancas, - favorable a negras
        // Convertir puntuación de centipeones a porcentaje (50% = igualado)
        // Función sigmoide para suavizar valores extremos
        const evalInPawns = rawScore / 100;
        const percentage = 50 + (2 / (1 + Math.exp(-0.35 * evalInPawns)) - 1) * 50;
        const clampedPct = Math.min(96, Math.max(4, percentage));

        this.evalBarWhite.style.height = `${clampedPct}%`;

        let displayVal = Math.abs(evalInPawns).toFixed(1);
        if (rawScore > 0) displayVal = `+${displayVal}`;
        else if (rawScore < 0) displayVal = `-${displayVal}`;
        else displayVal = '0.0';

        this.evalScoreText.textContent = displayVal;
    }

    handleGameOver(status) {
        if (this.gameMode === 'pvp') {
            if (status.reason === 'checkmate') {
                this.audio.playVictory();
                this.gameOverIcon.textContent = '🏆';
                const winnerName = status.winner === 'w' ? 'Jugador 1 (Blancas)' : 'Jugador 2 (Negras)';
                this.gameOverTitle.textContent = '¡Jaque Mate!';
                this.gameOverReason.textContent = `¡Victoria para ${winnerName}!`;
            } else {
                this.gameOverIcon.textContent = '🤝';
                this.gameOverTitle.textContent = 'Tablas';
                this.gameOverReason.textContent = status.description;
            }
        } else {
            const isHumanWinner = status.winner === this.playerColor;
            if (status.reason === 'checkmate') {
                if (isHumanWinner) {
                    this.audio.playVictory();
                    this.gameOverIcon.textContent = '🏆';
                    this.gameOverTitle.textContent = '¡Victoria Magistral!';
                    this.gameOverReason.textContent = 'Has derrotado a DeepBot AI por Jaque Mate.';
                } else {
                    this.audio.playDefeat();
                    this.gameOverIcon.textContent = '💀';
                    this.gameOverTitle.textContent = 'Jaque Mate';
                    this.gameOverReason.textContent = 'DeepBot AI te ha vencido. ¡Inténtalo de nuevo!';
                }
            } else {
                this.gameOverIcon.textContent = '🤝';
                this.gameOverTitle.textContent = 'Tablas';
                this.gameOverReason.textContent = status.description;
            }
        }

        this.gameStatusDetailEl.textContent = status.description;
        this.gameOverModal.classList.add('open');
    }
}

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.chessApp = new ChessApp();
});

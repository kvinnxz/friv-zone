/**
 * FRIV-ZONE ARCADE HUB - MOTOR PRINCIPAL DE LA PLATAFORMA
 * Gestiona el catálogo de juegos, efectos de sonido Web Audio, reproductor integrado,
 * pantalla completa, búsqueda dinámica, ruleta de juego aleatorio y favoritos.
 */

// =============================================================================
// CATÁLOGO OFICIAL DE JUEGOS DISPONIBLES EN EL WORKSPACE
// =============================================================================
const GAMES_CATALOG = [
    {
        id: 'retro-mario-bros',
        title: 'Super Mario Bros NES',
        category: 'arcade',
        categoryLabel: 'Arcade & Retro',
        path: 'retro-mario-bros/index.html',
        icon: '🍄',
        subicon: '8-BIT NES',
        tag: 'CLÁSICO',
        badgeClass: 'badge-retro',
        colorAccent: '#FF2A2A',
        glow: 'rgba(255, 42, 42, 0.45)',
        gradient: 'linear-gradient(135deg, #7f0000, #d32f2f)',
        rating: '5.0 ★',
        desc: 'El clásico de plataformas 2D recreado con físicas NES, monedas doradas, champiñones, goombas y sonido chiptune 8-bit.',
        controls: [
            { key: 'A / D o ◀ ▶', action: 'Mover a Mario' },
            { key: 'W / Espacio', action: 'Saltar' },
            { key: 'Shift', action: 'Correr rápido' }
        ]
    },
    {
        id: 'tetris-game',
        title: 'Tetris Neon Arcade',
        category: 'arcade',
        categoryLabel: 'Arcade & Puzzle',
        path: 'tetris-game/index.html',
        icon: '🧱',
        subicon: 'SRS PUZZLE',
        tag: 'NUEVO',
        badgeClass: 'badge-new',
        colorAccent: '#00F0FF',
        glow: 'rgba(0, 240, 255, 0.45)',
        gradient: 'linear-gradient(135deg, #051329, #0052cc, #00f0ff)',
        rating: '5.0 ★',
        desc: 'El legendario Tetris en versión neón arcade con rotación SRS, retención de piezas (Hold), música Korobeiniki y controles táctiles.',
        controls: [
            { key: 'A / D o ◀ ▶', action: 'Mover pieza lateralmente' },
            { key: 'W / Arriba / X', action: 'Rotar pieza 90° (SRS)' },
            { key: 'S / Abajo', action: 'Caída suave (Soft drop)' },
            { key: 'Espacio', action: 'Caída instantánea (Hard drop)' },
            { key: 'C / Shift', action: 'Guardar pieza (Hold)' }
        ]
    },
    {
        id: 'silksong-game',
        title: 'Silksong: Pharloom Chronicles',
        category: 'action',
        categoryLabel: 'Acción & Aventura',
        path: 'silksong-game/index.html',
        icon: '🪡',
        subicon: 'METROIDVANIA',
        tag: 'HOT',
        badgeClass: 'badge-hot',
        colorAccent: '#FF0055',
        glow: 'rgba(255, 0, 85, 0.45)',
        gradient: 'linear-gradient(135deg, #4a001a, #c2185b)',
        rating: '4.9 ★',
        desc: 'Acompaña a Hornet por las misteriosas cavernas de Pharloom con mecánicas de seda, pogo con aguja, saltos ágiles y combate letal.',
        controls: [
            { key: 'A / D o ◀ ▶', action: 'Moverse' },
            { key: 'Espacio / W', action: 'Saltar' },
            { key: 'J / Z', action: 'Ataque de Aguja' },
            { key: 'K / X', action: 'Dash rápido' },
            { key: 'Q / E', action: 'Tejer y Curar Seda' }
        ]
    },
    {
        id: 'cyber-velocity-3d',
        title: 'Cyber Velocity 3D',
        category: '3d',
        categoryLabel: 'Carreras & 3D',
        path: 'cyber-velocity-3d/index.html',
        icon: '🚀',
        subicon: 'THREE.JS 3D',
        tag: '3D',
        badgeClass: 'badge-3d',
        colorAccent: '#00F0FF',
        glow: 'rgba(0, 240, 255, 0.45)',
        gradient: 'linear-gradient(135deg, #002244, #008ba3, #00e676)',
        rating: '4.9 ★',
        desc: 'Carreras a gran velocidad en una autopista futurista cyberpunk con Three.js. Esquiva obstáculos y activa el turbo propulsor.',
        controls: [
            { key: 'A / D o ◀ ▶', action: 'Girar Nave' },
            { key: 'W o Shift', action: 'Activar Turbo Nitro' },
            { key: 'Espacio', action: 'Frenar' }
        ]
    },
    {
        id: 'slitherio-game',
        title: 'Neon Slither.io',
        category: 'action',
        categoryLabel: 'Acción Multijugador',
        path: 'slitherio-game/index.html',
        icon: '🐍',
        subicon: 'MULTI-BOTS',
        tag: 'HOT',
        badgeClass: 'badge-hot',
        colorAccent: '#25DF5D',
        glow: 'rgba(37, 223, 93, 0.45)',
        gradient: 'linear-gradient(135deg, #0d321d, #1b5e20)',
        rating: '4.8 ★',
        desc: 'Devora orbes brillantes de energía para crecer sin parar, encierra a las serpientes rivales con tu cuerpo y sé el líder de la arena.',
        controls: [
            { key: 'Ratón', action: 'Dirigir cabeza de la serpiente' },
            { key: 'Clic Izq / Espacio', action: 'Aceleración Turbo' }
        ]
    },
    {
        id: 'neon-surge',
        title: 'Neon Surge: Chrono Survivor',
        category: 'action',
        categoryLabel: 'Acción Cyberpunk',
        path: 'neon-surge/index.html',
        icon: '⚡',
        subicon: 'BULLET-TIME',
        tag: 'NUEVO',
        badgeClass: 'badge-new',
        colorAccent: '#FFE600',
        glow: 'rgba(255, 230, 0, 0.45)',
        gradient: 'linear-gradient(135deg, #311b92, #6200ea)',
        rating: '4.9 ★',
        desc: 'Videojuego arcade de disparos con mecánica de tiempo bala (Chrono Shift), armas cibernéticas y oleadas implacables.',
        controls: [
            { key: 'W A S D', action: 'Mover nave' },
            { key: 'Ratón / Clic', action: 'Apuntar y Disparar' },
            { key: 'Espacio / Shift', action: 'Cámara Lenta (Chrono Shift)' }
        ]
    },
    {
        id: 'culebrita-game',
        title: 'Culebrita Retro & Neón',
        category: 'arcade',
        categoryLabel: 'Arcade Clásico',
        path: 'culebrita-game/index.html',
        icon: '🍏',
        subicon: 'NOSTALGIA',
        tag: 'CLÁSICO',
        badgeClass: 'badge-classic',
        colorAccent: '#FF6600',
        glow: 'rgba(255, 102, 0, 0.45)',
        gradient: 'linear-gradient(135deg, #e65100, #ff8f00)',
        rating: '4.7 ★',
        desc: 'La clásica serpiente de los móviles retro con efectos de neón, manzanas doradas, mejoras de velocidad y multiplicador de puntos.',
        controls: [
            { key: 'Flechas / WASD', action: 'Cambiar de dirección' },
            { key: 'Espacio', action: 'Pausar partida' },
            { key: 'P', action: 'Tienda de Skins' }
        ]
    },
    {
        id: 'buscaminas',
        title: 'Buscaminas Deluxe',
        category: 'strategy',
        categoryLabel: 'Lógica & Tablero',
        path: 'buscaminas/index.html',
        icon: '💣',
        subicon: 'LÓGICA',
        tag: 'POPULAR',
        badgeClass: 'badge-classic',
        colorAccent: '#8B2FFF',
        glow: 'rgba(139, 47, 255, 0.45)',
        gradient: 'linear-gradient(135deg, #240046, #5a189a)',
        rating: '4.8 ★',
        desc: 'Despeja el tablero sin detonar ninguna mina. Primer clic 100% protegido, marcador digital y niveles principiante a experto.',
        controls: [
            { key: 'Clic Izquierdo', action: 'Revelar casilla' },
            { key: 'Clic Derecho', action: 'Colocar bandera 🚩' },
            { key: 'Carita 🙂', action: 'Reiniciar partida' }
        ]
    },
    {
        id: 'chess-game',
        title: 'Ajedrez Clásico & IA',
        category: 'strategy',
        categoryLabel: 'Lógica & Estrategia',
        path: 'chess-game/index.html',
        icon: '♟️',
        subicon: 'ESTRATEGIA',
        tag: 'POPULAR',
        badgeClass: 'badge-retro',
        colorAccent: '#0088FF',
        glow: 'rgba(0, 136, 255, 0.45)',
        gradient: 'linear-gradient(135deg, #0d47a1, #1976d2)',
        rating: '4.9 ★',
        desc: 'El deporte de la mente en tu navegador con cálculo de jugadas legales, jaques, enroques, inteligencia artificial y modo local.',
        controls: [
            { key: 'Clic o Arrastrar', action: 'Mover piezas de ajedrez' },
            { key: 'Doble Clic', action: 'Selección rápida' }
        ]
    },
    {
        id: 'mario-game',
        title: 'Super Mario Bros Arcade',
        category: 'arcade',
        categoryLabel: 'Arcade Clásico',
        path: 'mario-game/index.html',
        icon: '🎮',
        subicon: 'ARCADE WEB',
        tag: 'RETRO',
        badgeClass: 'badge-retro',
        colorAccent: '#E040FB',
        glow: 'rgba(224, 64, 251, 0.45)',
        gradient: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
        rating: '4.8 ★',
        desc: 'Edición alternativa arcade de Mario Bros en pantalla retro clásica con sonido vintage y monedas por recolectar.',
        controls: [
            { key: 'Flechas / WASD', action: 'Moverse' },
            { key: 'Espacio', action: 'Saltar' },
            { key: 'M', action: 'Silenciar' }
        ]
    }
];

// =============================================================================
// SINTETIZADOR DE AUDIO RETRO (WEB AUDIO API)
// Efectos sonoros sin necesidad de archivos externos.
// =============================================================================
class FrivAudioSynth {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playHoverPop() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {
            // Ignorar errores de audio autoplay si el usuario no ha interactuado
        }
    }

    playGameLaunchSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // Doble tono ascendente tipo "Power Up" arcade
            const freqs = [329.63, 440, 659.25, 880];
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                const startTime = now + (idx * 0.05);
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.12, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.16);
            });
        } catch (e) {}
    }

    playRouletteTick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'square';
            osc.frequency.setValueAtTime(300 + Math.random() * 200, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.03);
        } catch (e) {}
    }

    playFavoriteTing() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(784, now); // G5
            osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }
}

// =============================================================================
// GESTIÓN DEL ESTADO Y LA APLICACIÓN
// =============================================================================
class FrivPlatformApp {
    constructor() {
        this.games = GAMES_CATALOG;
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.favorites = this.loadFavorites();
        this.audio = new FrivAudioSynth();
        this.activeGame = null;
        this.isRouletteSpinning = false;

        // Referencias DOM
        this.gamesGrid = document.getElementById('games-grid');
        this.searchInput = document.getElementById('game-search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.emptyState = document.getElementById('empty-state');
        this.categoryPills = document.querySelectorAll('.cat-pill');
        this.btnResetFilters = document.getElementById('btn-reset-filters');
        
        // Modal Reproductor
        this.playerModal = document.getElementById('game-player-modal');
        this.playerBackdrop = document.getElementById('player-backdrop');
        this.btnClosePlayer = document.getElementById('btn-close-player');
        this.gameIframe = document.getElementById('game-iframe');
        this.gameLoader = document.getElementById('game-loading-spinner');
        this.playerTitle = document.getElementById('player-game-title');
        this.playerIcon = document.getElementById('player-game-icon');
        this.playerCategory = document.getElementById('player-game-category');
        this.playerTag = document.getElementById('player-game-tag');
        this.btnPlayerFavorite = document.getElementById('btn-player-favorite');
        this.playerFavoriteIcon = document.getElementById('player-favorite-icon');
        this.btnPlayerReload = document.getElementById('btn-player-reload');
        this.btnPlayerExternal = document.getElementById('btn-player-external');
        this.btnPlayerFullscreen = document.getElementById('btn-player-fullscreen');
        this.btnPlayerControlsInfo = document.getElementById('btn-player-controls-info');
        this.instructionsPanel = document.getElementById('player-instructions-panel');
        this.instructionsContent = document.getElementById('instructions-content');
        this.btnCloseInstructions = document.getElementById('btn-close-instructions');

        // Botones Generales
        this.btnRandom = document.getElementById('btn-random-game');
        this.btnSound = document.getElementById('btn-toggle-sound');
        this.soundIcon = document.getElementById('sound-icon');
        this.btnTheme = document.getElementById('btn-toggle-theme');
        this.btnHomeLogo = document.getElementById('btn-home-logo');

        // Modal Ruleta
        this.rouletteModal = document.getElementById('roulette-modal');
        this.rouletteDisplay = document.getElementById('roulette-display');

        // Contadores
        this.countFavoritesEl = document.getElementById('count-favorites');

        this.init();
    }

    init() {
        this.updateCategoryCounts();
        this.renderGames();
        this.bindEvents();
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('friv_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('friv_favorites', JSON.stringify(this.favorites));
        } catch (e) {}
        this.updateCategoryCounts();
    }

    toggleFavorite(gameId) {
        const index = this.favorites.indexOf(gameId);
        let isFav = false;
        if (index >= 0) {
            this.favorites.splice(index, 1);
            isFav = false;
        } else {
            this.favorites.push(gameId);
            isFav = true;
            this.audio.playFavoriteTing();
        }
        this.saveFavorites();
        this.updateCardFavoriteState(gameId, isFav);
        this.updatePlayerFavoriteButton();

        // Si estamos viendo la categoría favoritos y se quita uno, refrescar vista
        if (this.activeCategory === 'favorites') {
            this.renderGames();
        }
    }

    updateCardFavoriteState(gameId, isFav) {
        const cardBtn = document.querySelector(`.btn-card-fav[data-id="${gameId}"]`);
        if (cardBtn) {
            cardBtn.classList.toggle('is-favorite', isFav);
            cardBtn.innerHTML = isFav ? '❤️' : '🤍';
        }
    }

    updateCategoryCounts() {
        if (this.countFavoritesEl) {
            this.countFavoritesEl.textContent = this.favorites.length;
        }
    }

    // =========================================================================
    // RENDERIZADO DEL MOSAICO DE JUEGOS
    // =========================================================================
    renderGames() {
        const filtered = this.games.filter(game => {
            // Filtro por categoría
            if (this.activeCategory === 'favorites') {
                if (!this.favorites.includes(game.id)) return false;
            } else if (this.activeCategory !== 'all') {
                if (game.category !== this.activeCategory) return false;
            }

            // Filtro por búsqueda
            if (this.searchQuery.trim() !== '') {
                const q = this.searchQuery.toLowerCase();
                const matchTitle = game.title.toLowerCase().includes(q);
                const matchDesc = game.desc.toLowerCase().includes(q);
                const matchCat = game.categoryLabel.toLowerCase().includes(q);
                const matchTag = game.tag.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchCat && !matchTag) return false;
            }

            return true;
        });

        this.gamesGrid.innerHTML = '';

        if (filtered.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            filtered.forEach(game => {
                const card = this.createGameCard(game);
                this.gamesGrid.appendChild(card);
            });
        }
    }

    createGameCard(game) {
        const isFav = this.favorites.includes(game.id);
        const card = document.createElement('article');
        card.className = 'game-card';
        card.setAttribute('data-id', game.id);
        card.setAttribute('role', 'listitem');
        card.style.setProperty('--card-accent', game.colorAccent);
        card.style.setProperty('--card-glow', game.glow);

        card.innerHTML = `
            <div class="card-thumbnail">
                <div class="card-bg-gradient" style="background: ${game.gradient}"></div>
                
                <div class="card-top-badges">
                    <span class="tag-badge ${game.badgeClass}">${game.tag}</span>
                    <button class="btn-card-fav ${isFav ? 'is-favorite' : ''}" data-id="${game.id}" title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}" aria-label="Favorito">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>

                <div class="card-illustration">
                    <span class="game-big-icon">${game.icon}</span>
                    <span class="game-card-subicon">${game.subicon}</span>
                </div>

                <div class="card-hover-play-overlay">
                    <div class="play-action-pill">
                        <span>▶</span>
                        <span>¡JUGAR YA!</span>
                    </div>
                </div>
            </div>

            <div class="card-info">
                <div class="card-title-row">
                    <h3 class="card-title">${game.title}</h3>
                    <span class="card-rating">${game.rating}</span>
                </div>
                <p class="card-description">${game.desc}</p>
                <div class="card-footer-tags">
                    <span class="card-category-text">${game.categoryLabel}</span>
                    <span class="card-quick-controls">⚡ Instantáneo</span>
                    <span class="mobile-play-btn">▶ JUGAR</span>
                </div>
            </div>
        `;

        // Eventos en la tarjeta
        card.addEventListener('mouseenter', () => {
            this.audio.playHoverPop();
        });

        card.addEventListener('click', (e) => {
            // Si hizo clic en el corazón de favoritos, no abrir juego
            if (e.target.closest('.btn-card-fav')) {
                e.stopPropagation();
                this.toggleFavorite(game.id);
                return;
            }
            this.launchGame(game);
        });

        return card;
    }

    // =========================================================================
    // REPRODUCTOR ARCADE INTEGRADO
    // =========================================================================
    launchGame(game) {
        this.activeGame = game;
        this.audio.playGameLaunchSound();

        // Actualizar datos del modal
        this.playerTitle.textContent = game.title;
        this.playerIcon.textContent = game.icon;
        this.playerCategory.textContent = game.categoryLabel;
        this.playerTag.textContent = game.tag;
        this.updatePlayerFavoriteButton();

        // Preparar contenido de controles
        this.instructionsContent.innerHTML = game.controls.map(ctrl => `
            <div class="control-item">
                <span class="key-tag">${ctrl.key}</span>
                <span>${ctrl.action}</span>
            </div>
        `).join('');

        // Cargar iframe
        this.gameLoader.classList.remove('hidden');
        this.gameIframe.src = game.path;

        this.gameIframe.onload = () => {
            this.gameLoader.classList.add('hidden');
            // Darle foco al juego para que los controles de teclado respondan de inmediato
            try {
                this.gameIframe.focus();
                if (this.gameIframe.contentWindow) {
                    this.gameIframe.contentWindow.focus();
                }
            } catch (e) {}
        };

        // Mostrar modal
        this.playerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closePlayer() {
        this.playerModal.classList.add('hidden');
        this.instructionsPanel.classList.add('hidden');
        document.body.style.overflow = '';
        this.gameIframe.src = 'about:blank';
        this.activeGame = null;
    }

    reloadCurrentGame() {
        if (!this.activeGame) return;
        this.gameLoader.classList.remove('hidden');
        this.gameIframe.src = this.activeGame.path + '?t=' + Date.now();
    }

    openCurrentGameExternal() {
        if (!this.activeGame) return;
        window.open(this.activeGame.path, '_blank');
    }

    toggleFullscreen() {
        const target = this.playerModal;
        if (!document.fullscreenElement) {
            if (target.requestFullscreen) {
                target.requestFullscreen();
            } else if (target.webkitRequestFullscreen) {
                target.webkitRequestFullscreen();
            }
            document.getElementById('fullscreen-icon').textContent = '🗗';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            document.getElementById('fullscreen-icon').textContent = '⛶';
        }
    }

    updatePlayerFavoriteButton() {
        if (!this.activeGame) return;
        const isFav = this.favorites.includes(this.activeGame.id);
        this.playerFavoriteIcon.textContent = isFav ? '❤️' : '🤍';
        this.btnPlayerFavorite.title = isFav ? 'Quitar de favoritos' : 'Añadir a favoritos';
    }

    // =========================================================================
    // RULETA DE JUEGO ALEATORIO
    // =========================================================================
    triggerRandomGame() {
        if (this.isRouletteSpinning) return;
        this.isRouletteSpinning = true;

        this.rouletteModal.classList.remove('hidden');
        let counter = 0;
        const totalSpins = 18;
        const speed = 75;

        const interval = setInterval(() => {
            const randomGame = this.games[Math.floor(Math.random() * this.games.length)];
            this.rouletteDisplay.innerHTML = `
                <span class="item-icon">${randomGame.icon}</span>
                <h4 class="item-title">${randomGame.title}</h4>
            `;
            this.audio.playRouletteTick();
            counter++;

            if (counter >= totalSpins) {
                clearInterval(interval);
                const finalGame = this.games[Math.floor(Math.random() * this.games.length)];
                this.rouletteDisplay.innerHTML = `
                    <span class="item-icon">${finalGame.icon}</span>
                    <h4 class="item-title" style="color: var(--friv-yellow)">${finalGame.title}</h4>
                `;
                this.audio.playGameLaunchSound();

                setTimeout(() => {
                    this.rouletteModal.classList.add('hidden');
                    this.isRouletteSpinning = false;
                    this.launchGame(finalGame);
                }, 750);
            }
        }, speed);
    }

    // =========================================================================
    // ASIGNACIÓN DE EVENTOS
    // =========================================================================
    bindEvents() {
        // Búsqueda
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.clearSearchBtn.classList.toggle('hidden', this.searchQuery.length === 0);
            this.renderGames();
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.clearSearchBtn.classList.add('hidden');
            this.renderGames();
            this.searchInput.focus();
        });

        // Filtros de categorías
        this.categoryPills.forEach(pill => {
            pill.addEventListener('click', () => {
                this.audio.playHoverPop();
                this.categoryPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.activeCategory = pill.getAttribute('data-category');
                this.renderGames();
            });
        });

        // Restablecer filtros
        this.btnResetFilters.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.clearSearchBtn.classList.add('hidden');
            this.activeCategory = 'all';
            this.categoryPills.forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-category') === 'all');
            });
            this.renderGames();
        });

        // Modal Reproductor controles
        this.btnClosePlayer.addEventListener('click', () => this.closePlayer());
        this.playerBackdrop.addEventListener('click', () => this.closePlayer());
        this.btnPlayerReload.addEventListener('click', () => this.reloadCurrentGame());
        this.btnPlayerExternal.addEventListener('click', () => this.openCurrentGameExternal());
        this.btnPlayerFullscreen.addEventListener('click', () => this.toggleFullscreen());
        
        this.btnPlayerFavorite.addEventListener('click', () => {
            if (this.activeGame) {
                this.toggleFavorite(this.activeGame.id);
            }
        });

        this.btnPlayerControlsInfo.addEventListener('click', () => {
            this.instructionsPanel.classList.toggle('hidden');
        });

        this.btnCloseInstructions.addEventListener('click', () => {
            this.instructionsPanel.classList.add('hidden');
        });

        // Ruleta aleatoria
        this.btnRandom.addEventListener('click', () => this.triggerRandomGame());

        // Toggle Sonido UI
        this.btnSound.addEventListener('click', () => {
            this.audio.enabled = !this.audio.enabled;
            this.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
            if (this.audio.enabled) {
                this.audio.playHoverPop();
            }
        });

        // Toggle Tema
        this.btnTheme.addEventListener('click', () => {
            document.body.classList.toggle('theme-classic');
        });

        // Click Logo vuelve a inicio
        this.btnHomeLogo.addEventListener('click', (e) => {
            e.preventDefault();
            this.btnResetFilters.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Atajos de Teclado Globales
        window.addEventListener('keydown', (e) => {
            // Si el foco está en el input de búsqueda, no interceptar teclas
            if (document.activeElement === this.searchInput) return;

            if (e.key === 'Escape') {
                if (!this.playerModal.classList.contains('hidden')) {
                    this.closePlayer();
                }
            } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
                if (!this.playerModal.classList.contains('hidden')) {
                    e.preventDefault();
                    this.toggleFullscreen();
                }
            } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
                if (this.playerModal.classList.contains('hidden') && !this.isRouletteSpinning) {
                    e.preventDefault();
                    this.triggerRandomGame();
                }
            }
        });
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.frivPlatform = new FrivPlatformApp();
});

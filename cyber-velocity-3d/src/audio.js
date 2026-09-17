/**
 * Cyber Velocity 3D - Web Audio API Procedural Sound & Music Engine
 * Genera música Synthwave procedural y efectos de sonido futuristas sin dependencias externas.
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.musicPlaying = false;
        this.musicTimer = null;
        this.tempo = 125; // BPM
        this.step = 0;
        
        // Engine hum oscillators
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineGain = null;
        this.engineFilter = null;
        
        // Master volume
        this.masterGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);
            
            this.setupEngineSound();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio no disponible:", e);
        }
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupEngineSound() {
        if (!this.ctx) return;
        
        // Engine hum dual oscillators
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc2.type = 'triangle';
        this.engineOsc1.frequency.value = 55; // A1
        this.engineOsc2.frequency.value = 110;

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 250;

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.05;

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineOsc1.start();
        this.engineOsc2.start();
    }

    updateEngine(speedRatio, isBoosting) {
        if (!this.initialized || !this.engineOsc1) return;
        const targetFreq = 50 + speedRatio * 85 + (isBoosting ? 60 : 0);
        const targetCutoff = 200 + speedRatio * 800 + (isBoosting ? 1200 : 0);
        const targetGain = 0.04 + speedRatio * 0.08 + (isBoosting ? 0.06 : 0);

        const now = this.ctx.currentTime;
        this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.05);
        this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.05);
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // DISPARO LÁSER (Frecuencia en barrido descendente)
    playShoot() {
        if (!this.initialized) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    // RECOLECCIÓN DE CRISTALES (Campanilla de dos notas ascendentes)
    playPickup() {
        if (!this.initialized) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        [523.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);

            gain.gain.setValueAtTime(0.12, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        });
    }

    // ACTIVACIÓN DE TURBO NITRO (Whoosh y barrido ascendente)
    playBoost() {
        if (!this.initialized) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.46);
    }

    // IMPACTO / DAÑO (Golpe metálico y zumbido eléctrico)
    playHit() {
        if (!this.initialized) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    // EXPLOSIÓN (Ruido blanco modulado + resonador grave)
    playExplosion() {
        if (!this.initialized) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        // Buffer de ruido blanco
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    // MÚSICA DE FONDO PROCEDURAL SYNTHWAVE
    startMusic() {
        if (this.musicPlaying || !this.initialized) return;
        this.musicPlaying = true;
        this.step = 0;
        this.scheduleMusicStep();
    }

    scheduleMusicStep() {
        if (!this.musicPlaying) return;

        const interval = (60 / this.tempo) / 4; // 16th notes
        const now = this.ctx.currentTime;

        // Notas de bajo estilo Cyberpunk (Escala Menor: A, F, G, E)
        const bassNotes = [
            55, 55, 110, 55,  55, 55, 110, 55,
            43.65, 43.65, 87.31, 43.65, 43.65, 43.65, 87.31, 43.65,
            49, 49, 98, 49, 49, 49, 98, 49,
            41.2, 41.2, 82.41, 41.2, 41.2, 41.2, 82.41, 41.2
        ];
        
        const currentBassNote = bassNotes[this.step % bassNotes.length];

        // Tocar bajo en cada semicorchea
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(currentBassNote, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + interval * 0.8);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + interval * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + interval);

        // Batería rítmica: Kick en 0, 4, 8, 12; Snare en 4, 12
        const beatIndex = this.step % 16;
        if (beatIndex % 4 === 0) {
            // Kick
            const kickOsc = this.ctx.createOscillator();
            const kickGain = this.ctx.createGain();
            kickOsc.frequency.setValueAtTime(140, now);
            kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

            kickGain.gain.setValueAtTime(0.2, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            kickOsc.connect(kickGain);
            kickGain.connect(this.masterGain);
            kickOsc.start(now);
            kickOsc.stop(now + 0.11);
        }

        // Arpegio sintetizador futurista
        const arpScale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
        if (beatIndex % 2 === 0) {
            const arpFreq = arpScale[(this.step / 2) % arpScale.length];
            const arpOsc = this.ctx.createOscillator();
            const arpGain = this.ctx.createGain();
            arpOsc.type = 'sine';
            arpOsc.frequency.setValueAtTime(arpFreq, now);

            arpGain.gain.setValueAtTime(0.035, now);
            arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            arpOsc.connect(arpGain);
            arpGain.connect(this.masterGain);
            arpOsc.start(now);
            arpOsc.stop(now + 0.15);
        }

        this.step++;
        this.musicTimer = setTimeout(() => this.scheduleMusicStep(), interval * 1000);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

// Instancia global
window.soundSystem = new SoundSystem();

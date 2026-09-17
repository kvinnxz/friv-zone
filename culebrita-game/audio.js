/**
 * Culebrita Neo-Arcade: Procedural Audio Synthesizer (Web Audio API)
 * Genera efectos arcade retro y ambientación synthwave en tiempo real sin archivos externos.
 */

class SoundFX {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicEnabled = false;
        this.musicInterval = null;
        this.musicStep = 0;
        this.tempo = 125; // BPM
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

    setMute(mute) {
        this.isMuted = mute;
        if (mute && this.isMusicEnabled) {
            this.stopMusic();
        }
    }

    // Efecto cuando la serpiente come una fruta normal
    playEat(combo = 1) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Tono sube según el combo
        const baseFreq = 380 + Math.min(combo * 45, 600);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t + 0.1);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.13);
    }

    // Efecto cuando recolecta un Power-Up especial
    playPowerUp(type = 'gold') {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const notes = type === 'ice' ? [600, 750, 900, 1200] : [440, 554.37, 659.25, 880];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const noteTime = t + idx * 0.05;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.22, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteTime);
            osc.stop(noteTime + 0.16);
        });
    }

    // Sonido de Combo especial (x3, x4...)
    playCombo() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = t + i * 0.04;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, startTime);

            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.13);
        });
    }

    // Efecto de choque / Game Over
    playDie() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        
        // Oscilador de caída grave
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);

        // Generar ráfaga de ruido blanco para el impacto/explosión
        try {
            const bufferSize = this.ctx.sampleRate * 0.35;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(900, t);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.35);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            whiteNoise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            whiteNoise.start(t);
            whiteNoise.stop(t + 0.35);
        } catch (e) {
            // Silencioso si buffer falla
        }
    }

    // Clic de interfaz
    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.05);
    }

    // Sintetizador de música de fondo Synthwave procedural
    toggleMusic(forceState) {
        this.init();
        this.isMusicEnabled = forceState !== undefined ? forceState : !this.isMusicEnabled;

        if (this.isMusicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.isMusicEnabled;
    }

    startMusic() {
        this.stopMusic();
        if (this.isMuted) return;
        this.init();

        const bassline = [
            110, 110, 110, 110,  // A2
            130.81, 130.81, 130.81, 130.81, // C3
            98.00, 98.00, 98.00, 98.00,  // G2
            82.41, 82.41, 98.00, 110     // E2 -> G2 -> A2
        ];

        const arpeggio = [
            440, 523.25, 659.25, 523.25,
            523.25, 659.25, 783.99, 659.25,
            392, 493.88, 587.33, 493.88,
            329.63, 392, 493.88, 440
        ];

        const stepTime = (60 / this.tempo) / 2; // corcheas

        this.musicInterval = setInterval(() => {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            const step = this.musicStep % bassline.length;

            // Bajo synth
            const bassOsc = this.ctx.createOscillator();
            const bassFilter = this.ctx.createBiquadFilter();
            const bassGain = this.ctx.createGain();

            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(bassline[step], t);

            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(320, t);
            bassFilter.frequency.exponentialRampToValueAtTime(140, t + stepTime * 0.8);

            bassGain.gain.setValueAtTime(0.12, t);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 0.9);

            bassOsc.connect(bassFilter);
            bassFilter.connect(bassGain);
            bassGain.connect(this.ctx.destination);

            bassOsc.start(t);
            bassOsc.stop(t + stepTime);

            // Arpegio sutil cada 2 pasos
            if (step % 2 === 0) {
                const arpOsc = this.ctx.createOscillator();
                const arpGain = this.ctx.createGain();
                arpOsc.type = 'triangle';
                arpOsc.frequency.setValueAtTime(arpeggio[step], t);

                arpGain.gain.setValueAtTime(0.04, t);
                arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 1.5);

                arpOsc.connect(arpGain);
                arpGain.connect(this.ctx.destination);

                arpOsc.start(t);
                arpOsc.stop(t + stepTime * 1.5);
            }

            this.musicStep++;
        }, stepTime * 1000);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Instancia global
window.soundFX = new SoundFX();

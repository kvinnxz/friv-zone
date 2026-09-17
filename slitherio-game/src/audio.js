// Audio Manager con Web Audio API para efectos dinámicos sin archivos externos

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.boostOsc = null;
        this.boostGain = null;
        this.isBoosting = false;
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

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.isBoosting) {
            this.stopBoostSound();
        }
        return this.enabled;
    }

    playEatSound(size = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const baseFreq = 420 + Math.min(size * 40, 200) + Math.random() * 60;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, this.ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            // Audio context error ignore
        }
    }

    startBoostSound() {
        if (!this.enabled || this.isBoosting) return;
        this.init();
        if (!this.ctx) return;

        try {
            this.boostOsc = this.ctx.createOscillator();
            this.boostGain = this.ctx.createGain();

            this.boostOsc.type = 'sawtooth';
            this.boostOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
            this.boostOsc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.5);

            // Filtro pasa bajos para darle un zumbido tipo motor/plasma
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, this.ctx.currentTime);

            this.boostGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            this.boostGain.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + 0.15);

            this.boostOsc.connect(filter);
            filter.connect(this.boostGain);
            this.boostGain.connect(this.ctx.destination);

            this.boostOsc.start();
            this.isBoosting = true;
        } catch (e) {
            this.isBoosting = false;
        }
    }

    stopBoostSound() {
        if (!this.isBoosting || !this.boostGain || !this.ctx) return;
        try {
            this.boostGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
            if (this.boostOsc) {
                this.boostOsc.stop(this.ctx.currentTime + 0.1);
            }
        } catch (e) {}
        this.isBoosting = false;
        this.boostOsc = null;
        this.boostGain = null;
    }

    playDeathSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        this.stopBoostSound();

        try {
            // Explosión y desintegración de energía
            const duration = 0.6;
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + duration);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) {}
    }

    playKillSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, this.ctx.currentTime);
            osc.frequency.setValueAtTime(680, this.ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.35);
        } catch (e) {}
    }
}

export const sound = new AudioManager();

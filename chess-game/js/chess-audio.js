/**
 * ChessAudio - Generador y sintetizador de efectos de sonido usando Web Audio API.
 * 100% autónomo, no requiere archivos de audio externos.
 */

class ChessAudio {
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

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playMove() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playCapture() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Golpe de captura más percusivo y profundo
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.12);

        // Segundo toque para simular choque de dos piezas
        setTimeout(() => {
            if (!this.ctx) return;
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            const t = this.ctx.currentTime;
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(180, t);
            osc2.frequency.exponentialRampToValueAtTime(70, t + 0.06);

            gain2.gain.setValueAtTime(0.3, t);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start();
            osc2.stop(t + 0.06);
        }, 35);
    }

    playCastle() {
        if (!this.enabled) return;
        this.playMove();
        setTimeout(() => this.playMove(), 120);
    }

    playCheck() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.25);
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = this.ctx.currentTime;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(t + 0.3);
            }, idx * 100);
        });
    }

    playDefeat() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 415.30, 392, 349.23]; // A4, Ab4, G4, F4
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = this.ctx.currentTime;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(t + 0.35);
            }, idx * 130);
        });
    }
}

if (typeof window !== 'undefined') {
    window.ChessAudio = ChessAudio;
}

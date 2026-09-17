// ==========================================================================
// AUDIO ENGINE: Sintetizador Web Audio API 8-Bit Chiptune Retro
// 100% Nativo, sin dependencias ni archivos de audio externos.
// ==========================================================================

class RetroAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmPlaying = false;
        this.bgmInterval = null;
        this.bgmStep = 0;
    }

    // Inicializa o reanuda el contexto de audio en respuesta al primer clic/tecla
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
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBGM();
        }
        return !this.muted;
    }

    // Crea un oscilador de onda cuadrada/triangular para sonido retro
    playTone(freq, type = 'square', duration = 0.1, gainVal = 0.15, freqEnd = null) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            if (freqEnd !== null) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), now + duration);
            }

            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // Ignorar errores de audio contextual
        }
    }

    // Generador de ráfaga de ruido blanco para explosiones/aplastamientos
    playNoise(duration = 0.1, gainVal = 0.12) {
        if (this.muted || !this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + duration);

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch (e) {
            // Ignorar errores
        }
    }

    // Salto de Mario (frecuencia ascendente rápida de 150Hz a 580Hz)
    playJump() {
        this.init();
        this.playTone(150, 'square', 0.14, 0.18, 580);
    }

    // Moneda clásica: dos tonos agudos rápidos B5 (987.77 Hz) -> E6 (1318.51 Hz)
    playCoin() {
        this.init();
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Tono 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(987.77, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.setValueAtTime(0.2, now + 0.08);
        gain1.gain.linearRampToValueAtTime(0.001, now + 0.09);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.09);

        // Tono 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1318.51, now + 0.08);
        gain2.gain.setValueAtTime(0.2, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.38);
    }

    // Golpe a bloque sólido / cabeza
    playBump() {
        this.init();
        this.playTone(180, 'triangle', 0.09, 0.25, 60);
    }

    // Aplastar Goomba
    playStomp() {
        this.init();
        this.playTone(320, 'square', 0.08, 0.2, 100);
        this.playNoise(0.07, 0.15);
    }

    // Romper bloque de ladrillo
    playBlockBreak() {
        this.init();
        this.playTone(200, 'square', 0.12, 0.2, 80);
        this.playNoise(0.18, 0.2);
    }

    // Sonido de muerte de Mario
    playDie() {
        this.init();
        this.stopBGM();
        if (this.muted || !this.ctx) return;
        const notes = [
            { f: 500, d: 0.12 },
            { f: 450, d: 0.12 },
            { f: 400, d: 0.12 },
            { f: 300, d: 0.16 },
            { f: 200, d: 0.35 }
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => {
                this.playTone(n.f, 'triangle', n.d, 0.22);
            }, delay * 1000);
            delay += n.d * 0.9;
        });
    }

    // Fanfarria de Victoria al alcanzar el banderín
    playStageClear() {
        this.init();
        this.stopBGM();
        if (this.muted || !this.ctx) return;
        const melody = [
            { f: 392, d: 0.1 },  // G4
            { f: 523, d: 0.1 },  // C5
            { f: 659, d: 0.1 },  // E5
            { f: 784, d: 0.12 }, // G5
            { f: 1046, d: 0.18 },// C6
            { f: 784, d: 0.12 }, // G5
            { f: 1046, d: 0.35 } // C6
        ];
        let delay = 0;
        melody.forEach(m => {
            setTimeout(() => {
                this.playTone(m.f, 'square', m.d, 0.2);
            }, delay * 1000);
            delay += m.d;
        });
    }

    // Sonido Game Over
    playGameOver() {
        this.init();
        this.stopBGM();
        if (this.muted || !this.ctx) return;
        const notes = [
            { f: 523, d: 0.18 }, // C5
            { f: 392, d: 0.18 }, // G4
            { f: 330, d: 0.25 }, // E4
            { f: 440, d: 0.2 },  // A4
            { f: 494, d: 0.2 },  // B4
            { f: 440, d: 0.2 },  // A4
            { f: 415, d: 0.2 },  // G#4
            { f: 466, d: 0.2 },  // A#4
            { f: 415, d: 0.45 }  // G#4
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => {
                this.playTone(n.f, 'square', n.d, 0.18);
            }, delay * 1000);
            delay += n.d * 0.95;
        });
    }

    // Música de fondo 8-bit sintetizada en tiempo real (Overworld Theme simplificado)
    startBGM() {
        if (this.muted || this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;
        this.bgmStep = 0;

        // Notas del tema Overworld en frecuencias Hz
        const E5 = 659.25, C5 = 523.25, G5 = 783.99, G4 = 392.00, A4 = 440.00, B4 = 493.88, D5 = 587.33, E4 = 329.63;
        const pattern = [
            E5, E5, 0, E5, 0, C5, E5, 0,
            G5, 0, 0, 0, G4, 0, 0, 0,
            C5, 0, 0, G4, 0, 0, E4, 0,
            0, A4, 0, B4, 0, 466.16, A4, 0
        ];

        const stepTime = 135; // ms por semicorchea aprox
        this.bgmInterval = setInterval(() => {
            if (!this.bgmPlaying || this.muted) return;
            const freq = pattern[this.bgmStep % pattern.length];
            if (freq > 0) {
                this.playTone(freq, 'square', 0.09, 0.06);
                // Bajo complementario
                if (this.bgmStep % 4 === 0) {
                    this.playTone(freq / 2, 'triangle', 0.12, 0.08);
                }
            }
            this.bgmStep++;
        }, stepTime);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

// Instancia global del sistema de audio
window.retroAudio = new RetroAudio();

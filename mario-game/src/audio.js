// Web Audio API Retro Sound Effects and Chiptune Synthesizer
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.musicTimer = null;
        this.currentNoteIndex = 0;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.22;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.45;
        this.sfxGain.connect(this.masterGain);
    }

    resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }
        return this.isMuted;
    }

    playJump(isSuper = false) {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const startFreq = isSuper ? 180 : 150;
        const endFreq = isSuper ? 660 : 540;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    playCoin() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // B5 then E6
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.setValueAtTime(0.4, now + 0.08);
        gain1.gain.linearRampToValueAtTime(0.01, now + 0.1);

        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.1);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain2.gain.setValueAtTime(0.4, now + 0.08);
        gain2.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.45);
    }

    playStomp() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playKick() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playBlockBump() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.05);
        osc.frequency.linearRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playBlockBreak() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        // Crunch burst
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const f = 100 + Math.random() * 200;
            osc.frequency.setValueAtTime(f, now + i * 0.03);
            osc.frequency.exponentialRampToValueAtTime(30, now + i * 0.03 + 0.12);

            gain.gain.setValueAtTime(0.4, now + i * 0.03);
            gain.gain.linearRampToValueAtTime(0.01, now + i * 0.03 + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.03);
            osc.stop(now + i * 0.03 + 0.12);
        }
    }

    playPowerupAppear() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [330, 392, 659, 523, 587, 784];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const time = now + idx * 0.06;
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.linearRampToValueAtTime(0.01, time + 0.055);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.055);
        });
    }

    playPowerup() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [330, 392, 659, 523, 587, 784, 880, 1046.5];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const time = now + idx * 0.07;
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.35, time);
            gain.gain.linearRampToValueAtTime(0.01, time + 0.065);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.065);
        });
    }

    playPipe() {
        if (this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [200, 180, 160, 140, 120, 100];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const time = now + idx * 0.04;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.linearRampToValueAtTime(0.01, time + 0.038);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.038);
        });
    }

    playDie() {
        if (this.isMuted) return;
        this.stopMusic();
        this.resume();
        const now = this.ctx.currentTime;
        const melody = [
            { f: 500, d: 0.12 },
            { f: 450, d: 0.12 },
            { f: 400, d: 0.12 },
            { f: 350, d: 0.20 },
            { f: 200, d: 0.15 },
            { f: 180, d: 0.15 },
            { f: 150, d: 0.35 }
        ];
        let offset = 0;
        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, now + offset);
            gain.gain.setValueAtTime(0.4, now + offset);
            gain.gain.linearRampToValueAtTime(0.01, now + offset + note.d);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + offset);
            osc.stop(now + offset + note.d);
            offset += note.d + 0.02;
        });
    }

    playStageClear() {
        if (this.isMuted) return;
        this.stopMusic();
        this.resume();
        const now = this.ctx.currentTime;
        // Classic fanfare sequence
        const fanfare = [
            { f: 523.25, d: 0.1 }, // C5
            { f: 659.25, d: 0.1 }, // E5
            { f: 783.99, d: 0.1 }, // G5
            { f: 1046.5, d: 0.15 }, // C6
            { f: 880.00, d: 0.15 }, // A5
            { f: 1046.5, d: 0.35 }  // C6
        ];
        let offset = 0;
        fanfare.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, now + offset);
            gain.gain.setValueAtTime(0.4, now + offset);
            gain.gain.linearRampToValueAtTime(0.01, now + offset + note.d);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + offset);
            osc.stop(now + offset + note.d);
            offset += note.d + 0.03;
        });
    }

    // Authentic Mario Overworld Theme Chiptune Synthesizer
    startMusic() {
        if (this.isMusicPlaying) return;
        this.resume();
        this.isMusicPlaying = true;

        // Note frequencies (Hz)
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77;
        const G3 = 196.00, A3 = 220.00, B3 = 246.94;
        const R = 0; // Rest

        const tempo = 130;
        const sixteenth = 60 / tempo / 4;

        const theme = [
            // Intro
            { f: E5, d: 1 }, { f: E5, d: 1 }, { f: R, d: 1 }, { f: E5, d: 1 },
            { f: R, d: 1 }, { f: C5, d: 1 }, { f: E5, d: 2 },
            { f: G5, d: 2 }, { f: R, d: 2 }, { f: G4, d: 2 }, { f: R, d: 2 },

            // Main riff
            { f: C5, d: 2 }, { f: R, d: 1 }, { f: G4, d: 2 }, { f: R, d: 1 }, { f: E4, d: 2 },
            { f: R, d: 1 }, { f: A4, d: 2 }, { f: B4, d: 2 }, { f: 466.16, d: 1 }, { f: A4, d: 2 },
            { f: G4, d: 1.5 }, { f: E5, d: 1.5 }, { f: G5, d: 1.5 }, { f: A5, d: 2 },
            { f: F5, d: 1 }, { f: G5, d: 1 }, { f: R, d: 1 }, { f: E5, d: 2 },
            { f: C5, d: 1 }, { f: D5, d: 1 }, { f: B4, d: 2 }, { f: R, d: 2 },

            // Repeat main riff
            { f: C5, d: 2 }, { f: R, d: 1 }, { f: G4, d: 2 }, { f: R, d: 1 }, { f: E4, d: 2 },
            { f: R, d: 1 }, { f: A4, d: 2 }, { f: B4, d: 2 }, { f: 466.16, d: 1 }, { f: A4, d: 2 },
            { f: G4, d: 1.5 }, { f: E5, d: 1.5 }, { f: G5, d: 1.5 }, { f: A5, d: 2 },
            { f: F5, d: 1 }, { f: G5, d: 1 }, { f: R, d: 1 }, { f: E5, d: 2 },
            { f: C5, d: 1 }, { f: D5, d: 1 }, { f: B4, d: 2 }, { f: R, d: 2 }
        ];

        let playStep = () => {
            if (!this.isMusicPlaying) return;
            const now = this.ctx.currentTime;
            let scheduleTime = now + 0.05;

            theme.forEach(item => {
                const dur = item.d * sixteenth;
                if (item.f > 0 && !this.isMuted) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(item.f, scheduleTime);

                    gain.gain.setValueAtTime(0.18, scheduleTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, scheduleTime + dur * 0.88);

                    osc.connect(gain);
                    gain.connect(this.musicGain);

                    osc.start(scheduleTime);
                    osc.stop(scheduleTime + dur * 0.9);
                }
                scheduleTime += dur;
            });

            const totalDuration = theme.reduce((sum, item) => sum + item.d * sixteenth, 0);
            this.musicTimer = setTimeout(() => {
                playStep();
            }, totalDuration * 1000);
        };

        playStep();
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

window.sounds = new SoundEngine();

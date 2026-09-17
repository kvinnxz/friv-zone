/**
 * TETRIS NEON ARCADE - MOTOR DE AUDIO WEB SYNTH
 * Efectos sonoros chiptune retro y melodía clásica de Tetris sintetizada
 */
class TetrisAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.soundEnabled = true;
    this.musicEnabled = false; // Desactivada por defecto hasta interacción

    // Temporizador de música
    this.musicTimeout = null;
    this.currentNoteIndex = 0;
    this.isPlayingMusic = false;

    // Notas de Korobeiniki (Tema legendario de Tetris)
    // [frecuencia en Hz, duración en segundos]
    this.melody = [
      [659.25, 0.4], [493.88, 0.2], [523.25, 0.2], [587.33, 0.4], [523.25, 0.2], [493.88, 0.2],
      [440.00, 0.4], [440.00, 0.2], [523.25, 0.2], [659.25, 0.4], [587.33, 0.2], [523.25, 0.2],
      [493.88, 0.6], [523.25, 0.2], [587.33, 0.4], [659.25, 0.4],
      [523.25, 0.4], [440.00, 0.4], [440.00, 0.6], [0, 0.2],
      
      [587.33, 0.4], [698.46, 0.2], [880.00, 0.4], [783.99, 0.2], [698.46, 0.2],
      [659.25, 0.6], [523.25, 0.2], [659.25, 0.4], [587.33, 0.2], [523.25, 0.2],
      [493.88, 0.4], [493.88, 0.2], [523.25, 0.2], [587.33, 0.4], [659.25, 0.4],
      [523.25, 0.4], [440.00, 0.4], [440.00, 0.6], [0, 0.2]
    ];
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio no soportado:', e);
    }
  }

  toggleSound() {
    this.init();
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleMusic() {
    this.init();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  startMusic() {
    if (!this.musicEnabled || this.isPlayingMusic) return;
    this.init();
    this.isPlayingMusic = true;
    this.currentNoteIndex = 0;
    this.playNextMusicNote();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  playNextMusicNote() {
    if (!this.isPlayingMusic || !this.ctx || !this.musicEnabled) return;

    const [freq, duration] = this.melody[this.currentNoteIndex];
    if (freq > 0) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.85);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + duration);
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;
    this.musicTimeout = setTimeout(() => {
      this.playNextMusicNote();
    }, duration * 900); // tempo dinámico ligeramente staccato
  }

  // --- EFECTOS DE SONIDO (SFX) ---

  playMove() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  playRotate() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {}
  }

  playHardDrop() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playHold() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playLineClear(lines = 1) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = lines === 4 
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // Fanfarria TETRIS C5 E5 G5 C6 E6
        : [440, 554.37, 659.25, 880];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = lines === 4 ? 'sawtooth' : 'triangle';
        const start = now + (idx * 0.06);
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(lines === 4 ? 0.18 : 0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const st = now + (i * 0.08);
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.16, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.19);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.stopMusic();
      const now = this.ctx.currentTime;
      const notes = [440, 415.3, 392, 349.2, 311.1, 261.6];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const st = now + (i * 0.12);
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.26);
      });
    } catch (e) {}
  }
}

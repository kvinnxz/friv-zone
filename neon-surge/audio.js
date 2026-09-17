/**
 * NEON SURGE - Web Audio API Sound Synthesizer & Procedural Music Engine
 * Zero external audio dependencies - 100% procedurally synthesized in real-time.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.musicPlaying = false;
    this.tempo = 124; // BPM
    this.nextNoteTime = 0;
    this.currentStep = 0;
    this.timerID = null;
    this.timeScale = 1.0;

    // Bassline notes in Hz (Synthwave progression in D minor: D, F, C, Bb)
    this.bassNotes = [
      73.42, 73.42, 146.83, 73.42,  // D2, D2, D3, D2
      87.31, 87.31, 174.61, 87.31,  // F2, F2, F3, F2
      65.41, 65.41, 130.81, 65.41,  // C2, C2, C3, C2
      58.27, 58.27, 116.54, 58.27   // Bb1, Bb1, Bb2, Bb1
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.masterGain.context.currentTime);
    this.musicGain.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  toggleMute() {
    if (!this.masterGain) return false;
    this.isMuted = !this.isMuted;
    const target = this.isMuted ? 0 : 0.7;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    return this.isMuted;
  }

  /* --- SOUND EFFECTS --- */

  playShoot(pitchMod = 1) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const baseFreq = (880 + Math.random() * 80) * pitchMod * (this.timeScale < 1 ? 0.6 : 1);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12 * (1 / this.timeScale));

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 * (1 / this.timeScale));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13 * (1 / this.timeScale));
    } catch (_) {}
  }

  playTriShoot() {
    this.playShoot(1.2);
    setTimeout(() => this.playShoot(1.4), 25);
  }

  playLaserBeam() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (_) {}
  }

  playExplosion(intensity = 1) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = (0.35 + intensity * 0.2) * (this.timeScale < 1 ? 1.8 : 1);
      
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 * intensity, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 * Math.min(intensity, 2), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140 * intensity, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + duration * 0.8);
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + duration * 0.8);
    } catch (_) {}
  }

  playEmp() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.8);

      filter.type = 'bandpass';
      filter.Q.value = 5;
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.82);
    } catch (_) {}
  }

  playChronoStart() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }

  playChronoEnd() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (_) {}
  }

  playPowerup() {
    if (this.isMuted || !this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
      });
    } catch (_) {}
  }

  playCombo(level = 1) {
    if (this.isMuted || !this.ctx) return;
    try {
      const baseFreq = 523.25 * Math.min(2.5, 1 + level * 0.15);
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch (_) {}
  }

  playHit() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (_) {}
  }

  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    try {
      const chords = [220, 207.65, 196, 174.61];
      chords.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.22;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.42);
      });
    } catch (_) {}
  }

  /* --- DYNAMIC SYNTHWAVE MUSIC --- */

  startMusic() {
    this.ensureContext();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = 0;
    this.scheduleMusic();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  scheduleMusic() {
    if (!this.musicPlaying || !this.ctx) return;

    const secondsPerBeat = 60.0 / (this.tempo * (this.timeScale < 1 ? 0.65 : 1.0));
    const stepDuration = secondsPerBeat / 4;

    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playMusicStep(this.nextNoteTime, this.currentStep);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }

    this.timerID = setTimeout(() => this.scheduleMusic(), 50);
  }

  playMusicStep(time, step) {
    if (this.isMuted) return;

    // 1. Driving Synth Bassline on 16th notes
    const noteFreq = this.bassNotes[step];
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq * (this.timeScale < 1 ? 0.75 : 1), time);

    filter.type = 'lowpass';
    filter.Q.value = 4;
    const filterEnv = step % 4 === 0 ? 1200 : 650;
    filter.frequency.setValueAtTime(filterEnv, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.12);

    const stepVol = step % 4 === 0 ? 0.22 : 0.14;
    gain.gain.setValueAtTime(stepVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);

    // 2. Electronic Kick Drum
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.frequency.setValueAtTime(160, time);
      kickOsc.frequency.exponentialRampToValueAtTime(35, time + 0.1);

      kickGain.gain.setValueAtTime(0.3, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);

      kickOsc.start(time);
      kickOsc.stop(time + 0.13);
    }

    // 3. Crisp Hi-Hat
    if (step % 2 === 1) {
      const hatOsc = this.ctx.createOscillator();
      const hatFilter = this.ctx.createBiquadFilter();
      const hatGain = this.ctx.createGain();

      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(9000, time);

      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7000, time);

      hatGain.gain.setValueAtTime(0.04, time);
      hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      hatOsc.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);

      hatOsc.start(time);
      hatOsc.stop(time + 0.05);
    }
  }
}

window.soundEngine = new SoundEngine();

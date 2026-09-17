// Audio Engine for Silksong Web using Web Audio API
class SilksongAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.bgmActive = false;
    this.bgmInterval = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startAtmosphericBGM();
  }

  toggleMute() {
    if (!this.ctx) this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- Sound Effects ---

  // Needle slash whoosh
  playSlash(type = 'normal') {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    // Noise buffer for blade wind
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3;
    const startFreq = type === 'pogo' ? 3200 : (type === 'up' ? 2400 : 1800);
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === 'pogo' ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Pogo bounce metallic clank
  playPogoClank() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1480, t);
    osc1.frequency.exponentialRampToValueAtTime(740, t + 0.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2220, t);
    osc2.frequency.exponentialRampToValueAtTime(1100, t + 0.2);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // Hornet jump / wall jump
  playJump() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Fast dash with air rustle
  playDash() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Hit flesh/enemy
  playEnemyHit() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Hornet takes damage
  playPlayerHurt() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.25);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Gain silk thread from striking enemies
  playSilkCollect() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Silk Bind Heal (Curación de seda con estallido místico)
  playSilkHeal() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0, t + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.04 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + 0.7);
    });
  }

  // Needle Harpoon Throw & Retract
  playHarpoon() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Sacred Bell Gong (Resonating Bell)
  playBellStrike() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const harmonics = [
      { f: 220, g: 0.7, decay: 2.2 },
      { f: 444, g: 0.5, decay: 1.8 },
      { f: 672, g: 0.4, decay: 1.4 },
      { f: 1120, g: 0.25, decay: 0.9 },
      { f: 1780, g: 0.15, decay: 0.5 }
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.f, t);

      gain.gain.setValueAtTime(h.g, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + h.decay);
    });
  }

  // Boss Roar / Shockwave Slam
  playBossSlam() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.55);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Resting at Bench
  playBenchRest() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);

      gain.gain.setValueAtTime(0.2, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.1);
      osc.stop(t + 1.2);
    });
  }

  // --- Atmospheric Ambient BGM Loop (Pharloom Cello & Bell Drone) ---
  startAtmosphericBGM() {
    if (this.bgmActive) return;
    this.bgmActive = true;

    const chords = [
      [110.00, 164.81, 196.00], // A minor base (A2, E3, G3)
      [98.00, 146.83, 185.00],  // G base
      [87.31, 130.81, 174.61],  // F maj base
      [82.41, 123.47, 164.81]   // E min base
    ];

    let chordIdx = 0;

    const playChordCycle = () => {
      if (!this.ctx || this.isMuted || !this.bgmActive) return;
      const t = this.ctx.currentTime;
      const currentNotes = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      currentNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.09 : 0.06, t + 2.5);
        gain.gain.linearRampToValueAtTime(0.001, t + 6.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 7.0);
      });

      // Random gentle bell chime in background
      if (Math.random() > 0.35) {
        setTimeout(() => {
          if (!this.ctx || this.isMuted) return;
          const bt = this.ctx.currentTime;
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          const bellPitches = [880, 987.77, 1174.66, 1318.51, 1760];
          const bellPitch = bellPitches[Math.floor(Math.random() * bellPitches.length)];
          bOsc.type = 'sine';
          bOsc.frequency.setValueAtTime(bellPitch, bt);

          bGain.gain.setValueAtTime(0.04, bt);
          bGain.gain.exponentialRampToValueAtTime(0.0001, bt + 3.0);

          bOsc.connect(bGain);
          bGain.connect(this.bgmGain);
          bOsc.start(bt);
          bOsc.stop(bt + 3.0);
        }, 1500 + Math.random() * 2500);
      }
    };

    playChordCycle();
    this.bgmInterval = setInterval(playChordCycle, 6200);
  }
}

window.soundEngine = new SilksongAudio();

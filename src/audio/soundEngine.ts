/**
 * Procedural Web Audio Sound Engine for Kolej Blanice Dormitory Horror.
 * Zero external audio files — 100% synthesized procedural sound effects and ambience.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private heartbeatTimer: number | null = null;

  constructor() {
    // Initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbience();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Starts ambient dormitory hum: fluorescent 50Hz electrical hum + distant wind
   */
  private startAmbience() {
    if (!this.ctx || !this.masterGain) return;

    // 50Hz European mains fluorescent hum
    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.humOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain);
    this.humOsc.start();
  }

  /**
   * Plays a footstep on dorm linoleum (creak + soft heel strike)
   */
  public playFootstep(isSprinting: boolean = false) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const pitch = 70 + Math.random() * 25 + (isSprinting ? 20 : 0);
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const vol = isSprinting ? 0.35 : 0.18;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // Subtle shoe scuff / floor friction noise
    this.playNoiseBurst(0.06, 0.05, 1200);
  }

  /**
   * Plays flashlight toggle switch click
   */
  public playFlashlightClick(isOn: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOn ? 1800 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(isOn ? 2400 : 800, now + 0.03);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Electrical flickering light crackle
   */
  public playLightFlicker() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.playNoiseBurst(0.12, 0.15, 2800);
    if (this.humGain && this.ctx) {
      this.humGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.humGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.2);
    }
  }

  /**
   * Keys rattling - The signature omen of the Night Examiner (Noční Vrátná)
   */
  public playKeyRattle(proximity: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const freqs = [3200, 4100, 5300, 6800, 8200];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const delay = i * 0.04 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      osc.frequency.setValueAtTime(f, now + delay);

      const vol = (0.08 + Math.random() * 0.1) * proximity;
      gain.gain.setValueAtTime(vol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    }
  }

  /**
   * Heavy footsteps of the Examiner
   */
  public playExaminerThud(volume: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Retro elevator chime (Czech dorm elevator)
   */
  public playElevatorChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5 note
    osc.frequency.setValueAtTime(523.25, now + 0.25); // C5 note

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  /**
   * Creaking door opening / closing
   */
  public playDoorCreak() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.15);
    osc.frequency.linearRampToValueAtTime(290, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Automatic glass sliding entrance door
   */
  public playGlassDoorOpen() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(0.4, 0.15, 1400);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  /**
   * Mechanical elevator ride sound with motor hum and cable clanking
   */
  public playElevatorRide() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy clunk
    const clunk = this.ctx.createOscillator();
    const clunkGain = this.ctx.createGain();
    clunk.type = 'triangle';
    clunk.frequency.setValueAtTime(65, now);
    clunk.frequency.exponentialRampToValueAtTime(25, now + 0.3);
    clunkGain.gain.setValueAtTime(0.35, now);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    clunk.connect(clunkGain);
    clunkGain.connect(this.masterGain);
    clunk.start(now);
    clunk.stop(now + 0.36);

    // Motor hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(55, now + 0.1);
    hum.frequency.linearRampToValueAtTime(80, now + 0.8);
    hum.frequency.linearRampToValueAtTime(55, now + 1.8);
    humGain.gain.setValueAtTime(0.12, now + 0.1);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);

    hum.connect(filter);
    filter.connect(humGain);
    humGain.connect(this.masterGain);
    hum.start(now + 0.1);
    hum.stop(now + 2.1);

    // Arrival chime
    setTimeout(() => {
      this.playElevatorChime();
    }, 1800);
  }

  /**
   * Text typewriter / dialogue blip
   */
  public playDialogueBlip() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 + Math.random() * 80, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Radio static burst for classmate walkie-talkie transmission
   */
  public playRadioStatic() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    this.playNoiseBurst(0.25, 0.2, 3500);

    // Two-tone walkie-talkie roger chirp
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'sine';
    chirp.frequency.setValueAtTime(1400, now + 0.05);
    chirp.frequency.setValueAtTime(1800, now + 0.12);

    chirpGain.gain.setValueAtTime(0.15, now + 0.05);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    chirp.connect(chirpGain);
    chirpGain.connect(this.masterGain);

    chirp.start(now + 0.05);
    chirp.stop(now + 0.25);
  }

  /**
   * Item pickup sound (chime)
   */
  public playPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.26);
    });
  }

  /**
   * Heartbeat pulse, tempo driven by player sanity / dread
   */
  public updateHeartbeat(sanity: number, isNearEntity: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    if (sanity > 65 && !isNearEntity) {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      return;
    }

    // Interval between beats: 800ms when low sanity down to 380ms in extreme terror
    const intervalMs = isNearEntity ? 400 : Math.max(380, 400 + (sanity * 6));

    if (!this.heartbeatTimer) {
      this.heartbeatTimer = window.setInterval(() => {
        this.playHeartbeatThud();
      }, intervalMs);
    }
  }

  private playHeartbeatThud() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Double thump (lub-dub)
    [0, 0.12].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now + offset);
      osc.frequency.exponentialRampToValueAtTime(32, now + offset + 0.1);

      gain.gain.setValueAtTime(0.35, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  /**
   * Generator for filtered noise bursts (scuffs, flickers, radio static)
   */
  private playNoiseBurst(duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
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
    filter.frequency.setValueAtTime(cutoff, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  public dispose() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();

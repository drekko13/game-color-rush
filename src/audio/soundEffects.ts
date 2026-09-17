/**
 * ColorRush Procedural Web Audio Sound Engine
 * Zero-dependency, 100% reliable synthesized SFX
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  // Helper to create master gain node
  private createGain(ctx: AudioContext, peak: number = 0.3): GainNode {
    const gain = ctx.createGain();
    gain.gain.value = this.isMuted ? 0 : peak * this.masterVolume;
    gain.connect(ctx.destination);
    return gain;
  }

  // 1. Crisp Card Deal / Draw Flick
  public playCardDraw() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = this.createGain(ctx, 0.25);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  // 2. Tactile Card Play Slap
  public playCardPlay() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Body punch
    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, 0.4);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);

    // Friction click
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.createGain(ctx, 0.2);
    noise.connect(noiseGain);
    noise.start(ctx.currentTime);
  }

  // 3. BURST +2 (Two rapid whoosh-slap sequences)
  public playBurst2() {
    if (this.isMuted) return;
    const playWhooshSlap = (delay: number) => {
      setTimeout(() => {
        const ctx = this.initCtx();
        if (!ctx) return;

        // Whoosh
        const osc = ctx.createOscillator();
        const gain = this.createGain(ctx, 0.35);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);

        // Slap impact
        setTimeout(() => this.playCardPlay(), 80);
      }, delay);
    };

    playWhooshSlap(0);
    playWhooshSlap(180);
  }

  // 4. INFERNO +4 (Deep bass shockwave, crackling heat flare, 4 projectile impacts)
  public playInferno4() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Sub rumble
    const subOsc = ctx.createOscillator();
    const subGain = this.createGain(ctx, 0.6);
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(110, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.6);

    subGain.gain.setValueAtTime(0.6 * this.masterVolume, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    subOsc.connect(subGain);
    subOsc.start(ctx.currentTime);
    subOsc.stop(ctx.currentTime + 0.65);

    // Crackle sweep
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playCardDraw();
        const impactCtx = this.initCtx();
        if (!impactCtx) return;
        const osc = impactCtx.createOscillator();
        const g = this.createGain(impactCtx, 0.3);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300 + i * 80, impactCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, impactCtx.currentTime + 0.15);
        g.gain.setValueAtTime(0.3 * this.masterVolume, impactCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, impactCtx.currentTime + 0.15);
        osc.connect(g);
        osc.start(impactCtx.currentTime);
        osc.stop(impactCtx.currentTime + 0.16);
      }, 100 + i * 110);
    }
  }

  // 5. HALT (Stun / Laser Freeze)
  public playHalt() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, 0.35);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  // 6. REWIND (Directional time warp whoosh)
  public playRewind() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, 0.3);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.33);
  }

  // 7. Party Drink Penalty (Glug-glug-splash liquid pour)
  public playDrinkPenalty() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Glug 1, Glug 2, Glug 3, then Splash!
    const glugTimes = [0, 180, 360];
    glugTimes.forEach((delay, idx) => {
      setTimeout(() => {
        const glugCtx = this.initCtx();
        if (!glugCtx) return;
        const osc = glugCtx.createOscillator();
        const gain = this.createGain(glugCtx, 0.4);
        osc.type = 'sine';
        const startFreq = 280 + idx * 60;
        osc.frequency.setValueAtTime(startFreq, glugCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, glugCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4 * this.masterVolume, glugCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, glugCtx.currentTime + 0.14);
        osc.connect(gain);
        osc.start(glugCtx.currentTime);
        osc.stop(glugCtx.currentTime + 0.15);
      }, delay);
    });

    // Splash noise burst
    setTimeout(() => {
      const splashCtx = this.initCtx();
      if (!splashCtx) return;
      const bufferSize = splashCtx.sampleRate * 0.45;
      const buffer = splashCtx.createBuffer(1, bufferSize, splashCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = splashCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = splashCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, splashCtx.currentTime);
      filter.Q.value = 1.2;

      const gain = this.createGain(splashCtx, 0.45);
      noise.connect(filter);
      filter.connect(gain);
      noise.start(splashCtx.currentTime);
    }, 450);
  }

  // 8. RUSH! Shout / Siren Pulse
  public playRushCall() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const chords = [587.33, 739.99, 880]; // D5, F#5, A5
    chords.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = this.createGain(ctx, 0.15);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.08, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.42);
    });
  }

  // 9. Color Picker Selection
  public playColorSelect() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = this.createGain(ctx, 0.3);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.14); // C6

    gain.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  }

  // 10. Victory Fanfare
  public playVictory() {
    if (this.isMuted) return;
    const notes = [
      { f: 523.25, d: 0.15, pause: 0 },
      { f: 659.25, d: 0.15, pause: 140 },
      { f: 783.99, d: 0.15, pause: 280 },
      { f: 1046.5, d: 0.45, pause: 420 },
    ];

    notes.forEach((n) => {
      setTimeout(() => {
        const ctx = this.initCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = this.createGain(ctx, 0.28);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime);
        gain.gain.setValueAtTime(0.28 * this.masterVolume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.d);
        osc.connect(gain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + n.d + 0.05);
      }, n.pause);
    });
  }
}

export const soundFx = new SoundEngine();

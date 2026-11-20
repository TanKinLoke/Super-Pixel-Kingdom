import { WorldTheme } from './types';

type MusicMode = 'none' | 'overworld' | 'cavern' | 'sky' | 'haunted' | 'castle' | 'star' | 'bonus';

interface NoteStep {
  freq: number;
  bass: number;
  len: number;
}

const OVERWORLD_MELODY: NoteStep[] = [
  { freq: 659.25, bass: 164.81, len: 1 },
  { freq: 659.25, bass: 164.81, len: 1 },
  { freq: 0, bass: 0, len: 1 },
  { freq: 659.25, bass: 164.81, len: 1 },
  { freq: 0, bass: 0, len: 1 },
  { freq: 523.25, bass: 130.81, len: 1 },
  { freq: 659.25, bass: 164.81, len: 2 },
  { freq: 783.99, bass: 196.0, len: 2 },
  { freq: 0, bass: 0, len: 2 },
  { freq: 392.0, bass: 98.0, len: 2 },
  { freq: 0, bass: 0, len: 2 },
  { freq: 523.25, bass: 130.81, len: 2 },
  { freq: 0, bass: 0, len: 1 },
  { freq: 392.0, bass: 98.0, len: 2 },
  { freq: 0, bass: 0, len: 1 },
  { freq: 329.63, bass: 82.41, len: 2 },
  { freq: 440.0, bass: 110.0, len: 1 },
  { freq: 493.88, bass: 123.47, len: 1 },
  { freq: 466.16, bass: 116.54, len: 1 },
  { freq: 440.0, bass: 110.0, len: 1 },
  { freq: 392.0, bass: 98.0, len: 1.5 },
  { freq: 659.25, bass: 164.81, len: 1.5 },
  { freq: 783.99, bass: 196.0, len: 1.5 },
  { freq: 880.0, bass: 220.0, len: 1.5 },
  { freq: 698.46, bass: 174.61, len: 1 },
  { freq: 783.99, bass: 196.0, len: 1 },
  { freq: 0, bass: 0, len: 1 },
  { freq: 659.25, bass: 164.81, len: 1 },
  { freq: 523.25, bass: 130.81, len: 1 },
  { freq: 587.33, bass: 146.83, len: 1 },
  { freq: 493.88, bass: 123.47, len: 2 },
];

const CAVERN_MELODY: NoteStep[] = [
  { freq: 261.63, bass: 130.81, len: 1 },
  { freq: 523.25, bass: 130.81, len: 1 },
  { freq: 220.0, bass: 110.0, len: 1 },
  { freq: 440.0, bass: 110.0, len: 1 },
  { freq: 233.08, bass: 116.54, len: 1 },
  { freq: 466.16, bass: 116.54, len: 1 },
  { freq: 0, bass: 0, len: 2 },
  { freq: 261.63, bass: 130.81, len: 1 },
  { freq: 523.25, bass: 130.81, len: 1 },
  { freq: 220.0, bass: 110.0, len: 1 },
  { freq: 440.0, bass: 110.0, len: 1 },
  { freq: 233.08, bass: 116.54, len: 1 },
  { freq: 466.16, bass: 116.54, len: 1 },
  { freq: 0, bass: 0, len: 2 },
  { freq: 174.61, bass: 87.31, len: 1 },
  { freq: 349.23, bass: 87.31, len: 1 },
  { freq: 146.83, bass: 73.42, len: 1 },
  { freq: 293.66, bass: 73.42, len: 1 },
  { freq: 155.56, bass: 77.78, len: 1 },
  { freq: 311.13, bass: 77.78, len: 1 },
  { freq: 0, bass: 0, len: 2 },
];

const SKY_MELODY: NoteStep[] = [
  { freq: 587.33, bass: 146.83, len: 1.5 },
  { freq: 739.99, bass: 146.83, len: 1.5 },
  { freq: 880.0, bass: 146.83, len: 2 },
  { freq: 783.99, bass: 196.0, len: 1 },
  { freq: 739.99, bass: 146.83, len: 1 },
  { freq: 659.25, bass: 164.81, len: 2 },
  { freq: 587.33, bass: 146.83, len: 1 },
  { freq: 659.25, bass: 164.81, len: 1 },
  { freq: 739.99, bass: 146.83, len: 2 },
  { freq: 493.88, bass: 123.47, len: 2 },
  { freq: 440.0, bass: 110.0, len: 2 },
];

const HAUNTED_MELODY: NoteStep[] = [
  { freq: 329.63, bass: 82.41, len: 2 },
  { freq: 311.13, bass: 82.41, len: 2 },
  { freq: 293.66, bass: 73.42, len: 2 },
  { freq: 277.18, bass: 73.42, len: 2 },
  { freq: 261.63, bass: 65.41, len: 2 },
  { freq: 329.63, bass: 82.41, len: 1 },
  { freq: 392.0, bass: 98.0, len: 1 },
  { freq: 466.16, bass: 116.54, len: 2 },
  { freq: 440.0, bass: 110.0, len: 2 },
];

const CASTLE_MELODY: NoteStep[] = [
  { freq: 392.0, bass: 98.0, len: 0.75 },
  { freq: 415.3, bass: 98.0, len: 0.75 },
  { freq: 392.0, bass: 98.0, len: 0.75 },
  { freq: 440.0, bass: 98.0, len: 0.75 },
  { freq: 392.0, bass: 98.0, len: 0.75 },
  { freq: 466.16, bass: 98.0, len: 0.75 },
  { freq: 440.0, bass: 110.0, len: 0.75 },
  { freq: 392.0, bass: 98.0, len: 0.75 },
  { freq: 349.23, bass: 87.31, len: 0.75 },
  { freq: 369.99, bass: 87.31, len: 0.75 },
  { freq: 349.23, bass: 87.31, len: 0.75 },
  { freq: 392.0, bass: 87.31, len: 0.75 },
  { freq: 329.63, bass: 82.41, len: 1.5 },
  { freq: 293.66, bass: 73.42, len: 1.5 },
];

const STAR_MELODY: NoteStep[] = [
  { freq: 698.46, bass: 174.61, len: 0.5 },
  { freq: 880.0, bass: 174.61, len: 0.5 },
  { freq: 1046.5, bass: 174.61, len: 0.5 },
  { freq: 880.0, bass: 174.61, len: 0.5 },
  { freq: 659.25, bass: 164.81, len: 0.5 },
  { freq: 783.99, bass: 164.81, len: 0.5 },
  { freq: 987.77, bass: 164.81, len: 0.5 },
  { freq: 783.99, bass: 164.81, len: 0.5 },
];

export class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private paused = false;
  private musicMode: MusicMode = 'none';
  private stepIdx = 0;
  private nextStepTime = 0;
  private schedulerTimer: number | null = null;

  constructor() {
    // Context created lazily on first interaction
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.38;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.02);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(paused ? 0 : 0.16, this.ctx.currentTime, 0.03);
    }
  }

  public startThemeMusic(theme: WorldTheme, isBonus = false, isStar = false): void {
    let mode: MusicMode = 'overworld';
    if (isStar) {
      mode = 'star';
    } else if (isBonus) {
      mode = 'bonus';
    } else if (theme === 'cavern') {
      mode = 'cavern';
    } else if (theme === 'treetops' || theme === 'canyon' || theme === 'airship') {
      mode = 'sky';
    } else if (theme === 'haunted' || theme === 'glacier') {
      mode = 'haunted';
    } else if (theme === 'magma' || theme === 'castle') {
      mode = 'castle';
    }

    if (this.musicMode === mode && this.schedulerTimer !== null) return;
    this.musicMode = mode;
    this.stepIdx = 0;
    if (this.ctx) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
    if (this.schedulerTimer === null && typeof window !== 'undefined') {
      this.schedulerTimer = window.setInterval(() => this.tickMusic(), 60);
    }
  }

  public stopMusic(): void {
    this.musicMode = 'none';
    if (this.schedulerTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private getMelody(): { notes: NoteStep[]; stepDuration: number; wave: OscillatorType } {
    switch (this.musicMode) {
      case 'star':
        return { notes: STAR_MELODY, stepDuration: 0.16, wave: 'square' };
      case 'cavern':
        return { notes: CAVERN_MELODY, stepDuration: 0.15, wave: 'triangle' };
      case 'bonus':
        return { notes: OVERWORLD_MELODY, stepDuration: 0.115, wave: 'triangle' };
      case 'sky':
        return { notes: SKY_MELODY, stepDuration: 0.145, wave: 'square' };
      case 'haunted':
        return { notes: HAUNTED_MELODY, stepDuration: 0.19, wave: 'triangle' };
      case 'castle':
        return { notes: CASTLE_MELODY, stepDuration: 0.14, wave: 'sawtooth' };
      case 'overworld':
      default:
        return { notes: OVERWORLD_MELODY, stepDuration: 0.135, wave: 'square' };
    }
  }

  private tickMusic(): void {
    if (!this.ctx || !this.musicGain || this.muted || this.paused || this.musicMode === 'none') return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    if (this.nextStepTime < now) {
      this.nextStepTime = now + 0.02;
    }

    const { notes, stepDuration, wave } = this.getMelody();
    while (this.nextStepTime < now + 0.18) {
      const step = notes[this.stepIdx % notes.length];
      const dur = step.len * stepDuration;
      if (step.freq > 0) {
        this.scheduleMusicNote(step.freq, this.nextStepTime, dur * 0.85, wave, 0.35);
      }
      if (step.bass > 0) {
        this.scheduleMusicNote(step.bass, this.nextStepTime, dur * 0.9, 'triangle', 0.45);
      }
      this.nextStepTime += dur;
      this.stepIdx = (this.stepIdx + 1) % notes.length;
    }
  }

  private scheduleMusicNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    vol: number
  ): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(0.001, startTime);
    g.gain.exponentialRampToValueAtTime(vol, startTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(0.03, duration));
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    vol = 0.4,
    delay = 0
  ): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + duration);
    }
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  public playJump(isSuper: boolean): void {
    this.unlock();
    const pitch = isSuper ? 180 : 250;
    const end = isSuper ? 480 : 640;
    this.tone(pitch, end, 0.14, 'square', 0.3);
  }

  public playCoin(): void {
    this.unlock();
    this.tone(987.77, 987.77, 0.07, 'square', 0.35, 0);
    this.tone(1318.51, 1318.51, 0.22, 'square', 0.35, 0.065);
  }

  public playStarCoin(): void {
    this.unlock();
    this.tone(587.33, 587.33, 0.08, 'square', 0.35, 0);
    this.tone(783.99, 783.99, 0.08, 'square', 0.35, 0.07);
    this.tone(1174.66, 1174.66, 0.26, 'triangle', 0.45, 0.14);
  }

  public playPowerUpSpawn(): void {
    this.unlock();
    const notes = [330, 392, 494, 587, 659];
    notes.forEach((n, i) => this.tone(n, n, 0.07, 'triangle', 0.35, i * 0.05));
  }

  public playPowerUpCollect(): void {
    this.unlock();
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, n, 0.09, 'square', 0.32, i * 0.055));
  }

  public playOneUp(): void {
    this.unlock();
    const notes = [329.6, 392.0, 659.3, 523.3, 587.3, 784.0];
    notes.forEach((n, i) => this.tone(n, n, 0.09, 'square', 0.34, i * 0.065));
  }

  public playStomp(comboIndex = 0): void {
    this.unlock();
    const mult = Math.pow(1.12, Math.min(comboIndex, 6));
    this.tone(360 * mult, 110 * mult, 0.1, 'triangle', 0.45, 0);
    if (comboIndex > 0) {
      this.tone(520 * mult, 680 * mult, 0.09, 'square', 0.25, 0.03);
    }
  }

  public playKickShell(): void {
    this.unlock();
    this.tone(240, 560, 0.09, 'square', 0.35);
  }

  public playBump(): void {
    this.unlock();
    this.tone(160, 90, 0.09, 'triangle', 0.4);
  }

  public playBrickBreak(): void {
    this.unlock();
    this.tone(220, 70, 0.11, 'sawtooth', 0.35, 0);
    this.tone(170, 55, 0.13, 'square', 0.25, 0.04);
  }

  public playFireball(): void {
    this.unlock();
    this.tone(720, 220, 0.09, 'sawtooth', 0.28);
  }

  public playSpring(): void {
    this.unlock();
    this.tone(200, 880, 0.22, 'triangle', 0.42);
  }

  public playPipeWarp(): void {
    this.unlock();
    for (let i = 0; i < 4; i++) {
      this.tone(420 - i * 50, 180 - i * 25, 0.08, 'sawtooth', 0.3, i * 0.08);
    }
  }

  public playHurt(): void {
    this.unlock();
    this.tone(440, 140, 0.18, 'sawtooth', 0.4, 0);
    this.tone(330, 95, 0.22, 'square', 0.3, 0.08);
  }

  public playDeath(): void {
    this.unlock();
    const notes = [493.88, 698.46, 0, 698.46, 659.25, 587.33, 523.25];
    notes.forEach((n, i) => {
      if (n > 0) this.tone(n, n * 0.96, 0.13, 'square', 0.34, i * 0.11);
    });
  }

  public playFlagpole(): void {
    this.unlock();
    this.tone(784, 340, 0.48, 'triangle', 0.36);
  }

  public playVictoryFanfare(): void {
    this.unlock();
    const notes = [392, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.3, 0.45, 0.56, 0.7];
    notes.forEach((n, i) => {
      this.tone(n, n, i === notes.length - 1 ? 0.55 : 0.11, 'square', 0.35, times[i]);
    });
  }

  public playFirework(): void {
    this.unlock();
    this.tone(900 + Math.random() * 400, 140, 0.16, 'sawtooth', 0.25);
  }

  public playBossRoar(): void {
    this.unlock();
    this.tone(150, 65, 0.35, 'sawtooth', 0.42);
  }

  public playBridgeCollapse(): void {
    this.unlock();
    for (let i = 0; i < 6; i++) {
      this.tone(240 - i * 24, 60, 0.12, 'sawtooth', 0.35, i * 0.07);
    }
  }
}

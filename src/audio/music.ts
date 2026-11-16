import type { Sfx } from './sfx'

/**
 * A small generative score. It follows the game instead of looping a file: the home screen hums,
 * aiming holds its breath, a fall grooves harder as the chain grows, Overdrive opens the filter,
 * a short fall tightens into a pulse, and the Grinder turns minor. Everything is synthesized, so the
 * build stays offline and tiny. Peg bells use C major pentatonic, so every progression here stays in
 * C major or A minor and the effects always sit inside the harmony.
 */
export type Mood = 'off' | 'menu' | 'aim' | 'drop' | 'boss' | 'calm' | 'triumph'

export interface MusicState {
  mood: Mood
  /** 0..1: how hot the fall is (chain, multiplier, speed). */
  intensity: number
  overdrive: boolean
  /** The fall is heading home short of its target. */
  danger: boolean
}

interface Style {
  bpm: number
  /** Chord roots and qualities, one per bar, as MIDI notes. */
  bars: number[][]
  bass: number[]
  drums: boolean
  arp: 'none' | 'slow' | 'fast'
}

const C = 48
const STYLES: Record<Exclude<Mood, 'off'>, Style> = {
  // I – V – vi – IV, voiced softly. The home screen is a music box, not a dance floor.
  menu: { bpm: 84, bars: [[C, C + 4, C + 7, C + 11], [C - 5, C - 1, C + 2, C + 7], [C - 3, C, C + 4, C + 7], [C - 7, C - 3, C, C + 4]], bass: [], drums: false, arp: 'slow' },
  // The same harmony, held: a pulse and a pad while the player chooses a beginning.
  aim: { bpm: 96, bars: [[C - 3, C, C + 4, C + 7], [C - 7, C - 3, C, C + 4], [C, C + 4, C + 7, C + 11], [C - 5, C - 1, C + 2, C + 7]], bass: [0, 8], drums: false, arp: 'none' },
  drop: { bpm: 112, bars: [[C - 3, C, C + 4, C + 7], [C - 7, C - 3, C, C + 4], [C, C + 4, C + 7, C + 11], [C - 5, C - 1, C + 2, C + 7]], bass: [0, 3, 6, 8, 11, 14], drums: true, arp: 'fast' },
  // A minor with a raised seventh: the Grinder is the only room that sounds dangerous.
  boss: { bpm: 124, bars: [[C - 3, C, C + 4, C + 9], [C - 7, C - 3, C, C + 5], [C - 10, C - 7, C - 3, C + 2], [C - 8, C - 4, C - 1, C + 4]], bass: [0, 2, 4, 6, 8, 10, 12, 14], drums: true, arp: 'fast' },
  // Shops, drafts and forks: a warm Fmaj7 – Em7 – Dm7 – G loop.
  calm: { bpm: 88, bars: [[C - 7, C - 3, C, C + 4], [C - 8, C - 5, C - 1, C + 2], [C - 10, C - 7, C - 3, C], [C - 5, C - 1, C + 2, C + 5]], bass: [0, 10], drums: false, arp: 'slow' },
  triumph: { bpm: 100, bars: [[C, C + 4, C + 7, C + 12], [C - 7, C - 3, C, C + 5], [C - 5, C - 1, C + 2, C + 7], [C, C + 4, C + 7, C + 12]], bass: [0, 6, 8], drums: true, arp: 'slow' },
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const PENTA = [0, 2, 4, 7, 9]

export class Music {
  volume = 0.5
  private bus: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private ctxRef: AudioContext | null = null
  private next = 0
  private step = 0
  private bar = 0
  private state: MusicState = { mood: 'off', intensity: 0, overdrive: false, danger: false }
  private heat = 0
  private playing: Mood = 'off'

  constructor(private readonly sfx: Sfx) {}

  /** Called every animation frame. Schedules a little ahead so frame jitter never shows. */
  update(state: MusicState, dt: number): void {
    this.state = state
    this.heat += (state.intensity - this.heat) * (1 - Math.exp(-(state.intensity > this.heat ? 4 : 1.2) * dt))
    const ctx = this.sfx.live()
    if (!ctx || this.volume <= 0.001) {
      if (this.bus && this.ctxRef) this.bus.gain.setTargetAtTime(0, this.ctxRef.currentTime, 0.05)
      this.playing = 'off'
      return
    }
    this.wire(ctx)
    const bus = this.bus!
    const target = state.mood === 'off' ? 0 : this.volume * 0.55
    bus.gain.setTargetAtTime(target, ctx.currentTime, state.mood === 'off' ? 0.25 : 0.6)
    const open = state.overdrive ? 7000 : state.danger ? 700 : 900 + this.heat * 3600
    this.filter!.frequency.setTargetAtTime(open, ctx.currentTime, state.overdrive ? 0.05 : 0.25)
    if (state.mood === 'off') { this.playing = 'off'; return }
    if (this.playing === 'off' || this.next < ctx.currentTime - 0.2) {
      // Start on a downbeat a moment from now rather than catching up on missed time.
      this.next = ctx.currentTime + 0.05
      this.step = 0
      this.bar = 0
    }
    this.playing = state.mood
    const style = STYLES[state.mood]
    while (this.next < ctx.currentTime + 0.14) {
      this.play(ctx, style, this.step, this.next)
      const sixteenth = 60 / style.bpm / 4
      // A light swing on the off sixteenths keeps the groove human.
      this.next += sixteenth * (this.step % 2 === 0 ? 1.06 : 0.94)
      this.step = (this.step + 1) % 16
      if (this.step === 0) this.bar = (this.bar + 1) % 4
    }
  }

  private wire(ctx: AudioContext): void {
    if (this.ctxRef === ctx && this.bus) return
    this.ctxRef = ctx
    const input = this.sfx.musicInput()
    if (!input) return
    this.bus = ctx.createGain()
    this.bus.gain.value = 0
    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 1200
    this.filter.Q.value = 0.7
    this.filter.connect(this.bus)
    this.bus.connect(input)
    const len = Math.floor(ctx.sampleRate * 0.5)
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.noiseBuf.getChannelData(0)
    // Seeded so the hats sound identical every session.
    let s = 1234567
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; data[i] = (s / 0x3fffffff) - 1 }
  }

  private play(ctx: AudioContext, style: Style, step: number, at: number): void {
    const { overdrive, danger, mood } = this.state
    const heat = this.heat
    const chord = style.bars[this.bar]
    const beat = 60 / style.bpm
    if (step === 0) for (const [i, n] of chord.entries()) this.pad(ctx, midi(n + 12), at, beat * 4.1, i === 0 ? 0.03 : 0.022)
    // Bass: syncopated during a fall, a heartbeat while danger rises.
    const bassSteps = danger ? [0, 2, 4, 6, 8, 10, 12, 14] : style.bass
    if (bassSteps.includes(step)) {
      const root = chord[0] - 12
      const n = mood === 'drop' && step === 14 ? root + 7 : root
      this.bass(ctx, midi(n), at, beat * (danger ? 0.4 : 0.7), mood === 'aim' ? 0.06 : 0.085)
    }
    if (style.drums && !danger) {
      const drive = mood === 'boss' ? Math.max(0.55, heat) : heat
      if (step === 0 || step === 8 || (drive > 0.6 && (step === 4 || step === 12)) || (mood === 'boss' && step === 10)) this.kick(ctx, at, 0.14)
      if (drive > 0.4 && (step === 4 || step === 12)) this.snare(ctx, at, 0.045)
      const hat = overdrive || drive > 0.55 ? true : step % 4 === 2
      if (hat && drive > 0.08) this.hat(ctx, at, step % 4 === 2 ? 0.028 : 0.016)
    } else if (danger && step % 4 === 0) {
      this.tick(ctx, at)
    }
    if (style.arp === 'slow' && step % 2 === 0) {
      const tones = [...chord, ...chord.map(n => n + 12)]
      const n = tones[(step / 2 + this.bar) % tones.length] + 24
      this.pluck(ctx, midi(n), at, 0.5, 0.018)
    } else if (style.arp === 'fast' && (heat > 0.3 || overdrive) && !danger) {
      // C pentatonic, like the peg bells, so the arpeggio never argues with a hit.
      const idx = [0, 2, 1, 3, 2, 4, 3, 1][step % 8] + (step >= 8 ? 1 : 0) + this.bar
      const n = (overdrive ? 84 : 72) + PENTA[idx % 5] + 12 * Math.floor(idx / 5)
      this.pluck(ctx, midi(n), at, 0.18, overdrive ? 0.022 : 0.012 + heat * 0.01)
    }
  }

  private voice(ctx: AudioContext, type: OscillatorType, f: number, at: number, dur: number, gain: number, attack: number, dest: AudioNode): OscillatorNode {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(f, at)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gain, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(g)
    g.connect(dest)
    osc.start(at)
    osc.stop(at + dur + 0.05)
    return osc
  }

  private pad(ctx: AudioContext, f: number, at: number, dur: number, gain: number): void {
    this.voice(ctx, 'triangle', f, at, dur, gain, 0.35, this.filter!)
    const det = this.voice(ctx, 'sine', f * 1.004, at, dur, gain * 0.7, 0.5, this.filter!)
    det.detune.value = 6
  }

  private bass(ctx: AudioContext, f: number, at: number, dur: number, gain: number): void {
    this.voice(ctx, 'triangle', f, at, dur, gain, 0.01, this.bus!)
    this.voice(ctx, 'sine', f / 2, at, dur * 0.8, gain * 0.6, 0.01, this.bus!)
  }

  private pluck(ctx: AudioContext, f: number, at: number, dur: number, gain: number): void {
    this.voice(ctx, 'sine', f, at, dur, gain, 0.005, this.filter!)
    this.voice(ctx, 'triangle', f * 2, at, dur * 0.5, gain * 0.25, 0.005, this.filter!)
  }

  private kick(ctx: AudioContext, at: number, gain: number): void {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.setValueAtTime(140, at)
    osc.frequency.exponentialRampToValueAtTime(42, at + 0.14)
    g.gain.setValueAtTime(gain, at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
    osc.connect(g)
    g.connect(this.bus!)
    osc.start(at)
    osc.stop(at + 0.25)
  }

  private noise(ctx: AudioContext, at: number, dur: number, gain: number, type: BiquadFilterType, freq: number): void {
    if (!this.noiseBuf) return
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.bus!)
    src.start(at, Math.random() * 0.3)
    src.stop(at + dur + 0.02)
  }

  private snare(ctx: AudioContext, at: number, gain: number): void {
    this.noise(ctx, at, 0.14, gain, 'bandpass', 1900)
    this.voice(ctx, 'triangle', 190, at, 0.08, gain * 0.8, 0.002, this.bus!)
  }

  private hat(ctx: AudioContext, at: number, gain: number): void {
    this.noise(ctx, at, 0.04, gain, 'highpass', 7500)
  }

  /** Danger: a dry clock tick instead of drums, so the groove falls away and the miss is audible. */
  private tick(ctx: AudioContext, at: number): void {
    this.voice(ctx, 'square', 1760, at, 0.035, 0.012, 0.001, this.bus!)
  }
}

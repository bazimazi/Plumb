/** Major pentatonic steps in semitones, so rising combos always sound like a melody. */
const PENTA = [0, 2, 4, 7, 9]

function penta(step: number): number {
  const octave = Math.floor(step / PENTA.length)
  return PENTA[step % PENTA.length] + octave * 12
}

export class Sfx {
  private ctx: AudioContext | null = null
  private bus: GainNode | null = null
  volume = 0.7
  private muted = false
  private lastPeg = 0

  setMuted(m: boolean): void {
    this.muted = m
    if (this.ctx) this.ctx.suspend().catch(() => undefined)
    if (!m) this.resume()
  }

  toggle(): boolean {
    this.muted = !this.muted
    if (this.muted) this.ctx?.suspend().catch(() => undefined)
    else this.resume()
    return this.muted
  }

  get isMuted(): boolean {
    return this.muted
  }

  resume(): void {
    if (this.muted) return
    const ctx = this.ensure()
    if (ctx.state === 'suspended') void ctx.resume()
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      // Everything goes through one compressor so stacked hits never clip.
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.knee.value = 12
      comp.ratio.value = 4
      comp.attack.value = 0.003
      comp.release.value = 0.12
      this.bus = this.ctx.createGain()
      this.bus.gain.value = 1
      this.bus.connect(comp)
      this.comp = comp
      comp.connect(this.ctx.destination)
    }
    return this.ctx
  }

  private comp: DynamicsCompressorNode | null = null

  /**
   * The running context for the score, or null before the first gesture, while muted, or while
   * the context is suspended. Music never creates the context itself: browsers only allow audio
   * after a user gesture, and every gesture path already calls `resume`.
   */
  live(): AudioContext | null {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return null
    return this.ctx
  }

  /** Music shares the compressor with effects, so a loud hit ducks the score instead of clipping. */
  musicInput(): AudioNode | null {
    this.ensure()
    return this.comp
  }

  private out(): AudioNode {
    this.ensure()
    return this.bus!
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0, delay = 0): void {
    if (this.muted || this.volume <= 0) return
    const ctx = this.ensure()
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain * this.volume, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(this.out())
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private noise(dur: number, gain: number, hp = 400, delay = 0): void {
    if (this.muted || this.volume <= 0) return
    const ctx = this.ensure()
    const t = ctx.currentTime + delay
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = hp
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain * this.volume, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.out())
    src.start(t)
  }

  /** A struck glass bell: a fundamental plus a quiet inharmonic partial. */
  private bell(freq: number, dur: number, gain: number, delay = 0): void {
    this.tone(freq, dur, 'sine', gain, 0, delay)
    this.tone(freq * 2.76, dur * 0.45, 'sine', gain * 0.22, 0, delay)
  }

  peg(combo: number): void {
    // Rapid hits in one frame would stack into a buzz.
    const now = performance.now()
    if (now - this.lastPeg < 18) return
    this.lastPeg = now
    const f = 523 * Math.pow(2, penta(Math.min(combo - 1, 14)) / 12)
    this.bell(f, 0.16, 0.09)
  }

  gold(combo: number): void {
    const f = 659 * Math.pow(2, penta(Math.min(combo, 14)) / 12)
    this.bell(f, 0.26, 0.1)
    this.tone(f * 1.5, 0.18, 'triangle', 0.04, 0, 0.03)
  }

  combo(n: number): void {
    const base = 523 * Math.pow(2, penta(Math.min(n / 5, 6) * 2) / 12)
    ;[0, 4, 7, 12].forEach((s, i) => this.bell(base * Math.pow(2, s / 12), 0.2, 0.07, i * 0.045))
  }

  pop(index: number, gold: boolean): void {
    const f = 392 * Math.pow(2, penta(Math.min(index, 24)) / 12)
    this.tone(f, 0.07, 'triangle', gold ? 0.07 : 0.05)
    if (gold) this.tone(f * 2, 0.09, 'sine', 0.03)
  }

  bumper(): void {
    this.noise(0.06, 0.1, 300)
    this.tone(220, 0.14, 'square', 0.05, -110)
    this.tone(440, 0.1, 'sine', 0.05, 220)
  }

  hazard(): void {
    this.tone(110, 0.28, 'sawtooth', 0.09, -60)
    this.noise(0.12, 0.08, 200)
  }

  launch(): void {
    this.noise(0.14, 0.09, 700)
    this.tone(180, 0.18, 'sine', 0.09, 160)
    this.tone(90, 0.12, 'triangle', 0.06, -30)
  }

  flip(): void {
    this.tone(140, 0.07, 'square', 0.05)
    this.noise(0.05, 0.06, 800)
    this.tone(330, 0.08, 'triangle', 0.04, 110, 0.03)
  }

  nudge(): void {
    this.noise(0.06, 0.06, 900)
    this.tone(260, 0.06, 'sine', 0.04, 60)
  }

  jackpot(): void {
    ;[523, 659, 784, 1046, 1318].forEach((f, i) => this.bell(f, 0.4, 0.09, i * 0.075))
    this.noise(0.5, 0.05, 4000, 0.3)
  }

  shatter(): void {
    this.noise(0.18, 0.14, 500)
    this.tone(800, 0.12, 'square', 0.04, -400)
  }

  core(): void {
    this.tone(110, 0.22, 'sine', 0.14, -30)
    this.noise(0.1, 0.1, 150)
  }

  /** Readiness is a small musical invitation; activation is a warm, rising reactor chord. */
  overdrive(ready = false): void {
    if (ready) {
      this.bell(659, .22, .075)
      this.bell(988, .3, .06, .07)
      this.bell(1318, .34, .04, .14)
      return
    }
    this.noise(.32, .07, 1200)
    this.tone(82, .48, 'sine', .12, 82)
    this.tone(164, .38, 'triangle', .065, 164, .025)
    ;[330, 494, 659, 988].forEach((f, i) => this.bell(f, .42, .055, .035 + i * .045))
  }

  /** A stable pitch identifies each bell; forge hits answer with alternating machinery. */
  relay(kind: 'bellkeeper' | 'heartforge', index: number): void {
    const i = Math.max(0, Math.min(2, Math.floor(index)))
    if (kind === 'bellkeeper') {
      const frequency = [523.25, 659.25, 783.99][i]
      this.bell(frequency, .46, .095)
      this.tone(frequency * 1.5, .2, 'sine', .024, 0, .025)
      return
    }
    const frequency = i % 2 ? 196 : 146.83
    this.noise(.075, .055, 550)
    this.tone(frequency, .19, 'triangle', .085, frequency * .2)
    this.bell(frequency * 4, .22, .045, .025)
  }

  /** Wrong-order contact gets a quiet directional cue rather than a damage sound. */
  relayBlocked(): void {
    this.tone(294, .07, 'sine', .035)
    this.tone(392, .1, 'sine', .03, 0, .055)
  }

  guardianClear(): void {
    ;[523.25, 659.25, 783.99].forEach((f, i) => this.bell(f, .44, .07, i * .055))
    this.bell(1046.5, .55, .055, .2)
  }

  recirculate(): void {
    this.tone(196, .2, 'sine', .055, 196)
    this.bell(587.33, .22, .04, .1)
  }

  ui(): void {
    this.tone(640, 0.05, 'sine', 0.05)
    this.tone(960, 0.04, 'sine', 0.025, 0, 0.025)
  }

  pocket(good = true): void {
    if (good) {
      this.bell(784, 0.3, 0.08)
      this.bell(1046, 0.3, 0.06, 0.07)
    } else this.tone(196, 0.22, 'triangle', 0.08, -60)
  }

  /** The machine powers up: a bright rising fanfare over a warm swell. */
  target(): void {
    this.tone(98, 0.6, 'sine', 0.1, 98)
    this.noise(0.4, 0.04, 2500, 0.05)
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.bell(f, 0.5, 0.075, i * 0.06))
    this.tone(1568, 0.5, 'triangle', 0.03, 0, 0.32)
  }

  /** Each overcharge tier climbs a fifth higher than the last. */
  overcharge(tier: number): void {
    const base = 659.25 * Math.pow(1.5, Math.max(0, tier - 1))
    ;[0, 4, 7, 12].forEach((s, i) => this.bell(base * Math.pow(2, s / 12), 0.34, 0.07, i * 0.04))
    this.noise(0.22, 0.035, 5000, 0.12)
  }

  /** Landing under the target: a falling, hollow note rather than a hazard sting. */
  short(): void {
    this.tone(330, 0.36, 'triangle', 0.08, -170)
    this.tone(165, 0.5, 'sine', 0.09, -60, 0.08)
    this.noise(0.16, 0.05, 260, 0.04)
  }

  /** A tumble of coins, one clink per gear group. */
  coins(n: number): void {
    const count = Math.max(2, Math.min(9, Math.round(n / 3)))
    for (let i = 0; i < count; i++) {
      const f = 1900 + ((i * 397) % 900)
      this.tone(f, 0.06, 'square', 0.018, f * 0.2, i * 0.045)
      this.tone(f * 1.5, 0.05, 'sine', 0.02, 0, i * 0.045 + 0.01)
    }
  }

  /** The next machine slides into place. */
  intro(): void {
    this.noise(0.45, 0.05, 900)
    this.tone(70, 0.5, 'sine', 0.09, 50)
    this.bell(392, 0.4, 0.05, 0.18)
  }

  /** A blast peg: a low thump, a crackle, and a bright chord that climbs with each chained blast. */
  blast(chain: number): void {
    if (this.muted || this.volume <= 0) return
    const ctx = this.ensure()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.35)
    g.gain.setValueAtTime(0.22 * this.volume, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    osc.connect(g)
    g.connect(this.out())
    osc.start(t)
    osc.stop(t + 0.45)
    this.noise(0.32, 0.12, 180)
    this.noise(0.5, 0.04, 3500, 0.06)
    const base = 392 * Math.pow(1.5, Math.min(3, chain) * 0.5)
    ;[0, 7, 12].forEach((s, i) => this.bell(base * Math.pow(2, s / 12), 0.32, 0.05, 0.05 + i * 0.03))
  }

  /** A soft warning when a fall is heading home short of its target. */
  warn(): void {
    this.tone(440, 0.09, 'square', 0.03)
    this.tone(440, 0.09, 'square', 0.03, 0, 0.14)
  }
}

/**
 * Short vibration cues. Android browsers and the Android app support them;
 * iOS Safari ignores navigator.vibrate, so every cue also has a visual and audio twin.
 */
export type HapticCue = 'tick' | 'gold' | 'bump' | 'flip' | 'hurt' | 'overdrive' | 'jackpot' | 'win' | 'ui' | 'level'

const PATTERNS: Record<HapticCue, number | number[]> = {
  tick: 6,
  gold: 12,
  bump: 16,
  flip: 20,
  ui: 8,
  hurt: [40, 30, 60],
  overdrive: [30, 40, 60],
  jackpot: [30, 50, 30, 50, 90],
  win: [40, 60, 40, 60, 120],
  level: [20, 40, 20, 40, 60],
}

const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

export class Haptics {
  enabled = true
  private last = 0
  private budget = 0

  get available(): boolean { return supported && coarse }

  play(cue: HapticCue): void {
    if (!this.enabled || !supported || !coarse) return
    const now = performance.now()
    // Refill roughly 15 cues per second; strong cues always pass.
    this.budget = Math.min(4, this.budget + (now - this.last) / 66)
    this.last = now
    const strong = Array.isArray(PATTERNS[cue])
    if (!strong && this.budget < 1) return
    if (!strong) this.budget -= 1
    try { navigator.vibrate(PATTERNS[cue]) } catch { /* a blocked call is harmless */ }
  }
}

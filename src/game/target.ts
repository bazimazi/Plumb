import type { LayoutId } from '../sim/board'

/**
 * Score targets. Each layout has a base sized to its scoring geometry, then the target grows with
 * the machine's depth in the expedition so a build has to keep up. Values were fitted to simulated
 * falls: a careless release misses about one target in four, a deliberate one rarely does.
 */
const LAYOUT_BASE: Record<LayoutId, number> = {
  workshop: 32,
  garden: 40,
  furnace: 105,
  elite: 110,
  ante: 62,
  core: 72,
  grinder: 0,
}

export interface TargetInput {
  layout: LayoutId
  depth: number
  ascension: number
  loop: number
  /** Board payout from trial and circuit pressure, before any Star Chart yield bonus. */
  payout: number
  boss: boolean
}

export function machineTarget(input: TargetInput): number {
  if (input.boss) return 0
  const base = LAYOUT_BASE[input.layout] ?? 60
  const depth = 1 + 0.36 * Math.max(0, input.depth - 1)
  const pressure = (1 + input.ascension * 0.04) * (1 + Math.min(10, input.loop) * 0.08)
  const raw = base * depth * input.payout * pressure
  // Round to a friendly figure so a target reads at a glance.
  const step = raw < 200 ? 5 : raw < 1000 ? 10 : 50
  return Math.max(step, Math.round(raw / step) * step)
}

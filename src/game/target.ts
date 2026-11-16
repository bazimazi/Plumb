import type { LayoutId } from '../sim/board'

/**
 * Score targets. Each layout has a base sized to its scoring geometry, then the target grows with
 * the machine's depth so a build has to keep up with it. Values were fitted to simulated expeditions
 * (`.play`-style human and careless policies): a deliberate player who aims with the preview, nudges
 * away from hazards and saves Overdrive for a short fall misses about one machine in ten; a careless
 * release misses about one in four. Depth grows the target by half its base per machine, which tracks
 * how quickly multipliers, chains and relics make a build stronger.
 */
const LAYOUT_BASE: Record<LayoutId, number> = {
  workshop: 45,
  garden: 75,
  furnace: 112,
  elite: 140,
  ante: 105,
  core: 102,
  grinder: 0,
}

/** Target growth per machine of depth, as a share of the layout base. */
export const TARGET_DEPTH_GROWTH = 0.5

export interface TargetInput {
  layout: LayoutId
  depth: number
  ascension: number
  loop: number
  /** Board payout from trial and circuit pressure, before any Star Chart yield bonus. */
  payout: number
  boss: boolean
  /** The sphere: Void Marble bounces less, so its targets are lower. */
  ballId?: string
}

/** Spheres score at different rates; targets follow so each one misses about as often. */
const SPHERE_FACTOR: Record<string, number> = { rubber: 1, prism: 1, void: 0.9 }

export function machineTarget(input: TargetInput): number {
  if (input.boss) return 0
  const base = LAYOUT_BASE[input.layout] ?? 60
  const depth = 1 + TARGET_DEPTH_GROWTH * Math.max(0, input.depth - 1)
  const pressure = (1 + input.ascension * 0.04) * (1 + Math.min(10, input.loop) * 0.08)
  const raw = base * depth * input.payout * pressure * (SPHERE_FACTOR[input.ballId ?? ''] ?? 1)
  // Round to a friendly figure so a target reads at a glance.
  const step = raw < 200 ? 5 : raw < 1000 ? 10 : 50
  return Math.max(step, Math.round(raw / step) * step)
}

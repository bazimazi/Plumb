import type { Board } from './board'

/** Base points a detonating blast peg pays for itself. */
export const BLAST_PAY = 6
/** World-space reach of a detonation before relics. */
export const BLAST_REACH = 125
/** Outward kick a detonation gives a sphere that is still near it. */
export const BLAST_KICK = 320

/**
 * Turns `count` ordinary pegs into blast pegs. Picks still pegs in the open middle of the machine,
 * well apart from each other, so a detonation always has neighbours to light and never sits in the
 * launcher's first contact or on the collectors. Deterministic for a given random stream.
 */
export function placeBlasts(board: Board, rng: () => number, count: number): number {
  if (board.boss || count <= 0) return 0
  const top = (board.shutterY ?? board.h * 0.3) + 70
  const bottom = board.floorY - 200
  const existing = board.pegs.filter(p => p.kind === 'blast')
  const pool = board.pegs
    .filter(p => p.kind === 'normal' && !p.motion && p.y > top && p.y < bottom && p.x > board.margin + 60 && p.x < board.w - board.margin - 60)
    .map(p => ({ p, k: rng() }))
    .sort((a, b) => a.k - b.k)
  let made = 0
  for (const { p } of pool) {
    if (made >= count) break
    if (existing.some(o => Math.hypot(o.x - p.x, o.y - p.y) < 230)) continue
    // A blast needs company: at least three pegs inside its reach.
    const neighbours = board.pegs.filter(o => o !== p && Math.hypot(o.x - p.x, o.y - p.y) < BLAST_REACH).length
    if (neighbours < 3) continue
    p.kind = 'blast'
    existing.push(p)
    made++
  }
  if (made && !board.features.includes('blast')) board.features.push('blast')
  return made
}

/** A small seeded stream from a board's own shape, for relics that add blasts mid-run. */
export function boardStream(board: Board, salt: number): () => number {
  let s = (board.pegs.length * 7919 + Math.round(board.floorY) * 31 + salt * 104729) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Blast pegs per machine: one while you learn them, two from the Foundry on, one more each circuit. */
export function blastCount(sector: number, loop: number): number {
  return (sector >= 2 ? 2 : 1) + Math.min(2, loop)
}

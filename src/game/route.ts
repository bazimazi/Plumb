import type { EncounterId, LayoutId, ThemeName } from '../sim/board'
import { ANOMALY_IDS, type AnomalyId } from '../sim/anomaly'
import { irand } from '../core/rng'

export interface ForkOption {
  title: string
  detail: string
  risk: 'safe' | 'risky'
  next: string
}

export type EventId = 'salvage' | 'resonance' | 'oracle'

export interface GameNode {
  id: string
  kind: 'drop' | 'boss' | 'fork' | 'shop' | 'repair' | 'bargain' | 'event'
  title: string
  kicker: string
  sector: 1 | 2 | 3
  /** The next drop number. Forks and services share the stage they lead toward. */
  depth: number
  theme: ThemeName
  risk: 'safe' | 'risky' | 'boss'
  layout: LayoutId
  reward?: 'upgrade' | 'relic'
  next?: string
  blurb: string
  options?: ForkOption[]
  anomaly?: AnomalyId
  eventId?: EventId
  /** 99 means a complete repair, including shells added by a build. */
  repairAmount?: number
  encounter?: EncounterId
}

export interface RouteOptions {
  loop?: number
  ascension?: number
  /** Version 2 retains the pre-guardian seeded expedition exactly. */
  rules?: 2 | 3 | 4
}

export const ACT_NAMES = ['The Brass Garden', 'The Ember Foundry', 'The Astral Engine'] as const

/**
 * Ten machines form an expedition; the optional Ante adds an eleventh.
 * Every fork rejoins, so no reward roll or event can accidentally strand a run.
 * Safe branches trade speed and relic income for gentler geometry. Layout,
 * anomaly, and room identity all come from the supplied seeded stream.
 */
export function createRoute(rng: () => number, options: RouteOptions = {}): { start: string; nodes: Record<string, GameNode> } {
  const loop = Math.max(0, Math.floor(options.loop ?? 0))
  const ascension = Math.max(0, Math.floor(options.ascension ?? 0))
  const nodes: Record<string, GameNode> = {}
  const title = (names: string[]) => names[irand(rng, names.length)]
  const anomaly = (force = false): AnomalyId | undefined =>
    force || rng() < Math.min(0.86, 0.3 + loop * 0.12 + ascension * 0.045)
      ? ANOMALY_IDS[irand(rng, ANOMALY_IDS.length)]
      : undefined

  const add = (
    id: string,
    kind: GameNode['kind'],
    name: string,
    sector: GameNode['sector'],
    depth: number,
    layout: LayoutId,
    props: Partial<GameNode> = {},
  ) => {
    const theme: ThemeName = sector === 1 ? 'workshop' : sector === 2 ? 'foundry' : 'gravity'
    nodes[id] = {
      id, kind, title: name, kicker: `Act ${['I', 'II', 'III'][sector - 1]} · ${ACT_NAMES[sector - 1]}`,
      sector, depth, theme, layout, risk: 'safe', blurb: '', ...props,
    }
  }
  const fork = (id: string, name: string, sector: GameNode['sector'], depth: number, choices: ForkOption[]) => {
    // Ordering varies, while the label always describes the actual route.
    const ordered = rng() < 0.5 ? [...choices].reverse() : choices
    add(id, 'fork', name, sector, depth, sector === 1 ? 'garden' : sector === 2 ? 'furnace' : 'core', { options: ordered })
  }

  add('workshop', 'drop', 'The Workshop', 1, 1, 'workshop', {
    reward: 'upgrade', next: 'fork-lane',
    blurb: 'Flip the gate toward gold.',
    anomaly: loop > 0 ? anomaly(true) : undefined,
  })
  fork('fork-lane', 'Two ways to wake the Helix', 1, 2, [
    { title: 'The Garden', detail: 'Springs · no spikes', risk: 'safe', next: 'garden' },
    { title: 'The Furnace', detail: 'Spikes · moving pegs · rich', risk: 'risky', next: 'furnace' },
  ])
  add('garden', 'drop', title(['The Glass Garden', 'The Moss Clock', 'The Conservatory']), 1, 2, 'garden', {
    reward: 'relic', next: 'salvage', anomaly: anomaly(),
    blurb: 'Springs and vanishing pegs.',
  })
  add('furnace', 'drop', title(['The Furnace', 'The Cinder Loom', 'The Coal Harp']), 1, 2, 'furnace', {
    risk: 'risky', reward: 'relic', next: 'salvage', anomaly: anomaly(true),
    blurb: 'Rich lane, moving pegs, spikes.',
  })
  add('salvage', 'event', 'A voice in the scrap', 1, 3, 'garden', {
    eventId: 'salvage', next: 'fork-brass',
    blurb: 'A deal in the scrap.',
  })
  fork('fork-brass', 'Set the rhythm of your build', 1, 3, [
    { title: 'The Quiet Gallery', detail: 'Calm · bank gears', risk: 'safe', next: 'gallery' },
    { title: 'The Golden Kiln', detail: 'Anomaly · extra relic', risk: 'risky', next: 'kiln' },
  ])
  add('gallery', 'drop', title(['The Quiet Gallery', 'The Waterwheel', 'The Brass Choir']), 1, 3, 'garden', {
    next: 'shop-brass', anomaly: anomaly(),
    blurb: 'A calm room. Bank gears.',
  })
  add('kiln', 'drop', title(['The Golden Kiln', 'The Ember Vessel', 'The Gilding Press']), 1, 3, 'furnace', {
    risk: 'risky', reward: 'relic', next: 'shop-brass', anomaly: anomaly(true),
    blurb: 'A relic past the hot lane.',
  })
  add('shop-brass', 'shop', 'The Brass Counter', 1, 4, 'garden', { next: 'rest-brass' })
  add('rest-brass', 'repair', 'The Lantern Bench', 1, 4, 'garden', {
    repairAmount: 99, next: 'press', blurb: 'Full shell repair.',
  })

  add('press', 'drop', title(['The Press', 'The Iron Cathedral', 'The Tempering Engine']), 2, 4, 'elite', {
    risk: 'risky', reward: 'upgrade', next: 'fork-mid', anomaly: anomaly(),
    blurb: 'Reinforced and moving pegs.',
  })
  fork('fork-mid', 'Choose your fuel', 2, 5, [
    { title: 'The Cooling Works', detail: 'Springs · calm', risk: 'safe', next: 'cooling' },
    { title: 'The High Forge', detail: 'Elite · anomaly', risk: 'risky', next: 'forge' },
  ])
  add('cooling', 'drop', title(['The Cooling Works', 'The Verdigris Vault', 'The Steam Garden']), 2, 5, 'garden', {
    next: 'resonance', anomaly: anomaly(),
    blurb: 'A calm room. Bank gears.',
  })
  add('forge', 'drop', title(['The High Forge', 'The Red Observatory', 'The Hammer Choir']), 2, 5, 'elite', {
    risk: 'risky', reward: 'relic', next: 'resonance', anomaly: anomaly(true),
    blurb: 'A hard furnace with a relic.',
  })
  add('resonance', 'event', 'The Resonance Chamber', 2, 6, 'furnace', {
    eventId: 'resonance', next: 'fork-service', blurb: 'Trade with the engine.',
  })
  fork('fork-service', 'A debt or a certainty', 2, 6, [
    { title: 'The Counter', detail: 'Buy parts · repair', risk: 'safe', next: 'shop' },
    { title: 'The Bargain', detail: 'Blind trades', risk: 'risky', next: 'bargain' },
  ])
  add('shop', 'shop', 'The Ember Counter', 2, 6, 'furnace', { next: 'dynamo' })
  add('bargain', 'bargain', 'The Bargain', 2, 6, 'furnace', { next: 'dynamo', risk: 'risky' })
  const dynamoLayout: LayoutId = rng() < 0.5 ? 'furnace' : 'elite'
  add('dynamo', 'drop', title(['The Heart Dynamo', 'The Bellows', 'The Solar Crucible']), 2, 6, dynamoLayout, {
    risk: 'risky', next: 'rest-ember', anomaly: anomaly(true),
    blurb: 'Last gears before the stars.',
  })
  add('rest-ember', 'repair', 'The Starlight Bench', 2, 7, 'core', {
    repairAmount: 99, next: 'observatory', blurb: 'Full shell repair.',
  })

  add('observatory', 'drop', title(['The Observatory', 'The Lunar Loom', 'The Starfall Archive']), 3, 7, 'core', {
    reward: 'upgrade', next: 'fork-late', anomaly: anomaly(),
    blurb: 'Wells and portals.',
  })
  fork('fork-late', 'How much is one more machine worth?', 3, 8, [
    { title: 'Repair the shell', detail: '+2 shell', risk: 'safe', next: 'repair' },
    { title: 'Jackpot Ante', detail: 'Extra machine · jackpot', risk: 'risky', next: 'ante' },
  ])
  add('repair', 'repair', 'The Moonlit Bench', 3, 8, 'core', {
    repairAmount: 2, next: 'core', blurb: 'Repair 2 shell.',
  })
  add('ante', 'drop', title(['The Ante', 'The Golden Eclipse', 'The Last Wager']), 3, 8, 'ante', {
    risk: 'risky', reward: 'relic', next: 'core', anomaly: anomaly(true),
    blurb: 'Gold, spikes, jackpot.',
  })
  add('core', 'drop', 'The Gravity Core', 3, 8, 'core', {
    risk: 'risky', reward: 'relic', next: 'oracle', anomaly: anomaly(true),
    blurb: 'Wells bend the fall.',
  })
  add('oracle', 'event', 'The Sleeping Oracle', 3, 9, 'core', {
    eventId: 'oracle', next: 'fork-horizon', blurb: 'One last trade.',
  })
  fork('fork-horizon', 'The last constellation', 3, 9, [
    { title: 'The Celestial Garden', detail: 'Calm', risk: 'safe', next: 'horizon-safe' },
    { title: 'The Event Horizon', detail: 'Anomaly · gravity', risk: 'risky', next: 'horizon' },
  ])
  add('horizon-safe', 'drop', title(['The Celestial Garden', 'The Silent Astrolabe', 'The Silver Orchard']), 3, 9, 'garden', {
    reward: 'upgrade', next: 'shop-final', anomaly: anomaly(),
    blurb: 'A calm last room.',
  })
  add('horizon', 'drop', title(['The Event Horizon', 'The Singularity', 'The Black Sun']), 3, 9, 'core', {
    risk: 'risky', reward: 'relic', next: 'shop-final', anomaly: anomaly(true),
    blurb: 'Gravity engine. Last relic.',
  })
  add('shop-final', 'shop', 'The Last Counter', 3, 10, 'core', { next: 'grinder' })
  add('grinder', 'boss', 'The Grinder', 3, 10, 'grinder', {
    risk: 'boss', theme: 'grinder', blurb: 'Hit the core 5 times.',
  })

  // Apply new content only after the original route stream has finished. Shared
  // v2 challenges and saved expeditions keep their rooms, descriptions and RNG
  // outcomes; v3 adds the optional guardians without moving any existing roll.
  if (options.rules !== 2) {
    nodes.gallery.encounter = 'bellkeeper'
    nodes.gallery.blurb = 'Ring 3 bells: +25 gears and a relic.'
    nodes.kiln.encounter = 'bellkeeper'
    nodes.kiln.blurb = 'Ring 3 bells: +25 gears. Relic guaranteed.'
    nodes.dynamo.encounter = 'heartforge'
    nodes.dynamo.blurb = 'Hit I → II → I → II: +40 gears and a relic.'
    for (const option of nodes['fork-brass'].options!) {
      if (option.next === 'gallery') {
        option.title = 'The Bellkeeper’s Garden'
        option.detail = 'Guardian · 3 bells'
      } else if (option.next === 'kiln') {
        option.title = 'The Bellkeeper’s Kiln'
        option.detail = 'Guardian · anomaly'
      }
    }
  }

  return { start: 'workshop', nodes }
}

export const SECTOR_LORE: Record<number, string> = {
  1: 'workshop', 2: 'foundry', 3: 'gravity',
}

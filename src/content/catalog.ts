export type Tag =
  | 'bounce'
  | 'multiplier'
  | 'gravity'
  | 'control'
  | 'economy'
  | 'risk'
  | 'portal'
  | 'destruction'
  | 'combo'
  | 'precision'
  | 'luck'
  | 'magnet'

export type SpecialKind = 'rebound' | 'crit' | 'tilt'

export interface BallDef {
  id: string
  name: string
  tagline: string
  tags: Tag[]
  primary: Tag
  restitution: number
  friction: number
  radius: number
  integrity: number
  nudge: number
  launch: number
  well: number
  special: SpecialKind
  charges: number
  specialName: string
  specialText: string
  color: string
  accent: string
  core: string
}

export interface RelicDef {
  id: string
  name: string
  tags: Tag[]
  text: string
  lockHint: string
  params: Record<string, number>
}

export interface UpgradeDef {
  id: string
  name: string
  tags: Tag[]
  text: string
  params: Record<string, number>
}

export interface PartDef {
  id: string
  name: string
  about: string
}

export interface ChallengeDef {
  id: string
  name: string
  text: string
}

export interface TrailDef {
  id: string
  name: string
  color: string
}

export const BALLS: Record<string, BallDef> = {
  rubber: {
    id: 'rubber',
    name: 'Rubber Heart',
    tagline: 'It wants another bounce.',
    tags: ['bounce', 'combo'],
    primary: 'bounce',
    restitution: 0.98,
    friction: 0.05,
    radius: 13,
    integrity: 3,
    nudge: 1.08,
    launch: 1.04,
    well: 1,
    special: 'rebound',
    charges: 2,
    specialName: 'Rebound',
    specialText: 'Next hit bounces harder.',
    color: '#ff6a52',
    accent: '#ffd2c4',
    core: '#8a2418',
  },
  prism: {
    id: 'prism',
    name: 'Prism Core',
    tagline: 'Fragile, and hungry for a multiplier.',
    tags: ['multiplier', 'risk', 'precision'],
    primary: 'multiplier',
    restitution: 0.74,
    friction: 0.16,
    radius: 12.4,
    integrity: 2,
    // Fragile, so it steers a little harder: precision is how Prism survives the Grinder.
    nudge: 1.2,
    launch: 1,
    well: 1,
    special: 'crit',
    charges: 2,
    specialName: 'Mark',
    specialText: 'Hit the marked peg: multiplier jumps.',
    color: '#e7fff8',
    accent: '#7eefe6',
    core: '#1c6e78',
  },
  void: {
    id: 'void',
    name: 'Void Marble',
    tagline: 'Down is a suggestion.',
    tags: ['gravity', 'control'],
    primary: 'gravity',
    restitution: 0.56,
    friction: 0.3,
    radius: 14.6,
    integrity: 3,
    nudge: 0.68,
    launch: 0.86,
    well: 1.45,
    special: 'tilt',
    charges: 2,
    specialName: 'Tilt',
    specialText: 'Lean gravity toward the cursor.',
    color: '#2a2144',
    accent: '#c4b6ff',
    core: '#090712',
  },
}

export const BALL_LIST = [BALLS.rubber, BALLS.prism, BALLS.void]

export const RELICS: Record<string, RelicDef> = {
  'spring-soul': {
    id: 'spring-soul',
    name: 'Spring Soul',
    tags: ['bounce', 'combo'],
    text: 'Bouncier sphere. Longer combo window.',
    lockHint: '',
    params: { rest: 0.07, window: 0.2 },
  },
  'golden-magnet': {
    id: 'golden-magnet',
    name: 'Golden Magnet',
    tags: ['magnet', 'economy'],
    text: 'Gold pegs pull the sphere.',
    lockHint: '',
    params: { pull: 280, radius: 240 },
  },
  'lucky-gear': {
    id: 'lucky-gear',
    name: 'Lucky Gear',
    tags: ['luck', 'multiplier', 'magnet'],
    text: 'First hit in each row turns gold. 6 rows.',
    lockHint: '',
    params: { mult: 0.34, max: 6 },
  },
  'broken-compass': {
    id: 'broken-compass',
    name: 'Broken Compass',
    tags: ['control', 'precision'],
    text: 'Every 3rd bounce back: +1 nudge.',
    lockHint: '',
    params: { every: 3 },
  },
  'heavy-crown': {
    id: 'heavy-crown',
    name: 'Heavy Crown',
    tags: ['destruction', 'risk'],
    text: 'Fast hits shatter pegs for bonus points.',
    lockHint: '',
    params: { speed: 680, bonus: 8 },
  },
  'echo-core': {
    id: 'echo-core',
    name: 'Echo Core',
    tags: ['bounce', 'combo'],
    text: 'Bumpers kick twice.',
    lockHint: '',
    params: { delay: 0.14, impulse: 300, radius: 200 },
  },
  'gravity-lens': {
    id: 'gravity-lens',
    name: 'Gravity Lens',
    tags: ['gravity', 'portal'],
    text: 'Stronger wells. Portals pull you in.',
    lockHint: 'wells grow teeth',
    params: { wells: 1.65, tilt: 1.4, portal: 90 },
  },
  'glass-heart': {
    id: 'glass-heart',
    name: 'Glass Heart',
    tags: ['risk', 'multiplier'],
    text: '−1 max shell. Much bigger multiplier gains.',
    lockHint: 'a brittle fortune',
    params: { shell: 1, gain: 1.55 },
  },
  ouroboros: {
    id: 'ouroboros',
    name: 'Ouroboros',
    tags: ['portal', 'multiplier'],
    text: 'Portals raise the multiplier and your speed.',
    lockHint: 'a door that bites back',
    params: { mult: 0.55, speed: 1.13 },
  },
  'clockwork-feather': {
    id: 'clockwork-feather',
    name: 'Clockwork Feather',
    tags: ['combo', 'gravity', 'control'],
    text: 'At 8 combo, time slows.',
    lockHint: 'the clock skips',
    params: { combo: 8, scale: 0.46, duration: 0.62 },
  },
  'arc-coil': {
    id: 'arc-coil',
    name: 'Arc Coil',
    tags: ['combo', 'multiplier'],
    text: 'Every 5 combo: zap 3 nearby pegs.',
    lockHint: '',
    params: { every: 5, targets: 3, radius: 190, pay: 4, max: 3 },
  },
  'velvet-fuse': {
    id: 'velvet-fuse',
    name: 'Velvet Fuse',
    tags: ['control', 'risk'],
    text: 'Once per drop: ignore a spike or gutter.',
    lockHint: '',
    params: { shields: 1 },
  },
  'golden-rudder': {
    id: 'golden-rudder',
    name: 'Golden Rudder',
    tags: ['precision', 'control', 'magnet'],
    text: 'Nudge into a gold peg: nudge refunded.',
    lockHint: '',
    params: { window: 1.2, max: 3 },
  },
  'brass-ledger': {
    id: 'brass-ledger',
    name: 'Brass Ledger',
    tags: ['economy', 'multiplier'],
    text: 'Pegs trade 2 points for +0.12 multiplier.',
    lockHint: '',
    params: { cost: 2, mult: 0.12, max: 5 },
  },
  flywheel: {
    id: 'flywheel',
    name: 'Flywheel',
    tags: ['bounce', 'combo'],
    text: 'Spring, then bumper: +0.25 multiplier, +1 nudge.',
    lockHint: 'build a bounce engine',
    params: { mult: 0.25, max: 4 },
  },
  'portal-passport': {
    id: 'portal-passport',
    name: 'Portal Passport',
    tags: ['portal', 'economy', 'control'],
    text: 'First 2 portals: +10 points, +1 nudge.',
    lockHint: 'take the scenic route',
    params: { pay: 10, max: 2 },
  },
  'clean-contract': {
    id: 'clean-contract',
    name: 'Clean Contract',
    tags: ['precision', 'economy'],
    text: 'No hazards: +4 points per lit peg.',
    lockHint: 'a flawless landing',
    params: { perPeg: 4, max: 60 },
  },
  'salvage-crown': {
    id: 'salvage-crown',
    name: 'Salvage Crown',
    tags: ['destruction', 'risk'],
    text: 'Fast hits shatter. 4th shatter: +1 shell.',
    lockHint: 'break it to rebuild it',
    params: { speed: 840, shatters: 4, shell: 1, mult: 0.4 },
  },
  'powder-heart': {
    id: 'powder-heart',
    name: 'Powder Heart',
    tags: ['destruction', 'multiplier'],
    text: 'Bigger blasts. Each blast: +0.2 multiplier.',
    lockHint: 'light the fuse',
    params: { reach: 1.45, mult: 0.2 },
  },
  'tinder-box': {
    id: 'tinder-box',
    name: 'Tinder Box',
    tags: ['destruction', 'luck'],
    text: '+2 blast pegs in every machine.',
    lockHint: 'leave nothing standing',
    params: { extra: 2 },
  },
  'chain-reactor': {
    id: 'chain-reactor',
    name: 'Chain Reactor',
    tags: ['combo', 'destruction'],
    text: 'Each blast: +40% Overdrive.',
    lockHint: 'feed the reactor fire',
    params: { charge: 0.4 },
  },
}

export const RELIC_LIST = Object.values(RELICS)

export const UPGRADES: Record<string, UpgradeDef> = {
  'side-jets': {
    id: 'side-jets',
    name: 'Side Jets',
    tags: ['control'],
    text: '+1 nudge per drop.',
    params: { nudges: 1 },
  },
  'open-throat': {
    id: 'open-throat',
    name: 'Open Throat',
    tags: ['precision', 'control'],
    text: 'Wider launch angle.',
    params: { cone: 0.16 },
  },
  'heated-skin': {
    id: 'heated-skin',
    name: 'Heated Skin',
    tags: ['bounce', 'destruction'],
    text: 'Faster bounces. Easier shatters.',
    params: { rest: 0.06 },
  },
  'first-gild': {
    id: 'first-gild',
    name: 'First Gild',
    tags: ['multiplier', 'luck'],
    text: 'Start each drop at ×1.5.',
    params: { mult: 0.5 },
  },
  'long-ratchet': {
    id: 'long-ratchet',
    name: 'Long Ratchet',
    tags: ['combo'],
    text: 'Longer combo window.',
    params: { window: 0.22 },
  },
  'spare-shell': {
    id: 'spare-shell',
    name: 'Spare Shell',
    tags: [],
    text: '+1 max shell, already filled.',
    params: { shell: 1 },
  },
  'plumb-line': {
    id: 'plumb-line',
    name: 'Plumb Line',
    tags: ['gravity', 'control'],
    text: '+1 gravity tilt per drop.',
    params: { tilts: 1 },
  },
  'bumper-tithe': {
    id: 'bumper-tithe',
    name: 'Bumper Tithe',
    tags: ['economy'],
    text: 'Bumpers pay points.',
    params: { gears: 5 },
  },
  'gate-memory': {
    id: 'gate-memory',
    name: 'Gate Memory',
    tags: ['control', 'combo'],
    text: 'Gate flip at 4+ combo: +1 nudge.',
    params: { combo: 4 },
  },
  afterimage: {
    id: 'afterimage',
    name: 'Afterimage',
    tags: ['precision'],
    text: 'Longer aim preview.',
    params: { steps: 70 },
  },
  capacitor: {
    id: 'capacitor',
    name: 'Capacitor',
    tags: ['control'],
    text: '+1 sphere trick per drop.',
    params: { charges: 1 },
  },
  'shock-absorber': {
    id: 'shock-absorber',
    name: 'Shock Absorber',
    tags: ['risk', 'control'],
    text: 'Longer safety after a spike.',
    params: { grace: 1.4 },
  },
  'compound-interest': {
    id: 'compound-interest',
    name: 'Compound Interest',
    tags: ['economy', 'combo'],
    text: 'Combo 6+: +20% points.',
    params: { combo: 6, scale: 1.2 },
  },
  'landing-gear': {
    id: 'landing-gear',
    name: 'Landing Gear',
    tags: ['precision', 'economy'],
    text: 'Safe pockets: +12 points.',
    params: { pay: 12 },
  },
}

export const UPGRADE_LIST = Object.values(UPGRADES)

export const PARTS: PartDef[] = [
  { id: 'peg', name: 'Peg', about: 'Pays when hit.' },
  { id: 'gold', name: 'Gold peg', about: 'Raises the multiplier.' },
  { id: 'reinforced', name: 'Reinforced peg', about: 'Pays more. Never shatters.' },
  { id: 'moving', name: 'Moving peg', about: 'Slides. Can shove you.' },
  { id: 'vanish', name: 'Vanishing peg', about: 'Vanishes for a while when hit.' },
  { id: 'blast', name: 'Blast peg', about: 'Explodes: nearby pegs pay.' },
  { id: 'bumper', name: 'Bumper', about: 'Kicks the sphere away.' },
  { id: 'relay', name: 'Guardian relay', about: 'Guardian target. Hit it to link.' },
  { id: 'shutter', name: 'Shutter', about: 'Flip once to switch lanes.' },
  { id: 'spike', name: 'Spike', about: '−1 shell. Breaks your combo.' },
  { id: 'spring', name: 'Spring', about: 'Throws you back up.' },
  { id: 'well', name: 'Gravity well', about: 'Bends the fall.' },
  { id: 'portal', name: 'Portal', about: 'Paired doors. Keeps your speed.' },
  { id: 'accel', name: 'Accelerator', about: 'Speeds you up.' },
  { id: 'core', name: 'Grinder core', about: '5 hits break it.' },
  { id: 'jackpot', name: 'Jackpot maw', about: 'Pays big at ×3 or more.' },
]

export const CHALLENGES: ChallengeDef[] = [
  { id: 'combo10', name: 'Tenfold', text: 'Reach a 10 combo in one drop.' },
  { id: 'mult4', name: 'Prism hour', text: 'Reach ×4 in one drop.' },
  { id: 'clean', name: 'Untouched', text: 'Finish a drop without a hazard.' },
  { id: 'grinder', name: 'Break the Grinder', text: 'Defeat the boss.' },
  { id: 'shatter8', name: 'Open lane', text: 'Shatter 8 pegs in one fall.' },
  { id: 'portal', name: 'Elsewhere', text: 'Pass through a portal.' },
  { id: 'score1500', name: 'Deep score', text: 'Score 1500 in one fall.' },
  { id: 'flip-gold', name: 'Committed', text: 'Flip the gate and strike gold in the same drop.' },
  { id: 'jackpot', name: 'Jackpot', text: 'Trigger a jackpot.' },
  { id: 'win-rubber', name: 'Heart of rubber', text: 'Break the Grinder with Rubber Heart.' },
  { id: 'win-prism', name: 'Heart of prism', text: 'Break the Grinder with Prism Core.' },
  { id: 'win-void', name: 'Heart of void', text: 'Break the Grinder with Void Marble.' },
]

export const TRAILS: TrailDef[] = [
  { id: 'brass', name: 'Brass wake', color: '#e0b07a' },
  { id: 'ember', name: 'Ember wake', color: '#ff8a5b' },
  { id: 'violet', name: 'Violet wake', color: '#b7a4ff' },
]

export const LORE: Record<string, string> = {
  workshop: 'The first teeth of the Helix are brass. They were made to be understood.',
  foundry: 'Heat is just gravity that learned impatience.',
  gravity: 'Below the foundry, the machine stops pretending down is a rule.',
  grinder: 'The Grinder does not hate you. It only repeats.',
}

export function ballById(id: string): BallDef {
  return BALLS[id] ?? BALLS.rubber
}

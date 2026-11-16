export const TUNING = {
  gravity: 1520,
  dt: 1 / 120,
  maxSpeed: 1380,
  airDrag: 0.22,
  substepPx: 7,
  pegE: 0.84,
  goldE: 0.88,
  reinforcedE: 0.58,
  wallE: 0.52,
  shutterE: 0.48,
  bumperE: 0.1,
  bumperKick: 490,
  springKick: 680,
  nudgeSpeed: 360,
  comboWindow: 1.28,
  comboStep: 0.12,
  pegPay: 3,
  reinforcedPay: 4,
  goldPay: 6,
  jackpotAt: 3,
  researchCost: 12,
  shopUpgrade: 30,
  shopRelic: 50,
  shopReroll: 5,
  trailCost: 22,
  challengeShards: 6,
  previewSteps: 110,
  previewDt: 1 / 90,
}

/**
 * Gear sources and sinks outside the fall. Gears are a calm, flat currency: a careful act earns
 * enough for one or two purchases, never the whole counter.
 */
export const ECON = {
  /** Shop prices grow by this share per act after the first. */
  actPrice: 0.45,
  repairBase: 18,
  repairPerAct: 10,
  skipReward: 10,
  scrap: 8,
  /** Machines without a draft pay this on a surviving landing. */
  salvage: 10,
  bargainPay: 25,
  bargainWalk: 10,
  bargainEmpty: 15,
  salvageUpgrade: 15,
  salvageSell: 25,
  salvagePatch: 12,
  resonanceEmptyRelic: 30,
  resonanceEmptyUpgrade: 20,
  resonanceQuiet: 10,
  oracleRelic: 35,
  oracleHeal: 15,
  oracleDieLow: 10,
  oracleDieHigh: 50,
} as const

export const RESEARCH_ORDER = ['gravity-lens', 'glass-heart', 'ouroboros', 'clockwork-feather', 'flywheel', 'portal-passport', 'clean-contract', 'salvage-crown', 'powder-heart', 'chain-reactor', 'tinder-box'] as const

export const STARTER_RELICS = [
  'spring-soul',
  'golden-magnet',
  'lucky-gear',
  'broken-compass',
  'heavy-crown',
  'echo-core',
  'arc-coil',
  'velvet-fuse',
  'golden-rudder',
  'brass-ledger',
] as const

import { hashString, mulberry32 } from '../core/rng'
import { t } from '../i18n'

/**
 * Long-term progression. Everything here is pure: the controller feeds in run
 * facts and applies the returned rewards. Curves are polynomial for levels
 * (never an exponential wall) and geometric for Star Chart costs, with
 * asymptotic effects on the endless nodes so power stays bounded forever.
 */

// ---------------------------------------------------------------------------
// Observatory rank and sphere mastery

/** XP needed to go from `level` to `level + 1`. */
export function rankXp(level: number): number {
  return Math.round(100 * Math.pow(Math.max(1, level), 1.5))
}

export function masteryXp(level: number): number {
  return Math.round(70 * Math.pow(Math.max(1, level), 1.4))
}

export interface LevelState { level: number; xp: number }

/** Adds XP and returns every level crossed, in order. */
export function addXp(state: LevelState, amount: number, curve: (level: number) => number): number[] {
  const gained: number[] = []
  state.xp += Math.max(0, Math.floor(amount))
  // A bound keeps a corrupted or enormous grant from spinning.
  for (let guard = 0; guard < 500 && state.xp >= curve(state.level); guard++) {
    state.xp -= curve(state.level)
    state.level += 1
    gained.push(state.level)
  }
  return gained
}

const TITLES = [
  'Apprentice', 'Brass Hand', 'Gear Reader', 'Lane Finder', 'Spring Tamer', 'Gold Seeker', 'Chain Singer',
  'Gatekeeper', 'Foundry Walker', 'Reactor Adept', 'Star Cartographer', 'Helix Pilot', 'Grinder Breaker',
  'Void Navigator', 'Astral Engineer', 'Keeper of Falls', 'Celestial Machinist', 'Orbit Sovereign',
]

/** A title every five ranks; past the list it keeps counting. */
export function rankTitle(level: number): string {
  const index = Math.floor((Math.max(1, level) - 1) / 5)
  if (index < TITLES.length) return t(TITLES[index])
  return t('Star Warden {n}', { n: toRoman(index - TITLES.length + 1) })
}

export function rankReward(level: number): number {
  return 15 + level * 5
}

export function toRoman(n: number): string {
  if (n > 3999) return String(Math.floor(n))
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  let v = Math.max(1, Math.floor(n))
  for (const [k, s] of map) while (v >= k) { out += s; v -= k }
  return out
}

// ---------------------------------------------------------------------------
// Sphere finishes: cosmetic only, earned through mastery.

export interface Finish { id: string; name: string; level: number; color: string; accent: string; core: string }

export const FINISHES: Record<string, Finish[]> = {
  rubber: [
    { id: 'rubber-base', name: 'Original', level: 1, color: '#ff6a52', accent: '#ffd2c4', core: '#8a2418' },
    { id: 'rubber-coral', name: 'Coral Reef', level: 3, color: '#ff8f7a', accent: '#fff0d6', core: '#b23a3a' },
    { id: 'rubber-jade', name: 'Jade Heart', level: 6, color: '#3fcf8e', accent: '#d9ffe9', core: '#0f5a3a' },
    { id: 'rubber-solar', name: 'Solar Flare', level: 10, color: '#ffb02e', accent: '#fff6c2', core: '#9a3d00' },
    { id: 'rubber-nebula', name: 'Nebula', level: 15, color: '#d05cff', accent: '#ffd6ff', core: '#3c0f6a' },
    { id: 'rubber-obsidian', name: 'Obsidian', level: 22, color: '#2b2f3a', accent: '#ff7a5c', core: '#08090c' },
    { id: 'rubber-aurora', name: 'Aurora', level: 30, color: '#5cf2ff', accent: '#f4ffd6', core: '#1a3fa0' },
  ],
  prism: [
    { id: 'prism-base', name: 'Original', level: 1, color: '#e7fff8', accent: '#7eefe6', core: '#1c6e78' },
    { id: 'prism-rose', name: 'Rose Quartz', level: 3, color: '#ffe3ee', accent: '#ff9ac2', core: '#8a2f5c' },
    { id: 'prism-amber', name: 'Amber', level: 6, color: '#fff1d0', accent: '#ffc35c', core: '#8a5212' },
    { id: 'prism-sapphire', name: 'Sapphire', level: 10, color: '#dfe9ff', accent: '#6f9bff', core: '#142a7a' },
    { id: 'prism-emerald', name: 'Emerald', level: 15, color: '#e1ffe8', accent: '#45e08a', core: '#0c5a30' },
    { id: 'prism-ruby', name: 'Ruby', level: 22, color: '#ffe0e0', accent: '#ff4f5e', core: '#6a0c18' },
    { id: 'prism-diamond', name: 'Starlight', level: 30, color: '#ffffff', accent: '#e8f6ff', core: '#7c8cff' },
  ],
  void: [
    { id: 'void-base', name: 'Original', level: 1, color: '#2a2144', accent: '#c4b6ff', core: '#090712' },
    { id: 'void-abyss', name: 'Abyss', level: 3, color: '#10263a', accent: '#6fd6ff', core: '#02070c' },
    { id: 'void-ember', name: 'Dying Star', level: 6, color: '#3a1410', accent: '#ff9a5c', core: '#0c0402' },
    { id: 'void-verdant', name: 'Deep Moss', level: 10, color: '#14301f', accent: '#9cffb8', core: '#030a06' },
    { id: 'void-eclipse', name: 'Eclipse', level: 15, color: '#0c0c10', accent: '#ffe08a', core: '#000000' },
    { id: 'void-pulsar', name: 'Pulsar', level: 22, color: '#2a0f3a', accent: '#ff6ad5', core: '#07020c' },
    { id: 'void-singularity', name: 'Singularity', level: 30, color: '#050505', accent: '#ffffff', core: '#3a2a8a' },
  ],
}

export function finishFor(ballId: string, id: string | undefined, masteryLevel: number): Finish | null {
  const list = FINISHES[ballId]
  if (!list) return null
  const found = list.find(f => f.id === id && f.level <= masteryLevel)
  return found ?? list[0]
}

// ---------------------------------------------------------------------------
// Star Chart: permanent, deliberately modest upgrades bought with stardust.

export type StarEffect =
  | 'startGears' | 'shell' | 'nudge' | 'discount' | 'rerolls' | 'draft' | 'combo' | 'reactor'
  | 'shards' | 'repair' | 'yield' | 'insight' | 'resonance'

export interface StarNode {
  id: StarEffect
  name: string
  glyph: string
  text: (level: number) => string
  max: number
  base: number
  growth: number
}

const pct = (v: number) => `${(v * 100).toFixed(v * 100 < 10 ? 1 : 0)}%`

/** Asymptotic bonus for endless nodes: approaches `cap` but never reaches it. */
export function asymptote(level: number, cap: number, half: number): number {
  const l = Math.max(0, level)
  return cap * l / (l + half)
}

export const STAR_NODES: StarNode[] = [
  { id: 'startGears', name: 'Provisions', glyph: '⚙', max: 5, base: 20, growth: 1.5, text: l => t('Begin each expedition with {n} gears.', { n: l * 8 }) },
  { id: 'combo', name: 'Long Fuse', glyph: '∿', max: 5, base: 30, growth: 1.55, text: l => t('Combo window +{n}s.', { n: (l * 0.03).toFixed(2) }) },
  { id: 'shards', name: 'Shard Lens', glyph: '◆', max: 5, base: 45, growth: 1.6, text: l => t('+{n}% shards from every expedition.', { n: l * 10 }) },
  { id: 'discount', name: "Merchant's Favor", glyph: '%', max: 5, base: 40, growth: 1.6, text: l => t('Shop prices −{n}%.', { n: l * 4 }) },
  { id: 'rerolls', name: 'Loaded Dice', glyph: '↻', max: 2, base: 70, growth: 2.4, text: l => t(l === 1 ? '{n} free shop reroll per shop.' : '{n} free shop rerolls per shop.', { n: l }) },
  { id: 'repair', name: 'Field Kit', glyph: '+', max: 2, base: 90, growth: 2, text: l => t('Shop shell repair costs −{n}%.', { n: l * 20 }) },
  { id: 'nudge', name: 'Spare Jet', glyph: '⇆', max: 1, base: 320, growth: 1, text: () => t('+1 nudge in every machine.') },
  { id: 'draft', name: 'Wide Draft', glyph: '❖', max: 1, base: 360, growth: 1, text: () => t('Starting relic drafts offer a fourth schematic.') },
  { id: 'shell', name: 'Tempered Shell', glyph: '◯', max: 1, base: 420, growth: 1, text: () => t('+1 maximum shell.') },
  { id: 'reactor', name: 'Reactor Tuning', glyph: 'ϟ', max: 1, base: 520, growth: 1, text: () => t('Overdrive charges from 4 different pegs instead of 5.') },
  { id: 'yield', name: 'Stellar Yield', glyph: '✦', max: Infinity, base: 25, growth: 1.13, text: l => t('Board payouts +{pct}. Endless; approaches +30%.', { pct: pct(asymptote(l, 0.3, 15)) }) },
  { id: 'insight', name: 'Starlight', glyph: '☀', max: Infinity, base: 25, growth: 1.13, text: l => t('Rank and mastery XP +{pct}. Endless; approaches +50%.', { pct: pct(asymptote(l, 0.5, 20)) }) },
  { id: 'resonance', name: 'Dust Resonance', glyph: '✧', max: Infinity, base: 40, growth: 1.15, text: l => t('Stardust income +{pct}. Endless; approaches +50%.', { pct: pct(asymptote(l, 0.5, 20)) }) },
]

export function starNode(id: string): StarNode | undefined {
  return STAR_NODES.find(n => n.id === id)
}

export function starCost(node: StarNode, level: number): number {
  return Math.round(node.base * Math.pow(node.growth, level))
}

export interface ChartBonuses {
  startGears: number
  shell: number
  nudge: number
  discount: number
  rerolls: number
  draft: number
  combo: number
  reactor: number
  shards: number
  repair: number
  yield: number
  insight: number
  resonance: number
}

export const NO_BONUS: ChartBonuses = { startGears: 0, shell: 0, nudge: 0, discount: 0, rerolls: 0, draft: 0, combo: 0, reactor: 0, shards: 0, repair: 0, yield: 0, insight: 0, resonance: 0 }

export function chartBonuses(levels: Record<string, number>): ChartBonuses {
  const l = (id: StarEffect) => Math.max(0, Math.min(starNode(id)?.max ?? 0, Math.floor(levels[id] ?? 0)))
  return {
    startGears: l('startGears') * 8,
    shell: l('shell'),
    nudge: l('nudge'),
    discount: l('discount') * 0.04,
    rerolls: l('rerolls'),
    draft: l('draft'),
    combo: l('combo') * 0.03,
    reactor: l('reactor'),
    shards: l('shards') * 0.1,
    repair: l('repair') * 0.2,
    yield: asymptote(l('yield'), 0.3, 15),
    insight: asymptote(l('insight'), 0.5, 20),
    resonance: asymptote(l('resonance'), 0.5, 20),
  }
}

// ---------------------------------------------------------------------------
// Run rewards

export interface RunOutcome {
  score: number
  machines: number
  win: boolean
  clears: number
  pure: boolean
  trial: number
}

/** Stardust grows with the square root of score, so deeper runs matter without exploding. */
export function stardustFor(o: RunOutcome, resonance = 0): number {
  if (o.machines <= 0) return 0
  const base = 6 + o.machines * 2 + Math.sqrt(Math.max(0, o.score)) * 0.9 + (o.win ? 25 : 0) + Math.max(0, o.clears) * 18
  const trial = 1 + o.trial * 0.06
  return Math.round(base * trial * (o.pure ? 1.25 : 1) * (1 + resonance))
}

export function xpFor(o: RunOutcome, insight = 0): number {
  if (o.machines <= 0) return 0
  const base = 20 + o.machines * 14 + Math.max(0, o.score) / 12 + (o.win ? 120 : 0) + Math.max(0, o.clears) * 70
  return Math.round(base * (1 + o.trial * 0.05) * (1 + insight))
}

/** First-clear bounty for reaching a new endless depth with a sphere. */
export function depthBounty(depth: number): number {
  return Math.round(40 * Math.pow(Math.max(1, depth), 1.3))
}

// ---------------------------------------------------------------------------
// Quests: three daily, two weekly. Missed days cost nothing.

export type QuestStat = 'pegs' | 'golds' | 'combo' | 'machines' | 'jackpots' | 'overdrives' | 'guardians' | 'clean' | 'shatters' | 'wins' | 'gears' | 'nudges'

export interface QuestDef { id: string; stat: QuestStat; target: number; text: string; best?: boolean }

const DAILY_POOL: QuestDef[] = [
  { id: 'd-pegs', stat: 'pegs', target: 150, text: 'Strike 150 pegs' },
  { id: 'd-golds', stat: 'golds', target: 25, text: 'Strike 25 gold pegs' },
  { id: 'd-combo', stat: 'combo', target: 15, text: 'Reach a 15-hit combo', best: true },
  { id: 'd-machines', stat: 'machines', target: 8, text: 'Survive 8 machines' },
  { id: 'd-jackpot', stat: 'jackpots', target: 1, text: 'Land a hot jackpot' },
  { id: 'd-overdrive', stat: 'overdrives', target: 5, text: 'Trigger Overdrive 5 times' },
  { id: 'd-guardian', stat: 'guardians', target: 1, text: 'Link a guardian' },
  { id: 'd-clean', stat: 'clean', target: 4, text: 'Make 4 clean landings' },
  { id: 'd-gears', stat: 'gears', target: 1200, text: 'Earn 1,200 gears' },
  { id: 'd-nudges', stat: 'nudges', target: 12, text: 'Use 12 nudges' },
  { id: 'd-shatter', stat: 'shatters', target: 6, text: 'Shatter 6 pegs' },
]

const WEEKLY_POOL: QuestDef[] = [
  { id: 'w-pegs', stat: 'pegs', target: 1500, text: 'Strike 1,500 pegs' },
  { id: 'w-wins', stat: 'wins', target: 2, text: 'Break the Grinder twice' },
  { id: 'w-machines', stat: 'machines', target: 50, text: 'Survive 50 machines' },
  { id: 'w-golds', stat: 'golds', target: 200, text: 'Strike 200 gold pegs' },
  { id: 'w-combo', stat: 'combo', target: 25, text: 'Reach a 25-hit combo', best: true },
  { id: 'w-gears', stat: 'gears', target: 12000, text: 'Earn 12,000 gears' },
  { id: 'w-guardians', stat: 'guardians', target: 5, text: 'Link 5 guardians' },
]

export function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** Monday-based UTC week, e.g. 2026-W46. */
export function weekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const year = d.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function pickQuests(pool: QuestDef[], key: string, count: number): QuestDef[] {
  const rng = mulberry32(hashString(`quests|${key}`))
  const bag = [...pool]
  const out: QuestDef[] = []
  while (out.length < count && bag.length) out.push(bag.splice(Math.floor(rng() * bag.length), 1)[0])
  return out
}

export function dailyQuests(key: string): QuestDef[] { return pickQuests(DAILY_POOL, key, 3) }
export function weeklyQuests(key: string): QuestDef[] { return pickQuests(WEEKLY_POOL, key, 2) }

export const DAILY_QUEST_REWARD = { dust: 30, xp: 120 }
export const WEEKLY_QUEST_REWARD = { dust: 140, xp: 500 }

export interface QuestBook { key: string; progress: Record<string, number>; claimed: string[] }

export function questDefs(kind: 'daily' | 'weekly', key: string): QuestDef[] {
  return kind === 'daily' ? dailyQuests(key) : weeklyQuests(key)
}

/** Applies a batch of stat increments. Returns the quests completed by this batch. */
export function advanceQuests(book: QuestBook, defs: QuestDef[], delta: Partial<Record<QuestStat, number>>): QuestDef[] {
  const done: QuestDef[] = []
  for (const q of defs) {
    if (book.claimed.includes(q.id)) continue
    const add = delta[q.stat] ?? 0
    if (!add) continue
    const now = q.best ? Math.max(book.progress[q.id] ?? 0, add) : (book.progress[q.id] ?? 0) + add
    book.progress[q.id] = Math.min(q.target, now)
    if (now >= q.target) { book.claimed.push(q.id); done.push(q) }
  }
  return done
}

// ---------------------------------------------------------------------------
// Feats: tiered lifetime milestones that never run out.

export type FeatStat = 'pegs' | 'golds' | 'machines' | 'wins' | 'jackpots' | 'overdrives' | 'combo' | 'depth' | 'score' | 'runs' | 'guardians'

export interface FeatDef { id: FeatStat; name: string; text: (target: number) => string; target: (tier: number) => number }

const geometric = (base: number, ratio: number) => (tier: number) => {
  const raw = base * Math.pow(ratio, tier)
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(raw)) - 1))
  return Math.round(raw / mag) * mag
}

export const FEATS: FeatDef[] = [
  { id: 'pegs', name: 'Peg Striker', text: n => t('Strike {n} pegs', { n: n.toLocaleString('en-US') }), target: geometric(250, 3) },
  { id: 'golds', name: 'Gold Hunter', text: n => t('Strike {n} gold pegs', { n: n.toLocaleString('en-US') }), target: geometric(30, 3) },
  { id: 'machines', name: 'Survivor', text: n => t('Survive {n} machines', { n: n.toLocaleString('en-US') }), target: geometric(10, 2.5) },
  { id: 'runs', name: 'Pilgrim', text: n => t('Finish {n} expeditions', { n: n.toLocaleString('en-US') }), target: geometric(3, 2.2) },
  { id: 'wins', name: 'Grinder Breaker', text: n => t('Break the Grinder {n} times', { n: n.toLocaleString('en-US') }), target: geometric(1, 2.5) },
  { id: 'jackpots', name: 'Maw Feeder', text: n => t('Land {n} jackpots', { n: n.toLocaleString('en-US') }), target: geometric(1, 2.5) },
  { id: 'overdrives', name: 'Reactor Pilot', text: n => t('Trigger Overdrive {n} times', { n: n.toLocaleString('en-US') }), target: geometric(10, 2.5) },
  { id: 'guardians', name: 'Guardian Friend', text: n => t('Link {n} guardians', { n: n.toLocaleString('en-US') }), target: geometric(1, 2.5) },
  { id: 'combo', name: 'Chain Singer', text: n => t('Reach a {n}-hit combo', { n }), target: tier => 10 + tier * 5 },
  { id: 'score', name: 'Fortune', text: n => t('Score {n} in one expedition', { n: n.toLocaleString('en-US') }), target: geometric(1500, 2.2) },
  { id: 'depth', name: 'Deep Diver', text: n => t(n === 1 ? 'Clear {n} circuit in one expedition' : 'Clear {n} circuits in one expedition', { n }), target: tier => tier + 1 },
]

export function featReward(tier: number): number {
  return Math.round(20 * Math.pow(tier + 1, 1.5))
}

/** Highest tier whose target is met, plus the next target. */
export function featProgress(def: FeatDef, value: number, claimed: number): { tier: number; next: number; ready: number } {
  let tier = Math.max(0, claimed)
  let ready = 0
  for (let guard = 0; guard < 200 && value >= def.target(tier); guard++) { tier++; ready++ }
  return { tier, next: def.target(tier), ready }
}

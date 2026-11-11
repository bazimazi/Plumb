import { BALLS, RELICS, TRAILS } from '../content/catalog'
import { MAX_TRIAL, type RunRecord } from './expedition'
import { FEATS, STAR_NODES, type QuestBook } from './progression'

export interface Settings {
  shake: boolean
  particles: boolean
  flash: boolean
  large: boolean
  volume: number
  speed: 0.75 | 1 | 1.5 | 2
  haptics: boolean
  /** auto adapts resolution to the device; saver caps resolution and menu frame rate. */
  quality: 'auto' | 'high' | 'saver'
}

export interface Lifetime {
  pegs: number; golds: number; shatters: number; jackpots: number; portals: number
  machines: number; wins: number; overdrives: number; guardians: number
}

export interface SaveData {
  version: 1
  shards: number
  runs: number
  bestScore: number
  bestCombo: number
  bestMult: number
  mastery: Record<string, number>
  history: RunRecord[]
  dailyBest: Record<string, number>
  balls: string[]
  ball: string
  researched: string[]
  seenRelics: string[]
  seenParts: string[]
  challenges: string[]
  trails: string[]
  trail: string
  lore: string[]
  lifetime: Lifetime
  coachingComplete: boolean
  settings: Settings
  /** Long-term progression, added without changing the save version. */
  stardust: number
  level: number
  xp: number
  sphereLevels: Record<string, { level: number; xp: number }>
  finish: Record<string, string>
  chart: Record<string, number>
  chartOn: boolean
  daily: QuestBook
  weekly: QuestBook
  feats: Record<string, number>
  /** Deepest circuits cleared in one expedition, per sphere. */
  deepest: Record<string, number>
  /** Highest Trial + 1 at which a relic or upgrade was part of a winning build. */
  stickers: Record<string, number>
}

const KEY = 'plumb-save-v1'

function fresh(): SaveData {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    version: 1,
    shards: 0,
    runs: 0,
    bestScore: 0,
    bestCombo: 0,
    bestMult: 1,
    mastery: {},
    history: [],
    dailyBest: {},
    balls: ['rubber'],
    ball: 'rubber',
    researched: [],
    seenRelics: [],
    seenParts: [],
    challenges: [],
    trails: [],
    trail: '',
    lore: [],
    lifetime: { pegs: 0, golds: 0, shatters: 0, jackpots: 0, portals: 0, machines: 0, wins: 0, overdrives: 0, guardians: 0 },
    coachingComplete: false,
    stardust: 0,
    level: 1,
    xp: 0,
    sphereLevels: {},
    finish: {},
    chart: {},
    chartOn: true,
    daily: { key: '', progress: {}, claimed: [] },
    weekly: { key: '', progress: {}, claimed: [] },
    feats: {},
    deepest: {},
    stickers: {},
    settings: {
      shake: !reduce,
      particles: true,
      flash: !reduce,
      large: false,
      volume: 0.7,
      speed: 1,
      haptics: true,
      quality: 'auto',
    },
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const parsed = JSON.parse(raw) as SaveData
    if (!parsed || parsed.version !== 1) return fresh()
    const base = fresh()
    const number = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, Number.MAX_SAFE_INTEGER) : fallback
    const strings = (v: unknown) => Array.isArray(v) ? [...new Set(v.filter((id): id is string => typeof id === 'string'))].slice(0, 200) : []
    const settings = { ...base.settings, ...parsed.settings }
    for (const key of ['shake', 'particles', 'flash', 'large', 'haptics'] as const) settings[key] = typeof settings[key] === 'boolean' ? settings[key] : base.settings[key]
    settings.volume = Math.min(1, number(settings.volume, 0.7))
    settings.speed = [0.75, 1, 1.5, 2].includes(settings.speed) ? settings.speed : 1
    settings.quality = ['auto', 'high', 'saver'].includes(settings.quality) ? settings.quality : 'auto'
    const mastery = Object.fromEntries(Object.keys(BALLS).map(id => [id, Math.min(MAX_TRIAL, Math.floor(number(parsed.mastery?.[id])))]))
    const counts = (v: unknown, keep: (k: string) => boolean, cap = Number.MAX_SAFE_INTEGER) => v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && keep(k)).map(([k, n]) => [k, Math.min(cap, Math.floor(number(n)))]).filter(([, n]) => (n as number) > 0))
      : {}
    const book = (v: unknown): QuestBook => {
      const b = v as Partial<QuestBook> | null
      return b && typeof b === 'object' && typeof b.key === 'string'
        ? { key: b.key.slice(0, 16), progress: counts(b.progress, () => true), claimed: strings(b.claimed).slice(0, 10) }
        : { key: '', progress: {}, claimed: [] }
    }
    const levels = parsed.sphereLevels && typeof parsed.sphereLevels === 'object'
      ? Object.fromEntries(Object.keys(BALLS).filter(id => parsed.sphereLevels[id]).map(id => [id, { level: Math.max(1, Math.min(100000, Math.floor(number(parsed.sphereLevels[id].level, 1)))), xp: Math.floor(number(parsed.sphereLevels[id].xp)) }]))
      : {}
    const history = Array.isArray(parsed.history) ? parsed.history.filter(r => r && typeof r.seed === 'string' && typeof r.ballId === 'string' && BALLS[r.ballId] && Number.isFinite(r.score) && r.score >= 0 && typeof r.date === 'string' && Array.isArray(r.relics) && Array.isArray(r.upgrades) && Number.isFinite(r.ascension) && Number.isFinite(r.drops) && Number.isFinite(r.clears) && Number.isFinite(r.combo) && (r.mode === 'daily' || r.mode === 'expedition')).slice(0, 20) : []
    return {
      ...base,
      shards: number(parsed.shards), runs: Math.floor(number(parsed.runs)),
      bestScore: number(parsed.bestScore), bestCombo: number(parsed.bestCombo), bestMult: number(parsed.bestMult, 1),
      balls: [...new Set(['rubber', ...strings(parsed.balls).filter(id => BALLS[id])])],
      ball: BALLS[parsed.ball] ? parsed.ball : 'rubber',
      researched: strings(parsed.researched).filter(id => RELICS[id]),
      seenRelics: strings(parsed.seenRelics), seenParts: strings(parsed.seenParts),
      challenges: strings(parsed.challenges), trails: strings(parsed.trails), lore: strings(parsed.lore),
      mastery, history,
      dailyBest: parsed.dailyBest && typeof parsed.dailyBest === 'object' ? Object.fromEntries(Object.entries(parsed.dailyBest).filter(([date]) => /^\d{4}-\d{2}-\d{2}(?:@3)?$/.test(date)).slice(-120).map(([date, score]) => [date, number(score)])) : {},
      coachingComplete: typeof parsed.coachingComplete === 'boolean' ? parsed.coachingComplete : number(parsed.runs) > 0,
      settings,
      lifetime: Object.fromEntries(Object.keys(base.lifetime).map(k => [k, number(parsed.lifetime?.[k as keyof SaveData['lifetime']])])) as unknown as SaveData['lifetime'],
      trail: TRAILS.some((t) => t.id === parsed.trail) ? parsed.trail : '',
      stardust: Math.floor(number(parsed.stardust)),
      level: Math.max(1, Math.min(100000, Math.floor(number(parsed.level, 1)))),
      xp: Math.floor(number(parsed.xp)),
      sphereLevels: levels,
      finish: parsed.finish && typeof parsed.finish === 'object' ? Object.fromEntries(Object.entries(parsed.finish).filter(([id, f]) => Object.hasOwn(BALLS, id) && typeof f === 'string')) : {},
      chart: Object.fromEntries(Object.entries(counts(parsed.chart, id => STAR_NODES.some(n => n.id === id))).map(([id, n]) => {
        const max = STAR_NODES.find(node => node.id === id)!.max
        return [id, Math.min(Number.isFinite(max) ? max : 100000, n as number)]
      })),
      chartOn: typeof parsed.chartOn === 'boolean' ? parsed.chartOn : true,
      daily: book(parsed.daily),
      weekly: book(parsed.weekly),
      feats: counts(parsed.feats, id => FEATS.some(f => f.id === id), 200),
      deepest: counts(parsed.deepest, id => Object.hasOwn(BALLS, id), 10001),
      stickers: counts(parsed.stickers, () => true, MAX_TRIAL + 1),
    }
  } catch {
    return fresh()
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    /* private mode or a full disk — the fall still happens */
  }
}

export function shardsFor(score: number, drops: number, win: boolean): number {
  if (drops <= 0) return 0
  return 5 + drops * 3 + Math.floor(score / 120) + (win ? 8 : 0)
}

import { Sfx } from '../audio/sfx'
import { BALLS, BALL_LIST, CHALLENGES, LORE, PARTS, RELICS, TRAILS, UPGRADES, ballById } from '../content/catalog'
import { clamp, formatMult } from '../core/math'
import { cleanSeed, makeSeed, rngFor } from '../core/rng'
import { Input } from '../input'
import { grantChallenges } from '../meta/challenges'
import { loadSave, shardsFor, writeSave, type SaveData } from '../meta/save'
import { ASCENSIONS, COMMISSIONS, CURRENT_RULES, MAX_TRIAL, challengeUrl, clearCheckpoint, commissionSet, dailyExpedition, readCheckpoint, writeCheckpoint, type RulesVersion, type RunRecord } from '../meta/expedition'
import { shareBase } from '../platform'
import { type Cam, machineScale, screenToWorld } from '../render/camera'
import { drawFrame, type Floater, type Particle, type Ring } from '../render/draw'
import { pegPose, type Board, type BinKind } from '../sim/board'
import { Drop, previewPath, type Cmd } from '../sim/drop'
import { describeDrop, type DropReport } from '../sim/report'
import { createBoard, demoBoard } from '../sim/generate'
import { ANOMALIES, applyAnomaly } from '../sim/anomaly'
import { applyEncounter } from '../sim/encounter'
import { computeProfile, type Profile } from '../sim/profile'
import { RESEARCH_ORDER, STARTER_RELICS, TUNING } from '../tuning'
import { createRoute, type GameNode } from './route'
import { PRACTICE_BUILDS, PRACTICE_MACHINES, copyRecipe, practiceRecipe, recipeMachine, type PracticeRecipe } from './laboratory'
import { randomFrom, rollReward, rollShop, type Offer } from './offers'
import { Haptics, type HapticCue } from '../haptics'
import { DAILY_QUEST_REWARD, FEATS, FINISHES, NO_BONUS, STAR_NODES, WEEKLY_QUEST_REWARD, addXp, advanceQuests, toRoman, chartBonuses, dayKey, depthBounty, featProgress, featReward, finishFor, masteryXp, questDefs, rankReward, rankTitle, rankXp, starCost, starNode, stardustFor, weekKey, xpFor, type ChartBonuses, type QuestDef, type QuestStat } from '../meta/progression'
import { UI, type ChoiceCard, type ProgressModel, type HudModel, type StageModel, type SummaryModel, type ViewModel } from '../ui/ui'

/** Screens whose state is fully captured by an expedition checkpoint. */
const REPLACE_PROMPT = 'Replace your saved run?'
/** CSS pixels the floating control bar covers at the bottom of wide layouts. */
const CONTROL_INSET = 100
/** The practice toolbar sits above the controls on wide layouts. */
const PRACTICE_TOOLBAR = 42
const CHECKPOINT_SCREENS = ['aim', 'fork', 'shop', 'choices', 'repair', 'bargain', 'event', 'victory']
const EMPTY: Cmd = { nudge: 0, flip: false, special: false, tilt: false, aimX: 0 }

const toRomanTier = (n: number) => toRoman(n)

const COMBO_CALLS: Record<number, string> = { 5: 'Nice chain', 10: 'Great chain', 15: 'Rattling!', 20: 'Unstoppable', 30: 'Helix hum' }

function binKindAt(board: Board, x: number): BinKind | null {
  for (const b of board.bins) if (x >= b.x0 && x <= b.x1) return b.kind
  return null
}

interface Run {
  seed: string
  ballId: string
  nodes: Record<string, GameNode>
  nodeId: string
  upgrades: string[]
  relics: string[]
  gears: number
  score: number
  integrity: number
  integrityMax: number
  profile: Profile
  drops: number
  bestCombo: number
  bestMult: number
  shatters: number
  portals: number
  jackpots: number
  flipGold: boolean
  cleanDrop: boolean
  bossWin: boolean
  launchedOnce: boolean
  depthTitle: string
  boardNonce: number
  reachedCore: boolean
  mode: 'expedition' | 'daily'
  rules: RulesVersion
  ascension: number
  loop: number
  clears: number
  catalogue: string[]
  commissions: string[]
  claimed: string[]
  cleanDrops: number
  golds: number
  pegs: number
  visited: string[]
  /** Pure runs ignore the Star Chart: dailies, shared challenges, and opted-out expeditions. */
  pure?: boolean
  overdrives?: number
  guardians?: number
}

interface Summary extends SummaryModel {
  ballId: string
  catalogue: string[]
  rules: RulesVersion
}

interface PracticeSession {
  recipe: PracticeRecipe
  attempt: number
  best: DropReport | null
  previous: DropReport | null
  result: DropReport | null
  comparison: number | null
}

export class Game {
  private save: SaveData
  private screen = 'hub'
  private returnTo = 'hub'
  private run: Run | null = null
  private drop: Drop | null = null
  private demo: Drop | null = null
  private offers: Offer[] = []
  private rerolls = 0
  private summary: Summary | null = null
  private practice: PracticeSession | null = null
  private lastMachine: PracticeRecipe | null = null
  private labMachine = 'workshop'
  private labSphere = 'rubber'
  private labBuild = 'stock'
  private reveal: { name: string; text: string; tags: string } | null = null
  private resolveCopy = { title: 'Settled', sub: '' }
  private resolveT = 0
  private draftSeed = ''
  private draftAscension = 0
  private sharedBall = ''
  private sharedCatalogue: string[] | null = null
  private sharedDaily = false
  private sharedRules: RulesVersion = CURRENT_RULES
  private drafting = false
  private draftTitle = ''
  private journalReturn = 'aim'
  private pausedFrom = 'aim'
  private suspended: unknown = null
  private hubTick = 0
  private selectedPulse = 0
  private aimAngle = 0
  private mouseAim = false
  private keyboardAim = 0
  private preview: { x: number; y: number }[] = []
  private previewKey = Number.NaN
  private overview = false
  private workshopNudged = false
  private pending: Cmd = { ...EMPTY }
  private camY = 400
  private snapCam = true
  private zoom = 1
  private zoomTarget = 1
  /** Real-time multiplier on the fixed-step accumulator. Physics stays identical, it just runs slower. */
  private warp = 1
  private launchKick = 0
  private rings: Ring[] = []
  private popT: Float32Array | null = null
  private cash: { order: number[]; next: number; t: number; step: number } | null = null
  private trauma = 0
  private shakeX = 0
  private shakeY = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private toast: { title: string; sub: string; big: boolean } | null = null
  private toastT = 0
  private toastBig = false
  private flash: ViewModel['flash'] = ''
  private flashT = 0
  private copied = ''
  private accum = 0
  private last = 0
  private cssW = 800
  private cssH = 600
  private dpr = 1
  private fps = 0
  private frames = 0
  private fpsT = 0
  private debugOpen = false
  private hitboxes = false
  private readonly dev: boolean
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly input: Input
  private readonly ui: UI
  private readonly sfx: Sfx
  private readonly debugEl: HTMLElement
  private readonly motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  /** Touch screens get copy about buttons and drags instead of keyboard keys. */
  private readonly touchQuery = matchMedia('(hover: none) and (pointer: coarse)')
  private readonly haptics = new Haptics()
  /** Adaptive resolution ceiling; lowered when frames run long. */
  private dprCap = 2
  private frameAvg = 16.7
  private frameSamples = 0
  /** Fastest sustained frame interval seen: the display's refresh period, or a power-saving cap. */
  private frameBase = 1000
  private menuSkip = false
  /** Rewards earned mid-run, announced at a calm moment. */
  private questNews: string[] = []
  /** Rank before quest XP was granted mid-run, so the debrief can still show the level-up. */
  /** A new run that would overwrite the saved expedition waits for a second, confirming tap. */
  private replaceArmed = ''
  private questRank: { level: number; xp: number; dust: number } | null = null

  constructor() {
    this.dev = import.meta.env?.DEV ?? false
    this.save = loadSave()
    if (!this.save.balls.includes(this.save.ball)) this.save.ball = 'rubber'
    this.sfx = new Sfx()
    this.sfx.volume = this.save.settings.volume
    this.canvas = document.getElementById('view') as HTMLCanvasElement
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    this.ctx = ctx
    this.input = new Input(this.canvas)
    this.ui = new UI(
      document.getElementById('stage')!,
      document.getElementById('hud')!,
      document.getElementById('toast')!,
      document.getElementById('flash')!,
      (act) => this.onAction(act),
      (seed) => {
        this.draftSeed = seed
        this.sharedBall = ''
        this.sharedCatalogue = null
        this.sharedDaily = false
        this.sharedRules = CURRENT_RULES
      },
    )
    this.debugEl = document.getElementById('debug')!
    const params = new URLSearchParams(location.search)
    if (params.get('seed')) this.draftSeed = cleanSeed(params.get('seed') || '')
    if ((params.get('rules') === '2' || params.get('rules') === '3') && this.draftSeed) {
      this.sharedRules = params.get('rules') === '2' ? 2 : 3
      this.sharedBall = BALLS[params.get('sphere') || '']?.id || ''
      this.draftAscension = Math.floor(clamp(Number(params.get('trial')) || 0, 0, MAX_TRIAL))
      this.sharedCatalogue = (params.get('archive') || '').split(',').filter(id => RELICS[id])
      this.sharedDaily = params.get('daily') === '1' && /^DAY\d{8}$/.test(this.draftSeed)
    }
    this.suspended = readCheckpoint()
    this.haptics.enabled = this.save.settings.haptics
    this.refreshQuests()
    if (params.has('debug')) this.debugOpen = true
    document.documentElement.classList.toggle('lg', this.save.settings.large)
    this.resize()
    window.addEventListener('resize', () => this.resize())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && (this.screen === 'aim' || this.screen === 'drop')) {
        this.pausedFrom = this.screen
        this.screen = 'pause'
        this.clearControls()
      }
    })
    // The mobile playfield reserves space for the HUD when a run begins.
    new ResizeObserver(() => this.resize()).observe(this.canvas)
    this.spawnDemo()
    requestAnimationFrame((t) => this.frame(t))
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect()
    this.cssW = r.width
    this.cssH = r.height
    this.dpr = Math.min(this.dprCap, this.qualityCeiling())
    this.canvas.width = Math.max(1, Math.floor(this.cssW * this.dpr))
    this.canvas.height = Math.max(1, Math.floor(this.cssH * this.dpr))
  }

  private qualityCeiling(): number {
    const device = window.devicePixelRatio || 1
    return Math.min(device, this.save.settings.quality === 'saver' ? 1.25 : 2)
  }

  /** Lowers resolution when frames run long during play, and recovers slowly with headroom. */
  private adaptQuality(dtMs: number): void {
    if (this.save.settings.quality !== 'auto' || (this.screen !== 'drop' && this.screen !== 'aim')) return
    this.frameAvg += (Math.min(100, dtMs) - this.frameAvg) * 0.05
    if (++this.frameSamples < 90) return
    this.frameBase = Math.min(this.frameBase * 1.002, Math.max(4, this.frameAvg))
    const ceiling = this.qualityCeiling()
    // Compare with the refresh baseline, so a 30 fps power cap is not mistaken for overload.
    if (this.frameAvg > Math.max(20, this.frameBase * 1.45) && this.dprCap > 1) {
      this.dprCap = Math.max(1, Math.min(this.dprCap, ceiling) - 0.25)
      this.frameSamples = 0
      this.resize()
    } else if (this.frameAvg < this.frameBase * 1.12 && this.dprCap < ceiling && this.frameSamples > 600) {
      this.dprCap = Math.min(ceiling, this.dprCap + 0.25)
      this.frameSamples = 0
      this.resize()
    }
  }

  private frame(now: number): void {
    const t = now / 1000
    // Battery saver draws menus at half rate; the next frame accounts for the skipped time.
    if (this.save.settings.quality === 'saver' && this.menu() && !this.menuSkip) {
      this.menuSkip = true
      requestAnimationFrame((n) => this.frame(n))
      return
    }
    this.menuSkip = false
    let dt = t - this.last
    this.last = t
    if (!Number.isFinite(dt) || dt < 0) dt = 0
    this.adaptQuality(dt * 1000)
    if (dt > 0.05) dt = 0.05
    this.frames++
    this.fpsT += dt
    if (this.fpsT >= 0.5) {
      this.fps = this.frames / this.fpsT
      this.frames = 0
      this.fpsT = 0
    }
    this.collectEdges()
    this.accum += dt * this.warp * (this.screen === 'drop' ? this.save.settings.speed : 1)
    let steps = 0
    while (this.accum >= TUNING.dt && steps < 8) {
      this.fixed(TUNING.dt)
      this.accum -= TUNING.dt
      steps++
    }
    this.animate(dt)
    this.draw(t)
    this.ui.render(this.view())
    this.debug()
    this.input.endFrame()
    requestAnimationFrame((n) => this.frame(n))
  }

  private collectEdges(): void {
    const p = this.input.pressed
    if (p.has('Backquote') && this.dev) this.debugOpen = !this.debugOpen
    if (p.has('Escape')) {
      this.clearControls()
      if (this.screen === 'pause') this.screen = this.pausedFrom
      else if (this.screen === 'aim' || this.screen === 'drop') {
        this.pausedFrom = this.screen
        this.screen = 'pause'
      } else if (this.screen === 'journal') this.screen = this.journalReturn
      else if (this.screen === 'reveal') this.onAction('close-reveal')
      else if (this.screen === 'laboratory' || this.screen === 'practice-result') this.onAction('lab-exit')
      else if (['help', 'collection', 'settings', 'history', 'stars', 'quests'].includes(this.screen)) this.onAction('back')
      return
    }
    if (p.has('KeyJ') && this.run && this.screen !== 'runend') this.onAction('journal')
    if (this.screen === 'hub' && p.has('Enter')) this.onAction(this.suspended ? 'continue-run' : 'start')
    else if (this.screen === 'aim') {
      if (p.has('KeyV')) this.toggleOverview()
      if (p.has('ArrowLeft') || p.has('KeyA')) {
        this.mouseAim = false
        this.keyboardAim -= 0.045
      }
      if (p.has('ArrowRight') || p.has('KeyD')) {
        this.mouseAim = false
        this.keyboardAim += 0.045
      }
      if (this.input.pointer && (Math.abs(this.input.dx) + Math.abs(this.input.dy) > 1.5)) this.mouseAim = true
      if (p.has('Enter') || this.input.clicked) this.launch()
    } else if (this.screen === 'drop') {
      if (p.has('KeyA') || p.has('ArrowLeft')) this.pending.nudge = -1
      if (p.has('KeyD') || p.has('ArrowRight')) this.pending.nudge = 1
      if (p.has('KeyF')) this.pending.flip = true
      if (p.has('Space')) this.pending.special = true
      if (p.has('KeyQ')) this.pending.tilt = true
      if (p.has('KeyE')) this.pending.overdrive = true
    } else if (p.has('Digit1')) this.hotkey(0)
    else if (p.has('Digit2')) this.hotkey(1)
    else if (p.has('Digit3')) this.hotkey(2)
    else if (p.has('Digit4')) this.hotkey(3)
    else if (p.has('Enter')) {
      if (this.screen === 'resolve') this.skipResolve()
      else if (this.screen === 'runend') this.onAction('again')
      else if (this.screen === 'practice-result') this.onAction('lab-retry')
      else if (this.screen === 'laboratory') this.onAction('lab-start')
      else if (this.screen === 'pause') this.screen = this.pausedFrom
      else if (this.screen === 'reveal') this.onAction('close-reveal')
    }
  }

  private hotkey(index: number): void {
    if (this.screen === 'choices' || this.screen === 'upgrade' || this.screen === 'relic') this.pick(index)
    else if (this.screen === 'shop') this.buy(index)
    else if (this.screen === 'fork') this.fork(index)
    else if (this.screen === 'bargain') this.bargain(index === 0 ? 'shell' : index === 1 ? 'pay' : 'walk')
    else if (this.screen === 'event') this.chooseEvent(index)
  }

  private clearControls(): void {
    this.pending = { ...EMPTY }
    this.input.keys.clear()
    this.input.pressed.clear()
    this.input.clicked = false
    this.accum = 0
  }

  private fixed(dt: number): void {
    if (this.attract()) return
    if (this.screen !== 'drop' || !this.drop) return
    if (this.drop.hitstop > 0) {
      this.drop.hitstop -= dt
      return
    }
    const cmd = this.pending
    this.pending = { ...EMPTY, aimX: this.worldX() }
    cmd.aimX = this.worldX()
    this.drop.step(dt * this.drop.timeScale, cmd)
    this.drain(false)
    if (!this.practice && !this.save.coachingComplete && this.run?.nodeId === 'workshop' && this.workshopNudged && this.drop.overdriveUses > 0) {
      this.save.coachingComplete = true
      writeSave(this.save)
      this.say('You control the fall', 'Workshop tips complete · replay them from How to play', 2, false)
    }
    if (this.drop.captured || this.drop.dead) this.finishDrop()
  }

  private spawnDemo(): void {
    const board = demoBoard()
    const profile = computeProfile('rubber', [], [])
    this.demo = new Drop(board, 'rubber', profile, 3, 3)
    this.dress(this.demo, 'rubber')
  }

  /** Applies the selected cosmetic finish. Physics never reads these colors. */
  private dress(drop: Drop, ballId: string): void {
    const finish = finishFor(ballId, this.save.finish[ballId], this.sphereLevel(ballId))
    if (finish) drop.ballDef = { ...drop.ballDef, color: finish.color, accent: finish.accent, core: finish.core }
  }

  private sphereLevel(ballId: string): number {
    return this.save.sphereLevels[ballId]?.level ?? 1
  }

  private showcaseBall() {
    const id = this.sharedBall || this.save.ball
    const def = ballById(id)
    const finish = finishFor(id, this.save.finish[id], this.sphereLevel(id))
    return finish ? { ...def, color: finish.color, accent: finish.accent, core: finish.core } : def
  }

  private bonuses(): ChartBonuses {
    return this.run && !this.run.pure && this.run.mode !== 'daily' && !this.practice ? chartBonuses(this.save.chart) : NO_BONUS
  }

  private feel(cue: HapticCue): void {
    this.haptics.play(cue)
  }

  private animate(dt: number): void {
    if (this.screen === 'aim' && this.drop) {
      const direction = Number(this.input.keys.has('ArrowRight') || this.input.keys.has('KeyD')) - Number(this.input.keys.has('ArrowLeft') || this.input.keys.has('KeyA'))
      if (direction) { this.mouseAim = false; this.keyboardAim = clamp(this.keyboardAim + direction * dt * 0.7, -this.run!.profile.aimCone, this.run!.profile.aimCone) }
      const angle = this.currentAngle()
      this.aimAngle = angle
      this.drop.setAim(angle)
      const key = Math.round(angle * 200)
      if (key !== this.previewKey) {
        this.previewKey = key
        this.preview = previewPath(this.drop, angle)
      }
    }
    if (this.screen === 'resolve') {
      this.resolveT -= dt
      if (this.resolveT <= 0) this.skipResolve()
    }
    const target = this.cameraTarget()
    if (this.snapCam) {
      this.camY = target
      this.snapCam = false
    } else {
      this.camY += (target - this.camY) * (1 - Math.exp(-4.2 * dt))
    }
    this.trauma = Math.max(0, this.trauma - dt * 1.7)
    const mag = this.trauma * this.trauma * (this.save.settings.shake && !this.motionQuery.matches ? 18 : 0)
    this.shakeX = (Math.random() * 2 - 1) * mag
    this.shakeY = (Math.random() * 2 - 1) * mag
    this.updateWarp(dt)
    this.zoom += (Math.max(this.zoomTarget, 1) - this.zoom) * (1 - Math.exp(-3 * dt))
    if (this.motionQuery.matches) this.zoom = 1
    this.launchKick = Math.max(0, this.launchKick - dt * 3.2)
    this.cashIn(dt)
    if (!this.drop || this.drop.hitstop <= 0) {
      const vdt = dt * (0.35 + 0.65 * this.warp)
      const drag = Math.exp(-2.6 * vdt)
      for (const p of this.particles) {
        p.life -= vdt
        p.vy += (p.streak ? 520 : 60) * vdt
        p.vx *= drag
        p.vy *= drag
        p.x += p.vx * vdt
        p.y += p.vy * vdt
      }
      this.particles = this.particles.filter((p) => p.life > 0).slice(-260)
      for (const f of this.floaters) {
        f.life -= vdt
        f.y -= 70 * vdt * (f.life / f.max)
      }
      this.floaters = this.floaters.filter((f) => f.life > 0).slice(-28)
      for (const r of this.rings) r.life -= vdt
      this.rings = this.rings.filter((r) => r.life > 0).slice(-40)
    }
    if (this.toastT > 0) {
      this.toastT -= dt
      if (this.toastT <= 0) this.toast = null
    }
    if (this.flashT > 0) {
      this.flashT -= dt
      if (this.flashT <= 0) this.flash = ''
    }
    this.canvas.style.cursor = this.screen === 'aim' ? 'crosshair' : 'default'
  }

  private draw(time: number): void {
    const drop = this.attract() ? this.demo : this.drop
    const board = drop?.board ?? null
    const scale = board ? this.cameraScale(board) : 1
    const cam: Cam = {
      scale,
      camY: this.camY,
      cssW: this.cssW,
      cssH: this.cssH,
      boardW: board?.w ?? 800,
      zoom: this.zoom,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
    }
    const trail = TRAILS.find((t) => t.id === this.save.trail)?.color ?? ''
    const demo = this.attract()
    drawFrame({
      ctx: this.ctx,
      cssW: this.cssW,
      cssH: this.cssH,
      dpr: this.dpr,
      cam,
      board,
      drop,
      preview: this.screen === 'aim' ? this.preview : [],
      aiming: this.screen === 'aim',
      aimAngle: this.aimAngle,
      particles: demo ? [] : this.particles,
      floaters: demo ? [] : this.floaters,
      rings: demo || this.motionQuery.matches || !this.save.settings.particles ? [] : this.rings,
      popT: demo ? null : this.popT,
      launchKick: demo ? 0 : this.launchKick,
      warp: this.warp,
      multHot: !!drop && drop.mult >= TUNING.jackpotAt,
      particlesOn: this.save.settings.particles && !this.motionQuery.matches,
      trailColor: trail,
      time: this.motionQuery.matches ? 0 : time,
      hitboxes: this.hitboxes,
      showcase: demo ? this.showcaseBall() : null,
    })
  }

  private menu(): boolean {
    return ['hub', 'help', 'collection', 'settings', 'history', 'laboratory', 'stars', 'quests'].includes(this.screen)
  }

  /** Attract mode only when no fall is in progress, so pause settings keep the live machine. */
  private attract(): boolean {
    return !this.run && (this.menu() || this.screen === 'reveal')
  }

  private currentAngle(): number {
    const cone = this.run?.profile.aimCone ?? 0.58
    if (!this.mouseAim || !this.drop) return clamp(this.keyboardAim, -cone, cone)
    const world = screenToWorld(this.cam(), this.input.x, this.input.y)
    const dx = world.x - this.drop.ball.x
    const dy = world.y - this.drop.ball.y
    if (dy < 8 && Math.abs(dx) < 8) return clamp(this.keyboardAim, -cone, cone)
    return clamp(Math.atan2(dx, dy), -cone, cone)
  }

  private cam(): Cam {
    const board = (this.attract() ? this.demo : this.drop)?.board
    return {
      scale: board ? this.cameraScale(board) : 1,
      camY: this.camY,
      cssW: this.cssW,
      cssH: this.cssH,
      boardW: board?.w ?? 800,
      zoom: this.zoom,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
    }
  }

  private worldX(): number {
    if (!this.input.pointer && this.drop) return this.drop.ball.x + (Math.sign(this.keyboardAim) || 1) * this.drop.board.w
    return screenToWorld(this.cam(), this.input.x, this.input.y).x
  }

  private cameraScale(board: Board): number {
    const normal = machineScale(this.cssW, board.w)
    return this.overview && this.screen === 'aim' ? Math.min(normal, Math.max(160, this.cssH - 112) / board.h) : normal
  }

  private toggleOverview(): void {
    if (this.screen !== 'aim') return
    this.overview = !this.overview
    this.zoom = 1
    this.zoomTarget = 1
    this.keyboardAim = this.aimAngle
    this.mouseAim = false
    this.snapCam = true
  }

  private cameraTarget(): number {
    const drop = this.attract() ? this.demo : this.drop
    const board = drop?.board
    if (!board) return 400
    const scale = this.cameraScale(board)
    const half = this.cssH / scale / 2
    let y = board.h * 0.34
    if (this.overview && this.screen === 'aim') return board.h / 2
    // Frame the launcher at the top so the barrel and the aim line read together.
    if (!this.attract() && this.screen === 'aim') y = Math.min((board.shutterY ?? board.h * 0.36) - 40, board.launchY - 70 + half)
    else if (drop?.launched) y = drop.ball.y + clamp(drop.ball.vy * 0.1, -30, 200)
    // Wide layouts float the controls over the canvas; keep the collectors and landing above them.
    const inset = !this.attract() && this.cssW > 760 ? (CONTROL_INSET + (this.practice ? PRACTICE_TOOLBAR : 0)) / scale : 0
    const max = board.h - half + inset
    if (max <= half) return (board.h + inset) / 2
    return clamp(y, half, max)
  }

  private launch(): void {
    if (!this.drop || !this.run || this.screen !== 'aim') return
    this.sfx.resume()
    const angle = this.currentAngle()
    this.aimAngle = angle
    this.drop.launch(angle)
    this.overview = false
    this.snapCam = true
    this.launchKick = 1
    const pal = this.drop.ballDef.accent
    const mx = this.drop.board.launchX + Math.sin(angle) * 44
    const my = this.drop.board.launchY + Math.cos(angle) * 44
    this.ring(mx, my, 8, 60, 0.35, pal, 4)
    if (this.save.settings.particles) this.sparks(mx, my, pal, 12, 260, Math.atan2(Math.cos(angle), Math.sin(angle)), 0.7)
    this.trauma = Math.min(1, this.trauma + 0.25)
    this.run.launchedOnce = true
    this.feel('bump')
    this.screen = 'drop'
    this.preview = []
    this.pending = { ...EMPTY }
  }

  private openLaboratory(matched = false): void {
    const recipe = matched && this.lastMachine ? copyRecipe(this.lastMachine)
      : practiceRecipe(this.labMachine, this.labSphere, this.labBuild, cleanSeed(this.draftSeed) || 'HELIXLAB')
    this.toHub()
    this.labMachine = recipeMachine(recipe)
    this.labSphere = recipe.ballId
    this.practice = { recipe, attempt: 0, best: null, previous: null, result: null, comparison: null }
    this.screen = 'laboratory'
    this.selectedPulse++
  }

  private configureLaboratory(): void {
    const session = this.practice
    if (!session) return
    this.toHub()
    this.practice = session
    this.screen = 'laboratory'
    this.selectedPulse++
  }

  private changePractice(): void {
    if (!this.practice || this.screen !== 'laboratory') return
    const seed = this.practice.recipe.seed
    this.practice = {
      recipe: practiceRecipe(this.labMachine, this.labSphere, this.labBuild, seed),
      attempt: 0, best: null, previous: null, result: null, comparison: null,
    }
    this.selectedPulse++
  }

  private startPractice(): void {
    const session = this.practice
    if (!session) return
    const p = session.recipe
    const node = { ...p.node }
    const profile = computeProfile(p.ballId, p.upgrades, p.relics)
    this.clearControls()
    session.attempt++
    session.result = null
    session.comparison = null
    this.run = {
      seed: p.seed, ballId: p.ballId, nodes: { [node.id]: node }, nodeId: node.id,
      upgrades: [...p.upgrades], relics: [...p.relics], gears: 0, score: 0,
      integrity: p.integrity, integrityMax: p.integrityMax, profile,
      drops: 0, bestCombo: 0, bestMult: profile.startMult, shatters: 0, portals: 0, jackpots: 0,
      flipGold: false, cleanDrop: false, bossWin: false, launchedOnce: false,
      depthTitle: node.title, boardNonce: p.boardNonce, reachedCore: false,
      mode: p.mode, rules: p.rules, ascension: p.ascension, loop: p.loop, clears: 0,
      catalogue: [], commissions: [], claimed: [], cleanDrops: 0, golds: 0, pegs: 0, visited: [node.id],
    }
    this.offers = []
    this.toast = null
    this.flash = ''
    this.resolveCopy = { title: 'Practice complete', sub: '' }
    this.sfx.resume()
    this.beginAim(node)
    this.selectedPulse++
  }

  private laboratoryStage(): StageModel {
    const session = this.practice
    if (!session) return { kind: 'none' }
    const p = session.recipe
    const machine = PRACTICE_MACHINES.find(m => m.id === this.labMachine) ?? PRACTICE_MACHINES[0]
    const loadout = [...p.relics.map(id => RELICS[id].name), ...p.upgrades.map(id => UPGRADES[id].name)]
    return {
      kind: 'laboratory', lab: {
        machines: PRACTICE_MACHINES.map(m => ({ ...m, selected: m.id === this.labMachine })),
        spheres: BALL_LIST.map(b => ({ id: b.id, name: b.name, selected: b.id === p.ballId })),
        builds: PRACTICE_BUILDS.map(b => ({ id: b.id, name: b.name, text: b.text, selected: !p.matched && b.id === this.labBuild })),
        seed: p.seed, matched: p.matched, title: p.node.title,
        description: p.matched
          ? `Your last machine: same board, ${p.integrity}/${p.integrityMax} starting shell, Trial ${p.ascension}, circuit ${p.loop + 1}, and ${loadout.length ? loadout.join(' + ') : 'stock sphere'}. Changing a selector starts a standard practice setup.`
          : machine.goal,
        attempt: session.attempt,
        best: session.best ? { earned: session.best.earned, combo: session.best.peakCombo, objective: session.best.objective ? `${session.best.objective.progress}/${session.best.objective.required} ${session.best.objective.name}` : session.best.title } : undefined,
      },
    }
  }

  private startRun(seed: string, ballId: string, mode: Run['mode'] = 'expedition', ascension = this.draftAscension, catalogue?: string[], rules: RulesVersion = CURRENT_RULES, shared = false): void {
    this.practice = null
    this.lastMachine = null
    this.questNews = []
    this.questRank = null
    const clean = cleanSeed(seed) || makeSeed()
    const ball = BALLS[ballId] ? ballId : 'rubber'
    const route = createRoute(rngFor(clean, 'route:0'), { ascension, rules })
    const profile = computeProfile(ball, [], [])
    // Shared and daily runs must reproduce on any profile, so they never use permanent upgrades.
    const pure = mode === 'daily' || shared || !this.save.chartOn
    const chart = pure ? NO_BONUS : chartBonuses(this.save.chart)
    this.run = {
      seed: clean,
      ballId: ball,
      nodes: route.nodes,
      nodeId: route.start,
      upgrades: [],
      relics: [],
      gears: chart.startGears,
      score: 0,
      integrity: profile.integrityMax,
      integrityMax: profile.integrityMax,
      profile,
      drops: 0,
      bestCombo: 0,
      bestMult: profile.startMult,
      shatters: 0,
      portals: 0,
      jackpots: 0,
      flipGold: false,
      cleanDrop: false,
      bossWin: false,
      launchedOnce: false,
      depthTitle: 'The Workshop',
      boardNonce: 0,
      reachedCore: false,
      mode, rules, ascension, loop: 0, clears: 0,
      catalogue: [...(catalogue ?? (mode === 'daily' ? RESEARCH_ORDER : this.save.researched))],
      commissions: commissionSet(clean), claimed: [], cleanDrops: 0, golds: 0, pegs: 0, visited: [],
      pure, overdrives: 0, guardians: 0,
    }
    this.recompute()
    this.run.integrity = this.run.integrityMax
    clearCheckpoint()
    this.suspended = null
    this.summary = null
    this.offers = []
    this.drop = null
    this.particles = []
    this.floaters = []
    this.openDraft('Choose the heart of your build')
  }

  private openDraft(title: string): void {
    const run = this.run
    if (!run) return
    this.drafting = true
    this.draftTitle = title
    const ball = ballById(run.ballId)
    this.offers = rollReward('relic', run.ballId, ball.primary, run.upgrades, run.relics, run.catalogue, run.seed, `draft:${run.loop}`, 3 + this.bonuses().draft)
    this.rememberOffers()
    if (!this.offers.length) { this.drafting = false; this.enterNode('workshop'); return }
    this.screen = 'choices'
    this.checkpoint()
  }

  private enterNode(id: string): void {
    const run = this.run
    if (!run) return
    const node = run.nodes[id]
    if (!node) return this.endRun(false)
    run.nodeId = id
    if (!run.visited.includes(id)) run.visited.push(id)
    run.depthTitle = node.title
    if (node.sector >= 1) this.learnLore('workshop')
    if (node.sector >= 2) this.learnLore('foundry')
    if (node.sector >= 3) this.learnLore('gravity')
    if (node.id === 'core') run.reachedCore = true
    if (node.kind === 'drop' || node.kind === 'boss') this.beginAim(node)
    else if (node.kind === 'fork') this.screen = 'fork'
    else if (node.kind === 'shop') {
      this.rerolls = 0
      this.offers = this.makeShop()
      this.rememberOffers()
      this.screen = 'shop'
    } else if (node.kind === 'repair') this.screen = 'repair'
    else if (node.kind === 'bargain') this.screen = 'bargain'
    else if (node.kind === 'event') this.screen = 'event'
    this.selectedPulse++
    this.checkpoint()
  }

  private beginAim(node: GameNode): void {
    const run = this.run
    if (!run) return
    // Guidance is contextual; board generation never depends on a player's save.
    const tutorial = false
    const board = createBoard({
      layout: node.layout,
      title: node.title,
      tutorial,
      rng: rngFor(run.seed, `board:${run.loop}:${node.id}:${run.boardNonce}`),
    })
    const anomaly = this.nodeAnomaly(node)
    if (anomaly) applyAnomaly(board, anomaly, 1 + run.loop * 0.15)
    if (run.ascension >= 1) for (const peg of board.pegs) if (peg.motion) peg.motion.amp *= 1.2
    if (run.ascension >= 12) for (const peg of board.pegs) if (peg.motion) peg.motion.amp *= 1.25
    if (run.ascension >= 4) board.gapWidth *= 0.84
    board.payout *= 1 + run.ascension * 0.1 + Math.min(10, run.loop) * 0.18
    if (run.ascension >= 13) board.payout *= 0.85
    board.payout *= 1 + this.bonuses().yield
    if (node.encounter) applyEncounter(board, node.encounter)
    this.recompute()
    for (const feature of this.practice ? [] : board.features) {
      if (!this.save.seenParts.includes(feature)) this.save.seenParts.push(feature)
    }
    this.drop = new Drop(board, run.ballId, run.profile, run.integrity, run.integrityMax)
    this.dress(this.drop, run.ballId)
    if (!this.practice) this.lastMachine = {
      seed: run.seed, ballId: run.ballId, node: { ...node }, upgrades: [...run.upgrades], relics: [...run.relics],
      integrity: run.integrity, integrityMax: run.integrityMax, ascension: run.ascension, loop: run.loop,
      boardNonce: run.boardNonce, rules: run.rules, mode: run.mode, matched: true,
    }
    this.popT = new Float32Array(board.pegs.length)
    this.cash = null
    this.rings = []
    this.floaters = []
    this.warp = 1
    this.zoomTarget = 1
    this.screen = 'aim'
    this.overview = false
    this.workshopNudged = false
    this.mouseAim = false
    this.keyboardAim = 0
    this.previewKey = Number.NaN
    this.preview = []
    this.snapCam = true
    this.particles = []
  }

  private finishDrop(): void {
    const run = this.run
    const drop = this.drop
    if (!run || !drop || this.screen !== 'drop') return
    if (this.practice) {
      const session = this.practice
      const report = describeDrop(drop)
      session.comparison = session.previous ? report.earned - session.previous.earned : null
      session.previous = report
      session.result = report
      if (!session.best || report.earned > session.best.earned) session.best = report
      drop.hitstop = 0
      this.cash = null
      this.toast = null
      this.clearControls()
      this.screen = 'practice-result'
      return
    }
    const node = run.nodes[run.nodeId]
    run.drops += 1
    run.integrity = Math.max(0, drop.integrity)
    run.shatters += drop.shatters
    run.portals += drop.portals
    run.golds += drop.golds
    run.pegs += drop.pegs
    if (drop.goldAfterFlip) run.flipGold = true
    if (drop.jackpot) run.jackpots += 1
    if (!drop.dead && drop.hazardThis === 0 && drop.captured && drop.captured !== 'hazard') { run.cleanDrop = true; run.cleanDrops++ }
    if (drop.wonBoss) { run.bossWin = true; run.clears++ }
    this.save.lifetime.pegs += drop.pegs
    this.save.lifetime.golds += drop.golds
    this.trackDrop(drop, run)
    const fulfilled = COMMISSIONS.filter(c => run.commissions.includes(c.id) && !run.claimed.includes(c.id) && run[c.stat] >= c.target)
    for (const commission of fulfilled) {
      run.claimed.push(commission.id)
      run.gears += commission.gears
      run.score += commission.gears
      if (!drop.dead) run.integrity = Math.min(run.integrityMax, run.integrity + 1)
    }
    drop.hitstop = 0
    const win = drop.wonBoss
    const boss = node.kind === 'boss'
    if (win && drop.jackpot) this.resolveCopy = { title: 'Jackpot', sub: 'The maw pays.' }
    else if (win && drop.captured === 'jackpot') this.resolveCopy = { title: 'The Grinder falls', sub: 'The maw was cold. The core is still broken.' }
    else if (win) this.resolveCopy = { title: 'The Grinder falls', sub: 'You broke the core and missed the maw.' }
    else if (boss) this.resolveCopy = { title: 'The Grinder keeps you', sub: `${drop.coreHits} of 5 hits.` }
    else if (drop.dead) this.resolveCopy = { title: 'The shell opens', sub: 'The fall ends.' }
    else if (drop.encounterComplete && drop.board.encounter) this.resolveCopy = { title: `${drop.board.encounter.name} linked`, sub: `+${drop.board.encounter.bounty} guardian gears earned · choose a relic` }
    else if (drop.board.encounter) this.resolveCopy.sub = `${drop.encounterProgress}/${drop.board.encounter.required} relays linked · the route continues`
    else this.resolveCopy = { title: this.resolveCopy.title || 'Settled', sub: [this.resolveCopy.sub, drop.hazardThis === 0 ? 'clean drop' : ''].filter(Boolean).join(' · ') }
    if (fulfilled.length) this.resolveCopy.sub += ` · Commission complete: ${fulfilled.map(c => `${c.name} (+${c.gears} gears${drop.dead ? '' : ', mend 1 shell'})`).join(', ')}`
    this.screen = 'resolve'
    const lit = drop.litOrder.filter((i) => !drop.gone[i])
    const step = clamp(0.95 / Math.max(1, lit.length), 0.022, 0.07)
    this.cash = { order: lit, next: 0, t: -0.18, step }
    this.resolveT = Math.max(drop.jackpot || win ? 1.6 : 1, lit.length * step + 0.75)
    this.toast = null
  }

  private skipResolve(): void {
    if (this.screen !== 'resolve' || !this.run || !this.drop) return
    this.finishCash()
    const node = this.run.nodes[this.run.nodeId]
    const win = this.drop.wonBoss
    const failed = this.drop.dead || (node.kind === 'boss' && !win)
    if (win && !this.drop.dead) { this.screen = 'victory'; this.checkpoint() }
    else if (win || failed || node.kind === 'boss') this.endRun(win)
    else if (this.drop.encounterComplete) this.openReward('relic')
    else if (node.reward) this.openReward(node.reward)
    else this.advance()
  }

  private openReward(kind: 'upgrade' | 'relic'): void {
    const run = this.run
    if (!run) return
    const ball = ballById(run.ballId)
    this.drafting = false
    this.offers = rollReward(kind, run.ballId, ball.primary, run.upgrades, run.relics, run.catalogue, run.seed, `reward:${run.loop}:${run.nodeId}`)
    this.rememberOffers()
    if (!this.offers.length) {
      this.advance()
      return
    }
    this.screen = 'choices'
    this.checkpoint()
  }

  private advance(): void {
    const run = this.run
    if (!run) return
    const next = run.nodes[run.nodeId]?.next
    if (!next) this.endRun(false)
    else this.enterNode(next)
  }

  private pick(index: number): void {
    const offer = this.offers[index]
    const run = this.run
    if (!offer || !run || this.screen !== 'choices') return
    this.sfx.ui()
    if (offer.kind === 'upgrade') run.upgrades.push(offer.id)
    else run.relics.push(offer.id)
    this.feel('gold')
    this.recompute()
    if (this.drafting) { this.drafting = false; this.enterNode('workshop') }
    else this.advance()
  }

  private buy(index: number): void {
    const offer = this.offers[index]
    const run = this.run
    if (!offer || !run || this.screen !== 'shop') return
    if (run.gears < offer.price) return
    this.sfx.ui()
    run.gears -= offer.price
    if (offer.kind === 'upgrade') run.upgrades.push(offer.id)
    else run.relics.push(offer.id)
    this.offers.splice(index, 1)
    this.recompute()
    this.selectedPulse++
    this.checkpoint()
  }

  private fork(index: number): void {
    if (this.screen !== 'fork') return
    const run = this.run
    const option = run?.nodes[run.nodeId]?.options?.[index]
    if (!option) return
    this.sfx.ui()
    this.enterNode(option.next)
  }

  private bargain(which: 'shell' | 'pay' | 'walk'): void {
    const run = this.run
    if (!run || this.screen !== 'bargain') return
    this.sfx.ui()
    if (which === 'shell') {
      if (run.integrity <= 1) return
      run.integrity -= 1
      const relic = randomFrom('relic', run.ballId, run.upgrades, run.relics, run.catalogue, run.seed, `bargain-relic:${run.loop}:${run.nodeId}`)
      if (relic) {
        run.relics.push(relic.id)
        this.recompute()
        this.say(relic.name, 'The bargain keeps its word.', 1.4, true)
      } else {
        run.gears += 28
        this.say('Empty hands', 'No new relic. The machine pays scrap.', 1.2, false)
      }
    } else if (which === 'pay') {
      if (run.gears < 30) return
      run.gears -= 30
      const up = randomFrom('upgrade', run.ballId, run.upgrades, run.relics, run.catalogue, run.seed, `bargain-up:${run.loop}:${run.nodeId}`)
      if (up) {
        run.upgrades.push(up.id)
        this.recompute()
        this.say(up.name, 'Installed without asking.', 1.3, false)
      } else run.gears += 30
    } else {
      run.gears += 18
    }
    this.advance()
  }

  private repair(): void {
    if (this.screen !== 'repair') return
    const run = this.run
    if (!run) return
    if (run.integrity < run.integrityMax) {
      const amount = this.repairAmount()
      run.integrity = Math.min(run.integrityMax, run.integrity + amount)
      this.say('Mended', amount >= 99 ? 'The next act begins with a whole shell.' : `Restore up to ${amount} shell.`, 1, false)
    } else {
      run.gears += 12
      this.say('Already whole', 'You pocket 12 gears of scrap.', 1, false)
    }
    this.sfx.ui()
    this.advance()
  }

  private repairAmount(): number {
    const run = this.run
    const amount = run?.nodes[run.nodeId]?.repairAmount ?? 1
    return run && run.ascension >= 9 && amount >= 99 ? 2 : amount
  }

  private recompute(): void {
    const run = this.run
    if (!run) return
    const prev = run.integrityMax
    run.profile = computeProfile(run.ballId, run.upgrades, run.relics)
    // Endless pressure: circuits keep getting harder in small, announced steps.
    run.profile.gravityScale *= Math.min(1.5, 1 + Math.min(6, run.loop) * 0.035 + Math.max(0, run.loop - 6) * 0.02)
    const chart = this.bonuses()
    run.profile.maxNudges += chart.nudge
    run.profile.integrityMax += chart.shell
    run.profile.comboWindow += chart.combo
    run.profile.pegsToCharge -= chart.reactor
    if (run.ascension >= 2) run.profile.maxNudges = Math.max(1, run.profile.maxNudges - 1)
    if (run.ascension >= 5) run.profile.integrityMax = Math.max(1, run.profile.integrityMax - 1)
    if (run.ascension >= 7) run.profile.comboWindow = Math.max(0.6, run.profile.comboWindow - 0.15)
    if (run.ascension >= 8) run.profile.gravityScale *= 1.06
    if (run.ascension >= 10) run.profile.overdriveMax = 1
    if (run.ascension >= 14) run.profile.maxNudges = Math.max(1, run.profile.maxNudges - 1)
    if (run.ascension >= 15) run.profile.integrityMax = Math.max(1, run.profile.integrityMax - 1)
    if (run.loop >= 3) run.profile.integrityMax = Math.max(1, run.profile.integrityMax - 1)
    if (run.loop >= 6) run.profile.maxNudges = Math.max(1, run.profile.maxNudges - 1)
    if (run.loop >= 9) run.profile.overdriveMax = Math.min(run.profile.overdriveMax, 1)
    const delta = run.profile.integrityMax - prev
    run.integrityMax = run.profile.integrityMax
    run.integrity = clamp(run.integrity + delta, 1, run.integrityMax)
  }

  private endRun(win: boolean): void {
    if (this.practice) return this.configureLaboratory()
    const run = this.run
    if (!run) return this.toHub()
    if (!run.launchedOnce) return this.toHub()
    if (win) this.learnLore('grinder')
    const gained = Math.round((shardsFor(run.score, run.drops, win) + run.claimed.length * 4 + Math.max(0, run.clears - 1) * 8) * (1 + this.bonuses().shards))
    this.save.shards += gained
    this.save.runs += 1
    const beforeBest = this.save.bestScore
    if (run.score > this.save.bestScore) this.save.bestScore = run.score
    this.save.bestCombo = Math.max(this.save.bestCombo, run.bestCombo)
    this.save.bestMult = Math.max(this.save.bestMult, run.bestMult)
    this.save.lifetime.shatters += run.shatters
    this.save.lifetime.jackpots += run.jackpots
    this.save.lifetime.portals += run.portals
    const record: RunRecord = {
      seed: run.seed, ballId: run.ballId, mode: run.mode, ascension: run.ascension,
      score: run.score, drops: run.drops, clears: run.clears, win,
      combo: run.bestCombo, relics: [...run.relics], upgrades: [...run.upgrades],
      date: new Date().toISOString(), catalogue: [...run.catalogue], rules: run.rules,
    }
    this.save.history = [record, ...this.save.history].slice(0, 20)
    const mastered = this.save.mastery[run.ballId] ?? 0
    const earnedTrial = run.clears > 0 && run.mode === 'expedition' && run.ascension === mastered && mastered < MAX_TRIAL
    if (earnedTrial) this.save.mastery[run.ballId] = mastered + 1
    if (run.mode === 'daily') {
      const rawDate = run.seed.slice(3)
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      const key = run.rules === 2 ? date : `${date}@${run.rules}`
      this.save.dailyBest[key] = Math.max(this.save.dailyBest[key] ?? 0, run.score)
    }
    clearCheckpoint()
    this.suspended = null
    const awakened: string[] = []
    if (!this.save.balls.includes('prism')) {
      this.save.balls.push('prism')
      awakened.push('Prism Core')
    }
    if (!this.save.balls.includes('void') && (run.reachedCore || this.save.runs >= 2)) {
      this.save.balls.push('void')
      awakened.push('Void Marble')
    }
    const challenges = grantChallenges(this.save, {
      bestCombo: run.bestCombo,
      bestMult: run.bestMult,
      cleanDrop: run.cleanDrop,
      bossWin: run.bossWin,
      shatters: run.shatters,
      portals: run.portals,
      score: run.score,
      flipGold: run.flipGold,
      jackpots: run.jackpots,
      ballId: run.ballId,
    })
    const progress = this.grantProgress(run, win)
    const next = this.nextSchematic()
    this.summary = {
      progress,
      heading: win ? 'The Grinder falls' : 'Run complete',
      line: win
        ? this.drop?.dead ? 'The core broke. The shell did not survive the landing.' : 'The Helix is quieter for a moment.'
        : run.integrity > 0
          ? `The sphere left the machine. The shell is still ${run.integrity >= run.integrityMax ? 'whole' : 'holding'}.`
          : 'The shell gives out. The machine keeps the rest.',
      score: run.score,
      best: run.score > beforeBest && run.score > 0,
      gears: run.gears,
      mult: formatMult(run.bestMult),
      combo: run.bestCombo,
      depth: run.depthTitle,
      shards: gained + challenges.length * TUNING.challengeShards,
      awakened,
      challenges,
      temptation: this.temptation(awakened, next),
      canStudy: !!next && this.save.shards >= this.researchCost(),
      studyLabel: next ? `Study · ${next.lockHint}` : '',
      seed: run.seed,
      ballId: run.ballId,
      catalogue: [...run.catalogue],
      rules: run.rules,
      mode: run.mode, ascension: run.ascension, clears: run.clears,
      commissions: run.claimed.length,
      debrief: this.drop && (this.drop.captured || this.drop.dead) ? describeDrop(this.drop) : undefined,
    }
    if (earnedTrial && this.summary) this.summary.awakened.push(`Trial ${mastered + 1} for ${ballById(run.ballId).name}`)
    this.screen = 'runend'
    this.save.ball = run.ballId
    writeSave(this.save)
  }

  private temptation(awakened: string[], next: { lockHint: string } | null): string {
    if (awakened.length) return 'A new sphere is waiting in the hub.'
    if (next && this.save.shards >= this.researchCost()) return `A schematic is ready — ${next.lockHint}.`
    if (next) return `${this.save.shards}/${this.researchCost()} shards toward ${next.lockHint}.`
    const trail = TRAILS.find((t) => !this.save.trails.includes(t.id))
    if (trail && this.save.shards >= TUNING.trailCost) return `The archive can cast a ${trail.name.toLowerCase()}.`
    return 'The next seed will not rebuild this machine.'
  }

  private nextSchematic(): { id: string; lockHint: string; name: string; text: string; tags: string[] } | null {
    const id = RESEARCH_ORDER.find((relic) => !this.save.researched.includes(relic))
    if (!id) return null
    const relic = RELICS[id]
    return relic ? { id, lockHint: relic.lockHint, name: relic.name, text: relic.text, tags: relic.tags } : null
  }

  private study(): void {
    const next = this.nextSchematic()
    if (next && this.save.shards >= this.researchCost()) {
      this.save.shards -= this.researchCost()
      this.save.researched.push(next.id)
      this.reveal = { name: next.name, text: next.text, tags: next.tags.join(' · ') }
      this.returnTo = this.screen
      this.screen = 'reveal'
      writeSave(this.save)
      this.sfx.gold(4)
      return
    }
    const trail = TRAILS.find((t) => !this.save.trails.includes(t.id))
    if (!next && trail && this.save.shards >= TUNING.trailCost) {
      this.save.shards -= TUNING.trailCost
      this.save.trails.push(trail.id)
      this.save.trail = trail.id
      this.reveal = { name: trail.name, text: 'A cosmetic wake. The sphere falls the same. It only looks like you meant it.', tags: 'cosmetic' }
      this.returnTo = this.screen
      this.screen = 'reveal'
      writeSave(this.save)
    }
  }

  private toHub(): void {
    this.refreshQuests()
    this.practice = null
    this.clearControls()
    this.screen = 'hub'
    this.run = null
    this.drop = null
    this.popT = null
    this.cash = null
    this.rings = []
    this.particles = []
    this.floaters = []
    this.warp = 1
    this.returnTo = 'hub'
    this.spawnDemo()
    this.snapCam = true
  }

  /** Starts fresh quest books when the UTC day or week turns over. Nothing is lost by skipping days. */
  private refreshQuests(): void {
    const day = dayKey()
    const week = weekKey()
    if (this.save.daily.key !== day) this.save.daily = { key: day, progress: {}, claimed: [] }
    if (this.save.weekly.key !== week) this.save.weekly = { key: week, progress: {}, claimed: [] }
  }

  /** Every surviving or failed machine advances quests and lifetime counters. Practice never does. */
  private trackDrop(drop: Drop, run: Run): void {
    if (this.practice) return
    const survived = !drop.dead && drop.captured !== null
    const node = run.nodes[run.nodeId]
    run.overdrives = (run.overdrives ?? 0) + drop.overdriveUses
    if (drop.encounterComplete) run.guardians = (run.guardians ?? 0) + 1
    this.save.lifetime.overdrives += drop.overdriveUses
    if (drop.encounterComplete) this.save.lifetime.guardians += 1
    if (survived && node?.kind !== 'boss') this.save.lifetime.machines += 1
    if (drop.wonBoss) { this.save.lifetime.wins += 1; this.save.lifetime.machines += 1 }
    const delta: Partial<Record<QuestStat, number>> = {
      pegs: drop.pegs, golds: drop.golds, combo: drop.peakCombo,
      machines: (survived && node?.kind !== 'boss') || drop.wonBoss ? 1 : 0,
      jackpots: drop.jackpot ? 1 : 0, overdrives: drop.overdriveUses,
      guardians: drop.encounterComplete ? 1 : 0,
      clean: !drop.dead && drop.hazardThis === 0 && drop.captured && drop.captured !== 'hazard' ? 1 : 0,
      shatters: drop.shatters, wins: drop.wonBoss ? 1 : 0,
      gears: Math.max(0, drop.earned), nudges: drop.nudgeUses,
    }
    this.refreshQuests()
    const finished: { q: QuestDef; weekly: boolean }[] = [
      ...advanceQuests(this.save.daily, questDefs('daily', this.save.daily.key), delta).map(q => ({ q, weekly: false })),
      ...advanceQuests(this.save.weekly, questDefs('weekly', this.save.weekly.key), delta).map(q => ({ q, weekly: true })),
    ]
    for (const { q, weekly } of finished) {
      const reward = weekly ? WEEKLY_QUEST_REWARD : DAILY_QUEST_REWARD
      this.save.stardust += reward.dust
      this.questRank ??= { level: this.save.level, xp: this.save.xp, dust: 0 }
      this.questRank.dust += this.grantRankXp(reward.xp).reduce((sum, level) => sum + rankReward(level), 0)
      this.questNews.push(`${weekly ? 'Weekly' : 'Daily'} quest · ${q.text} · +${reward.dust} stardust`)
    }
    if (finished.length) {
      this.say('Quest complete', this.questNews[this.questNews.length - 1].replace(/^(Daily|Weekly) quest · /, ''), 1.8, false)
      this.sfx.gold(5)
      this.feel('level')
    }
  }

  private grantRankXp(amount: number): number[] {
    const state = { level: this.save.level, xp: this.save.xp }
    const levels = addXp(state, amount, rankXp)
    this.save.level = state.level
    this.save.xp = state.xp
    for (const level of levels) this.save.stardust += rankReward(level)
    return levels
  }

  /** Claims every feat tier the lifetime record already satisfies. */
  private claimFeats(): { name: string; dust: number }[] {
    const values: Record<string, number> = {
      pegs: this.save.lifetime.pegs, golds: this.save.lifetime.golds, machines: this.save.lifetime.machines,
      runs: this.save.runs, wins: this.save.lifetime.wins, jackpots: this.save.lifetime.jackpots,
      overdrives: this.save.lifetime.overdrives, guardians: this.save.lifetime.guardians,
      combo: this.save.bestCombo, score: this.save.bestScore,
      depth: Math.max(0, ...Object.values(this.save.deepest)),
    }
    const out: { name: string; dust: number }[] = []
    for (const def of FEATS) {
      const claimed = this.save.feats[def.id] ?? 0
      const p = featProgress(def, values[def.id] ?? 0, claimed)
      for (let tier = claimed; tier < p.tier; tier++) {
        const dust = featReward(tier)
        this.save.stardust += dust
        out.push({ name: `${def.name} ${toRomanTier(tier + 1)}`, dust })
      }
      if (p.tier > claimed) this.save.feats[def.id] = p.tier
    }
    return out
  }

  /** XP, stardust, mastery, depth bounties, feats, and win stickers for a finished expedition. */
  private grantProgress(run: Run, win: boolean): ProgressModel {
    const chart = this.bonuses()
    const outcome = { score: run.score, machines: run.drops, win, clears: run.clears, pure: !!run.pure, trial: run.ascension }
    const dust = stardustFor(outcome, chart.resonance)
    const xp = xpFor(outcome, chart.insight)
    // Quests pay the moment they complete, so a level gained mid-run still belongs to this debrief.
    const before = this.questRank ?? { level: this.save.level, xp: this.save.xp, dust: 0 }
    this.questRank = null
    const levels = this.grantRankXp(xp)
    const levelDust = before.dust + levels.reduce((sum, level) => sum + rankReward(level), 0)
    this.save.stardust += dust
    // Sphere mastery uses the same XP. Finishes unlock at fixed mastery levels.
    const sphere = this.save.sphereLevels[run.ballId] ?? { level: 1, xp: 0 }
    const sphereBefore = sphere.level
    const sphereLevels = addXp(sphere, xp, masteryXp)
    this.save.sphereLevels[run.ballId] = sphere
    const finishes = (FINISHES[run.ballId] ?? []).filter(f => f.level > sphereBefore && f.level <= sphere.level).map(f => f.name)
    // A new endless depth pays once per sphere, so repeating shallow circuits cannot farm it.
    let depth = 0
    const deepest = this.save.deepest[run.ballId] ?? 0
    if (run.clears > deepest && run.mode === 'expedition') {
      for (let d = deepest + 1; d <= run.clears; d++) depth += depthBounty(d)
      this.save.deepest[run.ballId] = run.clears
      this.save.stardust += depth
    }
    if (win || run.clears > 0) {
      for (const id of [...run.relics, ...run.upgrades]) this.save.stickers[id] = Math.max(this.save.stickers[id] ?? 0, run.ascension + 1)
    }
    const feats = this.claimFeats()
    const news = [...this.questNews]
    this.questNews = []
    return {
      xp, dust, levelDust, depthDust: depth, depthRecord: depth ? run.clears : 0,
      levelBefore: before.level, levelAfter: this.save.level,
      xpBefore: before.xp / rankXp(before.level), xpAfter: this.save.xp / rankXp(this.save.level),
      title: rankTitle(this.save.level),
      sphere: ballById(run.ballId).name, sphereLevel: sphere.level, sphereUp: sphereLevels.length > 0, finishes,
      feats: feats.map(f => `${f.name} · +${f.dust}`), quests: news, pure: !!run.pure,
      stardust: this.save.stardust,
    }
  }

  private buyStar(id: string): void {
    const node = starNode(id)
    if (!node) return
    const level = this.save.chart[id] ?? 0
    if (level >= node.max) return
    const cost = starCost(node, level)
    if (this.save.stardust < cost) return
    this.save.stardust -= cost
    this.save.chart[id] = level + 1
    writeSave(this.save)
    this.sfx.gold(3)
    this.feel('gold')
    this.selectedPulse++
  }

  private learnLore(id: string): void {
    if (!this.save.lore.includes(id) && LORE[id]) this.save.lore.push(id)
  }

  private makeShop(): Offer[] {
    const run = this.run
    if (!run) return []
    const ball = ballById(run.ballId)
    const act = run.nodes[run.nodeId]?.sector ?? 1
    return rollShop(run.ballId, ball.primary, run.upgrades, run.relics, run.catalogue, run.seed, `shop:${run.loop}:${run.nodeId}:${this.rerolls}`).map(o => ({ ...o, price: Math.round(o.price * (1 + (act - 1) * 1.1) * (run.ascension >= 3 ? 1.25 : 1) * (run.ascension >= 11 ? 1.2 : 1) * (1 + Math.min(10, run.loop) * 0.12) * (1 - this.bonuses().discount)) }))
  }

  private continueCircuit(): void {
    const run = this.run
    if (!run || this.screen !== 'victory') return
    run.loop++
    const route = createRoute(rngFor(run.seed, `route:${run.loop}`), { loop: run.loop, ascension: run.ascension, rules: run.rules })
    run.nodes = route.nodes
    run.nodeId = route.start
    run.visited = []
    run.integrity = run.integrityMax
    this.drop = null
    this.openDraft(`Circuit ${run.loop + 1} · keep your build, choose a new relic`)
  }

  /** What the next circuit adds, so the push-your-luck choice is explicit. */
  private nextPressure(): string {
    const next = (this.run?.loop ?? 0) + 1
    const bits = ['stronger gravity', 'more anomalies', 'richer payouts', 'dearer shops']
    if (next === 3) bits.unshift('one less maximum shell')
    if (next === 6) bits.unshift('one fewer nudge')
    if (next === 9) bits.unshift('a single Overdrive per machine')
    return bits.join(' · ')
  }

  private maxRerolls(): number { return 2 + this.bonuses().rerolls }
  private rerollCost(): number { return this.rerolls < this.bonuses().rerolls ? 0 : TUNING.shopReroll }

  private shopRepairCost(): number {
    return Math.round(35 * (this.run?.nodes[this.run.nodeId]?.sector ?? 1) * (1 - this.bonuses().repair))
  }

  private eventModel(): { title: string; story: string; cards: ChoiceCard[] } {
    const run = this.run!
    const event = run.nodes[run.nodeId].eventId
    const relic = randomFrom('relic', run.ballId, run.upgrades, run.relics, run.catalogue, run.seed, `event:${run.loop}:${run.nodeId}:relic`)
    const upgrade = randomFrom('upgrade', run.ballId, run.upgrades, run.relics, run.catalogue, run.seed, `event:${run.loop}:${run.nodeId}:upgrade`)
    let title = 'The Salvage Bell'
    let story = 'A stranded mechanic offers you a choice from the wreckage.'
    let choices: { name: string; text: string; afford: boolean; tags: string }[]
    if (event === 'resonance') {
      title = 'The Resonance Chamber'
      story = 'The machine can copy a heartbeat. It asks for a little of yours.'
      choices = [
        { name: relic?.name ?? 'A hollow echo', text: relic ? `Lose 1 shell. Gain ${relic.name}: ${relic.text}` : 'No relics remain. Take 60 gears instead.', afford: !relic || run.integrity > 1, tags: 'Risk · relic' },
        { name: upgrade?.name ?? 'Spare components', text: upgrade ? `Install ${upgrade.name} for free. ${upgrade.text}` : 'All upgrades installed. Take 40 gears.', afford: true, tags: 'Upgrade' },
        { name: 'Quiet the chamber', text: 'Restore 1 shell and take 15 gears.', afford: true, tags: 'Recovery' },
      ]
    } else if (event === 'oracle') {
      title = 'The Blind Astrolabe'
      story = 'Three futures orbit a lens. Only the one you choose becomes real.'
      choices = [
      { name: relic?.name ?? 'The empty shelf', text: relic ? `Pay 50 gears. Gain ${relic.name}: ${relic.text}` : 'No relics remain. Take 60 gears.', afford: !relic || run.gears >= 50, tags: '50 gears · relic' },
        { name: 'A gentler future', text: 'Pay 20 gears to restore 2 shell.', afford: run.gears >= 20 && run.integrity < run.integrityMax, tags: '20 gears · recovery' },
        { name: 'Cast the brass die', text: 'Take 18 gears, with a 1 in 4 chance of 110 gears instead. The seed fixes the outcome.', afford: true, tags: 'Fortune' },
      ]
    } else {
      choices = [
        { name: 'Patch the shell', text: 'Restore 2 shell. If already whole, take 20 gears.', afford: true, tags: 'Recovery' },
        { name: upgrade?.name ?? 'Useful scrap', text: upgrade ? `Pay 20 gears. Install ${upgrade.name}: ${upgrade.text}` : 'All upgrades installed. Take 40 gears.', afford: !upgrade || run.gears >= 20, tags: '20 gears · upgrade' },
        { name: 'Sell the wreckage', text: 'Take 70 gears for the next shop.', afford: true, tags: 'Economy' },
      ]
    }
    return { title, story, cards: choices.map((c, index) => ({ ...c, synergy: '', price: 0, index })) }
  }

  private chooseEvent(index: number): void {
    const run = this.run
    if (!run || this.screen !== 'event' || !this.eventModel().cards[index]?.afford) return
    const event = run.nodes[run.nodeId].eventId
    const gift = (kind: 'upgrade' | 'relic') => {
      const offer = randomFrom(kind, run.ballId, run.upgrades, run.relics, run.catalogue, run.seed, `event:${run.loop}:${run.nodeId}:${kind}`)
      if (offer) {
        if (kind === 'upgrade') run.upgrades.push(offer.id)
        else { run.relics.push(offer.id); if (!this.save.seenRelics.includes(offer.id)) this.save.seenRelics.push(offer.id) }
        this.recompute()
        this.say(offer.name, 'A different future takes shape.', 1.4, false)
      } else run.gears += kind === 'relic' ? 60 : 40
      return !!offer
    }
    const heal = (amount: number) => { run.integrity = Math.min(run.integrityMax, run.integrity + amount) }
    if (event === 'resonance') {
      if (index === 0) { if (gift('relic')) run.integrity = Math.max(1, run.integrity - 1) }
      else if (index === 1) gift('upgrade')
      else { heal(1); run.gears += 15 }
    } else if (event === 'oracle') {
      if (index === 0) { if (gift('relic')) run.gears -= 50 }
      else if (index === 1) { run.gears -= 20; heal(2) }
      else run.gears += rngFor(run.seed, `oracle:${run.loop}:${run.nodeId}`)() < 0.25 ? 110 : 18
    } else {
      if (index === 0) { if (run.integrity === run.integrityMax) run.gears += 20; else heal(2) }
      else if (index === 1) { if (gift('upgrade')) run.gears -= 20 }
      else run.gears += 70
    }
    this.sfx.ui()
    this.advance()
  }

  /** Save at decision boundaries. A reload during a drop restarts that machine. */
  private checkpoint(): void {
    if (this.practice || !this.run || !CHECKPOINT_SCREENS.includes(this.screen)) return
    const { nodes: _nodes, profile: _profile, ...run } = this.run
    const data = { version: 2, run, screen: this.screen, offers: this.offers, rerolls: this.rerolls, drafting: this.drafting, draftTitle: this.draftTitle }
    writeCheckpoint(data)
    this.suspended = data
    writeSave(this.save)
  }

  private resumeExpedition(): void {
    this.practice = null
    // Hub notices (a save confirmation, a replace prompt) do not belong over the resumed machine.
    this.toast = null
    this.toastT = 0
    const data = this.suspended as { version: number; run: Omit<Run, 'nodes' | 'profile'>; screen: string; offers: Offer[]; rerolls: number; drafting: boolean; draftTitle: string } | null
    try {
      if (!data || data.version !== 2 || !data.run || !CHECKPOINT_SCREENS.includes(data.screen)) throw new Error('checkpoint')
      const r = data.run
      if (r.rules !== undefined && r.rules !== 2 && r.rules !== 3) throw new Error('rules')
      const rules: RulesVersion = r.rules ?? 2
      if (!BALLS[r.ballId] || !r.seed || cleanSeed(r.seed) !== r.seed || !['expedition', 'daily'].includes(r.mode)) throw new Error('identity')
      for (const key of ['gears', 'score', 'integrity', 'integrityMax', 'drops', 'bestCombo', 'bestMult', 'shatters', 'portals', 'jackpots', 'boardNonce', 'ascension', 'loop', 'clears', 'cleanDrops', 'golds', 'pegs'] as const) if (!Number.isFinite(r[key]) || r[key] < 0) throw new Error('counters')
      if (r.ascension > MAX_TRIAL || r.integrity < 1 || r.loop > 10000 || r.clears > r.loop + 1) throw new Error('limits')
      for (const key of ['upgrades', 'relics', 'catalogue', 'commissions', 'claimed', 'visited'] as const) if (!Array.isArray(r[key]) || r[key].some(v => typeof v !== 'string') || r[key].length > 200) throw new Error('inventory')
      if (r.relics.some(id => !RELICS[id]) || r.upgrades.some(id => !UPGRADES[id])) throw new Error('catalogue')
      const route = createRoute(rngFor(r.seed, `route:${r.loop}`), { loop: r.loop, ascension: r.ascension, rules })
      if (!route.nodes[r.nodeId]) throw new Error('route')
      this.run = { ...r, rules, nodes: route.nodes, profile: computeProfile(r.ballId, r.upgrades, r.relics) }
      this.recompute()
      this.drafting = !!data.drafting
      this.draftTitle = String(data.draftTitle || '')
      this.rerolls = clamp(Number(data.rerolls) || 0, 0, this.maxRerolls())
      this.offers = Array.isArray(data.offers) ? data.offers.filter(o => o && (o.kind === 'relic' ? RELICS[o.id] : UPGRADES[o.id]) && typeof o.name === 'string' && typeof o.text === 'string' && Array.isArray(o.tags) && Number.isFinite(o.price)) : []
      if (data.screen === 'aim') this.beginAim(route.nodes[r.nodeId])
      else { this.drop = null; this.screen = data.screen }
      this.selectedPulse++
    } catch {
      this.run = null; this.suspended = null; clearCheckpoint()
      this.screen = 'hub'
      this.say('This expedition could not be restored', 'Your archive is safe. Begin a new descent.', 2, false)
    }
  }

  private rememberOffers(): void {
    for (const offer of this.offers) {
      if (offer.kind === 'relic' && !this.save.seenRelics.includes(offer.id)) this.save.seenRelics.push(offer.id)
    }
  }

  private drain(silent: boolean): void {
    const drop = this.drop
    const run = this.run
    if (!drop || !run) return
    for (const e of drop.pullEvents()) {
      if (e.type === 'nudge' && run.nodeId === 'workshop') this.workshopNudged = true
      if (e.gears) {
        run.gears += e.gears
        run.score += e.gears
      }
      if (e.combo) run.bestCombo = Math.max(run.bestCombo, e.combo)
      if (e.mult) run.bestMult = Math.max(run.bestMult, this.drop?.mult ?? e.mult)
      if (e.type === 'pocket' || e.type === 'jackpot') {
        this.resolveCopy = { title: e.text || 'Settled', sub: e.gears ? `+${e.gears} gears` : '' }
      }
      // Relay contacts have their own musical cue rather than two stacked hits.
      const relayBumper = e.type === 'bumper' && drop.board.bumpers.some(b => b.relay != null && b.x === e.x && b.y === e.y)
      if (!silent && !relayBumper) this.react(e)
    }
    run.integrity = drop.integrity
  }

  private react(e: { type: string; x: number; y: number; text?: string; gears?: number; big?: boolean; combo?: number; mult?: number }): void {
    const big = !!e.big
    const pal = e.type.startsWith('overdrive') ? '#80ffe0' : e.type === 'hazard' || e.type === 'shatter-ball' ? '#ff6b5a' : e.type === 'gold' || e.type === 'jackpot' || e.type === 'crit' ? '#ffd56a' : '#f4efe4'
    const accent = this.drop?.ballDef.accent ?? '#7ee0c6'
    const fx = this.save.settings.particles && !this.motionQuery.matches
    const arc = e.type === 'crit' && e.text === 'CHAIN LIGHTNING'
    const relayEvent = e.type.startsWith('relay-') || e.type === 'encounter-clear' || e.type === 'recirculate'
    if (e.type === 'overdrive-start') this.floaters = this.floaters.filter(f => (f.size ?? 18) <= 22)
    if (e.text && !e.type.startsWith('overdrive') && !relayEvent && !arc && (e.gears || big || e.type === 'refund' || e.type === 'special')) {
      const size = e.type === 'jackpot' ? 40 : big ? 28 : e.type === 'gold' ? 22 : e.gears && e.gears >= 20 ? 21 : 17
      this.addFeedback(e, e.text, pal, size, big || e.type === 'refund' || e.type === 'special')
    }
    if (e.type === 'mult' && e.mult) {
      this.addFeedback(e, formatMult(e.mult), '#ffd56a', 15)
    }
    if (e.type === 'combo' && e.combo && COMBO_CALLS[e.combo]) {
      this.ring(e.x, e.y, 16, 120, 0.5, accent, 5)
      this.sfx.combo(e.combo)
    }
    if (fx) {
      if (e.type === 'relay-hit' || e.type === 'encounter-clear') {
        this.ring(e.x, e.y, 24, e.type === 'encounter-clear' ? 115 : 72, 0.45, '#f0cc7e', 4)
      } else if (e.type === 'overdrive-start') {
        this.ring(e.x, e.y, 16, 230, 0.65, '#80ffe0', 7)
        this.ring(e.x, e.y, 8, 130, 0.45, '#f5ffed', 3)
        this.sparks(e.x, e.y, '#80ffe0', 22, 330, -Math.PI / 2, 1.2)
      } else if (e.type === 'overdrive-ready') {
        this.ring(e.x, e.y, 14, 60, 0.45, '#80ffe0', 3)
      } else if (e.type === 'peg' || e.type === 'spring') {
        this.ring(e.x, e.y, 10, 30, 0.28, accent, 3)
        this.sparks(e.x, e.y, pal, 5, 170)
      } else if (e.type === 'gold') {
        this.ring(e.x, e.y, 10, 46, 0.38, '#ffd56a', 4)
        this.sparks(e.x, e.y, '#ffd56a', 12, 240)
      } else if (e.type === 'bumper' || e.type === 'echo' || e.type === 'seal') {
        this.ring(e.x, e.y, 28, 96, 0.4, '#e0b07a', 6)
        this.sparks(e.x, e.y, '#ffe2b8', 14, 300)
      } else if (e.type === 'shatter') {
        this.sparks(e.x, e.y, '#ffffff', 18, 320)
        this.burst(e.x, e.y, '#f4efe4', 10, 120)
      } else if (e.type === 'hazard' || e.type === 'shatter-ball') {
        this.ring(e.x, e.y, 14, 110, 0.5, '#ff6b5a', 6)
        this.sparks(e.x, e.y, '#ff6b5a', 20, 320)
      } else if (e.type === 'jackpot') {
        this.ring(e.x, e.y, 20, 420, 0.9, '#ffd56a', 10)
        this.ring(e.x, e.y, 10, 240, 0.7, '#ffffff', 5)
        this.sparks(e.x, e.y, '#ffd56a', 48, 620, -Math.PI / 2, 1.1)
        this.burst(e.x, e.y, '#fff6d0', 24, 260)
      } else if (e.type === 'pocket') {
        const color = e.gears ? '#ffd56a' : '#ff6b5a'
        this.ring(e.x, e.y, 14, big ? 200 : 120, 0.55, color, 5)
        this.sparks(e.x, e.y, color, big ? 26 : 14, big ? 460 : 300, -Math.PI / 2, 1)
      } else if (e.type === 'core') {
        this.ring(e.x, e.y, 36, 160, 0.5, '#e6f27a', 7)
        this.sparks(e.x, e.y, '#e6f27a', 20, 380)
      } else if (e.type === 'portal' || e.type === 'crit' || e.type === 'maw') {
        this.ring(e.x, e.y, 10, 90, 0.45, e.type === 'crit' ? '#ffd56a' : accent, 5)
        this.sparks(e.x, e.y, e.type === 'crit' ? '#ffd56a' : accent, 14, 280)
      } else if (e.type === 'nudge') {
        this.sparks(e.x, e.y, accent, 6, 160, e.text === '◀' ? 0 : Math.PI, 0.5)
      } else if (e.type === 'collapse') {
        this.burst(e.x, e.y, '#d5dee3', 10, 120)
      }
    }
    if (big && e.type !== 'overdrive-ready' && !relayEvent) this.trauma = Math.min(1, this.trauma + (e.type === 'overdrive-start' ? 0.22 : 0.55))
    else if (e.type === 'bumper') this.trauma = Math.min(1, this.trauma + 0.2)
    else if (e.type === 'gold') this.trauma = Math.min(1, this.trauma + 0.12)
    else if (e.type === 'peg') this.trauma = Math.min(1, this.trauma + 0.06)
    if (big && e.type !== 'overdrive-ready' && !relayEvent && this.drop) this.drop.hitstop = Math.max(this.drop.hitstop, e.type === 'jackpot' ? 0.09 : 0.04)
    else if (e.type === 'gold' && this.drop) this.drop.hitstop = Math.max(this.drop.hitstop, 0.018)
    if (e.type === 'jackpot') this.feel('jackpot')
    else if (e.type === 'hazard' || e.type === 'shatter-ball') this.feel('hurt')
    else if (e.type === 'overdrive-start') this.feel('overdrive')
    else if (e.type === 'core' || e.type === 'encounter-clear') this.feel('jackpot')
    else if (e.type === 'bumper' || e.type === 'echo' || e.type === 'seal' || e.type === 'shatter') this.feel('bump')
    else if (e.type === 'gold' || e.type === 'crit') this.feel('gold')
    else if (e.type === 'flip') this.feel('flip')
    else if (e.type === 'peg' || e.type === 'spring') this.feel('tick')
    if (e.type === 'relay-hit' && this.drop?.board.encounter) {
      const index = this.drop.board.bumpers.find(b => b.relay != null && b.x === e.x && b.y === e.y)?.relay ?? this.drop.lastRelay
      this.sfx.relay(this.drop.board.encounter.id, index)
    } else if (e.type === 'relay-block') {
      this.sfx.relayBlocked()
    } else if (e.type === 'encounter-clear') {
      if (this.cssW > 760) this.say('Guardian linked', this.practice ? 'Practice objective complete · finish the fall' : `+${e.gears ?? 0} gears · survive for a relic`, 2, false)
      this.sfx.guardianClear()
    } else if (e.type === 'recirculate') {
      this.snapCam = true
      this.say('Final pass', 'Progress kept · your next landing settles the fall', 2, false)
      this.sfx.recirculate()
    } else if (e.type === 'overdrive-ready') {
      if (this.cssW > 760) this.say('Overdrive ready', this.touchQuery.matches ? 'Tap Overdrive · choose the moment' : 'Press E · choose the moment', 1.6, false)
      this.sfx.overdrive(true)
    } else if (e.type === 'overdrive-start') {
      this.say('Overdrive', '2× collision payouts · combo held', 1.2, true)
      this.sfx.overdrive()
    } else if (e.type === 'jackpot') {
      this.zoom = 1.12
      this.flashAt('gold', 0.45)
      this.say('Jackpot', e.gears ? `+${e.gears}` : '', 1.6, true)
      this.sfx.jackpot()
    } else if (e.type === 'hazard') {
      this.flashAt('hurt', 0.25)
      this.sfx.hazard()
    } else if (e.type === 'shatter-ball') {
      this.flashAt('hurt', 0.4)
      this.say('Shell broken', '', 1.2, true)
      this.sfx.shatter()
    } else if (e.type === 'core') {
      this.flashAt('core', 0.2)
      this.sfx.core()
      this.say(`Core ${e.text ?? ''}`, '', 0.7, true)
    } else if (e.type === 'maw') {
      this.say('The maw opens', 'Steer it home.', 1.3, true)
      this.zoom = 1.08
    } else if (e.type === 'feather') {
      this.say('The clock skips', '', 1, true)
    } else if (e.type === 'launch') this.sfx.launch()
    else if (e.type === 'flip') this.sfx.flip()
    else if (e.type === 'nudge') this.sfx.nudge()
    else if (e.type === 'gold') this.sfx.gold(e.combo ?? 1)
    else if (e.type === 'peg' || e.type === 'spring') this.sfx.peg(e.combo ?? 1)
    else if (e.type === 'bumper' || e.type === 'echo' || e.type === 'seal') this.sfx.bumper()
    else if (e.type === 'shatter') this.sfx.shatter()
    else if (e.type === 'pocket') this.sfx.pocket(!!e.gears)
    else if (e.type === 'portal' || e.type === 'crit') this.sfx.gold(6)
  }

  private addFeedback(at: { x: number; y: number }, text: string, color: string, size: number, priority = false): void {
    const board = this.drop?.board
    const halfWidth = text.length * size * 0.32
    const x = board ? clamp(at.x + (at.x < board.w / 2 ? 48 : -48), board.margin + halfWidth + 8, board.w - board.margin - halfWidth - 8) : at.x
    const y = at.y - 48
    const nearby = this.floaters.filter(f => Math.hypot(f.x - x, f.y - y) < 120)
    if (!priority && nearby.some(f => f.priority)) return
    if (priority) this.floaters = this.floaters.filter(f => !nearby.includes(f))
    else if (nearby.length >= 2) this.floaters = this.floaters.filter(f => !nearby.slice(0, nearby.length - 1).includes(f))
    const life = priority ? 0.9 : 0.65
    this.floaters.push({ x, y, text, color, size, life, max: life, priority })
    if (this.floaters.length > 8) this.floaters.splice(0, this.floaters.length - 8)
  }

  private burst(x: number, y: number, color: string, n: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.3 + Math.random())
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        color,
        size: 1.5 + Math.random() * 2.2,
      })
    }
  }

  /** Streaking sparks, optionally aimed in a cone around `dir`. */
  private sparks(x: number, y: number, color: string, n: number, speed: number, dir = 0, spread = Math.PI): void {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() * 2 - 1) * spread
      const s = speed * (0.45 + Math.random() * 0.8)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.25 + Math.random() * 0.3,
        max: 0.55,
        color,
        size: 1.6 + Math.random() * 1.8,
        streak: true,
      })
    }
  }

  private ring(x: number, y: number, r0: number, r1: number, life: number, color: string, width: number): void {
    this.rings.push({ x, y, r0, r1, life, max: life, color, width })
  }

  /** Slow the fall when the sphere is about to land somewhere that matters. */
  private updateWarp(dt: number): void {
    let target = 1
    const d = this.drop
    if (this.screen === 'drop' && d && d.launched && !d.captured && !d.dead && d.ball.vy > 0) {
      const b = d.board
      if (d.ball.y > b.floorY - 190 && d.ball.y < b.floorY + 60) {
        const kind = binKindAt(b, d.ball.x + d.ball.vx * 0.12)
        const hot = (kind === 'jackpot' && (b.boss ? d.coreOpen : d.mult >= TUNING.jackpotAt)) || (kind === 'bonus' && d.mult >= 2)
        if (hot) target = 0.32
      }
    }
    this.warp += (target - this.warp) * (1 - Math.exp(-(target < this.warp ? 10 : 5) * dt))
    this.zoomTarget = target < 1 ? 1.1 : 1
  }

  /** Peggle-style settle: pegs struck this drop pop one after another. */
  private cashIn(dt: number): void {
    const cash = this.cash
    const drop = this.drop
    const popT = this.popT
    if (popT) for (let i = 0; i < popT.length; i++) if (popT[i] > 0) popT[i] += dt
    if (!cash || !drop || !popT) return
    cash.t += dt
    const pal = drop.ballDef.accent
    while (cash.next < cash.order.length && cash.t >= cash.next * cash.step) {
      const i = cash.order[cash.next++]
      const peg = drop.board.pegs[i]
      popT[i] = 0.0001
      const pose = pegPose(peg, drop.time, drop.board.boss && drop.coreHits >= 2 ? 2.1 : 1)
      const gold = peg.kind === 'gold' || drop.gilded[i]
      if (this.save.settings.particles) {
        this.sparks(pose.x, pose.y, gold ? '#ffd56a' : pal, gold ? 8 : 5, 200)
        this.ring(pose.x, pose.y, 6, gold ? 40 : 28, 0.3, gold ? '#ffd56a' : pal, 3)
      }
      this.sfx.pop(cash.next, gold)
    }
    if (cash.next >= cash.order.length) this.cash = null
  }

  private finishCash(): void {
    if (!this.cash || !this.popT) return
    for (let k = this.cash.next; k < this.cash.order.length; k++) this.popT[this.cash.order[k]] = 1
    this.cash = null
  }

  private say(title: string, sub: string, time: number, big: boolean): void {
    if (!big && this.toastBig && this.toastT > 0.45) return
    this.toast = { title, sub, big }
    this.toastT = time
    this.toastBig = big
  }

  private flashAt(kind: ViewModel['flash'], time: number): void {
    if (!this.save.settings.flash || this.motionQuery.matches) return
    this.flash = kind
    this.flashT = time
  }

  private buildLine(): string {
    const run = this.run
    if (!run) return ''
    const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
    const bits = [ballById(run.ballId).name, count(run.relics.length, 'relic'), count(run.upgrades.length, 'upgrade')]
    if (run.profile.synergies[0]) bits.push(run.profile.synergies[0].name)
    return bits.join('   ·   ')
  }

  private choiceCards(shop: boolean): ChoiceCard[] {
    const gears = this.run?.gears ?? 0
    return this.offers.map((offer, index) => ({
      name: offer.name,
      tags: offer.tags.join(' · '),
      text: offer.text,
      synergy: offer.synergy ?? '',
      price: shop ? offer.price : 0,
      afford: shop ? gears >= offer.price : true,
      index,
    }))
  }

  private coach(): string {
    const run = this.run
    const drop = this.drop
    const node = run ? run.nodes[run.nodeId] : null
    if (!run || !drop || !node) return ''
    if (this.practice) return node.blurb
    if (this.save.runs === 0 && node.id === 'workshop') {
      const touch = this.touchQuery.matches
      if (this.screen === 'aim') return touch ? 'Drag to aim, then tap Release. You are choosing a beginning, not a destiny.' : 'Point, then click. You are choosing a beginning, not a destiny.'
      if (this.screen === 'drop' && drop.overdriveReady) return `Reactor charged. ${touch ? 'Overdrive' : 'E'} lifts the sphere and doubles collision payouts for three seconds.`
      if (this.screen === 'drop' && drop.nudges === drop.maxNudges) return touch ? 'The Nudge buttons push the sphere. Spend them when the gate is close.' : 'A and D nudge. Spend them when the gate is close.'
      if (this.screen === 'drop' && drop.flips > 0 && node.layout) return `${touch ? 'Gate' : 'F'} flips the gate. Gold is on the ${drop.board.goldSide}.`
    }
    return node.blurb
  }

  private encounterModel(): HudModel['encounter'] {
    const drop = this.drop
    const encounter = drop?.board.encounter
    if (!drop || !encounter) return null
    const next = drop.encounterTarget
    const instruction = encounter.id === 'bellkeeper' ? 'Ring all three bells' : 'Alternate the relays'
    const target = encounter.id === 'bellkeeper'
      ? `Unlinked: ${drop.encounterTargets.map(id => ['I', 'II', 'III'][id]).join(' · ')}`
      : `Next: ${next === 0 ? 'I · left' : 'II · right'}. Order: I → II → I → II.`
    return {
      title: encounter.name, instruction, progress: drop.encounterProgress, target: encounter.required,
      reward: this.practice ? 'Practice objective · no awards' : `${encounter.bounty} gears + a relic`, returns: drop.encounterComplete || drop.time >= 75 ? 0 : Math.max(0, 1 - drop.encounterReturns),
      maxReturns: 1, complete: drop.encounterComplete,
      linked: drop.relayHits.flatMap((hit, id) => hit ? [id] : []), targets: drop.encounterTargets,
      hint: drop.encounterComplete ? this.practice ? 'Linked. Finish the fall to compare your attempt.' : 'Linked. Survive the landing to claim your relic.' : `${target} One safe-pocket return keeps progress and resources; gutters still cost shell. An incomplete relay still lets you continue.`,
    }
  }

  private coachModel(): HudModel['coach'] {
    const drop = this.drop
    if (this.practice || !drop || !this.run || this.run.nodeId !== 'workshop' || this.run.loop > 0 || this.save.coachingComplete || !['aim', 'drop'].includes(this.screen)) return null
    const touch = this.touchQuery.matches
    if (this.screen === 'aim') return { step: 1, title: 'Choose your first contact', text: touch ? 'Drag on the machine to aim. The dotted line shows the opening. Tap Release when you like the first contact.' : 'Aim with the pointer or arrows. The dotted line shows the opening. Release when you like the first contact.', action: 'launch' }
    if (!drop.overdriveReady && !this.workshopNudged) return { step: 2, title: 'You can change the line', text: `${touch ? 'The' : 'A / D or the'} Nudge buttons give a short push. Try one as the sphere approaches a useful lane.`, action: 'nudge' }
    if (drop.overdriveUses === 0) return { step: 3, title: drop.overdriveReady ? 'Make your moment' : 'Charge the reactor', text: drop.overdriveReady ? `${touch ? 'Tap' : 'Press E or'} Overdrive: lift the sphere and double collision payouts for three seconds. Two uses per machine.` : 'Five different physical peg contacts charge Overdrive. Repeated hits and relic lightning do not add charge.', action: 'overdrive' }
    return { step: 2, title: 'Try steering the fall', text: `You used the reactor. Try ${touch ? 'a' : 'A / D or a'} Nudge button to move toward the next useful lane.`, action: 'nudge' }
  }

  private view(): ViewModel {
    return {
      sig: this.signature(),
      screen: this.attract() && this.screen !== 'laboratory' ? 'hub' : this.screen,
      hud: this.hud(),
      stage: this.stage(),
      toast: this.toast,
      flash: this.flash,
    }
  }

  private signature(): string {
    const run = this.run
    const base = [
      this.screen,
      this.hubTick,
      this.selectedPulse,
      this.save.ball,
      this.save.shards,
      this.save.settings.shake,
      this.save.settings.particles,
      this.save.settings.flash,
      this.save.settings.large,
      this.save.settings.speed,
      this.draftAscension,
      this.sharedBall,
      this.sharedDaily,
      !!this.suspended,
      run?.nodeId ?? '',
      run?.gears ?? 0,
      this.offers.map((o) => o.id).join(','),
      this.summary?.score ?? '',
      this.reveal?.name ?? '',
      this.resolveCopy.title,
      this.practice?.attempt ?? '',
      this.practice?.recipe.node.id ?? '',
      this.save.stardust,
      this.save.level,
      this.save.chartOn,
      this.save.settings.haptics,
      this.save.settings.quality,
      JSON.stringify(this.save.finish),
      this.questKey(),
    ]
    return base.join('|')
  }

  private hud(): HudModel | null {
    if (this.menu() || !this.run || !this.drop) return null
    if (['fork', 'shop', 'choices', 'repair', 'bargain', 'pause', 'runend', 'reveal', 'resolve'].includes(this.screen) && this.screen !== 'aim' && this.screen !== 'drop') {
      // Keep the resource chips during decisions by still returning hud.
    }
    const drop = this.drop
    const live = this.screen === 'aim' || this.screen === 'drop'
    const start = this.run.profile.startMult
    const gate = drop.board.shutterY != null ? `Gate ${drop.gapT < 0.5 ? 'left' : 'right'} · gold ${drop.board.goldSide}` : ''
    return {
      gears: this.run.gears,
      score: this.run.score,
      shell: live ? drop.integrity : this.run.integrity,
      shellMax: this.run.integrityMax,
      mult: formatMult(drop.mult),
      multT: clamp((drop.mult - start) / Math.max(0.1, TUNING.jackpotAt - start), 0, 1),
      multHot: drop.mult >= TUNING.jackpotAt,
      jackpotAt: formatMult(TUNING.jackpotAt),
      combo: this.screen === 'drop' ? drop.combo : 0,
      comboT: this.screen === 'drop' && drop.combo > 0 ? clamp(drop.comboTimer / this.run.profile.comboWindow, 0, 1) : 0,
      earned: drop.earned,
      tally: this.screen === 'drop' && drop.earned > 0,
      nudges: drop.nudges,
      maxNudges: drop.maxNudges,
      nudgeCooldown: drop.nudgeCd,
      specials: this.run.profile.special === 'tilt' ? drop.tilts : drop.specials,
      maxSpecials: this.run.profile.special === 'tilt' ? this.run.profile.tiltCharges : this.run.profile.specialCharges,
      specialName: ballById(this.run.ballId).specialName,
      specialCooldown: drop.specialCd,
      tilts: drop.tilts,
      maxTilts: this.run.profile.special === 'tilt' ? 0 : this.run.profile.tiltCharges,
      flips: drop.flips,
      showFlip: drop.board.shutterY != null,
      seed: this.run.seed,
      kicker: this.run.nodes[this.run.nodeId]?.kicker ?? '',
      title: this.run.depthTitle,
      blurb: this.coach(),
      gate: this.screen === 'pause' || this.screen === 'runend' ? '' : gate,
      synergy: this.run.profile.synergies[0]?.name ?? '',
      core: drop.board.boss ? `Strike the core · ${drop.coreHits}/5` : '',
      jackpot: drop.board.jackpot && !drop.board.boss ? 'Center jackpots at ×3' : '',
      muted: this.sfx.isMuted,
      aiming: this.screen === 'aim',
      playing: this.screen === 'aim' || this.screen === 'drop',
      journey: this.practice ? `Practice · attempt ${this.practice.attempt} · Trial ${this.run.ascension}` : `Circuit ${this.run.loop + 1} · machine ${this.run.nodes[this.run.nodeId]?.depth ?? 1} · Trial ${this.run.ascension}`,
      objective: this.objectiveLine(),
      anomaly: this.nodeAnomaly(this.run.nodes[this.run.nodeId]) ? ANOMALIES[this.nodeAnomaly(this.run.nodes[this.run.nodeId])!].name : '',
      charge: drop.charge,
      overdriveTime: drop.overdriveTime,
      overdriveUses: Math.max(0, drop.profile.overdriveMax - drop.overdriveUses),
      overdriveReady: this.screen === 'drop' && drop.overdriveReady,
      overview: this.overview,
      encounter: this.encounterModel(),
      coach: this.coachModel(),
      practice: !!this.practice,
    }
  }

  private stage(): StageModel {
    const run = this.run
    switch (this.screen) {
      case 'laboratory': return this.laboratoryStage()
      case 'practice-result': {
        const s = this.practice
        return s?.result ? { kind: 'practice-result', report: s.result, attempt: s.attempt, best: s.best?.earned ?? 0, comparison: s.comparison } : { kind: 'none' }
      }
      case 'hub':
        return {
          kind: 'hub',
          balls: BALL_LIST.map((ball) => ({
            id: ball.id,
            name: ball.name,
            tagline: ball.tagline,
            tags: ball.tags.join(' · '),
            colors: ((f) => f ? [f.accent, f.color, f.core] as [string, string, string] : [ball.accent, ball.color, ball.core] as [string, string, string])(finishFor(ball.id, this.save.finish[ball.id], this.sphereLevel(ball.id))),
            locked: !this.save.balls.includes(ball.id) && this.sharedBall !== ball.id,
            reason: ball.id === 'prism' ? 'Awakens after your first fall.' : 'Reach the Gravity Core, or finish two falls.',
            selected: (this.sharedBall || this.save.ball) === ball.id,
          })),
          shards: this.save.shards,
          best: this.save.bestScore,
          runs: this.save.runs,
          seed: this.draftSeed,
          study: this.studyLabel(),
          canStudy: this.canStudy(),
          tick: this.hubTick,
          resume: !!this.suspended,
          confirm: this.replaceArmed,
          trial: this.draftAscension,
          maxTrial: Math.max(this.draftAscension, this.save.mastery[this.sharedBall || this.save.ball] ?? 0),
          trialText: ASCENSIONS[this.draftAscension],
          dailyDate: dailyExpedition().date,
          dailySphere: ballById(dailyExpedition().ballId).name,
          dailyBest: this.save.dailyBest[`${dailyExpedition().date}@${CURRENT_RULES}`] ?? 0,
          shared: !!this.sharedBall || this.sharedDaily,
          legacy: this.sharedRules === 2 && (!!this.sharedBall || this.sharedDaily),
          meta: this.metaModel(),
        }
      case 'stars':
        return {
          kind: 'stars', stardust: this.save.stardust, on: this.save.chartOn,
          nodes: STAR_NODES.map(node => {
            const level = this.save.chart[node.id] ?? 0
            const maxed = level >= node.max
            const cost = maxed ? 0 : starCost(node, level)
            return {
              id: node.id, name: node.name, glyph: node.glyph, level, max: Number.isFinite(node.max) ? node.max : 0,
              text: node.text(Math.max(1, level)), next: maxed ? '' : node.text(level + 1),
              cost, maxed, afford: !maxed && this.save.stardust >= cost, endless: !Number.isFinite(node.max),
            }
          }),
        }
      case 'quests':
        return this.questsStage()
      case 'help':
        return { kind: 'help' }
      case 'collection':
        return this.collectionStage()
      case 'settings':
        return {
          kind: 'settings',
          haptics: this.save.settings.haptics,
          hapticsAvailable: this.haptics.available,
          quality: this.save.settings.quality,
          shake: this.save.settings.shake,
          particles: this.save.settings.particles,
          flash: this.save.settings.flash,
          large: this.save.settings.large,
          volume: this.save.settings.volume,
          speed: this.save.settings.speed,
        }
      case 'choices':
        return {
          kind: 'choices',
          kicker: this.drafting ? `Circuit ${(run?.loop ?? 0) + 1} · ${run?.mode === 'daily' ? 'Daily constellation' : 'Expedition'}` : this.offers[0]?.kind === 'relic' ? 'A relic' : 'An upgrade',
          title: this.drafting ? this.draftTitle : this.offers[0]?.kind === 'relic' ? 'Keep one passenger' : 'Change the sphere',
          build: this.buildLine(),
          cards: this.choiceCards(false),
          skip: this.drafting ? 'Trust the bare sphere' : run && run.ascension >= 11 ? 'Skip this reward' : 'Take 15 gears instead',
        }
      case 'shop':
        return {
          kind: 'shop',
          gears: run?.gears ?? 0,
          cards: this.choiceCards(true),
          reroll: this.rerollCost(),
          canReroll: !!run && run.gears >= this.rerollCost() && this.rerolls < this.maxRerolls(),
          build: this.buildLine(),
          repairCost: this.shopRepairCost(),
          canRepair: !!run && run.integrity < run.integrityMax && run.gears >= this.shopRepairCost(),
        }
      case 'fork':
        return {
          kind: 'fork',
          title: run?.nodes[run.nodeId]?.title ?? 'Choose',
          options: (run?.nodes[run.nodeId]?.options ?? []).map((o, index) => ({ ...o, index })),
        }
      case 'repair':
        return {
          kind: 'repair',
          text:
            run && run.integrity < run.integrityMax
              ? this.repairAmount() >= 99 ? 'The keeper restores your entire shell before the next act.' : `Restore up to ${this.repairAmount()} shell.`
              : 'The shell is whole. The bench offers 12 gears of scrap instead.',
          action: run && run.integrity < run.integrityMax ? this.repairAmount() >= 99 ? 'Restore the whole shell' : 'Mend the shell' : 'Take the scrap',
        }
      case 'bargain':
        return { kind: 'bargain', canShell: !!run && run.integrity > 1, canPay: !!run && run.gears >= 30 }
      case 'resolve': {
        const d = this.drop
        const tone = !d ? 'good' : d.dead || d.captured === 'hazard' ? 'bad' : d.jackpot || d.wonBoss ? 'gold' : 'good'
        return { kind: 'resolve', title: this.resolveCopy.title, sub: this.resolveCopy.sub, earned: d?.earned ?? 0, tone }
      }
      case 'pause':
        return { kind: 'pause', practice: !!this.practice, canSave: !!this.run && !this.practice }
      case 'event':
        return run ? { kind: 'event', ...this.eventModel() } : { kind: 'none' }
      case 'victory':
        return { kind: 'victory', circuit: (run?.loop ?? 0) + 1, score: run?.score ?? 0, build: this.buildLine(), pressure: this.nextPressure(), bounty: run && run.mode === 'expedition' && run.clears >= (this.save.deepest[run.ballId] ?? 0) ? depthBounty(run.clears + 1) : 0 }
      case 'journal':
        return this.journalStage()
      case 'history':
        return { kind: 'history', records: this.save.history.map((r, index) => ({ seed: r.seed, sphere: ballById(r.ballId).name, score: r.score, drops: r.drops, clears: r.clears, mode: r.mode === 'daily' ? 'Daily' : 'Expedition', date: r.date.slice(0, 10), trial: r.ascension, index, build: [...r.relics.map(id => RELICS[id]?.name), ...r.upgrades.map(id => UPGRADES[id]?.name)].filter(Boolean).join(' · ') })) }
      case 'runend':
        return this.summary ? { kind: 'runend', summary: this.summary } : { kind: 'none' }
      case 'reveal':
        return this.reveal ? { kind: 'reveal', ...this.reveal } : { kind: 'none' }
      default:
        return { kind: 'none' }
    }
  }

  private questKey(): string {
    const d = this.save.daily, w = this.save.weekly
    return `${d.key}:${d.claimed.length}:${Object.values(d.progress).join(',')}|${w.key}:${w.claimed.length}`
  }

  private metaModel() {
    const ball = this.sharedBall || this.save.ball
    const level = this.sphereLevel(ball)
    const sphere = this.save.sphereLevels[ball] ?? { level: 1, xp: 0 }
    const daily = questDefs('daily', this.save.daily.key)
    const weekly = questDefs('weekly', this.save.weekly.key)
    return {
      level: this.save.level, title: rankTitle(this.save.level),
      xpT: clamp(this.save.xp / rankXp(this.save.level), 0, 1),
      xp: this.save.xp, xpNext: rankXp(this.save.level),
      stardust: this.save.stardust,
      questsDone: daily.filter(q => this.save.daily.claimed.includes(q.id)).length + weekly.filter(q => this.save.weekly.claimed.includes(q.id)).length,
      questsTotal: daily.length + weekly.length,
      sphereLevel: level, sphereT: clamp(sphere.xp / masteryXp(sphere.level), 0, 1),
      deepest: this.save.deepest[ball] ?? 0,
      chartOn: this.save.chartOn,
      chartLevels: Object.values(this.save.chart).reduce((a, b) => a + b, 0),
      finishes: (FINISHES[ball] ?? []).map(f => ({ id: f.id, name: f.name, level: f.level, color: f.color, accent: f.accent, core: f.core, unlocked: f.level <= level, selected: (finishFor(ball, this.save.finish[ball], level)?.id ?? '') === f.id })),
    }
  }

  private questsStage(): StageModel {
    this.refreshQuests()
    const book = (kind: 'daily' | 'weekly') => {
      const b = kind === 'daily' ? this.save.daily : this.save.weekly
      const reward = kind === 'daily' ? DAILY_QUEST_REWARD : WEEKLY_QUEST_REWARD
      return questDefs(kind, b.key).map(q => ({ text: q.text, value: Math.min(q.target, b.progress[q.id] ?? 0), target: q.target, done: b.claimed.includes(q.id), reward: `+${reward.dust} stardust · +${reward.xp} XP` }))
    }
    const values: Record<string, number> = {
      pegs: this.save.lifetime.pegs, golds: this.save.lifetime.golds, machines: this.save.lifetime.machines,
      runs: this.save.runs, wins: this.save.lifetime.wins, jackpots: this.save.lifetime.jackpots,
      overdrives: this.save.lifetime.overdrives, guardians: this.save.lifetime.guardians,
      combo: this.save.bestCombo, score: this.save.bestScore, depth: Math.max(0, ...Object.values(this.save.deepest)),
    }
    const now = new Date()
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    const hours = Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / 3600000))
    return {
      kind: 'quests', daily: book('daily'), weekly: book('weekly'), resetHours: hours,
      feats: FEATS.map(def => {
        const tier = this.save.feats[def.id] ?? 0
        const target = def.target(tier)
        return { name: `${def.name} ${toRoman(tier + 1)}`, text: def.text(target), value: Math.min(target, values[def.id] ?? 0), target, tier, reward: featReward(tier) }
      }),
    }
  }

  private collectionStage(): StageModel {
    const knownRelics = new Set([...STARTER_RELICS, ...this.save.researched])
    return {
      kind: 'collection',
      balls: BALL_LIST.map((ball) => ({
        name: ball.name,
        text: this.save.balls.includes(ball.id)
          ? `${ball.tagline} ${ball.specialText}`
          : ball.id === 'prism'
            ? 'Awakens after your first fall.'
            : 'Reach the Gravity Core, or finish two falls.',
        known: true,
      })),
      relics: Object.values(RELICS).map((relic) => {
        const researched = knownRelics.has(relic.id)
        const seen = this.save.seenRelics.includes(relic.id)
        if (!researched) return { name: relic.name, text: relic.lockHint || 'Locked schematic.', known: false }
        if (!seen) return { name: relic.name, text: 'In the machine. Not yet offered.', known: false }
        const sticker = this.save.stickers[relic.id]
        return { name: sticker ? `${relic.name} · won at Trial ${sticker - 1}` : relic.name, text: relic.text, known: true }
      }),
      parts: PARTS.map((part) => ({
        name: part.name,
        text: this.save.seenParts.includes(part.id) ? part.about : 'Still inside the machine.',
        known: this.save.seenParts.includes(part.id),
      })),
      challenges: CHALLENGES.map((c) => ({
        name: this.save.challenges.includes(c.id) ? `${c.name} · done` : c.name,
        text: c.text,
        known: true,
      })),
      lore: this.save.lore.map((id) => LORE[id]).filter(Boolean),
      pegs: this.save.lifetime.pegs,
    }
  }

  private objectiveLine(): string {
    const run = this.run
    if (!run) return ''
    if (this.practice) return 'Practice only · archive and expedition preserved'
    const next = COMMISSIONS.find(c => run.commissions.includes(c.id) && !run.claimed.includes(c.id))
    return next ? `${next.name}: ${Math.min(next.target, run[next.stat])}/${next.target} · +${next.gears} gears` : 'All commissions fulfilled · a beautiful descent'
  }

  private nodeAnomaly(node: GameNode): keyof typeof ANOMALIES | undefined {
    const run = this.run
    if (!run || node.kind === 'boss') return undefined
    if (node.anomaly) return node.anomaly
    if (run.mode !== 'daily' && run.ascension < 6) return undefined
    const ids = Object.keys(ANOMALIES) as (keyof typeof ANOMALIES)[]
    return ids[Math.floor(rngFor(run.seed, `anomaly:${node.id}`)() * ids.length)]
  }

  private journalStage(): StageModel {
    const run = this.run
    if (!run) return { kind: 'none' }
    const current = run.nodes[run.nodeId]
    return {
      kind: 'journal', title: ballById(run.ballId).name,
      canSave: !this.practice && (this.leaveFrom() === 'drop' || CHECKPOINT_SCREENS.includes(this.leaveFrom())),
      practice: !!this.practice,
      stats: `${this.practice ? 'Practice · ' : ''}${run.rules === 2 ? 'Classic route · ' : ''}Circuit ${run.loop + 1} · Trial ${run.ascension} · ${run.integrity}/${run.integrityMax} shell · ${run.gears} gears · Seed ${run.seed}`,
      encounter: this.encounterModel(),
      commissions: COMMISSIONS.filter(c => run.commissions.includes(c.id)).map(c => ({ name: c.name, text: `${c.text} +${c.gears} gears.`, value: run[c.stat], target: c.target, done: run.claimed.includes(c.id) })),
      relics: run.relics.map(id => ({ name: RELICS[id].name, text: RELICS[id].text, known: true })),
      upgrades: run.upgrades.map(id => ({ name: UPGRADES[id].name, text: UPGRADES[id].text, known: true })),
      synergies: run.profile.synergies.map(s => ({ name: `${s.name} · ${s.count} tags`, text: s.blurb, known: true })),
      route: Object.values(run.nodes).sort((a, b) => a.sector - b.sector || a.depth - b.depth).map(node => ({
        id: node.id, title: node.title, kind: node.encounter ? 'Guardian · optional relic' : node.kind === 'drop' ? node.reward ? `Machine · ${node.reward}` : 'Machine · gears' : node.kind,
        act: node.sector, depth: node.depth,
        status: node.id === run.nodeId ? 'current' : run.visited.includes(node.id) ? 'visited' : node.depth < current.depth ? 'alternative' : 'future',
        detail: [node.blurb, node.kind === 'drop' && this.nodeAnomaly(node) ? `${ANOMALIES[this.nodeAnomaly(node)!].name}: ${ANOMALIES[this.nodeAnomaly(node)!].description}` : ''].filter(Boolean).join(' '),
        next: node.options ? node.options.map(o => run.nodes[o.next]?.title ?? o.title).join(' / ') : node.next ? run.nodes[node.next]?.title ?? '' : 'Bank victory or enter the next circuit',
        nextIds: node.options ? node.options.map(o => o.next) : node.next ? [node.next] : [],
      })),
    }
  }

  private studyLabel(): string {
    const next = this.nextSchematic()
    if (next) return `${this.save.shards}/${this.researchCost()} shards · ${next.name}`
    const trail = TRAILS.find((t) => !this.save.trails.includes(t.id))
    if (trail) return this.save.shards >= TUNING.trailCost ? `Cast ${trail.name}` : `${this.save.shards}/${TUNING.trailCost} · ${trail.name}`
    return 'Archive complete'
  }

  private canStudy(): boolean {
    const next = this.nextSchematic()
    if (next) return this.save.shards >= this.researchCost()
    return !!TRAILS.find((t) => !this.save.trails.includes(t.id)) && this.save.shards >= TUNING.trailCost
  }

  private researchCost(): number { return TUNING.researchCost + this.save.researched.length * 8 }

  private onAction(act: string): void {
    const replacing = (act === 'start' || act === 'daily' || act.startsWith('replay:')) && !!this.suspended && (this.screen === 'hub' || this.screen === 'history')
    if (replacing && this.replaceArmed !== act) {
      this.replaceArmed = act
      this.selectedPulse++
      this.sfx.ui()
      this.say(REPLACE_PROMPT, 'Tap again to start over. The saved expedition will be lost.', 2.5, false)
      return
    }
    if (this.replaceArmed) {
      this.replaceArmed = ''
      this.selectedPulse++
      if (this.toast?.title === REPLACE_PROMPT) { this.toast = null; this.toastT = 0 }
    }
    if (act === 'laboratory' && this.screen === 'hub') { this.openLaboratory(); return }
    if (act === 'practice-last' && this.screen === 'runend' && this.summary?.debrief && this.lastMachine) { this.openLaboratory(true); return }
    if (act === 'lab-exit' && this.practice) { this.toHub(); return }
    if (act === 'lab-configure' && this.practice) { this.configureLaboratory(); return }
    if ((act === 'lab-start' || act === 'lab-retry') && this.practice && ['laboratory', 'aim', 'drop', 'pause', 'practice-result'].includes(this.screen)) { this.startPractice(); return }
    if (this.screen === 'laboratory' && this.practice) {
      if (act.startsWith('lab-machine:') && PRACTICE_MACHINES.some(m => m.id === act.slice(12))) { this.labMachine = act.slice(12); this.changePractice(); return }
      if (act.startsWith('lab-sphere:') && BALLS[act.slice(11)]) { this.labSphere = act.slice(11); this.changePractice(); return }
      if (act.startsWith('lab-build:') && PRACTICE_BUILDS.some(b => b.id === act.slice(10))) { this.labBuild = act.slice(10); this.changePractice(); return }
    }
    if (act === 'coach-dismiss') {
      this.save.coachingComplete = true
      writeSave(this.save)
      return
    }
    if (act === 'coach-enable') {
      this.save.coachingComplete = false
      writeSave(this.save)
      this.clearControls()
      this.toHub()
      this.say('Workshop tips enabled', 'Your next Workshop will guide release, nudging, and Overdrive.', 2, false)
      return
    }
    if (act === 'overview') { this.toggleOverview(); return }
    if (act === 'stars' || act === 'quests') {
      if (!this.menu()) return
      this.returnTo = 'hub'
      this.screen = act
      this.sfx.ui()
      this.selectedPulse++
      return
    }
    if (act.startsWith('star:') && this.screen === 'stars') { this.buyStar(act.slice(5)); return }
    if (act === 'chart-toggle') {
      this.save.chartOn = !this.save.chartOn
      writeSave(this.save)
      this.selectedPulse++
      return
    }
    if (act.startsWith('finish:')) {
      const id = act.slice(7)
      const ball = this.sharedBall || this.save.ball
      const finish = (FINISHES[ball] ?? []).find(f => f.id === id)
      if (!finish || finish.level > this.sphereLevel(ball)) return
      this.save.finish[ball] = id
      writeSave(this.save)
      this.sfx.ui()
      this.feel('ui')
      this.selectedPulse++
      return
    }
    if (act.startsWith('quality:')) {
      const q = act.slice(8)
      if (q === 'auto' || q === 'high' || q === 'saver') {
        this.save.settings.quality = q
        this.dprCap = 2
        this.frameSamples = 0
        writeSave(this.save)
        this.resize()
        this.selectedPulse++
      }
      return
    }
    if (act === 'launch') { this.launch(); return }
    if (act === 'start') {
      this.sfx.resume()
      this.sfx.ui()
      this.startRun(this.draftSeed, this.sharedBall || this.save.ball, this.sharedDaily ? 'daily' : 'expedition', this.draftAscension, this.sharedCatalogue ?? undefined, this.sharedRules, !!this.sharedBall || this.sharedDaily || !!this.sharedCatalogue)
      return
    }
    if (act === 'continue-run') { this.sfx.resume(); this.resumeExpedition(); return }
    if (act === 'daily') {
      const daily = dailyExpedition()
      this.sfx.resume()
      this.startRun(daily.seed, daily.ballId, 'daily', 0, [...RESEARCH_ORDER])
      return
    }
    if (act === 'trial-up' || act === 'trial-down') {
      this.draftAscension = clamp(this.draftAscension + (act === 'trial-up' ? 1 : -1), 0, this.save.mastery[this.sharedBall || this.save.ball] ?? 0)
      this.selectedPulse++
      return
    }
    if (act === 'journal') {
      if (!this.run) return
      if (this.screen === 'journal') this.screen = this.journalReturn
      else { this.journalReturn = this.screen; this.screen = 'journal'; this.clearControls() }
      return
    }
    if (act === 'close-journal') { if (this.screen === 'journal') this.screen = this.journalReturn; return }
    if (act === 'history') { this.returnTo = this.screen === 'runend' ? 'runend' : 'hub'; this.screen = 'history'; return }
    if (act.startsWith('replay:')) {
      const record = this.save.history[Number(act.slice(7))]
      if (record) { this.sfx.resume(); this.startRun(record.seed, record.ballId, record.mode, record.ascension, record.catalogue ?? [], record.rules ?? 2) }
      return
    }
    if (act.startsWith('share:')) {
      const record = this.save.history[Number(act.slice(6))]
      if (record) this.copyText(challengeUrl(shareBase(), record), 'Challenge copied')
      return
    }
    if (act === 'bank') { if (this.screen === 'victory') this.endRun(true); return }
    if (act === 'loop') return this.continueCircuit()
    if (act === 'random-seed') {
      this.draftSeed = makeSeed()
      this.sharedBall = ''; this.sharedCatalogue = null; this.sharedDaily = false
      this.sharedRules = CURRENT_RULES
      this.hubTick++
      return
    }
    if (act.startsWith('ball:')) {
      const id = act.slice(5)
      if (!this.save.balls.includes(id)) return
      this.save.ball = id
      this.sharedBall = ''; this.sharedDaily = false; this.sharedCatalogue = null
      this.sharedRules = CURRENT_RULES
      this.draftAscension = Math.min(this.draftAscension, this.save.mastery[id] ?? 0)
      writeSave(this.save)
      this.sfx.ui()
      this.selectedPulse++
      return
    }
    if (act === 'help') {
      this.returnTo = 'hub'
      this.screen = 'help'
      return
    }
    if (act === 'collection') {
      this.returnTo = this.screen === 'runend' ? 'runend' : 'hub'
      this.screen = 'collection'
      return
    }
    if (act === 'settings') {
      this.returnTo = this.screen === 'pause' ? 'pause' : 'hub'
      this.screen = 'settings'
      return
    }
    if (act === 'back') {
      this.screen = this.returnTo === 'pause' ? 'pause' : this.returnTo === 'runend' ? 'runend' : 'hub'
      return
    }
    if (act === 'pause-btn' && (this.screen === 'aim' || this.screen === 'drop')) {
      this.pausedFrom = this.screen
      this.screen = 'pause'
      this.clearControls()
      return
    }
    if (act === 'resume') {
      if (this.screen !== 'pause') return
      this.clearControls()
      this.screen = this.pausedFrom === 'drop' ? 'drop' : 'aim'
      return
    }
    if (act === 'save-exit') {
      // Leaves for the hub with the expedition checkpoint intact. A fall in progress restarts from its launch, as after a reload.
      if (!this.run || this.practice) return
      const from = this.leaveFrom()
      if (from !== 'drop' && !CHECKPOINT_SCREENS.includes(from)) return
      if (from !== 'drop') { this.screen = from; this.checkpoint() }
      const saved = readCheckpoint() ?? this.suspended
      if (!saved) return
      this.suspended = saved
      this.toHub()
      this.say('Expedition saved', from === 'drop' ? 'Continue restarts this machine from its launch.' : 'Continue from the hub whenever you are ready.', 2, false)
      return
    }
    if (act === 'abandon') {
      if (this.practice) { this.configureLaboratory(); return }
      if (this.run && !this.run.launchedOnce) { clearCheckpoint(); this.suspended = null; this.toHub() }
      else this.endRun(false)
      return
    }
    if (act === 'skip') {
      if (this.screen === 'choices' && this.run) {
        if (this.drafting) { this.drafting = false; this.enterNode('workshop') }
        else { this.run.gears += this.run.ascension >= 11 ? 0 : 15; this.advance() }
      } else this.skipResolve()
      return
    }
    if (act === 'repair') return this.repair()
    if (act === 'leave') { if (this.screen === 'shop') this.advance(); return }
    if (act === 'shop-repair') {
      if (this.screen === 'shop' && this.run && this.run.integrity < this.run.integrityMax && this.run.gears >= this.shopRepairCost()) {
        this.run.gears -= this.shopRepairCost()
        this.run.integrity++
        this.sfx.ui(); this.selectedPulse++; this.checkpoint()
      }
      return
    }
    if (act === 'reroll') {
      if (this.screen !== 'shop' || !this.run || this.run.gears < this.rerollCost() || this.rerolls >= this.maxRerolls()) return
      this.run.gears -= this.rerollCost()
      this.rerolls += 1
      this.offers = this.makeShop()
      this.rememberOffers()
      this.sfx.ui()
      this.selectedPulse++
      this.checkpoint()
      return
    }
    if (act === 'again' && this.summary) return this.startRun('', this.summary.ballId, 'expedition', Math.min(this.summary.ascension, this.save.mastery[this.summary.ballId] ?? 0))
    if (act === 'retry' && this.summary) return this.startRun(this.summary.seed, this.summary.ballId, this.summary.mode, this.summary.ascension, this.summary.catalogue, this.summary.rules, !!this.summary.progress?.pure && this.save.chartOn)
    if (act === 'hub') return this.toHub()
    if (act === 'study') return this.study()
    if (act === 'close-reveal') {
      this.reveal = null
      this.screen = this.returnTo === 'runend' && this.summary ? 'runend' : 'hub'
      if (this.summary && this.screen === 'runend') {
        const next = this.nextSchematic()
        this.summary.temptation = this.temptation([], next)
        this.summary.canStudy = this.canStudy()
        this.summary.studyLabel = next ? `Study · ${next.lockHint}` : this.studyLabel()
      }
      this.selectedPulse++
      return
    }
    if (act === 'copy-seed') {
      const seed = this.run?.seed || this.summary?.seed || this.draftSeed
      if (!seed) return
      void navigator.clipboard?.writeText(seed).then(
        () => this.say('Seed copied', seed, 0.8, false),
        () => this.say(seed, 'Copy it from here.', 1.2, false),
      )
      return
    }
    if (act === 'copy-challenge' || act === 'copy-result') {
      const run = this.run
      if (!run) return
      const link = challengeUrl(shareBase(), run)
      const result = `PLUMB ✧ ${run.score.toLocaleString()} · ${ballById(run.ballId).name} · Trial ${run.ascension}\n${run.clears} circuit${run.clears === 1 ? '' : 's'} cleared · ${run.bestCombo} best combo · ${run.claimed.length}/3 commissions\n${run.relics.map(id => RELICS[id].name).join(' + ')}\n${link}`
      this.copyText(act === 'copy-result' ? result : link, act === 'copy-result' ? 'Result copied' : 'Challenge copied')
      return
    }
    if (act.startsWith('speed:')) {
      const speed = Number(act.slice(6))
      if (speed === 0.75 || speed === 1 || speed === 1.5 || speed === 2) { this.save.settings.speed = speed; writeSave(this.save); this.selectedPulse++ }
      return
    }
    if (act === 'mute') {
      this.sfx.toggle()
      return
    }
    if (act.startsWith('volume:')) {
      const v = Number(act.slice(7))
      if (Number.isFinite(v)) {
        this.save.settings.volume = clamp(v, 0, 1)
        this.sfx.volume = this.save.settings.volume
        writeSave(this.save)
      }
      return
    }
    if (act.startsWith('toggle:')) {
      const key = act.slice(7) as 'shake' | 'particles' | 'flash' | 'large' | 'haptics'
      if (key === 'shake' || key === 'particles' || key === 'flash' || key === 'large' || key === 'haptics') {
        this.save.settings[key] = !this.save.settings[key]
        this.haptics.enabled = this.save.settings.haptics
        if (key === 'haptics') this.feel('ui')
        document.documentElement.classList.toggle('lg', this.save.settings.large)
        writeSave(this.save)
        this.selectedPulse++
      }
      return
    }
    if (act.startsWith('pick:')) return this.pick(Number(act.slice(5)))
    if (act.startsWith('buy:')) return this.buy(Number(act.slice(4)))
    if (act.startsWith('fork:')) return this.fork(Number(act.slice(5)))
    if (act.startsWith('event:')) return this.chooseEvent(Number(act.slice(6)))
    if (act === 'bargain:shell') return this.bargain('shell')
    if (act === 'bargain:pay') return this.bargain('pay')
    if (act === 'bargain:walk') return this.bargain('walk')
    if (this.screen === 'drop') {
      if (act === 'nudge-left') this.pending.nudge = -1
      if (act === 'nudge-right') this.pending.nudge = 1
      if (act === 'flip') this.pending.flip = true
      if (act === 'special') this.pending.special = true
      if (act === 'tilt') this.pending.tilt = true
    }
    if (act === 'overdrive' && this.screen === 'drop') this.pending.overdrive = true
    if (act === 'skip-node' && this.dev) this.advance()
  }

  /** The run screen underneath any pause or journal overlay. */
  private leaveFrom(): string {
    const under = this.screen === 'journal' ? this.journalReturn : this.screen
    return under === 'pause' ? this.pausedFrom : under
  }

  private copyText(value: string, title: string): void {
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(value).then(() => this.say(title, 'Ready to share.', 1.2, false), () => this.say('Clipboard unavailable', 'Use the seed from your journal or logbook.', 2, false))
    else this.say('Clipboard unavailable', 'Use the seed from your journal or logbook.', 2, false)
  }

  private debug(): void {
    if (!this.dev) {
      this.debugEl.hidden = true
      return
    }
    this.debugEl.hidden = !this.debugOpen
    if (!this.debugOpen) return
    const drop = this.drop
    const lines = [
      `fps ${this.fps.toFixed(0)}`,
      `screen ${this.screen}`,
      `seed ${this.run?.seed ?? this.draftSeed}`,
      `node ${this.run?.nodeId ?? '-'}`,
      drop ? `v ${drop.ball.vx.toFixed(0)} ${drop.ball.vy.toFixed(0)}` : 'no ball',
      drop ? `mult ${drop.mult.toFixed(2)} combo ${drop.combo}` : '',
      drop ? `gap ${drop.gapT.toFixed(2)} core ${drop.coreHits}` : '',
      `build ${this.buildLine()}`,
      `pegs ${drop?.board.pegs.length ?? 0}`,
    ]
    let pre = this.debugEl.querySelector('pre')
    if (!pre) {
      this.debugEl.innerHTML = `<pre></pre><div class="debug-row">
        <button data-debug="gears">+gears</button>
        <button data-debug="heal">heal</button>
        <button data-debug="boss">boss</button>
        <button data-debug="relics">unlock</button>
        <button data-debug="hit">hitboxes</button>
        <button data-debug="end">end drop</button>
      </div>`
      pre = this.debugEl.querySelector('pre')
      this.debugEl.onclick = (e) => {
        const id = (e.target as HTMLElement).dataset.debug
        if (!id || !this.run) return
        if (id === 'gears') this.run.gears += 80
        if (id === 'heal') this.run.integrity = this.run.integrityMax
        if (id === 'boss') this.enterNode('grinder')
        if (id === 'relics') {
          this.save.balls = ['rubber', 'prism', 'void']
          this.save.researched = [...RESEARCH_ORDER]
          writeSave(this.save)
        }
        if (id === 'hit') this.hitboxes = !this.hitboxes
        if (id === 'end' && this.drop && this.screen === 'drop') {
          this.drop.ball.y = this.drop.board.floorY + 80
          this.drop.ball.vy = 10
        }
        this.selectedPulse++
      }
    }
    if (pre) pre.textContent = lines.filter(Boolean).join('\n')
  }
}

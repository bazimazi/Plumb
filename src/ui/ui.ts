import type { DropReport } from '../sim/report'

export interface BallCard {
  id: string
  name: string
  tagline: string
  tags: string
  /** Highlight, body and core colors for the orb swatch. */
  colors: [string, string, string]
  locked: boolean
  reason: string
  selected: boolean
}

export interface ChoiceCard {
  name: string
  tags: string
  text: string
  synergy: string
  price: number
  afford: boolean
  index: number
}

export interface ForkCard {
  title: string
  detail: string
  risk: 'safe' | 'risky'
  index: number
}

export interface CollItem {
  name: string
  text: string
  known: boolean
}

export interface EncounterModel {
  title: string
  instruction: string
  progress: number
  target: number
  reward: string
  returns: number
  maxReturns: number
  hint: string
  complete: boolean
  linked?: number[]
  targets?: number[]
}

export interface CoachModel {
  step: number
  title: string
  text: string
  action: string
}

export interface HudModel {
  gears: number
  score: number
  shell: number
  shellMax: number
  mult: string
  /** Progress from the starting multiplier to the jackpot threshold, 0..1. */
  multT: number
  multHot: boolean
  jackpotAt: string
  combo: number
  /** Remaining combo window, 0..1. */
  comboT: number
  earned: number
  tally: boolean
  nudges: number
  maxNudges: number
  nudgeCooldown?: number
  specials: number
  maxSpecials: number
  specialName: string
  specialCooldown?: number
  tilts: number
  maxTilts: number
  flips: number
  showFlip: boolean
  seed: string
  kicker: string
  title: string
  blurb: string
  gate: string
  synergy: string
  core: string
  jackpot: string
  muted: boolean
  aiming: boolean
  overview: boolean
  playing: boolean
  journey: string
  objective: string
  anomaly: string
  charge: number
  overdriveTime: number
  overdriveUses: number
  overdriveReady: boolean
  encounter?: EncounterModel | null
  coach?: CoachModel | null
  practice?: boolean
}

export interface ProgressModel {
  xp: number
  dust: number
  levelDust: number
  depthDust: number
  depthRecord: number
  levelBefore: number
  levelAfter: number
  xpBefore: number
  xpAfter: number
  title: string
  sphere: string
  sphereLevel: number
  sphereUp: boolean
  finishes: string[]
  feats: string[]
  quests: string[]
  pure: boolean
  stardust: number
}

export interface MetaModel {
  level: number
  title: string
  xpT: number
  xp: number
  xpNext: number
  stardust: number
  questsDone: number
  questsTotal: number
  sphereLevel: number
  sphereT: number
  deepest: number
  chartOn: boolean
  chartLevels: number
  finishes: { id: string; name: string; level: number; color: string; accent: string; core: string; unlocked: boolean; selected: boolean }[]
}

export interface StarCard {
  id: string; name: string; glyph: string; level: number; max: number; text: string; next: string
  cost: number; maxed: boolean; afford: boolean; endless: boolean
}

export interface QuestRow { text: string; value: number; target: number; done: boolean; reward: string }

export interface SummaryModel {
  progress?: ProgressModel
  heading: string
  line: string
  score: number
  best: boolean
  gears: number
  mult: string
  combo: number
  depth: string
  shards: number
  awakened: string[]
  challenges: string[]
  temptation: string
  canStudy: boolean
  studyLabel: string
  seed: string
  mode: 'expedition' | 'daily'
  ascension: number
  clears: number
  commissions: number
  debrief?: DropReport
}

export interface LabModel {
  machines: { id: string; name: string; text: string; selected: boolean }[]
  spheres: { id: string; name: string; selected: boolean }[]
  builds: { id: string; name: string; text: string; selected: boolean }[]
  seed: string
  matched: boolean
  title: string
  description: string
  best?: { earned: number; combo: number; objective: string }
  attempt: number
}

export interface RouteItem {
  id: string; title: string; kind: string; act: number; depth: number
  status: 'current' | 'visited' | 'future' | 'alternative'; detail: string; next: string
  nextIds?: string[]
}

export type StageModel =
  | { kind: 'none' }
  | { kind: 'hub'; balls: BallCard[]; shards: number; best: number; runs: number; seed: string; study: string; canStudy: boolean; tick: number; resume: boolean; trial: number; maxTrial: number; trialText: string; dailyDate: string; dailySphere: string; dailyBest: number; shared: boolean; legacy?: boolean; meta?: MetaModel }
  | { kind: 'stars'; stardust: number; on: boolean; nodes: StarCard[] }
  | { kind: 'quests'; daily: QuestRow[]; weekly: QuestRow[]; resetHours: number; feats: { name: string; text: string; value: number; target: number; tier: number; reward: number }[] }
  | { kind: 'help' }
  | { kind: 'collection'; balls: CollItem[]; relics: CollItem[]; parts: CollItem[]; challenges: CollItem[]; lore: string[]; pegs: number }
  | { kind: 'settings'; shake: boolean; particles: boolean; flash: boolean; large: boolean; volume: number; speed: number; haptics?: boolean; hapticsAvailable?: boolean; quality?: 'auto' | 'high' | 'saver' }
  | { kind: 'choices'; kicker: string; title: string; build: string; cards: ChoiceCard[]; skip: string }
  | { kind: 'shop'; gears: number; cards: ChoiceCard[]; reroll: number; canReroll: boolean; build: string; repairCost: number; canRepair: boolean }
  | { kind: 'fork'; title: string; options: ForkCard[] }
  | { kind: 'repair'; text: string; action: string }
  | { kind: 'bargain'; canShell: boolean; canPay: boolean }
  | { kind: 'resolve'; title: string; sub: string; earned: number; tone: 'good' | 'bad' | 'gold' }
  | { kind: 'pause'; practice?: boolean }
  | { kind: 'laboratory'; lab: LabModel }
  | { kind: 'practice-result'; report: DropReport; attempt: number; best: number; comparison: number | null }
  | { kind: 'runend'; summary: SummaryModel }
  | { kind: 'reveal'; name: string; text: string; tags: string }
  | { kind: 'event'; title: string; story: string; cards: ChoiceCard[] }
  | { kind: 'victory'; circuit: number; score: number; build: string; pressure?: string; bounty?: number }
  | { kind: 'history'; records: { seed: string; sphere: string; score: number; drops: number; clears: number; mode: string; date: string; index: number; trial: number; build: string }[] }
  | { kind: 'journal'; title: string; stats: string; commissions: { name: string; text: string; value: number; target: number; done: boolean }[]; relics: CollItem[]; upgrades: CollItem[]; synergies: CollItem[]; route: RouteItem[]; encounter?: EncounterModel | null; practice?: boolean }

export interface ViewModel {
  sig: string
  screen: string
  hud: HudModel | null
  stage: StageModel
  toast: { title: string; sub: string; big?: boolean } | null
  flash: '' | 'gold' | 'hurt' | 'core'
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

function pips(on: number, max: number, cls = ''): string {
  let html = ''
  for (let i = 0; i < max; i++) html += `<i class="${i < on ? 'on' : ''}"></i>`
  return `<span class="pips ${cls}">${html}</span>`
}

const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function bump(el: Element | null, scale = 1.25): void {
  if (!el || reduced || !(el as HTMLElement).animate) return
  ;(el as HTMLElement).animate([{ transform: `scale(${scale})` }, { transform: 'scale(1)' }], {
    duration: 280,
    easing: 'cubic-bezier(.2,1.7,.4,1)',
  })
}

function shake(el: Element | null): void {
  if (!el || reduced || !(el as HTMLElement).animate) return
  ;(el as HTMLElement).animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 320, easing: 'ease-out' },
  )
}

/** Animate numbers marked with data-count up from zero once a screen appears. */
function countUp(root: HTMLElement): void {
  const els = root.querySelectorAll<HTMLElement>('[data-count]')
  if (!els.length) return
  const start = performance.now()
  const dur = reduced ? 0 : 750
  const targets = Array.from(els).map((el) => ({ el, to: Number(el.dataset.count) || 0, suffix: el.dataset.suffix ?? '' }))
  const tick = (now: number) => {
    const k = dur ? Math.min(1, (now - start) / dur) : 1
    const e = 1 - Math.pow(1 - k, 3)
    for (const t of targets) t.el.textContent = `${Math.round(t.to * e)}${t.suffix}`
    if (k < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export class UI {
  private sig = ''
  private hudKey = ''
  private shown: Record<string, number> = {}
  private prev: Record<string, string | number> = {}
  private lastT = performance.now()
  private toastKey = ''

  constructor(
    private stage: HTMLElement,
    private hud: HTMLElement,
    private toast: HTMLElement,
    private flash: HTMLElement,
    private onAction: (act: string) => void,
    private onSeed: (value: string) => void,
  ) {
    const click = (e: Event) => {
      const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null
      if (!t || (t as HTMLButtonElement).disabled) return
      this.onAction(t.dataset.act || '')
    }
    stage.addEventListener('click', click)
    hud.addEventListener('click', click)
    stage.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement
      if (t.dataset.seed != null) this.onSeed(t.value)
      if (t.dataset.volume != null) this.onAction('volume:' + t.value)
    })
    // Cards lean toward the pointer, like a hand of cards being considered.
    stage.addEventListener('pointermove', (e) => {
      if (reduced) return
      const target = e.target instanceof Element ? e.target : null
      const card = target?.closest('.card') as HTMLElement | null
      if (!card || card.classList.contains('ball')) return
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      card.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`)
      card.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`)
      card.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`)
      card.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`)
    })
    stage.addEventListener(
      'pointerout',
      (e) => {
        const target = e.target instanceof Element ? e.target : null
        const card = target?.closest('.card') as HTMLElement | null
        if (!card || card.contains(e.relatedTarget as Node)) return
        card.style.removeProperty('--rx')
        card.style.removeProperty('--ry')
      },
      true,
    )
  }

  render(view: ViewModel): void {
    const now = performance.now()
    const dt = Math.min(0.1, (now - this.lastT) / 1000)
    this.lastT = now
    const root = document.getElementById('app')
    if (root) {
      if (root.dataset.mode !== view.screen) root.dataset.mode = view.screen
      const playfield = view.hud ? 'true' : 'false'
      if (root.dataset.playfield !== playfield) root.dataset.playfield = playfield
      const encounter = view.hud?.encounter ? 'true' : 'false'
      if (root.dataset.encounter !== encounter) root.dataset.encounter = encounter
      const practice = view.hud?.practice ? 'true' : 'false'
      if (root.dataset.practice !== practice) root.dataset.practice = practice
      const coach = view.hud?.coach && !view.hud?.encounter ? 'true' : 'false'
      if (root.dataset.coach !== coach) root.dataset.coach = coach
    }
    if (view.sig !== this.sig) {
      const prevKind = this.stage.dataset.kind
      const refreshLab = prevKind === 'laboratory' && view.stage.kind === 'laboratory'
      const labScroll = refreshLab ? this.stage.querySelector<HTMLElement>('.laboratory')?.scrollTop ?? 0 : 0
      const focusedAction = refreshLab && document.activeElement instanceof HTMLElement && this.stage.contains(document.activeElement)
        ? document.activeElement.dataset.act : undefined
      this.sig = view.sig
      this.stage.innerHTML = stageHtml(view.stage)
      if (refreshLab) {
        const lab = this.stage.querySelector<HTMLElement>('.laboratory')
        if (lab) lab.scrollTop = labScroll
        if (focusedAction) Array.from(this.stage.querySelectorAll<HTMLElement>('[data-act]')).find(el => el.dataset.act === focusedAction)?.focus({ preventScroll: true })
      }
      if (['choices', 'fork', 'shop', 'event', 'bargain', 'repair', 'victory'].includes(view.stage.kind)) this.stage.insertAdjacentHTML('beforeend', `<button class="round-btn decision-journal" data-act="journal" aria-label="Build and route">${ico('map')}<kbd>J</kbd></button>`)
      this.stage.className = view.stage.kind === 'none' ? '' : 'open'
      this.stage.dataset.kind = view.stage.kind
      // Only play entrance animations when the screen itself changes, not on in-place refreshes.
      this.stage.classList.toggle('enter', prevKind !== view.stage.kind)
      if (prevKind !== view.stage.kind) countUp(this.stage)
    }
    this.renderHud(view.hud, dt)
    if (view.toast) {
      const key = `${view.toast.title}|${view.toast.sub}|${!!view.toast.big}`
      this.toast.hidden = false
      const live = view.screen === 'aim' || view.screen === 'drop' || (key === this.toastKey && this.toast.classList.contains('live'))
      this.toast.classList.toggle('live', live)
      this.toast.classList.toggle('subtle', !view.toast.big)
      if (key !== this.toastKey) {
        this.toastKey = key
        this.toast.innerHTML = `<b>${esc(view.toast.title)}</b>${view.toast.sub ? `<span>${esc(view.toast.sub)}</span>` : ''}`
        if (!reduced && this.toast.animate) {
          this.toast.animate(
            [
              { transform: 'translateX(-50%) scale(0.6)', opacity: 0, filter: 'blur(6px)' },
              { transform: 'translateX(-50%) scale(1.08)', opacity: 1, filter: 'blur(0)', offset: 0.6 },
              { transform: 'translateX(-50%) scale(1)', opacity: 1 },
            ],
            { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' },
          )
        }
      }
    } else if (!this.toast.hidden) {
      this.toast.hidden = true
      this.toast.innerHTML = ''
      this.toastKey = ''
      this.toast.classList.remove('live')
    }
    if (this.flash.className !== view.flash) this.flash.className = view.flash
  }

  /** Eases a displayed number toward its target so totals roll instead of jumping. */
  private roll(name: string, target: number, dt: number): number {
    const cur = this.shown[name]
    if (cur == null || target < cur) {
      this.shown[name] = target
      return target
    }
    const next = cur + (target - cur) * (1 - Math.exp(-14 * dt))
    this.shown[name] = target - next < 0.5 ? target : next
    return Math.round(this.shown[name])
  }

  private renderHud(hud: HudModel | null, dt: number): void {
    if (!hud) {
      this.hud.innerHTML = ''
      this.hudKey = ''
      this.shown = {}
      this.prev = {}
      delete this.hud.dataset.encounter
      delete this.hud.dataset.coach
      delete this.hud.dataset.practice
      return
    }
    const key = `${hud.aiming}|${hud.overview}|${hud.playing}|${hud.showFlip}|${hud.maxSpecials}|${hud.maxTilts}|${hud.maxNudges}|${hud.core}|${hud.jackpot}|${!!hud.practice}`
    if (key !== this.hudKey) {
      this.hudKey = key
      this.prev = {}
      this.hud.innerHTML = `
        <div class="hud-res">
          <div class="chip res shell" data-hud="shell-wrap"><span>Shell</span><b data-hud="shell"></b></div>
          <div class="chip res gears"><span>Gears</span><b data-hud="gears"></b></div>
          <div class="chip dim score"><span>Score</span><b data-hud="score"></b></div>
        </div>
        <div class="hud-mult">
          <div class="chip mult" data-hud="mult-wrap">
            <span>Multiplier</span><b data-hud="mult"></b>
            <div class="meter" title="Jackpot pockets pay out once the multiplier reaches ${esc(hud.jackpotAt)}"><i data-hud="mult-fill"></i></div>
            <em class="meter-label">Hot at ${esc(hud.jackpotAt)}</em>
          </div>
          <div class="chip combo" data-hud="combo-wrap"><span>Combo</span><b data-hud="combo"></b><div class="meter thin"><i data-hud="combo-fill"></i></div></div>
        </div>
        <div class="hud-btns">
          <button class="round-btn mobile-journal" data-act="journal" aria-label="Open build and route journal">${ico('map')}</button>
          <button class="round-btn util-btn" data-act="mute" aria-label="Toggle sound"><span data-hud="mute"></span></button>
          <button class="round-btn esc" data-act="pause-btn" title="Pause" aria-label="Pause">${ico('pause')}<kbd>Esc</kbd></button>
        </div>
        <div class="mobile-place"><b data-hud="mobile-title"></b><span data-hud="mobile-status"></span>${encounterHtml('mobile')}${coachHtml('mobile')}</div>
        <aside class="hud-info">
          <div class="place">
            <div class="kicker" data-hud="kicker"></div>
            <h2 data-hud="title"></h2>
            <p class="blurb" data-hud="blurb"></p>
            <p class="gate" data-hud="gate"></p>
            <p class="core" data-hud="core"></p>
            <p class="gate" data-hud="jackpot"></p>
            <p class="journey" data-hud="journey"></p>
            <p class="anomaly" data-hud="anomaly"></p>
            <p class="objective" data-hud="objective"></p>
          </div>
          <div class="chip dim build"><span>Build</span><b data-hud="synergy"></b></div>
          <button class="texty seed-btn" data-act="copy-seed" title="Copy seed"><span class="ico-hash">#</span><span data-hud="seed"></span></button>
          ${encounterHtml('desktop')}
          ${coachHtml('desktop')}
        </aside>
        ${hud.practice ? '<div class="practice-toolbar" aria-label="Practice controls"><span>Practice</span><button class="btn" data-act="lab-retry">Restart</button><button class="btn" data-act="lab-configure">Configure</button><button class="btn practice-journal" data-act="journal">Journal</button></div>' : ''}
        <div class="tally" data-hud="tally"><span>This drop</span><b data-hud="earned"></b></div>
        <div class="controls ${hud.aiming ? 'aim-controls' : 'drop-controls'}">
          ${hud.playing && hud.aiming ? `<button class="release-sphere btn btn-go" data-act="launch">${ico('down', 'release-symbol')}<span>Release<small class="pointer-only">Mouse or ← → to aim</small><small class="touch-only">or drag the board, lift to drop</small></span><kbd>Enter</kbd></button>` : ''}
          ${hud.playing && hud.aiming ? `<button class="machine-overview btn ${hud.overview ? 'selected' : ''}" data-act="overview" aria-pressed="${hud.overview}">${ico('eye')}<kbd>V</kbd><span>${hud.overview ? 'Back' : 'Inspect'}</span></button>` : ''}
          ${hud.playing && !hud.aiming ? keyBtn('nudge-left', 'A', 'Nudge', 'nudges') : ''}
          ${hud.playing && !hud.aiming && hud.maxSpecials > 0 ? keyBtn('special', 'Space', esc(hud.specialName), 'specials') : ''}
          ${hud.playing && !hud.aiming && hud.maxTilts > 0 ? keyBtn('tilt', 'Q', 'Tilt', 'tilts') : ''}
          ${hud.playing && !hud.aiming ? `<button class="key overdrive-key" data-act="overdrive" data-hud="overdrive" title="Strike five different pegs to charge. Overdrive doubles payouts for three seconds and lifts the sphere."><span class="drive-fill" data-hud="drive-fill"></span>${ico('bolt', 'drive-ico')}<kbd>E</kbd><span class="lbl" data-hud="drive-label">Overdrive</span><span class="drive-status" data-hud="drive-status"></span></button>` : ''}
          ${hud.playing && !hud.aiming && hud.showFlip ? keyBtn('flip', 'F', 'Flip gate', '') : ''}
          ${hud.playing && !hud.aiming ? keyBtn('nudge-right', 'D', 'Nudge', 'nudges') : ''}
        </div>`
    }
    const q = (name: string) => this.hud.querySelector(`[data-hud="${name}"]`)
    const set = (name: string, text: string) => {
      const el = q(name)
      if (el && el.textContent !== text) el.textContent = text
    }
    const changed = (name: string, v: string | number) => {
      const was = this.prev[name]
      this.prev[name] = v
      return was !== undefined && was !== v ? (was as number) : null
    }

    const gears = this.roll('gears', hud.gears, dt)
    set('gears', String(gears))
    const gearsWas = changed('gears-t', hud.gears)
    if (gearsWas !== null && hud.gears > gearsWas) bump(q('gears'), 1.18)
    set('score', String(this.roll('score', hud.score, dt)))
    const earned = this.roll('earned', hud.earned, dt)
    set('earned', `+${earned}`)
    const earnedWas = changed('earned-t', hud.earned)
    if (earnedWas !== null && hud.earned > earnedWas) bump(q('earned'), 1.22)
    const tally = q('tally') as HTMLElement | null
    if (tally) tally.classList.toggle('show', hud.tally)

    set('mult', hud.mult)
    if (changed('mult', hud.mult) !== null) bump(q('mult'), 1.35)
    const multWrap = q('mult-wrap') as HTMLElement | null
    if (multWrap) multWrap.classList.toggle('hot', hud.multHot)
    const multFill = q('mult-fill') as HTMLElement | null
    if (multFill) multFill.style.transform = `scaleX(${hud.multT.toFixed(3)})`

    set('combo', hud.combo ? String(hud.combo) : '—')
    if (changed('combo', hud.combo) !== null && hud.combo > 1) bump(q('combo'), 1.15 + Math.min(0.35, hud.combo * 0.02))
    const comboWrap = q('combo-wrap') as HTMLElement | null
    if (comboWrap) comboWrap.dataset.heat = hud.combo >= 15 ? '3' : hud.combo >= 8 ? '2' : hud.combo >= 3 ? '1' : '0'
    const comboFill = q('combo-fill') as HTMLElement | null
    if (comboFill) comboFill.style.transform = `scaleX(${hud.comboT.toFixed(3)})`

    set('seed', hud.seed)
    set('kicker', hud.kicker)
    set('title', hud.title)
    set('mobile-title', hud.title)
    set('mobile-status', hud.core || hud.gate || hud.journey)
    set('blurb', hud.blurb)
    set('gate', hud.gate)
    set('synergy', hud.synergy || '—')
    set('core', hud.core)
    set('jackpot', hud.jackpot)
    set('journey', hud.journey)
    set('objective', hud.objective)
    set('anomaly', hud.anomaly)
    const muteKey = hud.muted ? 'off' : 'on'
    if (this.prev.mute !== muteKey) { this.prev.mute = muteKey; const m = q('mute'); if (m) m.innerHTML = ico(hud.muted ? 'mute' : 'sound') }
    const encounterState = hud.encounter ? 'true' : 'false'
    const coachState = hud.coach ? 'true' : 'false'
    if (this.hud.dataset.encounter !== encounterState) this.hud.dataset.encounter = encounterState
    if (this.hud.dataset.coach !== coachState) this.hud.dataset.coach = coachState
    const practiceState = hud.practice ? 'true' : 'false'
    if (this.hud.dataset.practice !== practiceState) this.hud.dataset.practice = practiceState
    for (const variant of ['desktop', 'mobile']) {
      const encounter = q(`${variant}-encounter`) as HTMLElement | null
      if (encounter) {
        encounter.hidden = !hud.encounter
        encounter.classList.toggle('complete', !!hud.encounter?.complete)
      }
      if (hud.encounter) {
        const e = hud.encounter
        set(`${variant}-encounter-title`, e.title)
        set(`${variant}-encounter-instruction`, e.complete ? hud.practice ? 'Practice objective complete' : 'Bounty secured' : e.instruction)
        set(`${variant}-encounter-count`, `${Math.min(e.progress, e.target)} / ${e.target}`)
        set(`${variant}-encounter-reward`, e.reward)
        set(`${variant}-encounter-returns`, `${e.returns}/${e.maxReturns} safe return${e.maxReturns === 1 ? '' : 's'}`)
        set(`${variant}-encounter-hint`, e.hint)
        const sequence = q(`${variant}-encounter-sequence`) as HTMLElement | null
        const sequenceKey = `${e.title}|${e.progress}|${e.target}|${e.linked?.join(',')}|${e.targets?.join(',')}`
        if (sequence && this.prev[`${variant}-encounter-sequence`] !== sequenceKey) {
          this.prev[`${variant}-encounter-sequence`] = sequenceKey
          sequence.innerHTML = encounterSequence(e)
        }
      }
      const coach = q(`${variant}-coach`) as HTMLElement | null
      if (coach) coach.hidden = !hud.coach
      if (hud.coach) {
        set(`${variant}-coach-step`, `${hud.coach.step} / 3`)
        const mobile = variant === 'mobile'
        const action = hud.coach.action
        const mobileTitle = action === 'launch' ? 'Release' : action === 'nudge' ? 'Nudge' : action === 'overdrive' ? 'Overdrive' : hud.coach.title
        const mobileText = action === 'launch' ? 'Aim for your first peg. Tap Release sphere.'
          : action === 'nudge' ? 'A / D or Nudge pushes toward a useful lane.'
            : action === 'overdrive' ? hud.overdriveReady ? 'E / Overdrive lifts the sphere: 2× payouts for 3s.' : 'Hit five different pegs to charge Overdrive.'
              : hud.coach.text
        set(`${variant}-coach-title`, mobile ? mobileTitle : hud.coach.title)
        set(`${variant}-coach-text`, mobile ? mobileText : hud.coach.text)
      }
    }
    const coachAction = hud.coach?.action ?? ''
    if (this.prev['coach-action'] !== coachAction) {
      this.prev['coach-action'] = coachAction
      this.hud.querySelectorAll('.coach-target').forEach(el => el.classList.remove('coach-target'))
      const targets = coachAction === 'nudge' ? ['nudge-left', 'nudge-right'] : [coachAction]
      for (const action of targets) if (action) this.hud.querySelectorAll('[data-act]').forEach(el => {
        if ((el as HTMLElement).dataset.act === action) el.classList.add('coach-target')
      })
    }
    const drive = q('overdrive') as HTMLButtonElement | null
    if (drive) {
      const active = hud.overdriveTime > 0
      drive.disabled = !hud.overdriveReady
      drive.classList.toggle('ready', hud.overdriveReady)
      drive.classList.toggle('active', active)
      drive.setAttribute('aria-label', active ? `Overdrive active, ${hud.overdriveTime.toFixed(1)} seconds` : hud.overdriveReady ? 'Activate Overdrive. Double payouts for three seconds.' : `Overdrive charging, ${Math.round(hud.charge * 100)} percent`)
      set('drive-label', active ? '2× OVERDRIVE' : 'Overdrive')
      set('drive-status', active ? `${hud.overdriveTime.toFixed(1)}s` : hud.overdriveReady ? 'READY' : hud.overdriveUses <= 0 ? 'SPENT' : `${Math.round(hud.charge * 100)}%`)
      const fill = q('drive-fill') as HTMLElement | null
      if (fill) fill.style.transform = `scaleX(${Math.max(0, Math.min(1, active ? hud.overdriveTime / 3 : hud.charge))})`
    }

    const shellKey = `${hud.shell}/${hud.shellMax}`
    const lostShell = changed('shell', hud.shell)
    if (this.prev['shell-html'] !== shellKey) {
      this.prev['shell-html'] = shellKey
      const shell = q('shell')
      if (shell) shell.innerHTML = `${pips(hud.shell, hud.shellMax, 'shell-pips')}<em>${hud.shell}/${hud.shellMax}</em>`
    }
    if (lostShell !== null && hud.shell < lostShell) {
      const wrap = q('shell-wrap')
      shake(wrap)
      wrap?.classList.remove('hurt')
      void (wrap as HTMLElement | null)?.offsetWidth
      wrap?.classList.add('hurt')
    }

    const setPips = (slot: string, on: number, max: number) => {
      const k = `pips-${slot}`
      const v = `${on}/${max}`
      if (this.prev[k] === v) return
      const was = this.prev[k]
      this.prev[k] = v
      this.hud.querySelectorAll(`[data-pips="${slot}"]`).forEach((el) => {
        el.innerHTML = pips(on, max)
        if (was !== undefined) bump(el.closest('button'), 0.94)
      })
    }
    setPips('nudges', hud.nudges, hud.maxNudges)
    setPips('specials', hud.specials, hud.maxSpecials)
    setPips('tilts', hud.tilts, hud.maxTilts)
    const flip = this.hud.querySelector('[data-act="flip"]') as HTMLButtonElement | null
    if (flip) {
      const spent = hud.flips <= 0
      if (flip.disabled !== spent) {
        flip.disabled = spent
        const label = flip.querySelector('.lbl')
        if (label) label.textContent = spent ? 'Gate spent' : 'Flip gate'
        if (spent) bump(flip, 0.92)
      }
    }
    const disable = (act: string, off: boolean, cooldown = 0) =>
      this.hud.querySelectorAll<HTMLButtonElement>(`[data-act="${act}"]`).forEach((b) => {
        const cooling = cooldown > 0 && !off
        b.disabled = off || cooling
        b.classList.toggle('cooling', cooling)
        if (cooling) {
          const label = b.querySelector('.lbl')?.textContent ?? 'Control'
          b.setAttribute('aria-label', `${label} recovering, ${cooldown.toFixed(1)} seconds`)
          b.title = `${label} recovering · ${cooldown.toFixed(1)}s`
        } else {
          b.removeAttribute('aria-label')
          b.removeAttribute('title')
        }
      })
    disable('nudge-left', hud.nudges <= 0, hud.nudgeCooldown)
    disable('nudge-right', hud.nudges <= 0, hud.nudgeCooldown)
    disable('special', hud.specials <= 0, hud.specialCooldown)
    disable('tilt', hud.tilts <= 0, hud.specialCooldown)
  }
}

// ---------------------------------------------------------------------------
// Visual vocabulary: icons, gems, chunky buttons.

const ICONS: Record<string, string> = {
  play: '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z"/>',
  pause: '<rect x="6" y="5" width="4.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.5"/>',
  gear: '<path d="M10.3 2h3.4l.5 2.6c.7.2 1.3.5 1.9.9l2.3-1.4 2.4 2.4-1.4 2.3c.4.6.7 1.2.9 1.9l2.7.5v3.4l-2.7.5c-.2.7-.5 1.3-.9 1.9l1.4 2.3-2.4 2.4-2.3-1.4c-.6.4-1.2.7-1.9.9l-.5 2.8h-3.4l-.5-2.8c-.7-.2-1.3-.5-1.9-.9l-2.3 1.4-2.4-2.4 1.4-2.3c-.4-.6-.7-1.2-.9-1.9L2 13.7v-3.4l2.7-.5c.2-.7.5-1.3.9-1.9L4.2 5.6l2.4-2.4 2.3 1.4c.6-.4 1.2-.7 1.9-.9L10.3 2ZM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"/>',
  help: '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 14.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm.1-10.4c-2.3 0-3.9 1.3-4.1 3.4h2.5c.1-.8.7-1.3 1.6-1.3.9 0 1.5.5 1.5 1.3 0 .7-.3 1.1-1.3 1.7-1.1.7-1.6 1.5-1.5 2.8v.5h2.4v-.4c0-.8.3-1.1 1.3-1.7 1.1-.7 1.8-1.6 1.8-2.9 0-2-1.7-3.4-4.2-3.4Z"/>',
  book: '<path d="M4 4.5C4 3.7 4.7 3 5.5 3H11v16H5.5A1.5 1.5 0 0 0 4 20.5v-16ZM13 3h5.5c.8 0 1.5.7 1.5 1.5v16a1.5 1.5 0 0 0-1.5-1.5H13V3Z"/>',
  list: '<rect x="3" y="4" width="18" height="4" rx="2"/><rect x="3" y="10" width="18" height="4" rx="2"/><rect x="3" y="16" width="12" height="4" rx="2"/>',
  star: '<path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7L12 2Z"/>',
  check: '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.6 6.3-6 6-2.3-2.3-1.6 1.6 3.9 3.9 7.6-7.6-1.6-1.6Z"/>',
  flask: '<path d="M9 2h6v2h-1v5.2l5.6 9.6A2 2 0 0 1 17.9 22H6.1a2 2 0 0 1-1.7-3.2L10 9.2V4H9V2Zm-.9 13-2 3.5c-.2.3 0 .5.3.5h11.2c.3 0 .5-.2.3-.5l-2-3.5H8.1Z"/>',
  calendar: '<path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2ZM5 9v10h14V9H5Zm7 1.5 1.3 2.7 3 .4-2.2 2 .6 2.9-2.7-1.5-2.7 1.5.6-2.9-2.2-2 3-.4 1.3-2.7Z"/>',
  heart: '<path d="M12 21 3.6 12.6A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 8.4 6.6L12 21Z"/>',
  cog: '<path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM10.6 1h2.8l.6 3a8 8 0 0 1 2.3 1l2.5-1.8 2 2-1.8 2.5c.4.7.8 1.5 1 2.3l3 .6v2.8l-3 .6c-.2.8-.6 1.6-1 2.3l1.8 2.5-2 2-2.5-1.8c-.7.4-1.5.8-2.3 1l-.6 3h-2.8l-.6-3a8 8 0 0 1-2.3-1L5.2 20.8l-2-2L5 16.3c-.4-.7-.8-1.5-1-2.3l-3-.6v-2.8l3-.6c.2-.8.6-1.6 1-2.3L3.2 5.2l2-2L7.7 5c.7-.4 1.5-.8 2.3-1l.6-3Z"/>',
  dust: '<path d="M12 1.5c.6 4.8 2.7 6.9 7.5 7.5-4.8.6-6.9 2.7-7.5 7.5-.6-4.8-2.7-6.9-7.5-7.5 4.8-.6 6.9-2.7 7.5-7.5Zm6.5 13c.3 2.3 1.2 3.2 3.5 3.5-2.3.3-3.2 1.2-3.5 3.5-.3-2.3-1.2-3.2-3.5-3.5 2.3-.3 3.2-1.2 3.5-3.5Z"/>',
  shard: '<path d="M12 1.5 20 9l-8 13.5L4 9l8-7.5Zm0 4L8 9.2l4 7.1 4-7.1-4-3.7Z"/>',
  lock: '<path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2.5A2.5 2.5 0 0 0 9.5 7v3h5V7A2.5 2.5 0 0 0 12 4.5Z"/>',
  back: '<path d="M14.6 4.6 7.2 12l7.4 7.4 2.1-2.1L11.4 12l5.3-5.3-2.1-2.1Z"/>',
  next: '<path d="m9.4 4.6 7.4 7.4-7.4 7.4-2.1-2.1 5.3-5.3-5.3-5.3 2.1-2.1Z"/>',
  close: '<path d="m6.3 4.2 5.7 5.7 5.7-5.7 2.1 2.1-5.7 5.7 5.7 5.7-2.1 2.1-5.7-5.7-5.7 5.7-2.1-2.1 5.7-5.7-5.7-5.7 2.1-2.1Z"/>',
  refresh: '<path d="M12 4a8 8 0 0 1 7.4 5H22l-3.5 4.5L15 9h2.2A5.6 5.6 0 0 0 6.6 10.6L4.3 9.9A8 8 0 0 1 12 4Zm-6.5 6.5L9 15H6.8a5.6 5.6 0 0 0 10.6-1.6l2.3.7A8 8 0 0 1 4.6 15H2l3.5-4.5Z"/>',
  share: '<path d="M17 2a3.5 3.5 0 1 1-2.6 5.8L9.9 10.4a3.5 3.5 0 0 1 0 3.2l4.5 2.6A3.5 3.5 0 1 1 13.5 18l-4.6-2.6a3.5 3.5 0 1 1 0-6.8L13.5 6A3.5 3.5 0 0 1 17 2Z"/>',
  trophy: '<path d="M6 2h12v2h3v3a5 5 0 0 1-4.3 5A6 6 0 0 1 13 15v3h4v4H7v-4h4v-3a6 6 0 0 1-3.7-3A5 5 0 0 1 3 7V4h3V2Zm0 4H5v1a3 3 0 0 0 1.2 2.4C6 8.9 6 8.4 6 8V6Zm12 0v2c0 .4 0 .9-.2 1.4A3 3 0 0 0 19 7V6h-1Z"/>',
  shield: '<path d="M12 2 20 5v6.5c0 5-3.4 9-8 10.5-4.6-1.5-8-5.5-8-10.5V5l8-3Z"/>',
  flame: '<path d="M12 2c1 3.6 5.5 5.8 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.3-4.1 2.4-5.4.2 1.7.9 3 2.1 3.6-.6-3.5.2-6.3 1-9.2Z"/>',
  sound: '<path d="M3 9h4l5-4.5v15L7 15H3V9Zm13.5-1.8a6.5 6.5 0 0 1 0 9.6l-1.4-1.4a4.5 4.5 0 0 0 0-6.8l1.4-1.4Z"/>',
  mute: '<path d="M3 9h4l5-4.5v15L7 15H3V9Zm13.3.3 1.7 1.7 1.7-1.7 1.4 1.4-1.7 1.7 1.7 1.7-1.4 1.4-1.7-1.7-1.7 1.7-1.4-1.4 1.7-1.7-1.7-1.7 1.4-1.4Z"/>',
  map: '<path d="M9 3 15 5.5 21 3v16l-6 2.5L9 19l-6 2.5v-16L9 3Zm1 2.6v11.8l4 1.7V7.3l-4-1.7Z"/>',
  wrench: '<path d="M20.7 6.6a5.5 5.5 0 0 1-7.4 6.5l-7 7a2 2 0 0 1-2.9-2.9l7-7a5.5 5.5 0 0 1 6.5-7.4l-3.2 3.2.8 2.3 2.3.8 3.9-2.5Z"/>',
  bag: '<path d="M8 7V6a4 4 0 0 1 8 0v1h3l1 14H4L5 7h3Zm2 0h4V6a2 2 0 0 0-4 0v1Z"/>',
  bolt: '<path d="M13.5 1.5 4 13.5h6l-1.5 9 9.5-12h-6l1.5-9Z"/>',
  skull: '<path d="M12 2a9 9 0 0 1 9 9c0 3-1.5 5-3.5 6.3V21h-3v-2h-1v2h-3v-2h-1v2h-3v-3.7C4.5 16 3 14 3 11a9 9 0 0 1 9-9Zm-3.5 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
  eye: '<path d="M12 5c5 0 8.7 3.5 10 7-1.3 3.5-5 7-10 7S3.3 15.5 2 12c1.3-3.5 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z"/>',
  down: '<path d="M10.5 3h3v12.2l4-4 2.1 2.1-7.6 7.6-7.6-7.6 2.1-2.1 4 4V3Z"/>',
  flag: '<path d="M5 2h2v1h11l-2.5 5L18 13H7v9H5V2Z"/>',
  sparkle: '<path d="M12 2c.8 5.5 4.5 9.2 10 10-5.5.8-9.2 4.5-10 10-.8-5.5-4.5-9.2-10-10 5.5-.8 9.2-4.5 10-10Z"/>',
  crown: '<path d="m3 7 5 4 4-7 4 7 5-4-2 12H5L3 7Zm2 14h14v1.5H5V21Z"/>',
}

function ico(name: string, cls = ''): string {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.star}</svg>`
}

const TAG_TONE: Record<string, string> = {
  bounce: 'pink', combo: 'cyan', multiplier: 'gold', gravity: 'violet', control: 'blue', economy: 'green',
  risk: 'red', portal: 'violet', destruction: 'orange', precision: 'cyan', luck: 'green', magnet: 'gold',
}

const KIND_TONE: Record<string, string> = {
  echo: 'pink', spring: 'pink', crown: 'orange', heart: 'red', feather: 'cyan', jets: 'blue', gate: 'orange', compass: 'blue',
  coil: 'cyan', shell: 'green', portal: 'violet', gravity: 'violet', forge: 'orange', coin: 'gold', prism: 'cyan', star: 'gold', oracle: 'violet',
}

function toneOf(tags: string): string {
  const first = tags.split('·')[0]?.trim().toLowerCase() ?? ''
  return TAG_TONE[first] ?? 'blue'
}

function tagChips(tags: string): string {
  const list = tags.split('·').map(t => t.trim()).filter(Boolean)
  return list.length ? `<span class="chips">${list.map(t => `<i class="chip-tag t-${TAG_TONE[t.toLowerCase()] ?? 'blue'}">${esc(t)}</i>`).join('')}</span>` : ''
}

function gem(kind: string, tone: string, cls = ''): string {
  return `<span class="gem t-${tone} ${cls}" aria-hidden="true">${artifactArt(kind)}</span>`
}

function orb(colors: [string, string, string], cls = ''): string {
  return `<i class="orb ${cls}" style="--oa:${colors[0]};--ob:${colors[1]};--oc:${colors[2]}"></i>`
}

function compact(n: number): string {
  if (n < 10000) return n.toLocaleString('en-US')
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi']
  let v = n
  let u = -1
  while (v >= 1000 && u < units.length - 1) { v /= 1000; u++ }
  return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}${units[u]}`
}

function toggle(id: string, label: string, on: boolean, icon = 'sparkle'): string {
  return `<button class="toggle ${on ? 'on' : ''}" data-act="toggle:${id}" role="switch" aria-checked="${on}">${ico(icon)}<span>${esc(label)}</span><i class="sw"></i></button>`
}

function screen(cls: string, title: string, body: string, opts: { back?: string; kicker?: string; extra?: string } = {}): string {
  return `<article class="screen ${cls}"><header class="screen-head">${opts.back ? `<button class="round-btn back" data-act="${opts.back}" aria-label="Back">${ico('back')}</button>` : '<span class="head-spacer"></span>'}<div class="screen-title">${opts.kicker ? `<small>${esc(opts.kicker)}</small>` : ''}<h2>${title}</h2></div>${opts.extra ?? '<span class="head-spacer"></span>'}</header><div class="screen-body">${body}</div></article>`
}

function wallet(kind: 'dust' | 'shard' | 'gears', value: number, label = ''): string {
  const icon = kind === 'dust' ? 'dust' : kind === 'shard' ? 'shard' : 'cog'
  return `<span class="pill ${kind}" title="${esc(label || kind)}">${ico(icon)}<b>${compact(value)}</b></span>`
}

// ---------------------------------------------------------------------------
// HUD fragments

function keyBtn(act: string, key: string, label: string, pipSlot: string): string {
  const touch = act === 'nudge-left' ? 'Nudge' : act === 'nudge-right' ? 'Nudge' : act === 'flip' ? 'Gate' : label
  const icon = act === 'nudge-left' ? 'back' : act === 'nudge-right' ? 'next' : act === 'flip' ? 'flag' : act === 'tilt' ? 'refresh' : 'sparkle'
  return `<button class="key key-${act}" data-act="${act}">${ico(icon, 'key-ico')}<kbd>${key}</kbd><span class="lbl">${label}</span><span class="touch-label">${touch}</span>${pipSlot ? `<span class="key-pips" data-pips="${pipSlot}"></span>` : ''}</button>`
}

function encounterSequence(e: EncounterModel): string {
  const forge = /heartforge|alternate/i.test(`${e.title} ${e.instruction}`)
  return Array.from({ length: Math.max(1, Math.min(8, e.target)) }, (_, i) => {
    const credited = forge ? i < e.progress : !!e.linked?.includes(i)
    const valid = forge ? i === e.progress : e.targets ? e.targets.includes(i) : !credited
    const label = forge ? i % 2 === 0 ? 'I' : 'II' : ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i]
    return `<i class="${credited ? 'struck' : valid ? 'next' : ''}">${label}</i>`
  }).join('')
}

function encounterHtml(variant: string): string {
  return `<section class="encounter-instrument ${variant}-encounter" data-hud="${variant}-encounter" hidden aria-label="Guardian objective"><div class="encounter-heading"><span>Guardian</span><b data-hud="${variant}-encounter-title"></b></div><strong data-hud="${variant}-encounter-instruction"></strong><div class="encounter-progress"><span class="encounter-sequence" data-hud="${variant}-encounter-sequence" aria-hidden="true"></span><b data-hud="${variant}-encounter-count"></b></div><p class="encounter-target" data-hud="${variant}-encounter-hint"></p><div class="encounter-contract"><span class="encounter-bounty" data-hud="${variant}-encounter-reward"></span><span class="encounter-returns" data-hud="${variant}-encounter-returns"></span></div><button class="texty encounter-rules" data-act="journal">Guardian rules <kbd>J</kbd></button></section>`
}

function coachHtml(variant: string): string {
  return `<aside class="workshop-coach ${variant}-coach" data-hud="${variant}-coach" hidden aria-label="Workshop tips" aria-live="polite" aria-atomic="true"><div class="coach-heading"><span data-hud="${variant}-coach-step"></span><b data-hud="${variant}-coach-title"></b><button class="coach-dismiss" data-act="coach-dismiss" aria-label="Dismiss Workshop tips"><span aria-hidden="true">×</span></button></div><p data-hud="${variant}-coach-text"></p></aside>`
}

function encounterBriefing(e: EncounterModel, practice = false): string {
  return `<section class="guardian-briefing panel ${e.complete ? 'complete' : ''}"><div class="gb-head">${ico('bolt')}<div><small>${practice ? 'Practice guardian' : 'Optional guardian'}</small><h3>${esc(e.title)}</h3></div><b class="gb-count">${Math.min(e.progress, e.target)} / ${e.target}</b></div><strong>${esc(e.complete ? practice ? 'Practice objective complete' : 'Bounty secured' : e.instruction)}</strong><span class="encounter-sequence" aria-hidden="true">${encounterSequence(e)}</span><p>${esc(e.hint)}</p><div class="guardian-terms"><span><b>${practice ? 'Objective' : 'Bounty'}</b>${esc(e.reward)}</span><span><b>Safety reserve</b>${e.returns} of ${e.maxReturns} safe return${e.maxReturns === 1 ? '' : 's'} remaining</span></div><p class="fine">Once per machine, entering a safe collector before 75 seconds returns the sphere while an unfinished objective keeps its progress. Gutters still follow normal hazard rules. After the return is spent or its time window expires, collectors settle the drop normally. ${practice ? 'Practice records the objective without awarding expedition rewards.' : 'The bounty is optional: an incomplete objective never blocks the normal route.'}</p></section>`
}

// ---------------------------------------------------------------------------
// Shared cards

function choiceHtml(c: ChoiceCard, act: 'pick' | 'buy' | 'event'): string {
  const kind = artifactKind(c.name, c.tags)
  const tone = toneOf(c.tags)
  const cta = !c.afford ? (act === 'buy' ? 'Not enough gears' : 'Unavailable') : act === 'buy' ? 'Buy' : act === 'event' ? 'Choose' : 'Take'
  return `<button class="card offer t-${tone} ${c.synergy ? 'has-syn' : ''}" data-act="${act}:${c.index}" style="--i:${c.index}" ${c.afford ? '' : 'disabled'}>
      <kbd class="num">${c.index + 1}</kbd>
      ${gem(kind, tone, 'relic-art')}
      <span class="offer-body">
        <span class="offer-top"><h3>${esc(c.name)}</h3>${c.price ? `<em class="price">${ico('cog')}${c.price}</em>` : ''}</span>
        ${tagChips(c.tags)}
        <p>${esc(c.text)}</p>
        ${c.synergy ? `<span class="syn">${ico('sparkle')}${esc(c.synergy)}</span>` : ''}
      </span>
      <span class="offer-action">${cta}</span>
    </button>`
}

function block(title: string, items: CollItem[], cls = ''): string {
  return `<section class="block ${cls}"><h3 class="section-h">${esc(title)}</h3>${items.length ? `<ul class="archive">${items.map(item => `<li class="${item.known ? '' : 'unknown'}">${item.known ? gem(artifactKind(item.name), KIND_TONE[artifactKind(item.name)] ?? 'blue', 'mini') : `<span class="gem mini locked">${ico('lock')}</span>`}<div><b>${esc(item.known ? item.name : 'Unknown')}</b><span>${esc(item.text)}</span></div></li>`).join('')}</ul>` : '<p class="empty">Nothing yet.</p>'}</section>`
}

function stat(label: string, value: string, icon: string, tone = ''): string {
  return `<div class="stat ${tone}">${ico(icon)}<span>${esc(label)}</span><b>${value}</b></div>`
}

// ---------------------------------------------------------------------------
// Laboratory and reports

function machineSchematic(id: string): string {
  const pegs = Array.from({ length: 16 }, (_, i) => `<circle cx="${22 + (i % 4) * 22 + (Math.floor(i / 4) % 2) * 7}" cy="${41 + Math.floor(i / 4) * 21}" r="2.6" fill="currentColor" opacity=".8"/>`).join('')
  const drawings: Record<string, string> = {
    workshop: `<path d="M27 38h66M28 49l15 18m50-18L78 67M28 94l18-17m47 17L78 77"/>${pegs}`,
    garden: '<path d="M29 101V52m15 38V35m32 55V35m15 66V52M29 70C5 50 42 46 29 70Zm15-16C20 31 60 29 44 54Zm32 0c-24-23 16-25 0 0Zm15 16c-24-20 13-24 0 0Z"/><circle cx="60" cy="72" r="11"/>',
    furnace: '<path d="M29 93V46h62v47M38 93V62h44v31m-44-40h44M45 99c-14-10-7-23 2-30-3 14 7 15 5 26m13 4c-14-10-7-23 2-30-3 14 7 15 5 26M39 37v-8m21 8V24m21 13v-8"/>',
    press: '<path d="M31 29h58v16H31zm10 17v27m38-27v27M28 73h64v14H28zm8 27h48M44 87v13m32-13v13M55 21h10m-5-7v7"/><circle cx="60" cy="59" r="5"/>',
    bellkeeper: '<path d="M20 79h22l-3-6V58a8 8 0 0 0-16 0v15l-3 6Zm29-27h22l-3-6V31a8 8 0 0 0-16 0v15l-3 6Zm29 27h22l-3-6V58a8 8 0 0 0-16 0v15l-3 6Z"/>',
    heartforge: '<path d="M24 36h24v14H24zm48 0h24v14H72zM30 50v29m12-29v29m36-29v29m12-29v29M22 79h28v15H22zm48 0h28v15H70zM49 43h22m-22 43h22"/>',
    gravity: '<circle cx="60" cy="64" r="13"/><ellipse cx="60" cy="64" rx="38" ry="15" transform="rotate(-30 60 64)"/><ellipse cx="60" cy="64" rx="38" ry="15" transform="rotate(50 60 64)" opacity=".45"/><circle cx="85" cy="40" r="4" fill="currentColor"/>',
    grinder: '<circle cx="60" cy="64" r="28"/><circle cx="60" cy="64" r="12"/><path d="M60 27v9m0 56v9M23 64h9m56 0h9M34 38l7 7m38 38 7 7M34 90l7-7m38-38 7-7"/>',
  }
  return `<svg class="machine-schematic" viewBox="0 0 120 128" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[id] ?? drawings.workshop}</svg>`
}

function laboratoryHtml(lab: LabModel): string {
  const sphereColors: Record<string, [string, string, string]> = {
    rubber: ['#ffd2c4', '#ff6a52', '#8a2418'], prism: ['#7eefe6', '#e7fff8', '#1c6e78'], void: ['#c4b6ff', '#2a2144', '#090712'],
  }
  return `<article class="screen laboratory"><header class="screen-head"><button class="round-btn back" data-act="lab-exit" aria-label="Return to hub">${ico('back')}</button><div class="screen-title"><small>Practice · no rewards, no risk</small><h2>Laboratory</h2></div><span class="head-spacer"></span></header><div class="screen-body">
    <h3 class="section-h">1 · Machine</h3>
    <div class="lab-machines">${lab.machines.map(m => `<button class="lab-machine ${m.selected ? 'selected' : ''}" data-act="lab-machine:${esc(m.id)}" aria-pressed="${m.selected}">${machineSchematic(m.id)}<strong>${esc(m.name)}</strong></button>`).join('')}</div>
    <div class="lab-current-machine panel"><div><small>Goal</small><h3>${esc(lab.title)}</h3><p>${esc(lab.description)}</p></div></div>
    ${lab.matched ? '<p class="lab-matched">↳ Matched to your last machine: its seed, sphere, and installed build.</p>' : ''}
    <h3 class="section-h">2 · Sphere</h3>
    <div class="lab-spheres">${lab.spheres.map(s => `<button class="lab-sphere ${s.selected ? 'selected' : ''}" data-act="lab-sphere:${esc(s.id)}" aria-pressed="${s.selected}">${orb(sphereColors[s.id] ?? sphereColors.rubber)}<span>${esc(s.name)}</span></button>`).join('')}</div>
    <h3 class="section-h">3 · Loadout</h3>
    <div class="lab-builds">${lab.builds.map(b => `<button class="lab-build ${b.selected ? 'selected' : ''}" data-act="lab-build:${esc(b.id)}" aria-pressed="${b.selected}"><strong>${esc(b.name)}</strong><span>${esc(b.text)}</span></button>`).join('')}</div>
    ${lab.best ? `<div class="lab-best panel"><small>Session best</small><b>${lab.best.earned.toLocaleString()} ${ico('cog')}</b><p>${lab.best.combo} peak combo${lab.best.objective ? ` · ${esc(lab.best.objective)}` : ''}</p></div>` : ''}
    <p class="fine">Seed ${esc(lab.seed)} · Practice keeps your expedition, shards, unlocks and records untouched.</p>
    <button class="btn btn-go big lab-start" data-act="lab-start">${ico('play')}<span>${lab.attempt > 0 ? 'Launch again' : 'Launch practice'}</span></button>
  </div></article>`
}

/** Only facts recorded by the simulation appear in this panel. */
function dropReportHtml(report: DropReport): string {
  return `<section class="drop-report panel" data-outcome="${esc(report.outcome)}" aria-label="Fall analysis"><div class="report-head">${ico('eye')}<div><small>Fall analysis</small><h3>${esc(report.title)}</h3></div></div><p class="report-detail">${esc(report.detail)}</p><div class="report-metrics"><div><small>Gears</small><b data-report="earned">${report.earned.toLocaleString()}</b></div><div><small>Time</small><b data-report="elapsed">${report.elapsed.toFixed(1)}s</b></div><div><small>Peak combo</small><b data-report="combo">${report.peakCombo}</b></div></div>${report.objective ? `<div class="report-objective ${report.objective.complete ? 'complete' : ''}"><span>${esc(report.objective.name)}</span><strong>${report.objective.progress} / ${report.objective.required} · ${report.objective.complete ? 'Complete' : 'Incomplete'}</strong></div>` : ''}<div class="report-cols"><section><h4>Shell damage</h4>${report.damage.length ? `<ol>${report.damage.map(d => `<li data-report="damage"><time>${d.time.toFixed(1)}s</time><span>${esc(d.cause)}</span><b>−${d.amount}</b></li>`).join('')}</ol>` : '<p class="empty" data-report="damage">No shell damage recorded.</p>'}</section><section><h4>Controls used</h4><ul>${report.resources.map(r => `<li data-report="resource"><span>${esc(r.label)}</span><strong>${r.used} used · ${r.remaining} left</strong></li>`).join('')}</ul></section></div><div class="report-advice">${ico('sparkle')}<p data-report="advice">${esc(report.advice)}</p></div></section>`
}

// ---------------------------------------------------------------------------
// Screens

function stageHtml(stage: StageModel): string {
  switch (stage.kind) {
    case 'none':
      return ''
    case 'hub':
      return hubHtml(stage)
    case 'stars':
      return starsHtml(stage)
    case 'quests':
      return questsHtml(stage)
    case 'laboratory':
      return laboratoryHtml(stage.lab)
    case 'practice-result': {
      const difference = stage.comparison == null ? 'First recorded attempt on this setup' : `${stage.comparison > 0 ? '+' : ''}${stage.comparison.toLocaleString()} gears versus your previous attempt`
      return screen('practice-result', `Attempt ${stage.attempt}`, `<div class="practice-comparison panel"><span>Best this session</span><b>${stage.best.toLocaleString()} ${ico('cog')}</b><small>${esc(difference)}</small></div><div class="btn-row"><button class="btn btn-go big" data-act="lab-retry">${ico('refresh')}<span>Retry <kbd>Enter</kbd></span></button></div><div class="btn-row"><button class="btn" data-act="lab-configure">${ico('gear')}<span>Configure</span></button><button class="btn" data-act="lab-exit">${ico('back')}<span>Leave</span></button></div>${dropReportHtml(stage.report)}<p class="fine">Practice attempts stay in this session. Expedition progress, shards, unlocks, and records are preserved.</p>`, { kicker: 'Practice result' })
    }
    case 'help':
      return screen('help-screen', 'How to play', `
        <div class="howto">
          <div class="howto-card t-cyan">${ico('down')}<h3>Aim & release</h3><p>Drag on the machine or use the arrows, then release. The dotted line shows your first contact. <span class="pointer-only">Enter releases · V inspects.</span></p></div>
          <div class="howto-card t-pink">${ico('next')}<h3>Nudge the fall</h3><p>Nudge left or right a few times per machine. Flip the gate once. Your sphere has a trick too.<span class="pointer-only"> A / D · F · Space · Q</span></p></div>
          <div class="howto-card t-gold">${ico('bolt')}<h3>Overdrive</h3><p>Hit five different pegs to charge it. Fire for a lift and 2× payouts for three seconds.<span class="pointer-only"> E</span></p></div>
          <div class="howto-card t-green">${ico('star')}<h3>Build</h3><p>Pick relics and upgrades between machines. Matching tags awaken bonuses. Gold pegs raise the multiplier.</p></div>
          <div class="howto-card t-red">${ico('heart')}<h3>Keep your shell</h3><p>Spikes and gutters crack it. Benches between acts repair it. Break the Grinder's five seals to win.</p></div>
          <div class="howto-card t-violet">${ico('dust')}<h3>Grow forever</h3><p>Every run earns XP and stardust for the Star Chart. Quests, feats, Trials and endless circuits keep going.</p></div>
        </div>
        <details class="fold"><summary>Guardians, saves and fair play</summary><p>The Bellkeeper asks you to ring three bells; the Heartforge to alternate relays I and II. Both are optional, and one safe return before 75 seconds keeps progress. Expeditions save between machines; a reload replays the current drop. Daily constellations and shared links use pure rules so everyone plays the same machine.</p></details>
        <div class="btn-row"><button class="btn btn-go big" data-act="back">${ico('play')}<span>Got it</span></button></div>
        <div class="btn-row"><button class="btn" data-act="coach-enable">${ico('help')}<span>Show Workshop tips again</span></button></div>`, { back: 'back', kicker: 'Field guide' })
    case 'collection':
      return screen('collection-screen', 'Archive', `<p class="fine">Pegs struck, all falls: ${stage.pegs.toLocaleString()}</p>${block('Spheres', stage.balls)}${block('Relics', stage.relics)}${block('Machine parts', stage.parts)}${block('Challenges', stage.challenges)}${stage.lore.length ? `<section class="block"><h3 class="section-h">Fragments</h3>${stage.lore.map(l => `<blockquote class="lore">${esc(l)}</blockquote>`).join('')}</section>` : ''}`, { back: 'back', kicker: 'Everything you have found' })
    case 'settings':
      return screen('settings-screen', 'Settings', `
        <div class="settings-list">
          ${toggle('shake', 'Screen shake', stage.shake, 'bolt')}
          ${toggle('particles', 'Particles', stage.particles, 'sparkle')}
          ${toggle('flash', 'Flashes', stage.flash, 'star')}
          ${toggle('large', 'Larger text', stage.large, 'book')}
          ${toggle('haptics', stage.hapticsAvailable ? 'Vibration' : 'Vibration (supported phones)', !!stage.haptics, 'heart')}
        </div>
        <label class="slider">${ico('sound')}<span>Sound</span><input type="range" min="0" max="1" step="0.05" data-volume value="${stage.volume}" /></label>
        <div class="seg-group"><span>Graphics</span><div class="seg">${(['auto', 'high', 'saver'] as const).map(q => `<button class="${stage.quality === q ? 'on' : ''}" data-act="quality:${q}" aria-pressed="${stage.quality === q}">${q === 'auto' ? 'Auto' : q === 'high' ? 'Sharp' : 'Saver'}</button>`).join('')}</div><small>Auto lowers resolution when a device struggles. Saver also halves menu frame rate.</small></div>
        <div class="seg-group speed-setting"><span>Fall speed</span><div class="seg">${[0.75, 1, 1.5, 2].map(speed => `<button class="${stage.speed === speed ? 'on' : ''}" data-act="speed:${speed}" aria-pressed="${stage.speed === speed}">${speed}×</button>`).join('')}</div><small>More time to react, or a quicker descent. Physics stays the same.</small></div>
        <div class="btn-row"><button class="btn btn-go big" data-act="back">${ico('check')}<span>Done</span></button></div>`, { back: 'back' })
    case 'choices':
      return `<div class="decision draft">
          <div class="banner"><small>${esc(stage.kicker)}</small><h2>${esc(stage.title)}</h2></div>
          <p class="build">${esc(stage.build)}</p>
          <div class="cards">${stage.cards.map(c => choiceHtml(c, 'pick')).join('')}</div>
          <button class="btn skip" data-act="skip">${esc(stage.skip)}</button>
        </div>`
    case 'shop':
      return `<div class="decision shop">
          <div class="banner gold-banner">${ico('bag')}<div><small>The Counter</small><h2>Shop</h2></div>${wallet('gears', stage.gears, 'Gears')}</div>
          <p class="build">${esc(stage.build)}</p>
          <div class="cards">${stage.cards.map(c => choiceHtml(c, 'buy')).join('') || '<p class="empty">Sold out.</p>'}</div>
          <div class="btn-row shop-actions">
            <button class="btn" data-act="reroll" ${stage.canReroll ? '' : 'disabled'}>${ico('refresh')}<span>Reroll · ${stage.reroll || 'free'}</span></button>
            <button class="btn" data-act="shop-repair" ${stage.canRepair ? '' : 'disabled'}>${ico('heart')}<span>Mend 1 · ${stage.repairCost}</span></button>
          </div>
          <button class="btn btn-go big" data-act="leave">${ico('next')}<span>Continue</span></button>
        </div>`
    case 'fork':
      return `<div class="decision fork-decision"><div class="banner"><small>Choose your path</small><h2>${esc(stage.title)}</h2></div><div class="cards fork-cards">${stage.options.map(o => `<button class="card fork ${o.risk}" data-act="fork:${o.index}" style="--i:${o.index}"><kbd class="num">${o.index + 1}</kbd><span class="fork-badge">${ico(o.risk === 'safe' ? 'shield' : 'flame')}</span><span class="risk ${o.risk}">${o.risk === 'safe' ? 'Safe' : 'Risky'}</span><h3>${esc(o.title)}</h3><p>${esc(o.detail)}</p><span class="offer-action">Go</span></button>`).join('')}</div></div>`
    case 'repair':
      return `<div class="decision repair"><div class="big-icon t-green">${ico('heart')}</div><div class="banner"><small>The Bench</small><h2>Rest & repair</h2></div><p class="lede">${esc(stage.text)}</p><button class="btn btn-go big" data-act="repair">${ico('wrench')}<span>${esc(stage.action)}</span></button></div>`
    case 'bargain':
      return `<div class="decision bargain"><div class="banner red-banner"><small>The Bargain</small><h2>Three bad ideas</h2></div><div class="cards">
          <button class="card offer t-red" data-act="bargain:shell" style="--i:0" ${stage.canShell ? '' : 'disabled'}><kbd class="num">1</kbd>${gem('heart', 'red', 'relic-art')}<span class="offer-body"><span class="offer-top"><h3>Crack the shell</h3></span><p>Lose 1 shell. Get a random relic.</p></span><span class="offer-action">Risk it</span></button>
          <button class="card offer t-orange" data-act="bargain:pay" style="--i:1" ${stage.canPay ? '' : 'disabled'}><kbd class="num">2</kbd>${gem('coin', 'orange', 'relic-art')}<span class="offer-body"><span class="offer-top"><h3>Pay 30 gears</h3></span><p>Get a random upgrade.</p></span><span class="offer-action">Pay</span></button>
          <button class="card offer t-green" data-act="bargain:walk" style="--i:2"><kbd class="num">3</kbd>${gem('shell', 'green', 'relic-art')}<span class="offer-body"><span class="offer-top"><h3>Skim the tray</h3></span><p>Take 18 gears and walk away.</p></span><span class="offer-action">Safe</span></button>
        </div></div>`
    case 'resolve':
      return `<button class="resolve ${stage.tone}" data-act="skip">
          <span class="resolve-burst" aria-hidden="true"></span>
          <b>${esc(stage.title)}</b>
          ${stage.sub ? `<span class="sub">${esc(stage.sub)}</span>` : ''}
          <strong class="earned">+<span data-count="${stage.earned}">0</span>${ico('cog')}</strong>
          <em><span class="pointer-only">Click or <kbd>Enter</kbd></span><span class="touch-only">Tap</span> to continue</em>
        </button>`
    case 'pause':
      return `<div class="modal pause-plaque"><div class="big-icon t-blue">${ico('pause')}</div><h2>Paused</h2>${stage.practice ? '<small>Practice</small>' : ''}<div class="btn-col">
          <button class="btn btn-go big" data-act="resume">${ico('play')}<span>Resume</span></button>
          <button class="btn" data-act="journal">${ico('map')}<span>${stage.practice ? 'Practice journal' : 'Build & route'} <kbd>J</kbd></span></button>
          <button class="btn" data-act="settings">${ico('gear')}<span>Settings</span></button>
          ${stage.practice ? `<button class="btn" data-act="lab-retry">${ico('refresh')}<span>Restart machine</span></button><button class="btn" data-act="lab-configure">${ico('flask')}<span>Configure</span></button><button class="btn btn-danger" data-act="lab-exit">${ico('close')}<span>Leave practice</span></button>` : `<button class="btn btn-danger" data-act="abandon">${ico('close')}<span>Abandon run</span></button>`}
        </div></div>`
    case 'runend': {
      const s = stage.summary
      const win = /falls/i.test(s.heading)
      return `<article class="screen end ${win ? 'won' : ''}"><div class="screen-body">
          <div class="end-hero"><div class="big-icon ${win ? 't-gold' : 't-blue'}">${ico(win ? 'trophy' : 'flag')}</div><small>${s.mode === 'daily' ? 'Daily constellation' : 'Expedition'} · Trial ${s.ascension}</small><h2>${esc(win ? 'Victory!' : 'Run over')}</h2><p class="lede">${esc(s.line)}</p></div>
          <div class="final"><span>Score</span><b data-count="${s.score}">0</b>${s.best ? '<em class="badge">New best!</em>' : ''}</div>
          <div class="stats">${stat('Best multiplier', esc(s.mult), 'star', 'gold')}${stat('Best combo', String(s.combo), 'bolt', 'cyan')}${stat('Circuits', String(s.clears), 'trophy', 'violet')}${stat('Shards', `+${s.shards}`, 'shard', 'green')}</div>
          ${s.progress ? progressHtml(s.progress) : ''}
          ${s.awakened.length ? `<p class="unlock">${ico('sparkle')}Unlocked: ${esc(s.awakened.join(', '))}</p>` : ''}
          ${s.challenges.length ? `<p class="unlock">${ico('check')}Challenges: ${esc(s.challenges.join(', '))}</p>` : ''}
          <p class="tempt">${esc(s.temptation)}</p>
          <button class="btn btn-go big" data-act="again">${ico('play')}<span>Play again <kbd>Enter</kbd></span></button>
          <div class="btn-row"><button class="btn" data-act="retry">${ico('refresh')}<span>Same seed</span></button><button class="btn" data-act="hub">${ico('back')}<span>Home</span></button></div>
          <div class="btn-row small">${s.canStudy ? `<button class="btn btn-violet" data-act="study">${ico('shard')}<span>${esc(s.studyLabel)}</span></button>` : ''}<button class="btn" data-act="copy-challenge">${ico('share')}<span>Challenge</span></button><button class="btn" data-act="copy-result">${ico('list')}<span>Copy result</span></button></div>
          <p class="fine">Seed ${esc(s.seed)} · ${s.commissions}/3 commissions · ${esc(s.depth)}</p>
          ${s.debrief ? `<button class="btn practice-last" data-act="practice-last">${ico('flask')}<span>Practice the last machine</span></button>${dropReportHtml(s.debrief)}` : ''}
        </div></article>`
    }
    case 'reveal':
      return `<div class="modal reveal">${gem(artifactKind(stage.name, stage.tags), toneOf(stage.tags), 'huge reveal-art')}<small>New schematic</small><h2>${esc(stage.name)}</h2>${tagChips(stage.tags)}<p>${esc(stage.text)}</p><button class="btn btn-go big" data-act="close-reveal">${ico('check')}<span>Awesome</span></button></div>`
    case 'event':
      return `<div class="decision event-decision"><div class="big-icon t-violet">${ico('eye')}</div><div class="banner"><small>A voice in the machine</small><h2>${esc(stage.title)}</h2></div><p class="lede">${esc(stage.story)}</p><div class="cards">${stage.cards.map(c => choiceHtml(c, 'event')).join('')}</div></div>`
    case 'victory':
      return `<div class="modal victory"><div class="big-icon t-gold pulse">${ico('trophy')}</div><small>Circuit ${stage.circuit} cleared</small><h2>The Grinder falls!</h2><p class="lede">${stage.score.toLocaleString()} score · your build survives</p><p class="build">${esc(stage.build)}</p>${stage.bounty ? `<p class="victory-bounty">${ico('dust')}First clear of circuit ${stage.circuit + 1}: +${stage.bounty}</p>` : ''}<div class="btn-col"><button class="btn btn-go big" data-act="bank">${ico('trophy')}<span>Bank the victory</span></button><button class="btn btn-danger big" data-act="loop">${ico('flame')}<span>Go deeper · circuit ${stage.circuit + 1}</span></button></div><p class="fine">Next circuit: ${esc(stage.pressure ?? 'more anomalies, richer payouts, dearer shops')}. Full repair and a new relic. Cleared circuits still count if the next one breaks you.</p></div>`
    case 'history':
      return screen('history-screen', 'Logbook', stage.records.length ? `<ol class="run-log">${stage.records.map(r => `<li class="panel"><div class="log-main"><small>${esc(r.mode)} · Trial ${r.trial} · ${esc(r.date)}</small><h3>${esc(r.sphere)}</h3><p>${r.drops} drops · ${r.clears} cleared · ${esc(r.seed)}</p>${r.build ? `<p class="fine">${esc(r.build)}</p>` : ''}</div><b class="log-score">${compact(r.score)}</b><div class="btn-row small"><button class="btn" data-act="replay:${r.index}">${ico('refresh')}<span>Replay</span></button><button class="btn" data-act="share:${r.index}">${ico('share')}<span>Share</span></button></div></li>`).join('')}</ol>` : '<div class="empty-state">' + ico('list') + '<p>No runs yet. Your first story is one drop away.</p></div>', { back: 'back', kicker: 'Your last 20 expeditions' })
    case 'journal':
      return journalHtml(stage)
  }
}

function journalHtml(stage: Extract<StageModel, { kind: 'journal' }>): string {
  const commissions = stage.practice ? '<p class="fine">Practice · this fall earns no expedition rewards or progression.</p>' : `<h3 class="section-h">Commissions</h3><div class="commissions">${stage.commissions.map(c => `<div class="commission panel ${c.done ? 'complete' : ''}"><span class="quest-check" aria-hidden="true">${c.done ? '✓' : ''}</span><div><b>${esc(c.name)}</b><p>${esc(c.text)}</p><span class="bar"><i style="width:${(Math.min(1, c.value / Math.max(1, c.target)) * 100).toFixed(1)}%"></i></span><small>${Math.min(c.target, c.value)}/${c.target}${c.done ? ' · Paid' : ''}</small></div></div>`).join('')}</div>`
  const route = stage.practice ? '' : `<div class="route-heading"><h3 class="section-h">Route</h3><small class="route-legend"><i class="l-current"></i>Here <i class="l-visited"></i>Visited <i class="l-future"></i>Ahead</small></div><div class="route-map">${[1, 2, 3].map(act => routeAct(stage.route, act)).join('')}</div>`
  return `<article class="screen journal"><header class="screen-head"><button class="round-btn back" data-act="close-journal" aria-label="Close journal">${ico('close')}</button><div class="screen-title"><small>${esc(stage.stats)}</small><h2>${esc(stage.title)}</h2></div><span class="head-spacer"></span></header><div class="screen-body">${stage.encounter ? encounterBriefing(stage.encounter, stage.practice) : ''}${commissions}${block('Relics', stage.relics)}${block('Upgrades', stage.upgrades)}${stage.synergies.length ? block('Resonances', stage.synergies) : ''}${route}<button class="btn btn-go big" data-act="close-journal">${ico('play')}<span>Back to ${stage.practice ? 'practice' : 'the run'}</span></button></div></article>`
}

function routeAct(all: RouteItem[], act: number): string {
  const nodes = all.filter(n => n.act === act)
  const ids = new Set(nodes.map(n => n.id))
  const edges = (n: RouteItem) => (n.nextIds ?? nodes.filter(v => n.next.split(' / ').includes(v.title)).map(v => v.id)).filter(id => ids.has(id))
  const ranks = new Map(nodes.map(n => [n.id, 0]))
  for (let pass = 0; pass < nodes.length; pass++) for (const n of nodes) for (const next of edges(n)) ranks.set(next, Math.max(ranks.get(next) ?? 0, (ranks.get(n.id) ?? 0) + 1))
  const rows = new Map<number, RouteItem[]>()
  for (const n of nodes) { const rank = ranks.get(n.id) ?? 0; rows.set(rank, [...(rows.get(rank) ?? []), n]) }
  const positions = new Map<string, { x: number; y: number; count: number }>()
  for (const [rank, row] of rows) row.forEach((n, i) => positions.set(n.id, { x: (i + 1) * 240 / (row.length + 1), y: rank * 84 + 36, count: row.length }))
  const height = Math.max(1, rows.size) * 84 + 10
  const lines = nodes.flatMap(n => edges(n).map(id => {
    const from = positions.get(n.id)!, to = positions.get(id)!, target = nodes.find(v => v.id === id)!
    return `<path class="${n.status === 'visited' && ['visited', 'current'].includes(target.status) ? 'traversed' : ''}" d="M${from.x} ${from.y + 12}C${from.x} ${from.y + 50},${to.x} ${to.y - 36},${to.x} ${to.y - 12}"/>`
  })).join('')
  const iconFor = (n: RouteItem) => n.kind.startsWith('Machine') || n.kind.startsWith('Guardian') ? 'down' : n.kind === 'boss' ? 'skull' : n.kind === 'fork' ? 'map' : n.kind === 'shop' ? 'bag' : n.kind === 'repair' ? 'heart' : 'eye'
  return `<section class="route-act panel"><h4>Act ${['I', 'II', 'III'][act - 1]} · ${['The Brass Garden', 'The Ember Foundry', 'The Astral Engine'][act - 1]}</h4><div class="constellation-chart" style="height:${height}px"><svg viewBox="0 0 240 ${height}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes.map(n => { const p = positions.get(n.id)!; return `<details class="route-node ${n.status} ${p.count > 1 ? 'branch-node' : ''}" style="left:${p.x / 2.4}%;top:${p.y}px"><summary><i class="route-node-icon">${ico(iconFor(n))}</i><b>${esc(n.title)}</b><span>${n.status === 'current' ? 'You are here' : esc(n.kind)}</span></summary><div class="route-inspection"><span>${n.status === 'visited' ? 'Visited' : n.status === 'alternative' ? 'Unchosen path' : n.status === 'current' ? 'Current' : 'Ahead'} · ${esc(n.kind)}</span>${n.detail ? `<p>${esc(n.detail)}</p>` : ''}${n.next ? `<small>Next: ${esc(n.next)}</small>` : ''}</div></details>` }).join('')}</div></section>`
}

// ---------------------------------------------------------------------------
// Home, Star Chart, quests, progression

function rankBadge(meta: MetaModel): string {
  const r = 19
  const c = 2 * Math.PI * r
  return `<button class="rank-badge" data-act="quests" aria-label="Rank ${meta.level}, ${esc(meta.title)}. ${meta.xp} of ${meta.xpNext} XP. Open quests and feats."><span class="rank-ring"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="${r}" class="rank-track"/><circle cx="24" cy="24" r="${r}" class="rank-fill" stroke-dasharray="${(c * meta.xpT).toFixed(1)} ${c.toFixed(1)}"/></svg><b>${meta.level}</b></span><span class="rank-copy"><strong>${esc(meta.title)}</strong><i><em style="width:${(meta.xpT * 100).toFixed(1)}%"></em></i></span></button>`
}

function hubHtml(stage: Extract<StageModel, { kind: 'hub' }>): string {
  const selected = stage.balls.find(b => b.selected) ?? stage.balls[0]
  const meta = stage.meta
  const finishes = meta?.finishes ?? []
  const nextFinish = finishes.find(f => !f.unlocked)
  const open = stage.balls.filter(b => !b.locked)
  const at = Math.max(0, open.indexOf(selected))
  const prev = open.length > 1 ? open[(at - 1 + open.length) % open.length] : null
  const next = open.length > 1 ? open[(at + 1) % open.length] : null
  return `<div class="home">
    <header class="home-bar">
      ${meta ? rankBadge(meta) : '<span></span>'}
      <div class="wallet">${wallet('dust', meta?.stardust ?? 0, 'Stardust · spend on the Star Chart')}${wallet('shard', stage.shards, 'Shards · research new relics')}</div>
      <button class="round-btn" data-act="settings" aria-label="Settings">${ico('gear')}</button>
    </header>
    <section class="home-hero">
      <h1 class="logo">PLUMB<span aria-hidden="true">!</span></h1>
      <p class="tagline">Cosmic pachinko roguelite</p>
    </section>
    <section class="home-sphere" aria-label="Choose a sphere">
      <div class="sphere-stage">
        ${prev ? `<button class="round-btn arrow" data-act="ball:${prev.id}" aria-label="Previous sphere: ${esc(prev.name)}">${ico('back')}</button>` : '<span class="arrow-spacer"></span>'}
        <div class="hero-orb-wrap" style="--oa:${selected.colors[0]};--ob:${selected.colors[1]};--oc:${selected.colors[2]}"><span class="orb-glow"></span><span class="orb-ring"></span>${orb(selected.colors, 'hero-orb')}<span class="orb-shadow"></span></div>
        ${next ? `<button class="round-btn arrow" data-act="ball:${next.id}" aria-label="Next sphere: ${esc(next.name)}">${ico('next')}</button>` : '<span class="arrow-spacer"></span>'}
      </div>
      <div class="sphere-name"><h3>${esc(selected.name)}</h3>${tagChips(selected.tags)}<p>${esc(selected.tagline)}</p>${meta ? `<span class="mastery"><i><em style="width:${(meta.sphereT * 100).toFixed(1)}%"></em></i><b>Mastery ${meta.sphereLevel}</b>${meta.deepest ? `<b class="depth">Depth ${meta.deepest}</b>` : ''}</span>` : ''}</div>
      <div class="sphere-dots">${stage.balls.map((b, i) => b.locked
        ? `<span class="sphere-pick locked" title="${esc(b.reason)}" style="--i:${i}">${orb(b.colors)}${ico('lock', 'lock')}<small>${esc(b.name)}</small></span>`
        : `<button class="sphere-pick ${b.selected ? 'selected' : ''}" data-act="ball:${b.id}" aria-pressed="${b.selected}" aria-label="${esc(b.name)}" style="--i:${i}">${orb(b.colors)}<small>${esc(b.name)}</small></button>`).join('')}</div>
      ${stage.balls.some(b => b.locked) ? `<p class="unlock-hint">${ico('lock')}${esc(stage.balls.find(b => b.locked)!.name)}: ${esc(stage.balls.find(b => b.locked)!.reason)}</p>` : ''}
      ${finishes.length ? `<div class="finish-row" aria-label="Sphere finish">${finishes.map(f => f.unlocked
        ? `<button class="finish ${f.selected ? 'selected' : ''}" data-act="finish:${esc(f.id)}" aria-pressed="${f.selected}" title="${esc(f.name)}" style="--oa:${f.accent};--ob:${f.color};--oc:${f.core}"><i></i></button>`
        : `<span class="finish locked" title="${esc(f.name)} · mastery ${f.level}" style="--oa:${f.accent};--ob:${f.color};--oc:${f.core}"><i></i><small>${f.level}</small></span>`).join('')}</div>${nextFinish ? `<p class="finish-hint">Next finish at mastery ${nextFinish.level}</p>` : ''}` : ''}
    </section>
    <section class="home-play">
      <div class="trial-select"><button class="round-btn small" data-act="trial-down" aria-label="Lower trial" ${stage.trial <= 0 ? 'disabled' : ''}>${ico('back')}</button><div class="trial-copy-wrap"><b>Trial ${stage.trial}<small>/${stage.maxTrial}</small></b><span class="trial-copy">${esc(stage.trialText)}</span></div><button class="round-btn small" data-act="trial-up" aria-label="Raise trial" ${stage.trial >= stage.maxTrial ? 'disabled' : ''}>${ico('next')}</button></div>
      ${stage.legacy ? '<p class="legacy-route">Classic route · relay guardians disabled</p>' : ''}
      ${stage.resume ? `<button class="btn btn-go play-btn" data-act="continue-run">${ico('play')}<span><b>Continue</b><small>Your run is waiting</small></span><kbd>Enter</kbd></button><button class="btn play-alt" data-act="start">${ico('refresh')}<span>New run</span></button>` : `<button class="btn btn-go play-btn" data-act="start">${ico('play')}<span><b>${stage.shared ? 'Play challenge' : 'Play'}</b><small>${stage.shared ? 'Shared seed and sphere' : meta && meta.chartOn && meta.chartLevels > 0 ? 'Star Chart active' : 'Pick a relic and drop'}</small></span><kbd>Enter</kbd></button>`}
    </section>
    <section class="home-tiles">
      <button class="tile t-gold" data-act="daily">${ico('calendar')}<b>Daily</b><small>${stage.dailyBest ? `Best ${compact(stage.dailyBest)}` : esc(stage.dailySphere)}</small></button>
      <button class="tile t-cyan" data-act="quests">${ico('check')}<b>Quests</b><small>${meta ? `${meta.questsDone}/${meta.questsTotal}` : 'Goals'}</small>${meta && meta.questsDone < meta.questsTotal ? `<em class="badge-dot">${meta.questsTotal - meta.questsDone}</em>` : ''}</button>
      <button class="tile t-violet" data-act="stars">${ico('star')}<b>Star Chart</b><small>${meta ? `${meta.chartLevels} upgrades` : 'Upgrades'}</small></button>
      <button class="tile t-orange" data-act="laboratory">${ico('flask')}<b>Practice</b><small>Any machine</small></button>
    </section>
    <details class="home-options" ${stage.seed || stage.canStudy ? 'open' : ''}><summary>${ico('shard')}<span>Research & seed</span>${stage.canStudy ? '<em class="badge-dot">!</em>' : ''}</summary>
      <button class="btn ${stage.canStudy ? 'btn-violet' : ''} study" data-act="study" ${stage.canStudy ? '' : 'disabled'}>${ico('shard')}<span>${esc(stage.study)}</span></button>
      <div class="seed-row"><label class="seed"><span>Seed</span><input data-seed value="${esc(stage.seed)}" maxlength="12" spellcheck="false" placeholder="Random" aria-label="Run seed" /></label><button class="round-btn" data-act="random-seed" aria-label="Randomize seed" title="Randomize seed">${ico('refresh')}</button></div>
      <p class="fine">Best ${stage.best.toLocaleString()} · ${stage.runs} runs</p>
    </details>
    <nav class="home-nav" aria-label="Main menu"><button data-act="help">${ico('help')}<span>How to play</span></button><button data-act="collection">${ico('book')}<span>Archive</span></button><button data-act="history">${ico('list')}<span>Logbook</span></button><button data-act="settings">${ico('gear')}<span>Settings</span></button></nav>
  </div>`
}

function starsHtml(stage: Extract<StageModel, { kind: 'stars' }>): string {
  return screen('star-chart', 'Star Chart', `
    <button class="chart-toggle ${stage.on ? 'on' : ''}" data-act="chart-toggle" aria-pressed="${stage.on}"><span><b>${stage.on ? 'Upgrades active' : 'Purist mode'}</b><small>${stage.on ? 'Turn off for pure runs and +25% stardust' : 'Upgrades ignored · +25% stardust'}</small></span><i class="sw"></i></button>
    <p class="fine">Dailies and shared challenges always use pure rules.</p>
    <div class="star-grid">${stage.nodes.map((n, i) => `<div class="star-node ${n.maxed ? 'maxed' : ''} ${n.endless ? 'endless' : ''} ${n.level > 0 ? 'owned' : ''}" style="--i:${i}"><span class="star-glyph" aria-hidden="true">${esc(n.glyph)}</span><div class="star-copy"><h3>${esc(n.name)} <small>${n.endless ? `Lv ${n.level}` : `${n.level}/${n.max}`}</small></h3><p>${esc(n.level > 0 ? n.text : n.next)}</p>${!n.maxed && n.level > 0 ? `<p class="star-next">Next: ${esc(n.next)}</p>` : ''}${n.endless ? '' : `<span class="star-pips">${Array.from({ length: n.max }, (_, k) => `<i class="${k < n.level ? 'on' : ''}"></i>`).join('')}</span>`}</div><button class="btn ${n.afford ? 'btn-violet' : ''} star-buy" data-act="star:${esc(n.id)}" ${n.maxed || !n.afford ? 'disabled' : ''}>${n.maxed ? ico('check') : ico('dust')}<span>${n.maxed ? 'Max' : compact(n.cost)}</span></button></div>`).join('')}</div>`,
  { back: 'back', kicker: 'Permanent upgrades', extra: wallet('dust', stage.stardust, 'Stardust') })
}

function questRow(q: QuestRow, icon = 'check'): string {
  const t = q.target ? Math.min(1, q.value / q.target) : 0
  return `<li class="quest panel ${q.done ? 'done' : ''}"><span class="quest-check" aria-hidden="true">${q.done ? ico('check') : ico(icon)}</span><div><b>${esc(q.text)}</b><span class="bar"><i style="width:${(t * 100).toFixed(1)}%"></i></span><small>${q.value.toLocaleString('en-US')} / ${q.target.toLocaleString('en-US')} · ${esc(q.reward)}</small></div></li>`
}

function questsHtml(stage: Extract<StageModel, { kind: 'quests' }>): string {
  return screen('quests-screen', 'Quests', `
    <h3 class="section-h">Today <small>new in ${stage.resetHours}h</small></h3><ul class="quest-list">${stage.daily.map(q => questRow(q, 'calendar')).join('')}</ul>
    <h3 class="section-h">This week</h3><ul class="quest-list">${stage.weekly.map(q => questRow(q, 'star')).join('')}</ul>
    <p class="fine">Quests count expeditions and dailies, never practice. Missing a day costs nothing.</p>
    <h3 class="section-h">Feats <small>tiers never run out</small></h3><ul class="quest-list feats">${stage.feats.map(f => questRow({ text: `${f.name} · ${f.text}`, value: f.value, target: f.target, done: false, reward: `+${f.reward} stardust` }, 'trophy')).join('')}</ul>`,
  { back: 'back', kicker: 'Goals & feats' })
}

function progressHtml(p: ProgressModel): string {
  const up = p.levelAfter > p.levelBefore
  const lines = [
    ...(up ? [`Rank ${p.levelAfter} · ${p.title} · +${p.levelDust} stardust`] : []),
    ...(p.sphereUp ? [`${p.sphere} mastery ${p.sphereLevel}`] : []),
    ...p.finishes.map(f => `New finish: ${f}`),
    ...(p.depthRecord ? [`New depth record: ${p.depthRecord} circuit${p.depthRecord === 1 ? '' : 's'} · +${p.depthDust} stardust`] : []),
    ...p.quests,
    ...p.feats.map(f => `Feat: ${f}`),
  ]
  return `<section class="progress-panel panel ${up ? 'level-up' : ''}" style="--from:${(up ? 0 : p.xpBefore).toFixed(3)};--to:${p.xpAfter.toFixed(3)}"><div class="progress-row"><span class="rank-num">${p.levelAfter}</span><div class="progress-copy"><small>${up ? 'Rank up!' : 'Rank'} · ${esc(p.title)}</small><span class="xp-bar"><i></i></span></div><div class="progress-gains"><b>+<span data-count="${p.xp}">0</span> XP</b><b class="dust">+<span data-count="${p.dust}">0</span>${ico('dust')}</b></div></div>${lines.length ? `<ul class="progress-news">${lines.map((l, i) => `<li style="--i:${i}">${ico('sparkle')}${esc(l)}</li>`).join('')}</ul>` : ''}${p.pure ? '<p class="fine">Pure rules · no Star Chart upgrades</p>' : ''}</section>`
}

function artifactKind(name: string, tags = ''): string {
  const title = name.toLowerCase()
  if (/echo|afterimage/.test(title)) return 'echo'
  if (/spring|flywheel/.test(title)) return 'spring'
  if (/crown/.test(title)) return 'crown'
  if (/heart/.test(title)) return 'heart'
  if (/feather/.test(title)) return 'feather'
  if (/side jets/.test(title)) return 'jets'
  if (/gate|open throat/.test(title)) return 'gate'
  if (/plumb line/.test(title)) return 'compass'
  const value = `${name} ${tags}`.toLowerCase()
  if (/arc|capacitor|coil|electric|combo/.test(value)) return 'coil'
  if (/shell|fuse|shield|shock|landing|mend/.test(value)) return 'shell'
  if (/portal|passport|ouroboros/.test(value)) return 'portal'
  if (/gravity|void|well|singularity/.test(value)) return 'gravity'
  if (/magnet|rudder|control|compass|gyroscope/.test(value)) return 'compass'
  if (/salvage|hammer|shatter|anvil|destruction/.test(value)) return 'forge'
  if (/gold|ledger|interest|economy|coin|gears/.test(value)) return 'coin'
  if (/prism|precision|clean|contract|lens/.test(value)) return 'prism'
  if (/spring|bounce|flywheel|rebound/.test(value)) return 'spring'
  if (/risk|multiplier|gambler|dice|luck/.test(value)) return 'star'
  return 'oracle'
}

function artifactArt(kind: string): string {
  const drawings: Record<string, string> = {
    echo: '<circle cx="60" cy="60" r="12"/><circle cx="60" cy="60" r="5" fill="currentColor"/><path d="M42 42a25 25 0 0 0 0 36m36-36a25 25 0 0 1 0 36M31 31a40 40 0 0 0 0 58m58-58a40 40 0 0 1 0 58"/>',
    crown: '<path d="m28 43 9 39h46l9-39-21 16-11-29-11 29-21-16Zm9 39v9h46v-9" fill="currentColor" fill-opacity=".25"/>',
    feather: '<path d="M84 24C50 22 28 51 42 79c27 13 55-8 53-42L84 24Z" fill="currentColor" fill-opacity=".25"/><path d="M30 92l50-50"/>',
    jets: '<path d="m51 32 9-12 9 12v48H51V32Zm0 14-16 9v25l16-11m18-23 16 9v25L69 69" fill="currentColor" fill-opacity=".25"/><path d="m55 88 5 14 5-14"/>',
    gate: '<path d="M28 88h64M35 88V36h50v52M60 46v26m-8-8 8 8 8-8"/>',
    coil: '<path d="M45 36h30M45 84h30M50 42c-24 5 44 5 20 11s-44 5-20 11 44 5 20 11-20 4-20 4"/><path d="m70 18-12 15h13L57 52" stroke-width="7"/>',
    shell: '<path d="M60 22 88 34v24c0 20-28 36-28 36S32 78 32 58V34l28-12Z" fill="currentColor" fill-opacity=".25"/><path d="m48 58 9 9 17-20"/>',
    portal: '<ellipse cx="60" cy="60" rx="22" ry="34" transform="rotate(32 60 60)" fill="currentColor" fill-opacity=".25"/><ellipse cx="60" cy="60" rx="11" ry="22" transform="rotate(32 60 60)"/>',
    gravity: '<circle cx="60" cy="60" r="16" fill="currentColor" fill-opacity=".35"/><ellipse cx="60" cy="60" rx="38" ry="14" transform="rotate(-29 60 60)"/><circle cx="89" cy="40" r="5" fill="currentColor"/>',
    compass: '<circle cx="60" cy="60" r="30"/><path d="m77 35-10 34-25 16 10-34 25-16Z" fill="currentColor" fill-opacity=".35"/>',
    forge: '<path d="m42 32 13-13 31 31-13 13-31-31Zm15 15L33 71l10 10 24-24M28 90h60" fill="currentColor" fill-opacity=".25"/>',
    coin: '<ellipse cx="60" cy="70" rx="30" ry="13"/><path d="M30 46v24m60-24v24"/><ellipse cx="60" cy="46" rx="30" ry="13" fill="currentColor" fill-opacity=".3"/>',
    prism: '<path d="m60 20 32 52-32 24-32-24 32-52Zm0 0v76M28 72l32-16 32 16" fill="currentColor" fill-opacity=".2"/>',
    spring: '<path d="M42 28h36M47 34c-27 7 53 7 26 14s-53 7-26 14 53 7 26 14-26 7-26 7M42 90h36"/>',
    star: '<path d="m60 20 11 26 28 3-21 18 7 29-25-15-25 15 7-29-21-18 28-3 11-26Z" fill="currentColor" fill-opacity=".3"/>',
    heart: '<path d="M60 92 31 62c-22-24 12-49 29-23 17-26 51-1 29 23L60 92Z" fill="currentColor" fill-opacity=".3"/>',
    oracle: '<path d="M22 60s16-25 38-25 38 25 38 25-16 25-38 25-38-25-38-25Z"/><circle cx="60" cy="60" r="13" fill="currentColor" fill-opacity=".35"/><circle cx="60" cy="60" r="5" fill="currentColor"/>',
  }
  return `<svg class="artifact-engraving" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${drawings[kind] ?? drawings.oracle}</svg>`
}

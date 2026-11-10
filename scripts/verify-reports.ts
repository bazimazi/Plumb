/** Factual, event-independent post-fall diagnostics and unchanged physical play. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { BALL_LIST, RELIC_LIST, UPGRADE_LIST } from '../src/content/catalog'
import { rngFor } from '../src/core/rng'
import { createRoute } from '../src/game/route'
import type { Board, LayoutId, Peg } from '../src/sim/board'
import { Drop, type Cmd } from '../src/sim/drop'
import { applyAnomaly } from '../src/sim/anomaly'
import { applyEncounter, ENCOUNTERS } from '../src/sim/encounter'
import { createBoard } from '../src/sim/generate'
import { computeProfile } from '../src/sim/profile'
import { describeDrop } from '../src/sim/report'
import { TUNING } from '../src/tuning'

const empty: Cmd = { nudge: 0, flip: false, special: false, tilt: false, aimX: 700 }
let checks = 0
function check(name: string, fn: () => void) { fn(); checks++; console.log(`PASS ${name}`) }
function arena(extra: Partial<Board> = {}): Board {
  return {
    w: 800, h: 6000, theme: 'workshop', margin: 0, floorY: 5500,
    launchX: 400, launchY: 40, pegs: [], bumpers: [], walls: [], zones: [],
    bins: [{ x0: 0, x1: 150, kind: 'hazard' }, { x0: 150, x1: 800, kind: 'coin' }],
    shutterY: null, gapWidth: 160, gapStart: 0, goldSide: 'right', payout: 1,
    title: 'Report laboratory', features: [], boss: false, jackpot: false, ...extra,
  }
}
const pegs = (n = 8, kind: Peg['kind'] = 'normal'): Peg[] => Array.from({ length: n }, (_, i) => ({ x: 100 + i * 75, y: 1000, r: 10, row: i, kind }))
function make(board = arena(), ball = 'rubber', upgrades: string[] = [], relics: string[] = [], integrity?: number) {
  const p = computeProfile(ball, upgrades, relics)
  const d = new Drop(board, ball, p, integrity ?? p.integrityMax, p.integrityMax)
  d.launch(0)
  d.pullEvents()
  return d
}
function step(d: Drop, cmd: Partial<Cmd> = {}) { d.step(TUNING.dt, { ...empty, ...cmd }) }
function hover(d: Drop, seconds: number) {
  for (let i = 0; i < Math.ceil(seconds / TUNING.dt) && !d.dead && !d.captured; i++) {
    d.ball.x = 100 + i % 3 * 150; d.ball.y = 200; d.ball.vx = d.ball.vy = 0
    step(d)
  }
}
function strike(d: Drop, i: number, velocity = 650) {
  const p = d.board.pegs[i]
  d.ball.x = p.x; d.ball.y = p.y - p.r - d.ball.r + 1
  d.ball.vx = 0; d.ball.vy = velocity; step(d)
}
function spike(d: Drop) {
  const p = d.board.zones.find(z => z.kind === 'spike')!
  d.ball.x = p.x; d.ball.y = p.y; d.ball.vx = d.ball.vy = 0; step(d)
}
function pocket(d: Drop, x = 400) {
  d.ball.x = x; d.ball.y = d.board.floorY + 120; d.ball.vx = d.ball.vy = 0; step(d)
}
const used = (d: Drop, label: string) => describeDrop(d).resources.find(r => r.label === label)!

check('only accepted activations count: prelaunch, cooldown, depleted and missing-gate input are refused', () => {
  const p = computeProfile('rubber', ['plumb-line'], [])
  const d = new Drop(arena({ shutterY: 600 }), 'rubber', p, 2, p.integrityMax)
  step(d, { nudge: 1, flip: true, special: true, tilt: true })
  assert.deepEqual([d.nudgeUses, d.flipUses, d.trickUses, d.tiltUses], [0, 0, 0, 0])
  assert.equal(d.initialIntegrity, 2)
  d.launch(0)
  step(d, { nudge: 1, flip: true, special: true, tilt: true })
  assert.deepEqual([d.nudgeUses, d.flipUses, d.trickUses, d.tiltUses], [1, 1, 1, 0], 'trick takes the shared cooldown before tilt')
  step(d, { nudge: -1, flip: true, special: true, tilt: true })
  assert.deepEqual([d.nudgeUses, d.flipUses, d.trickUses, d.tiltUses], [1, 1, 1, 0])
  hover(d, 0.4); step(d, { tilt: true })
  assert.equal(d.tiltUses, 1)
  hover(d, 0.5); step(d, { tilt: true })
  assert.equal(d.tiltUses, 1, 'spent tilt is refused')
  hover(d, 0.4); step(d, { special: true }); hover(d, 0.4); step(d, { special: true })
  assert.equal(d.trickUses, 2, 'spent trick is refused')
  pocket(d); const before = JSON.stringify(describeDrop(d)); step(d, { nudge: 1, special: true })
  assert.equal(JSON.stringify(describeDrop(d)), before, 'terminal input cannot fabricate use')
  const ungated = make(); step(ungated, { flip: true }); assert.equal(ungated.flipUses, 0)
})

check('physical combo and gate refunds do not hide a nudge activation', () => {
  const d = make(arena({ shutterY: 600, pegs: pegs() }), 'rubber', ['gate-memory'])
  for (let i = 0; i < 4; i++) strike(d, i)
  assert.equal(d.peakCombo, 4)
  step(d, { nudge: 1, flip: true })
  assert.equal(d.nudges, d.maxNudges, 'the gate really restored the accepted nudge')
  assert.deepEqual(used(d, 'Nudges'), { label: 'Nudges', used: 1, remaining: d.maxNudges })
  assert.equal(d.flipUses, 1)
  hover(d, d.profile.comboWindow + 0.1)
  assert.equal(d.combo, 0); assert.equal(describeDrop(d).peakCombo, 4)
})

check('a Golden Rudder physical refund preserves the activation count after event draining', () => {
  const d = make(arena({ pegs: pegs(1, 'gold') }), 'rubber', [], ['golden-rudder'])
  step(d, { nudge: -1 }); strike(d, 0)
  assert.equal(d.goldRefunds, 1); assert.equal(d.nudges, d.maxNudges)
  const report = describeDrop(d); d.pullEvents()
  assert.deepEqual(describeDrop(d), report)
  assert.equal(used(d, 'Nudges').used, 1)
})

check('Mark counts only an actual target and Void routes Space and Q to the same tilt pool', () => {
  const miss = make(arena(), 'prism'); step(miss, { special: true })
  assert.equal(miss.trickUses, 0); assert.equal(miss.specials, 2)
  const mark = make(arena({ pegs: [{ x: 400, y: 180, r: 10, row: 0, kind: 'normal' }] }), 'prism')
  step(mark, { special: true }); assert.equal(mark.trickUses, 1); assert.ok(mark.critPeg >= 0)
  const d = make(arena(), 'void')
  step(d, { special: true }); step(d, { tilt: true })
  assert.equal(d.tiltUses, 1); assert.equal(d.trickUses, 0)
  hover(d, 0.5); step(d, { tilt: true })
  assert.deepEqual(used(d, 'Tilt'), { label: 'Tilt', used: 2, remaining: 0 })
  assert.equal(describeDrop(d).resources.filter(r => r.label === 'Tilt').length, 1)
})

check('spike and gutter losses record their real time and cause; protected contact is not damage', () => {
  const b = () => arena({ zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] })
  const d = make(b()); spike(d)
  assert.equal(d.integrity, d.initialIntegrity - 1)
  assert.deepEqual(d.damageHistory, [{ time: d.time, cause: 'spike', amount: 1 }])
  spike(d); assert.equal(d.damageHistory.length, 1, 'hazard grace refuses a second loss')
  pocket(d, 50)
  assert.deepEqual(describeDrop(d).damage.map(e => e.cause), ['Spike', 'Gutter'])
  assert.equal(describeDrop(d).outcome, 'gutter')
  assert.ok(d.damageHistory[1].time > d.damageHistory[0].time)
  const shield = make(b(), 'rubber', [], ['velvet-fuse']); spike(shield)
  assert.equal(shield.shields, 0); assert.equal(shield.integrity, shield.initialIntegrity)
  assert.deepEqual(describeDrop(shield).damage, [])
  const gutterShield = make(b(), 'rubber', [], ['velvet-fuse']); pocket(gutterShield, 50)
  const report = describeDrop(gutterShield)
  assert.equal(gutterShield.captured, 'coin'); assert.equal(report.outcome, 'landing')
  assert.match(report.detail, /shield converted the gutter/); assert.deepEqual(report.damage, [])
})

check('Salvage healing never erases a recorded loss or creates false negative damage', () => {
  const d = make(arena({ pegs: pegs(), zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] }), 'rubber', [], ['salvage-crown'])
  spike(d)
  for (let i = 0; i < 4; i++) strike(d, i, 1200)
  assert.equal(d.shatters, 4); assert.equal(d.salvageUsed, true)
  assert.equal(d.integrity, d.initialIntegrity)
  assert.deepEqual(describeDrop(d).damage.map(e => [e.cause, e.amount]), [['Spike', 1]])
})

check('shell breaks identify spike, gutter and Grinder miss without inventing a boss win', () => {
  const d = make(arena({ zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] }), 'rubber', [], [], 1)
  spike(d); assert.equal(describeDrop(d).outcome, 'shatter'); assert.match(describeDrop(d).detail, /spike used the remaining shell/)
  const gutter = make(arena(), 'rubber', [], [], 1); pocket(gutter, 50)
  assert.match(describeDrop(gutter).detail, /gutter used the remaining shell/)
  const boss = make(arena({ boss: true }), 'rubber', [], ['velvet-fuse'], 2)
  pocket(boss); assert.equal(boss.dead, false); assert.equal(boss.damageHistory.length, 1)
  assert.equal(boss.shields, 1, 'the shield cannot stop a Grinder miss')
  pocket(boss)
  const report = describeDrop(boss)
  assert.equal(report.outcome, 'shatter'); assert.match(report.detail, /Grinder miss used the remaining shell/)
  assert.deepEqual(report.damage.map(e => e.cause), ['Grinder miss', 'Grinder miss'])
  assert.deepEqual(report.objective, { name: 'The Grinder', progress: 0, required: 5, complete: false })
})

check('normal and Grinder watchdogs report timeout only when the limit actually ends the fall', () => {
  const d = make(arena({ h: 1e9, floorY: 1e9 }))
  for (let i = 0; i < 10000 && !d.captured; i++) step(d)
  assert.ok(d.time >= 80 && d.time < 80 + TUNING.dt)
  assert.equal(d.terminalReason, 'timeout'); assert.equal(describeDrop(d).outcome, 'timeout')
  assert.deepEqual(d.damageHistory, [])
  const boss = make(arena({ boss: true }), 'rubber', [], [], 2)
  hover(boss, 25.1)
  assert.equal(boss.integrity, 1); assert.equal(boss.terminalReason, null)
  assert.equal(describeDrop(boss).outcome, 'in-flight')
  hover(boss, 25.1)
  assert.equal(boss.terminalReason, 'timeout'); assert.equal(describeDrop(boss).outcome, 'timeout')
  assert.match(describeDrop(boss).detail, /25-second core-progress limit/)
  assert.equal(boss.damageHistory.length, 2)
})

check('damage ledger keeps the newest 100 physical losses and the final cause', () => {
  const p = { ...computeProfile('rubber', [], []), hazardGrace: 0 }
  const d = new Drop(arena({ zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] }), 'rubber', p, 150, 150)
  d.launch(0)
  for (let i = 0; i < 105; i++) spike(d)
  assert.equal(d.integrity, 45); assert.equal(d.damageHistory.length, 100)
  assert.ok(d.damageHistory[0].time > 5 * TUNING.dt)
  assert.equal(d.damageHistory.at(-1)!.time, d.time)
  assert.ok(d.damageHistory.every(e => e.cause === 'spike' && e.amount === 1))
})

check('invalid-state settlement is identified without labelling a recovered Grinder return terminal', () => {
  const d = make(); d.ball.x = NaN; step(d)
  assert.equal(describeDrop(d).outcome, 'invalid-state')
  const boss = make(arena({ boss: true })); boss.ball.x = NaN; step(boss)
  assert.equal(boss.integrity, 2); assert.equal(boss.dead, false)
  assert.equal(boss.terminalReason, null); assert.equal(describeDrop(boss).outcome, 'in-flight')
  assert.ok(Number.isFinite(boss.ball.x))
})

check('guardian reports describe actual optional completion, finite returns and failure independently', () => {
  const route = createRoute(rngFor('HELIX2026', 'route:0'), { rules: 3 })
  const node = route.nodes.gallery
  const board = createBoard({ layout: node.layout, title: node.title, tutorial: false, rng: rngFor('HELIX2026', 'board:0:gallery:0') })
  if (node.anomaly) applyAnomaly(board, node.anomaly, 1)
  applyEncounter(board, node.encounter!)
  const d = make(board, 'rubber', ['capacitor', 'plumb-line'], ['arc-coil'])
  d.launch(0.045)
  for (let i = 0; i < 15000 && !d.captured && !d.dead; i++) step(d)
  assert.equal(d.encounterComplete, true); assert.equal(d.encounterReturns, 1)
  const report = describeDrop(d)
  assert.equal(report.outcome, 'guardian-complete')
  assert.deepEqual(report.objective, { name: 'The Bellkeeper', progress: 3, required: 3, complete: true })
  report.objective!.progress = 0; assert.equal(describeDrop(d).objective!.progress, 3)
  assert.equal(d.wonBoss, false)
  const incomplete = make(arena({ encounter: { ...ENCOUNTERS.bellkeeper, sequence: [] } }))
  pocket(incomplete); assert.equal(describeDrop(incomplete).outcome, 'in-flight')
  pocket(incomplete)
  assert.equal(describeDrop(incomplete).outcome, 'guardian-unfinished')
  assert.match(describeDrop(incomplete).detail, /does not block the route/)
  const failed = make(arena({ encounter: { ...ENCOUNTERS.bellkeeper, sequence: [] }, zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] }), 'rubber', [], [], 1)
  spike(failed); assert.equal(describeDrop(failed).outcome, 'shatter')
})

check('five real core contacts report a boss win only after a surviving settlement', () => {
  const d = make(arena({ boss: true, bumpers: [{ x: 400, y: 800, r: 40, core: true }] }))
  for (let i = 0; i < 5; i++) {
    const b = d.board.bumpers[0]
    d.ball.x = b.x; d.ball.y = b.y - b.r - d.ball.r + 1; d.ball.vx = 0; d.ball.vy = 650; step(d)
    if (i < 4) hover(d, 0.5)
  }
  assert.equal(d.coreHits, 5); assert.equal(d.wonBoss, true)
  assert.equal(describeDrop(d).outcome, 'in-flight')
  pocket(d)
  assert.equal(describeDrop(d).outcome, 'boss-win')
  assert.deepEqual(describeDrop(d).objective, { name: 'The Grinder', progress: 5, required: 5, complete: true })
})

check('advice cites actual unused controls and charged reactor without claiming an alternative outcome', () => {
  const d = make(arena({ pegs: pegs() }))
  for (let i = 0; i < 5; i++) strike(d, i)
  assert.equal(d.charge, 1)
  pocket(d)
  const report = describeDrop(d)
  assert.match(report.advice, /reactor is charged with an activation remaining/)
  assert.doesNotMatch(report.advice, /would|could have|prevented|saved you/i)
  const nudge = make(); pocket(nudge)
  assert.match(describeDrop(nudge).advice, /3 nudges remain/)
})

check('reports are pure detached snapshots, survive event drains and never consult randomness', () => {
  const d = make(arena({ zones: [{ kind: 'spike', x: 400, y: 500, r: 25 }] })); spike(d)
  const state = JSON.stringify(d), events = d.events
  const random = Math.random
  let report: ReturnType<typeof describeDrop>
  try { Math.random = () => { throw new Error('report consulted RNG') }; report = describeDrop(d) } finally { Math.random = random }
  assert.equal(JSON.stringify(d), state); assert.equal(d.events, events)
  d.pullEvents(); assert.deepEqual(describeDrop(d), report!)
  report!.damage[0].amount = 500; report!.resources[0].used = 500; report!.resources.push({ label: 'forged', used: 2, remaining: 9 })
  assert.equal(d.damageHistory[0].amount, 1); assert.equal(d.nudgeUses, 0)
  assert.equal(describeDrop(d).resources.some(r => r.label === 'forged'), false)
  const before = describeDrop(d); pocket(d)
  assert.equal(before.outcome, 'in-flight'); assert.equal(before.damage.length, 1)
  assert.equal(describeDrop(d).outcome, 'landing')
})

check('42 generated physical falls preserve the pre-diagnostics event, trajectory and accounting fingerprint', () => {
  // Captured before any diagnostic fields were added: all layouts, all spheres,
  // bare/full builds, accepted control attempts, real reactor use and guardians.
  const hash = createHash('sha256')
  for (const layout of ['workshop', 'garden', 'furnace', 'elite', 'ante', 'core', 'grinder'] as LayoutId[]) for (const ball of BALL_LIST) for (let build = 0; build < 2; build++) {
    const b = createBoard({ layout, title: layout, tutorial: false, rng: rngFor('REPORTPHYSICS', `${layout}:${ball.id}:${build}`) })
    if (layout === 'garden') applyEncounter(b, 'bellkeeper')
    if (layout === 'elite') applyEncounter(b, 'heartforge')
    const p = computeProfile(ball.id, build ? UPGRADE_LIST.map(u => u.id) : [], build ? RELIC_LIST.map(r => r.id) : [])
    const d = new Drop(b, ball.id, p, p.integrityMax, p.integrityMax)
    d.launch(build ? 0.225 : -0.135)
    for (let i = 0; i < 14400 && !d.dead && !d.captured; i++) {
      const cmd: Cmd = { nudge: i % 120 === 0 ? (i % 240 === 0 ? -1 : 1) : 0, flip: i === 120, special: i % 300 === 0, tilt: i % 480 === 0, overdrive: d.overdriveReady, aimX: i % 240 < 120 ? 100 : 700 }
      d.step(TUNING.dt * d.timeScale, cmd)
      const events = d.pullEvents()
      if (events.length) hash.update(JSON.stringify(events))
      if (i % 60 === 0) hash.update(JSON.stringify([d.time, d.ball, d.integrity, d.earned, d.mult, d.combo, d.coreHits, d.encounterProgress]))
    }
    hash.update(JSON.stringify([layout, ball.id, build, d.time, d.ball, d.integrity, d.earned, d.mult, d.combo, d.captured, d.dead, d.gone, d.coreHits, d.encounterProgress, d.nudges, d.specials, d.tilts, d.flips]))
  }
  assert.equal(hash.digest('hex'), 'c503f06e43808274e8bae5f8b4886eceedc3f4d6ee4d50519b2037eac4f7b1cc')
})

console.log(`Verified ${checks} report checks, including 42 unchanged full physical falls.`)

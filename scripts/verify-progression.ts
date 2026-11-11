import assert from 'node:assert/strict'
import {
  FEATS, FINISHES, STAR_NODES, addXp, asymptote, chartBonuses, dailyQuests, depthBounty, featProgress, featReward,
  masteryXp, rankTitle, rankXp, starCost, stardustFor, weekKey, weeklyQuests, xpFor, advanceQuests,
} from '../src/meta/progression'

let checks = 0
function check(name: string, run: () => void) {
  run()
  checks++
  console.log(`PASS ${name}`)
}

check('rank and mastery curves are polynomial, increasing, and never stall', () => {
  for (let l = 1; l < 500; l++) {
    assert.ok(rankXp(l + 1) > rankXp(l))
    assert.ok(masteryXp(l + 1) > masteryXp(l))
    // Polynomial: the ratio between successive levels approaches 1 instead of a fixed exponential base.
    if (l > 50) assert.ok(rankXp(l + 1) / rankXp(l) < 1.04)
  }
  const s = { level: 1, xp: 0 }
  const gained = addXp(s, rankXp(1) + rankXp(2) + 5, rankXp)
  assert.deepEqual(gained, [2, 3])
  assert.deepEqual(s, { level: 3, xp: 5 })
  assert.equal(addXp({ level: 1, xp: 0 }, Number.MAX_SAFE_INTEGER, rankXp).length, 500, 'a corrupt grant is bounded')
  assert.equal(rankTitle(1), 'Apprentice')
  assert.match(rankTitle(1000), /^Star Warden [IVXLCDM]+$/)
})

check('endless Star Chart nodes stay bounded while costs keep rising', () => {
  for (const level of [0, 1, 10, 100, 10_000, 1e9]) {
    const b = chartBonuses({ yield: level, insight: level, resonance: level })
    assert.ok(b.yield < 0.3 && b.insight < 0.5 && b.resonance < 0.5)
  }
  assert.equal(asymptote(0, 1, 10), 0)
  for (const node of STAR_NODES) {
    const max = Number.isFinite(node.max) ? node.max : 200
    for (let l = 1; l < max; l++) assert.ok(starCost(node, l) >= starCost(node, l - 1), `${node.id} cost rises`)
    assert.ok(Number.isFinite(starCost(node, max - 1)))
  }
  // Capped nodes cannot be exceeded through a crafted save.
  const b = chartBonuses({ nudge: 99, shell: 99, startGears: 99, discount: 99 })
  assert.equal(b.nudge, 1)
  assert.equal(b.shell, 1)
  assert.equal(b.startGears, 40)
  assert.ok(Math.abs(b.discount - 0.2) < 1e-9)
})

check('run rewards grow with depth but sub-linearly with score', () => {
  const o = (score: number, machines = 10, clears = 1) => ({ score, machines, win: clears > 0, clears, pure: false, trial: 0 })
  assert.equal(stardustFor({ ...o(0), machines: 0 }), 0)
  assert.equal(xpFor({ ...o(0), machines: 0 }), 0)
  assert.ok(stardustFor(o(4000)) > stardustFor(o(1000)))
  assert.ok(stardustFor(o(400_000)) / stardustFor(o(4000)) < 10, 'a 100x score is not a 100x reward')
  assert.ok(stardustFor({ ...o(3000), pure: true }) > stardustFor(o(3000)), 'pure runs pay a bonus')
  assert.ok(stardustFor({ ...o(3000), trial: 10 }) > stardustFor(o(3000)), 'trials pay more')
  for (let d = 1; d < 200; d++) assert.ok(depthBounty(d + 1) > depthBounty(d))
})

check('quests are seeded by UTC day and week, distinct, and claim once', () => {
  assert.deepEqual(dailyQuests('2026-11-11'), dailyQuests('2026-11-11'))
  const days = new Set<string>()
  for (let d = 1; d <= 28; d++) {
    const q = dailyQuests(`2026-02-${String(d).padStart(2, '0')}`)
    assert.equal(new Set(q.map(x => x.id)).size, 3)
    days.add(q.map(x => x.id).join())
  }
  assert.ok(days.size > 10, 'daily sets vary')
  assert.equal(weeklyQuests('2026-W46').length, 2)
  assert.equal(weekKey(new Date('2026-11-09T00:00:00Z')), weekKey(new Date('2026-11-15T23:59:00Z')), 'Monday through Sunday share a week')
  assert.notEqual(weekKey(new Date('2026-11-15T23:59:00Z')), weekKey(new Date('2026-11-16T00:01:00Z')))
  assert.match(weekKey(new Date('2027-01-01T12:00:00Z')), /^20\d\d-W\d\d$/)
  const defs = dailyQuests('2026-11-11')
  const book = { key: '2026-11-11', progress: {}, claimed: [] as string[] }
  const all = Object.fromEntries(defs.map(q => [q.stat, q.target * 2]))
  assert.equal(advanceQuests(book, defs, all).length, 3)
  assert.equal(advanceQuests(book, defs, all).length, 0)
})

check('feat tiers never run out and pay increasing rewards', () => {
  for (const def of FEATS) {
    let prev = -1
    for (let tier = 0; tier < 60; tier++) {
      const t = def.target(tier)
      assert.ok(Number.isFinite(t) && t > prev, `${def.id} tier ${tier}`)
      prev = t
    }
    const p = featProgress(def, def.target(3), 0)
    assert.equal(p.tier, 4)
    assert.equal(p.ready, 4)
  }
  for (let tier = 0; tier < 50; tier++) assert.ok(featReward(tier + 1) > featReward(tier))
})

check('every sphere has seven finishes in ascending mastery order', () => {
  for (const list of Object.values(FINISHES)) {
    assert.equal(list.length, 7)
    assert.equal(list[0].level, 1)
    for (let i = 1; i < list.length; i++) assert.ok(list[i].level > list[i - 1].level)
  }
})

// Pacing model: a player whose scores rise slowly and who clears a circuit
// roughly every third run. This documents expected pacing; it is not a target.
check('pacing model: finite Star Chart nodes take dozens of runs, endless nodes keep going', () => {
  const finite = STAR_NODES.filter(n => Number.isFinite(n.max)).reduce((sum, n) => {
    for (let l = 0; l < n.max; l++) sum += starCost(n, l)
    return sum
  }, 0)
  let dust = 0
  let runs = 0
  let level = { level: 1, xp: 0 }
  while (dust < finite && runs < 10_000) {
    runs++
    const clears = runs % 3 === 0 ? 1 + Math.floor(runs / 60) : 0
    const score = 600 + runs * 45 + clears * 2500
    const machines = clears ? 10 + (clears - 1) * 10 : 4 + (runs % 5)
    const outcome = { score, machines, win: clears > 0, clears, pure: false, trial: Math.min(15, Math.floor(runs / 15)) }
    dust += stardustFor(outcome) + 45 // about 1.5 daily quests per run on average
    for (const l of addXp(level, xpFor(outcome), rankXp)) dust += 15 + l * 5
  }
  console.log(`  finite chart total ${finite} stardust · reached after ${runs} modeled runs · rank ${level.level}`)
  assert.ok(runs >= 20 && runs <= 120, `finite chart completes in a reasonable span (${runs} runs)`)
  const yieldNode = STAR_NODES.find(n => n.id === 'yield')!
  assert.ok(starCost(yieldNode, 60) > 2000, 'endless nodes remain a long-term sink')
})

console.log(`${checks} progression checks passed.`)

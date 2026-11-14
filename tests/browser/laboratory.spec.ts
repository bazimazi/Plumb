import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { commissionSet } from '../../src/meta/expedition'
import { createRoute } from '../../src/game/route'
import { rngFor } from '../../src/core/rng'

const seed = 'HELIX2026'
const action = (page: Page, name: string) => page.locator(`[data-act="${name}"]:visible`).last()
const mode = (page: Page) => page.locator('#app')

function checkpoint(nodeId = 'press', integrity = 3) {
  const route = createRoute(rngFor(seed, 'route:0'), { rules: 3 })
  return {
    version: 2, screen: 'aim', offers: [], rerolls: 0, drafting: false, draftTitle: '',
    run: {
      seed, ballId: 'rubber', nodeId, rules: 3, upgrades: [], relics: [],
      gears: 333, score: 1444, integrity, integrityMax: 3,
      drops: route.nodes[nodeId].depth - 1, bestCombo: 8, bestMult: 2,
      shatters: 0, portals: 0, jackpots: 0, flipGold: false, cleanDrop: false,
      bossWin: false, launchedOnce: true, depthTitle: route.nodes[nodeId].title,
      boardNonce: 0, reachedCore: nodeId === 'grinder', mode: 'expedition', ascension: 0,
      loop: 0, clears: 0, catalogue: [], commissions: commissionSet(seed), claimed: [],
      cleanDrops: 0, golds: 0, pegs: 0, visited: ['workshop', nodeId],
    },
  }
}

async function fixture(page: Page, nodeId = 'press', integrity = 3) {
  await page.goto(`/?seed=${seed}`)
  await page.evaluate(data => {
    localStorage.clear()
    localStorage.setItem('plumb-save-v1', JSON.stringify({
      version: 1, shards: 42, runs: 1, bestScore: 5432, bestCombo: 31, bestMult: 4.2,
      mastery: { rubber: 0, prism: 0, void: 0 }, balls: ['rubber'], ball: 'rubber',
      researched: [], seenRelics: [], seenParts: ['bumper'], challenges: [],
      trails: [], trail: '', lore: ['workshop'], coachingComplete: false,
      lifetime: { pegs: 71, golds: 13, shatters: 2, jackpots: 1, portals: 4 },
      dailyBest: { '2026-10-23@3': 876 },
      history: [{
        seed: 'ARCHIVE42', ballId: 'rubber', mode: 'expedition', ascension: 0,
        score: 5432, drops: 5, clears: 0, win: false, combo: 31,
        relics: [], upgrades: [], date: '2026-10-23T12:00:00.000Z', rules: 3,
      }],
      settings: { volume: 0, speed: 2, large: false, particles: true, flash: false, shake: false },
    }))
    localStorage.setItem('plumb-expedition-v2', JSON.stringify(data))
  }, checkpoint(nodeId, integrity))
  await page.reload()
  await expect(mode(page)).toHaveAttribute('data-mode', 'hub')
  await expect(action(page, 'continue-run')).toBeVisible()
}

async function storage(page: Page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(localStorage).sort(([a], [b]) => a.localeCompare(b))))
}

async function capture(page: Page, info: TestInfo, name: string) {
  await mkdir('artifacts/browser', { recursive: true })
  const path = `artifacts/browser/${info.project.name}-${name}.png`
  await page.screenshot({ path, fullPage: false, scale: 'css', animations: 'disabled' })
  await info.attach(name, { path, contentType: 'image/png' })
}

async function readable(page: Page) {
  const issues = await page.evaluate(() => {
    const issues: string[] = []
    if (document.documentElement.scrollWidth > innerWidth + 2) issues.push('Horizontal document overflow')
    for (const button of document.querySelectorAll<HTMLElement>('#stage button, #hud button')) {
      const r = button.getBoundingClientRect(), s = getComputedStyle(button)
      if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue
      if (r.left < -2 || r.right > innerWidth + 2) issues.push(`${button.dataset.act} overflows horizontally`)
      if (button.closest('.controls') && (r.top < 0 || r.bottom > innerHeight + 2)) issues.push(`${button.dataset.act} leaves the control area`)
      if (button.closest('.laboratory') && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight) {
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (!hit || !button.contains(hit)) issues.push(`${button.dataset.act} is covered by another element`)
      }
    }
    if (/\b(?:undefined|NaN)\b/i.test(document.getElementById('app')?.textContent ?? '')) issues.push('Invalid visible value')
    return issues
  })
  expect(issues).toEqual([])
}

async function configure(page: Page, machine = 'workshop', sphere = 'rubber', build = 'stock', frozen = false) {
  for (const name of [`lab-machine:${machine}`, `lab-sphere:${sphere}`, `lab-build:${build}`, 'lab-start']) {
    await action(page, name).click()
    if (frozen) await page.clock.runFor(50)
  }
  await expect(mode(page)).toHaveAttribute('data-mode', 'aim')
}

async function freeze(page: Page) {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
}

async function finishFall(page: Page) {
  await page.clock.runFor(50)
  for (let i = 0; i < 100 && await mode(page).getAttribute('data-mode') === 'drop'; i++) await page.clock.runFor(1000)
  expect(await mode(page).getAttribute('data-mode'), 'a real fall settles within its finite simulation lifetime').not.toBe('drop')
}

async function reportValues(page: Page) {
  const result: Record<string, string> = { outcome: await page.locator('.drop-report').last().getAttribute('data-outcome') ?? '' }
  for (const name of ['elapsed', 'earned', 'combo']) result[name] = (await page.locator(`[data-report="${name}"]`).last().textContent() ?? '').trim()
  return result
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  ;(page as Page & { gameErrors?: string[] }).gameErrors = errors
  // These assertions read the English copy; Persian is the default, so pin English on every load.
  await page.addInitScript(() => localStorage.setItem('plumb-lang', 'en'))
})

test.afterEach(async ({ page }) => {
  expect((page as Page & { gameErrors?: string[] }).gameErrors).toEqual([])
})

test('laboratory catalogue exposes eight machines and locked spheres without changing the archive', async ({ page }, info) => {
  if (info.project.name.includes('phone')) await page.setViewportSize({ width: 360, height: 740 })
  await fixture(page)
  await action(page, 'settings').click()
  await action(page, 'toggle:large').click()
  await action(page, 'back').click()
  const before = await storage(page)
  await action(page, 'laboratory').click()
  await expect(mode(page)).toHaveAttribute('data-mode', 'laboratory')
  for (const id of ['workshop', 'garden', 'furnace', 'press', 'bellkeeper', 'heartforge', 'gravity', 'grinder']) {
    await action(page, `lab-machine:${id}`).click()
    await expect(action(page, `lab-machine:${id}`)).toHaveAttribute('aria-pressed', 'true')
  }
  for (const sphere of ['rubber', 'prism', 'void']) {
    await action(page, `lab-sphere:${sphere}`).scrollIntoViewIfNeeded()
    const beforeSelection = await page.locator('.laboratory').evaluate(el => el.scrollTop)
    await action(page, `lab-sphere:${sphere}`).click()
    await expect(action(page, `lab-sphere:${sphere}`)).toHaveAttribute('aria-pressed', 'true')
    await expect(action(page, `lab-sphere:${sphere}`)).toBeInViewport()
    await expect(action(page, `lab-sphere:${sphere}`)).toBeFocused()
    expect(Math.abs(await page.locator('.laboratory').evaluate(el => el.scrollTop) - beforeSelection)).toBeLessThanOrEqual(2)
  }
  for (const build of ['stock', 'control', 'resonance']) {
    await action(page, `lab-build:${build}`).scrollIntoViewIfNeeded()
    const beforeSelection = await page.locator('.laboratory').evaluate(el => el.scrollTop)
    await action(page, `lab-build:${build}`).click()
    await expect(action(page, `lab-build:${build}`)).toHaveAttribute('aria-pressed', 'true')
    await expect(action(page, `lab-build:${build}`)).toBeInViewport()
    await expect(action(page, `lab-build:${build}`)).toBeFocused()
    expect(Math.abs(await page.locator('.laboratory').evaluate(el => el.scrollTop) - beforeSelection)).toBeLessThanOrEqual(2)
  }
  await readable(page)
  await capture(page, info, 'laboratory-large-type')
  expect(await storage(page)).toEqual(before)
  await action(page, 'lab-exit').click()
  await expect(mode(page)).toHaveAttribute('data-mode', 'hub')
  expect(await storage(page)).toEqual(before)
  await page.reload()
  await action(page, 'continue-run').click()
  await expect(mode(page)).toHaveAttribute('data-mode', 'aim')
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem('plumb-expedition-v2')!).run)
  expect(resumed.nodeId).toBe('press')
  expect(resumed.score).toBe(1444)
})

test('practice falls pause, report real results and retry deterministically while preserving a suspended expedition', async ({ page }, info) => {
  await page.clock.install()
  await fixture(page)
  const before = await storage(page)
  await action(page, 'laboratory').click()
  await configure(page)
  await freeze(page)
  await action(page, 'launch').click()
  await page.clock.runFor(500)
  await action(page, 'pause-btn').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'pause')
  await page.clock.fastForward(5000)
  await expect(mode(page)).toHaveAttribute('data-mode', 'pause')
  await action(page, 'journal').click()
  await page.clock.runFor(50)
  await expect(page.locator('.commissions')).toHaveCount(0)
  await expect(page.locator('.route-act')).toHaveCount(0)
  await readable(page)
  await capture(page, info, 'laboratory-machine-notes')
  await action(page, 'close-journal').click()
  await page.clock.runFor(50)
  await action(page, 'resume').click()
  await page.clock.runFor(50)
  await finishFall(page)
  await expect(mode(page)).toHaveAttribute('data-mode', 'practice-result')
  const first = await reportValues(page)
  expect(Number.parseFloat(first.elapsed)).toBeGreaterThan(0)
  expect(first.outcome.length).toBeGreaterThan(3)
  await readable(page)
  await capture(page, info, 'laboratory-first-result')
  expect(await storage(page)).toEqual(before)
  await action(page, 'lab-retry').click()
  await page.clock.runFor(50)
  await action(page, 'launch').click()
  await finishFall(page)
  await expect(mode(page)).toHaveAttribute('data-mode', 'practice-result')
  expect(await reportValues(page)).toEqual(first)
  await expect(page.locator('.practice-comparison')).toContainText('0 gears versus your previous attempt')
  expect(await storage(page)).toEqual(before)
  await action(page, 'lab-configure').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'laboratory')
  await configure(page, 'gravity', 'void', 'resonance', true)
  await page.clock.runFor(50)
  await action(page, 'pause-btn').click()
  await page.clock.runFor(50)
  await action(page, 'lab-exit').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'hub')
  expect(await storage(page)).toEqual(before)
  await page.clock.resume()
  await page.reload()
  await action(page, 'continue-run').click()
  await expect(mode(page)).toHaveAttribute('data-mode', 'aim')
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem('plumb-expedition-v2')!).run)
  expect(resumed.nodeId).toBe('press')
  expect(resumed.score).toBe(1444)
})

test('guardian practice records physical objective progress without awarding expedition rewards', async ({ page }, info) => {
  if (info.project.name.includes('phone')) await page.setViewportSize({ width: 360, height: 740 })
  await page.clock.install()
  await fixture(page)
  const before = await storage(page)
  await action(page, 'laboratory').click()
  await configure(page, 'bellkeeper', 'prism', 'control')
  await freeze(page)
  const objective = page.locator('.encounter-instrument:visible')
  await expect(objective).toContainText('Bellkeeper')
  await expect(objective).toContainText('0 / 3')
  await readable(page)
  await capture(page, info, 'laboratory-guardian-aim')
  await action(page, 'launch').click()
  await page.clock.runFor(50)
  // Spend an actual finite resource; its report must describe the observed input.
  await action(page, 'nudge-left').click()
  await page.clock.runFor(150)
  await finishFall(page)
  await expect(mode(page)).toHaveAttribute('data-mode', 'practice-result')
  await expect(page.locator('.drop-report')).toContainText(/Bellkeeper/i)
  await expect(page.locator('[data-report="resource"]').filter({ hasText: 'Nudges' })).toContainText('1 used')
  await expect(page.locator('.card.offer')).toHaveCount(0)
  const result = await reportValues(page)
  expect(Number.parseFloat(result.elapsed)).toBeGreaterThan(0)
  await readable(page)
  await capture(page, info, 'laboratory-guardian-report')
  expect(await storage(page)).toEqual(before)
  await action(page, 'lab-configure').click()
  await page.clock.runFor(50)
  await configure(page, 'heartforge', 'void', 'resonance', true)
  await page.clock.runFor(50)
  await expect(page.locator('.encounter-instrument:visible')).toContainText('Heartforge')
  await action(page, 'pause-btn').click()
  await page.clock.runFor(50)
  await action(page, 'lab-retry').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'aim')
  expect(await storage(page)).toEqual(before)
  await action(page, 'launch').click()
  await page.clock.runFor(500)
  await expect(mode(page)).toHaveAttribute('data-mode', 'drop')
  await action(page, 'pause-btn').click()
  await page.clock.runFor(50)
  await action(page, 'lab-exit').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'hub')
  expect(await storage(page)).toEqual(before)
})

test('a real expedition debrief can replay its final machine without duplicating permanent rewards', async ({ page }, info) => {
  await page.clock.install()
  await fixture(page, 'grinder', 1)
  await action(page, 'continue-run').click()
  await freeze(page)
  await action(page, 'launch').click()
  await page.clock.runFor(50)
  await finishFall(page)
  await expect(mode(page)).toHaveAttribute('data-mode', 'resolve')
  await action(page, 'skip').click()
  await page.clock.runFor(50)
  if (await mode(page).getAttribute('data-mode') === 'victory') {
    await action(page, 'bank').click()
    await page.clock.runFor(50)
  }
  await expect(mode(page)).toHaveAttribute('data-mode', 'runend')
  const finalFall = await reportValues(page)
  expect(Number.parseFloat(finalFall.elapsed)).toBeGreaterThan(0)
  await expect(page.locator('.drop-report')).toContainText(/core|Grinder/i)
  await readable(page)
  await capture(page, info, 'expedition-factual-debrief')
  const afterExpedition = await storage(page)
  expect(afterExpedition['plumb-expedition-v2']).toBeUndefined()
  expect(JSON.parse(afterExpedition['plumb-save-v1']).runs).toBe(2)
  await action(page, 'practice-last').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'laboratory')
  await expect(page.locator('.lab-matched')).toContainText('Matched to your last machine')
  await action(page, 'lab-start').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'aim')
  await page.clock.runFor(50)
  await action(page, 'launch').click()
  await finishFall(page)
  await expect(mode(page)).toHaveAttribute('data-mode', 'practice-result')
  expect(await reportValues(page)).toEqual(finalFall)
  expect(await storage(page)).toEqual(afterExpedition)
  await action(page, 'lab-exit').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'hub')
  expect(await storage(page)).toEqual(afterExpedition)
  // An interrupted fall did not reach a terminal physics outcome. Do not invent a loss report.
  await page.clock.resume()
  await fixture(page, 'workshop')
  await action(page, 'continue-run').click()
  await freeze(page)
  await action(page, 'launch').click()
  await page.clock.runFor(500)
  await action(page, 'pause-btn').click()
  await page.clock.runFor(50)
  await action(page, 'abandon').click()
  await page.clock.runFor(50)
  await expect(mode(page)).toHaveAttribute('data-mode', 'runend')
  await expect(page.locator('.drop-report')).toHaveCount(0)
  await expect(action(page, 'practice-last')).toHaveCount(0)
})

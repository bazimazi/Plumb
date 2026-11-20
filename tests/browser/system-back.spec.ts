import { test, expect, chromium, type BrowserContext, type CDPSession, type Page, type TestInfo, type Worker } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const seed = 'HELIX2026'
const probe = fileURLToPath(new URL('./back-probe', import.meta.url))
const MENUS = ['settings-screen', 'help-screen', 'collection-screen', 'history-screen', 'star-chart', 'research-screen', 'quests-screen']

/**
 * Drives the browser's real Back button through a test extension. Chromium skips history entries a page
 * pushed without a fresh user gesture, so a back guard re-pushed after a back press lets the next press skip
 * the whole game. page.goBack() and history.back() never skip, so only this path can catch that.
 * Page state is read through CDP with userGesture off: Playwright's own evaluate counts as a user gesture
 * and would hide the bug.
 */
class SystemBack {
  private constructor(readonly context: BrowserContext, readonly page: Page, private worker: Worker, private cdp: CDPSession) {}

  static async launch(info: TestInfo): Promise<SystemBack> {
    const use = info.project.use
    const launch = use.launchOptions ?? {}
    const context = await chromium.launchPersistentContext('', {
      ...launch,
      // Extensions need full Chromium; the default headless shell cannot load them.
      channel: launch.executablePath ? undefined : (use.channel ?? 'chromium'),
      baseURL: use.baseURL,
      viewport: use.viewport,
      args: [...(launch.args ?? []), `--disable-extensions-except=${probe}`, `--load-extension=${probe}`],
    })
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
    const page = context.pages()[0] ?? await context.newPage()
    await page.route('https://fonts.googleapis.com/**', route => route.abort())
    await page.route('https://fonts.gstatic.com/**', route => route.abort())
    await page.addInitScript(() => {
      if (!location.protocol.startsWith('http')) return
      if (!localStorage.getItem('plumb-lang')) localStorage.setItem('plumb-lang', 'en')
      if (!localStorage.getItem('plumb-save-v1')) localStorage.setItem('plumb-save-v1', JSON.stringify({ version: 1, settings: { volume: 0, speed: 1 } }))
    })
    return new SystemBack(context, page, worker, await context.newCDPSession(page))
  }

  private async read<T>(expression: string): Promise<T> {
    const { result } = await this.cdp.send('Runtime.evaluate', { expression, returnByValue: true, userGesture: false })
    return result.value as T
  }

  /** The open menu, or the game screen; 'left' once Back took the browser off the game. */
  async where(): Promise<string> {
    if (!this.page.url().startsWith('http')) return 'left'
    return this.read(`${JSON.stringify(MENUS)}.find(c => document.querySelector('#stage .screen.' + c))
      ?? document.getElementById('app').dataset.mode + (document.querySelector('[data-act="overview"][aria-pressed="true"]') ? ':inspect' : '')`)
  }

  /** Back guard settled: present off the hub, gone on it, and no history step of ours in flight. */
  async settled(): Promise<void> {
    await expect.poll(async () => {
      const [mode, guarded, bare] = await this.read<[string, boolean, boolean]>(
        `[document.getElementById('app').dataset.mode, history.state?.plumbBack === true, !document.querySelector('#stage .screen')]`)
      return guarded === !(mode === 'hub' && bare)
    }).toBe(true)
  }

  /** One real Back press, then the screen it must land on. */
  async back(expected: string): Promise<void> {
    await this.worker.evaluate(() => (self as unknown as { pressBack(): Promise<void> }).pressBack())
    await expect.poll(() => this.where()).toBe(expected)
    if (expected !== 'left') await this.settled()
  }

  /** A real click (a user gesture, as in play), then the screen it opens. */
  async tap(act: string, expected: string): Promise<void> {
    await this.page.locator(`[data-act="${act}"]:visible`).last().click()
    await expect.poll(() => this.where()).toBe(expected)
    await this.settled()
  }
}

test('the real browser Back button walks the game and never skips past it', async ({}, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Needs a Chromium extension; one Chromium project covers it')
  const shell = await SystemBack.launch(info)
  const errors: string[] = []
  shell.page.on('pageerror', error => errors.push(error.message))
  try {
    // A page before the game, so leaving it is observable rather than the end of history.
    await shell.page.goto('data:text/html,before')
    await shell.page.goto(`/?seed=${seed}`)
    await expect(shell.page.locator('[data-act="start"]:visible')).toBeVisible()

    // Every menu backs out to the hub without using up the page entry.
    for (const [act, screen] of [['settings', 'settings-screen'], ['help', 'help-screen'], ['collection', 'collection-screen'], ['history', 'history-screen'], ['stars', 'star-chart'], ['research', 'research-screen'], ['quests', 'quests-screen']]) {
      await shell.tap(act, screen)
      await shell.back('hub')
    }

    // Decision rooms toggle with the journal for as long as Back is pressed.
    await shell.tap('start', 'choices')
    for (let i = 0; i < 3; i++) {
      await shell.back('journal')
      await shell.back('choices')
    }

    // A machine pauses and resumes; Inspect closes first; settings opened from pause return to pause.
    await shell.tap('pick:0', 'aim')
    for (let i = 0; i < 3; i++) {
      await shell.back('pause')
      await shell.back('aim')
    }
    await shell.tap('overview', 'aim:inspect')
    await shell.back('aim')
    await shell.back('pause')
    await shell.tap('settings', 'settings-screen')
    await shell.back('pause')
    await shell.back('aim')
    await shell.back('pause')

    // Save & go home leaves a hub with nothing of the game behind it: one more Back leaves the page.
    await shell.tap('save-exit', 'hub')
    await shell.back('left')
    await expect(shell.page).toHaveURL(/^data:text\/html,before/)
    expect(errors).toEqual([])
  } finally {
    await shell.context.close()
  }
})

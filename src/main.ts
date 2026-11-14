import '@fontsource/lilita-one/400.css'
import '@fontsource-variable/fredoka/index.css'
import '@fontsource-variable/vazirmatn/index.css'
import './game.css'
import { selfcheckPhysics } from './physics/collide'
import { Game } from './game/game'
import { isNativeApp } from './platform'
import { initLocale, t } from './i18n'

// Language first: everything after this renders in the player's language and direction.
initLocale()

// The webview's own context menu (Reload, Inspect, ...) does not belong in the shipped app.
if (isNativeApp && !import.meta.env.DEV) {
  window.addEventListener('contextmenu', (e) => e.preventDefault())
}

// Installable, offline-capable web build. Native shells and dev servers skip it.
if (!isNativeApp && !import.meta.env.DEV && 'serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(() => {}) })
}
// iOS Safari ignores user-scalable; block pinch zoom. touch-action: manipulation handles double-tap.
document.addEventListener('gesturestart', (e) => e.preventDefault())

const boot = document.getElementById('stage')
try {
  selfcheckPhysics()
  new Game()
} catch (error) {
  const message = error instanceof Error ? error.message : t('The machine failed to start.')
  if (boot) {
    boot.innerHTML = `<article class="plaque narrow"><h2>${t('The Helix is stuck')}</h2><p>${message}</p></article>`
  }
  console.error(error)
}

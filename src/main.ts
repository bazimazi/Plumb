import { selfcheckPhysics } from './physics/collide'
import { Game } from './game/game'
import { isNativeApp } from './platform'

// The webview's own context menu (Reload, Inspect, ...) does not belong in the shipped app.
if (isNativeApp && !import.meta.env.DEV) {
  window.addEventListener('contextmenu', (e) => e.preventDefault())
}

const boot = document.getElementById('stage')
try {
  selfcheckPhysics()
  new Game()
} catch (error) {
  const message = error instanceof Error ? error.message : 'The machine failed to start.'
  if (boot) {
    boot.innerHTML = `<article class="plaque narrow"><h2>The Helix is stuck</h2><p>${message}</p></article>`
  }
  console.error(error)
}

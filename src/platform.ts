/** True when the game runs inside the Tauri desktop or mobile shell. */
export const isNativeApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Public web build. Native apps share challenge links that point here. */
export const PUBLIC_URL = 'https://plumb.bazimazi.games/'

/**
 * Base URL for challenge links. In the browser this is the current page; in the
 * native shell the page origin (tauri://localhost, http://tauri.localhost) is not
 * reachable by anyone else, so links point at the public web build instead.
 */
export function shareBase(): string {
  return isNativeApp ? PUBLIC_URL : location.href
}

/**
 * Localization.
 *
 * English is the source language: every user-facing string is written in English in the code and
 * passed through `t()`, which looks it up in the active locale's dictionary (gettext style). A
 * missing entry falls back to the English text, so an untranslated string is never blank.
 *
 * Placeholders use `{name}` and are filled from `params`:
 *   t('{n} of 5 hits', { n: 3 })
 *
 * Adding a language: add a dictionary under `src/i18n/<id>/`, register it in `DICTS` and `LOCALES`.
 */
import { fa } from './fa'

export type Locale = 'fa' | 'en'
export type Dictionary = Record<string, string>
export type Params = Record<string, string | number>

export interface LocaleInfo {
  id: Locale
  /** The language's own name, shown in the language picker. */
  name: string
  dir: 'rtl' | 'ltr'
}

export const LOCALES: LocaleInfo[] = [
  { id: 'fa', name: 'فارسی', dir: 'rtl' },
  { id: 'en', name: 'English', dir: 'ltr' },
]

/** The language a new player sees. */
export const DEFAULT_LOCALE: Locale = 'fa'

const STORAGE_KEY = 'plumb-lang'
const DICTS: Record<Locale, Dictionary | null> = { fa, en: null }

/**
 * Until `initLocale()` runs, the source language is active. Headless simulations and the
 * verification scripts never call it, so they always read English.
 */
let current: Locale = 'en'
let reverse: Map<string, string> | null = null
const listeners = new Set<(locale: Locale) => void>()
const missing = new Set<string>()

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some(l => l.id === value)
}

export function locale(): Locale {
  return current
}

export function localeInfo(id: Locale = current): LocaleInfo {
  return LOCALES.find(l => l.id === id) ?? LOCALES[0]
}

export function isRtl(): boolean {
  return localeInfo().dir === 'rtl'
}

function fill(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

/** Translates an English source string into the active language. */
export function t(text: string, params?: Params): string {
  const dict = DICTS[current]
  if (!dict) return fill(text, params)
  const found = dict[text]
  if (found === undefined) {
    // Already-translated text passes through unchanged, so only Latin text can be a missing entry.
    if (import.meta.env?.DEV && /[A-Za-z]{2}/.test(text) && !missing.has(text)) {
      missing.add(text)
      console.warn(`[i18n] missing ${current} translation:`, JSON.stringify(text))
    }
    return fill(text, params)
  }
  return fill(found, params)
}

/**
 * Recovers the English source of a translated string. Presentation code that keys icons or tones
 * off English names uses this so it keeps working in every language. Unknown text is returned as is.
 */
export function source(text: string): string {
  const dict = DICTS[current]
  if (!dict) return text
  if (!reverse) {
    reverse = new Map()
    for (const [en, tr] of Object.entries(dict)) if (!reverse.has(tr)) reverse.set(tr, en)
  }
  return reverse.get(text) ?? text
}

/** Joins list items with the active language's comma. */
export function list(items: string[], sep = ', '): string {
  return items.join(sep === ', ' && isRtl() ? '، ' : sep)
}

/** Reads the URL (`?lang=`) or the saved preference, then applies the language to the document. */
export function initLocale(): Locale {
  let next: Locale = DEFAULT_LOCALE
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) next = stored
  } catch { /* optional storage */ }
  try {
    const param = new URLSearchParams(location.search).get('lang')
    if (isLocale(param)) next = param
  } catch { /* no location */ }
  current = next
  reverse = null
  applyDocument()
  return current
}

/** Switches language, remembers the choice and notifies listeners so the UI can re-render. */
export function setLocale(next: Locale): void {
  if (!isLocale(next)) return
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* optional storage */ }
  if (next === current) return
  current = next
  reverse = null
  applyDocument()
  for (const fn of listeners) fn(current)
}

export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function applyDocument(): void {
  if (typeof document === 'undefined' || !document.documentElement) return
  const info = localeInfo()
  const root = document.documentElement
  root.lang = info.id
  root.dir = info.dir
  document.title = t('PLUMB')
  const description = document.querySelector('meta[name="description"]')
  description?.setAttribute('content', t('A cosmic pachinko roguelite. Aim, nudge and bend the fall through a living machine.'))
}

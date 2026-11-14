/**
 * Localization checks. Every literal passed to `t()` in src/ must have a Persian entry, placeholders
 * must match their English source, and the per-layer dictionaries must not disagree about a key.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fa } from '../src/i18n/fa'
import { content } from '../src/i18n/fa/content'
import { game } from '../src/i18n/fa/game'
import { sim } from '../src/i18n/fa/sim'
import { ui } from '../src/i18n/fa/ui'
import { initLocale, setLocale, source, t } from '../src/i18n'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'i18n' ? [] : files(path)
    return path.endsWith('.ts') ? [path] : []
  })
}

const unescape = (s: string, quote: string) => s.replace(new RegExp(`\\\\${quote === '`' ? '`' : quote}`, 'g'), quote).replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
const call = /(?<![\w.$])t\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`)/g
const missing: string[] = []
const dynamic: string[] = []
let keys = 0
const used = new Set<string>()

for (const file of files('src')) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(call)) {
    const line = text.slice(0, m.index).split('\n').length
    const where = `${relative('.', file)}:${line}`
    if (m[3] !== undefined && m[3].includes('${')) { dynamic.push(`${where} ${m[0].slice(0, 80)}`); continue }
    const key = m[1] !== undefined ? unescape(m[1], "'") : m[2] !== undefined ? unescape(m[2], '"') : unescape(m[3], '`')
    keys++
    used.add(key)
    if (!(key in fa)) missing.push(`${where} ${JSON.stringify(key)}`)
  }
}

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')
const placeholders = Object.entries(fa).filter(([en, tr]) => holes(en) !== holes(tr)).map(([en, tr]) => `${JSON.stringify(en)} → ${JSON.stringify(tr)}`)
const empty = Object.entries(fa).filter(([, tr]) => !tr.trim()).map(([en]) => en)

const parts = { content, sim, game, ui }
const conflicts: string[] = []
const seen = new Map<string, [string, string]>()
for (const [part, dict] of Object.entries(parts)) {
  for (const [en, tr] of Object.entries(dict)) {
    const prior = seen.get(en)
    if (prior && prior[1] !== tr) conflicts.push(`${JSON.stringify(en)}: ${prior[0]}=${JSON.stringify(prior[1])} ${part}=${JSON.stringify(tr)}`)
    else seen.set(en, [part, tr])
  }
}

const report = (title: string, list: string[]) => { if (list.length) console.error(`\n${title} (${list.length}):\n  ${list.join('\n  ')}`) }
report('Missing Persian translations', missing)
report('Dynamic keys passed to t() (use {placeholders})', dynamic)
report('Placeholder mismatches', placeholders)
report('Empty translations', empty)
report('Conflicting duplicate keys', conflicts)
const unused = Object.keys(fa).filter(k => !used.has(k))
if (process.argv.includes('--unused')) report('Unused dictionary entries (may be looked up indirectly)', unused)

// Runtime behaviour: English is the source, Persian is looked up, placeholders fill in both.
assert.equal(t('{n} of 5 hits', { n: 3 }), '3 of 5 hits')
assert.equal(t('Language'), 'Language')
const store = new Map<string, string>()
Object.assign(globalThis, { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) } })
assert.equal(initLocale(), 'fa', 'Persian is the default language')
assert.equal(t('Language'), 'زبان')
assert.equal(source('زبان'), 'Language')
setLocale('en')
assert.equal(store.get('plumb-lang'), 'en')
assert.equal(initLocale(), 'en', 'the chosen language is remembered')

assert.equal(missing.length + dynamic.length + placeholders.length + empty.length + conflicts.length, 0, 'localization problems above')
console.log(`i18n: ${keys} t() calls, ${used.size} distinct keys, ${Object.keys(fa).length} Persian entries${unused.length ? `, ${unused.length} not referenced literally` : ''}`)

// Offline support for the web build. Pages are network-first so updates arrive
// promptly; fingerprinted assets are cache-first because their names change with
// each build. After every successful page load, assets the new page no longer
// references are pruned so storage does not grow with each release.
const CACHE = 'plumb-v2'
const SHELL = './'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([SHELL])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

async function prune(html) {
  const live = new Set([...html.matchAll(/["'(]\/?((?:[^"'()]*\/)?assets\/[^"'()]+)["')]/g)].map((m) => m[1].replace(/^\.?\//, '')))
  if (!live.size) return
  const cache = await caches.open(CACHE)
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname.replace(/^\//, '')
    if (path.includes('assets/') && ![...live].some((p) => path.endsWith(p))) await cache.delete(request)
  }
}

async function page(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const copy = response.clone()
      const cache = await caches.open(CACHE)
      await cache.put(SHELL, copy.clone())
      copy.text().then(prune).catch(() => {})
    }
    return response
  } catch {
    return (await caches.match(SHELL)) || Response.error()
  }
}

async function asset(request) {
  const hit = await caches.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    const copy = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, copy))
  }
  return response
}

/** Manifest and icons: serve the cached copy at once, refresh it in the background. */
async function revalidate(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  const fresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => hit)
  return hit || fresh
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') event.respondWith(page(request))
  else if (url.pathname.includes('/assets/')) event.respondWith(asset(request))
  else if (/\.(png|svg|webmanifest)$/.test(url.pathname)) event.respondWith(revalidate(request))
})

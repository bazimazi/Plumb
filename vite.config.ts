import { defineConfig } from 'vite'

// Set by `tauri android dev` / `tauri ios dev` so a device can reach the dev server.
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  // Keep Rust compiler output visible when running under `tauri dev`.
  clearScreen: false,
  server: {
    // No fixed port: Vite picks the next free one. Callers that need a known URL
    // (Tauri's devUrl, Playwright's webServer) pass `--port 5174 --strictPort` themselves.
    host: host || false,
    hmr: host ? { protocol: 'ws', host } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: { target: 'es2022' },
})

import { defineConfig } from 'vite'

// Set by `tauri android dev` / `tauri ios dev` so a device can reach the dev server.
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  // Keep Rust compiler output visible when running under `tauri dev`.
  clearScreen: false,
  server: {
    port: 5174,
    // Tauri expects the dev server at a fixed URL (see src-tauri/tauri.conf.json).
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 5174 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: { target: 'es2022' },
})

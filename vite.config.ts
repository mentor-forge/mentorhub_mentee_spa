import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/** Journey prefix served by welcome nginx and the cloud ALB; browser URLs are `/mentee/...`. */
const BASE = '/mentee/'

/** Load container runtime config before the app module so spa_utils reads IDP_LOGIN_URI. */
function injectRuntimeConfig(): Plugin {
  let base = BASE

  return {
    name: 'inject-runtime-config',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        // `vite-ignore` keeps Vite from resolving this src again: its dev HTML transform
        // joins `base` onto every root-relative URL, which would yield `/mentee/mentee/`.
        return html.replace(
          '<head>',
          `<head>
    <script>window.__MENTORHUB_RUNTIME__=window.__MENTORHUB_RUNTIME__||{};</script>
    <script src="${base}runtime-config.js" vite-ignore></script>`
        )
      },
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [vue(), injectRuntimeConfig()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8394,
    proxy: {
      // Prefixed origin (welcome nginx / ALB shape); the API still sees `/api/...`.
      '/mentee/api': {
        target: 'http://localhost:8393',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mentee/, '')
      },
      // Direct-port debugging.
      '/api': {
        target: 'http://localhost:8393',
        changeOrigin: true
      }
    }
  }
})

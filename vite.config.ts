import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/** Load container runtime config before the app module so spa_utils reads IDP_LOGIN_URI. */
function injectRuntimeConfig(): Plugin {
  let base = '/'
  return {
    name: 'inject-runtime-config',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        // vite-ignore keeps Vite 7 from rewriting the already-prefixed src to /mentee/mentee/...
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
  base: '/mentee/',
  plugins: [vue(), injectRuntimeConfig()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8394,
    proxy: {
      '/mentee/api': {
        target: 'http://localhost:8393',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mentee/, ''),
      },
      '/api': {
        target: 'http://localhost:8393',
        changeOrigin: true
      }
    }
  }
})

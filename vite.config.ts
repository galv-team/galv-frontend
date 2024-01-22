import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    commonjsOptions: { transformMixedEsModules: true }
  },
  server: {
    // disable file watching because it makes vite hang which makes docker containers unresponsive
    watch: null
  }
})

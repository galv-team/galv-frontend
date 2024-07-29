import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig(() => {
    // Actual config goes here
    return {
        build: {
            commonjsOptions: { transformMixedEsModules: true },
        },
        server: {
            // disable file watching because it makes vite hang which makes docker containers unresponsive
            watch: null,
        },
        plugins: [wasm(), topLevelAwait(), react()],
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: './src/test/setup.ts',
        },
    }
})

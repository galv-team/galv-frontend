import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Inject process.env into Vite
    // https://github.com/vitejs/vite/issues/1149#issuecomment-857686209
    const env = loadEnv(mode, process.cwd())

    // expose .env as process.env instead of import.meta since jest does not import meta yet
    const envWithProcessPrefix = Object.entries(env).reduce(
        (prev, [key, val]) => {
            return {
                ...prev,
                ['process.env.' + key]: `"${val}"`,
            }
        },
        {},
    )

    // Actual config goes here
    return {
        define: envWithProcessPrefix,
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

import { defineConfig } from 'cypress'
import customViteConfig from './vite.config'
import vitePreprocessor from 'cypress-vite'

export default defineConfig({
    e2e: {
        setupNodeEvents(on) {
            // implement node event listeners here
            on('file:preprocessor', vitePreprocessor())
        },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
            // optionally pass in vite config
            viteConfig: customViteConfig,
            // or a function - the result is merged with
            // any `vite.config` file that is detected
            // viteConfig: async () => {
            //   // ... do things ...
            //   const modifiedConfig = await injectCustomConfig(baseConfig)
            //   return modifiedConfig
            // },
        },
    },
})

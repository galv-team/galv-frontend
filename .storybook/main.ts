import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@chromatic-com/storybook',
        '@storybook/addon-interactions',
        'storybook-addon-remix-react-router',
        'msw-storybook-addon',
    ],
    core: {
        builder: '@storybook/builder-vite',
    },
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    typescript: {
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            // Speeds up Storybook build time
            compilerOptions: {
                allowSyntheticDefaultImports: false,
                esModuleInterop: false,
            },
            // Makes union prop types like variant and size appear as select controls
            shouldExtractLiteralValuesFromEnum: true,
            // Makes string and boolean types that can be undefined appear as inputs and switches
            shouldRemoveUndefinedFromOptional: true,
            // Filter out third-party props from node_modules except @mui packages
            propFilter: (prop) =>
                prop.parent
                    ? !/node_modules\/(?!@mui)/.test(prop.parent.fileName)
                    : true,
        },
    },
    env: (config) => ({
        ...config,
        EXAMPLE_VAR: 'An environment variable configured in Storybook',
    }),
    async viteFinal(config) {
        // Merge custom configuration into the default config
        const { mergeConfig } = await import('vite')

        return mergeConfig(config, {
            minify: 'terser',
        })
    },
}
export default config

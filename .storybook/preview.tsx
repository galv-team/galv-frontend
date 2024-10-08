import type { Preview } from '@storybook/react'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { restHandlers } from '../src/test/handlers'

initialize()

const preview: Preview = {
    loaders: [mswLoader],
    parameters: {
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        msw: {
            handlers: restHandlers,
        },
    },
    decorators: [
        (Story) => (
            <div
                style={{
                    width: '600px',
                    margin: '3em',
                }}
            >
                <Story />
            </div>
        ),
    ],
}

export default preview

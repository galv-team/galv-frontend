import type { Preview } from '@storybook/react'
import {initialize, mswLoader} from "msw-storybook-addon";
import {restHandlers} from "../src/test/setup";


initialize();

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
        // msw: {
        //     handlers: restHandlers,
        // },
    },
}

export default preview

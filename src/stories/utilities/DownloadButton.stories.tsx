import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import DownloadButton from '../../Components/download/DownloadButton'
import { experiments, users } from '../../test/fixtures/fixtures'
import { restHandlers } from '../../test/handlers'
import { ReactElement } from 'react'
import CurrentUserContextProvider from '../../Components/CurrentUserContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/DownloadButton',
    component: DownloadButton,
    decorators: [
        withRouter,
        (Story: ReactElement) => (
            <QueryClientProvider client={new QueryClient()}>
                <CurrentUserContextProvider
                    user_override={JSON.stringify(users[0])}
                >
                    <Story />
                </CurrentUserContextProvider>
            </QueryClientProvider>
        ),
    ],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        msw: {
            handlers: restHandlers,
        },
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        // IDs of objects to download
        targetUUIDs: { control: 'text' },
        // Whether to include data in the download (if false, just download JSON descriptions)
        includeData: { control: 'boolean' },
        // Whether to render as an IconButton rather than a full Button
        iconButton: { control: 'boolean' },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        targetUUIDs: [experiments[0].id],
    },
    beforeEach: async () => {},
} satisfies Meta<typeof DownloadButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `DownloadButton` allows users to download a resource and its related resources
 * If errors occur during download (e.g. try cancelling the file save), the component offers retry functionality.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Without data, the download button will only include the JSON description of the resource and related resources.
 */
export const AsJSON: Story = {
    args: {
        includeData: false,
    },
}

/**
 * With data, the download button will be a zip with JSON description of the resource and related resources, as well as the data itself.
 */
export const AsZIP: Story = {
    args: {
        includeData: true,
    },
}

/**
 * The `DownloadButton` can be rendered as an `IconButton` for a visually smaller display.
 */
export const IconButton: Story = {
    args: {
        iconButton: true,
    },
}

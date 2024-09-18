import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import { ReuploadFile } from '../../Components/upload/UploadFilePage'
import { users } from '../../test/fixtures/fixtures'
import { restHandlers } from '../../test/handlers'
import FetchResourceContextProvider from '../../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { CardActionBarProps } from '../../Components/CardActionBar'
import SelectionManagementContextProvider from '../../Components/SelectionManagementContext'
import CurrentUserContextProvider from '../../Components/CurrentUserContext'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/ReuploadFile',
    component: ReuploadFile,
    decorators: [
        withRouter,
        (
            Story: ReactElement,
            context: { args: CardActionBarProps & { resourceId?: string } },
        ) => (
            <QueryClientProvider client={new QueryClient()}>
                <CurrentUserContextProvider
                    user_override={JSON.stringify(users[0])}
                >
                    <SelectionManagementContextProvider>
                        <FetchResourceContextProvider>
                            <Story />
                        </FetchResourceContextProvider>
                    </SelectionManagementContextProvider>
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
        clickOnly: {
            description:
                'If true, the user can only click the button to upload a file, not drag-n-drop.',
            control: {
                type: 'boolean',
            },
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {},
    beforeEach: async () => {},
} satisfies Meta<typeof ReuploadFile>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ReuploadFile` allows users to complete an upload by re-uploading a file.
 */
export const Basic: Story = {
    args: {},
}

/**
 * When `clickOnly` is true, the user can only click the button to upload a file, not drag-n-drop.
 * This provides a one-line interface that fits in a smaller space, e.g. on the `Dashboard`.
 */
export const ClickOnly: Story = {
    args: {
        clickOnly: true,
    },
}

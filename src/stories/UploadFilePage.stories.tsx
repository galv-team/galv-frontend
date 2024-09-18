import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import UploadFilePage from '../Components/upload/UploadFilePage'
import { users } from '../test/fixtures/fixtures'
import { restHandlers } from '../test/handlers'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { CardActionBarProps } from '../Components/CardActionBar'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import CurrentUserContextProvider from '../Components/CurrentUserContext'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'UploadFilePage',
    component: UploadFilePage,
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
    argTypes: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {},
    beforeEach: async () => {},
} satisfies Meta<typeof UploadFilePage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `UploadFilePage` allows users to upload custom data files directly from their computer.
 */
export const Basic: Story = {
    args: {},
}

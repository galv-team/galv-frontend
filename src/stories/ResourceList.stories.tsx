import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import ResourceList from '../Components/ResourceList'
import { LOOKUP_KEYS } from '../constants'
import { error_responses, restHandlers } from '../test/handlers'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceList',
    component: ResourceList,
    decorators: [
        withRouter,
        (Story: ReactElement) => (
            <QueryClientProvider client={new QueryClient()}>
                <SelectionManagementContextProvider>
                    <FetchResourceContextProvider>
                        <Story />
                    </FetchResourceContextProvider>
                </SelectionManagementContextProvider>
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
        lookup_key: {
            control: 'select',
            options: [
                ...Object.values(LOOKUP_KEYS),
                ...Object.keys(error_responses),
            ],
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        lookup_key: LOOKUP_KEYS.CELL,
    },
} satisfies Meta<typeof ResourceList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ResourceList` displays a list of `ResourceCard` components.
 * The list forms the main body of the page for many views.
 *
 * It also includes some `IntroText` to explain the purpose of the list.
 *
 * Lists also handle pagination and filtering.
 */
export const Basic: Story = {
    args: {},
}

/**
 * If the API returns an error, it will be caught by the `ResourceList`'s error boundary.
 */
export const ApiError: Story = {
    args: {
        // @ts-expect-error deliberately setting a value that will cause an API error
        lookup_key: Object.keys(error_responses)[0],
    },
}

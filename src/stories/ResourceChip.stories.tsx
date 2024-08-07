import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import ResourceChip from '../Components/ResourceChip'
import { LOOKUP_KEYS } from '../constants'
import {
    cell_families,
    cells,
    column_mappings,
    column_types,
    files,
    teams,
} from '../test/fixtures/fixtures'
import { error_responses, restHandlers } from '../test/handlers'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceChip',
    component: ResourceChip,
    decorators: [
        withRouter,
        (Story: ReactElement) => (
            <QueryClientProvider client={new QueryClient()}>
                <FetchResourceContextProvider>
                    <Story />
                </FetchResourceContextProvider>
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
        resource_id: {
            control: 'select',
            options: [
                ...[
                    ...cells,
                    ...cell_families,
                    ...teams,
                    ...column_types,
                    ...files,
                    ...column_mappings,
                ].map((r) => r.id),
                ...Object.keys(error_responses),
            ],
        },
        short_name: {
            control: 'boolean',
            description:
                'Whether to show the short name of the resource. Defaults to false.',
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        short_name: false,
        resource_id: cells[0].id,
        lookup_key: LOOKUP_KEYS.CELL,
    },
} satisfies Meta<typeof ResourceChip>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ResourceChip` component is used to display a clear, clickable representation of a resource.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Some resources have a short name that can be displayed instead of the full name.
 *
 * This is usually when the resource inherits from a family; the short name won't include the family name.
 */
export const ShortName: Story = {
    args: {
        short_name: true,
    },
}

/**
 * If the resource cannot be found on the server, the chip will not be able to display its name,
 * but will still provide it as a clickable link.
 */
export const UnknownResource: Story = {
    args: {
        resource_id: 'unknown-resource-id',
    },
}

/**
 * If the API returns an error response, the chip will display an error message.
 */
export const ApiError: Story = {
    args: {
        resource_id: Object.keys(error_responses)[0],
    },
}

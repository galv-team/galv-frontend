import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import {
    ResourceCreator,
    ResourceCreatorProps,
} from '../Components/ResourceCreator'
import { LOOKUP_KEYS } from '../constants'
import {
    cell_families,
    cells,
    column_mappings,
    column_types,
    files,
    teams,
    users,
} from '../test/fixtures/fixtures'
import { restHandlers } from '../test/handlers'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import { http, HttpResponse } from 'msw'
import CurrentUserContextProvider from '../Components/CurrentUserContext'
import { expect, fn, userEvent, within } from '@storybook/test'
import AttachmentUploadContextProvider from '../Components/AttachmentUploadContext'
import UndoRedoProvider from '../Components/UndoRedoContext'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceCreator',
    component: ResourceCreator,
    decorators: [
        withRouter,
        (Story: ReactElement, context: { args: ResourceCreatorProps }) => (
            <QueryClientProvider client={new QueryClient()}>
                <CurrentUserContextProvider
                    user_override={JSON.stringify(users[0])}
                >
                    <SelectionManagementContextProvider>
                        <FetchResourceContextProvider>
                            <AttachmentUploadContextProvider>
                                <UndoRedoProvider>
                                    <Story />
                                </UndoRedoProvider>
                            </AttachmentUploadContextProvider>
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
        lookupKey: {
            control: 'select',
            // token creation is handled separately
            options: { ...LOOKUP_KEYS, TOKEN: undefined },
        },
        initial_data: {
            control: 'select',
            options: Object.fromEntries(
                [
                    ...cells,
                    ...cell_families,
                    ...teams,
                    ...column_types,
                    ...files,
                    ...column_mappings,
                ].map((r) => [r.id, r]),
            ),
        },
    },
    args: {
        lookupKey: LOOKUP_KEYS.CELL,
    },
    beforeEach: async () => {
        window.confirm = fn(() => true)
    },
} satisfies Meta<typeof ResourceCreator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ResourceCreator` is used as a `Modal` that allows creation of resources.
 *
 * The `lookupKey` determines the type of resource that will be created, and hence the fields that will be displayed.
 *
 * Tokens are created separately using the `TokenCreator` component.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Providing `initial_data` will pre-populate the fields, which is used when forking resources.
 */
export const InitialData: Story = {
    args: {
        initial_data: cells[1],
    },
}

/**
 * When you fail to update a resource, you should see an error message and any relevant fields should be
 * given error feedback.
 */
export const SaveError: Story = {
    args: {
        initial_data: cells[1],
    },
    parameters: {
        msw: {
            handlers: [
                http.post(`*/cells/*`, (...args) => {
                    console.log(args)
                    return HttpResponse.error()
                }),
                ...restHandlers.filter(
                    (h) =>
                        h.info.method !== 'PATCH' ||
                        !/cells/.test(String(h.info.path)),
                ),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const saveButton = await canvas.findByRole('button', {
            name: /save/i,
        })
        await expect(saveButton).toBeInTheDocument()
        await userEvent.click(saveButton)

        const errorMessage = await canvas.findByText(/error/i)
        expect(errorMessage).toBeInTheDocument()
    },
}

/**
 * If a resource update fails with an error from the Django server,
 * the non_field_errors and any field errors will be unwrapped and applied
 * as a header banner and inline error feedback on the affected fields.
 */
export const SaveErrorFromDjango: Story = {
    args: {},
    parameters: {
        msw: {
            handlers: [
                http.post(`*/cells/*`, (...args) => {
                    console.log(args)
                    return HttpResponse.json(
                        {
                            non_field_errors: [
                                "You can't do that.",
                                "And you probably shouldn't even be trying to do that.",
                            ],
                            identifier: 'You should fix this',
                        },
                        { status: 400 },
                    )
                }),
                ...restHandlers.filter(
                    (h) =>
                        h.info.method !== 'PATCH' ||
                        !/cells/.test(String(h.info.path)),
                ),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const saveButton = await canvas.findByRole('button', {
            name: /save/i,
        })
        await expect(saveButton).toBeInTheDocument()
        await userEvent.click(saveButton)

        const errorMessage = await canvas.findByText(/3 errors/i)
        expect(errorMessage).toBeInTheDocument()
    },
}

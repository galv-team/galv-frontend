import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import ResourceCard from '../Components/card/ResourceCard'
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
import { error_responses, restHandlers } from '../test/handlers'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { CardActionBarProps } from '../Components/CardActionBar'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import ApiResourceContextProvider from '../Components/ApiResourceContext'
import { http, HttpResponse } from 'msw'
import CurrentUserContextProvider from '../Components/CurrentUserContext'
import { expect, fn, userEvent, within } from '@storybook/test'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceCard',
    component: ResourceCard,
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
                            <ApiResourceContextProvider
                                lookupKey={
                                    context.args.lookupKey ?? LOOKUP_KEYS.CELL
                                }
                                resourceId={
                                    context.args.resourceId ?? cells[0].id
                                }
                            >
                                <Story />
                            </ApiResourceContextProvider>
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
            options: [
                ...Object.values(LOOKUP_KEYS),
                ...Object.keys(error_responses),
            ],
        },
        resourceId: {
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
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        resourceId: cells[0].id,
        lookupKey: LOOKUP_KEYS.CELL,
    },
    beforeEach: async () => {
        window.confirm = fn(() => true)
    },
} satisfies Meta<typeof ResourceCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ResourceCard` is the main component of the application.
 *
 * It displays a card with the resource's name and a summary, and has buttons to edit, delete, and view the resource.
 * If `expanded`, it will display an exhaustive list of the resource's fields.
 *
 * Summaries for many of the different resources are defined in custom components,
 * while the exhaustive list of fields is obtained by crawling the object itself.
 * The metadata for the exhaustive field list is extracted from a combination of
 * data from the relevant `/lookupKey/describe/` endpoint and the `FIELDS` object in `constants.ts`.
 */
export const Basic: Story = {
    args: {},
}

/**
 * When expanded, the `ResourceCard` will display all the fields of the resource.
 *
 * These are separated into Read-only, Editable, and Custom fields.
 * Resources that inherit from other resources will display the inherited fields in a separate section.
 */
export const Expanded: Story = {
    args: {
        expanded: true,
    },
}

/**
 * When `editing` is true, the `ResourceCard` will display the fields in edit mode.
 * This only applies to fields in the Editable and Custom sections.
 */
export const Editing: Story = {
    args: {
        editing: true,
    },
}

/**
 * If the API returns an error, it will be caught by the `ResourceCard`'s error boundary.
 */
export const ApiError: Story = {
    args: {
        resourceId: Object.keys(error_responses)[0],
    },
}

/**
 * When you save the edits to a `ResourceCard`, you should see a success message.
 */
export const SaveSuccess: Story = {
    args: {
        editing: true,
        expanded: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const saveButton = await canvas.findByRole('button', {
            name: /save/i,
        })
        await expect(saveButton).toBeInTheDocument()
        await userEvent.click(saveButton)

        const successMessage = await canvas.findByText(/success/i)
        expect(successMessage).toBeInTheDocument()
    },
}

/**
 * When you fail to update a resource, you should see an error message and any relevant fields should be
 * given error feedback.
 */
export const SaveError: Story = {
    args: {
        editing: true,
        expanded: true,
    },
    parameters: {
        msw: {
            handlers: [
                http.patch(`*/cells/*`, (...args) => {
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
    args: {
        editing: true,
        expanded: true,
    },
    parameters: {
        msw: {
            handlers: [
                http.patch(`*/cells/*`, (...args) => {
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

/**
 * When you fail to delete a resource, you should see an error message.
 */
export const DeleteError: Story = {
    args: {
        // @ts-expect-error permissions does actually have destroy in it, or might
        resourceId: cells.find((c) => !c.in_use && c.permissions.destroy)?.id,
    },
    parameters: {
        msw: {
            handlers: [
                http.delete(`*/cells/*`, (...args) => {
                    console.log(args)
                    return HttpResponse.error()
                }),
                ...restHandlers.filter(
                    (h) =>
                        h.info.method !== 'DELETE' ||
                        !/cells/.test(String(h.info.path)),
                ),
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const deleteButton = await canvas.findByRole('button', {
            name: /delete/i,
        })
        await expect(deleteButton).toBeInTheDocument()
        await userEvent.click(deleteButton)

        const errorMessage = await canvas.findByText(/error/i)
        expect(errorMessage).toBeInTheDocument()
    },
}

import type {Meta, StoryObj} from '@storybook/react'
import {withRouter} from 'storybook-addon-remix-react-router'
import ResourceCard from '../Components/ResourceCard'
import {LOOKUP_KEYS} from "../constants";
import {cell_families, cells, column_mappings, column_types, files, teams} from "../test/fixtures/fixtures";
import {error_responses, restHandlers} from "../test/handlers";
import FetchResourceContextProvider from "../Components/FetchResourceContext";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactElement} from "react";
import {CardActionBarProps} from "../Components/CardActionBar";
import SelectionManagementContextProvider from "../Components/SelectionManagementContext";
import ApiResourceContextProvider from "../Components/ApiResourceContext";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceCard',
    component: ResourceCard,
    decorators: [
        withRouter,
        (Story: ReactElement, context: { args: CardActionBarProps & {resource_id? : string}}) => (
            <QueryClientProvider client={new QueryClient()}>
                <SelectionManagementContextProvider>
                    <FetchResourceContextProvider>
                        <ApiResourceContextProvider
                            lookup_key={context.args.lookup_key ?? LOOKUP_KEYS.CELL}
                            resource_id={context.args.resource_id ?? cells[0].id}
                        >
                            <Story />
                        </ApiResourceContextProvider>
                    </FetchResourceContextProvider>
                </SelectionManagementContextProvider>
            </QueryClientProvider>),
    ],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        msw: {
            handlers: restHandlers,
        }
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        lookup_key: {
            control: 'select',
            options: [...Object.values(LOOKUP_KEYS), ...Object.keys(error_responses)],
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
                ...Object.keys(error_responses)
            ],
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        resource_id: cells[0].id,
        lookup_key: LOOKUP_KEYS.CELL
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
 * data from the relevant `/lookup_key/describe/` endpoint and the `FIELDS` object in `constants.ts`.
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
        expanded: true
    }
}

/**
 * When `editing` is true, the `ResourceCard` will display the fields in edit mode.
 * This only applies to fields in the Editable and Custom sections.
 */
export const Editing: Story = {
    args: {
        editing: true
    }
}

/**
 * If the API returns an error, it will be caught by the `ResourceCard`'s error boundary.
 */
export const ApiError: Story = {
    args: {
        resource_id: Object.keys(error_responses)[0]
    },
}
import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import ResourceList from '../Components/ResourceList'
import {LOOKUP_KEYS} from "../constants";
import {cell_families, cells, column_mappings, column_types, files, teams} from "../test/fixtures/fixtures";
import {restHandlers} from "../test/handlers";
import FetchResourceContextProvider from "../Components/FetchResourceContext";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {http, HttpResponse} from "msw";
import {ReactElement} from "react";
import {ListActionBarProps} from "../Components/ListActionBar";
import SelectionManagementContextProvider from "../Components/SelectionManagementContext";
import ApiResourceContextProvider from "../Components/ApiResourceContext";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'ResourceList',
    component: ResourceList,
    decorators: [
        withRouter,
        (Story: ReactElement, context: { args: ListActionBarProps & {resource_id? : string}}) => (
            <QueryClientProvider client={new QueryClient()}>
                <SelectionManagementContextProvider>
                    <FetchResourceContextProvider>
                        <Story />
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
            options: Object.values(LOOKUP_KEYS),
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        lookup_key: LOOKUP_KEYS.CELL
    },
} satisfies Meta<typeof ResourceList>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Basic: Story = {
    args: {},
}

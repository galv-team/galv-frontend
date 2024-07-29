import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { withRouter } from 'storybook-addon-remix-react-router'
import {cell_families, cells, column_mappings, column_types, files, teams} from "../test/fixtures/fixtures";
import {http, HttpResponse} from "msw";
import JSONDump from "./JSONDump";
import {restHandlers} from "../test/handlers";
// const restHandlers: unknown[] = []
const TestData = {
    user: {
        userID: 1,
        name: 'Someone',
    },
    document: {
        id: 1,
        userID: 1,
        title: 'Something',
        brief: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        status: 'approved',
    },
    subdocuments: [
        {
            id: 1,
            userID: 1,
            title: 'Something',
            content:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            status: 'approved',
        },
    ],
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Debug/JSONDump',
    component: JSONDump,
    decorators: [withRouter],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        msw: {
            handlers: [
                http.get('*', () => {
                    return HttpResponse.json(TestData);
                }),
            ],
        }
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        initial_json: {},
        url: {}
    },
} satisfies Meta<typeof JSONDump>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
    args: {
    },
}

export const Cell: Story = {
    args: {
        initial_json: cells[0],
        url: cells[1].url
    },
    parameters: {
        msw: {handlers: restHandlers}
    },
}

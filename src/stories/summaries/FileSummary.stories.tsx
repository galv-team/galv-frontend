import type { Meta, StoryObj } from '@storybook/react'
import FileSummary from '../../Components/card/summaries/FileSummary'
import { file_applicable_mappings, files } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/File',
    component: FileSummary,
    /**
     * withRouter is required for the Link parts of the ResourceChip component to work.
     */
    decorators: [withRouter, SummaryDecorator],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        resource: {
            control: 'select',
            options: files.map((file) => file.name ?? file.state),
            mapping: Object.fromEntries(
                files.map((file) => [file.name ?? file.state, file]),
            ),
        },
    },
    args: {
        resource: files[0],
    },
} satisfies Meta<typeof FileSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `FileSummary` shows the path of the file an `Alert` based on its status.
 *
 * Files that have been sucessfully mapped are shown with a green alert.
 */
export const Basic: Story = {
    args: {
        resource: files.find(
            (file) => file.state === 'IMPORTED' && file.mapping !== '',
        ),
    },
}

/**
 * Files that are awaiting mapping assignments are shown with a yellow alert.
 */
export const AwaitingMapping: Story = {
    args: {
        resource: files.find(
            (file) => file.state === 'AWAITING MAP ASSIGNMENT',
        ),
    },
}

/**
 * Files that have been assigned a mapping but are not yet mapped are shown with a blue alert.
 */
export const MapAssigned: Story = {
    args: {
        resource: files.find((file) => file.state === 'MAP ASSIGNED'),
    },
}

/**
 * Files that have errored during upload are shown with a red alert.
 */
export const ImportFailed: Story = {
    args: {
        resource: files.find((file) => file.state === 'IMPORT FAILED'),
    },
}

/**
 * Files that cannot be mapped are shown with a red alert.
 */
export const NoMapping: Story = {
    args: {
        resource: files.find(
            (file) => file_applicable_mappings[file.id]?.length === 0,
        ),
    },
}

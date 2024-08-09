import type { Meta, StoryObj } from '@storybook/react'
import ColumnSummary from '../../Components/card/summaries/ColumnSummary'
import { column_types } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Column',
    component: ColumnSummary,
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
            options: column_types.map(
                (column_type) => column_type.name ?? column_type.id,
            ),
            mapping: Object.fromEntries(
                column_types.map((column_type) => [
                    column_type.name ?? column_type.id,
                    column_type,
                ]),
            ),
        },
    },
    args: {
        resource: column_types[0],
    },
} satisfies Meta<typeof ColumnSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ColumnSummary` summarises details for a particular resource on its unexpanded `ResourceCard`.
 */
export const Basic: Story = {
    args: {},
}

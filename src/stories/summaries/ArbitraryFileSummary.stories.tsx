import type { Meta, StoryObj } from '@storybook/react'
import ArbitraryFileSummary from '../../Components/summaries/ArbitraryFileSummary'
import { arbitrary_files } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Attachment',
    component: ArbitraryFileSummary,
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
            options: arbitrary_files.map(
                (arbitrary_file) => arbitrary_file.name ?? arbitrary_file.id,
            ),
            mapping: Object.fromEntries(
                arbitrary_files.map((arbitrary_file) => [
                    arbitrary_file.name ?? arbitrary_file.id,
                    arbitrary_file,
                ]),
            ),
        },
    },
    args: {
        resource: arbitrary_files[0],
    },
} satisfies Meta<typeof ArbitraryFileSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ArbitraryFileSummary` summary shows a Download button and a description.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Some descriptions can be quite long.
 */
export const LongDescription: Story = {
    args: {
        resource: arbitrary_files.find((arbitrary_file) =>
            /Long/i.test(arbitrary_file.name),
        ),
    },
}

/**
 * Some files don't have a description.
 */
export const NoDescription: Story = {
    args: {
        resource: arbitrary_files.find(
            (arbitrary_file) => !arbitrary_file.description,
        ),
    },
}

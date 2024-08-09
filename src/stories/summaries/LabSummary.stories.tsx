import type { Meta, StoryObj } from '@storybook/react'
import LabSummary from '../../Components/card/summaries/LabSummary'
import { labs } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Lab',
    component: LabSummary,
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
    argTypes: {
        resource: {
            control: 'select',
            options: labs.map((lab) => lab.name),
            mapping: Object.fromEntries(labs.map((lab) => [lab.name, lab])),
        },
    },
    args: {
        resource: labs[0],
    },
} satisfies Meta<typeof LabSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `LabSummary` shows the recent activity of a lab.
 */
export const Basic: Story = {
    args: {},
}

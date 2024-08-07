import type { Meta, StoryObj } from '@storybook/react'
import ExperimentSummary from '../../Components/summaries/ExperimentSummary'
import { experiments } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Experiment',
    component: ExperimentSummary,
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
            options: experiments.map(
                (experiment) => experiment.title ?? experiment.id,
            ),
            mapping: Object.fromEntries(
                experiments.map((experiment) => [
                    experiment.title ?? experiment.id,
                    experiment,
                ]),
            ),
        },
    },
    args: {
        resource: experiments[0],
    },
} satisfies Meta<typeof ExperimentSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `ExperimentSummary` shows the Cycler Tests that comprise the Experiment.
 */
export const Basic: Story = {
    args: {},
}

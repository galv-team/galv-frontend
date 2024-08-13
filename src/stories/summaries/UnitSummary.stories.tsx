import type { Meta, StoryObj } from '@storybook/react'
import UnitSummary from '../../Components/card/summaries/UnitSummary'
import { data_units as units } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Unit',
    component: UnitSummary,
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
            options: units.map((unit) => unit.name),
            mapping: Object.fromEntries(units.map((unit) => [unit.name, unit])),
        },
    },
    args: {
        resource: units[0],
    },
} satisfies Meta<typeof UnitSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `UnitSummary` shows the description of a Unit.
 */
export const Basic: Story = {
    args: {},
}

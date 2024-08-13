import type { Meta, StoryObj } from '@storybook/react'
import TeamSummary from '../../Components/card/summaries/TeamSummary'
import { teams } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Team',
    component: TeamSummary,
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
            options: teams.map((team) => team.name),
            mapping: Object.fromEntries(teams.map((team) => [team.name, team])),
        },
    },
    args: {
        resource: teams[0],
    },
} satisfies Meta<typeof TeamSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `TeamSummary` shows the admins and members of a Team.
 */
export const Basic: Story = {
    args: {},
}

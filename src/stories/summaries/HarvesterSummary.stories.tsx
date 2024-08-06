import type { Meta, StoryObj } from '@storybook/react'
import HarvesterSummary from '../../Components/summaries/HarvesterSummary'
import { harvesters } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

const harvester_mapping = Object.fromEntries([
    [
        'RecentCheckIn',
        {
            ...harvesters[0],
            last_check_in: new Date().toISOString(),
        },
    ],
    [
        'Inactive',
        {
            ...harvesters[0],
            last_check_in: new Date().toISOString(),
            active: false,
        },
    ],
    [
        'LastCheckInOld',
        {
            ...harvesters[0],
            last_check_in: new Date(
                new Date().getTime() - 1000 * 60 * 60 * 25,
            ).toISOString(),
        },
    ],
    ['NotYetCheckedIn', { ...harvesters[0], last_check_in: undefined }],
    [
        'LastCheckInVeryOld',
        {
            ...harvesters[0],
            last_check_in: new Date('2021-01-01').toISOString(),
        },
    ],
])

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Harvester',
    component: HarvesterSummary,
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
            options: Object.keys(harvester_mapping),
            mapping: harvester_mapping,
        },
    },
    args: {
        resource: harvester_mapping.RecentCheckIn,
    },
} satisfies Meta<typeof HarvesterSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `HarvesterSummary` shows the recent activity of a harvester.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Harvesters might be inactive.
 */
export const Inactive: Story = {
    args: { resource: harvester_mapping.Inactive },
}

/**
 * Harvesters that have not checked in within 24h are shown with a yellow alert.
 */
export const LastCheckInOld: Story = {
    args: { resource: harvester_mapping.LastCheckInOld },
}

/**
 * Harvesters that have never checked in .
 */
export const NotYetCheckedIn: Story = {
    args: { resource: harvester_mapping.NotYetCheckedIn },
}

/**
 * Last check in is displayed using days.js relative time.
 */
export const LastCheckInVeryOld: Story = {
    args: { resource: harvester_mapping.LastCheckInVeryOld },
}

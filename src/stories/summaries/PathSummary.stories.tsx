import type { Meta, StoryObj } from '@storybook/react'
import PathSummary from '../../Components/summaries/PathSummary'
import { monitored_paths as paths } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Path',
    component: PathSummary,
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
            options: paths.map((path) => path.path),
            mapping: Object.fromEntries(paths.map((path) => [path.path, path])),
        },
    },
    args: {
        resource: paths[0],
    },
} satisfies Meta<typeof PathSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `PathSummary` shows the harvester a path belongs to and a few of the files on it.
 */
export const Basic: Story = {
    args: {},
}

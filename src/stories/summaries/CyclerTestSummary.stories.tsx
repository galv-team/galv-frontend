import type { Meta, StoryObj } from '@storybook/react'
import CyclerTestSummary from '../../Components/summaries/CyclerTestSummary'
import { cycler_tests } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/CyclerTest',
    component: CyclerTestSummary,
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
            options: cycler_tests.map((cycler_test) => cycler_test.id),
            mapping: Object.fromEntries(
                cycler_tests.map((cycler_test) => [
                    cycler_test.id,
                    cycler_test,
                ]),
            ),
        },
    },
    args: {
        resource: cycler_tests[0],
    },
} satisfies Meta<typeof CyclerTestSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `CyclerTestSummary` shows ResourceChips for its component parts.
 */
export const Basic: Story = {
    args: {},
}

/**
 * Some cycler tests are associated with data files.
 */
export const WithData: Story = {
    args: { resource: cycler_tests.find((ct) => ct.files.length > 0) },
}

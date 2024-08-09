import type { Meta, StoryObj } from '@storybook/react'
import AdditionalStorageSummary from '../../Components/card/summaries/AdditionalStorageSummary'
import { additional_storages } from '../../test/fixtures/fixtures'
import { withRouter } from 'storybook-addon-remix-react-router'
import SummaryDecorator from './SummaryDecorator'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/AdditionalStorage',
    component: AdditionalStorageSummary,
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
            options: additional_storages.map(
                (additional_storage) =>
                    additional_storage.name ?? additional_storage.id,
            ),
            mapping: Object.fromEntries(
                additional_storages.map((additional_storage) => [
                    additional_storage.name ?? additional_storage.id,
                    additional_storage,
                ]),
            ),
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        resource: additional_storages[0],
    },
} satisfies Meta<typeof AdditionalStorageSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `AdditionalStorageSummary` summarises details for a particular resource on its unexpanded `ResourceCard`.
 */
export const Basic: Story = {
    args: {},
}

/**
 * When the storage is nearly full, the `AdditionalStorageSummary` should show a warning.
 */
export const NearlyFull: Story = {
    args: {
        resource: additional_storages.find((s) => s.name === 'Nearly full'),
    },
}

/**
 * When the storage is full, the `AdditionalStorageSummary` should show an error.
 */
export const Full: Story = {
    args: {
        resource: additional_storages.find((s) => s.name === 'Full'),
    },
}

/**
 * When the storage is disabled, the `AdditionalStorageSummary` should show a warning.
 */
export const Disabled: Story = {
    args: {
        resource: additional_storages.find((s) => s.name === 'Disabled'),
    },
}

/**
 * When the storage is disabled and full, the `AdditionalStorageSummary` should show both the warning and error.
 */
export const DisabledAndFull: Story = {
    args: {
        resource: additional_storages.find(
            (s) => s.name === 'Disabled and full',
        ),
    },
}

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import SafeTooltip from '../../Components/SafeTooltip'
import IconButton from '@mui/material/IconButton'
import { MdAdsClick } from 'react-icons/md'
import Tooltip from '@mui/material/Tooltip'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/SafeTooltip',
    component: SafeTooltip,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    args: {
        disabledRole: undefined,
    },
    argTypes: {
        disabledRole: {
            control: 'select',
            options: [
                'spinbutton',
                'button',
                'checkbox',
                'menuitem',
                'tab',
                undefined,
            ],
        },
    },
} satisfies Meta<typeof SafeTooltip>

export default meta
type Story = StoryObj<typeof meta>

/**
 * When the SafeTooltip's child is enabled, the immediate child will be the clickable element.
 */
export const ChildEnabled: Story = {
    render: () => (
        <SafeTooltip title={'This is a tooltip'}>
            <IconButton onClick={fn}>
                <MdAdsClick />
            </IconButton>
        </SafeTooltip>
    ),
}

/**
 *  When the SafeTooltip is disabled, the child will be wrapped in a span with the disabled role.
 *  The span will be given the aria-label and aria-disabled attributes,
 *  and these attributes will also be passed to the disabled child.
 *
 *  Notice that storybook-a11y does not complain.
 */
export const ChildDisabled: Story = {
    render: () => (
        <SafeTooltip title={'This is a tooltip'}>
            <IconButton onClick={fn} disabled>
                <MdAdsClick />
            </IconButton>
        </SafeTooltip>
    ),
}

/**
 * A custom `role` can be passed to the SafeTooltip to be used when the child is disabled.
 *
 * This role should make sense for the component - try setting it to 'tab' and see the result
 * in the Accessibility panel.
 */
export const CustomRole: Story = {
    render: (args) => (
        <SafeTooltip
            title={'This is a tooltip'}
            disabledRole={args.disabledRole}
        >
            <IconButton onClick={fn} disabled>
                <MdAdsClick />
            </IconButton>
        </SafeTooltip>
    ),
}

/**
 * If Tooltip is used instead of SafeTooltip, storybook-a11y will complain.
 * Check the 'Accessibility' panel to see issues.
 */
export const MUITooltip: Story = {
    render: () => (
        <Tooltip title={'This is a tooltip'}>
            <span>
                <IconButton onClick={fn} disabled>
                    <MdAdsClick />
                </IconButton>
            </span>
        </Tooltip>
    ),
}

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { withRouter } from 'storybook-addon-remix-react-router'
import CountBadge from '../../Components/CountBadge'
import LookupKeyIcon from '../../Components/LookupKeyIcon'
import { LOOKUP_KEYS } from '../../constants'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/CountBadge',
    component: CountBadge,
    decorators: [withRouter],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        icon: {
            options: Object.values(LOOKUP_KEYS),
            mapping: Object.fromEntries(
                Object.values(LOOKUP_KEYS).map((lookupKey) => [
                    lookupKey,
                    <LookupKeyIcon lookupKey={lookupKey} />,
                ]),
            ),
        },
        badgeContent: { control: 'number' },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onClick: fn() },
} satisfies Meta<typeof CountBadge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `CountBadge` component is used to display a count of items, with an optional icon and tooltip.
 * It is used when showing the number of related resources a resource has, for example.
 *
 * The `tooltip` prop accepts a string that will be displayed when the user hovers over the badge.
 *
 * The `badgeContent` prop is part of the underlying Material-UI Badge component.
 */
export const WithURL: Story = {
    args: {
        url: 'http://example.com/',
        icon: <LookupKeyIcon lookupKey={LOOKUP_KEYS.TEAM} />,
        tooltip: 'Go to example.com',
        badgeContent: 10,
    },
}

/**
 * If there is no URL, the badge will not be clickable.
 */
export const NoURL: Story = {
    args: {
        icon: <LookupKeyIcon lookupKey={LOOKUP_KEYS.TEAM} />,
        badgeContent: 10,
    },
}

/**
 * If there is no count, the icon will still be displayed, but the badge will be hidden.
 */
export const NoCount: Story = {
    args: {
        icon: <LookupKeyIcon lookupKey={LOOKUP_KEYS.TEAM} />,
        badgeContent: 0,
    },
}

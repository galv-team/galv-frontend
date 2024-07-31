import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import LookupKeyIcon from '../Components/LookupKeyIcon'
import { LOOKUP_KEYS } from '../constants'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/LookupKeyIcon',
    component: LookupKeyIcon,
    decorators: [withRouter],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        lookupKey: { options: Object.values(LOOKUP_KEYS) },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { lookupKey: LOOKUP_KEYS.CELL, tooltip: false },
} satisfies Meta<typeof LookupKeyIcon>

export default meta
type Story = StoryObj<typeof meta>

/**
 * LookupKeyIcon is a utility component that displays an icon representing a lookup key.
 * It's used in various places in the UI to help users quickly identify the type of data they're looking at.
 *
 * It ties in with the `LOOKUP_KEYS` constant, so it should be easy to add new icons as needed.
 *
 * **Note**: Currently the `tooltip` prop is not working as expected in Storybook.
 * It displays sometimes and not others.
 */
export const Basic: Story = {
    args: {},
}

/**
 * This story demonstrates the `tooltip` prop, which adds a tooltip to the icon.
 *
 * The tooltip's text is the lookup key's name.
 * If absolutely required, the tooltip text can be overridden by using the `tooltipProps` `title` prop.
 */
export const WithTooltip: Story = {
    args: { tooltip: true },
}

/**
 * When the `plural` prop is set to `true`, the tooltip will display the plural form of the lookup key's name.
 *
 * If `tooltip` is `false`, the `plural` prop has no effect.
 */
export const WithPluralTooltip: Story = {
    args: { tooltip: true, plural: true },
}

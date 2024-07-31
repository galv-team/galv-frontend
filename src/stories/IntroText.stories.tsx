import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import IntroText from '../Components/IntroText'
import { LOOKUP_KEYS } from '../constants'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'IntroText',
    component: IntroText,
    decorators: [withRouter],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        k: { options: Object.values(LOOKUP_KEYS) },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { k: LOOKUP_KEYS.CELL },
} satisfies Meta<typeof IntroText>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `IntroText` component is used to display a short introduction to a page.
 *
 * It takes text from the `constants.ts` file and feeds it through a Markdown parser.
 */
export const Cell: Story = {
    args: {},
}

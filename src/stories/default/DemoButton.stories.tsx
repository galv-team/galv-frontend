import { StoryFn, Meta } from '@storybook/react'
import { Button } from './Button'

export default {
    component: Button,
} as Meta<typeof Button>

const Template: StoryFn<typeof Button> = (args) => <Button {...args} />

export const Default = Template.bind({})

Default.args = {
    label: 'Order Pizza',
}

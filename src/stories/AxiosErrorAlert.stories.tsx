import type { Meta, StoryObj } from '@storybook/react'
import AxiosErrorAlert from '../Components/AxiosErrorAlert'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/AxiosErrorAlert',
    component: AxiosErrorAlert,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        error: {
            options: ['field_errors', 'non_field_errors', 'both', 'lots_of_errors', 'long_error'],
            mapping: {
                field_errors: {
                    response: {
                        data: {
                            "field1": "This is an error for field1",
                            "field2": "This is an error for field2",
                        },
                    }
                },
                non_field_errors: {
                    response: {
                        data: {
                            "non_field_errors": "Some errors don't apply to a specific field",
                        },
                    }
                },
                both: {
                    response: {
                        data: {
                            "non_field_errors": "Some errors don't apply to a specific field",
                            "field1": "This is an error for field1",
                        },
                    }
                },
                lots_of_errors: {
                    response: {
                        data: Object.fromEntries(Array.from({length: 12}, (_, i) => {
                            const field_name = i === 0 ? 'non_field_errors' : `field${i}`;
                            return [`${field_name}`, `Error in ${field_name}`]
                        })),
                    }
                },
                long_error: {
                    response: {
                        data: {
                            "SomeQuiteLongFieldNameForBalance": `
This is a very long error message that should be truncated.
It is so long that it will be truncated by the AxiosErrorAlert component.
Or at least could be, if that's what we want to do.

Lorem ipsum dolor sit amet, consectetur adipiscing elit
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This is a very long error message that should be truncated.
It is so long that it will be truncated by the AxiosErrorAlert component.
Or at least could be, if that's what we want to do.
                            `,
                        },
                    }
                },
            }
        },
        maxErrors: {control: "number"},
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        // @ts-expect-error - mapping keys aren't correctly picked up by TS - https://github.com/storybookjs/storybook/issues/22578
        error: 'both',
        maxErrors: 3,
    },
} satisfies Meta<typeof AxiosErrorAlert>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Basic: Story = {
    args: {},
}

export const LongError: Story = {
    args: {
        // @ts-expect-error mapping keys
        error: 'long_error',
    },
}

export const LotsOfErrors: Story = {
    args: {
        // @ts-expect-error mapping keys
        error: 'lots_of_errors',
    },
}

export const UncappedLotsOfErrors: Story = {
    args: {
        // @ts-expect-error mapping keys
        error: 'lots_of_errors',
        maxErrors: 500,
    },
}

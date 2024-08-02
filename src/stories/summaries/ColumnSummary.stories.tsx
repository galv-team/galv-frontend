import type { Meta, StoryObj } from '@storybook/react'
import ColumnSummary from '../../Components/summaries/ColumnSummary'
import { column_types } from '../../test/fixtures/fixtures'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import Skeleton from '@mui/material/Skeleton'
import React, { ReactElement } from 'react'
import CardContent from '@mui/material/CardContent'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../../Components/FetchResourceContext'
import { withRouter } from 'storybook-addon-remix-react-router'
import { ICONS } from '../../constants'
import Stack from '@mui/material/Stack'
import LoadingChip from '../../Components/LoadingChip'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Summaries/Column',
    component: ColumnSummary,
    /**
     * Render the component inside a dummy Card component to show how it would look in context.
     * The QueryClientProvider and FetchResourceContextProvider are included to support subcomponents that
     * require API data (e.g. Unit ResourceChips in the ColumnSummary).
     *
     * withRouter is required for the Link parts of the ResourceChip component to work.
     */
    decorators: [
        withRouter,
        (Story: ReactElement) => (
            <QueryClientProvider client={new QueryClient()}>
                <FetchResourceContextProvider>
                    <Card>
                        <CardHeader
                            avatar={
                                <Skeleton
                                    variant="rounded"
                                    height="2em"
                                    width="2em"
                                />
                            }
                            title="Dummy Resource Name"
                            subheader={
                                <Stack direction="row" spacing={1}>
                                    Resource Type
                                    <LoadingChip icon={<ICONS.TEAM />} />
                                </Stack>
                            }
                            action={
                                <Stack direction="row" spacing={1}>
                                    {Array.from({ length: 4 }).map(() => (
                                        <Skeleton width="2em" height="2em" />
                                    ))}
                                </Stack>
                            }
                        />
                        <CardContent>
                            <Story />
                        </CardContent>
                    </Card>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        ),
    ],
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
            options: column_types.map(
                (column_type) => column_type.name ?? column_type.id,
            ),
            mapping: Object.fromEntries(
                column_types.map((column_type) => [
                    column_type.name ?? column_type.id,
                    column_type,
                ]),
            ),
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        resource: column_types[0],
    },
} satisfies Meta<typeof ColumnSummary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `AxiosErrorAlert` component is used to display error messages from Axios responses by the Django backend.
 * It can handle both field-specific errors and general errors.
 *
 * Where there are multiple errors, the component will display the first `maxErrors` errors,
 * and provide a button to show the rest.
 */
export const Basic: Story = {
    args: {},
}

import React, { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../../Components/FetchResourceContext'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import CardContent from '@mui/material/CardContent'

/**
 * Renders the component inside a dummy Card component to show how it would look in context.
 * The QueryClientProvider and FetchResourceContextProvider are included to support subcomponents that
 * require API data (e.g. Unit ResourceChips in the ColumnSummary).
 */
export default function SummaryDecorator(Story: ReactElement) {
    return (
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
                        subheader="Resource Type"
                        action={
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ marginLeft: '1em' }}
                            >
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        variant="rectangular"
                                        width="2em"
                                        height="2em"
                                    />
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
    )
}

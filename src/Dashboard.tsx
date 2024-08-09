import {
    DISPLAY_NAMES_PLURAL,
    ICONS,
    LOOKUP_KEYS,
    LookupKey,
} from './constants'
import { AxiosError, AxiosResponse } from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    ObservedFile,
    PaginatedSchemaValidationList,
    SchemaValidation,
    SchemaValidationsApi,
} from '@galv/galv'
import { get_url_components, id_from_ref_props } from './Components/misc'
import LookupKeyIcon from './Components/LookupKeyIcon'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItem from '@mui/material/ListItem'
import { ResourceChip } from './Components/ResourceChip'
import Stack from '@mui/material/Stack'
import React, { ReactNode, useState } from 'react'
import Button from '@mui/material/Button'
import { useCurrentUser } from './Components/CurrentUserContext'
import List from '@mui/material/List'
import { SvgIconProps } from '@mui/material/SvgIcon'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Chip from '@mui/material/Chip'
import Representation from './Components/Representation'
import ListSubheader from '@mui/material/ListSubheader'
import IntroText from './Components/IntroText'
import Box from '@mui/material/Box'
import clsx from 'clsx'
import UseStyles from './styles/UseStyles'
import useStyles from './styles/UseStyles'
import {
    ListQueryResult,
    useFetchResource,
} from './Components/FetchResourceContext'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import SafeTooltip from './Components/SafeTooltip'

type SchemaValidationSummary = {
    detail: SchemaValidation
    lookupKey?: LookupKey
    resourceId?: string
}

const get_color = (status: SchemaValidation['status'] | 'INPUT_REQUIRED') => {
    switch (status) {
        case 'VALID':
            return 'success'
        case 'ERROR':
            return 'error'
        case 'INVALID':
        case 'INPUT_REQUIRED':
            return 'warning'
        default:
            return undefined
    }
}

function MdStatus({
    status,
    count,
    ...props
}: { status: SchemaValidation['status']; count?: number } & SvgIconProps) {
    const ICON = ICONS[`validation_status_${status}` as keyof typeof ICONS]
    const color = get_color(status)
    return count ? (
        <Chip icon={<ICON color={color} {...props} />} label={count} />
    ) : (
        <ICON color={color} {...props} />
    )
}

function KeySummary({
    lookupKey,
    data,
}: {
    lookupKey: LookupKey
    data: SchemaValidationSummary[]
}) {
    const status_counts: {
        [key in SchemaValidation['status']]?: { [schema_id: string]: number }
    } = {}
    data.forEach((d) => {
        const id = id_from_ref_props<string>(d.detail.schema)
        if (status_counts[d.detail.status] === undefined)
            status_counts[d.detail.status] = { [id]: 1 }
        else {
            const s = status_counts[d.detail.status]!
            if (s[id] === undefined) s[id] = 1
            else s[id]++
        }
    })

    const [open, setOpen] = useState(false)

    const tooltip = (status: SchemaValidation['status']) => (
        <List>
            <ListSubheader>{status}</ListSubheader>
            {status_counts[status] &&
                Object.entries(status_counts[status]!).map(
                    ([schema_id, count]) => (
                        <ListItem key={schema_id}>
                            <ListItemText key="count">
                                <Representation
                                    resourceId={schema_id}
                                    lookupKey={LOOKUP_KEYS.VALIDATION_SCHEMA}
                                />
                                : {count}
                            </ListItemText>
                        </ListItem>
                    ),
                )}
        </List>
    )

    const hasContent =
        data.filter((d) => ['ERROR', 'INVALID'].includes(d.detail.status))
            .length > 0

    return (
        <Card>
            <CardHeader
                onClick={() => setOpen(!open)}
                sx={{ cursor: hasContent ? 'pointer' : undefined }}
                avatar={<LookupKeyIcon lookupKey={lookupKey} />}
                title={DISPLAY_NAMES_PLURAL[lookupKey]}
                action={
                    <Stack direction="row" spacing={1} alignItems="center">
                        {Object.keys(status_counts).map((status) => (
                            <SafeTooltip
                                key={status}
                                title={tooltip(
                                    status as SchemaValidation['status'],
                                )}
                                placement="left"
                                arrow
                            >
                                <MdStatus
                                    status={
                                        status as SchemaValidation['status']
                                    }
                                    count={
                                        status_counts[
                                            status as keyof typeof status_counts
                                        ] &&
                                        Object.entries(
                                            status_counts[
                                                status as keyof typeof status_counts
                                            ]!,
                                        ).reduce((a, c) => a + c[1], 0)
                                    }
                                />
                            </SafeTooltip>
                        ))}
                    </Stack>
                }
                subheader={
                    !open && hasContent
                        ? 'Click for details of failed validations'
                        : ''
                }
            />
            {open && hasContent && (
                <CardContent>
                    <List>
                        {data
                            .filter((d) =>
                                ['ERROR', 'INVALID'].includes(d.detail.status),
                            )
                            .map((d) => d.resourceId)
                            .filter((id, i, a) => a.indexOf(id) === i)
                            .filter((id): id is string => id !== undefined)
                            .map((id) => (
                                <ListItem key={id}>
                                    <Stack>
                                        <ResourceChip
                                            resourceId={id}
                                            lookupKey={lookupKey}
                                            short_name={false}
                                        />
                                        <List>
                                            {data
                                                .filter(
                                                    (d) =>
                                                        d.resourceId === id &&
                                                        [
                                                            'ERROR',
                                                            'INVALID',
                                                        ].includes(
                                                            d.detail.status,
                                                        ),
                                                )
                                                .map((d) => (
                                                    <ListItem
                                                        key={d.detail.schema}
                                                    >
                                                        <ListItemIcon>
                                                            <MdStatus
                                                                status={
                                                                    d.detail
                                                                        .status
                                                                }
                                                            />
                                                        </ListItemIcon>
                                                        <ResourceChip
                                                            resourceId={id_from_ref_props(
                                                                d.detail.schema,
                                                            )}
                                                            lookupKey={
                                                                LOOKUP_KEYS.VALIDATION_SCHEMA
                                                            }
                                                        />
                                                        <Typography>
                                                            {d.detail.detail
                                                                ?.message ??
                                                                'No further information'}
                                                        </Typography>
                                                    </ListItem>
                                                ))}
                                        </List>
                                    </Stack>
                                </ListItem>
                            ))}
                    </List>
                </CardContent>
            )}
        </Card>
    )
}

export function SchemaValidationList() {
    const { setLoginFormOpen, user } = useCurrentUser()

    // API handler
    const { api_config } = useCurrentUser()
    const api_handler = new SchemaValidationsApi(api_config)
    // Queries
    const queryClient = useQueryClient()
    const query = useQuery<
        AxiosResponse<PaginatedSchemaValidationList>,
        AxiosError,
        SchemaValidationSummary[]
    >({
        queryKey: ['SCHEMA_VALIDATION', 'dashboard-list'],
        queryFn: () =>
            api_handler.schemaValidationsList().then((r): typeof r => {
                try {
                    // Update the cache for each resource
                    r.data.results?.forEach((resource: SchemaValidation) => {
                        queryClient.setQueryData(
                            ['SCHEMA_VALIDATION', resource.id],
                            { ...r, data: resource },
                        )
                    })
                } catch (e) {
                    console.error('Error updating cache from list data.', e)
                }
                return r
            }),
        select: (data) => {
            const out: SchemaValidationSummary[] = []
            data.data.results?.forEach((resource: SchemaValidation) => {
                out.push({
                    detail: resource,
                    ...get_url_components(resource.validation_target),
                })
            })
            return out
        },
    })

    let body: ReactNode | null = null
    if (!query.data) body = <p>Loading...</p>
    else if (query.data.length === 0)
        body = !user?.token ? (
            <p>
                <Button onClick={() => setLoginFormOpen(true)}>Log in</Button>{' '}
                to see your dashboard.
            </p>
        ) : (
            <p>
                There's nothing to show on your dashboard yet. When you're added
                to some teams you'll see the status of your data and metadata
                here.
            </p>
        )

    return (
        <Container maxWidth="lg">
            {body || (
                <Stack spacing={1}>
                    {query.data &&
                        query.data
                            .map((d) => d.lookupKey)
                            .filter((k, i, a) => a.indexOf(k) === i)
                            .filter((k): k is LookupKey => k !== undefined)
                            .map((k) => (
                                <KeySummary
                                    key={k}
                                    lookupKey={k}
                                    data={query.data.filter(
                                        (d) => d.lookupKey === k,
                                    )}
                                />
                            ))}
                </Stack>
            )}
        </Container>
    )
}

export function DatasetStatus() {
    const [open, setOpen] = useState(false)
    const { useListQuery } = useFetchResource()
    const query = useListQuery(
        LOOKUP_KEYS.FILE,
    ) as ListQueryResult<ObservedFile>
    const { classes } = useStyles()

    if (query?.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()

    const state_to_status = (state: ObservedFile['state']) => {
        switch (state) {
            case 'IMPORTED':
                return 'VALID'
            case 'AWAITING MAP ASSIGNMENT':
                return 'INPUT_REQUIRED'
            case 'IMPORT FAILED':
                return 'ERROR'
            default:
                return 'UNCHECKED'
        }
    }

    const statusCounts = query.results?.reduce(
        (a, b) => {
            const status = state_to_status(b.state)
            if (a[status] === undefined) a[status] = { [b.state]: 1 }
            else {
                if (a[status]![b.state] === undefined) a[status]![b.state] = 1
                else a[status]![b.state]!++
            }
            return a
        },
        {} as Record<
            ReturnType<typeof state_to_status>,
            Partial<Record<ObservedFile['state'], number>>
        >,
    )

    const SafeTooltipContent = ({
        status,
    }: {
        status: ReturnType<typeof state_to_status>
    }) => {
        return (
            <List>
                {statusCounts &&
                    Object.entries(statusCounts[status]!).map(
                        ([state, count]) => (
                            <ListItem key={state}>
                                <ListItemText>
                                    {state}: {count}
                                </ListItemText>
                            </ListItem>
                        ),
                    )}
            </List>
        )
    }

    const files_needing_input = query.results?.filter(
        (f) => f.state === 'AWAITING MAP ASSIGNMENT',
    )

    return (
        <Container maxWidth="lg">
            {query.isInitialLoading ? (
                <Skeleton height="4em" />
            ) : (
                <Card>
                    <CardHeader
                        avatar={<LookupKeyIcon lookupKey={LOOKUP_KEYS.FILE} />}
                        title={DISPLAY_NAMES_PLURAL[LOOKUP_KEYS.FILE]}
                        action={
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                {query.isFetching && (
                                    <CircularProgress
                                        className={clsx(classes.inlineProgress)}
                                        size={20}
                                    />
                                )}
                                {statusCounts &&
                                    Object.entries(statusCounts).map(
                                        ([status, counts]) => (
                                            <SafeTooltip
                                                title={
                                                    <SafeTooltipContent
                                                        status={
                                                            status as ReturnType<
                                                                typeof state_to_status
                                                            >
                                                        }
                                                    />
                                                }
                                                key={status}
                                                placement="left"
                                                arrow
                                            >
                                                <MdStatus
                                                    key={status}
                                                    status={
                                                        status as SchemaValidation['status']
                                                    }
                                                    count={Object.entries(
                                                        counts,
                                                    ).reduce(
                                                        (a, c) => a + c[1],
                                                        0,
                                                    )}
                                                />
                                            </SafeTooltip>
                                        ),
                                    )}
                            </Stack>
                        }
                    />
                    {files_needing_input && files_needing_input.length > 0 && (
                        <CardContent
                            onClick={() => setOpen(!open)}
                            onKeyDown={(e) => {
                                if (
                                    e.target === e.currentTarget &&
                                    [' ', 'Enter'].includes(e.key)
                                )
                                    setOpen(!open)
                            }}
                            tabIndex={0}
                            sx={{ cursor: 'pointer' }}
                        >
                            {open ? (
                                <List>
                                    {files_needing_input.map((f) => (
                                        <ListItem key={f.id}>
                                            <SafeTooltip title={f.state}>
                                                <ICONS.validation_status_INPUT_REQUIRED color="warning" />
                                            </SafeTooltip>
                                            <ResourceChip
                                                resourceId={f.id}
                                                lookupKey={LOOKUP_KEYS.FILE}
                                                short_name={false}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography>
                                    <em>
                                        Click to see all{' '}
                                        {files_needing_input.length} files with
                                        ambiguous mapping.
                                    </em>
                                </Typography>
                            )}
                        </CardContent>
                    )}
                </Card>
            )}
        </Container>
    )
}

function Dev() {
    return <></>
}

export default function Dashboard() {
    const { classes } = UseStyles()
    return (
        <Stack spacing={2}>
            <Box sx={{ padding: 1 }}>
                <Typography
                    component="h1"
                    variant="h3"
                    className={clsx(classes.pageTitle, classes.text)}
                >
                    Dashboard
                </Typography>
                <IntroText k={'DASHBOARD'} />
            </Box>
            <Typography variant={'h6'} sx={{ paddingLeft: '1em' }}>
                Harvested Files
            </Typography>
            <DatasetStatus />
            <Typography variant={'h6'} sx={{ paddingLeft: '1em' }}>
                Metadata Validations
            </Typography>
            <SchemaValidationList />
            {import.meta.env.NODE_ENV == 'development' && <Dev />}
        </Stack>
    )
}

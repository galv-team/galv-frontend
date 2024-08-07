import { FilesApi, ObservedFile } from '@galv/galv'
import useStyles from '../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Alert, { AlertColor, AlertProps } from '@mui/material/Alert'
import React, { ReactNode } from 'react'
import { GalvResource, ICONS, PATHS } from '../../constants'
import Collapse from '@mui/material/Collapse'
import { DB_MappingResource } from '../Mapping'
import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../CurrentUserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import IconButton from '@mui/material/IconButton'

function StatusAlert({
    message,
    fix_button,
    children,
    ...alertProps
}: { message: ReactNode; fix_button: ReactNode } & AlertProps) {
    const { classes } = useStyles()
    const [open, setOpen] = React.useState(false)
    const EXPAND_ICON = ICONS[open ? 'EXPAND_LESS' : 'EXPAND_MORE']
    return (
        <Alert {...alertProps} className={classes.statusAlert}>
            <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ width: '100%' }}
            >
                {message}
                <Stack direction="row" alignItems="center">
                    {fix_button}
                    {children && (
                        <IconButton
                            onClick={() => setOpen(!open)}
                            title="expand"
                        >
                            <EXPAND_ICON />
                        </IconButton>
                    )}
                </Stack>
            </Stack>
            <Collapse in={open} unmountOnExit>
                {children}
            </Collapse>
        </Alert>
    )
}

function FileStatus(file: ObservedFile, mappings: DB_MappingResource[]) {
    const map = mappings.find((m) => m.url === file.mapping)
    if (map) {
        if (map.is_valid) {
            return (
                <StatusAlert
                    message={`File mapped using valid mapping '${map.name}'`}
                    fix_button={
                        <Button
                            component={Link}
                            to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                            size="small"
                        >
                            Edit mapping
                        </Button>
                    }
                    severity="success"
                >
                    Data has the required columns. Preview and analysis tools
                    are available.
                </StatusAlert>
            )
        } else {
            return (
                <StatusAlert
                    message={`An invalid mapping '${map.name}' is applied to this file`}
                    fix_button={
                        <Button
                            component={Link}
                            to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                            size="small"
                        >
                            Edit mapping
                        </Button>
                    }
                    severity="warning"
                >
                    All mappings must recognise 'ElapsedTime_s', 'Voltage_V',
                    and 'Current_A' columns to be counted as valid. Data that do
                    not have these columns cannot be previewed, and may not be
                    suitable for analysis.
                </StatusAlert>
            )
        }
    } else {
        if (mappings.length > 0) {
            return (
                <StatusAlert
                    message="There are mappings that can be applied to this file, but none have been selected"
                    fix_button={
                        <Button
                            component={Link}
                            to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                            size="small"
                        >
                            Choose mapping
                        </Button>
                    }
                    severity="warning"
                >
                    Mappings are used to map the columns in a file to the
                    columns in the database. When a suite of files use the same
                    column names to represent the same kind of data, analyses
                    can be performed across all the files. Galv requires that
                    certain key columns are present in every file:
                    'ElapsedTime_s', 'Voltage_V', and 'Current_A'.
                </StatusAlert>
            )
        } else {
            return (
                <StatusAlert
                    message="There are no mappings that can be applied to this file"
                    fix_button={
                        <Button
                            component={Link}
                            to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                            size="small"
                        >
                            Create mapping
                        </Button>
                    }
                    severity="error"
                >
                    Mappings are used to map the columns in a file to the
                    columns in the database. When a suite of files use the same
                    column names to represent the same kind of data, analyses
                    can be performed across all the files. Galv requires that
                    certain key columns are present in every file:
                    'ElapsedTime_s', 'Voltage_V', and 'Current_A'.
                </StatusAlert>
            )
        }
    }
}

export default function FileSummary({ resource }: { resource: GalvResource }) {
    const { classes } = useStyles()
    const r = resource as unknown as ObservedFile
    // look up mappings from file
    const fileApiHandler = new FilesApi(useCurrentUser().api_config)
    const queryClient = useQueryClient()
    const applicableMappingsQuery = useQuery<
        AxiosResponse<DB_MappingResource[]>,
        AxiosError
    >({
        queryKey: ['applicable_mappings', r.id],
        queryFn: async () => {
            const data = await fileApiHandler.filesApplicableMappingsRetrieve({
                id: r.id as string,
            })
            queryClient.setQueryData(['applicable_mappings', r.id], data)
            const content = data.data as unknown as {
                mapping: DB_MappingResource
                missing: number
            }[]
            return {
                ...data,
                data: content.map((m) => {
                    return { ...m.mapping, missing: m.missing }
                }),
            } as unknown as AxiosResponse<DB_MappingResource[]>
        },
        enabled: !!r.id,
    })
    const mappings = applicableMappingsQuery.data?.data ?? []

    let state_severity: AlertColor

    switch (r.state) {
        case 'IMPORT FAILED':
            state_severity = 'error'
            break
        case 'RETRY IMPORT':
        case 'AWAITING MAP ASSIGNMENT':
        case 'AWAITING STORAGE':
            state_severity = 'warning'
            break
        case 'IMPORTED':
            state_severity = 'success'
            break
        default:
            state_severity = 'info'
    }

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            <kbd>{r.path}</kbd>
            {r.state === 'IMPORTED' ? (
                FileStatus(r, mappings)
            ) : (
                <Alert severity={state_severity}>Status: {r.state}</Alert>
            )}
        </Stack>
    )
}

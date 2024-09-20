import { FilesApi, ObservedFile } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Alert, { AlertColor, AlertProps } from '@mui/material/Alert'
import React, { ReactNode } from 'react'
import { GalvResource, ICONS, LOOKUP_KEYS, PATHS } from '../../../constants'
import Collapse from '@mui/material/Collapse'
import {
    applicable_mapping_to_db_mapping,
    ApplicableMappingResource,
    DB_MappingResource,
} from '../../Mapping'
import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../../CurrentUserContext'
import { useQuery } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import IconButton from '@mui/material/IconButton'
import QueryWrapper from '../../QueryWrapper'
import CircularProgress from '@mui/material/CircularProgress'
import { ReuploadFile } from '../../upload/UploadFilePage'
import Typography from '@mui/material/Typography'
import AlertTitle from '@mui/material/AlertTitle'
import AuthImage from '../../AuthImage'
import { useFetchResource } from '../../FetchResourceContext'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useApiResource } from '../../ApiResourceContext'

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

export type MappingQuickSelectProps = {
    file: ObservedFile
    mappings: DB_MappingResource[]
    inline?: boolean
}

function MappingQuickSelect({
    file,
    mappings,
    inline,
}: MappingQuickSelectProps) {
    const [selected, setSelected] = React.useState<string>(
        mappings.find((m) => m.url === file.mapping)?.url ?? '',
    )
    const { useUpdateQuery } = useFetchResource()
    const updateQuery = useUpdateQuery<ObservedFile>(LOOKUP_KEYS.FILE, {
        after_cache: () => {
            setStatus(
                <Alert severity="success">Mapping updated successfully</Alert>,
            )
        },
        on_error: (e) => {
            setStatus(
                <Alert severity="error">
                    Error updating mapping: {e.message}
                </Alert>,
            )
            return undefined
        },
    })
    const [status, setStatus] = React.useState<ReactNode>(<></>)

    return (
        <Stack direction={inline ? 'row' : 'column'} spacing={1}>
            <Select
                value={selected}
                onChange={(e) => {
                    setStatus(<></>)
                    setSelected(e.target.value as string)
                }}
                disabled={!updateQuery.isIdle}
            >
                {mappings.map((m) => (
                    <MenuItem key={m.url} value={m.url}>
                        {m.name}
                    </MenuItem>
                ))}
                <MenuItem key={''} value={''} disabled={true}>
                    <em>None</em>
                </MenuItem>
            </Select>
            <Button
                onClick={() => {
                    updateQuery.mutate({ id: file.id, mapping: selected })
                }}
                disabled={
                    !selected ||
                    selected === file.mapping ||
                    !updateQuery.isIdle
                }
            >
                Set mapping
            </Button>
            <Collapse>{status}</Collapse>
        </Stack>
    )
}

export function MappingQuickSelectFromContext({
    hideIfEmpty,
    ...props
}: { hideIfEmpty?: boolean } & Omit<
    MappingQuickSelectProps,
    'mappings' | 'file'
>) {
    const { apiResource } = useApiResource<ObservedFile>()
    const fileApiHandler = new FilesApi(useCurrentUser().api_config)
    const applicableMappingsQuery = useQuery<
        AxiosResponse<ApplicableMappingResource[]>,
        AxiosError
    >({
        queryKey: ['applicable_mappings', apiResource?.id],
        queryFn: async () => {
            const data = await fileApiHandler.filesApplicableMappingsRetrieve({
                id: apiResource!.id,
            })
            return {
                ...data,
                data: data.data as unknown as ApplicableMappingResource[],
            }
        },
        enabled: !!(apiResource && apiResource.id),
    })
    const mappings = applicableMappingsQuery.data?.data ?? []
    return !hideIfEmpty || mappings.length > 0 ? (
        <MappingQuickSelect
            file={apiResource!}
            mappings={applicable_mapping_to_db_mapping(mappings)}
            {...props}
        />
    ) : (
        <></>
    )
}

function FileStatus(file: ObservedFile, mappings: DB_MappingResource[]) {
    const map = mappings.find((m) => m.url === file.mapping)
    if (map) {
        if (map.is_valid) {
            if (file.uploader && file.state === 'MAP ASSIGNED') {
                return (
                    <Alert>
                        <AlertTitle>Ready for reupload</AlertTitle>
                        <Typography>
                            The mapping has been selected for this file, and it
                            is ready for re-uploading. Please drop the file into
                            the upload area to re-upload it.
                        </Typography>
                        {file.permissions.write && <ReuploadFile />}
                    </Alert>
                )
            }
            return (
                <StatusAlert
                    message={`File mapped using valid mapping '${map.name}'`}
                    fix_button={
                        file.permissions.write && (
                            <Button
                                component={Link}
                                to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                                size="small"
                            >
                                Edit mapping
                            </Button>
                        )
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
                        file.permissions.write && (
                            <Button
                                component={Link}
                                to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                                size="small"
                            >
                                Edit mapping
                            </Button>
                        )
                    }
                    severity="warning"
                >
                    All mappings must recognise 'ElapsedTime_s', 'Voltage_V',
                    and 'Current_A' columns to be counted as valid. Data that do
                    not have these columns cannot be previewed, and may not be
                    suitable for analysis.
                    {file.permissions.write && (
                        <MappingQuickSelect file={file} mappings={mappings} />
                    )}
                </StatusAlert>
            )
        }
    } else {
        if (mappings.length > 0) {
            return (
                <StatusAlert
                    message="There are mappings that can be applied to this file, but none have been selected"
                    fix_button={
                        file.permissions.write && (
                            <Button
                                component={Link}
                                to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                                size="small"
                            >
                                Choose mapping
                            </Button>
                        )
                    }
                    severity="warning"
                >
                    Mappings are used to map the columns in a file to the
                    columns in the database. When a suite of files use the same
                    column names to represent the same kind of data, analyses
                    can be performed across all the files. Galv requires that
                    certain key columns are present in every file:
                    'ElapsedTime_s', 'Voltage_V', and 'Current_A'.
                    {file.permissions.write && (
                        <MappingQuickSelect file={file} mappings={mappings} />
                    )}
                </StatusAlert>
            )
        } else {
            return (
                <StatusAlert
                    message="There are no mappings that can be applied to this file"
                    fix_button={
                        file.permissions.write && (
                            <Button
                                component={Link}
                                to={`${PATHS.MAPPING}/${file.id ?? file.id}`}
                                size="small"
                            >
                                Create mapping
                            </Button>
                        )
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

export default function FileSummary({
    resource,
    hidePath,
}: {
    resource: GalvResource
    hidePath?: boolean
}) {
    const { classes } = useStyles()
    const r = resource as unknown as ObservedFile
    // look up mappings from file
    const fileApiHandler = new FilesApi(useCurrentUser().api_config)
    const applicableMappingsQuery = useQuery<
        AxiosResponse<ApplicableMappingResource[]>,
        AxiosError
    >({
        queryKey: ['applicable_mappings', r?.id],
        queryFn: async () => {
            const data = await fileApiHandler.filesApplicableMappingsRetrieve({
                id: r!.id,
            })
            return {
                ...data,
                data: data.data as unknown as ApplicableMappingResource[],
            }
        },
        enabled: !!(r && r.id),
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
            {!hidePath && <kbd>{r.path}</kbd>}
            {r.has_required_columns && r.png && (
                <AuthImage
                    file={
                        r as unknown as {
                            id: string
                            path: string
                            png: string
                        }
                    }
                />
            )}
            <QueryWrapper
                queries={[applicableMappingsQuery]}
                loading={
                    <Alert icon={<CircularProgress />} color="info">
                        Fetching file mapping info
                    </Alert>
                }
                error={<p>Unable to determine mapping status.</p>}
                success={
                    r.state === 'IMPORTED' ||
                    r.state === 'AWAITING MAP ASSIGNMENT' ||
                    r.state === 'MAP ASSIGNED' ? (
                        FileStatus(
                            r,
                            applicable_mapping_to_db_mapping(mappings),
                        )
                    ) : (
                        <Alert severity={state_severity}>
                            Status: {r.state}
                        </Alert>
                    )
                }
            />
        </Stack>
    )
}

import { ICONS, key_to_type, LOOKUP_KEYS, PATHS } from '../constants'
import React, { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import ApiResourceContextProvider, {
    useApiResource,
} from './ApiResourceContext'
import Button from '@mui/material/Button'
import { useNavigate, useParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import ErrorCard from './error/ErrorCard'
import Avatar from '@mui/material/Avatar'
import ErrorBoundary from './ErrorBoundary'
import clsx from 'clsx'
import useStyles from '../styles/UseStyles'
import Paper from '@mui/material/Paper'
import Collapse from '@mui/material/Collapse'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Table from '@mui/material/Table'
import QueryWrapper from './QueryWrapper'
import Skeleton from '@mui/material/Skeleton'
import TableBody from '@mui/material/TableBody'
import { ResourceChip } from './ResourceChip'
import { useFetchResource } from './FetchResourceContext'
import ListItemText from '@mui/material/ListItemText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { ResourceCreator } from './ResourceCreator'
import UndoRedoProvider from './UndoRedoContext'
import Modal from '@mui/material/Modal'
import ListItemIcon from '@mui/material/ListItemIcon'
import TextField from '@mui/material/TextField'
import FilledInput from '@mui/material/FilledInput'
import PrettyResource from './prettify/PrettyResource'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import {
    to_type_value_notation_wrapper,
    TypeValueNotation,
    TypeValueNotationWrapper,
} from './TypeValueNotation'
import PrettyObject from './prettify/PrettyObject'
import { Theme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import { MdArrowLeft, MdArrowRight } from 'react-icons/md'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    ColumnMapping,
    ColumnMappingDeleteAccessLevelEnum,
    ColumnMappingEditAccessLevelEnum,
    ColumnMappingReadAccessLevelEnum,
    DataColumnType,
    FilesApi,
    ObservedFile,
} from '@galv/galv'
import { useCurrentUser } from './CurrentUserContext'
import { AxiosError, AxiosResponse } from 'axios'
import { deep_copy } from './misc'
import SafeTooltip from './SafeTooltip'

type MapEntry = {
    name?: string
    addition?: number
    multiplier?: number
    column_type: DataColumnType
}
type Map = Record<string, MapEntry>
type MappingResource = Omit<ColumnMapping, 'map'> & { map: Map }

// A Map but the column_type is an id, as stored in the database
type DB_MapEntry = Omit<MapEntry, 'column_type'> & { column_type: number }
type DB_Map = Record<string, DB_MapEntry>
export type DB_MappingResource = Omit<ColumnMapping, 'map'> & { map: DB_Map }

// The server wraps mappings in an object that includes information about how many columns in the File are unmapped
type ApplicableMappingResource = {
    mapping: DB_MappingResource
    missing: number
}

const col_id_to_col = (col_id: number, columns: DataColumnType[]) =>
    columns.find((c) => c.id === col_id)

const db_map_to_map = (
    db_map: DB_MappingResource,
    columns: DataColumnType[],
): MappingResource => {
    if (!db_map.map) return { ...db_map, map: {} }
    return {
        ...db_map,
        map: Object.fromEntries(
            Object.entries(db_map.map)
                .map(([k, v]) => {
                    const col = col_id_to_col(v.column_type, columns)
                    if (!col) {
                        console.warn(
                            `Column ${v.column_type} not found in columns`,
                            columns,
                        )
                        return [null, null]
                    }
                    return [k, { ...v, column_type: col }]
                })
                .filter((v) => v[0] !== null),
        ),
    }
}
const map_to_db_map = (mapping: MappingResource): DB_MappingResource => {
    return {
        ...mapping,
        map: Object.fromEntries(
            Object.entries(mapping.map).map(([k, v]) => {
                return [k, { ...v, column_type: v.column_type.id }]
            }),
        ),
    }
}

const convert = (v: (string | number | boolean)[], map?: MapEntry) => {
    const data_type = map?.column_type?.data_type ?? 'float'
    const rescale = (val: number) =>
        (val + (map?.addition ?? 0)) * (map?.multiplier ?? 1)
    switch (data_type) {
        case 'bool':
            return v.map((val) => val === 'true' || val === true || val === 1)
        case 'float':
            return v.map((val) => rescale(parseFloat(String(val))))
        case 'int':
            return v.map((val) => rescale(parseInt(String(val))))
        case 'str':
            return v.map((val) => String(val))
        case 'datetime64[ns]':
            return v.map((val) =>
                typeof val === 'boolean'
                    ? new Date(String(val))
                    : new Date(val),
            )
    }
}

function CreateColumnType({
    onCreate,
    open,
    setOpen,
}: {
    onCreate: (new_resource_url?: string) => void
    open: boolean
    setOpen: (o: boolean) => void
}) {
    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby={'create-column-type-title'}
            sx={{ padding: (t) => t.spacing(4) }}
        >
            <>
                <UndoRedoProvider>
                    <ResourceCreator<DataColumnType>
                        onCreate={(new_resource_url) => {
                            setOpen(false)
                            onCreate(new_resource_url)
                        }}
                        onDiscard={() => setOpen(false)}
                        lookup_key={LOOKUP_KEYS.COLUMN_FAMILY}
                    />
                </UndoRedoProvider>
            </>
        </Modal>
    )
}

function SelectColumnType({
    selected_id,
    setSelected,
    reset_name,
}: {
    selected_id: number | null
    setSelected: (s?: DataColumnType) => void
    reset_name: string
}) {
    const { useListQuery } = useFetchResource()
    const query = useListQuery<DataColumnType>(LOOKUP_KEYS.COLUMN_FAMILY)
    const { classes } = useStyles()
    const [createModalOpen, setCreateModalOpen] = useState(false)

    if (query?.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()

    const results = query.results

    // Sort the ColumnType array
    const sortedData = results?.sort((a, b) => {
        if (a.is_required && !b.is_required) return -1
        if (!a.is_required && b.is_required) return 1
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return a.name.localeCompare(b.name)
    })

    return (
        <>
            <CreateColumnType
                open={createModalOpen}
                setOpen={setCreateModalOpen}
                onCreate={(new_resource_url) => {
                    setCreateModalOpen(false)
                    if (new_resource_url) {
                        const ct = results?.find(
                            (ct) => ct.url === new_resource_url,
                        )
                        setSelected(ct)
                    }
                }}
            />
            <Select
                title="Select column type"
                data-testid="column-type-select"
                value={selected_id ?? ''}
                onChange={(event) => {
                    if (typeof event.target.value !== 'number' || !sortedData)
                        return setSelected(undefined)
                    const ct = sortedData.find(
                        (ct) => ct.id === event.target.value,
                    )
                    setSelected(ct)
                }}
            >
                {selected_id !== null && (
                    <MenuItem
                        value={'reset'}
                        className={clsx(classes.mappingResetColumn)}
                    >
                        <ListItemText primary={`Reset ${reset_name}`} />
                    </MenuItem>
                )}
                {!!sortedData &&
                    sortedData.map((item) => (
                        <MenuItem
                            key={item.url}
                            value={item.id}
                            className={clsx({
                                [classes.mappingRequiredColumn]:
                                    item.is_required,
                                [classes.mappingDefaultColumn]: item.is_default,
                            })}
                        >
                            <SafeTooltip
                                title={`
                    ${item.is_required ? '[Required]' : ''} ${item.is_default ? '[Default]' : ''}
                    ${item.description}
                    `}
                            >
                                <ListItemText primary={item.name} />
                            </SafeTooltip>
                        </MenuItem>
                    ))}
                <MenuItem
                    key={'new'}
                    value={undefined}
                    onClick={() => setCreateModalOpen(true)}
                >
                    <ListItemIcon>
                        <ICONS.CREATE />
                    </ListItemIcon>
                    <ListItemText primary="New column type" />
                </MenuItem>
            </Select>
        </>
    )
}

function MappingTable({
    mappingResource,
    setMappingResource,
    summary,
}: {
    mappingResource: MappingResource
    setMappingResource: (m: MappingResource) => void
    summary: Record<string, (string | number | boolean)[]>
}) {
    const { classes } = useStyles()
    const [dataRows, setDataRows] = useState<number>(Infinity)
    const [recogniseOpen, setRecogniseOpen] = useState(true)
    const [rescaleOpen, setRescaleOpen] = useState(true)
    const [renameOpen, setRenameOpen] = useState(true)
    const map = mappingResource.map
    let mapped_data: Record<string, (string | number | boolean | Date)[]> = {}

    const getName = (v?: MapEntry) => (v ? v.name || v.column_type.name : '')

    const safeSetMapping = (new_mapping: typeof map) => {
        // Rename any duplicate column names.
        const name_used: Record<ReturnType<typeof getName>, boolean> = {}
        Object.entries(new_mapping).forEach(([k, v]) => {
            // Strip leading underscores; they'll be added back if necessary
            v.name = v.name?.replace(/^_*/, '')
            const name = getName(v)
            // Don't allow original datafile column names to be used by other columns
            if (Object.keys(summary).includes(name) && k !== name) {
                name_used[name] = true
            }
            if (name_used[name]) {
                const n_underscores = Object.keys(name_used).filter((n) =>
                    n.match(`_*${name}`),
                ).length
                v.name = `${'_'.repeat(n_underscores)}${name}`
                name_used[v.name] = true
            } else {
                name_used[name] = true
            }
        })
        setMappingResource({ ...mappingResource, map: new_mapping })
    }

    // Define mapped_data
    mapped_data = Object.fromEntries(
        Object.entries(summary).map(([k, v]) => [
            getName(map[k]) || k,
            convert(v, map[k]),
        ]),
    )

    /* Any new column is int/float */
    const has_numeric_columns = Object.values(map).reduce(
        (prev, cur) =>
            prev || ['int', 'float'].includes(cur.column_type.data_type ?? ''),
        false,
    )
    // Recognised columns can be renamed if they're not the core required columns
    const has_renameable_columns =
        Object.values(map).filter((v) => !v.column_type.is_required).length > 0

    const longest_column = Object.values(mapped_data).reduce(
        (prev, cur) => (cur.length > prev.length ? cur : prev),
        [],
    )

    const RowCountSelector = (
        <Box
            className={clsx(
                classes.mappingHeaderComment,
                classes.mappingRowCountSelector,
            )}
            onClick={(e) => e.stopPropagation()}
        >
            View
            <IconButton
                onClick={() =>
                    setDataRows(
                        Math.max(
                            0,
                            Math.min(dataRows, longest_column.length) - 1,
                        ),
                    )
                }
                disabled={!dataRows}
                size="small"
            >
                <MdArrowLeft />
            </IconButton>
            {Math.min(dataRows, longest_column.length)}
            <IconButton
                onClick={() =>
                    setDataRows(Math.min(longest_column.length, dataRows + 1))
                }
                disabled={dataRows >= longest_column.length}
                size="small"
            >
                <MdArrowRight />
            </IconButton>
            rows
        </Box>
    )

    const safe_date_representation = (d: Date) => {
        try {
            return d.toISOString()
        } catch {
            return 'NOT_A_DATE'
        }
    }

    return (
        <Table
            key="mapping-table"
            size="small"
            className={clsx(classes.mappingTable)}
        >
            <TableBody>
                <TableRow
                    key="divider-initial"
                    className={clsx(classes.mappingInitial)}
                >
                    <TableCell
                        colSpan={Object.keys(summary).length}
                        className={clsx(classes.mappingSectionHeader)}
                    >
                        <Typography variant="h6">Initial data</Typography>
                        {RowCountSelector}
                    </TableCell>
                </TableRow>
                <TableRow
                    className={clsx(
                        classes.mappingTableHeadRow,
                        classes.mappingInitial,
                    )}
                >
                    {Object.keys(summary).map((key, i) => {
                        return <TableCell key={i}>{key}</TableCell>
                    })}
                </TableRow>
                {longest_column.map((_arr, i) => {
                    if (i >= dataRows) return null
                    return (
                        <TableRow
                            key={`old-${i}`}
                            className={clsx(classes.mappingInitial)}
                        >
                            {Object.values(summary).map((col, n) => {
                                return <TableCell key={n}>{col[i]}</TableCell>
                            })}
                        </TableRow>
                    )
                })}

                <TableRow
                    key="divider-recognise"
                    className={clsx(classes.mappingProcess)}
                >
                    <TableCell
                        colSpan={Object.keys(summary).length}
                        className={clsx(
                            classes.mappingSectionHeader,
                            classes.mappingSectionHeaderClickable,
                        )}
                        onClick={() => setRecogniseOpen(!recogniseOpen)}
                    >
                        <Typography variant="h6">Recognise</Typography>
                    </TableCell>
                </TableRow>
                {recogniseOpen && (
                    <TableRow
                        key="recognise"
                        className={clsx(
                            classes.mappingTableHeadRow,
                            classes.mappingProcess,
                        )}
                    >
                        {Object.keys(summary).map((key, i) => {
                            if (!mappingResource.permissions?.write)
                                return (
                                    <TableCell key={i}>
                                        <SafeTooltip
                                            title={`You do not have permission to edit '${mappingResource.name}'`}
                                        >
                                            <Typography>
                                                {map[key]?.column_type.name ??
                                                    '-'}
                                            </Typography>
                                        </SafeTooltip>
                                    </TableCell>
                                )
                            return (
                                <TableCell key={i}>
                                    {
                                        <SelectColumnType
                                            setSelected={(ct) => {
                                                const old = { ...map }
                                                delete old[key]
                                                const value = ct
                                                    ? {
                                                          ...old,
                                                          [key]: {
                                                              column_type: ct,
                                                          },
                                                      }
                                                    : old
                                                safeSetMapping(value)
                                            }}
                                            selected_id={
                                                map[key]?.column_type.id ?? null
                                            }
                                            reset_name={key}
                                        />
                                    }
                                </TableCell>
                            )
                        })}
                    </TableRow>
                )}

                <TableRow
                    key="divider-rescale"
                    className={clsx(classes.mappingProcess)}
                >
                    <TableCell
                        colSpan={Object.keys(summary).length}
                        className={clsx(
                            classes.mappingSectionHeader,
                            classes.mappingSectionHeaderClickable,
                        )}
                        onClick={() => setRescaleOpen(!rescaleOpen)}
                    >
                        <Typography variant="h6">Rebase and Rescale</Typography>
                    </TableCell>
                </TableRow>
                {rescaleOpen && (
                    <TableRow
                        key="rebase-and-rescale"
                        className={clsx(classes.mappingProcess)}
                    >
                        {has_numeric_columns ? (
                            Object.keys(summary).map((key, i) => {
                                if (!mappingResource.permissions?.write)
                                    return (
                                        <TableCell key={i}>
                                            <SafeTooltip
                                                title={`You do not have permission to edit '${mappingResource.name}'`}
                                            >
                                                {['int', 'float'].includes(
                                                    map[key]?.column_type
                                                        .data_type ?? '',
                                                ) ? (
                                                    <Typography
                                                        className={clsx(
                                                            classes.mappingRebase,
                                                        )}
                                                    >
                                                        x' = (x &#43;{' '}
                                                        {map[key]?.addition ??
                                                            0}
                                                        ) &#183;{' '}
                                                        {map[key]?.multiplier ??
                                                            1}
                                                    </Typography>
                                                ) : (
                                                    <Typography>-</Typography>
                                                )}
                                            </SafeTooltip>
                                        </TableCell>
                                    )
                                const float =
                                    map[key]?.column_type.data_type === 'float'
                                if (
                                    !float &&
                                    map[key]?.column_type.data_type !== 'int'
                                )
                                    return <TableCell key={i} />
                                const pattern = float
                                    ? '[0-9]*.?[0-9]*'
                                    : '[0-9]*'
                                const width = (n: number) => {
                                    const digits = Math.floor(
                                        Math.log10(Math.max(1, Math.abs(n))),
                                    )
                                    return `${digits + 2}em`
                                }
                                return (
                                    <TableCell key={i}>
                                        <Box
                                            className={clsx(
                                                classes.mappingRebase,
                                                classes.mappingRebaseEdit,
                                            )}
                                        >
                                            x' = (x &#43;
                                            <FilledInput
                                                value={
                                                    map[key].addition
                                                        ? Number(
                                                              map[key].addition,
                                                          )
                                                        : 0
                                                }
                                                sx={{
                                                    width: width(
                                                        map[key].addition ?? 0,
                                                    ),
                                                }}
                                                type="number"
                                                inputProps={{
                                                    pattern: pattern,
                                                    title: 'addition',
                                                }}
                                                onChange={(e) => {
                                                    const v = float
                                                        ? parseFloat(
                                                              e.target.value,
                                                          )
                                                        : parseInt(
                                                              e.target.value,
                                                          )
                                                    safeSetMapping({
                                                        ...map,
                                                        [key]: {
                                                            ...map[key],
                                                            addition: v ?? 0,
                                                        },
                                                    })
                                                }}
                                                className={clsx(
                                                    classes.mappingNumberInput,
                                                )}
                                            />
                                            ) &#183;
                                            <FilledInput
                                                value={
                                                    map[key].multiplier !==
                                                    undefined
                                                        ? Number(
                                                              map[key]
                                                                  .multiplier,
                                                          )
                                                        : 1
                                                }
                                                sx={{
                                                    width: width(
                                                        map[key].multiplier ??
                                                            1,
                                                    ),
                                                }}
                                                type="number"
                                                inputProps={{
                                                    pattern: pattern,
                                                    title: "multiplier"
                                                }}
                                                onChange={(e) => {
                                                    const v = float
                                                        ? parseFloat(
                                                              e.target.value,
                                                          )
                                                        : parseInt(
                                                              e.target.value,
                                                          )
                                                    safeSetMapping({
                                                        ...map,
                                                        [key]: {
                                                            ...map[key],
                                                            multiplier: v ?? 1,
                                                        },
                                                    })
                                                }}
                                                className={clsx(
                                                    classes.mappingNumberInput,
                                                )}
                                            />
                                        </Box>
                                    </TableCell>
                                )
                            })
                        ) : (
                            <TableCell colSpan={Object.keys(summary).length}>
                                There are no columns recognised as containing
                                numeric data.
                            </TableCell>
                        )}
                    </TableRow>
                )}

                <TableRow
                    key="divider-rename"
                    className={clsx(classes.mappingProcess)}
                >
                    <TableCell
                        colSpan={Object.keys(summary).length}
                        className={clsx(
                            classes.mappingSectionHeader,
                            classes.mappingSectionHeaderClickable,
                        )}
                        onClick={() => setRenameOpen(!renameOpen)}
                    >
                        <Typography variant="h6">Rename</Typography>
                    </TableCell>
                </TableRow>
                {renameOpen && (
                    <TableRow
                        key="rename"
                        className={clsx(classes.mappingProcess)}
                    >
                        {has_renameable_columns ? (
                            Object.keys(summary).map((key, i) => {
                                if (!mappingResource.permissions?.write)
                                    return (
                                        <TableCell key={i}>
                                            <SafeTooltip
                                                title={`You do not have permission to edit '${mappingResource.name}'`}
                                            >
                                                <Typography>{key}</Typography>
                                            </SafeTooltip>
                                        </TableCell>
                                    )
                                if (!map[key])
                                    return (
                                        <TableCell key={i}>
                                            <SafeTooltip
                                                title={`Only recognised columns can be renamed`}
                                            >
                                                <Typography>{key}</Typography>
                                            </SafeTooltip>
                                        </TableCell>
                                    )
                                if (map[key]?.column_type.is_required)
                                    return (
                                        <TableCell key={i}>
                                            <SafeTooltip
                                                title={`Required columns cannot be renamed`}
                                            >
                                                <Typography>
                                                    {getName(map[key])}
                                                </Typography>
                                            </SafeTooltip>
                                        </TableCell>
                                    )
                                return (
                                    <TableCell key={i}>
                                        <TextField
                                            value={getName(map[key]) ?? key}
                                            onChange={(e) => {
                                                safeSetMapping({
                                                    ...map,
                                                    [key]: {
                                                        ...map[key],
                                                        name: e.target.value,
                                                    },
                                                })
                                            }}
                                        />
                                    </TableCell>
                                )
                            })
                        ) : (
                            <TableCell colSpan={Object.keys(summary).length}>
                                There are no columns that can be renamed.
                                Recognised columns can be renamed unless they
                                are one of the required columns.
                            </TableCell>
                        )}
                    </TableRow>
                )}

                <TableRow
                    key="divider-result"
                    className={clsx(classes.mappingResult)}
                >
                    <TableCell
                        colSpan={Object.keys(summary).length}
                        className={clsx(classes.mappingSectionHeader)}
                    >
                        <Typography variant="h6">Result</Typography>
                        {RowCountSelector}
                    </TableCell>
                </TableRow>
                <TableRow
                    className={clsx(
                        classes.mappingTableHeadRow,
                        classes.mappingResult,
                    )}
                >
                    {Object.keys(summary).map((key, i) => {
                        return (
                            <TableCell key={i}>
                                {getName(map[key]) || key}
                            </TableCell>
                        )
                    })}
                </TableRow>
                {longest_column.map((arr, i) => {
                    if (i >= dataRows) return null
                    return (
                        <TableRow
                            key={`new-${i}`}
                            className={clsx(classes.mappingResult)}
                        >
                            {Object.values(mapped_data).map((col, n) => (
                                <TableCell key={n}>
                                    {col[i] instanceof Date
                                        ? safe_date_representation(
                                              col[i] as Date,
                                          )
                                        : String(col[i] ?? '')}
                                </TableCell>
                            ))}
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}

function MappingManager({
    file,
    applicable_mappings,
    summary,
}: {
    file: ObservedFile
    applicable_mappings: ApplicableMappingResource[]
    summary: Record<string, Record<string, string | number>>
}) {
    const blank_map = (): ApplicableMappingResource => ({
        mapping: {
            id: '',
            url: '',
            name: '',
            team: null,
            is_valid: false,
            map: {},
            permissions: { read: true, write: true, create: true },
            read_access_level: 2,
            edit_access_level: 3,
            delete_access_level: 3,
            rendered_map: {},
            missing_required_columns: [],
            in_use: false,
        },
        missing: Infinity,
    })
    const { classes } = useStyles()
    const { useListQuery, useCreateQuery, useUpdateQuery } = useFetchResource()
    const col_query = useListQuery<DataColumnType>(LOOKUP_KEYS.COLUMN_FAMILY)
    const [more, setMore] = React.useState(false)
    const [advancedPropertiesOpen, setAdvancedPropertiesOpen] =
        React.useState(false)
    const [mapping, setMapping] = useState<ApplicableMappingResource>(() => {
        const m = applicable_mappings?.find(
            (m) => m.mapping.url === file.mapping,
        )
        return m ? { ...m } : blank_map()
    })
    const navigate = useNavigate()
    const updateFileMutation = useUpdateQuery<ObservedFile>(LOOKUP_KEYS.FILE)
    const updateFile = (new_mapping: DB_MappingResource) =>
        updateFileMutation.mutate(
            { ...file!, mapping: new_mapping.url },
            { onSuccess: () => navigate(0) },
        )
    const createMapMutation = useCreateQuery<DB_MappingResource>(
        LOOKUP_KEYS.MAPPING,
        { after_cache: (r) => updateFile(r.data) },
    )
    const createMap = (data: ApplicableMappingResource) => {
        const d: Partial<DB_MappingResource> = deep_copy(data.mapping)
        for (const k of [
            'url',
            'id',
            'is_valid',
            'missing_required_columns',
            'rendered_map',
            'in_use',
        ])
            delete d[k as keyof typeof d]
        return createMapMutation.mutate(d, {
            onSuccess: (data) => updateFile(data.data),
        })
    }
    const updateMapMutation = useUpdateQuery<DB_MappingResource>(
        LOOKUP_KEYS.MAPPING,
    )
    const updateMap = (data: DB_MappingResource) =>
        updateMapMutation.mutate(data, { onSuccess: () => navigate(0) })
    // TODO: Implement deleteMapMutation when backend supplies delete permissions
    // const deleteMapMutation = useDeleteQuery<DB_MappingResource>(LOOKUP_KEYS.MAPPING)
    // const deleteMap = (data: DB_MappingResource) => deleteMapMutation.mutate(data, {onSuccess: () => navigate(0)})

    if (col_query?.hasNextPage && !col_query.isFetchingNextPage)
        col_query.fetchNextPage()

    // Don't render the table until all the columns are loaded
    const columns = !col_query?.hasNextPage && col_query?.results

    // Summary data with children in array form
    const array_summary: Record<string, (string | number | boolean)[]> = {}

    const original_mapping = applicable_mappings?.find(
        (m) => m.mapping.id === mapping.mapping.id,
    )

    const file_mapping_has_changed =
        original_mapping?.mapping.url !== file?.mapping
    const mapping_map_has_changed =
        JSON.stringify(mapping.mapping.map) !==
        JSON.stringify(original_mapping?.mapping.map)
    const mapping_has_changed =
        mapping_map_has_changed ||
        mapping.mapping.name !== original_mapping?.mapping.name ||
        mapping.mapping.team !== original_mapping?.mapping.team ||
        mapping.mapping.read_access_level !==
            original_mapping?.mapping.read_access_level ||
        mapping.mapping.edit_access_level !==
            original_mapping?.mapping.edit_access_level ||
        mapping.mapping.delete_access_level !==
            original_mapping?.mapping.delete_access_level

    const mapping_is_dirty = // new map with unsaved changes
        (mapping.mapping.id === '' &&
            Object.keys(mapping.mapping.map).length > 0) ||
        // old map with unsaved changes
        (mapping.mapping.id !== '' && mapping_has_changed)

    const mapping_can_be_saved =
        mapping_is_dirty &&
        mapping.mapping.name !== '' &&
        mapping.mapping.team !== null &&
        mapping.mapping.team !== '' &&
        (mapping.mapping.permissions?.write ?? false)

    const map_can_be_applied =
        mapping.mapping.id !== '' &&
        file_mapping_has_changed &&
        (file?.permissions?.write ?? false)

    const missing_column_names = Object.values(columns ?? [])
        .filter((c) => c.is_required)
        .filter(
            (c) =>
                Object.values(mapping.mapping.map ?? {}).find(
                    (m) => m.column_type === c.id,
                ) === undefined,
        )
        .map((c) => c.name)

    const safeSetMapping = (value?: string) => {
        const new_mapping = applicable_mappings?.find(
            (m) => m.mapping.id === value,
        )
        // Check whether we need to warn about discarding changes.
        if (
            mapping_is_dirty &&
            !window.confirm(
                `Discard unsaved changes${mapping.mapping.name ? ` to mapping '${mapping.mapping.name}'` : ''}?`,
            )
        )
            return
        setMapping(new_mapping ? { ...new_mapping } : blank_map())
    }

    Object.keys(summary).forEach((key) => {
        const arr = []
        const max = Object.keys(summary).reduce((prev, cur) => {
            return parseInt(cur) > prev ? parseInt(cur) : prev
        }, 0)
        for (let i = 0; i < max; i++) {
            arr.push(summary[key][i] ?? undefined)
        }
        array_summary[key] = Object.values(summary[key])
    })

    return (
        <Paper sx={{ margin: (t) => t.spacing(1) }} elevation={0}>
            <Stack spacing={1}>
                <Typography variant="h5" key="title">
                    Column Mapping for{' '}
                    {file?.id && (
                        <ResourceChip
                            resource_id={file.id as string}
                            lookup_key={LOOKUP_KEYS.FILE}
                        />
                    )}
                </Typography>
                <Typography variant="body1" key="intro">
                    Data files are parsed by Harvesters to produce tabular data.
                    The Mapping process allows you to specify how the columns in
                    that data should be interpreted. All data should have at
                    least the three key data columns 'ElapsedTime_s',
                    'Voltage_V', and 'Current_A'.
                </Typography>
                <Collapse in={more} key="collapse">
                    <Stack spacing={1}>
                        <Typography variant="body1">
                            You can associate this file with an existing
                            mapping, or create a new mapping. When creating a
                            new mapping, you will be able to assign existing
                            columns from other mappings, or create new columns.
                        </Typography>
                        <Typography variant="body1">
                            Files can be associated with any{' '}
                            <strong>applicable mapping</strong>. An{' '}
                            <strong>applicable mapping</strong> is one where all
                            of the columns of the mapping appear in the file.
                            The applicable columns are then ranked whether they
                            recognise all required columns, then by the number
                            of columns that appear in the data file that do{' '}
                            <em>not appear in the mapping</em>. Mappings with
                            fewer missing columns are ranked higher. If there is
                            one mapping that is ranked higher than all others,
                            it will be automatically applied. If two or more
                            mappings are tied, you will need to apply a mapping
                            manually.
                        </Typography>
                        <Typography variant="body1">
                            <em>Note</em>: columns that are not recognised will
                            be imported as <strong>float</strong> data type.
                            This is to reduce the storage required. If you need
                            to store the data as a different type, specify a
                            column type in the mapping.
                        </Typography>
                        <Typography variant="body1">
                            <em>Note</em>: actual data transformation is done in
                            Python via the `pandas` package. The preview below
                            is for guidance only, and values are not guaranteed
                            to match the final output.
                        </Typography>
                    </Stack>
                </Collapse>
                <Button key="more" onClick={() => setMore(!more)}>
                    {more ? 'Less' : 'More'}
                </Button>
                {!file ? (
                    <Typography>
                        Failed to load file data, please try refreshing the
                        page.
                    </Typography>
                ) : (
                    <>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <SafeTooltip title="Only mappings that are applicable to this file will be available.">
                                <Typography>Mapping:</Typography>
                            </SafeTooltip>
                            <Select
                                title="Load mapping"
                                data-testid="load-mapping-select"
                                value={mapping?.mapping.id || 'new'}
                                onChange={(event) =>
                                    safeSetMapping(
                                        event.target.value === 'new'
                                            ? ''
                                            : event.target.value,
                                    )
                                }
                            >
                                <MenuItem key="reset" value="new">
                                    <Typography>Create new mapping</Typography>
                                </MenuItem>
                                {applicable_mappings
                                    ?.sort((a, b) => {
                                        const am = a.mapping
                                        const bm = b.mapping
                                        if (am.is_valid && !bm.is_valid)
                                            return -1
                                        if (!am.is_valid && bm.is_valid)
                                            return 1
                                        if (
                                            (a.missing ?? Infinity) <
                                            (b.missing ?? Infinity)
                                        )
                                            return -1
                                        if (
                                            (a.missing ?? Infinity) >
                                            (b.missing ?? Infinity)
                                        )
                                            return 1
                                        return am.name.localeCompare(bm.name)
                                    })
                                    .map((m) => (
                                        <MenuItem
                                            key={m.mapping.id}
                                            value={m.mapping.id}
                                        >
                                            {m.mapping.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                            <Button
                                startIcon={
                                    <ICONS.SAVE
                                        color={
                                            mapping_can_be_saved
                                                ? 'success'
                                                : undefined
                                        }
                                    />
                                }
                                onClick={() => {
                                    let confirmed = false
                                    if (mapping_can_be_saved) {
                                        if (
                                            missing_column_names.length > 0 &&
                                            !confirm(`
Mapping '${mapping.mapping.name}' is missing columns ${missing_column_names.join(', ')}.

You may still save the mapping, but the data may not be suitable for meta-analysis.
                                    `)
                                        )
                                            return
                                        if (!mapping.mapping.id) {
                                            createMap(mapping)
                                            return // automatically applies on creation
                                        } else {
                                            if (
                                                mapping_map_has_changed &&
                                                mapping.mapping.in_use
                                            ) {
                                                if (
                                                    !window.confirm(`
Mapping '${mapping.mapping.name}' is in use. 

Updating its map will cause affected datafiles to be re-imported. This can be an long operation, especially where multiple files are affected.

Do you wish to continue?`)
                                                )
                                                    return
                                                confirmed = true
                                            }
                                            updateMap(mapping.mapping)
                                        }
                                    }
                                    if (map_can_be_applied) {
                                        if (
                                            !confirmed &&
                                            file.state === 'IMPORTED'
                                        ) {
                                            if (
                                                !window.confirm(
                                                    'Apply new mapping to file? This will cause the data to be re-imported.',
                                                )
                                            ) {
                                                return
                                            }
                                        }
                                        updateFile(mapping.mapping)
                                    }
                                }}
                                disabled={
                                    !mapping_can_be_saved && !map_can_be_applied
                                }
                            >
                                {mapping_can_be_saved &&
                                    (mapping.mapping.id
                                        ? map_can_be_applied
                                            ? 'Update and apply mapping'
                                            : 'Update mapping'
                                        : 'Create')}
                                {!mapping_can_be_saved && 'Apply mapping'}
                            </Button>
                        </Stack>
                        <Stack
                            className={clsx(classes.mappingWarnings)}
                            spacing={1}
                        >
                            {!mapping_can_be_saved &&
                                mapping.mapping.permissions?.write && (
                                    <>
                                        {Object.keys(mapping).length === 0 && (
                                            <Alert severity="info">
                                                <Typography>
                                                    Mappings must recognise at
                                                    least one column.
                                                </Typography>
                                            </Alert>
                                        )}
                                        {mapping.mapping.name === '' && (
                                            <Alert severity="info">
                                                <Typography>
                                                    Mappings must have a name.
                                                </Typography>
                                            </Alert>
                                        )}
                                        {(mapping.mapping.team === null ||
                                            mapping.mapping.team === '') && (
                                            <Alert severity="info">
                                                <Typography>
                                                    Mappings must belong to a
                                                    team.
                                                </Typography>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            {mapping.mapping.permissions?.write &&
                                missing_column_names.length > 0 && (
                                    <Alert severity="warning">
                                        <Typography>
                                            Mapping should include required
                                            columns. Columns{' '}
                                            {missing_column_names.join(', ')}{' '}
                                            are not yet recognised. You can
                                            still save the mapping, but the data
                                            will not be suitable for
                                            meta-analysis.
                                        </Typography>
                                    </Alert>
                                )}
                            {mapping.mapping.in_use &&
                                mapping_map_has_changed && (
                                    <Alert severity="warning">
                                        <Typography>
                                            Updating a map that is used for
                                            datafiles will cause those datafiles
                                            to be re-parsed.
                                        </Typography>
                                    </Alert>
                                )}
                        </Stack>
                        {
                            <Stack>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                >
                                    {mapping.mapping.permissions?.write && (
                                        <>
                                            <TextField
                                                label="Mapping name"
                                                value={mapping.mapping.name}
                                                onChange={(e) =>
                                                    setMapping({
                                                        missing:
                                                            mapping.missing,
                                                        mapping: {
                                                            ...mapping.mapping,
                                                            name: e.target
                                                                .value,
                                                        },
                                                    })
                                                }
                                            />
                                            <PrettyResource
                                                target={{
                                                    _type: key_to_type(
                                                        LOOKUP_KEYS.TEAM,
                                                    ),
                                                    _value: mapping.mapping
                                                        .team,
                                                }}
                                                lookup_key={LOOKUP_KEYS.TEAM}
                                                edit_mode={true}
                                                allow_new={false}
                                                onChange={(
                                                    v: TypeValueNotation,
                                                ) => {
                                                    if (
                                                        typeof v._value !==
                                                        'string'
                                                    )
                                                        return
                                                    setMapping({
                                                        missing:
                                                            mapping.missing,
                                                        mapping: {
                                                            ...mapping.mapping,
                                                            team: v._value,
                                                        },
                                                    })
                                                }}
                                            />
                                        </>
                                    )}
                                    {mapping.mapping.permissions?.write && (
                                        <Button
                                            onClick={() =>
                                                setAdvancedPropertiesOpen(
                                                    !advancedPropertiesOpen,
                                                )
                                            }
                                        >
                                            {advancedPropertiesOpen
                                                ? 'Hide '
                                                : 'Edit '}{' '}
                                            advanced properties
                                        </Button>
                                    )}
                                </Stack>
                                <Collapse in={advancedPropertiesOpen}>
                                    <Stack
                                        spacing={1}
                                        sx={{
                                            paddingBottom: (t: Theme) =>
                                                t.spacing(2),
                                            paddingTop: (t: Theme) =>
                                                t.spacing(1),
                                        }}
                                    >
                                        <PrettyObject
                                            target={to_type_value_notation_wrapper(
                                                {
                                                    read_access_level:
                                                        mapping.mapping
                                                            .read_access_level,
                                                    edit_access_level:
                                                        mapping.mapping
                                                            .edit_access_level,
                                                    delete_access_level:
                                                        mapping.mapping
                                                            .delete_access_level,
                                                },
                                            )}
                                            edit_mode={
                                                mapping.mapping.permissions
                                                    ?.read ?? false
                                            }
                                            onEdit={(
                                                v: TypeValueNotationWrapper,
                                            ) => {
                                                const is_number = (
                                                    x: unknown,
                                                ): x is number =>
                                                    typeof x === 'number'
                                                const as_number = (
                                                    x: unknown,
                                                ) =>
                                                    is_number(x) ? x : undefined
                                                setMapping({
                                                    missing: mapping.missing,
                                                    mapping: {
                                                        ...mapping.mapping,
                                                        // TODO: Nice access manager that queries description for available values
                                                        read_access_level:
                                                            (as_number(
                                                                v
                                                                    .read_access_level
                                                                    ._value,
                                                            ) ??
                                                                mapping.mapping
                                                                    .read_access_level) as ColumnMappingReadAccessLevelEnum,
                                                        edit_access_level:
                                                            (as_number(
                                                                v
                                                                    .edit_access_level
                                                                    ._value,
                                                            ) ??
                                                                mapping.mapping
                                                                    .edit_access_level) as ColumnMappingEditAccessLevelEnum,
                                                        delete_access_level:
                                                            (as_number(
                                                                v
                                                                    .delete_access_level
                                                                    ._value,
                                                            ) ??
                                                                mapping.mapping
                                                                    .delete_access_level) as ColumnMappingDeleteAccessLevelEnum,
                                                    },
                                                })
                                            }}
                                            extractPermissions={true}
                                            canEditKeys={false}
                                        />
                                        {/*
                                    TODO: Backend needs to supply a destroy permission
                                    <Button
                                        color={mapping.permissions?.destroy? "error" : undefined}
                                        variant="contained"
                                        startIcon={<ICONS.DELETE />}
                                        onClick={() => {
                                            if (window.confirm(`Delete mapping '${mapping.name}'?`)) {
                                                deleteMap(mapping)
                                            }
                                        }}
                                        disabled={mapping.id === "" || !mapping.permissions?.destroy}
                                    >
                                        Delete mapping {mapping.name || original_mapping?.name }
                                    </Button>*/}
                                    </Stack>
                                </Collapse>
                            </Stack>
                        }
                        {array_summary && mapping && columns && (
                            <Box sx={{ paddingBottom: 1 }}>
                                <MappingTable
                                    mappingResource={db_map_to_map(
                                        mapping.mapping,
                                        columns,
                                    )}
                                    setMappingResource={(map) =>
                                        setMapping({
                                            missing: mapping.missing,
                                            mapping: map_to_db_map(map),
                                        })
                                    }
                                    summary={array_summary}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Stack>
        </Paper>
    )
}

export function Mapping() {
    const { apiResource: file, apiQuery: fileQuery } =
        useApiResource<ObservedFile>()

    const loadingBody = <Skeleton height={400} />

    const errorBody = (
        <ErrorCard
            message="Error loading mapping"
            header={
                <CardHeader
                    avatar={<Avatar variant="square">E</Avatar>}
                    title="Error"
                    subheader="Error loading mapping"
                />
            }
        />
    )

    const fileApiHandler = new FilesApi(useCurrentUser().api_config)
    const queryClient = useQueryClient()
    const applicableMappingsQuery = useQuery<
        AxiosResponse<ApplicableMappingResource[]>,
        AxiosError
    >({
        queryKey: ['applicable_mappings', file?.id],
        queryFn: async () => {
            const data = await fileApiHandler.filesApplicableMappingsRetrieve({
                id: file!.id,
            })
            return {
                ...data,
                data: data.data as unknown as ApplicableMappingResource[],
            }
        },
        enabled: !!file?.id,
    })
    const summaryQuery = useQuery<
        AxiosResponse<Record<string, Record<string, string | number>>>,
        AxiosError
    >({
        queryKey: ['summary', file?.id],
        queryFn: async () => {
            const data = await fileApiHandler.filesSummaryRetrieve({
                id: file!.id,
            })
            queryClient.setQueryData(['summary', file!.id], data)
            return data as unknown as AxiosResponse<
                Record<string, Record<string, string | number>>
            >
        },
        enabled: !!file?.id,
    })

    return (
        <QueryWrapper
            queries={
                fileQuery
                    ? [fileQuery, applicableMappingsQuery, summaryQuery]
                    : [applicableMappingsQuery, summaryQuery]
            }
            error={errorBody}
            loading={loadingBody}
            success={
                !!file && (
                    <MappingManager
                        file={file}
                        applicable_mappings={
                            applicableMappingsQuery.data?.data ?? []
                        }
                        summary={summaryQuery.data?.data ?? {}}
                    />
                )
            }
        />
    )
}

export default function WrappedMapping() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        if (!id) {
            navigate(PATHS.DASHBOARD)
        }
    }, [id, navigate])

    if (!id) return null

    return (
        <ErrorBoundary
            fallback={(error: Error) => (
                <ErrorCard
                    message={error.message}
                    header={
                        <CardHeader
                            avatar={<Avatar variant="square">E</Avatar>}
                            title="Error"
                            subheader={`Error with Mapping for ${id}`}
                        />
                    }
                />
            )}
        >
            <ApiResourceContextProvider
                resource_id={id}
                lookup_key={LOOKUP_KEYS.FILE}
            >
                <Mapping />
            </ApiResourceContextProvider>
        </ErrorBoundary>
    )
}

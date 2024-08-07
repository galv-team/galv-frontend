import CardActionBar from './CardActionBar'
import { deep_copy, has, id_from_ref_props } from './misc'
import PrettyObject, { PrettyObjectFromQuery } from './prettify/PrettyObject'
import useStyles from '../styles/UseStyles'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Card, { CardProps } from '@mui/material/Card'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import A from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import LoadingChip from './LoadingChip'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Unstable_Grid2'
import Avatar from '@mui/material/Avatar'
import React, {
    Fragment,
    PropsWithChildren,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import ErrorCard from './error/ErrorCard'
import QueryWrapper, { QueryDependentElement } from './QueryWrapper'
import { AxiosError, AxiosResponse } from 'axios'
import Divider, { DividerProps } from '@mui/material/Divider'
import {
    API_HANDLERS,
    API_HANDLERS_FP,
    API_SLUGS,
    AutocompleteKey,
    CHILD_LOOKUP_KEYS,
    CHILD_PROPERTY_NAMES,
    DISPLAY_NAMES,
    FAMILY_LOOKUP_KEYS,
    FIELDS,
    GalvResource,
    get_has_family,
    get_is_family,
    ICONS,
    is_lookup_key,
    LOOKUP_KEYS,
    LookupKey,
    PATHS,
    PRIORITY_LEVELS,
    Serializable,
    SerializableObject,
    type_to_key,
} from '../constants'
import ResourceChip from './ResourceChip'
import ErrorBoundary from './ErrorBoundary'
import UndoRedoProvider, { useUndoRedoContext } from './UndoRedoContext'
import Representation from './Representation'
import { FilterContext } from './filtering/FilterContext'
import ApiResourceContextProvider, {
    useApiResource,
} from './ApiResourceContext'
import Prettify from './prettify/Prettify'
import { useSnackbarMessenger } from './SnackbarMessengerContext'
import { Modal } from '@mui/material'
import { get_modal_title, ResourceCreator } from './ResourceCreator'
import { useCurrentUser } from './CurrentUserContext'
import {
    from_type_value_notation,
    to_type_value_notation,
    to_type_value_notation_wrapper,
    TypeValueNotation,
    TypeValueNotationWrapper,
} from './TypeValueNotation'
import Typography from '@mui/material/Typography'
import { Theme } from '@mui/material/styles'
import AuthImage from './AuthImage'
import { Axios } from './FetchResourceContext'
import ArbitraryFileSummary from './summaries/ArbitraryFileSummary'
import AdditionalStorageSummary from './summaries/AdditionalStorageSummary'
import HarvesterSummary from './summaries/HarvesterSummary'
import TeamSummary from './summaries/TeamSummary'
import LabSummary from './summaries/LabSummary'
import UnitSummary from './summaries/UnitSummary'
import ColumnSummary from './summaries/ColumnSummary'
import PathSummary from './summaries/PathSummary'
import FileSummary from './summaries/FileSummary'
import CyclerTestSummary from './summaries/CyclerTestSummary'
import ExperimentSummary from './summaries/ExperimentSummary'
import { ObservedFile } from '@galv/galv'

export type ResourceCardProps = {
    resource_id: string | number
    lookup_key: LookupKey
    editing?: boolean
    expanded?: boolean
} & CardProps

function PropertiesDivider({
    children,
    ...props
}: PropsWithChildren<DividerProps>) {
    return (
        <Divider component="div" role="presentation" {...props}>
            <Typography variant="h5">{children}</Typography>
        </Divider>
    )
}

/**
 * Resources with custom summaries.
 */
const CUSTOM_SUMMARIES: Partial<
    Record<LookupKey, (resource: { resource: GalvResource }) => ReactNode>
> = {
    [LOOKUP_KEYS.ARBITRARY_FILE]: ArbitraryFileSummary,
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: AdditionalStorageSummary,
    [LOOKUP_KEYS.HARVESTER]: HarvesterSummary,
    [LOOKUP_KEYS.TEAM]: TeamSummary,
    [LOOKUP_KEYS.LAB]: LabSummary,
    [LOOKUP_KEYS.UNIT]: UnitSummary,
    [LOOKUP_KEYS.COLUMN_FAMILY]: ColumnSummary,
    [LOOKUP_KEYS.PATH]: PathSummary,
    [LOOKUP_KEYS.FILE]: FileSummary,
    [LOOKUP_KEYS.CYCLER_TEST]: CyclerTestSummary,
    [LOOKUP_KEYS.EXPERIMENT]: ExperimentSummary,
} as const

/**
 * Present summary information for a resource.
 * If there's a specific summary component, use that.
 * Otherwise, pull out fields with PRIORITY_LEVELS.SUMMARY and display them.
 */
function Summary<T extends GalvResource>({
    apiResource,
    lookup_key,
}: {
    apiResource?: T
    lookup_key: LookupKey
}) {
    if (apiResource === undefined) return null

    if (Object.keys(CUSTOM_SUMMARIES).includes(lookup_key)) {
        const COMPONENT =
            CUSTOM_SUMMARIES[lookup_key as keyof typeof CUSTOM_SUMMARIES]!
        return <COMPONENT resource={apiResource} />
    }

    const is_family_child = (child_key: LookupKey, family_key: LookupKey) => {
        if (!get_is_family(family_key)) return false
        if (!get_has_family(child_key)) return false
        return CHILD_LOOKUP_KEYS[family_key] === child_key
    }

    const summarise = (
        data: unknown,
        many: boolean,
        key: string,
        lookup?: LookupKey | AutocompleteKey,
    ): ReactNode => {
        if (!data || (data instanceof Array && data.length === 0))
            return <Typography variant="body2">None</Typography>
        if (many) {
            const preview_count = 3
            const items =
                data instanceof Array && data.length > preview_count
                    ? data.slice(0, preview_count)
                    : data
            return (
                <Grid container sx={{ alignItems: 'center' }}>
                    {items instanceof Array ? (
                        items.map((d, i) => (
                            <Grid key={i}>
                                {summarise(d, false, key, lookup)}
                            </Grid>
                        ))
                    ) : (
                        <Grid>{summarise(data, false, key, lookup)}</Grid>
                    )}
                    {data instanceof Array && data.length > preview_count && (
                        <Grid>+ {data.length - preview_count} more</Grid>
                    )}
                </Grid>
            )
        }
        const field = key ? FIELDS[lookup_key] : undefined
        const field_info = field ? field[key as keyof typeof field] : undefined
        return lookup && is_lookup_key(lookup) ? (
            <ResourceChip
                resource_id={id_from_ref_props<string>(data as string | number)}
                lookup_key={lookup}
                short_name={is_family_child(lookup, lookup_key)}
            />
        ) : (
            <Prettify
                target={to_type_value_notation(
                    data as Serializable,
                    field_info,
                )}
            />
        )
    }

    const img_preview = (lookup_key: LookupKey, apiResource: GalvResource) => {
        if (lookup_key === LOOKUP_KEYS.FILE) {
            const r = apiResource as ObservedFile
            if (r.has_required_columns && r.png)
                return (
                    <AuthImage
                        file={
                            apiResource as unknown as {
                                id: string
                                path: string
                                png: string
                            }
                        }
                    />
                )
        }
        return null
    }

    return (
        <>
            {img_preview(lookup_key, apiResource)}
            {apiResource && (
                <Grid container spacing={1}>
                    {Object.entries(FIELDS[lookup_key])
                        .filter(
                            (e) => e[1].priority === PRIORITY_LEVELS.SUMMARY,
                        )
                        .map(([k, v]) => (
                            <Grid
                                key={k}
                                container
                                xs={12}
                                sx={{ alignItems: 'center' }}
                            >
                                <Grid xs={2} lg={1}>
                                    <Typography variant="subtitle2">
                                        {k.replace(/_/g, ' ')}
                                    </Typography>
                                </Grid>
                                <Grid xs={10} lg={11}>
                                    {summarise(
                                        apiResource[
                                            k as keyof typeof apiResource
                                        ],
                                        v.many,
                                        k,
                                        type_to_key(v.type),
                                    )}
                                </Grid>
                            </Grid>
                        ))}
                </Grid>
            )}
        </>
    )
}

function ResourceCard<T extends GalvResource>({
    resource_id,
    lookup_key,
    editing,
    expanded,
    ...cardProps
}: ResourceCardProps) {
    const { classes } = useStyles()
    const navigate = useNavigate()
    const [isEditMode, _setIsEditMode] = useState<boolean>(editing || false)
    const [isExpanded, setIsExpanded] = useState<boolean>(
        expanded || isEditMode,
    )

    const { passesFilters } = useContext(FilterContext)
    const { apiResource, apiResourceDescription, family, apiQuery } =
        useApiResource<T>()
    // useContext is wrapped in useRef because we update the context in our useEffect API data hook
    const UndoRedo = useUndoRedoContext<T>()
    const UndoRedoRef = useRef(UndoRedo)
    const { refresh_user } = useCurrentUser()

    const [forking, setForking] = useState<boolean>(false)

    const setEditing = (e: boolean) => {
        _setIsEditMode(e)
        if (e) setIsExpanded(e)
    }

    useEffect(() => {
        if (apiResource) {
            const data = deep_copy(apiResource)
            Object.entries(FIELDS[lookup_key]).forEach(([k, v]) => {
                if (v.read_only) {
                    delete data[k as keyof typeof data]
                }
            })
            apiResourceDescription &&
                Object.entries(apiResourceDescription).forEach(([k, v]) => {
                    if (
                        v.read_only &&
                        data[k as keyof typeof data] !== undefined
                    ) {
                        delete data[k as keyof typeof data]
                    }
                })
            UndoRedoRef.current.set(data)
        }
    }, [apiResource, lookup_key])

    // Mutations for saving edits
    const { postSnackbarMessage } = useSnackbarMessenger()
    const { api_config } = useCurrentUser()
    // used to get config in axios call
    const api_skeleton = new API_HANDLERS[lookup_key](
        api_config,
    ) as unknown as { axios: Axios; basePath: string }
    const api_handler_fp = API_HANDLERS_FP[lookup_key](api_config)
    const api_handler = new API_HANDLERS[lookup_key](api_config)
    const patch = api_handler_fp[
        `${API_SLUGS[lookup_key]}PartialUpdate` as keyof typeof api_handler_fp
    ] as (
        id: string,
        data: Partial<T>,
    ) => Promise<(axios: Axios, basePath: string) => Promise<AxiosResponse<T>>>
    const queryClient = useQueryClient()
    const update_mutation = useMutation<
        AxiosResponse<T>,
        AxiosError,
        Partial<T>
    >({
        mutationFn: (data: Partial<T>) =>
            patch(String(resource_id), data).then((request) =>
                request(api_skeleton.axios, api_skeleton.basePath),
            ),
        onSuccess: (data, variables, context) => {
            if (data === undefined) {
                console.warn('No data in mutation response', {
                    data,
                    variables,
                    context,
                })
                return
            }
            queryClient.setQueryData([lookup_key, resource_id], data)
            // Also invalidate autocomplete cache because we may have updated options
            queryClient.invalidateQueries({ queryKey: ['autocomplete'] })
        },
        onError: (error, variables, context) => {
            console.error(error, { variables, context })
            const d = error.response?.data as Partial<T>
            const firstError = Object.entries(d)[0]
            postSnackbarMessage({
                message: (
                    <Stack>
                        <span>{`Error updating ${DISPLAY_NAMES[lookup_key]}/${resource_id}  
                        (HTTP ${error.response?.status} - ${error.response?.statusText}).`}</span>
                        <span
                            style={{ fontWeight: 'bold' }}
                        >{`${firstError[0]}: ${firstError[1]}`}</span>
                        {Object.keys(d).length > 1 && (
                            <span>+ {Object.keys(d).length - 1} more</span>
                        )}
                    </Stack>
                ),
                severity: 'error',
            })
        },
    })

    const family_key = get_has_family(lookup_key)
        ? FAMILY_LOOKUP_KEYS[lookup_key]
        : undefined

    const ICON = ICONS[lookup_key]
    const FAMILY_ICON = family_key ? ICONS[family_key] : undefined

    // The card action bar controls the expanded state and editing state
    const action = (
        <CardActionBar
            lookup_key={lookup_key}
            editable={!!apiResource?.permissions?.write}
            editing={isEditMode}
            setEditing={setEditing}
            // Harvesters must be created elsewhere - they can't be forked
            onFork={
                apiResource?.permissions?.create &&
                lookup_key !== LOOKUP_KEYS.HARVESTER &&
                lookup_key !== LOOKUP_KEYS.TOKEN
                    ? () => setForking(true)
                    : undefined
            }
            onUndo={UndoRedo.undo}
            onRedo={UndoRedo.redo}
            undoable={UndoRedo.can_undo}
            redoable={UndoRedo.can_redo}
            onEditSave={() => {
                update_mutation.mutate(UndoRedo.diff() as Partial<T>)
                return true
            }}
            onEditDiscard={() => {
                if (
                    UndoRedo.can_undo &&
                    !window.confirm('Discard all changes?')
                )
                    return false
                UndoRedo.reset()
                return true
            }}
            destroyable={
                has(apiResource, 'in_use') &&
                !apiResource.in_use &&
                has(apiResource?.permissions, 'destroy') &&
                apiResource.permissions.destroy
            }
            onDestroy={() => {
                if (
                    !window.confirm(
                        `Delete ${DISPLAY_NAMES[lookup_key]}/${resource_id}?`,
                    )
                )
                    return
                const destroy = api_handler[
                    `${API_SLUGS[lookup_key]}Destroy` as keyof typeof api_handler
                ] as (requestParams: {
                    id: string
                }) => Promise<AxiosResponse<T>>
                destroy
                    .bind(api_handler)({ id: String(resource_id) })
                    .then(() => {
                        navigate(PATHS[lookup_key])
                        queryClient.removeQueries({
                            queryKey: [lookup_key, resource_id],
                        })
                    })
                    .then(() => {
                        queryClient.invalidateQueries({
                            queryKey: [lookup_key, 'list'],
                        })
                        if (lookup_key === LOOKUP_KEYS.LAB) {
                            refresh_user()
                        }
                    })
                    .catch((e) => {
                        postSnackbarMessage({
                            message: `Error deleting ${DISPLAY_NAMES[lookup_key]}/${resource_id}  
                        (HTTP ${e.response?.status} - ${e.response?.statusText}): ${e.response?.data?.detail}`,
                            severity: 'error',
                        })
                    })
            }}
            reimportable={
                lookup_key === LOOKUP_KEYS.FILE &&
                apiResource?.permissions?.write &&
                has(apiResource, 'state') &&
                apiResource.state !== 'RETRY IMPORT'
            }
            onReImport={() => {
                if (
                    !window.confirm(`
Re-import ${DISPLAY_NAMES[lookup_key]}/${resource_id}?

This will overwrite the current data with the latest version from the source file, if available.
The file will be added to the Harvester's usual queue for processing.
`)
                )
                    return
                const reimport = api_handler[
                    `${API_SLUGS[lookup_key]}ReimportRetrieve` as keyof typeof api_handler
                ] as (requestParams: {
                    id: string
                }) => Promise<AxiosResponse<T>>
                reimport
                    .bind(api_handler)({ id: String(resource_id) })
                    .then(() =>
                        queryClient.invalidateQueries({
                            queryKey: [lookup_key, resource_id],
                        }),
                    )
                    .catch((e) => {
                        postSnackbarMessage({
                            message: `Error re-importing ${DISPLAY_NAMES[lookup_key]}/${resource_id}  
                        (HTTP ${e.response?.status} - ${e.response?.statusText}): ${e.response?.data?.detail}`,
                            severity: 'error',
                        })
                    })
            }}
            expanded={isExpanded}
            setExpanded={setIsExpanded}
        />
    )

    const loadingBody = (
        <Card
            key={resource_id}
            className={clsx(classes.itemCard)}
            {...cardProps}
        >
            <CardHeader
                avatar={
                    <CircularProgress
                        sx={{ color: (t) => t.palette.text.disabled }}
                    />
                }
                title={
                    <A
                        component={Link}
                        to={`${PATHS[lookup_key]}/${resource_id}`}
                    >
                        {resource_id}
                    </A>
                }
                subheader={
                    <Stack direction="row" spacing={1}>
                        <A component={Link} to={PATHS[lookup_key]}>
                            {DISPLAY_NAMES[lookup_key]}
                        </A>
                        <LoadingChip icon={<ICONS.TEAM />} />
                    </Stack>
                }
                action={action}
            />
            <CardContent />
        </Card>
    )

    const cardBody = (
        <CardContent
            sx={{
                maxHeight: isEditMode ? '80vh' : 'unset',
                overflowY: 'auto',
                '& li': isEditMode
                    ? { marginTop: (t: Theme) => t.spacing(0.5) }
                    : undefined,
                '& table': isEditMode
                    ? {
                          borderCollapse: 'separate',
                          borderSpacing: (t: Theme) => t.spacing(0.5),
                      }
                    : undefined,
            }}
        >
            <Stack spacing={1}>
                <PropertiesDivider>Read-only properties</PropertiesDivider>
                {apiResource && (
                    <PrettyObjectFromQuery
                        resource_id={resource_id}
                        lookup_key={lookup_key}
                        key="read-props"
                        filter={(d, lookup_key) => {
                            const data = deep_copy(d)
                            Object.entries(FIELDS[lookup_key]).forEach(
                                ([k, v]) => {
                                    if (!v.read_only)
                                        delete data[k as keyof typeof data]
                                },
                            )
                            apiResourceDescription &&
                                Object.entries(apiResourceDescription).forEach(
                                    ([k, v]) => {
                                        if (
                                            !v.read_only &&
                                            data[k as keyof typeof data] !==
                                                undefined
                                        )
                                            delete data[k as keyof typeof data]
                                    },
                                )
                            // Unrecognised fields are always editable
                            Object.keys(data).forEach((k) => {
                                const in_description =
                                    apiResourceDescription &&
                                    Object.keys(
                                        apiResourceDescription,
                                    ).includes(k)
                                if (
                                    !Object.keys(FIELDS[lookup_key]).includes(
                                        k,
                                    ) &&
                                    !in_description
                                )
                                    delete data[k as keyof typeof data]
                            })
                            return data
                        }}
                    />
                )}
                <PropertiesDivider>Editable properties</PropertiesDivider>
                {UndoRedo.current && (
                    <PrettyObject<TypeValueNotationWrapper>
                        key="write-props"
                        target={
                            // All Pretty* components expect a TypeValue notated target
                            to_type_value_notation_wrapper(
                                // Drop custom_properties from the target (custom properties are handled below)
                                Object.fromEntries(
                                    Object.entries(UndoRedo.current).filter(
                                        (e) => e[0] !== 'custom_properties',
                                    ),
                                ) as SerializableObject,
                                lookup_key,
                            )
                        }
                        edit_mode={isEditMode}
                        lookup_key={lookup_key}
                        onEdit={(
                            v: TypeValueNotation | TypeValueNotationWrapper,
                        ) => {
                            const core_properties = from_type_value_notation(
                                v,
                            ) as T
                            if (has(UndoRedo.current, 'custom_properties')) {
                                UndoRedo.update({
                                    ...core_properties,
                                    custom_properties:
                                        UndoRedo.current.custom_properties,
                                })
                            } else {
                                UndoRedo.update(core_properties)
                            }
                        }}
                    />
                )}
                {has(apiResource, 'custom_properties') && (
                    <PropertiesDivider>Custom properties</PropertiesDivider>
                )}
                {has(apiResource, 'custom_properties') &&
                    has(UndoRedo.current, 'custom_properties') &&
                    UndoRedo.current && (
                        <PrettyObject<TypeValueNotationWrapper>
                            key="custom-props"
                            // custom_properties are already TypeValue notated
                            target={{
                                ...(UndoRedo.current
                                    .custom_properties as TypeValueNotationWrapper),
                            }}
                            edit_mode={isEditMode}
                            lookup_key={lookup_key}
                            onEdit={(v: Serializable) =>
                                UndoRedo.update({
                                    ...UndoRedo.current,
                                    custom_properties: v,
                                })
                            }
                            canEditKeys
                        />
                    )}
                {family && (
                    <PropertiesDivider>
                        Inherited from
                        {family ? (
                            <ResourceChip
                                resource_id={family.id as string}
                                lookup_key={family_key!}
                            />
                        ) : (
                            FAMILY_ICON && (
                                <LoadingChip icon={<FAMILY_ICON />} />
                            )
                        )}
                    </PropertiesDivider>
                )}
                {family && family_key && (
                    <PrettyObjectFromQuery
                        resource_id={family.id as string}
                        lookup_key={family_key}
                        filter={(d, lookup_key) => {
                            const data = deep_copy(d) as T
                            if (
                                get_is_family(lookup_key) &&
                                has(data, CHILD_PROPERTY_NAMES[lookup_key])
                            )
                                delete data[CHILD_PROPERTY_NAMES[lookup_key]]
                            // Keys child has are not inherited
                            Object.keys(d).forEach(
                                (k) =>
                                    apiResource?.[k as keyof T] !== undefined &&
                                    delete data[k as keyof T],
                            )
                            return data
                        }}
                    />
                )}
            </Stack>
        </CardContent>
    )

    const cardSummary = (
        <CardContent>
            <Summary apiResource={apiResource} lookup_key={lookup_key} />
        </CardContent>
    )

    const forkModal = passesFilters({ apiResource, family }, lookup_key) && (
        <Modal
            open={forking}
            onClose={() => setForking(false)}
            aria-labelledby={get_modal_title(lookup_key, 'title')}
            sx={{ padding: (t: Theme) => t.spacing(4) }}
        >
            <div>
                <ErrorBoundary
                    fallback={(error: Error) => (
                        <ErrorCard
                            message={error.message}
                            header={
                                <CardHeader
                                    avatar={<Avatar variant="square">E</Avatar>}
                                    title="Error"
                                    subheader={`Error with ResourceCard for forking ${resource_id}`}
                                />
                            }
                        />
                    )}
                >
                    <UndoRedoProvider>
                        <ResourceCreator<T>
                            onCreate={() => setForking(false)}
                            onDiscard={() => setForking(false)}
                            lookup_key={lookup_key}
                            initial_data={{ ...apiResource, team: undefined }}
                        />
                    </UndoRedoProvider>
                </ErrorBoundary>
            </div>
        </Modal>
    )

    const cardContent = !passesFilters({ apiResource, family }, lookup_key) ? (
        <Fragment key={resource_id} />
    ) : (
        <Card
            key={resource_id}
            className={clsx(classes.itemCard)}
            {...cardProps}
        >
            <CardHeader
                avatar={
                    <Avatar variant="square">
                        <ICON />
                    </Avatar>
                }
                title={
                    <A
                        component={Link}
                        to={`${PATHS[lookup_key]}/${resource_id}`}
                    >
                        <Representation
                            resource_id={resource_id}
                            lookup_key={lookup_key}
                            prefix={
                                family_key && family ? (
                                    <Representation
                                        resource_id={family.id as string}
                                        lookup_key={family_key}
                                        suffix=" "
                                    />
                                ) : undefined
                            }
                        />
                    </A>
                }
                subheader={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <A component={Link} to={PATHS[lookup_key]}>
                            {DISPLAY_NAMES[lookup_key]}
                        </A>
                        {has(apiResource, 'team') &&
                            apiResource.team !== null && (
                                <ResourceChip
                                    lookup_key="TEAM"
                                    resource_id={id_from_ref_props<number>(
                                        apiResource.team,
                                    )}
                                    sx={{ fontSize: 'smaller' }}
                                />
                            )}
                    </Stack>
                }
                action={action}
            />
            {isExpanded ? cardBody : cardSummary}
            {forkModal}
        </Card>
    )

    const getErrorBody: QueryDependentElement = (queries) => (
        <ErrorCard
            status={queries.find((q) => q.isError)?.error?.response?.status}
            header={
                <CardHeader
                    avatar={
                        <Avatar variant="square">
                            <ICON />
                        </Avatar>
                    }
                    title={resource_id}
                    subheader={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <A component={Link} to={PATHS[lookup_key]}>
                                {DISPLAY_NAMES[lookup_key]}
                            </A>
                        </Stack>
                    }
                />
            }
            {...cardProps}
        />
    )

    return (
        <QueryWrapper
            queries={apiQuery ? [apiQuery] : []}
            loading={loadingBody}
            error={getErrorBody}
            success={cardContent}
        />
    )
}

export default function WrappedResourceCard<T extends GalvResource>(
    props: ResourceCardProps & CardProps,
) {
    return (
        <UndoRedoProvider>
            <ErrorBoundary
                fallback={(error: Error) => (
                    <ErrorCard
                        message={error.message}
                        header={
                            <CardHeader
                                avatar={<Avatar variant="square">E</Avatar>}
                                title="Error"
                                subheader={`Error with ResourceCard for 
                        ${props.lookup_key} ${props.resource_id} [editing=${props.editing}]`}
                            />
                        }
                    />
                )}
            >
                <ApiResourceContextProvider
                    lookup_key={props.lookup_key}
                    resource_id={props.resource_id}
                >
                    <ResourceCard<T> {...props} />
                </ApiResourceContextProvider>
            </ErrorBoundary>
        </UndoRedoProvider>
    )
}

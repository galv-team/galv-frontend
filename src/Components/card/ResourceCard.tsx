import CardActionBar from '../CardActionBar'
import { has, id_from_ref_props } from '../misc'
import useStyles from '../../styles/UseStyles'
import Card, { CardProps } from '@mui/material/Card'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import A from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import LoadingChip from '../LoadingChip'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import React, { Fragment, ReactNode, useContext, useState } from 'react'
import ErrorCard from '../error/ErrorCard'
import QueryWrapper, { QueryDependentElement } from '../QueryWrapper'
import { AxiosError, AxiosResponse } from 'axios'
import {
    API_HANDLERS,
    API_SLUGS,
    DISPLAY_NAMES,
    FAMILY_LOOKUP_KEYS,
    GalvResource,
    get_has_family,
    ICONS,
    LOOKUP_KEYS,
    PATHS,
} from '../../constants'
import ResourceChip from '../ResourceChip'
import ErrorBoundary from '../ErrorBoundary'
import UndoRedoProvider, { useUndoRedoContext } from '../UndoRedoContext'
import Representation from '../Representation'
import { FilterContext } from '../filtering/FilterContext'
import ApiResourceContextProvider, {
    ApiResourceContextProviderProps,
    useApiResource,
} from '../ApiResourceContext'
import { get_modal_title } from '../ResourceCreator'
import { Theme } from '@mui/material/styles'
import { useFetchResource } from '../FetchResourceContext'
import CardSummary from './summaries/CardSummary'
import ForkModal from './utils/ForkModal'
import CardBody from './bodies/CardBody'
import { useCurrentUser } from '../CurrentUserContext'
import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import AxiosErrorAlert from '../AxiosErrorAlert'

export type ResourceCardProps = {
    editing?: boolean
    expanded?: boolean
} & CardProps

function ResourceCard<T extends GalvResource>({
    editing,
    expanded,
    ...cardProps
}: ResourceCardProps) {
    const { classes } = useStyles()
    const [isEditMode, _setIsEditMode] = useState<boolean>(editing || false)
    const [isExpanded, _setIsExpanded] = useState<boolean>(
        expanded || isEditMode,
    )
    // const { settings } = useCurrentUser()
    const [alertContent, setAlertContent] = useState<ReactNode | null>(null)
    const [error, setError] = useState<AxiosError | null>(null)
    const clearAlert = () => {
        setAlertContent(null)
        setError(null)
    }

    const navigate = useNavigate()

    const { passesFilters } = useContext(FilterContext)
    const { apiResource, resourceId, lookupKey, family, apiQuery } =
        useApiResource<T>()

    const { useUpdateQuery, useDeleteQuery } = useFetchResource()

    const UndoRedo = useUndoRedoContext<T>()

    const [forking, setForking] = useState<boolean>(false)

    const setIsExpanded = (e: boolean) => {
        clearAlert()
        _setIsExpanded(e)
    }

    const setEditing = (e: boolean) => {
        _setIsEditMode(e)
        clearAlert()
        if (e) setIsExpanded(e)
    }

    // Mutations for saving edits
    const showSuccess = (message: string = 'Save successful') => {
        setAlertContent(
            <Alert color="success" onClose={() => clearAlert()}>
                {message}
            </Alert>,
        )
    }

    const showError = (e: AxiosError) => {
        setError(e)
        setAlertContent(
            <AxiosErrorAlert error={e} onClose={() => clearAlert()} />,
        )
        return undefined
    }

    const update_mutation = useUpdateQuery<T>(lookupKey)
    const delete_mutation = useDeleteQuery<T>(lookupKey, {
        after: () => navigate(PATHS[lookupKey]),
        on_error: showError,
    })
    const queryClient = useQueryClient()

    // The reimport mutation is not included in useFetchResource because it's only available for Files
    const api_handler = new API_HANDLERS[lookupKey](useCurrentUser().api_config)

    const family_key = get_has_family(lookupKey)
        ? FAMILY_LOOKUP_KEYS[lookupKey]
        : undefined

    const ICON = ICONS[lookupKey]

    // The card action bar controls the expanded state and editing state
    const action = (
        <CardActionBar
            lookupKey={lookupKey}
            editable={!!apiResource?.permissions?.write}
            editing={isEditMode}
            setEditing={setEditing}
            // Harvesters must be created elsewhere - they can't be forked
            onFork={
                apiResource?.permissions?.create &&
                lookupKey !== LOOKUP_KEYS.HARVESTER &&
                lookupKey !== LOOKUP_KEYS.TOKEN
                    ? () => setForking(true)
                    : undefined
            }
            onUndo={UndoRedo.undo}
            onRedo={UndoRedo.redo}
            undoable={UndoRedo.can_undo}
            redoable={UndoRedo.can_redo}
            onEditSave={() => {
                clearAlert()
                update_mutation.mutate(
                    { ...UndoRedo.diff(), id: resourceId },
                    {
                        onSuccess: () => {
                            setEditing(false)
                            showSuccess()
                        },
                        onError: showError,
                    },
                )
                return false //
            }}
            onEditDiscard={() => {
                if (
                    UndoRedo.can_undo &&
                    !window.confirm('Discard all changes?')
                )
                    return false
                clearAlert()
                UndoRedo.reset()
                return true
            }}
            destroyable={
                has(apiResource, 'in_use') &&
                !apiResource.in_use &&
                has(apiResource?.permissions, 'destroy') &&
                apiResource.permissions.destroy
            }
            onDestroy={
                apiResource
                    ? () => {
                          if (
                              !window.confirm(
                                  `Delete ${DISPLAY_NAMES[lookupKey]}/${resourceId}?`,
                              )
                          )
                              return

                          clearAlert()
                          delete_mutation.mutate(apiResource)
                      }
                    : undefined
            }
            reimportable={
                lookupKey === LOOKUP_KEYS.FILE &&
                apiResource?.permissions?.write &&
                has(apiResource, 'state') &&
                apiResource.state !== 'RETRY IMPORT'
            }
            onReImport={() => {
                if (
                    !window.confirm(`
Re-import ${DISPLAY_NAMES[lookupKey]}/${resourceId}?

This will overwrite the current data with the latest version from the source file, if available.
The file will be added to the Harvester's usual queue for processing.
`)
                )
                    return
                clearAlert()
                const reimport = api_handler[
                    `${API_SLUGS[lookupKey]}ReimportRetrieve` as keyof typeof api_handler
                ] as (requestParams: {
                    id: string
                }) => Promise<AxiosResponse<T>>
                reimport
                    .bind(api_handler)({ id: String(resourceId) })
                    .then(() =>
                        queryClient.invalidateQueries({
                            queryKey: [lookupKey, resourceId],
                        }),
                    )
                    .then(() =>
                        showSuccess(
                            'File will be re-imported when the Harvester is next run.',
                        ),
                    )
                    .catch(showError)
            }}
            expanded={isExpanded}
            setExpanded={setIsExpanded}
        />
    )

    const loadingBody = (
        <Card
            key={resourceId}
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
                        to={`${PATHS[lookupKey]}/${resourceId}`}
                    >
                        {resourceId}
                    </A>
                }
                subheader={
                    <Stack direction="row" spacing={1}>
                        <A component={Link} to={PATHS[lookupKey]}>
                            {DISPLAY_NAMES[lookupKey]}
                        </A>
                        <LoadingChip icon={<ICONS.TEAM />} />
                    </Stack>
                }
                action={action}
            />
            <CardContent />
        </Card>
    )

    const forkModal = passesFilters({ apiResource, family }, lookupKey) && (
        <ForkModal
            open={forking}
            onClose={() => setForking(false)}
            aria-labelledby={get_modal_title(lookupKey, 'title')}
            sx={{ padding: (t: Theme) => t.spacing(4) }}
        />
    )

    const cardContent = !passesFilters({ apiResource, family }, lookupKey) ? (
        <Fragment key={resourceId} />
    ) : (
        <Card
            key={resourceId}
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
                        to={`${PATHS[lookupKey]}/${resourceId}`}
                    >
                        <Representation
                            resourceId={resourceId}
                            lookupKey={lookupKey}
                            prefix={
                                family_key && family ? (
                                    <Representation
                                        resourceId={family.id as string}
                                        lookupKey={family_key}
                                        suffix=" "
                                    />
                                ) : undefined
                            }
                        />
                    </A>
                }
                subheader={
                    <Stack direction="row" spacing={1} alignItems="center">
                        <A component={Link} to={PATHS[lookupKey]}>
                            {DISPLAY_NAMES[lookupKey]}
                        </A>
                        {has(apiResource, 'team') &&
                            apiResource.team !== null && (
                                <ResourceChip
                                    lookupKey="TEAM"
                                    resourceId={id_from_ref_props<number>(
                                        apiResource.team,
                                    )}
                                    sx={{ fontSize: 'smaller' }}
                                />
                            )}
                    </Stack>
                }
                action={action}
            />
            {isExpanded && (
                <CardContent>
                    <Collapse in={alertContent !== null}>
                        {alertContent}
                    </Collapse>
                </CardContent>
            )}
            {isExpanded ? (
                <CardBody
                    isEditMode={isEditMode}
                    fieldErrors={
                        Object.fromEntries(
                            Object.entries(error?.response?.data ?? {}).filter(
                                ([k]) => k !== 'non_field_errors',
                            ),
                        ) as Record<string, string>
                    }
                />
            ) : (
                <CardSummary apiResource={apiResource} lookupKey={lookupKey} />
            )}
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
                    title={resourceId}
                    subheader={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <A component={Link} to={PATHS[lookupKey]}>
                                {DISPLAY_NAMES[lookupKey]}
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

export default function ResourceCardFromQuery<T extends GalvResource>({
    lookupKey,
    resourceId,
    ...props
}: ResourceCardProps & CardProps & ApiResourceContextProviderProps) {
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
                        ${lookupKey} ${resourceId} [editing=${props.editing}]`}
                            />
                        }
                    />
                )}
            >
                <ApiResourceContextProvider
                    lookupKey={lookupKey}
                    resourceId={resourceId}
                >
                    <ResourceCard<T> {...props} />
                </ApiResourceContextProvider>
            </ErrorBoundary>
        </UndoRedoProvider>
    )
}

import React, { ReactNode } from 'react'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { MdEdit } from 'react-icons/md'
import { MdUndo } from 'react-icons/md'
import { MdRedo } from 'react-icons/md'
import { MdClose } from 'react-icons/md'
import Stack from '@mui/material/Stack'
import CountBadge from './CountBadge'
import { Link } from 'react-router-dom'
import { MdRemove } from 'react-icons/md'
import { MdAdd } from 'react-icons/md'
import { MdRepartition } from 'react-icons/md'
import {
    DISPLAY_NAMES,
    DISPLAY_NAMES_PLURAL,
    FIELDS,
    GalvResource,
    ICONS,
    is_lookup_key,
    LOOKUP_KEYS,
    LookupKey,
    PATHS,
} from '../constants'
import { useApiResource } from './ApiResourceContext'
import LookupKeyIcon from './LookupKeyIcon'
import { SvgIconProps } from '@mui/material/SvgIcon'
import { id_from_ref_props } from './misc'
import clsx from 'clsx'
import UseStyles from '../styles/UseStyles'
import { useSelectionManagement } from './SelectionManagementContext'
import Checkbox from '@mui/material/Checkbox'
import { representation } from './Representation'

export type CardActionBarProps = {
    lookup_key: LookupKey
    selectable?: boolean
    excludeContext?: boolean
    editable?: boolean
    editing?: boolean
    setEditing?: (editing: boolean) => void
    onEditSave?: () => boolean
    onEditDiscard?: () => boolean
    onFork?: () => void
    undoable?: boolean
    redoable?: boolean
    onUndo?: () => void
    onRedo?: () => void
    destroyable?: boolean
    reimportable?: boolean
    onDestroy?: () => void
    onReImport?: () => void
    expanded?: boolean
    setExpanded?: (expanded: boolean) => void
    iconProps?: Partial<SvgIconProps>
}

/**
 *
 * @param props.onEditSave function that returns true if the save was successful. If false, the editing state will not change.
 * @param props.onEditDiscard function that returns true if the discard was successful. If false, the editing state will not change.
 *
 * @constructor
 */
export default function CardActionBar(props: CardActionBarProps) {
    const { classes } = UseStyles()
    const { apiResource } = useApiResource()
    const iconProps: Partial<SvgIconProps> = {
        fontSize: 'large',
        ...props.iconProps,
    }
    const selectable = props.selectable ?? typeof apiResource?.id === 'string'
    const { toggleSelected, isSelected } = useSelectionManagement()

    const context_section = (
        <>
            {Object.entries(FIELDS[props.lookup_key])
                .filter((e) => is_lookup_key(e[1].type))
                .map(([k, v]) => {
                    const relative_lookup_key = v.type as LookupKey
                    let content: ReactNode
                    if (v.many) {
                        const relative_value = apiResource?.[
                            k as keyof typeof apiResource
                        ] as GalvResource[] | undefined
                        content = (
                            <CountBadge
                                key={`highlight`}
                                icon={
                                    <LookupKeyIcon
                                        lookupKey={relative_lookup_key}
                                        tooltip={false}
                                        {...iconProps}
                                    />
                                }
                                badgeContent={relative_value?.length}
                                url={PATHS[relative_lookup_key]}
                            />
                        )
                    } else {
                        const relative_value = apiResource?.[
                            k as keyof typeof apiResource
                        ] as GalvResource | undefined
                        const relative_id = relative_value
                            ? id_from_ref_props(relative_value)
                            : undefined
                        content = (
                            <IconButton
                                component={Link}
                                to={`${PATHS[relative_lookup_key]}/${relative_id}`}
                            >
                                <LookupKeyIcon
                                    lookupKey={relative_lookup_key}
                                    tooltip={false}
                                    {...iconProps}
                                />
                            </IconButton>
                        )
                    }
                    return (
                        <Tooltip
                            title={`View ${(v.many ? DISPLAY_NAMES_PLURAL : DISPLAY_NAMES)[relative_lookup_key]}`}
                            arrow
                            describeChild
                            key={k}
                        >
                            <div>{content}</div>
                        </Tooltip>
                    )
                })}
        </>
    )

    let edit_section: ReactNode
    if (props.editable) {
        if (typeof props.setEditing !== 'function')
            throw new Error(`setEditing must be a function if editable=true`)
        if (typeof props.onEditSave !== 'function')
            throw new Error(`onEditSave must be a function if editable=true`)
        if (typeof props.onEditDiscard !== 'function')
            throw new Error(`onEditDiscard must be a function if editable=true`)
        if (!props.editing) {
            edit_section = (
                <Tooltip
                    title={`Edit this ${DISPLAY_NAMES[props.lookup_key]}`}
                    arrow
                    describeChild
                    key="edit"
                >
                    <IconButton onClick={() => props.setEditing!(true)}>
                        <MdEdit {...iconProps} />
                    </IconButton>
                </Tooltip>
            )
        } else {
            if (props.undoable && typeof props.onUndo !== 'function')
                throw new Error(`onUndo must be a function if undoable=true`)
            if (props.redoable && typeof props.onRedo !== 'function')
                throw new Error(`onRedo must be a function if redoable=true`)

            edit_section = (
                <>
                    <Tooltip
                        title={`Save changes`}
                        arrow
                        describeChild
                        key="save"
                    >
                        <IconButton
                            onClick={() => {
                                if (props.onEditSave!())
                                    props.setEditing!(false)
                            }}
                        >
                            <ICONS.SAVE {...iconProps} color="success" />
                        </IconButton>
                    </Tooltip>
                    {props.onUndo && (
                        <Tooltip title={`Undo`} arrow describeChild key="undo">
                            <span>
                                <IconButton
                                    onClick={props.onUndo!}
                                    disabled={!props.undoable}
                                >
                                    <MdUndo {...iconProps} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    {props.onRedo && (
                        <Tooltip title={`Redo`} arrow describeChild key="redo">
                            <span>
                                <IconButton
                                    onClick={props.onRedo!}
                                    disabled={!props.redoable}
                                >
                                    <MdRedo {...iconProps} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    <Tooltip
                        title={`Discard changes`}
                        arrow
                        describeChild
                        key="discard"
                    >
                        <IconButton
                            onClick={() => {
                                if (props.onEditDiscard!())
                                    props.setEditing!(false)
                            }}
                        >
                            <MdClose {...iconProps} color="error" />
                        </IconButton>
                    </Tooltip>
                </>
            )
        }
    }

    const destroy_section = (
        <Stack direction="row" spacing={1} alignItems="center">
            {props.lookup_key === LOOKUP_KEYS.FILE && props.reimportable && (
                <Tooltip
                    title="Force the harvester to re-import this file"
                    arrow
                    describeChild
                    key="reimport"
                >
                    <span>
                        <IconButton
                            onClick={() =>
                                props.onReImport && props.onReImport()
                            }
                            disabled={!props.reimportable}
                        >
                            <MdRepartition
                                {...iconProps}
                                className={clsx(classes.deleteIcon)}
                                {...iconProps}
                            />
                        </IconButton>
                    </span>
                </Tooltip>
            )}
            <Tooltip
                title={
                    props.destroyable
                        ? `Delete this ${DISPLAY_NAMES[props.lookup_key]}`
                        : `Cannot delete this ${DISPLAY_NAMES[props.lookup_key]}, it may be being used by other resources.`
                }
                arrow
                describeChild
                key="delete"
            >
                <span>
                    <IconButton
                        onClick={() => props.onDestroy && props.onDestroy()}
                        disabled={!props.destroyable}
                    >
                        <ICONS.DELETE
                            className={clsx(classes.deleteIcon)}
                            {...iconProps}
                        />
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
    )

    const select_section = selectable && apiResource && apiResource?.url && (
        <Tooltip
            title={`${isSelected(apiResource) ? 'Deselect' : 'Select'} this ${DISPLAY_NAMES[props.lookup_key]}`}
            arrow
            describeChild
            key="select"
        >
            <Checkbox
                checked={isSelected(apiResource)}
                onChange={() => toggleSelected(apiResource!)}
            />
        </Tooltip>
    )

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {!props.excludeContext && context_section}
            {props.editable && edit_section}
            {props.onFork && apiResource && (
                <Tooltip
                    title={`
            Create your own copy of ${representation({ data: apiResource, lookup_key: props.lookup_key })}
            `}
                    arrow
                    describeChild
                >
                    <IconButton onClick={props.onFork}>
                        <ICONS.FORK {...iconProps} />
                    </IconButton>
                </Tooltip>
            )}
            {props.onDestroy && destroy_section}
            {select_section}
            {props.expanded !== undefined &&
                props.setExpanded !== undefined && (
                    <Tooltip
                        title={props.expanded ? 'Hide Details' : 'Show Details'}
                        arrow
                        describeChild
                        key="expand"
                    >
                        <IconButton
                            onClick={() => props.setExpanded!(!props.expanded)}
                        >
                            {props.expanded ? (
                                <MdRemove {...iconProps} />
                            ) : (
                                <MdAdd {...iconProps} />
                            )}
                        </IconButton>
                    </Tooltip>
                )}
        </Stack>
    )
}

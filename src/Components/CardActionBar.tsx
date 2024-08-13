import React, { ReactNode } from 'react'
import IconButton from '@mui/material/IconButton'
import {
    MdAdd,
    MdCheckBox,
    MdCheckBoxOutlineBlank,
    MdClose,
    MdEdit,
    MdRedo,
    MdRemove,
    MdRepartition,
    MdUndo,
} from 'react-icons/md'
import Stack from '@mui/material/Stack'
import CountBadge from './CountBadge'
import { Link } from 'react-router-dom'
import {
    DISPLAY_NAMES,
    DISPLAY_NAMES_PLURAL,
    FIELDS,
    GalvResource,
    ICONS,
    is_lookupKey,
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
import { representation } from './Representation'
import SafeTooltip from './SafeTooltip'

export type CardActionBarProps = {
    lookupKey: LookupKey
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
            {Object.entries(FIELDS[props.lookupKey])
                .filter((e) => is_lookupKey(e[1].type))
                .map(([k, v]) => {
                    const relative_lookupKey = v.type as LookupKey
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
                                        lookupKey={relative_lookupKey}
                                        tooltip={false}
                                        {...iconProps}
                                    />
                                }
                                badgeContent={relative_value?.length}
                                url={PATHS[relative_lookupKey]}
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
                                to={`${PATHS[relative_lookupKey]}/${relative_id}`}
                            >
                                <LookupKeyIcon
                                    lookupKey={relative_lookupKey}
                                    tooltip={false}
                                    {...iconProps}
                                />
                            </IconButton>
                        )
                    }
                    return (
                        <SafeTooltip
                            title={`View ${(v.many ? DISPLAY_NAMES_PLURAL : DISPLAY_NAMES)[relative_lookupKey]}`}
                            arrow
                            describeChild
                            key={k}
                        >
                            {content}
                        </SafeTooltip>
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
                <SafeTooltip
                    title={`Edit this ${DISPLAY_NAMES[props.lookupKey]}`}
                    arrow
                    describeChild
                    key="edit"
                >
                    <IconButton onClick={() => props.setEditing!(true)}>
                        <MdEdit {...iconProps} />
                    </IconButton>
                </SafeTooltip>
            )
        } else {
            if (props.undoable && typeof props.onUndo !== 'function')
                throw new Error(`onUndo must be a function if undoable=true`)
            if (props.redoable && typeof props.onRedo !== 'function')
                throw new Error(`onRedo must be a function if redoable=true`)

            edit_section = (
                <>
                    <SafeTooltip
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
                    </SafeTooltip>
                    {props.onUndo && (
                        <SafeTooltip title={`Undo`} arrow key="undo">
                            <IconButton
                                onClick={props.onUndo!}
                                disabled={!props.undoable}
                            >
                                <MdUndo {...iconProps} />
                            </IconButton>
                        </SafeTooltip>
                    )}
                    {props.onRedo && (
                        <SafeTooltip title={`Redo`} arrow key="redo">
                            <IconButton
                                onClick={props.onRedo!}
                                disabled={!props.redoable}
                            >
                                <MdRedo {...iconProps} />
                            </IconButton>
                        </SafeTooltip>
                    )}
                    <SafeTooltip
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
                    </SafeTooltip>
                </>
            )
        }
    }

    const destroy_section = (
        <Stack direction="row" spacing={1} alignItems="center">
            {props.lookupKey === LOOKUP_KEYS.FILE && props.reimportable && (
                <SafeTooltip
                    title="Force the harvester to re-import this file"
                    arrow
                    describeChild
                    key="reimport"
                >
                    <IconButton
                        onClick={() => props.onReImport && props.onReImport()}
                        disabled={!props.reimportable}
                    >
                        <MdRepartition
                            {...iconProps}
                            className={clsx(classes.deleteIcon)}
                            {...iconProps}
                        />
                    </IconButton>
                </SafeTooltip>
            )}
            <SafeTooltip
                title={
                    props.destroyable
                        ? `Delete this ${DISPLAY_NAMES[props.lookupKey]}`
                        : `Cannot delete this ${DISPLAY_NAMES[props.lookupKey]}, it may be being used by other resources.`
                }
                arrow
                describeChild
                key="delete"
            >
                <IconButton
                    onClick={() => props.onDestroy && props.onDestroy()}
                    disabled={!props.destroyable}
                >
                    <ICONS.DELETE
                        className={clsx(classes.deleteIcon)}
                        {...iconProps}
                    />
                </IconButton>
            </SafeTooltip>
        </Stack>
    )

    const select_section = selectable && apiResource && apiResource?.url && (
        <SafeTooltip
            title={`${isSelected(apiResource) ? 'Deselect' : 'Select'} this ${DISPLAY_NAMES[props.lookupKey]}`}
            arrow
            describeChild
            key="select"
        >
            <IconButton onClick={() => toggleSelected(apiResource!)}>
                {isSelected(apiResource) ? (
                    <MdCheckBox />
                ) : (
                    <MdCheckBoxOutlineBlank />
                )}
            </IconButton>
        </SafeTooltip>
    )

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {!props.excludeContext && context_section}
            {props.editable && edit_section}
            {props.onFork && apiResource && (
                <SafeTooltip
                    title={`
            Create your own copy of ${representation({ data: apiResource, lookupKey: props.lookupKey })}
            `}
                    arrow
                    describeChild
                >
                    <IconButton onClick={props.onFork}>
                        <ICONS.FORK {...iconProps} />
                    </IconButton>
                </SafeTooltip>
            )}
            {props.onDestroy && destroy_section}
            {select_section}
            {props.expanded !== undefined &&
                props.setExpanded !== undefined && (
                    <SafeTooltip
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
                    </SafeTooltip>
                )}
        </Stack>
    )
}

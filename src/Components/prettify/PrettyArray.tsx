import React, { useEffect, useState } from 'react'
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { arrayMoveImmutable } from 'array-move'
import List, { ListProps } from '@mui/material/List'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import { MdArrowRight, MdDragHandle, MdRemove } from 'react-icons/md'
import { PrettyObjectProps } from './PrettyObject'
import Prettify from './Prettify'
import useStyles from '../../styles/UseStyles'
import clsx from 'clsx'
import { TypeChangerSupportedTypeName } from './TypeChanger'
import { useImmer } from 'use-immer'
import { TypeValueNotation } from '../TypeValueNotation'
import IconButton from '@mui/material/IconButton'

export type PrettyArrayProps = Pick<
    PrettyObjectProps,
    'nest_level' | 'edit_mode'
> & {
    target: TypeValueNotation & { _value: TypeValueNotation[] }
    child_type?: TypeChangerSupportedTypeName
    onEdit?: (v: PrettyArrayProps['target']) => void
}

// https://docs.dndkit.com/presets/sortable#overview
function SortableItem({
    id,
    children,
    ...props
}: { id: string; children?: React.ReactNode } & ListItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <ListItem
            alignItems="flex-start"
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...props}
        >
            <ListItemIcon
                key={`action_${id}`}
                className="drag-handle"
                ref={setActivatorNodeRef}
                sx={{ cursor: 'pointer' }}
                {...listeners}
            >
                <MdDragHandle aria-label="Reorder" />
            </ListItemIcon>
            {children}
        </ListItem>
    )
}

export default function PrettyArray({
    target,
    nest_level,
    edit_mode,
    onEdit,
    child_type,
    ...childProps
}: PrettyArrayProps & ListProps) {
    const dnd_sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )
    const _nest_level = nest_level || 0
    const _edit_mode = edit_mode || false
    const _onEdit = onEdit || (() => {})

    const { classes } = useStyles()

    const [items, setItems] = useImmer(target._value ?? [])
    const [newItemCounter, setNewItemCounter] = useState(0)

    useEffect(() => {
        setItems(target._value ?? [])
    }, [target._value, setItems])

    function dndHandleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over !== null && active.id !== over.id) {
            const oldIndex = Number(active.id)
            const newIndex = Number(over.id)
            const newItems = arrayMoveImmutable(items, oldIndex, newIndex)
            setItems(newItems)
            _onEdit({ _type: 'array', _value: newItems })
        }
    }

    const get_type = () => {
        if (child_type) return child_type
        if (items.length === 0) return 'string'
        return items[items.length - 1]._type
    }

    return (
        <List
            className={clsx(classes.prettyArray, {
                [classes.prettyNested]: _nest_level % 2,
            })}
            dense={true}
            {...childProps}
        >
            {_edit_mode ? (
                <DndContext
                    sensors={dnd_sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={dndHandleDragEnd}
                >
                    <SortableContext
                        items={items.map((item, id) => ({ item, id }))}
                        strategy={verticalListSortingStrategy}
                    >
                        {items.map((item, i) => (
                            // @ts-expect-error // types are not correctly exported by react-smooth-dnd
                            <SortableItem key={i} id={i}>
                                <Prettify
                                    key={`item_${i}`}
                                    target={item}
                                    nest_level={_nest_level}
                                    edit_mode={true}
                                    onEdit={(v) => {
                                        const newItems = [...items]
                                        newItems[i] = v
                                        setItems(newItems)
                                        _onEdit({
                                            _type: 'array',
                                            _value: newItems,
                                        })
                                    }}
                                    lock_type={!!child_type}
                                />
                                <ListItemIcon key={`remove_${i}`}>
                                    <IconButton
                                        className={clsx(
                                            classes.deleteIcon,
                                            classes.dangerIcon,
                                        )}
                                        title="Remove item"
                                        onClick={() => {
                                            const newItems = [...items]
                                            newItems.splice(i, 1)
                                            setItems(newItems)
                                            _onEdit({
                                                _type: 'array',
                                                _value: newItems,
                                            })
                                        }}
                                    >
                                        <MdRemove />
                                    </IconButton>
                                </ListItemIcon>
                            </SortableItem>
                        ))}
                    </SortableContext>
                    <ListItem key="new_item" alignItems="flex-start">
                        <Prettify
                            key={`new_item_${newItemCounter}`}
                            target={{ _type: get_type(), _value: null }}
                            label="+ ITEM"
                            placeholder="enter new value"
                            nest_level={_nest_level}
                            edit_mode={true}
                            onEdit={(v) => {
                                const newItems = [...items]
                                newItems.push(v)
                                setItems(newItems)
                                _onEdit({ _type: 'array', _value: newItems })
                                setNewItemCounter(newItemCounter + 1)
                            }}
                            lock_type={!!child_type}
                        />
                    </ListItem>
                </DndContext>
            ) : (
                items.map((item, i) => (
                    <ListItem key={i} alignItems="flex-start">
                        <ListItemIcon key={`action_${i}`}>
                            <MdArrowRight />
                        </ListItemIcon>
                        <Prettify
                            key={i}
                            target={item}
                            nest_level={_nest_level}
                            edit_mode={false}
                            lock_type={!!child_type}
                        />
                    </ListItem>
                ))
            )}
        </List>
    )
}

import React, {useState} from "react";
import {Container, Draggable, DropResult, OnDropCallback} from "react-smooth-dnd";
import {arrayMoveImmutable} from "array-move";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import RemoveIcon from '@mui/icons-material/Remove';
import {PrettyObjectProps} from "./PrettyObject";
import {ListProps} from "@mui/material";
import Prettify from "./Prettify";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import {
    TypeChangerSupportedTypeName
} from "./TypeChanger";
import {useImmer} from "use-immer";
import {TypeValueNotation} from "../TypeValueNotation";

export type PrettyArrayProps = Pick<PrettyObjectProps, "nest_level" | "edit_mode"> & {
    target: TypeValueNotation & {_value: TypeValueNotation[]}
    child_type?: TypeChangerSupportedTypeName
    onEdit?: (v: PrettyArrayProps["target"]) => void
}

export default function PrettyArray(
    {target, nest_level, edit_mode, onEdit, child_type, ...childProps}: PrettyArrayProps & ListProps
) {
    const _nest_level = nest_level || 0
    const _edit_mode = edit_mode || false
    const _onEdit = onEdit || (() => {})

    const {classes} = useStyles()

    const [items, setItems] = useImmer(target._value ?? []);
    const [newItemCounter, setNewItemCounter] = useState(0)

    const onDrop: OnDropCallback = ({ removedIndex, addedIndex }: DropResult) => {
        if (removedIndex === null || addedIndex === null) return
        const newItems = arrayMoveImmutable(items, removedIndex, addedIndex)
        setItems(newItems);
        _onEdit({_type: "array", _value: newItems})
    };

    const get_type = () => {
        if (child_type) return child_type
        if (items.length === 0) return "string"
        return items[items.length - 1]._type
    }

    return <List
        className={clsx(
            classes.prettyArray,
            {[classes.prettyNested]: _nest_level % 2}
        )}
        dense={true}
        {...childProps}
    >
        {
            _edit_mode?
                // @ts-expect-error // types are not correctly exported by react-smooth-dnd
                <Container dragHandleSelector=".drag-handle" lockAxis="y" onDrop={onDrop}>
                    {items.map((item, i) => (
                        // @ts-expect-error // types are not correctly exported by react-smooth-dnd
                        <Draggable key={i}>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon key={`action_${i}`} className="drag-handle">
                                    <DragHandleIcon />
                                </ListItemIcon>
                                <Prettify
                                    key={`item_${i}`}
                                    target={item}
                                    nest_level={_nest_level}
                                    edit_mode={true}
                                    onEdit={(v) => {
                                        const newItems = [...items]
                                        newItems[i] = v
                                        setItems(newItems)
                                        _onEdit({_type: "array", _value: newItems})
                                    }}
                                    lock_type={!!child_type}
                                />
                                <ListItemIcon key={`remove_${i}`}>
                                    <RemoveIcon
                                        sx={{cursor: "pointer", color: "error"}}
                                        onClick={() => {
                                            const newItems = [...items]
                                            newItems.splice(i, 1)
                                            setItems(newItems)
                                            _onEdit({_type: "array", _value: newItems})
                                        }} />
                                </ListItemIcon>
                            </ListItem>
                        </Draggable>
                    ))}
                    <ListItem key="new_item" alignItems="flex-start">
                        <Prettify
                            key={`new_item_${newItemCounter}`}
                            target={{_type: get_type(), _value: null}}
                            label="+ ITEM"
                            placeholder="enter new value"
                            nest_level={_nest_level}
                            edit_mode={true}
                            onEdit={(v) => {
                                const newItems = [...items]
                                newItems.push(v)
                                setItems(newItems)
                                _onEdit({_type: "array", _value: newItems})
                                setNewItemCounter(newItemCounter + 1)
                            }}
                            lock_type={!!child_type}
                        />
                    </ListItem>
                </Container> :
                items.map((item, i) => <ListItem key={i} alignItems="flex-start">
                    <ListItemIcon key={`action_${i}`}>
                        <ArrowRightIcon />
                    </ListItemIcon>
                    <Prettify
                        key={i}
                        target={item}
                        nest_level={_nest_level}
                        edit_mode={false}
                        lock_type={!!child_type}
                    />
                </ListItem>)
        }
    </List>
}
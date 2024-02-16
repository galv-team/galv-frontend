import React, {useEffect} from "react";
import {Container, Draggable, DropResult, OnDropCallback} from "react-smooth-dnd";
import {arrayMoveImmutable} from "array-move";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import {PrettyObjectProps} from "./PrettyObject";
import {ListProps} from "@mui/material";
import Prettify from "./Prettify";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import {
    is_custom_property,
    Serializable,
    to_custom_property,
    TypeChangerSupportedTypeName
} from "../TypeChanger";

export type PrettyArrayProps = Pick<PrettyObjectProps, "nest_level" | "edit_mode"> & {
    target: Serializable[]
    custom_property:  boolean
    child_type?: TypeChangerSupportedTypeName
    onEdit?: (v: Serializable[]) => void
}

export default function PrettyArray(
    {target, custom_property, nest_level, edit_mode, onEdit, child_type, ...childProps}: PrettyArrayProps & ListProps
) {
    const _nest_level = nest_level || 0
    const _edit_mode = edit_mode || false
    const _onEdit = onEdit || (() => {})
    const _custom_property = custom_property || false

    const {classes} = useStyles()

    const [items, setItems] = React.useState([...target]);

    const onDrop: OnDropCallback = ({ removedIndex, addedIndex }: DropResult) => {
        if (removedIndex === null || addedIndex === null) return
        const newItems = arrayMoveImmutable(items, removedIndex, addedIndex)
        setItems(newItems);
        _onEdit(newItems)
    };

    // Required to update the items in response to Undo/Redo
    useEffect(() => {setItems([...target])}, [target])

    const get_type = () => {
        if (!_custom_property) {
            if (!child_type) {
                console.error("PrettyArray: child_type is required when custom_property is false")
                throw new Error("PrettyArray: child_type is required when custom_property is false")
            }
            return child_type
        }
        if (items.length === 0) return "string"
        const last_item = items[items.length - 1]
        if (is_custom_property(last_item) && last_item._type !== "null") return last_item._type
        return "string"
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
                                        newItems[i] = _custom_property? to_custom_property(v) : v
                                        setItems(newItems)
                                        _onEdit(newItems)
                                    }}
                                    lock_type={!!child_type}
                                    type={
                                        child_type ??
                                        (is_custom_property(item) && item._type !== "null"? item._type : "string")
                                    }
                                />
                            </ListItem>
                        </Draggable>
                    ))}
                    <ListItem key="new_item" alignItems="flex-start">
                        <Prettify
                            target=""
                            label="+ ITEM"
                            placeholder="enter new value"
                            nest_level={_nest_level}
                            edit_mode={true}
                            onEdit={(v) => {
                                const newItems = [...items]
                                newItems.push(v)
                                setItems(newItems)
                                _onEdit(newItems)
                                return ""
                            }}
                            lock_type={!!child_type}
                            type={get_type()}
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
                        type={get_type()}
                    />
                </ListItem>)
        }
    </List>
}
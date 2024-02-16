import React, {PropsWithChildren, SyntheticEvent, useEffect, useState} from "react";
import TextField, {TextFieldProps} from "@mui/material/TextField";
import Typography, {TypographyProps} from "@mui/material/Typography";
import {SvgIconProps} from "@mui/material/SvgIcon"
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import PrettyObject from "./PrettyObject";
import Checkbox, {CheckboxProps} from "@mui/material/Checkbox";
import PrettyArray from "./PrettyArray";
import TypeChanger, {
    CustomProperty,
    is_custom_property, NonNullSerializable,
    Serializable, type_as_key,
    TypeChangerProps,
    TypeChangerSupportedTypeName
} from "../TypeChanger";
import Stack from "@mui/material/Stack";
import {ChipProps} from "@mui/material/Chip";
import {AutocompleteKey, is_autocomplete_key, is_lookup_key, LookupKey} from "../../constants";
import PrettyResource from "./PrettyResource";
import PrettyAutocomplete from "./PrettyAutocomplete";
import {AutocompleteProps} from "@mui/material/Autocomplete";

type PrettifyProps = {
    target: Serializable
    nest_level: number
    edit_mode: boolean
    // onEdit is called when the user leaves the field
    // If it returns a value, the value is set as the new value for the field
    onEdit?: (value: Serializable) => Serializable|void
    type: TypeChangerSupportedTypeName
    // When type is an array, we can lock the type of the array's children.
    // This only works for one level of nesting, but that's all we need for official fields
    // which are the only fields where types are locked.
    lock_child_type_to?: TypeChangerSupportedTypeName
    hide_type_changer?: boolean
    lock_type?: boolean
}

export type PrettyComponentProps<T = Serializable> = {
    value: T
    type: TypeChangerSupportedTypeName
    onChange: (value: T) => void
    edit_mode: boolean
}

export const PrettyString = (
    {value, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<string> & Partial<Omit<ChipProps | TextFieldProps | TypographyProps, "onChange">>
) => edit_mode ?
    <TextField
        label="value"
        variant="filled"
        size="small"
        multiline={false} // TODO fix error spam
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...childProps as TextFieldProps}
    /> :
    <Typography component="span" variant="body1" {...childProps as TypographyProps}>{value}</Typography>

const PrettyNumber = (
    {value, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<number> & Partial<Omit<TextFieldProps | TypographyProps, "onChange">>
) => {
    const [error, setError] = useState<boolean>(false)
    return edit_mode ?
        <TextField
            type="number"
            label="value"
            variant="filled"
            size="small"
            inputProps={{inputMode: 'numeric', pattern: '-?[0-9]*[.,]?[0-9]*'}}
            error={error}
            value={value}
            onChange={(e) => {
                let v: number
                try {v = parseFloat(e.target.value)} catch (e) {
                    setError(true)
                    return
                }
                setError(false)
                onChange(v)
            }}
            {...childProps as TextFieldProps}
        /> :
        <Typography component="span" variant="overline" sx={{fontSize: "1.1em"}} {...childProps as TypographyProps}>
            {value}
        </Typography>
}

const PrettyBoolean = (
    {value, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<boolean> & Partial<Omit<CheckboxProps | SvgIconProps, "onChange">>
) => edit_mode?
    <Checkbox
        sx={{fontSize: "1.1em"}}
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
        {...childProps as CheckboxProps}
    /> :
    value? <CheckIcon {...childProps as SvgIconProps} /> : <ClearIcon {...childProps as SvgIconProps} />

const TypeChangeWrapper = ({children, ...props}: PropsWithChildren<TypeChangerProps>) =>
    <Stack direction="row" spacing={0.5}>
        <TypeChanger {...props} />
        {children}
    </Stack>

export function Pretty(
    {target, type, nest_level, edit_mode, onEdit, lock_child_type_to, ...childProps}: PrettifyProps &
        Partial<Omit<TextFieldProps | TypographyProps | CheckboxProps, "onChange"> | SvgIconProps | ChipProps>
) {
    const custom_property = is_custom_property(target)
    const denull = (t: Serializable) => t ?? ''
    const [value, setValue] = useState<NonNullSerializable>(
        denull(custom_property? target._value : target)
    )

    useEffect(() => setValue(denull(custom_property? target._value : target)), [setValue, target])
    const triggerEdit = (_?: unknown, override_value?: typeof value) => {
        const v = override_value ?? value
        if (edit_mode && onEdit && v !== denull(target)) {
            const wrapped_value = custom_property? {_type: target._type, _value: v} : v
            const write_value = onEdit(wrapped_value)
            console.log("triggerEdit", {value, wrapped_value: wrapped_value, write_value: write_value, target})
            if (write_value !== undefined && write_value !== null) setValue(write_value)
        }
    }
    const props = {
        value,
        type,
        onChange: setValue,
        edit_mode: edit_mode,
        onBlur: triggerEdit,
        onKeyDown: (e: SyntheticEvent<unknown, KeyboardEvent>) => {
            if (e.nativeEvent.code === 'Enter') triggerEdit()
        }
    }

    if (edit_mode && typeof onEdit !== 'function')
        throw new Error(`onEdit must be a function if edit_mode=true`)

    if (type === 'string')
        return <PrettyString
            {...props as typeof props & {value: string}}
            {...childProps as Partial<Omit<TextFieldProps | TypographyProps | CheckboxProps, "onChange">> }
        />
    if (type === 'number')
        return <PrettyNumber
            {...props as typeof props & {value: number}}
            {...childProps as Partial<Omit<TextFieldProps | TypographyProps, "onChange">>}
        />
    if (type === 'boolean')
        return <PrettyBoolean
            {...props as typeof props & {value: boolean}}
            onChange={(v: boolean) => onEdit && onEdit(v)}
            {...childProps as Partial<Omit<CheckboxProps | SvgIconProps, "onChange">>}
        />
    if (type === 'array') {
        return <PrettyArray
            nest_level={nest_level + 1}
            edit_mode={edit_mode}
            target={value as Serializable[]}
            custom_property={custom_property}
            onEdit={onEdit}
            child_type={lock_child_type_to}
        />
    }
    if (type === 'object') {
        return <PrettyObject
            nest_level={nest_level + 1}
            edit_mode={edit_mode}
            onEdit={onEdit}
            target={value as CustomProperty}
        />
    }
    const key = type_as_key(type)
    if (is_lookup_key(key)) {
        return <PrettyResource
            value={value as LookupKey}
            type={type}
            onChange={(v: string) => triggerEdit(undefined, v)}
            edit_mode={edit_mode}
            lookup_key={key}
            {...childProps as Partial<Omit<ChipProps,"onChange">>}
        />
    }
    if (is_autocomplete_key(key)) {
        return <PrettyAutocomplete
            value={value as AutocompleteKey}
            type={type}
            onChange={(v) => triggerEdit(undefined, v)}
            edit_mode={edit_mode}
            autocomplete_key={key}
            {...childProps as
                (Omit<Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>|TypographyProps>, "onChange">)
            }
        />
    }

    console.error(
        "Prettify failure",
        {target, nest_level, edit_mode, onEdit, lock_child_type_to, type, ...childProps}
    )
    throw new Error(`Could not prettify value: ${value}`)
}

export default function Prettify(
    {hide_type_changer, lock_type, ...props}:
        Omit<PrettifyProps, "edit_mode"|"nest_level"> & {edit_mode?: boolean, nest_level?: number} &
        Partial<TextFieldProps | TypographyProps | Omit<CheckboxProps, "onChange"> | SvgIconProps>
) {
    const pretty = <Pretty
        {...props}
        edit_mode={props.edit_mode ?? false}
        nest_level={props.nest_level ?? 0}
    />
    return props.edit_mode && props.onEdit && !hide_type_changer?
        <TypeChangeWrapper
            onTypeChange={props.onEdit}
            currentValue={props.target}
            lock_type={lock_type ?? false}
            type={props.type}
        >
            {pretty}
        </TypeChangeWrapper> :
        pretty
}
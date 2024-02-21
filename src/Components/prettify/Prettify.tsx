import React, {PropsWithChildren, SyntheticEvent, useState} from "react";
import TextField, {TextFieldProps} from "@mui/material/TextField";
import Typography, {TypographyProps} from "@mui/material/Typography";
import {SvgIconProps} from "@mui/material/SvgIcon"
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import PrettyObject from "./PrettyObject";
import Checkbox, {CheckboxProps} from "@mui/material/Checkbox";
import PrettyArray from "./PrettyArray";
import TypeChanger, {
    TypeValueNotation,
    type_as_key,
    TypeChangerProps,
    TypeChangerSupportedTypeName,
    TypeChangerLookupKey,
    TypeChangerAutocompleteKey,
    is_type_changer_supported_tv_notation
} from "../TypeChanger";
import Stack from "@mui/material/Stack";
import {ChipProps} from "@mui/material/Chip";
import {is_autocomplete_key, is_lookup_key} from "../../constants";
import PrettyResource from "./PrettyResource";
import PrettyAutocomplete from "./PrettyAutocomplete";
import {AutocompleteProps} from "@mui/material/Autocomplete";
import {useImmer} from "use-immer";
import Skeleton from "@mui/material/Skeleton";

type PrettifyProps = {
    target: TypeValueNotation
    nest_level: number
    edit_mode: boolean
    // onEdit is called when the user leaves the field
    onEdit?: (value: TypeValueNotation) => void
    // When type is an array, we can lock the type of the array's children.
    // This only works for one level of nesting, but that's all we need for official fields
    // which are the only fields where types are locked.
    lock_child_type_to?: TypeChangerSupportedTypeName
    hide_type_changer?: boolean
    lock_type?: boolean
}

export type PrettyComponentProps<T = unknown> = {
    target: TypeValueNotation & {_value: T}
    onChange: (new_target: TypeValueNotation & {_value: T}) => void
    edit_mode: boolean
}

export const PrettyString = (
    {target, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<string|null> & Partial<Omit<ChipProps | TextFieldProps | TypographyProps, "onChange">>
) => edit_mode ?
    <TextField
        label="value"
        variant="filled"
        size="small"
        multiline={false} // TODO fix error spam
        value={target._value ?? ""}
        onChange={(e) => onChange({_type: "string", _value: e.target.value})}
        {...childProps as TextFieldProps}
    /> :
    <Typography component="span" variant="body1" {...childProps as TypographyProps}>{target._value}</Typography>

const PrettyNumber = (
    {target, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<number|null> & Partial<Omit<TextFieldProps | TypographyProps, "onChange">>
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
            value={target._value ?? ""}
            onChange={(e) => {
                let v: number
                try {v = parseFloat(e.target.value)} catch (e) {
                    setError(true)
                    return
                }
                setError(false)
                onChange({_type: "number", _value: v})
            }}
            {...childProps as TextFieldProps}
        /> :
        <Typography component="span" variant="overline" sx={{fontSize: "1.1em"}} {...childProps as TypographyProps}>
            {target._value}
        </Typography>
}

const PrettyBoolean = (
    {target, onChange, edit_mode, ...childProps}:
        PrettyComponentProps<boolean|null> & Partial<Omit<CheckboxProps | SvgIconProps, "onChange">>
) => edit_mode?
    <Checkbox
        sx={{fontSize: "1.1em"}}
        checked={!!target._value}
        onChange={(e) => onChange({_type: "boolean", _value: e.currentTarget.checked})}
        {...childProps as CheckboxProps}
    /> :
    target._value? <CheckIcon {...childProps as SvgIconProps} /> : <ClearIcon {...childProps as SvgIconProps} />

const TypeChangeWrapper = ({children, ...props}: PropsWithChildren<TypeChangerProps>) =>
    <Stack direction="row" spacing={0.5}>
        <TypeChanger {...props} />
        {children}
    </Stack>

export function PrettyError({error, ...log_items}: {error: Error, [key: string]: unknown}) {
    console.error("PrettyError", log_items)
    return <Typography variant="body1" color="error">{error.message}</Typography>
}

export function Pretty(
    {target, nest_level, edit_mode, onEdit, lock_child_type_to, ...childProps}: PrettifyProps &
        Partial<Omit<TextFieldProps | TypographyProps | CheckboxProps, "onChange"> | SvgIconProps | ChipProps>
) {
    const [tempTarget, setTempTarget] = useImmer<typeof target>(target)

    // When updating type to a simple type, we need to wait until tempTarget is updated
    if (target._type !== tempTarget._type) {
        setTempTarget(target)
        return <Skeleton />
    }

    const triggerEdit = () => edit_mode && onEdit && onEdit(tempTarget)

    const props = {
        target: tempTarget,
        // If the type of the target changes, we need to update tempTarget
        onChange: setTempTarget,
        edit_mode: edit_mode,
        onBlur: triggerEdit,
        onKeyDown: (e: SyntheticEvent<unknown, KeyboardEvent>) => {
            if (e.nativeEvent.code === 'Enter') triggerEdit()
        }
    }

    if (edit_mode && typeof onEdit !== 'function')
        return <PrettyError error={new Error(`onEdit must be a function if edit_mode=true`)} edit_mode={edit_mode} onEdit={onEdit} target={target} />

    if (target._type === 'string') {
        if (props.target._value !== null && typeof props.target._value !== "string")
            return <PrettyError error={new Error(`Pretty -> PrettyString: target._value '${props.target._value}' is not a string`)} target={target} tempTarget={tempTarget} />
        return <PrettyString
            {...props as typeof props & { target: TypeValueNotation & {_value: string|null} }}
            {...childProps as Partial<Omit<TextFieldProps | TypographyProps | CheckboxProps, "onChange">>}
        />
    }
    if (target._type === 'number') {
        if (props.target._value !== null && typeof props.target._value !== "number")
            return <PrettyError error={new Error(`Pretty -> PrettyNumber: target._value '${props.target._value}' is not a number`)} target={target} tempTarget={tempTarget} />
        return <PrettyNumber
            {...props as typeof props & { target: TypeValueNotation & {_value: number|null} }}
            {...childProps as Partial<Omit<TextFieldProps | TypographyProps, "onChange">>}
        />
    }
    if (target._type === 'boolean') {
        if (props.target._value !== null && typeof props.target._value !== "boolean")
            return <PrettyError error={new Error(`Pretty -> PrettyBoolean: target._value '${props.target._value}' is not a boolean`)} target={target} tempTarget={tempTarget} />
        return <PrettyBoolean
            {...props as typeof props & { target: TypeValueNotation & {_value: boolean|null} }}
            onChange={(v) => onEdit && onEdit(v)}
            {...childProps as Partial<Omit<CheckboxProps | SvgIconProps, "onChange">>}
        />
    }

    // These object-based types manipulate the target directly, rather than routing through tempTarget
    if (target._type === 'array') {
        return <PrettyArray
            nest_level={nest_level + 1}
            edit_mode={edit_mode}
            target={target as TypeValueNotation & {_value: TypeValueNotation[]}}
            onEdit={onEdit}
            child_type={lock_child_type_to}
        />
    }
    if (target._type === 'object') {
        return <PrettyObject
            nest_level={nest_level + 1}
            edit_mode={edit_mode}
            onEdit={onEdit}
            target={target as {_type: "object", _value: Record<string, TypeValueNotation>}}
        />
    }
    if (target._type === 'null') {
        return <Typography component="span" variant="overline" {...childProps as TypographyProps}>null</Typography>
    }
    const key = type_as_key(target._type)
    if (typeof target._value !== "string" && target._value !== null) {
        return <PrettyError
            error={new Error(`Prettify: PrettyResource/PrettyAutocomplete value is not a string: ${target._value}`)}
            target={target}
            tempTarget={tempTarget}
        />
    }
    if (is_lookup_key(key)) {
        return <PrettyResource
            target={target as {_type: TypeChangerLookupKey, _value: string}}
            onChange={onEdit ?? (() => {})}
            edit_mode={edit_mode}
            lookup_key={key}
            {...childProps as Partial<Omit<ChipProps,"onChange">>}
        />
    }
    if (is_autocomplete_key(key)) {
        return <PrettyAutocomplete
            target={target as {_type: TypeChangerAutocompleteKey, _value: string}}
            onChange={onEdit ?? (() => {})}
            edit_mode={edit_mode}
            autocomplete_key={key}
            {...childProps as
                (Omit<Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>|TypographyProps>, "onChange">)
            }
        />
    }

    console.error(
        "Prettify failure",
        {target, tempTarget, nest_level, edit_mode, onEdit, lock_child_type_to, ...childProps}
    )
    return <PrettyError error={new Error(`Could not prettify value: ${target._value} of type ${target._type}`)} target={target} />
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
    if (!is_type_changer_supported_tv_notation(props.target))
        throw new Error("Prettify: target._type='null' is not supported")
    return props.edit_mode && props.onEdit && !hide_type_changer?
        <TypeChangeWrapper
            onTypeChange={(nv) => props.onEdit && props.onEdit(nv)}
            target={props.target}
            lock_type={lock_type ?? false}
        >
            {pretty}
        </TypeChangeWrapper> :
        pretty
}
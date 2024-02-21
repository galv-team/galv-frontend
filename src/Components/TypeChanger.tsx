import Tooltip from "@mui/material/Tooltip";
import React, {
    useEffect,
    useState
} from "react";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import AbcIcon from "@mui/icons-material/Abc";
import NumbersIcon from "@mui/icons-material/Numbers";
import DataObjectIcon from "@mui/icons-material/DataObject";
import DataArrayIcon from "@mui/icons-material/DataArray";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import IconButton from "@mui/material/IconButton";
import Popover, {PopoverProps} from "@mui/material/Popover";
import {SvgIconTypeMap} from "@mui/material/SvgIcon";
import clsx from "clsx";
import useStyles from "../styles/UseStyles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
    API_HANDLERS, AutocompleteKey,
    DISPLAY_NAMES, Field, FIELDS,
    ICONS,
    is_autocomplete_key,
    is_lookup_key, key_as_type, LOOKUP_KEYS,
    LookupKey, PATHS
} from "../constants";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {OverridableComponent} from "@mui/material/OverridableComponent";


export type TypeValueNotation = {
    _type: "string"|"number"|"boolean"|"null"|"object"|"array"|TypeChangerLookupKey|TypeChangerAutocompleteKey
    _value: string|number|boolean|null|TypeValueNotation[]|TypeValueNotationWrapper
}
export type TypeValueNotationWrapper = Record<string, TypeValueNotation>
export function is_resource_type(v: unknown): v is TypeChangerLookupKey|TypeChangerAutocompleteKey {
    if (typeof v === 'string') {
        if (v.startsWith('galv_')) {
            const k = v.replace('galv_', '')
            return is_lookup_key(k) || is_autocomplete_key(k)
        }
    }
    return false
}

/**
 * Check if a value is a CustomPropertyWrapper
 * @param v
 * @param strict - if true, _value must be the type declared by _type
 * @param verbose
 */
export function is_type_value_notation_wrapper(v: unknown, strict = false, verbose = false): v is TypeValueNotationWrapper {
    if (v instanceof Object) return Object.values(v).every(x => is_type_value_notation(x, strict, verbose))
    return false
}

/**
 * Check if a value is a CustomProperty
 * @param v
 * @param strict - if true, _value must be the type declared by _type
 * @param verbose
 */
export function is_type_value_notation(v: unknown, strict = false, verbose = false): v is TypeValueNotation {
    if (v instanceof Object) {
        const keys = Object.keys(v)
        if (keys.length === 2 && keys.includes('_type') && keys.includes('_value')) {
            const unknown = v as {_type: unknown, _value: unknown}
            if (typeof unknown._type !== 'string' || unknown._type.length === 0) {
                if (verbose)
                    console.warn(`TypeValueNotation check found {_type, _value} but _type is not a string`, unknown)
                return false
            }
            const _v = unknown as {_type: string, _value: unknown}
            if (_v._value instanceof Array) {
                if (strict && _v._type !== 'array') {
                    if (verbose)
                        console.warn(`TypeValueNotation check found {_type, _value} array but _type is not 'array'`, _v)
                    return false
                }
                const arr = _v as { _type: string, _value: unknown[] }
                return arr._value.every(x => is_type_value_notation(x, strict, verbose))
            }
            if (_v._value instanceof Object) {
                if (strict && _v._type !== 'object') {
                    if (verbose)
                        console.warn(`TypeValueNotation check found {_type, _value} object but _type is not 'object'`, _v)
                    return false
                }
                const obj = _v as {_type: string, _value: Record<string, unknown>}
                if (Object.values(obj._value).every(x => is_type_value_notation(x, strict, verbose)))
                    return true
                console.warn(`TypeValueNotation check found {_type, _value} object but not all _value values are TypeValueNotation`, _v)
                return false
            }
            if (is_resource_type(_v._type)) {
                if (typeof _v._value !== 'string') {
                    if (verbose)
                        console.warn(`TypeValueNotation check found {_type, _value} but _type is a resource type (${_v._type}) and _value is not a string`, _v)
                    return false
                }
                return true
            }
            if (strict) {
                if (['string', 'number', 'boolean'].includes(_v._type)) {
                    if (typeof _v._value !== _v._type) {
                        if (verbose)
                            console.warn(`TypeValueNotation check found {_type, _value} but _value is not of type ${_v._type}`, _v)
                        return false
                    }
                    return true
                }
                if (verbose)
                    console.warn(`TypeValueNotation check found {_type, _value} but _type is not a known type`, _v)
                return false
            }
            if (!['string', 'number', 'boolean'].includes(typeof _v._value) && _v._value !== null) {
                if (verbose)
                    console.warn(`TypeValueNotation check found {_type, _value} but _value is not a known type`, _v)
                return false
            }
            return true
        }
    }
    if (verbose)
        console.warn(`TypeValueNotation check found non-object`, v)
    return false
}

export const is_type_changer_supported_tv_notation = (v: TypeValueNotation): v is TypeValueNotation & {_type: TypeChangerSupportedTypeName} => {
    return v._type !== "null"
}

export const validate_type_value_notation = (v: unknown, allow_wrappers = true): TypeValueNotation|TypeValueNotationWrapper => {
    if (is_type_value_notation(v, true) || (allow_wrappers && is_type_value_notation_wrapper(v, true)))
        return v
    throw new Error(`Invalid TypeValueNotation: ${v}`)
}
export const to_type_value_notation = (v: Serializable, field_info?: Field): TypeValueNotation => {
    if (is_type_value_notation(v)) return v
    // Where field_info is provided, it's a hint to the type of the value
    if (field_info?.type) {
        // Arrays use the field_info.type property to determine the type of their elements
        if (field_info.many)
            return {_type: 'array', _value: (v as Serializable[]).map(x => to_type_value_notation(x, {...field_info, many: false}))}
        // Objects resume automatic type detection
        if (field_info.type === 'object')
            return to_type_value_notation(v)
        // Other types use the field_info.type property to determine the type of the value
        return {_type: field_info.type, _value: v as TypeValueNotation["_value"]}
    }
    if (v instanceof Array) {
        return {
            _type: 'array',
            _value: v.map(x => to_type_value_notation(x))
        }
    }
    if (v instanceof Object) {
        return {
            _type: 'object',
            _value: Object.fromEntries(Object.entries(v).map(([k, v]) => [k, to_type_value_notation(v)]))
        }
    }
    if (["string", "number", "boolean"].includes(typeof v)) {
        return {
            _type: typeof v as "string"|"number"|"boolean",
            _value: v as string|number|boolean
        }
    }
    return {
        _type: "string",
        _value: String(v)
    }
}
export const to_type_value_notation_wrapper = (v: SerializableObject, lookup_key?: LookupKey): TypeValueNotationWrapper => {
    if (is_type_value_notation_wrapper(v)) return v
    if (lookup_key) {
        const fields = FIELDS[lookup_key]
        return Object.fromEntries(Object.entries(v).map(([k, v]) =>
            [k, to_type_value_notation(v, fields[k as keyof typeof fields])]
        ))
    }
    return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, to_type_value_notation(v)]))
}
export const from_type_value_notation =
    (v: TypeValueNotation|TypeValueNotationWrapper): typeof v extends TypeValueNotationWrapper? SerializableObject : Serializable => {
        const wrapper = is_type_value_notation_wrapper(v)
        if (!wrapper && !is_type_value_notation(v)) {
            console.error(`from_type_value_notation`, v)
            throw new Error(`from_type_value_notation: input is not in TypeValue notation`)
        }
        if (wrapper)
            return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, from_type_value_notation(v)]))
        if (v._type === "object" && v._value instanceof Object)
            return Object.fromEntries(Object.entries(v._value).map(([k, v]) => [k, from_type_value_notation(v)]))
        if (v._type === "array" && v._value instanceof Array)
            return v._value.map(from_type_value_notation)
        return v._value
    }

export type Serializable =
    string |
    number |
    boolean |
    TypeValueNotation |
    SerializableObject |
    Serializable[] |
    undefined |
    null

export type SerializableObject = {[key: string]: Serializable}
export type NonNullSerializable = Exclude<Serializable, null|undefined>

export type TypeChangerLookupKey = `galv_${LookupKey}`
export type TypeChangerAutocompleteKey = `galv_${AutocompleteKey}`

export type TypeChangerSupportedTypeName =
    (keyof typeof type_map & string) |
    TypeChangerLookupKey |
    TypeChangerAutocompleteKey

export const type_as_key = (t: TypeChangerSupportedTypeName): AutocompleteKey|LookupKey|undefined => {
    if(t.startsWith('galv_')) {
        const k = t.replace('galv_', '')
        if (is_autocomplete_key(k) || is_lookup_key(k)) return k
        console.error(`Type ${t} starts with galv_ but is not a LookupKey or AutocompleteKey`)
    }
    return undefined
}

const str = (v: TypeValueNotation): {_type: "string", _value: string} => {
    if (["array", "object"].includes(v._type)) return {
        _type: "string",
        _value: JSON.stringify(from_type_value_notation(v))
    }
    return { _type: "string", _value: String(from_type_value_notation(v)) }
}
const num = (v: TypeValueNotation): {_type: "number", _value: number} => {
    const n = Number(v._value)
    if (isNaN(n)) {
        console.warn(`Could not numberify value: ${v._value}`)
        return {_type: "number", _value: 0}
    }
    return {_type: "number", _value: n}
}
const obj = (v: TypeValueNotation): {_type: "object", _value: TypeValueNotationWrapper}  => {
    try {
        if (v._type === "array" && v._value instanceof Array) {
            const o: TypeValueNotationWrapper = {}
            v._value.forEach((vv, i) => o[String(i)] = vv)
            return {_type: "object", _value: o}
        }
        if (v._type === "object" &&
            v._value instanceof Object &&
            is_type_value_notation_wrapper(v._value)
        )
            // The type assertion is purely for TS's benefit - there's no way _value will be 'null' here
            return v._value === null? {_type: "object", _value: {}} : v as {_type: "object", _value: TypeValueNotationWrapper}
        if (v._type === 'string' &&
            typeof v._value === "string" &&
            (v._value.startsWith('{') && v._value.endsWith('}'))
        )
            return {_type: "object", _value: to_type_value_notation_wrapper(JSON.parse(v._value))}
    } catch (e) {
        console.warn(`Could not objectify value: ${v}`, e)
    }
    return {_type: "object", _value: {0: v}}
}
const arr = (v: TypeValueNotation): {_type: "array", _value: TypeValueNotation[]} => {
    try {
        if (v._type === "array" && v._value instanceof Array && is_type_value_notation(v))
            return v as {_type: "array", _value: TypeValueNotation[]}
        if (v._value === null)
            return {_type: "array", _value: []}
        if (v._type === 'object' && v._value instanceof Object && is_type_value_notation_wrapper(v._value))
            return {_type: "array", _value: Object.values(v._value)}
        if (v._type === 'string' &&
            typeof v._value === "string" &&
            (v._value.startsWith('[') && v._value.endsWith(']'))
        )
            return {_type: "array", _value: JSON.parse(v._value).map(to_type_value_notation)}
    } catch (e) {
        console.warn(`Could not arrayify value: ${v}`, e)
    }
    return {_type: "array", _value: [v]}
}

const type_map = {
    string: {
        icon: AbcIcon,
        tooltip: "String"
    },
    number: {
        icon: NumbersIcon,
        tooltip: "Number"
    },
    boolean: {
        icon: PowerSettingsNewIcon,
        tooltip: "Boolean"
    },
    object: {
        icon: DataObjectIcon,
        tooltip: "Object (JSON strings will be parsed)"
    },
    array: {
        icon: DataArrayIcon,
        tooltip: "Array (JSON strings will be parsed)"
    }
} as const

const get_conversion_fun = (type: TypeChangerSupportedTypeName):
    ((v: TypeValueNotation) => TypeValueNotation) => {
    switch (type) {
        case 'string': return str
        case 'number': return num
        case 'boolean': return (v: TypeValueNotation) => ({_type: "boolean", _value: !!v._value})
        case 'object': return obj
        case 'array': return arr
    }
    const key = type_as_key(type)
    if (key) {
        return (v: TypeValueNotation) => {
            const current = str(v)._value
            const page = `${process.env.VITE_GALV_API_BASE_URL}${PATHS[key]}`
            if (current.startsWith(page)) {
                return {_type: type, _value: page}
            }
            // if current looks like a uuid or id, use it
            if (current.match(/^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/) || current.match(/^\d+$/)) {
                return {_type: type, _value: current}
            }
            return {_type: type, _value: ""}
        }
    }
    console.error(`Could not get conversion function for ${type}`, type)
    throw new Error(`Could not get conversion function for ${type}`)
}
export const convert = (value: TypeValueNotation, new_type: TypeChangerSupportedTypeName): TypeValueNotation => {
    const converted_value = get_conversion_fun(new_type)(value)
    console.log(
        `convert`,
        {value, new_type, converted_value}
    )
    return converted_value
}


export type TypeChangerProps = {
    target: TypeValueNotation & {_type: TypeChangerSupportedTypeName}
    // Handler for when the type is changed. Converts _value and sets _type.
    onTypeChange: (newValue: TypeValueNotation) => void
    // If true, the type changer will be disabled
    // If a TypeChangerSupportedTypeName, the type changer will be locked to that type
    // rather than detecting the type from currentValue
    lock_type: boolean
}

export type TypeChangerPopoverProps = {
    value?: TypeChangerSupportedTypeName
    onTypeChange: (newValue: TypeChangerSupportedTypeName) => void
} & PopoverProps

function TypeChangeResourcePopover({onTypeChange, ...props}: TypeChangerPopoverProps) {
    const {classes} = useStyles()
    const value = key_as_type(props.value)
    return <Popover
        className={clsx(classes.typeChangerPopover, classes.typeChangerResourcePopover)}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        {...props}
    >
        <ToggleButtonGroup
            size="small"
            exclusive
            value={props.value}
            onChange={(_, v: TypeChangerSupportedTypeName) => onTypeChange(v)}
        >
            {Object.keys(LOOKUP_KEYS).map((lookup_key) => {
                const ICON = ICONS[lookup_key as keyof typeof ICONS]
                const display = DISPLAY_NAMES[lookup_key as keyof typeof DISPLAY_NAMES]
                const lookup_key_value = key_as_type(lookup_key)
                return <ToggleButton
                    value={lookup_key_value}
                    key={lookup_key_value}
                    selected={value === lookup_key_value}
                    disabled={value === lookup_key_value}
                >
                    <Tooltip title={display} arrow placement="bottom" describeChild={true}>
                        <ICON />
                    </Tooltip>
                </ToggleButton>
            })}
        </ToggleButtonGroup>
    </Popover>
}
function TypeChangePopover({value, onTypeChange, ...props}: TypeChangerPopoverProps) {
    const {classes} = useStyles()
    const [resourcePopoverOpen, setResourcePopoverOpen] = useState(false)
    // useState + useCallback to avoid child popover rendering with a null anchorEl
    const [resourcePopoverAnchorEl, setResourcePopoverAnchorEl] = useState<HTMLElement|null>(null)
    const resourcePopoverAnchorRef = React.useCallback(
        (node: HTMLElement|null) => setResourcePopoverAnchorEl(node),
        []
    )
    // Reopen child popover if value is a resource type
    useEffect(() => {
        if (props.open && value && Object.keys(API_HANDLERS).map(key_as_type).includes(value)) {
            setResourcePopoverOpen(true)
        }
    }, [props.open, value]);

    const get_icon = ({icon}: {icon: OverridableComponent<SvgIconTypeMap> & {muiName: string}}) => {
        const ICON = icon
        return <ICON />
    }

    return <Popover className={clsx(classes.typeChangerPopover)} {...props}>
        <Stack direction="row" alignItems="center" spacing={1} ref={resourcePopoverAnchorRef}>
            <ToggleButtonGroup
                size="small"
                exclusive
                value={value}
                onChange={(_, v: TypeChangerSupportedTypeName) => onTypeChange(v)}
            >
                {Object.entries(type_map).map(([type, ICON]) =>
                    <ToggleButton value={type} key={type} selected={value === type} disabled={value === type}>
                        <Tooltip title={ICON.tooltip} arrow placement="bottom" describeChild={true}>
                            {get_icon(ICON)}
                        </Tooltip>
                    </ToggleButton>)}
            </ToggleButtonGroup>
            <TypeChangeResourcePopover
                {...props}
                value={value}
                onTypeChange={onTypeChange}
                anchorEl={resourcePopoverAnchorEl}
                open={resourcePopoverOpen && !!resourcePopoverAnchorEl}
                onClose={() => setResourcePopoverOpen(false)}
            />
            <IconButton onClick={() => setResourcePopoverOpen(!resourcePopoverOpen)}>
                <Tooltip title="Resource types" arrow placement="bottom" describeChild={true}>
                    <MoreVertIcon />
                </Tooltip>
            </IconButton>
        </Stack>
    </Popover>
}

export default function TypeChanger(
    {target, onTypeChange, lock_type, ...props}: TypeChangerProps & Partial<Omit<TypeChangerPopoverProps, "onTypeChange">>
) {
    const {classes} = useStyles()

    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement|null>(null)
    const value = type_as_key(target._type) || target._type

    return <Tooltip
        key="string"
        title={lock_type? value : <Stack justifyItems="center" alignContent="center">
            <Typography textAlign="center" variant="caption">{value}</Typography>
            <Typography textAlign="center" variant="caption">click to change type</Typography>
        </Stack>}
        arrow
        describeChild
        placement="top"
    >
    <span>
            <TypeChangePopover
                {...props}
                onTypeChange={(t) => {
                    setPopoverAnchor(null)
                    return onTypeChange(convert(target, t))
                }}
                value={value as TypeChangerSupportedTypeName}
                open={!!popoverAnchor}
                anchorEl={popoverAnchor}
                onClose={() => setPopoverAnchor(null)}
            />
            <IconButton
                onClick={(e) => setPopoverAnchor(e.currentTarget || null)}
                disabled={lock_type}
                className={clsx(classes.typeChangerButton)}
            >
                {
                    is_lookup_key(value)?
                        React.createElement(ICONS[value]) :
                        is_autocomplete_key(value)?
                            React.createElement(type_map.string.icon) :
                            React.createElement(type_map[value as keyof typeof type_map].icon)
                }
            </IconButton>
        </span>
    </Tooltip>
}

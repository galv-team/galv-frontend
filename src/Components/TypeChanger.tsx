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
import {build_placeholder_url} from "./misc";
import {
    API_HANDLERS, AutocompleteKey,
    DISPLAY_NAMES,
    ICONS,
    is_autocomplete_key,
    is_lookup_key, LOOKUP_KEYS,
    LookupKey
} from "../constants";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {OverridableComponent} from "@mui/material/OverridableComponent";

const str = (v: Serializable) => {
    try {return JSON.stringify(v)} catch(e) {
        console.warn(`Could not stringify value: ${v}`, e)
        return ""
    }
}
const num = (v: Serializable) => {
    const n = Number(v)
    if (isNaN(n)) {
        console.warn(`Could not numberify value: ${v}`)
        return 0
    }
    return n
}
const obj = (v: Serializable): SerializableObject => {
    try {
        if (v instanceof Array) {
            const o: SerializableObject = {}
            v.forEach((vv, i) => o[String(i)] = vv)
            return o
        }
        if (v instanceof Object) return v
        if (typeof v === 'string' && (v.startsWith('{') && v.endsWith('}')))
            return JSON.parse(v)
    } catch (e) {
        console.warn(`Could not objectify value: ${v}`, e)
    }
    return {0: v}
}
const arr = (v: Serializable, old_type_hint?: TypeChangerSupportedTypeName): Serializable[] => {
    try {
        if (v instanceof Array) return v
        if (v === null) return []
        if (typeof v === 'object') return Object.values(v)
        if (typeof v === 'string' && (v.startsWith('[') && v.endsWith(']')))
            return JSON.parse(v)
    } catch (e) {
        console.warn(`Could not arrayify value: ${v}`, e)
    }
    if (is_resource_type(old_type_hint)) {
        return [{_type: old_type_hint, _value: v}]
    }
    return [v]
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

export type CustomProperty = {
    _type: "string"|"number"|"boolean"|"null"|"object"|"array"|TypeChangerLookupKey|TypeChangerAutocompleteKey
    _value: string|number|boolean|null|CustomProperty[]|Record<string, CustomProperty>
}
export function is_resource_type(v: unknown): v is TypeChangerLookupKey|TypeChangerAutocompleteKey {
    if (typeof v === 'string') {
        if (v.startsWith('galv_')) {
            const k = v.replace('galv_', '')
            return is_lookup_key(k) || is_autocomplete_key(k)
        }
    }
    return false
}

export function is_custom_property(v: unknown, strict = false): v is CustomProperty {
    if (v instanceof Object) {
        const keys = Object.keys(v)
        if (keys.length === 2 && keys.includes('_type') && keys.includes('_value')) {
            const unknown = v as {_type: unknown, _value: unknown}
            if (typeof unknown._type !== 'string' || unknown._type.length === 0) return false
            const _v = unknown as {_type: string, _value: unknown}
            if (_v._value instanceof Array) {
                if (strict && _v._type !== 'array') return false
                const arr = _v as { _type: string, _value: unknown[] }
                return arr._value.every(x => is_custom_property(x, strict))
            }
            if (_v._value instanceof Object) {
                if (strict && _v._type !== 'object') return false
                const obj = _v as {_type: string, _value: Record<string, unknown>}
                if (Object.values(obj._value).every(x => is_custom_property(x, strict)))
                    return true
                console.warn(`CustomProperty check found {_type, _value} object but not all _value values are CustomProperty`, obj._value)
                return false
            }
            if (strict) {
                if (['string', 'number', 'boolean'].includes(_v._type)) return typeof _v._value === _v._type
                // Resource types, always passed by URL
                if (is_resource_type(_v._type)) return typeof _v._value === 'string'
                return false
            }
            return ['string', 'number', 'boolean'].includes(typeof _v._value)
        }
    }
    return false
}
export const validate_custom_property = (v: unknown): CustomProperty => {
    if (is_custom_property(v, true)) return v
    throw new Error(`Invalid CustomProperty: ${v}`)
}
export const to_custom_property = (v: Serializable): CustomProperty => {
    if (is_custom_property(v)) return v
    if (v instanceof Array) {
        return {
            _type: 'array',
            _value: v.map(to_custom_property)
        }
    }
    if (v instanceof Object) {
        return {
            _type: 'object',
            _value: Object.fromEntries(Object.entries(v).map(([k, v]) => [k, to_custom_property(v)]))
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

export type Serializable =
    string |
    number |
    boolean |
    CustomProperty |
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

export type TypeChangerProps = {
    currentValue?: Serializable
    onTypeChange: (newValue: Serializable) => void
    // If true, the type changer will be disabled
    // If a TypeChangerSupportedTypeName, the type changer will be locked to that type
    // rather than detecting the type from currentValue
    lock_type: boolean
    type: TypeChangerSupportedTypeName
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

export const key_as_type = <T,>(k: AutocompleteKey|LookupKey|T): TypeChangerAutocompleteKey|TypeChangerLookupKey|T =>
    (is_autocomplete_key(k) || is_lookup_key(k))? `galv_${k}` : k
export const type_as_key = (t: TypeChangerSupportedTypeName): AutocompleteKey|LookupKey|undefined => {
    if(t.startsWith('galv_')) {
        const k = t.replace('galv_', '')
        if (is_autocomplete_key(k) || is_lookup_key(k)) return k
        console.error(`Type ${t} starts with galv_ but is not a LookupKey or AutocompleteKey`)
    }
    return undefined
}

const get_conversion_fun = (type: TypeChangerSupportedTypeName):
    ((v: Serializable, old_type_hint?: TypeChangerSupportedTypeName) => Serializable) => {
    switch (type) {
        case 'string': return str
        case 'number': return num
        case 'boolean': return (v: unknown) => !!v
        case 'object': return obj
        case 'array': return arr
    }
    const key = type_as_key(type)
    if (key) {
        return (v: Serializable) => {
            const clean = (s: string): string => s.replace(/[^a-zA-Z0-9-_]/g, '')
            const page = key
            const entry = clean(str(v)) || 'new'
            return build_placeholder_url(page, entry)
        }
    }
    console.error(`Could not get conversion function for ${type}`, type)
    throw new Error(`Could not get conversion function for ${type}`)
}
export const convert = (value: Serializable, type: TypeChangerSupportedTypeName): Serializable => {
    const converted_value = get_conversion_fun(type)(
        is_custom_property(value)? value._value : value,
        is_custom_property(value) && value._type !== "null"? value._type : undefined
    )
    console.log(
        `convert`,
        {value, type, converted_value},
        {
            is_custom_property: is_custom_property(value),
            is_valid_custom_property: is_custom_property(value, true),
            converted_as_custom_property: to_custom_property(converted_value),
            is_valid_custom_property_after_conversion: is_custom_property(to_custom_property(converted_value), true)
        }
    )
    return is_custom_property(value)? to_custom_property(converted_value) : converted_value
}

export default function TypeChanger(
    {currentValue, onTypeChange, lock_type, type, ...props}: TypeChangerProps & Partial<TypeChangerPopoverProps>
) {
    const {classes} = useStyles()

    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement|null>(null)
    const value = type_as_key(type) || type

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
                    return onTypeChange(convert(currentValue, t))
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

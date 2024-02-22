import Tooltip from "@mui/material/Tooltip";
import React, {useEffect, useState} from "react";
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
import useStyles from "../../styles/UseStyles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
    API_HANDLERS,
    AutocompleteKey,
    DISPLAY_NAMES,
    ICONS,
    is_autocomplete_key,
    is_lookup_key,
    key_to_type,
    LOOKUP_KEYS,
    LookupKey,
    PATHS,
    type_to_key
} from "../../constants";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {OverridableComponent} from "@mui/material/OverridableComponent";
import {
    from_type_value_notation,
    is_tvn,
    is_tvn_wrapper,
    to_type_value_notation,
    to_type_value_notation_wrapper,
    TypeValueNotation,
    TypeValueNotationWrapper
} from "../TypeValueNotation";


export const is_type_changer_supported_tv_notation = (v: TypeValueNotation): v is TypeValueNotation & {_type: TypeChangerSupportedTypeName} => {
    return v._type !== "null"
}

export type TypeChangerLookupKey = `galv_${LookupKey}`
export type TypeChangerAutocompleteKey = `galv_${AutocompleteKey}`

export type TypeChangerSupportedTypeName =
    (keyof typeof type_map & string) |
    TypeChangerLookupKey |
    TypeChangerAutocompleteKey

const str = (v: TypeValueNotation): {_type: "string", _value: string} => {
    if (["array", "object"].includes(v._type)) return {
        _type: "string",
        _value: JSON.stringify(from_type_value_notation(v))
    }
    return { _type: "string", _value: String(from_type_value_notation(v)) }
}
const num = (v: TypeValueNotation): {_type: "number", _value: number|null} => {
    const n = Number(v._value)
    return isNaN(n)? {_type: "number", _value: null} : {_type: "number", _value: n}
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
            is_tvn_wrapper(v._value)
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
        if (v._type === "array" && v._value instanceof Array && is_tvn(v))
            return v as {_type: "array", _value: TypeValueNotation[]}
        if (v._value === null)
            return {_type: "array", _value: []}
        if (v._type === 'object' && v._value instanceof Object && is_tvn_wrapper(v._value))
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
    const key = type_to_key(type)
    if (key) {
        return (v: TypeValueNotation) => {
            const current = str(v)._value
            const page = `${process.env.VITE_GALV_API_BASE_URL}${PATHS[key]}`
            if (current.startsWith(page)) {
                return {_type: type, _value: page}
            }
            // if current looks like a uuid or id, use it
            if (current.match(/^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/) || current.match(/^\d+$/)) {
                return {_type: type, _value: `${page}/${current}`}
            }
            return {_type: type, _value: null}
        }
    }
    console.error(`Could not get conversion function for ${type}`, type)
    throw new Error(`Could not get conversion function for ${type}`)
}
export const convert = (value: TypeValueNotation, new_type: TypeChangerSupportedTypeName): TypeValueNotation => {
    if (value._value === null) return {_type: new_type, _value: null}
    return get_conversion_fun(new_type)(value)
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
    const value = key_to_type(props.value)
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
                const lookup_key_value = key_to_type(lookup_key)
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
        if (props.open && value && Object.keys(API_HANDLERS).map(key_to_type).includes(value)) {
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
    const value = type_to_key(target._type) || target._type

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

import TableContainer, {TableContainerProps} from "@mui/material/TableContainer";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Prettify, {PrettyError} from "./Prettify";
import {
    TypeChangerSupportedTypeName
} from "./TypeChanger";
import {
    API_HANDLERS,
    API_SLUGS,
    Field,
    FIELDS,
    LOOKUP_KEYS,
    LookupKey,
    PRIORITY_LEVELS,
    SerializableObject
} from "../../constants";
import {AxiosError, AxiosResponse} from "axios";
import {useQuery} from "@tanstack/react-query";
import {BaseResource} from "../ResourceCard";
import {AccessLevelsApi, Configuration, PermittedAccessLevels}from "@battery-intelligence-lab/galv";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import {useCurrentUser} from "../CurrentUserContext";
import {useState} from "react";
import {
    is_tvn_wrapper,
    to_type_value_notation_wrapper, TypeValueNotation,
    TypeValueNotationWrapper
} from "../TypeValueNotation";

export type AccessLevels = Partial<{[key in keyof PermittedAccessLevels]: { _type: "number", _value: number }}>

export type PermissionsTableProps = {
    permissions: AccessLevels
    query: ReturnType<typeof useQuery<AxiosResponse>>
    edit_fun_factory?: (key: string) => (value: TypeValueNotation) => TypeValueNotation|void
    is_path?: boolean
}

export type PrettyObjectProps<T extends TypeValueNotation|TypeValueNotationWrapper = TypeValueNotation> = {
    target?: T
    lookup_key?: LookupKey
    nest_level?: number
    edit_mode?: boolean
    creating?: boolean
    extractPermissions?: boolean  // Extract *_access_level properties; defaults to nest_level == 0
    onEdit?: (value: T) => void
    canEditKeys?: boolean
}

export function PermissionsTable({permissions, query, edit_fun_factory, is_path}: PermissionsTableProps) {
    const {classes} = useStyles()
    // Hack to handle paths having different access level requirements
    const query_data = {...query.data?.data}
    if (is_path && query_data) {
        query_data["edit_access_level"] = query_data["path.edit_access_level"]
    }
    return <>
        {Object.keys(permissions).length > 0 && <TableContainer
            className={clsx(
                classes.prettyTable,
                classes.prettyNested,
                // classes.prettyPermissions,
            )}
        >
            <Table size="small">
                <TableBody>
                    {Object.entries(permissions).map(([k, v], i) => (
                        <TableRow key={i}>
                            <TableCell component="th" scope="row" key={`key_${i}`} align="right">
                                <Stack alignItems="stretch" justifyContent="flex-end">
                                    <Typography variant="subtitle2" component="span" textAlign="right">
                                        {k}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell key={`value_${i}`} align="left">
                                <Stack alignItems="stretch" justifyContent="flex-start">
                                    <Select
                                        value={v._value}
                                        disabled={edit_fun_factory === undefined}
                                        onChange={(e) => {
                                            edit_fun_factory &&
                                            edit_fun_factory(k)({_type: "number", _value: e.target.value})
                                        }}
                                    >
                                        {Object.entries(query_data[k as keyof PermittedAccessLevels] || {})
                                            .map(([k, v], i) => (<MenuItem key={i} value={v as number}>{k}</MenuItem>))}
                                    </Select>
                                </Stack>
                            </TableCell>
                        </TableRow>))}
                </TableBody>
            </Table>
        </TableContainer>}
    </>
}

function rename_key_in_place(
    obj: TypeValueNotationWrapper,
    old_key: string,
    new_key: string
) {
    const new_obj: typeof obj = {}
    Object.entries(obj).forEach(([k, v]) => {
        if (k === old_key) {
            if (new_key !== "")
                new_obj[new_key] = v
        } else new_obj[k] = v
    })
    return new_obj
}

export type PrettyObjectFromQueryProps = {
    resource_id: string|number,
    lookup_key: LookupKey,
    filter?: (d: SerializableObject, lookup_key: LookupKey) => SerializableObject
} & Omit<PrettyObjectProps<TypeValueNotationWrapper>, "target">

export function PrettyObjectFromQuery<T extends BaseResource>(
    { resource_id, lookup_key, filter, ...prettyObjectProps}: PrettyObjectFromQueryProps
) {
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const target_api_handler = new API_HANDLERS[lookup_key](config)
    const target_get = target_api_handler[
        `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof target_api_handler
        ] as (id: string) => Promise<AxiosResponse<T>>

    const target_query = useQuery<AxiosResponse<T>, AxiosError>({
        queryKey: [lookup_key, resource_id],
        queryFn: () => target_get.bind(target_api_handler)(String(resource_id))
    })

    const target_after_filter = filter?
        filter(target_query.data?.data ?? {}, lookup_key) :
        target_query.data?.data

    return <PrettyObject<TypeValueNotationWrapper>
        {...prettyObjectProps}
        lookup_key={lookup_key}
        target={to_type_value_notation_wrapper(target_after_filter ?? {}, lookup_key)}
    />
}

export default function PrettyObject<
    T extends {_type: "object", _value: TypeValueNotationWrapper} | TypeValueNotationWrapper
        = {_type: "object", _value: TypeValueNotationWrapper}
>(
    {target, lookup_key, nest_level, edit_mode, creating, onEdit, extractPermissions, canEditKeys, ...table_props}:
        PrettyObjectProps<T> & TableContainerProps) {

    const {classes} = useStyles()

    const [newKeyUpdateCount, setNewKeyUpdateCount] = useState(0)

    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const permissions_query = useQuery<AxiosResponse<PermittedAccessLevels>, AxiosError>({
        queryKey: ["access_levels"],
        queryFn: () => new AccessLevelsApi(config).accessLevelsRetrieve()
    })

    if (typeof target === 'undefined') {
        return <PrettyError
            error={new Error("PrettyObject: target is undefined")}
            details={{target, lookup_key, nest_level, edit_mode, creating, onEdit, ...table_props}}
        />
    }

    // Type coercion for optional props
    const _target = target || {}  // for tsLint
    const is_wrapper = is_tvn_wrapper(_target)
    const _value = (is_wrapper? _target : _target._value) ?? {}
    const _edit_mode = edit_mode || false
    const _onEdit = onEdit?
        (values: TypeValueNotationWrapper) => is_wrapper? onEdit(values as T) :
            onEdit({_type: "object", _value: values} as T) :
        (() => {})
    const _nest_level = nest_level || 0
    const _extractPermissions = extractPermissions || _nest_level === 0
    const _canEditKeys = canEditKeys || _nest_level !== 0

    const get_metadata = (key: string) => {
        if (lookup_key !== undefined && _nest_level === 0 && !_canEditKeys) {
            const fields = FIELDS[lookup_key]
            if (Object.keys(fields).includes(key))
                return {...FIELDS[lookup_key][key as keyof typeof fields] as Field, lock_type: true}
        }
    }
    const is_readonly = (key: string) => get_metadata(key)?.readonly && (!creating || !get_metadata(key)?.createonly)

    // Edit function factory produces a function that edits the object with a new value for key k
    const edit_fun_factory = (k: string) => (v: TypeValueNotation) => _onEdit({..._value, [k]: v})

    // Build a list of Prettify'd contents
    const base_keys = Object.keys(_value)
        .filter(key => get_metadata(key)?.priority !== PRIORITY_LEVELS.HIDDEN)
    let keys = base_keys;
    let permissions_keys: typeof base_keys = [];
    const permissions: AccessLevels = {};
    if (_extractPermissions && permissions_query.data?.data) {
        permissions_keys = base_keys.filter(key => Object.keys(permissions_query.data?.data).includes(key))
        // Include values from _target in permissions
        for (const key of permissions_keys) {
            const existing_permission = _value[key]
            permissions[key as keyof PermittedAccessLevels] = existing_permission as { _type: "number", _value: number }
        }
        keys = base_keys.filter(key => !Object.keys(permissions_query.data?.data).includes(key))
    }

    const get_child_type = (key: string): TypeChangerSupportedTypeName|undefined => {
        const metadata = get_metadata(key)
        if (metadata && metadata.many)
            return metadata.type
        return undefined
    }

    return <>
        <PermissionsTable
            permissions={permissions}
            query={permissions_query}
            edit_fun_factory={_edit_mode? edit_fun_factory : undefined}
            is_path={lookup_key === LOOKUP_KEYS.PATH}
        />
        <TableContainer
            className={clsx(
                classes.prettyTable,
                {[classes.prettyNested]: _nest_level % 2, edit_mode: _edit_mode},
            )}
            {...table_props as TableContainerProps}
        >
            <Table size="small">
                <TableBody>
                    {keys.map((key, i) => {
                        return <TableRow key={i}>
                            <TableCell component="th" scope="row" key={`key_${i}`} align="right">
                                <Stack alignItems="stretch" justifyContent="flex-end">
                                    {_canEditKeys && _edit_mode && onEdit && !is_readonly(key) ?
                                        <Prettify
                                            nest_level={_nest_level}
                                            edit_mode={true}
                                            create_mode={!!creating}
                                            hide_type_changer={true}
                                            onEdit={(new_key) => {
                                                // Rename key (or delete if new_key is empty)
                                                let new_key_str: string
                                                try {
                                                    new_key_str = String(new_key._value)
                                                } catch (e) {
                                                    new_key_str = ""
                                                }
                                                _onEdit(rename_key_in_place(_value, key, new_key_str))
                                            }}
                                            target={{_type: "string", _value: key}}
                                            type="string"
                                            label="key"
                                            fullWidth={true}
                                        /> :
                                        <Typography variant="subtitle2" component="span" textAlign="right">
                                            {key}
                                        </Typography>
                                    }
                                </Stack>
                            </TableCell>
                            <TableCell key={`value_${i}`} align="left">
                                <Stack alignItems="stretch" justifyContent="flex-start">
                                    <Prettify
                                        nest_level={_nest_level}
                                        edit_mode={_edit_mode}
                                        create_mode={!!creating}
                                        onEdit={edit_fun_factory(key)}
                                        target={_value[key]}
                                        lock_type={get_metadata(key)?.lock_type}
                                        lock_child_type_to={get_child_type(key)}
                                    />
                                </Stack>
                            </TableCell>
                        </TableRow>})}
                    {_canEditKeys && _edit_mode && <TableRow key="add_new">
                        <TableCell component="th" scope="row" key="add_key" align="right">
                            <Prettify
                                key={`add_key_${newKeyUpdateCount}`}
                                nest_level={_nest_level}
                                edit_mode={_edit_mode}
                                create_mode={!!creating}
                                hide_type_changer={true}
                                target={{_type: "string", _value: ""}}
                                placeholder="new_object_key"
                                label="+ KEY"
                                multiline={false}
                                onEdit={(new_key: TypeValueNotation) => {
                                    // Add new key
                                    let new_key_str: string
                                    try {new_key_str = String(new_key._value)} catch (e) {return}
                                    const new_obj = {..._value}
                                    if (new_key_str !== "")
                                        new_obj[new_key_str] = {_type: "string", _value: ""}
                                    _onEdit!(new_obj)
                                    setNewKeyUpdateCount(newKeyUpdateCount + 1)
                                    return
                                }}
                            />
                        </TableCell>
                        <TableCell key="add_value">
                            <em>Enter a new key then click here to create a new entry</em>
                        </TableCell>
                    </TableRow>}
                </TableBody>
            </Table>
        </TableContainer>
    </>
}

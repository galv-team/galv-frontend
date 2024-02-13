import TableContainer, {TableContainerProps} from "@mui/material/TableContainer";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Prettify from "./Prettify";
import {SerializableObject, Serializable} from "../TypeChanger";
import {API_HANDLERS, API_SLUGS, Field, FIELDS, LOOKUP_KEYS, LookupKey, PRIORITY_LEVELS} from "../../constants";
import {AxiosError, AxiosResponse} from "axios";
import {useQuery} from "@tanstack/react-query";
import {BaseResource} from "../ResourceCard";
import {AccessLevelsApi, Configuration, PermittedAccessLevels}from "@battery-intelligence-lab/galv";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import {useCurrentUser} from "../CurrentUserContext";

export type AccessLevels = Partial<{[key in keyof PermittedAccessLevels]: Serializable}>

export type PermissionsTableProps = {
    permissions: AccessLevels
    query: ReturnType<typeof useQuery<AxiosResponse>>
    edit_fun_factory?: (key: string) => (value: Serializable) => Serializable|void
    is_path?: boolean
}

export type PrettyObjectProps = {
    target?: SerializableObject
    lookup_key?: LookupKey
    nest_level?: number
    edit_mode?: boolean
    creating?: boolean
    extractPermissions?: boolean  // Extract *_access_level properties; defaults to nest_level == 0
    onEdit?: (value: SerializableObject) => void
    allowNewKeys?: boolean
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
                                        value={v}
                                        disabled={edit_fun_factory === undefined}
                                        onChange={(e) => {
                                            edit_fun_factory && edit_fun_factory(k)(e.target.value)
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
    obj: SerializableObject,
    old_key: string,
    new_key: string
): SerializableObject {
    const new_obj: PrettyObjectProps["target"] = {}
    Object.entries(obj).forEach(([k, v]) => {
        if (k === old_key) {
            if (new_key !== "")
                new_obj[new_key] = v
        } else new_obj[k] = v
    })
    return new_obj
}

export function PrettyObjectFromQuery<T extends BaseResource>(
    { resource_id, lookup_key, filter, ...prettyObjectProps}:
        {
            resource_id: string|number,
            lookup_key: LookupKey,
            filter?: (d: SerializableObject, lookup_key: LookupKey) => SerializableObject
        } & Omit<PrettyObjectProps, "target">
) {
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const target_api_handler = new API_HANDLERS[lookup_key](config)
    const target_get = target_api_handler[
        `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof target_api_handler
        ] as (uuid: string) => Promise<AxiosResponse<T>>

    const target_query = useQuery<AxiosResponse<T>, AxiosError>({
        queryKey: [lookup_key, resource_id],
        queryFn: () => target_get.bind(target_api_handler)(String(resource_id))
    })

    return <PrettyObject
        {...prettyObjectProps}
        target={filter? filter(target_query.data?.data ?? {}, lookup_key) : target_query.data?.data}
    />
}

export default function PrettyObject(
    {target, lookup_key, nest_level, edit_mode, creating, onEdit, extractPermissions, allowNewKeys, ...table_props}:
        PrettyObjectProps & TableContainerProps) {

    const {classes} = useStyles()
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const permissions_query = useQuery<AxiosResponse<PermittedAccessLevels>, AxiosError>({
        queryKey: ["access_levels"],
        queryFn: () => new AccessLevelsApi(config).accessLevelsRetrieve()
    })

    if (typeof target === 'undefined') {
        console.error("PrettyObject: target is undefined", {target, lookup_key, nest_level, edit_mode, creating, onEdit, ...table_props})
        return <></>
    }

    // Type coercion for optional props
    const _target = target || {}  // for tsLint
    const _edit_mode = edit_mode || false
    const _onEdit = onEdit || (() => {})
    const _nest_level = nest_level || 0
    const _extractPermissions = extractPermissions || _nest_level === 0
    const _allowNewKeys = allowNewKeys || _nest_level !== 0

    const get_metadata = (key: string) => {
        if (lookup_key !== undefined && _nest_level === 0 && !_allowNewKeys) {
            const fields = FIELDS[lookup_key]
            if (Object.keys(fields).includes(key))
                return FIELDS[lookup_key][key as keyof typeof fields] as Field
        }
        return undefined
    }
    const is_readonly = (key: string) => get_metadata(key)?.readonly && (!creating || !get_metadata(key)?.createonly)

    // Edit function factory produces a function that edits the object with a new value for key k
    const edit_fun_factory = (k: string) => (v: Serializable) => _onEdit({..._target, [k]: v})

    // Build a list of Prettify'd contents
    const base_keys = Object.keys(_target).filter(key => get_metadata(key)?.priority !== PRIORITY_LEVELS.HIDDEN)
    let keys = base_keys;
    let permissions_keys: typeof base_keys = [];
    const permissions: AccessLevels = {};
    if (_extractPermissions && permissions_query.data?.data) {
        permissions_keys = base_keys.filter(key => Object.keys(permissions_query.data?.data).includes(key))
        // Include values from _target in permissions
        for (const key of permissions_keys) {
            permissions[key as keyof PermittedAccessLevels] = _target[key]
        }
        keys = base_keys.filter(key => !Object.keys(permissions_query.data?.data).includes(key))
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
                                    {_edit_mode && onEdit && !is_readonly(key) ?
                                        <Prettify
                                            nest_level={_nest_level}
                                            edit_mode={true}
                                            hide_type_changer={true}
                                            onEdit={(new_key) => {
                                                // Rename key (or delete if new_key is empty)
                                                try {
                                                    new_key = String(new_key)
                                                } catch (e) {
                                                    new_key = ""
                                                }
                                                _onEdit(rename_key_in_place(_target, key, new_key))
                                            }}
                                            target={key}
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
                                        onEdit={edit_fun_factory(key)}
                                        target={_target[key]}
                                        lock_type_to={get_metadata(key)?.many ? "array" : get_metadata(key)?.type}
                                        lock_child_type_to={get_metadata(key)?.many ? get_metadata(key)?.type : undefined}
                                    />
                                </Stack>
                            </TableCell>
                        </TableRow>})}
                    {_edit_mode && _allowNewKeys && <TableRow key="add_new">
                        <TableCell component="th" scope="row" key="add_key" align="right">
                            <Prettify
                                nest_level={_nest_level}
                                edit_mode={_edit_mode}
                                hide_type_changer={true}
                                target=""
                                placeholder="new_object_key"
                                label="+ KEY"
                                multiline={false}
                                onEdit={(new_key: Serializable) => {
                                    // Add new key
                                    try {new_key = String(new_key)} catch (e) {return ""}
                                    const new_obj = {..._target}
                                    if (new_key !== "")
                                        new_obj[new_key] = ""
                                    _onEdit!(new_obj)
                                    return ""
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

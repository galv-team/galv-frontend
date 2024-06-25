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
import {AccessLevelsApi, PermittedAccessLevels} from "@galv/galv";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import {useCurrentUser} from "../CurrentUserContext";
import {useState} from "react";
import {
    is_tvn_wrapper,
    to_type_value_notation_wrapper, TypeValueNotation,
    TypeValueNotationWrapper
} from "../TypeValueNotation";
import Tooltip from "@mui/material/Tooltip";
import {FieldDescription, useFetchResource} from "../FetchResourceContext";

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
    const {api_config} = useCurrentUser()
    const target_api_handler = new API_HANDLERS[lookup_key](api_config)
    const target_get = target_api_handler[
        `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof target_api_handler
        ] as (id: {id: string}) => Promise<AxiosResponse<T>>

    const target_query = useQuery<AxiosResponse<T>, AxiosError>({
        queryKey: [lookup_key, resource_id],
        queryFn: () => target_get.bind(target_api_handler)({id: String(resource_id)})
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

export type AnnotatedKeyProps = {
    metadata: FieldDescription
    key_name: string
    create_mode?: boolean
}

export function AnnotatedKey({metadata, key_name, create_mode}: AnnotatedKeyProps) {
    const help_text = <>
        {metadata.help_text}
        {
            (create_mode && metadata.create_only || metadata.required)?
                " [Required]" :
                metadata.read_only? " [Read-only]" :
                    ""
        }
    </>
    return <Tooltip title={help_text} placement="top-start">
        <Typography variant="subtitle2" component="span" textAlign="right">
            {(metadata.required || (metadata.create_only && create_mode)) && "*"}{key_name}
        </Typography>
    </Tooltip>
}

export function ChoiceSelect({choices, edit_fun_factory, value}: {
    choices: Record<string, string|number>|null,
    edit_fun_factory: (value: TypeValueNotation) => TypeValueNotation|void,
    value: TypeValueNotation
}) {
    if (!choices)
        return <Typography variant="subtitle2" component="span" textAlign="right" color="error">No choices</Typography>
    return <Select
        value={value._value ?? Object.values(choices)[0]}
        onChange={(e) => {
            edit_fun_factory({_type: "string", _value: e.target.value})
        }}
    >
        {Object.entries(choices).map(([k, v], i) => (<MenuItem key={i} value={k}>{v}</MenuItem>))}
    </Select>
}

export default function PrettyObject<
    T extends {_type: "object", _value: TypeValueNotationWrapper} | TypeValueNotationWrapper
        = {_type: "object", _value: TypeValueNotationWrapper}
>(
    {target, lookup_key, nest_level, edit_mode, creating, onEdit, extractPermissions, canEditKeys, ...table_props}:
        PrettyObjectProps<T> & TableContainerProps) {

    const {classes} = useStyles()

    const [newKeyUpdateCount, setNewKeyUpdateCount] = useState(0)

    const {api_config} = useCurrentUser()
    const {useDescribeQuery} = useFetchResource()
    const permissions_query = useQuery<AxiosResponse<PermittedAccessLevels>, AxiosError>({
        queryKey: ["access_levels"],
        queryFn: () => new AccessLevelsApi(api_config).accessLevelsRetrieve()
    })
    const description_query = useDescribeQuery(lookup_key)

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

    // TODO: eventually remove our own metadata and use the API's
    const get_metadata: (key: string) => FieldDescription & Field & {api_type: FieldDescription["type"], lock_type?: boolean} =
        (key: string) => {
            let obj = {} as FieldDescription & Field & {api_type: FieldDescription["type"], lock_type?: boolean}
            if (lookup_key !== undefined && _nest_level === 0 && !_canEditKeys) {
                const fields = FIELDS[lookup_key]
                if (Object.keys(fields).includes(key))
                    // ...obj just suppresses type errors
                    obj = {...obj, ...FIELDS[lookup_key][key as keyof typeof fields] as Field, lock_type: true}
            }
            if (description_query.data?.data && Object.keys(description_query.data?.data).includes(key))
                obj = {
                    ...description_query.data?.data[key],
                    ...obj,
                    api_type: description_query.data?.data[key].type,
                    lock_type: true
                }
            return obj
        }

    const is_read_only = (key: string) => get_metadata(key)?.read_only && (!creating || !get_metadata(key)?.create_only)

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
    // TODO: replace this permissions hack when we move to API-lead metadata
    if (Object.keys(permissions).length === 0 && creating) {
        const access_level_keys = [
            "read_access_level", "edit_access_level", "delete_access_level"
        ]
        for (const key of access_level_keys) {
            if (get_metadata(key)) {
                let v = _value[key]?._value
                if (v === undefined) {
                    v = Number(get_metadata(key).default)
                    if (isNaN(v)) {
                        v = ''
                    }
                }

                permissions[key as keyof PermittedAccessLevels] = {
                    _type: "number",
                    _value: v as number
                }
            }
        }
    }

    const get_child_type = (key: string): TypeChangerSupportedTypeName|undefined => {
        const metadata = get_metadata(key)
        if (metadata && metadata.many)
            return metadata.type as TypeChangerSupportedTypeName|undefined
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
                                    {_canEditKeys && _edit_mode && onEdit && !is_read_only(key) ?
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
                                        // If this is a key we recognise from the API, show any help text we may have
                                        get_metadata(key)?
                                            <AnnotatedKey metadata={get_metadata(key)} key_name={key} create_mode={!!creating}/>:
                                            // Otherwise, just show the key
                                            <Typography variant="subtitle2" component="span" textAlign="right">
                                                {key}
                                            </Typography>
                                    }
                                </Stack>
                            </TableCell>
                            <TableCell key={`value_${i}`} align="left">
                                <Stack alignItems="stretch" justifyContent="flex-start">
                                    {get_metadata(key).api_type === 'choice'?
                                        <ChoiceSelect
                                            choices={get_metadata(key).choices}
                                            edit_fun_factory={edit_fun_factory(key)}
                                            value={_value[key] ?? get_metadata(key).default}
                                        /> :
                                        <Prettify
                                            nest_level={_nest_level}
                                            edit_mode={_edit_mode}
                                            create_mode={!!creating}
                                            onEdit={edit_fun_factory(key)}
                                            target={_value[key]}
                                            lock_type={get_metadata(key)?.lock_type}
                                            lock_child_type_to={get_child_type(key)}
                                        />
                                    }
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

import {ICONS, key_to_type, LOOKUP_KEYS, PATHS} from "../constants";
import React, {useState} from "react";
import Stack from "@mui/material/Stack";
import ApiResourceContextProvider, {useApiResource} from "./ApiResourceContext";
import Button from "@mui/material/Button";
import {useNavigate, useParams} from "react-router-dom";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";
import ErrorCard from "./error/ErrorCard";
import Avatar from "@mui/material/Avatar";
import ErrorBoundary from "./ErrorBoundary";
import clsx from "clsx";
import useStyles from "../styles/UseStyles";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import QueryWrapper from "./QueryWrapper";
import Skeleton from "@mui/material/Skeleton";
import TableBody from "@mui/material/TableBody";
import {ResourceChip} from "./ResourceChip";
import {useFetchResource} from "./FetchResourceContext";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import {ResourceCreator} from "./ResourceCreator";
import UndoRedoProvider from "./UndoRedoContext";
import Modal from "@mui/material/Modal";
import ListItemIcon from "@mui/material/ListItemIcon";
import TextField from "@mui/material/TextField";
import FilledInput from "@mui/material/FilledInput";
import {BaseResource, Permissions} from "./ResourceCard";
import PrettyResource from "./prettify/PrettyResource";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import {to_type_value_notation_wrapper, TypeValueNotation, TypeValueNotationWrapper} from "./TypeValueNotation";
import PrettyObject from "./prettify/PrettyObject";
import {Theme} from "@mui/material/styles";

type ColumnType = {
    url: string,
    id: number,
    name: string,
    description: string,
    data_type: "bool"|"float"|"int"|"str"|"datetime64[ns]",
    is_default: boolean,
    is_required: boolean
}
type ObservedFile = BaseResource & {
    id: string
    summary: Record<string, Record<string, string|number>>
    applicable_mappings: DB_MappingResource[]
    mapping?: string
}

type MapEntry = {
    name?: string,
    addition?: number,
    multiplier?: number,
    column_type: ColumnType
}
type Map = Record<string, MapEntry>
type MappingResource = {
    id: string
    url: string
    name: string
    is_valid: boolean
    in_use?: boolean
    map: Map
    missing?: number
    team: string|null
    permissions?: Permissions
    read_access_level?: number
    edit_access_level?: number
    delete_access_level?: number
}

// A Map but the column_type is an id, as stored in the database
type DB_MapEntry = {column_type: number} & Omit<MapEntry, "column_type">
type DB_Map = Record<string, DB_MapEntry>
type DB_MappingResource = Omit<MappingResource, "map"> & {map: DB_Map}

const col_id_to_col = (col_id: number, columns: ColumnType[]) => columns.find(c => c.id === col_id)

const db_map_to_map = (db_map: DB_MappingResource, columns: ColumnType[]): MappingResource => {
    if (!db_map.map) return {...db_map, map: {}}
    return {
        ...db_map,
        map: Object.fromEntries(
            Object.entries(db_map.map)
                .map(([k, v]) => {
                    const col = col_id_to_col(v.column_type, columns)
                    if (!col) {
                        console.warn(`Column ${v.column_type} not found in columns`, columns)
                        return [null, null]
                    }
                    return [k, {...v, column_type: col}]
                })
                .filter((v) => v[0] !== null)
        )
    }
}
const map_to_db_map = (mapping: MappingResource): DB_MappingResource => {
    return {
        ...mapping,
        map: Object.fromEntries(
            Object.entries(mapping.map).map(([k, v]) => {
                return [k, {...v, column_type: v.column_type.id}]
            })
        )
    }
}

const convert = (v: (string|number|boolean)[], map: MapEntry) => {
    if (!map.column_type) return v;
    const rescale = (val: number) => (val + (map.addition ?? 0)) * (map.multiplier ?? 1)
    switch(map.column_type.data_type) {
        case "bool":
            return v.map((val) => val === "true" || val === true || val === 1)
        case "float":
            return v.map((val) => rescale(parseFloat(String(val))))
        case "int":
            return v.map((val) => rescale(parseInt(String(val))))
        case "str":
            return v.map((val) => String(val))
        case "datetime64[ns]":
            return v.map((val) => new Date(String(val)))
    }
    throw new Error(`Unknown type ${map.column_type.data_type}`)
}

function CreateColumnType(
    {onCreate, open, setOpen}:
        {
            onCreate: (new_resource_url?: string) => void,
            open: boolean,
            setOpen: (o: boolean) => void
        }
) {
    return <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby={'create-column-type-title'}
        sx={{padding: (t) => t.spacing(4)}}
    >
        <>
            <UndoRedoProvider>
                <ResourceCreator<ColumnType>
                    onCreate={(new_resource_url) => {
                        setOpen(false)
                        onCreate(new_resource_url)
                    }}
                    onDiscard={() => setOpen(false)}
                    lookup_key={LOOKUP_KEYS.COLUMN_FAMILY}
                />
            </UndoRedoProvider>
        </>
    </Modal>
}

function SelectColumnType(
    {selected_id, setSelected, reset_name}:
        {selected_id: number|null, setSelected: (s?: ColumnType) => void, reset_name: string}
) {
    const {useListQuery} = useFetchResource()
    const {results} = useListQuery<ColumnType>(LOOKUP_KEYS.COLUMN_FAMILY)
    const {classes} = useStyles();
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Sort the ColumnType array
    const sortedData = results?.sort((a, b) => {
        if (a.is_required && !b.is_required) return -1;
        if (!a.is_required && b.is_required) return 1;
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return a.name.localeCompare(b.name);
    });

    return <>
        <CreateColumnType
            open={createModalOpen}
            setOpen={setCreateModalOpen}
            onCreate={(new_resource_url) => {
                setCreateModalOpen(false)
                if (new_resource_url) {
                    const ct = results?.find((ct) => ct.url === new_resource_url)
                    setSelected(ct)
                }
            }}
        />
        <Select
            value={selected_id ?? ''}
            onChange={(event) => {
                if (typeof event.target.value !== "number" || !sortedData)
                    return setSelected(undefined)
                const ct = sortedData.find((ct) => ct.id === event.target.value)
                setSelected(ct)
            }}
        >
            {selected_id !== null &&
                <MenuItem value={'reset'} className={clsx(classes.mappingResetColumn)}>
                    <ListItemText primary={`Reset ${reset_name}`} />
                </MenuItem>
            }
            {!!sortedData && sortedData.map((item) => (
                <MenuItem
                    key={item.url}
                    value={item.id}
                    className={clsx({
                        [classes.mappingRequiredColumn]: item.is_required,
                        [classes.mappingDefaultColumn]: item.is_default
                    })}
                >
                    <Tooltip title={`
                    ${item.is_required? "[Required]" : ""} ${item.is_default? "[Default]" : ""}
                    ${item.description}
                    `}>
                        <ListItemText primary={item.name} />
                    </Tooltip>
                </MenuItem>
            ))}
            <MenuItem
                key={'new'}
                value={undefined}
                onClick={() => setCreateModalOpen(true)}
            >
                <ListItemIcon><ICONS.CREATE /></ListItemIcon>
                <ListItemText primary="New column type" />
            </MenuItem>
        </Select>
    </>
}

function MappingTable(
    {mappingResource, setMappingResource, summary}:
        {
            mappingResource: MappingResource,
            setMappingResource: (m: MappingResource) => void,
            summary: Record<string, (string|number|boolean)[]>
        }
) {
    const {classes} = useStyles()
    const map = mappingResource.map
    let mapped_data: Record<string, (string|number|boolean|Date)[]> = {}

    const getName = (v?: MapEntry) => v? (v.name || v.column_type.name) : ""

    const safeSetMapping = (new_mapping: typeof map) => {
        // Rename any duplicate column names.
        const name_used: Record<ReturnType<typeof getName>, boolean> = {}
        Object.entries(new_mapping).forEach(([k, v]) => {
            // Strip leading underscores; they'll be added back if necessary
            v.name = v.name?.replace(/^_*/, "")
            const name = getName(v)
            // Don't allow original datafile column names to be used by other columns
            if (Object.keys(summary).includes(name) && k !== name) {
                name_used[name] = true
            }
            if (name_used[name]) {
                const n_underscores = Object.keys(name_used)
                    .filter((n) => n.match(`_*${name}`))
                    .length
                v.name = `${'_'.repeat(n_underscores)}${name}`
                name_used[v.name] = true
            } else {
                name_used[name] = true
            }
        })
        setMappingResource({...mappingResource, map: new_mapping})
    }

    // Define mapped_data
    mapped_data = Object.fromEntries(
        Object.entries(summary).map(([k, v]) => {
            if (Object.keys(map).includes(k))
                return [getName(map[k]), convert(v, map[k])]
            return [k, v]
        })
    )

    return <Table key="mapping-table" size="small" className={clsx(classes.mappingTable)}>
        <TableHead>
            <TableRow className={clsx(classes.mappingTableHeadRow)}>
                {Object.keys(summary).map((key, i) => {
                    return <TableCell key={i}>{key}</TableCell>
                })}
            </TableRow>
        </TableHead>
        <TableBody>
            {/* Initial data */}
            {
                Object.values(summary).reduce((prev, cur) => {
                    return cur.length > prev.length ? cur : prev
                }, []).map((_arr, i) => {
                    return <TableRow key={`old-${i}`}>
                        {Object.values(summary).map((col, n) => {
                            return <TableCell key={n}>{col[i]}</TableCell>
                        })}
                    </TableRow>
                })
            }
            {/* Divider */}
            <TableRow key="divider-recognise">
                <TableCell colSpan={Object.keys(summary).length} sx={{textAlign: "center"}}>
                    <KeyboardDoubleArrowDownIcon /> Recognise <KeyboardDoubleArrowDownIcon />
                </TableCell>
            </TableRow>
            {/* Recognise */}
            <TableRow key="recognise" className={clsx(classes.mappingTableHeadRow)}>
                {Object.keys(summary).map((key, i) => {
                    if (!mappingResource.permissions?.write) return <TableCell key={i}>
                        <Tooltip title={`You do not have permission to edit '${mappingResource.name}'`}>
                            <Typography>{map[key]?.column_type.name ?? "-"}</Typography>
                        </Tooltip>
                    </TableCell>
                    return <TableCell key={i}>{
                        <SelectColumnType
                            setSelected={(ct) => {
                                const old = {...map}
                                delete old[key]
                                const value = ct ? {...old, [key]: {column_type: ct}} : old
                                safeSetMapping(value)
                            }}
                            selected_id={map[key]?.column_type.id ?? null}
                            reset_name={key}
                        />
                    }</TableCell>
                })}
            </TableRow>
            {/* Rebase and Rescale */}
            {/* Any new column is int/float */
                Object.values(map).reduce(
                    (prev, cur) => prev || ["int", "float"].includes(cur.column_type.data_type),
                    false
                ) && <>
                    {/* Divider */}
                    <TableRow key="divider-rescale">
                        <TableCell colSpan={Object.keys(summary).length} sx={{textAlign: "center"}}>
                            <KeyboardDoubleArrowDownIcon /> Rebase and Rescale <KeyboardDoubleArrowDownIcon />
                        </TableCell>
                    </TableRow>
                    <TableRow key="rebase-and-rescale">
                        {Object.keys(summary).map((key, i) => {
                                if (!mappingResource.permissions?.write) return <TableCell
                                    key={i}
                                    className={clsx(classes.mappingRebase)}
                                >
                                    <Tooltip title={`You do not have permission to edit '${mappingResource.name}'`}>
                                        <Typography>x' = (x + {map[key]?.addition}) x {map[key]?.multiplier}</Typography>
                                    </Tooltip>
                                </TableCell>
                                const float = map[key]?.column_type.data_type === "float"
                                if (!float && map[key]?.column_type.data_type !== "int")
                                    return <TableCell key={i} />
                                const pattern = float? "[0-9]*.?[0-9]*" : "[0-9]*"
                                const width = (n: number) => {
                                    const digits = Math.floor(Math.log10(Math.max(1, Math.abs(n))))
                                    return `${digits + 2}em`
                                }
                                return <TableCell key={i} className={clsx(classes.mappingRebase)}>
                                    x' = (x +
                                    <FilledInput
                                        value={map[key].addition ?? 0}
                                        sx={{width: width(map[key].addition ?? 0)}}
                                        type="number"
                                        // @ts-expect-error MUI doesn't expose pattern property, but it does forward it
                                        pattern={pattern}
                                        aria-label="addition"
                                        onChange={(e) => {
                                            const v = float? parseFloat(e.target.value) : parseInt(e.target.value)
                                            safeSetMapping({
                                                ...map,
                                                [key]: {...map[key], addition: v ?? 0}
                                            })
                                        }}
                                        className={clsx(classes.mappingNumberInput)}
                                    />) x
                                    <FilledInput
                                        value={map[key].multiplier ?? 1}
                                        sx={{width: width(map[key].multiplier ?? 1)}}
                                        type="number"
                                        // @ts-expect-error MUI doesn't expose pattern property, but it does forward it
                                        pattern={pattern}
                                        aria-label="multiplier"
                                        onChange={(e) => {
                                            const v = float? parseFloat(e.target.value) : parseInt(e.target.value)
                                            safeSetMapping({
                                                ...map,
                                                [key]: {...map[key], multiplier: v ?? 1}
                                            })
                                        }}
                                        className={clsx(classes.mappingNumberInput)}
                                    />
                                </TableCell>
                            }
                        )}
                    </TableRow>
                </>
            }
            { Object.values(map).filter(v => !v.column_type.is_required).length > 0 &&
                <>
                    {/* Divider */}
                    <TableRow key="divider-rename">
                        <TableCell colSpan={Object.keys(summary).length} sx={{textAlign: "center"}}>
                            <KeyboardDoubleArrowDownIcon /> Rename <KeyboardDoubleArrowDownIcon />
                        </TableCell>
                    </TableRow>
                </>
            }
            {/* Rename */}
            <TableRow key="rename">
                {Object.keys(summary).map((key, i) => {
                        if (!mappingResource.permissions?.write) return <TableCell key={i}>
                            <Tooltip title={`You do not have permission to edit '${mappingResource.name}'`}>
                                <Typography>{key}</Typography>
                            </Tooltip>
                        </TableCell>
                        if (!map[key]) return <TableCell key={i}>
                            <Tooltip title={`Only recognised columns can be renamed`}>
                                <Typography>{key}</Typography>
                            </Tooltip>
                        </TableCell>
                        if (map[key]?.column_type.is_required) return <TableCell key={i}>
                            <Tooltip title={`Required columns cannot be renamed`}>
                                <Typography>{getName(map[key])}</Typography>
                            </Tooltip>
                        </TableCell>
                        return <TableCell key={i}>
                            <TextField
                                value={getName(map[key]) ?? key}
                                onChange={(e) => {
                                    safeSetMapping({
                                        ...map, [key]: {...map[key], name: e.target.value}
                                    })
                                }}
                            />
                        </TableCell>
                    }
                )}
            </TableRow>
            {
                Object.values(mapped_data)
                    .reduce(
                        (prev, cur) => cur.length > prev.length ? cur : prev,
                        []
                    )
                    .map((arr, i) => {
                        return <TableRow key={`new-${i}`}>
                            {
                                Object.values(mapped_data).map(
                                    (col, n) => <TableCell key={n}>
                                        {String(col[i] ?? "")}
                                    </TableCell>
                                )
                            }
                        </TableRow>
                    })
            }
        </TableBody>
    </Table>
}

function MappingManager({file}: {file: ObservedFile}) {
    const blank_map = () => ({
        id: "", url: "", name: "", team: null, is_valid: false, map: {},
        permissions: {read: true, write: true, admin: true},
        read_access_level: 2, edit_access_level: 3, delete_access_level: 3
    })
    const {useListQuery, useCreateQuery, useUpdateQuery, useDeleteQuery} = useFetchResource()
    const {results: columns} = useListQuery<ColumnType>(LOOKUP_KEYS.COLUMN_FAMILY)
    const [more, setMore] = React.useState(false)
    const [advancedPropertiesOpen, setAdvancedPropertiesOpen] = React.useState(false)
    const [mapping, setMapping] = useState<DB_MappingResource>(
        () => {
            const m = file?.applicable_mappings?.find(m => m.url === file.mapping)
            return m? {...m} : blank_map()
        }
    )
    const navigate = useNavigate()
    const updateFileMutation = useUpdateQuery<ObservedFile>(LOOKUP_KEYS.FILE)
    const updateFile = (new_mapping: DB_MappingResource) => updateFileMutation.mutate(
        {...file!, mapping: new_mapping.url},
        {onSuccess: () => navigate(0)}
    )
    const createMapMutation = useCreateQuery<DB_MappingResource>(
        LOOKUP_KEYS.MAPPING,
        { after_cache: (r) => updateFile(r.data) }
    )
    const createMap = (data: Omit<DB_MappingResource, "url"|"id"|"is_valid">) =>
        createMapMutation.mutate(data, {onSuccess: (data) => updateFile(data.data)})
    const updateMapMutation = useUpdateQuery<DB_MappingResource>(LOOKUP_KEYS.MAPPING)
    const updateMap = (data: DB_MappingResource) => updateMapMutation.mutate(data)
    const deleteMapMutation = useDeleteQuery<DB_MappingResource>(LOOKUP_KEYS.MAPPING)
    const deleteMap = (data: DB_MappingResource) => deleteMapMutation.mutate(data, {onSuccess: () => navigate(0)})

    const summary = file?.summary as Record<string, Record<string, string|number>>
    // Summary data with children in array form
    const array_summary: Record<string, (string|number|boolean)[]> = {}

    const original_mapping = file?.applicable_mappings?.find((m) => m.id === mapping.id)

    const file_mapping_has_changed = original_mapping?.url !== file?.mapping
    const mapping_map_has_changed = JSON.stringify(mapping.map) !== JSON.stringify(original_mapping?.map)
    const mapping_has_changed =  mapping_map_has_changed ||
        mapping.name !== original_mapping?.name ||
        mapping.team !== original_mapping?.team ||
        mapping.read_access_level !== original_mapping?.read_access_level ||
        mapping.edit_access_level !== original_mapping?.edit_access_level ||
        mapping.delete_access_level !== original_mapping?.delete_access_level

    const mapping_is_dirty = // new map with unsaved changes
        (mapping.id === "" && Object.keys(mapping.map).length > 0) ||
        // old map with unsaved changes
        (mapping.id !== "" && mapping_has_changed)

    const mapping_can_be_saved = mapping_is_dirty &&
        mapping.name !== "" &&
        mapping.team !== "" &&
        (mapping.permissions?.write ?? false)

    const map_can_be_applied = mapping.id !== "" && file_mapping_has_changed && (file?.permissions?.write ?? false)

    const safeSetMapping = (value?: string) => {
        const new_mapping = file?.applicable_mappings?.find((m) => m.id === value)
        // Check whether we need to warn about discarding changes.
        if (mapping_is_dirty && !window.confirm(`Discard unsaved changes to mapping '${mapping.name}'?`))
            return
        setMapping(new_mapping? {...new_mapping} : blank_map())
    }

    Object.keys(summary).forEach((key) => {
        const arr = [];
        const max = Object.keys(summary).reduce((prev, cur) => {
            return parseInt(cur) > prev ? parseInt(cur) : prev
        }, 0)
        for (let i = 0; i < max; i++) {
            arr.push(summary[key][i] ?? undefined)
        }
        array_summary[key] = Object.values(summary[key])
    })

    return <Paper
        sx={{margin: (t) => t.spacing(1)}}
        elevation={0}
    >
        <Stack spacing={1}>
            <Typography variant="h5" key="title">
                Column Mapping for {
                file?.id &&
                <ResourceChip resource_id={file.id as string} lookup_key={LOOKUP_KEYS.FILE} />
            }
            </Typography>
            <Typography variant="body1" key="intro">
                Data files are parsed by Harvesters to produce tabular data.
                The Mapping process allows you to specify how the columns in that data should be interpreted.
                All data should have at least the three key data columns 'ElapsedTime_s', 'Voltage_V', and 'Current_A'.
            </Typography>
            <Collapse in={more} key="collapse">
                <Typography>
                    You can associate this file with an existing mapping, or create a new mapping.
                    When creating a new mapping, you will be able to assign existing columns from other mappings,
                    or create new columns.
                </Typography>
                <Typography>
                    Note: actual data transformation is done in Python via the `pandas` package.
                    The preview below is for guidance only, and values are not guaranteed to match the final output.
                </Typography>
            </Collapse>
            <Button key="more" onClick={() => setMore(!more)}>{more ? "Less" : "More"}</Button>
            { !file?
                <Typography>Failed to load file data, please try refreshing the page.</Typography> :
                <>
                    {/* Load mapping */
                        file?.applicable_mappings &&
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Tooltip title="Only mappings that are applicable to this file will be available.">
                                <Typography>Mapping:</Typography>
                            </Tooltip>
                            <Select
                                label="Load mapping"
                                value={mapping?.id}
                                onChange={(event) => safeSetMapping(event.target.value)}
                            >
                                <MenuItem key='reset' value=''><Typography>Create new mapping</Typography></MenuItem>
                                {
                                    file?.applicable_mappings
                                        .sort((a, b) => {
                                            if (a.is_valid && !b.is_valid) return -1
                                            if (!a.is_valid && b.is_valid) return 1
                                            if ((a.missing ?? Infinity) < (b.missing ?? Infinity)) return -1
                                            if ((a.missing ?? Infinity) > (b.missing ?? Infinity)) return 1
                                            return a.name.localeCompare(b.name)
                                        })
                                        .map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)
                                }
                            </Select>
                            <Button
                                startIcon={<ICONS.SAVE color={mapping_can_be_saved ? "success" : undefined}/>}
                                onClick={() => {
                                    let confirmed = false
                                    if (mapping_can_be_saved) {
                                        if (!mapping.id) {
                                            createMap({
                                                name: mapping.name,
                                                team: mapping.team,
                                                map: mapping.map
                                            })
                                            return  // automatically applies on creation
                                        } else {
                                            if (mapping_map_has_changed && mapping.in_use) {
                                                if (!window.confirm(`
Mapping '${mapping.name}' is in use. 

Updating its map will cause affected datafiles to be re-imported. This can be an long operation, especially where multiple files are affected.

Do you wish to continue?`
                                                ))
                                                    return
                                                confirmed = true
                                            }
                                            updateMap(mapping)
                                        }
                                    }
                                    if (map_can_be_applied) {
                                        if (!confirmed && file.state === "IMPORTED") {
                                            if (!window.confirm("Apply new mapping to file? This will cause the data to be re-imported.")) {
                                                return
                                            }
                                        }
                                        updateFile(mapping)
                                    }
                                }}
                                disabled={!mapping_can_be_saved && !map_can_be_applied}
                            >
                                {mapping_can_be_saved && (mapping.id?
                                        map_can_be_applied?
                                            "Update and apply mapping": "Update mapping" :
                                        "Create"
                                )}
                                {!mapping_can_be_saved && "Apply mapping"}
                            </Button>
                        </Stack>
                    }
                    {
                        <Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                { mapping.permissions?.write && <>
                                    <TextField
                                        label="Mapping name"
                                        value={mapping.name}
                                        onChange={(e) => setMapping({...mapping, name: e.target.value})}
                                        error={mapping_is_dirty && !mapping.name}
                                        helperText={mapping_is_dirty && !mapping.name? "Name is required" : undefined}
                                    />
                                    <PrettyResource
                                        target={{_type: key_to_type(LOOKUP_KEYS.TEAM), _value: mapping.team}}
                                        lookup_key={LOOKUP_KEYS.TEAM}
                                        edit_mode={true}
                                        allow_new={false}
                                        onChange={(v: TypeValueNotation) => {
                                            if (typeof v._value !== "string") return
                                            setMapping({...mapping, team: v._value})
                                        }}
                                    />
                                </>}
                                {
                                    mapping.permissions?.write && <Button
                                        onClick={() => setAdvancedPropertiesOpen(!advancedPropertiesOpen)}
                                    >
                                        { advancedPropertiesOpen? "Hide " : "Edit " } advanced properties
                                    </Button>
                                }
                            </Stack>
                            <>
                                {
                                    mapping.in_use && mapping_map_has_changed &&
                                    <Alert severity="warning">
                                        Updating a map that is used for datafiles will cause those datafiles to be re-parsed.
                                    </Alert>
                                }
                                {!mapping.team && mapping_can_be_saved && <Alert severity="info">Mapping must belong to a team.</Alert>}
                            </>
                            <Collapse in={advancedPropertiesOpen}>
                                <Stack spacing={1} sx={{
                                    paddingBottom: (t: Theme) => t.spacing(2),
                                    paddingTop: (t: Theme) => t.spacing(1)
                                }}
                                >
                                    <PrettyObject
                                        target={to_type_value_notation_wrapper({
                                            read_access_level: mapping.read_access_level,
                                            edit_access_level: mapping.edit_access_level,
                                            delete_access_level: mapping.delete_access_level
                                        })}
                                        edit_mode={mapping.permissions?.read ?? false}
                                        onEdit={(v: TypeValueNotationWrapper) => {
                                            const is_number = (x: unknown): x is number => typeof x === "number"
                                            const as_number = (x: unknown) => is_number(x)? x : undefined
                                            setMapping({
                                                ...mapping,
                                                read_access_level: as_number(v.read_access_level._value) ?? mapping.read_access_level,
                                                edit_access_level: as_number(v.edit_access_level._value) ?? mapping.edit_access_level,
                                                delete_access_level: as_number(v.delete_access_level._value) ?? mapping.delete_access_level
                                            })
                                        }}
                                        extractPermissions={true}
                                        canEditKeys={false}
                                    />
                                    <Button
                                        color={mapping.permissions?.destroy? "error" : undefined}
                                        variant="contained"
                                        startIcon={<ICONS.DELETE />}
                                        onClick={() => {
                                            if (window.confirm(`Delete mapping '${mapping.name}'?`)) {
                                                deleteMap(mapping)
                                            }
                                        }}
                                        disabled={mapping.id === "" || !mapping.permissions?.destroy}
                                    >
                                        Delete mapping {mapping.name || original_mapping?.name }
                                    </Button>
                                </Stack>
                            </Collapse>
                        </Stack>
                    }
                    {array_summary && mapping && columns &&
                        <Box sx={{paddingBottom: 1}}>
                            <MappingTable
                                mappingResource={db_map_to_map(mapping, columns)}
                                setMappingResource={(map) => setMapping(map_to_db_map(map))}
                                summary={array_summary}
                            />
                        </Box>
                    }
                </>
            }
        </Stack>
    </Paper>
}

export function Mapping() {
    const {apiResource: file, apiQuery: fileQuery} = useApiResource<ObservedFile>()

    const loadingBody = <Skeleton height={400} />

    const errorBody = <ErrorCard
        message="Error loading mapping"
        header={
            <CardHeader
                avatar={<Avatar variant="square">E</Avatar>}
                title="Error"
                subheader="Error loading mapping"
            />
        }
    />

    return <QueryWrapper
        queries={fileQuery? [fileQuery] : []}
        error={errorBody}
        loading={loadingBody}
        success={!!file && <MappingManager file={file} />}
    />
}

export default function WrappedMapping() {
    const navigate = useNavigate()
    const {id} = useParams<{id: string}>()

    if (!id) {
        navigate(PATHS.DASHBOARD)
        return <></>
    }

    return <ErrorBoundary
        fallback={(error: Error) => <ErrorCard
            message={error.message}
            header={
                <CardHeader
                    avatar={<Avatar variant="square">E</Avatar>}
                    title="Error"
                    subheader={`Error with Mapping for ${id}`
                    }
                />
            }
        />}
    >
        <ApiResourceContextProvider resource_id={id} lookup_key={LOOKUP_KEYS.FILE}>
            <Mapping />
        </ApiResourceContextProvider>
    </ErrorBoundary>
}
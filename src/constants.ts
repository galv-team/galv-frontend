import PollIcon from "@mui/icons-material/Poll";
import MultilineChartIcon from "@mui/icons-material/MultilineChart";
import DatasetLinkedIcon from "@mui/icons-material/DatasetLinked";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import SchemaIcon from '@mui/icons-material/Schema';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import HideSourceIcon from '@mui/icons-material/HideSource';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import ExtensionIcon from '@mui/icons-material/Extension';
import SuccessIcon from '@mui/icons-material/Done';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import {
    CellChemistriesApi,
    CellFamiliesApi,
    CellFormFactorsApi,
    CellManufacturersApi,
    CellModelsApi,
    CellsApi,
    CyclerTestsApi,
    EquipmentApi,
    EquipmentFamiliesApi,
    EquipmentManufacturersApi,
    EquipmentModelsApi,
    EquipmentTypesApi,
    ExperimentsApi,
    FilesApi,
    HarvestersApi,
    LabsApi,
    MonitoredPathsApi,
    ParquetPartitionsApi,
    ScheduleFamiliesApi,
    ScheduleIdentifiersApi,
    SchedulesApi,
    TeamsApi,
    TokensApi,
    UsersApi,
    ValidationSchemasApi,
    ArbitraryFilesApi, ColumnsApi, ColumnTypesApi, UnitsApi,
    ColumnMappingsApi
} from "@battery-intelligence-lab/galv";
import {
    TypeChangerAutocompleteKey,
    TypeChangerLookupKey,
    TypeChangerSupportedTypeName
} from "./Components/prettify/TypeChanger";
import {TypeValueNotation} from "./Components/TypeValueNotation";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * The basic unit of data passed around the frontend is a Serializable.
 * This is a type that can be serialized to JSON.
 */
export type Serializable =
    string |
    number |
    boolean |
    TypeValueNotation |
    SerializableObject |
    Serializable[] |
    undefined |
    null
export type SerializableObject = { [key: string]: Serializable }
export type NonNullSerializable = Exclude<Serializable, null | undefined>

/**
 * Resources are identified by their lookup key.
 * When used as a TypeValueNotation type, they are prefixed with "galv_".
 * @param t - TypeValueNotation type name
 */
export const type_to_key = (t: TypeChangerSupportedTypeName): AutocompleteKey | LookupKey | undefined => {
    if (t.startsWith('galv_')) {
        const k = t.replace('galv_', '')
        if (is_autocomplete_key(k) || is_lookup_key(k)) return k
        console.error(`Type ${t} starts with galv_ but is not a LookupKey or AutocompleteKey`)
    }
    return undefined
}

/**
 * Resources are identified by their lookup key.
 * When used as a TypeValueNotation type, they are prefixed with "galv_".
 *
 * @param k - AutocompleteKey or LookupKey
 */
export const key_to_type = (k: unknown): TypeChangerAutocompleteKey|TypeChangerLookupKey => {
    if (is_autocomplete_key(k) || is_lookup_key(k))
        return `galv_${k}`
    throw new Error(`key_to_type: ${k} is not a valid key`)
}

/**
 * This is a list of various resources grouped under a common name for each
 * resource type.
 * This allows us to pass a single identifier for the resource type to
 * various components, which can then use this identifier to determine
 * which API to use, which icon to display, etc.
 *
 * TODO: Eventually these could all be exposed as part of a useLookupKey context.
 */
export const LOOKUP_KEYS = {
    HARVESTER: "HARVESTER",
    PATH: "PATH",
    PARQUET_PARTITION: "PARQUET_PARTITION",
    FILE: "FILE",
    MAPPING: "MAPPING",
    CELL_FAMILY: "CELL_FAMILY",
    CELL: "CELL",
    EQUIPMENT_FAMILY: "EQUIPMENT_FAMILY",
    EQUIPMENT: "EQUIPMENT",
    SCHEDULE_FAMILY: "SCHEDULE_FAMILY",
    SCHEDULE: "SCHEDULE",
    EXPERIMENT: "EXPERIMENT",
    CYCLER_TEST: "CYCLER_TEST",
    ARBITRARY_FILE: "ARBITRARY_FILE",
    VALIDATION_SCHEMA: "VALIDATION_SCHEMA",
    LAB: "LAB",
    TEAM: "TEAM",
    USER: "USER",
    TOKEN: "TOKEN",
    UNIT: "UNIT",
    COLUMN_FAMILY: "COLUMN_FAMILY",
    COLUMN: "COLUMN",
} as const

export const AUTOCOMPLETE_KEYS = {
    CELL_MANUFACTURER: "CELL_MANUFACTURER",
    CELL_MODEL: "CELL_MODEL",
    CELL_FORM_FACTOR: "CELL_FORM_FACTOR",
    CELL_CHEMISTRY: "CELL_CHEMISTRY",
    EQUIPMENT_TYPE: "EQUIPMENT_TYPE",
    EQUIPMENT_MANUFACTURER: "EQUIPMENT_MANUFACTURER",
    EQUIPMENT_MODEL: "EQUIPMENT_MODEL",
    SCHEDULE_IDENTIFIER: "SCHEDULE_IDENTIFIER",
} as const

export type LookupKey = keyof typeof LOOKUP_KEYS
export const is_lookup_key = (key: unknown): key is LookupKey =>
    typeof key === "string" && Object.keys(LOOKUP_KEYS).includes(key)

export type AutocompleteKey = keyof typeof AUTOCOMPLETE_KEYS
export const is_autocomplete_key = (key: unknown): key is AutocompleteKey =>
    typeof key === "string" && Object.keys(AUTOCOMPLETE_KEYS).includes(key)

/**
 * Icons for each resource type.
 * Currently all families share the same icon.
 */
export const ICONS = {
    [LOOKUP_KEYS.HARVESTER]: CloudSyncIcon,
    [LOOKUP_KEYS.PATH]: FolderIcon,
    [LOOKUP_KEYS.PARQUET_PARTITION]: ExtensionIcon,
    [LOOKUP_KEYS.FILE]: PollIcon,
    [LOOKUP_KEYS.MAPPING]: CompareArrowsIcon,
    [LOOKUP_KEYS.UNIT]: SubscriptIcon,
    [LOOKUP_KEYS.COLUMN_FAMILY]: SplitscreenIcon,
    [LOOKUP_KEYS.COLUMN]: SplitscreenIcon,
    [LOOKUP_KEYS.CELL_FAMILY]: BatchPredictionIcon,
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: BatchPredictionIcon,
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: BatchPredictionIcon,
    [LOOKUP_KEYS.EXPERIMENT]: DatasetLinkedIcon,
    [LOOKUP_KEYS.CYCLER_TEST]: MultilineChartIcon,
    [LOOKUP_KEYS.CELL]: BatteryFullIcon,
    [LOOKUP_KEYS.EQUIPMENT]: PrecisionManufacturingIcon,
    [LOOKUP_KEYS.SCHEDULE]: AssignmentIcon,
    [LOOKUP_KEYS.ARBITRARY_FILE]: AttachFileIcon,
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: SchemaIcon,
    [LOOKUP_KEYS.LAB]: HolidayVillageIcon,
    [LOOKUP_KEYS.TEAM]: PeopleAltIcon,
    [LOOKUP_KEYS.USER]: PersonIcon,
    [LOOKUP_KEYS.TOKEN]: VpnKeyIcon,
    DASHBOARD: HomeIcon,
    MANAGE_ACCOUNT: ManageAccountsIcon,
    LOGOUT: LogoutIcon,
    CREATE: AddCircleIcon,
    DELETE: DeleteIcon,
    SAVE: SaveIcon,
    FORK: ForkRightIcon,
    CANCEL: CancelIcon,
    CHECK: CheckCircleIcon,
    EXPAND_MORE: ExpandMoreIcon,
    EXPAND_LESS: ExpandLessIcon,
    DOWNLOAD: DownloadIcon,
    validation_status_ERROR: ErrorIcon,
    validation_status_UNCHECKED: PendingIcon,
    validation_status_VALID: CheckCircleIcon,
    validation_status_INVALID: CancelIcon,
    validation_status_SKIPPED: HideSourceIcon,
    SUCCESS: SuccessIcon,
    INFO: InfoIcon,
    WARNING: WarningIcon,
    ERROR: ErrorIcon
} as const

/**
 * Paths used by React Router to route to each resource type.
 * This deliberately mimics paths on the API because they are
 * used to determine resource types when parsing URLs that look
 * like they might be resource URLs.
 */
export const PATHS = {
    [LOOKUP_KEYS.HARVESTER]: "/harvesters",
    [LOOKUP_KEYS.PATH]: "/paths",
    [LOOKUP_KEYS.PARQUET_PARTITION]: "/parquet_partitions",
    [LOOKUP_KEYS.FILE]: "/files",
    [LOOKUP_KEYS.COLUMN]: "/columns",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "/column_types",
    [LOOKUP_KEYS.UNIT]: "/units",
    DASHBOARD: "/",
    [LOOKUP_KEYS.MAPPING]: "/mapping",
    [LOOKUP_KEYS.EXPERIMENT]: "/experiments",
    [LOOKUP_KEYS.CYCLER_TEST]: "/cycler_tests",
    GRAPH: "/graphs",
    [LOOKUP_KEYS.CELL]: "/cells",
    [LOOKUP_KEYS.CELL_FAMILY]: "/cell_families",
    [LOOKUP_KEYS.EQUIPMENT]: "/equipment",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "/equipment_families",
    [LOOKUP_KEYS.SCHEDULE]: "/schedules",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "/schedule_families",
    [LOOKUP_KEYS.ARBITRARY_FILE]: "/arbitrary_files",
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: "/validation_schemas",
    [LOOKUP_KEYS.LAB]: "/labs",
    [LOOKUP_KEYS.TEAM]: "/teams",
    [LOOKUP_KEYS.USER]: "/users",
    [LOOKUP_KEYS.TOKEN]: "/tokens",
    PROFILE: "/profile",
    [AUTOCOMPLETE_KEYS.CELL_MANUFACTURER]: "/cell_manufacturers",
    [AUTOCOMPLETE_KEYS.CELL_MODEL]: "/cell_models",
    [AUTOCOMPLETE_KEYS.CELL_FORM_FACTOR]: "/cell_form_factors",
    [AUTOCOMPLETE_KEYS.CELL_CHEMISTRY]: "/cell_chemistries",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_TYPE]: "/equipment_types",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MANUFACTURER]: "/equipment_manufacturers",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MODEL]: "/equipment_models",
    [AUTOCOMPLETE_KEYS.SCHEDULE_IDENTIFIER]: "/schedule_identifiers",
} as const

/**
 * Display names are in Title Case.
 */
export const DISPLAY_NAMES = {
    [LOOKUP_KEYS.HARVESTER]: "Harvester",
    [LOOKUP_KEYS.PATH]: "Path",
    [LOOKUP_KEYS.PARQUET_PARTITION]: "Parquet Partition",
    [LOOKUP_KEYS.FILE]: "File",
    [LOOKUP_KEYS.MAPPING]: "Mapping",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "Column Type",
    [LOOKUP_KEYS.COLUMN]: "Column",
    [LOOKUP_KEYS.UNIT]: "Unit",
    DASHBOARD: "Dashboard",
    [LOOKUP_KEYS.EXPERIMENT]: "Experiment",
    [LOOKUP_KEYS.CYCLER_TEST]: "Cycler Test",
    DATASET: "Dataset",
    [LOOKUP_KEYS.CELL]: "Cell",
    [LOOKUP_KEYS.CELL_FAMILY]: "Cell Family",
    [LOOKUP_KEYS.EQUIPMENT]: "Equipment",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "Equipment Family",
    [LOOKUP_KEYS.SCHEDULE]: "Schedule",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "Schedule Family",
    [LOOKUP_KEYS.ARBITRARY_FILE]: "Attachment",
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: "Validation Schema",
    [LOOKUP_KEYS.LAB]: "Lab",
    [LOOKUP_KEYS.TEAM]: "Team",
    [LOOKUP_KEYS.USER]: "User",
    [LOOKUP_KEYS.TOKEN]: "Token",
} as const

/**
 * Title Case, as with DISPLAY_NAMES. Plural.
 */
export const DISPLAY_NAMES_PLURAL = {
    [LOOKUP_KEYS.HARVESTER]: "Harvesters",
    [LOOKUP_KEYS.PATH]: "Paths",
    [LOOKUP_KEYS.PARQUET_PARTITION]: "Parquet Partitions",
    [LOOKUP_KEYS.FILE]: "Files",
    [LOOKUP_KEYS.MAPPING]: "Mappings",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "Column Type",
    [LOOKUP_KEYS.COLUMN]: "Columns",
    [LOOKUP_KEYS.UNIT]: "Unit",
    DASHBOARD: "Dashboard",
    [LOOKUP_KEYS.EXPERIMENT]: "Experiments",
    [LOOKUP_KEYS.CYCLER_TEST]: "Cycler Tests",
    DATASET: "Datasets",
    [LOOKUP_KEYS.CELL]: "Cells",
    [LOOKUP_KEYS.CELL_FAMILY]: "Cell Families",
    [LOOKUP_KEYS.EQUIPMENT]: "Equipment",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "Equipment Families",
    [LOOKUP_KEYS.SCHEDULE]: "Schedules",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "Schedule Families",
    [LOOKUP_KEYS.ARBITRARY_FILE]: "Attachments",
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: "Validation Schemas",
    [LOOKUP_KEYS.LAB]: "Labs",
    [LOOKUP_KEYS.TEAM]: "Teams",
    [LOOKUP_KEYS.USER]: "Users",
    [LOOKUP_KEYS.TOKEN]: "Tokens",
} as const

/**
 * API handlers for each resource type.
 * Instantiated with new API_HANDLERS[lookup_key]().
 */
export const API_HANDLERS = {
    [LOOKUP_KEYS.HARVESTER]: HarvestersApi,
    [LOOKUP_KEYS.PATH]: MonitoredPathsApi,
    [LOOKUP_KEYS.PARQUET_PARTITION]: ParquetPartitionsApi,
    [LOOKUP_KEYS.FILE]: FilesApi,
    [LOOKUP_KEYS.MAPPING]: ColumnMappingsApi,
    [LOOKUP_KEYS.COLUMN]: ColumnsApi,
    [LOOKUP_KEYS.COLUMN_FAMILY]: ColumnTypesApi,
    [LOOKUP_KEYS.UNIT]: UnitsApi,
    [LOOKUP_KEYS.CELL_FAMILY]: CellFamiliesApi,
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: EquipmentFamiliesApi,
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: ScheduleFamiliesApi,
    [LOOKUP_KEYS.EXPERIMENT]: ExperimentsApi,
    [LOOKUP_KEYS.CYCLER_TEST]: CyclerTestsApi,
    [LOOKUP_KEYS.CELL]: CellsApi,
    [LOOKUP_KEYS.EQUIPMENT]: EquipmentApi,
    [LOOKUP_KEYS.SCHEDULE]: SchedulesApi,
    [LOOKUP_KEYS.ARBITRARY_FILE]: ArbitraryFilesApi,
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: ValidationSchemasApi,
    [LOOKUP_KEYS.LAB]: LabsApi,
    [LOOKUP_KEYS.TEAM]: TeamsApi,
    [LOOKUP_KEYS.USER]: UsersApi,
    [LOOKUP_KEYS.TOKEN]: TokensApi,
    [AUTOCOMPLETE_KEYS.CELL_MANUFACTURER]: CellManufacturersApi,
    [AUTOCOMPLETE_KEYS.CELL_MODEL]: CellModelsApi,
    [AUTOCOMPLETE_KEYS.CELL_FORM_FACTOR]: CellFormFactorsApi,
    [AUTOCOMPLETE_KEYS.CELL_CHEMISTRY]: CellChemistriesApi,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_TYPE]: EquipmentTypesApi,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MANUFACTURER]: EquipmentManufacturersApi,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MODEL]: EquipmentModelsApi,
    [AUTOCOMPLETE_KEYS.SCHEDULE_IDENTIFIER]: ScheduleIdentifiersApi,
} as const

/**
 * API slugs for each resource type.
 * Used to access the inner API functions.
 *
 * Casting is likely to be necessary when using this, e.g.:
 * ```
 * const target_get = target_api_handler[
 *         `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof target_api_handler
 *         ] as (id: string) => Promise<AxiosResponse<T>>
 * ```
 */
export const API_SLUGS = {
    [LOOKUP_KEYS.HARVESTER]: "harvesters",
    [LOOKUP_KEYS.PATH]: "monitoredPaths",
    [LOOKUP_KEYS.PARQUET_PARTITION]: "parquetPartitions",
    [LOOKUP_KEYS.FILE]: "files",
    [LOOKUP_KEYS.MAPPING]: "columnMappings",
    [LOOKUP_KEYS.COLUMN]: "columns",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "columnTypes",
    [LOOKUP_KEYS.UNIT]: "units",
    [LOOKUP_KEYS.CELL]: "cells",
    [LOOKUP_KEYS.EQUIPMENT]: "equipment",
    [LOOKUP_KEYS.SCHEDULE]: "schedules",
    [LOOKUP_KEYS.CELL_FAMILY]: "cellFamilies",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "equipmentFamilies",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "scheduleFamilies",
    [LOOKUP_KEYS.EXPERIMENT]: "experiments",
    [LOOKUP_KEYS.CYCLER_TEST]: "cyclerTests",
    [LOOKUP_KEYS.ARBITRARY_FILE]: "arbitraryFiles",
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: "validationSchemas",
    [LOOKUP_KEYS.LAB]: "labs",
    [LOOKUP_KEYS.TEAM]: "teams",
    [LOOKUP_KEYS.USER]: "users",
    [LOOKUP_KEYS.TOKEN]: "tokens",
    [AUTOCOMPLETE_KEYS.CELL_MANUFACTURER]: "cellManufacturers",
    [AUTOCOMPLETE_KEYS.CELL_MODEL]: "cellModels",
    [AUTOCOMPLETE_KEYS.CELL_FORM_FACTOR]: "cellFormFactors",
    [AUTOCOMPLETE_KEYS.CELL_CHEMISTRY]: "cellChemistries",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_TYPE]: "equipmentTypes",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MANUFACTURER]: "equipmentManufacturers",
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MODEL]: "equipmentModels",
    [AUTOCOMPLETE_KEYS.SCHEDULE_IDENTIFIER]: "scheduleIdentifiers",
} as const


/**
 * Priority levels govern how visible field information is.
 * IDENTITY fields form part of the resource's display name.
 * CONTEXT fields may be part of the name (e.g. Family name, or Equipment type).
 * SUMMARY fields are shown in the summary view, e.g. cycler test related resources.
 * DETAIL fields are shown in the detail view.
 * Anything with an undefined priority level is assumed to be DETAIL.
 *
 * Special fields may not use the priority system, e.g. Team.
 */
export const PRIORITY_LEVELS = {
    HIDDEN: -1,
    DETAIL: 0,
    SUMMARY: 1,
    CONTEXT: 2,
    IDENTITY: 3
} as const

export type Field = {
    readonly: boolean
    type: TypeChangerSupportedTypeName
    many?: boolean
    priority?: number
    // createonly fields are required at create time, but otherwise readonly
    createonly?: boolean
    // default_value is used when creating a new resource
    default_value?: Serializable
    // If field data need transforming from API to frontend, provide a function here.
    // It is called in ApiResourceContextProvider, and may be called multiple times,
    // so it should handle receiving already transformed data.
    transformation?: (d: Serializable) => Serializable
    // If field represents a resource that should be included in the download
    // when the parent resource is downloaded, set this to true.
    fetch_in_download?: boolean
}
const always_fields: {[key: string]: Field} = {
    url: {readonly: true, type: "string"},
    permissions: {readonly: true, type: "object"},
}
const team_fields: {[key: string]: Field} = {
    team: {readonly: true, type: "galv_TEAM", createonly: true},
    validation_results: {readonly: true, type: "object", many: true},
}
const generic_fields: {[key: string]: Field} = {
    id: {readonly: true, type: "string"},
    ...always_fields,
}
const autocomplete_fields: {[key: string]: Field} = {
    url: {readonly: true, type: "string"},
    id: {readonly: true, type: "number"},
    value: {readonly: true, type: "string"},
    ld_value: {readonly: true, type: "string"},
}
/**
 * Lookup map to get the properties of the fields in each resource type.
 */
export const FIELDS = {
    [LOOKUP_KEYS.HARVESTER]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        lab: {readonly: true, type: "string", priority: PRIORITY_LEVELS.CONTEXT},
        last_check_in: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        last_check_in_job: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        sleep_time: {readonly: false, type: "number"},
        environment_variables: {readonly: true, type: "object"},
        active: {readonly: false, type: "boolean", priority: PRIORITY_LEVELS.CONTEXT},
    },
    [LOOKUP_KEYS.PATH]: {
        ...generic_fields,
        path: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        regex: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        stable_time: {readonly: false, type: "number"},
        active: {readonly: false, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
        maximum_partition_line_count: {readonly: false, type: "number"},
        harvester: {
            readonly: true,
            type: key_to_type(LOOKUP_KEYS.HARVESTER),
            priority: PRIORITY_LEVELS.SUMMARY,
            createonly: true,
            fetch_in_download: true
        },
        files: {readonly: true, type: key_to_type(LOOKUP_KEYS.FILE), many: true, priority: PRIORITY_LEVELS.SUMMARY},
        ...team_fields,
    },
    [LOOKUP_KEYS.PARQUET_PARTITION]: {
        ...generic_fields,
        observed_file: {readonly: true, type: key_to_type(LOOKUP_KEYS.FILE), priority: PRIORITY_LEVELS.SUMMARY},
        partition_number: {readonly: true, type: "number", priority: PRIORITY_LEVELS.IDENTITY},
        uploaded: {readonly: true, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
        upload_errors: {readonly: true, type: "string", many: true},
        parquet_file: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
    },
    [LOOKUP_KEYS.FILE]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        state: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        path: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        parser: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        harvester: {readonly: true, type: key_to_type(LOOKUP_KEYS.HARVESTER), priority: PRIORITY_LEVELS.SUMMARY},
        last_observed_size: {readonly: true, type: "number"},
        last_observed_time: {readonly: true, type: "string"},
        data_generation_date: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        inferred_format: {readonly: true, type: "string"},
        num_rows: {readonly: true, type: "number"},
        first_sample_no: {readonly: true, type: "number"},
        last_sample_no: {readonly: true, type: "number"},
        extra_metadata: {readonly: true, type: "string", priority: PRIORITY_LEVELS.HIDDEN},
        has_required_columns: {readonly: true, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
        upload_errors: {readonly: true, type: "string", many: true},
        column_errors: {readonly: true, type: "string", many: true},
        columns: {readonly: true, type: key_to_type(LOOKUP_KEYS.COLUMN), many: true, fetch_in_download: true},
        upload_info: {readonly: true, type: "string"},
        parquet_partitions: {readonly: true, type: key_to_type(LOOKUP_KEYS.PARQUET_PARTITION), many: true},
        applicable_mappings: {readonly: true, type: 'string', priority: PRIORITY_LEVELS.HIDDEN},
        mapping: {readonly: true, type: key_to_type(LOOKUP_KEYS.MAPPING), priority: PRIORITY_LEVELS.SUMMARY},
        summary: {readonly: true, type: "string", priority: PRIORITY_LEVELS.HIDDEN},
    },
    [LOOKUP_KEYS.MAPPING]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        is_valid: {readonly: true, type: "boolean", priority: PRIORITY_LEVELS.IDENTITY},
        map: {readonly: false, type: "object"},
        missing: {readonly: true, type: "number"},  // only appears as part of a FILE response
        ...team_fields
    },
    [LOOKUP_KEYS.COLUMN]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        name: {readonly: true, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        name_in_file: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        file: {readonly: true, type: key_to_type(LOOKUP_KEYS.FILE), priority: PRIORITY_LEVELS.CONTEXT},
        type: {readonly: false, type: key_to_type(LOOKUP_KEYS.COLUMN_FAMILY), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        values: {readonly: true, type: "string"},
    },
    [LOOKUP_KEYS.COLUMN_FAMILY]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        is_default: {readonly: true, type: "boolean"},
        is_required: {readonly: true, type: "boolean"},
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        data_type: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        unit: {readonly: false, type: key_to_type(LOOKUP_KEYS.UNIT), priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
        columns: {readonly: true, type: key_to_type(LOOKUP_KEYS.COLUMN), many: true, priority: PRIORITY_LEVELS.SUMMARY},
        ...team_fields
    },
    [LOOKUP_KEYS.UNIT]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        is_default: {readonly: true, type: "boolean"},
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        symbol: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        ...team_fields
    },
    [LOOKUP_KEYS.EXPERIMENT]: {
        title: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string"},
        authors: {readonly: false, type: key_to_type(LOOKUP_KEYS.USER), many: true, priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        protocol: {readonly: false, type: "string"},
        protocol_file: {readonly: false, type: "string"},
        cycler_tests: {readonly: false, type: key_to_type(LOOKUP_KEYS.CYCLER_TEST), many: true, priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
        ...team_fields,
    },
    [LOOKUP_KEYS.CYCLER_TEST]: {
        ...generic_fields,
        cell: {readonly: false, type: key_to_type(LOOKUP_KEYS.CELL), priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
        schedule: {readonly: false, type: key_to_type(LOOKUP_KEYS.SCHEDULE), priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
        equipment: {readonly: false, type: key_to_type(LOOKUP_KEYS.EQUIPMENT), many: true, priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
        rendered_schedule: {readonly: true, type: "string", many: true},
        ...team_fields,
    },
    [LOOKUP_KEYS.CELL]: {
        ...generic_fields,
        identifier: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        family: {readonly: false, type: key_to_type(LOOKUP_KEYS.CELL_FAMILY), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        ...team_fields,
        cycler_tests: {readonly: true, type: key_to_type(LOOKUP_KEYS.CYCLER_TEST), many: true},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.EQUIPMENT]: {
        ...generic_fields,
        identifier: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        family: {readonly: false, type: key_to_type(LOOKUP_KEYS.EQUIPMENT_FAMILY), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        ...team_fields,
        calibration_date: {readonly: false, type: "string"},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.SCHEDULE]: {
        ...generic_fields,
        family: {readonly: false, type: key_to_type(LOOKUP_KEYS.SCHEDULE_FAMILY), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        ...team_fields,
        schedule_file: {readonly: false, type: "string"},
        pybamm_schedule_variables: {readonly: false, type: "object"},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.CELL_FAMILY]: {
        ...generic_fields,
        ...team_fields,
        manufacturer: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.CELL_MANUFACTURER), priority: PRIORITY_LEVELS.IDENTITY},
        model: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.CELL_MODEL), priority: PRIORITY_LEVELS.IDENTITY},
        form_factor: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.CELL_FORM_FACTOR), priority: PRIORITY_LEVELS.CONTEXT},
        chemistry: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.CELL_CHEMISTRY), priority: PRIORITY_LEVELS.CONTEXT},
        cells: {readonly: true, type: "CELL", many: true, priority: PRIORITY_LEVELS.SUMMARY},
        nominal_voltage: {readonly: false, type: "number"},
        nominal_capacity: {readonly: false, type: "number"},
        initial_ac_impedance: {readonly: false, type: "number"},
        initial_dc_resistance: {readonly: false, type: "number"},
        energy_density: {readonly: false, type: "number"},
        power_density: {readonly: false, type: "number"},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: {
        ...generic_fields,
        ...team_fields,
        manufacturer: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.EQUIPMENT_MANUFACTURER), priority: PRIORITY_LEVELS.IDENTITY},
        model: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.EQUIPMENT_MODEL), priority: PRIORITY_LEVELS.IDENTITY},
        type: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.EQUIPMENT_TYPE), priority: PRIORITY_LEVELS.CONTEXT},
        equipment: {readonly: true, type: key_to_type(LOOKUP_KEYS.EQUIPMENT), many: true, priority: PRIORITY_LEVELS.SUMMARY},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: {
        ...generic_fields,
        ...team_fields,
        identifier: {readonly: false, type: key_to_type(AUTOCOMPLETE_KEYS.SCHEDULE_IDENTIFIER), priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string"},
        ambient_temperature: {readonly: false, type: "number"},
        pybamm_template: {readonly: false, type: "object"},
        schedules: {readonly: true, type: key_to_type(LOOKUP_KEYS.SCHEDULE), many: true, priority: PRIORITY_LEVELS.SUMMARY},
        in_use: {readonly: true, type: "boolean"},
    },
    [LOOKUP_KEYS.TEAM]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        lab: {readonly: true, type: key_to_type(LOOKUP_KEYS.LAB), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
        member_group: {
            readonly: false,
            type: key_to_type(LOOKUP_KEYS.USER),
            many: true,
            priority: PRIORITY_LEVELS.SUMMARY,
            fetch_in_download: true
        },
        admin_group: {
            readonly: false,
            type: key_to_type(LOOKUP_KEYS.USER),
            many: true,
            priority: PRIORITY_LEVELS.SUMMARY,
            fetch_in_download: true
        },
        monitored_paths: {readonly: true, type: key_to_type(LOOKUP_KEYS.PATH), many: true},
        cellfamily_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.CELL_FAMILY), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        cell_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.CELL), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        equipmentfamily_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.EQUIPMENT_FAMILY), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        equipment_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.EQUIPMENT), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        schedulefamily_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.SCHEDULE_FAMILY), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        schedule_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.SCHEDULE), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        cyclertest_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.CYCLER_TEST), many: true, priority: PRIORITY_LEVELS.CONTEXT},
        experiment_resources: {readonly: true, type: key_to_type(LOOKUP_KEYS.EXPERIMENT), many: true, priority: PRIORITY_LEVELS.CONTEXT},
    },
    [LOOKUP_KEYS.ARBITRARY_FILE]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        is_public: {readonly: false, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
        file: {
            readonly: true,
            createonly: true,
            type: "attachment",
            priority: PRIORITY_LEVELS.SUMMARY
        },
        team: team_fields.team,
    },
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        schema: {readonly: false, type: "object"},
        ...team_fields,
    },
    [LOOKUP_KEYS.LAB]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        admin_group: {
            readonly: false,
            type: key_to_type(LOOKUP_KEYS.USER),
            many: true,
            priority: PRIORITY_LEVELS.SUMMARY,
            fetch_in_download: true
        },
        s3_bucket_name: {readonly: false, type: "string"},
        s3_location: {readonly: false, type: "string"},
        s3_access_key: {readonly: false, type: "string"},
        s3_secret_key: {readonly: false, type: "string"},
        s3_custom_domain: {readonly: false, type: "string"},
        s3_configuration_status: {readonly: true, type: "object"},
        teams: {readonly: true, type: key_to_type(LOOKUP_KEYS.TEAM), many: true, priority: PRIORITY_LEVELS.SUMMARY},
        harvesters: {readonly: true, type: key_to_type(LOOKUP_KEYS.HARVESTER), many: true, priority: PRIORITY_LEVELS.SUMMARY},
    },
    [LOOKUP_KEYS.USER]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        username: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        email: {readonly: false, type: "string"},
        first_name: {readonly: false, type: "string"},
        last_name: {readonly: false, type: "string"},
        is_staff: {readonly: true, type: "boolean", priority: PRIORITY_LEVELS.HIDDEN},
        is_superuser: {readonly: true, type: "boolean"},
        groups: {readonly: true, type: "object", many: true, priority: PRIORITY_LEVELS.HIDDEN},
    },
    [LOOKUP_KEYS.TOKEN]: {
        ...always_fields,
        id: {readonly: true, type: "number"},
        name: {readonly: true, type: "string", createonly: true, priority: PRIORITY_LEVELS.IDENTITY},
        created: {readonly: true, type: "string"},
        expiry: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
    },
    [AUTOCOMPLETE_KEYS.CELL_MANUFACTURER]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CELL_MODEL]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CELL_FORM_FACTOR]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CELL_CHEMISTRY]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_TYPE]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MANUFACTURER]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EQUIPMENT_MODEL]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.SCHEDULE_IDENTIFIER]: autocomplete_fields,
} as const

/**
 * Names used by the backend to filter by each resource type.
 * E.g. to look up all cells in a cell family, we would filter using
 * the querystring `?family_id=id`.
 * It is the responsibility of the frontend to ensure that the
 * filter names are employed in the correct context --
 * cell, equipment, and schedule all share the 'family' filter,
 * so the url path must also be appropriate.
 export const FILTER_NAMES = {
 [LOOKUP_KEYS.CELL_FAMILY]: "family_id",
 [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "family_id",
 [LOOKUP_KEYS.SCHEDULE_FAMILY]: "family_id",
 [LOOKUP_KEYS.CELL]: "cell_id",
 [LOOKUP_KEYS.EQUIPMENT]: "equipment_id",
 [LOOKUP_KEYS.SCHEDULE]: "schedule_id",
 [LOOKUP_KEYS.TEAM]: "team_id",
 } as const
 */

/**
 * Lookup map to get the family lookup key for each resource type.
 */
export const FAMILY_LOOKUP_KEYS = {
    [LOOKUP_KEYS.CELL]: "CELL_FAMILY",
    [LOOKUP_KEYS.EQUIPMENT]: "EQUIPMENT_FAMILY",
    [LOOKUP_KEYS.SCHEDULE]: "SCHEDULE_FAMILY",
    [LOOKUP_KEYS.COLUMN]: "COLUMN_FAMILY",
} as const

export const get_has_family = (key: string|number): key is keyof typeof FAMILY_LOOKUP_KEYS =>
    Object.keys(FAMILY_LOOKUP_KEYS).includes(key as string)
/**
 * Lookup map to get the child lookup key for each resource family.
 */
export const CHILD_LOOKUP_KEYS = {
    [LOOKUP_KEYS.CELL_FAMILY]: "CELL",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "EQUIPMENT",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "SCHEDULE",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "COLUMN",
} as const

/**
 * Lookup map to get the child field name for each resource family.
 */
export const CHILD_PROPERTY_NAMES  = {
    [LOOKUP_KEYS.CELL_FAMILY]: "cells",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "equipment",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "schedules",
    [LOOKUP_KEYS.COLUMN_FAMILY]: "columns",
} as const

export const get_is_family = (key: string|number): key is keyof typeof CHILD_PROPERTY_NAMES =>
    Object.keys(CHILD_PROPERTY_NAMES).includes(key as string)

export const INTRODUCTIONS = {
    [LOOKUP_KEYS.HARVESTER]: `
Harvesters are responsible for collecting data from external sources.
Each harvester belongs to a [lab](${PATHS[LOOKUP_KEYS.LAB]}), and any team within that lab can set up a [monitored path](${PATHS[LOOKUP_KEYS.PATH]}) for it.

Harvesters cannot be created here, but you can view and edit their settings.

Harvesters are created and managed by running a Python script on a computer with access to the data source.
See the [harvester repository](https://github.com/Battery-Intelligence-Lab/galv-harvester) for more information on creating harvesters.

You can see all the harvesters that belong to your [labs](${PATHS[LOOKUP_KEYS.LAB]}).
    `,
    [LOOKUP_KEYS.PATH]: `
Monitored paths are responsible for collecting data from external sources.
Paths are file paths on a computer running a [harvester](${PATHS[LOOKUP_KEYS.HARVESTER]}).
Harvesters are owned by a lab, and any team member within that lab can set up a path for it.

As paths are crawled by the harvester, any files that match the path and regex will be added to the database.
When a file maintains a stable size for a given period of time, its data content will be uploaded.
The harvester will also monitor the path for new files, and upload them as they appear.

You can see all the paths that have been set up by your team.
    `,
    [LOOKUP_KEYS.PARQUET_PARTITION]: `
Parquet partitions are the individual partitions of a parquet file.
They are created when a [file](${PATHS[LOOKUP_KEYS.FILE]}) is uploaded to the database.
    `,
    [LOOKUP_KEYS.FILE]: `
Files are data files produced by battery cycler machines (or simulations of them).
Files are collected when [harvesters](${PATHS[LOOKUP_KEYS.HARVESTER]}) crawl [monitored paths](${PATHS[LOOKUP_KEYS.PATH]}).

The data in each file is parsed and uploaded to the database.
Files are required to have, at minimum, columns for "ElapsedTime_s", "Voltage_V", and "Current_A".

You can see all the files that have been collected on [monitored paths](${PATHS[LOOKUP_KEYS.PATH]}) created by your team.
    `,
    [LOOKUP_KEYS.COLUMN_FAMILY]: `
Column types identify the type of data in a column of a [file](${PATHS[LOOKUP_KEYS.FILE]}).

They associate a column with a [unit](${PATHS[LOOKUP_KEYS.UNIT]}).
    `,
    [LOOKUP_KEYS.COLUMN]: `
Columns are the individual data columns in a [file](${PATHS[LOOKUP_KEYS.FILE]}).

Each column has a [column type](${PATHS[LOOKUP_KEYS.COLUMN_FAMILY]}), which defines the type of data in the column.
    `,
    [LOOKUP_KEYS.UNIT]: `
Units are the units of measurement used in the data in a [file](${PATHS[LOOKUP_KEYS.FILE]}).
    `,
    [LOOKUP_KEYS.CELL_FAMILY]: `
Cell families are collections of [cells](${PATHS[LOOKUP_KEYS.CELL]}) that share some common properties.

A [cell](${PATHS[LOOKUP_KEYS.CELL]}) will have all the properties of the family it belongs to, but it can override them if the property is declared on the cell itself.
    `,
    [LOOKUP_KEYS.CELL]: `
Cells are the basic unit of a battery.
Each [cycler test](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}) is performed on a single cell.

Cells are organised into [cell families](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}), which define their properties.
Most properties of a cell are inherited from its family, but they can be overridden on the cell itself.

For most cells, you'll probably only want to set the identifier and family.
    `,
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: `
Equipment families are collections of [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}) that share some common properties.

[Equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}) will have all the properties of the family it belongs to, but it can override them if the property is declared on the equipment itself.
    `,
    [LOOKUP_KEYS.EQUIPMENT]: `
Equipment resources describe any and all pieces of equipment that are relevant to the battery [cycler tests](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}).
This includes the cycler itself, but also any other equipment that is used to perform the test,
for example a temperature chamber or a power supply.

Equipment is organised into [equipment families](${PATHS[LOOKUP_KEYS.EQUIPMENT_FAMILY]}), which define their properties.
Most properties of an equipment are inherited from its family, but they can be overridden on the equipment itself.
    `,
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: `
Schedule families are collections of [schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}) that share some common properties.

[Schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}) will have all the properties of the family it belongs to, but it can override them if the property is declared on the schedule itself.

Schedule families' schedule templates can contain variables that are replaced with values when a schedule is created.
Those variables can be set by variables in the schedule itself,
in the [family](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}) of the cell being tested, 
or in the individual [cell](${PATHS[LOOKUP_KEYS.CELL]}) being tested.
The order of priority is cell (highest), cell family, schedule (lowest).
    `,
    [LOOKUP_KEYS.SCHEDULE]: `
Schedules are the instructions for a battery [cycler test](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}).
They define the pattern of charging and discharging, and the ambient temperature.

Schedules are organised into [schedule families](${PATHS[LOOKUP_KEYS.SCHEDULE_FAMILY]}), which define their properties.
Most properties of a schedule are inherited from its family, but they can be overridden on the schedule itself.

Schedules can specify values for variables in their family's template.
Those values can be overridden if the same variable is set in the [family](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}) of the cell being tested,
or in the individual [cell](${PATHS[LOOKUP_KEYS.CELL]}) being tested.
    `,
    [LOOKUP_KEYS.EXPERIMENT]: `
Experiments are collections of [cycler tests](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}) that share some common properties.

Typically, a single experiment will be performed on a single cell family, 
using a variety of different schedules that seek to characterise different properties of the cells.

Experiments will group together the metadata (e.g. 
[authors](${PATHS[LOOKUP_KEYS.USER]}), 
[cells](${PATHS[LOOKUP_KEYS.CELL]}), 
[schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}), 
[equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]})) 
of the tests they contain,
alongside the actual data produced (see [files](${PATHS[LOOKUP_KEYS.FILE]})).
    `,
    [LOOKUP_KEYS.CYCLER_TEST]: `
Cycler tests are the basic unit of battery testing.
Each test is performed on a single [cell](${PATHS[LOOKUP_KEYS.CELL]}), using a single [schedule](${PATHS[LOOKUP_KEYS.SCHEDULE]}).
The test may also use multiple pieces of [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}).
The tests describe the conditions under which the cell was tested, and the data produced by the test.

Cycler tests can be grouped into [experiments](${PATHS[LOOKUP_KEYS.EXPERIMENT]}).
    `,
    [LOOKUP_KEYS.ARBITRARY_FILE]: `
Attachments are files that are relevant to the battery testing process, but are not produced by the cycler.
They may be used to store the protocol for an experiment, or the datasheet for a piece of equipment.
    `,
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: `
Validation schemas are used to validate the data in [files](${PATHS[LOOKUP_KEYS.FILE]}).
They are also used to validate the metadata in the other resources.

Validation schemas are JSON schemas, and can be used to validate any JSON data.

By default, Galv applies a loose validation schema to all data, which ensures that the data is valid JSON.
The schema checks that data has the minimal required columns of "time", "potential difference", and "current".
    `,
    [LOOKUP_KEYS.LAB]: `
Labs are the top-level organisational unit in Galv.
Labs are collections of [teams](${PATHS[LOOKUP_KEYS.TEAM]}), which in turn contain all the resources in Galv.

You are a member of any lab that contains a team you are a member of.

Lab administrators can create new teams, and manage the permissions of existing teams.
They cannot create or edit any other resources, unless they are also a member of a team.

Labs can specify their own S3 bucket, which is used to store the data files collected by the harvesters.
    `,
    [LOOKUP_KEYS.TEAM]: `
Teams are the basic organisational unit in Galv.
Teams are collections of [users](${PATHS[LOOKUP_KEYS.USER]}), and own the resources in Galv.

The team that owns a resource can alter its permissions, and can delete it.

Teams have two groups of users: members and admins.
Members can view and edit all resources owned by the team unless those resources have been restricted.
Admins can do everything members can, and can also alter the permissions of the team.
    `,
    [LOOKUP_KEYS.USER]: `
Users are the people who use Galv.
Each user has a username, email address, and password.

Users can be members of multiple [teams](${PATHS[LOOKUP_KEYS.TEAM]}).

You can see and edit your own user details here.
    `,
    [LOOKUP_KEYS.TOKEN]: `
Tokens are used to authenticate with Galv.

Tokens are created by users, and can be used to authenticate with Galv's API.
You'll also see Browser session tokens which are created automatically when you log in.

If you want to use the API, you'll need to create a token.
    `,
    DASHBOARD: `
The dashboard shows a summary of the resources that are relevant to you.

It shows the [files](${PATHS[LOOKUP_KEYS.FILE]}) that have been collected on 
[monitored paths](${PATHS[LOOKUP_KEYS.PATH]}) created by your [teams](${PATHS[LOOKUP_KEYS.TEAM]}),
alongside an indication of their upload and validation status.

You'll also see a list of the resources you are able to edit, 
alongside an indication of their validation status.

If you see problems on your dashboard, you should check the relevant resource for more information.
    `,
    MAPPING: `
Mappings are used to map the columns in a [file](${PATHS[LOOKUP_KEYS.FILE]}) to the columns in the database.

This allows Galv to understand the data in the file, and to store it in the database.
When a suite of files use the same column names to represent the same kind of data,
analyses can be performed across all the files.
    `,
} as const
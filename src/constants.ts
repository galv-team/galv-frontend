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
import SdStorageIcon from '@mui/icons-material/SdStorage';

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
    ArbitraryFilesApi, ColumnTypesApi, UnitsApi,
    ColumnMappingsApi,
    GalvStorageApi,
    AdditionalStorageApi,
} from "@galv/galv";
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

export const DEFAULT_FETCH_LIMIT = 10

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
    GALV_STORAGE: "GALV_STORAGE",
    ADDITIONAL_STORAGE: "ADDITIONAL_STORAGE",
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
    STORAGE: SdStorageIcon,
    [LOOKUP_KEYS.GALV_STORAGE]: SdStorageIcon,
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: SdStorageIcon,
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
    validation_status_INPUT_REQUIRED: PendingIcon,
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
    [LOOKUP_KEYS.GALV_STORAGE]: "/galv_storage",
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: "/additional_storage",
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
    [LOOKUP_KEYS.GALV_STORAGE]: "Galv Storage",
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: "Additional Storage",
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
    [LOOKUP_KEYS.GALV_STORAGE]: "Galv Storage",
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: "Additional Storage",
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
    [LOOKUP_KEYS.GALV_STORAGE]: GalvStorageApi,
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: AdditionalStorageApi,
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
    [LOOKUP_KEYS.GALV_STORAGE]: "galvStorage",
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: "additionalStorage",
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
        last_check_in: {readonly: true, type: "datetime", priority: PRIORITY_LEVELS.SUMMARY},
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
        parquet_file: {readonly: true, type: "attachment", priority: PRIORITY_LEVELS.SUMMARY},
    },
    [LOOKUP_KEYS.FILE]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        state: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        path: {readonly: true, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
        parser: {readonly: true, type: "string"},
        harvester: {readonly: true, type: key_to_type(LOOKUP_KEYS.HARVESTER)},
        last_observed_size: {readonly: true, type: "number"},
        last_observed_time: {readonly: true, type: "datetime"},
        data_generation_date: {readonly: true, type: "datetime", priority: PRIORITY_LEVELS.SUMMARY},
        inferred_format: {readonly: true, type: "string"},
        num_rows: {readonly: true, type: "number"},
        first_sample_no: {readonly: true, type: "number"},
        last_sample_no: {readonly: true, type: "number"},
        extra_metadata: {readonly: true, type: "string", priority: PRIORITY_LEVELS.HIDDEN},
        has_required_columns: {readonly: true, type: "boolean"},
        upload_errors: {readonly: true, type: "string", many: true},
        column_errors: {readonly: true, type: "string", many: true},
        upload_info: {readonly: true, type: "string"},
        parquet_partitions: {readonly: true, type: key_to_type(LOOKUP_KEYS.PARQUET_PARTITION), many: true},
        applicable_mappings: {readonly: true, type: 'string', priority: PRIORITY_LEVELS.HIDDEN},
        mapping: {readonly: true, type: key_to_type(LOOKUP_KEYS.MAPPING)},
        summary: {readonly: true, type: "string", priority: PRIORITY_LEVELS.HIDDEN},
    },
    [LOOKUP_KEYS.MAPPING]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        is_valid: {readonly: true, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
        map: {readonly: false, type: "object"},
        missing: {readonly: true, type: "number"},  // only appears as part of a FILE response
        ...team_fields
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
        files: {readonly: false, type: key_to_type(LOOKUP_KEYS.FILE), many: true, priority: PRIORITY_LEVELS.SUMMARY, fetch_in_download: true},
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
        lab: {readonly: true, createonly: true, type: key_to_type(LOOKUP_KEYS.LAB), priority: PRIORITY_LEVELS.CONTEXT, fetch_in_download: true},
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
        lab: {readonly: true, type: key_to_type(LOOKUP_KEYS.LAB), priority: PRIORITY_LEVELS.CONTEXT},
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        description: {readonly: false, type: "string", priority: PRIORITY_LEVELS.SUMMARY},
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
        storages: {readonly: true, type: key_to_type(LOOKUP_KEYS.ADDITIONAL_STORAGE), many: true},
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
        expiry: {readonly: true, type: "datetime", priority: PRIORITY_LEVELS.SUMMARY},
    },
    [LOOKUP_KEYS.GALV_STORAGE]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        lab: {readonly: true, type: key_to_type(LOOKUP_KEYS.LAB), priority: PRIORITY_LEVELS.CONTEXT},
        quota: {readonly: true, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        bytes_used: {readonly: true, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        priority: {readonly: false, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        enabled: {readonly: false, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
    },
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: {
        ...generic_fields,
        name: {readonly: false, type: "string", priority: PRIORITY_LEVELS.IDENTITY},
        lab: {readonly: true, createonly: true, type: key_to_type(LOOKUP_KEYS.LAB), priority: PRIORITY_LEVELS.CONTEXT},
        quota: {readonly: false, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        bytes_used: {readonly: true, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        priority: {readonly: false, type: "number", priority: PRIORITY_LEVELS.SUMMARY},
        bucket_name: {readonly: false, type: "string"},
        location: {readonly: false, type: "string"},
        access_key: {readonly: false, type: "string"},
        secret_key: {readonly: false, type: "string"},
        region_name: {readonly: false, type: "string"},
        custom_domain: {readonly: false, type: "string"},
        enabled: {readonly: false, type: "boolean", priority: PRIORITY_LEVELS.SUMMARY},
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
} as const

/**
 * Lookup map to get the child field name for each resource family.
 */
export const CHILD_PROPERTY_NAMES  = {
    [LOOKUP_KEYS.CELL_FAMILY]: "cells",
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: "equipment",
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: "schedules",
} as const

export const get_is_family = (key: string|number): key is keyof typeof CHILD_PROPERTY_NAMES =>
    Object.keys(CHILD_PROPERTY_NAMES).includes(key as string)

export const INTRODUCTIONS = {
    [LOOKUP_KEYS.HARVESTER]: `
Harvesters are specialized tools designed to gather data from external sources. 
Each harvester is associated with a [lab](${PATHS[LOOKUP_KEYS.LAB]}), 
and any team within that lab can configure a [monitored path](${PATHS[LOOKUP_KEYS.PATH]}) for it.

To create a new harvester, you can utilize a Python script on a computer with access to the desired data source. 
Visit the [harvester repository](https://github.com/galv-team/galv-harvester) for detailed instructions on setting up and configuring harvesters. 
You will need the following information:

1. Server URL: \`${process.env.VITE_GALV_API_BASE_URL}\`
2. API token: Generate a new token in the [token section](${PATHS[LOOKUP_KEYS.TOKEN]})

Below, you can view all the harvesters that are associated with your [labs](${PATHS[LOOKUP_KEYS.LAB]}).
    `,
    [LOOKUP_KEYS.PATH]: `
Monitored paths collect data from external sources via file paths on 
[harvester-running](${PATHS[LOOKUP_KEYS.HARVESTER]}) computers. Lab members can set up paths for their lab's 
harvesters. Matching files are added to the database when:

1. They match the path and specified regex
2. They're not hidden (don't start with a dot)
3. Their size remains stable for the specified duration

Harvesters continuously monitor paths, uploading new files as they appear.
You can see all the paths that have been set up by your team below.
    `,
    [LOOKUP_KEYS.PARQUET_PARTITION]: `
Parquet partitions are the individual partitions of a parquet file.
They are created when a [file](${PATHS[LOOKUP_KEYS.FILE]}) is uploaded to the database.
    `,
    [LOOKUP_KEYS.FILE]: `
Files are data files produced by battery cyclers, simulations, or any combination of them.
Files are collected when [harvesters](${PATHS[LOOKUP_KEYS.HARVESTER]}) crawl [monitored paths](${PATHS[LOOKUP_KEYS.PATH]}).

The data in each file is parsed either automatically if it matches one of the predefined [mapping](${PATHS[LOOKUP_KEYS.MAPPING]}) or manually with a prompt if a mapping is not found.
Parsed files are then uploaded to the database, where metadata can be attached and the data can be downloaded.
Files are required to have, at minimum, columns for "ElapsedTime_s", "Voltage_V", and "Current_A".

You can see all the files that have been collected on [monitored paths](${PATHS[LOOKUP_KEYS.PATH]}) created by your team.
    `,
    [LOOKUP_KEYS.COLUMN_FAMILY]: `
Column types serve as identifiers for the data type present in a specific column of a [file](${PATHS[LOOKUP_KEYS.FILE]}). 
They establish a connection between a column and its corresponding [unit](${PATHS[LOOKUP_KEYS.UNIT]}), enabling accurate interpretation and analysis of the data.

When new column types are added or existing ones are modified, the mapping selection for columns in the associated [file](${PATHS[LOOKUP_KEYS.FILE]}) is automatically updated. 
This dynamic updating mechanism ensures that the column mappings remain aligned with the defined column types.
    `,
    [LOOKUP_KEYS.UNIT]: `
Units represent the specific units of measurement employed to quantify and express the data contained within a [file](${PATHS[LOOKUP_KEYS.FILE]}). 
These units provide the necessary context and scale for interpreting and understanding the numerical values present in the data.
    `,
    [LOOKUP_KEYS.CELL_FAMILY]: `
Cell families are collections of [cells](${PATHS[LOOKUP_KEYS.CELL]}) that share some common properties.

A [cell](${PATHS[LOOKUP_KEYS.CELL]}) will have all the properties of the family it belongs to, but it can override them if the property is declared on the cell itself.
    `,
    [LOOKUP_KEYS.CELL]: `
Cells represent the fundamental instance of a battery within the Galv ecosystem. 
Each [cycler test](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}) is conducted on a single cell.

Cells are organised into [cell families](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}), which define their shared properties and characteristics. 
Most properties of an individual cell are inherited from its associated family, promoting consistency and standardization across related cells. 
However, if necessary, these inherited properties can be overridden or customized at the individual cell level.

For the majority of cells, it is likely that only the identifier and family information will need to be specified. 
This streamlined approach simplifies the process of managing and tracking individual cells while leveraging the inherited properties defined by their respective cell families.
    `,
    [LOOKUP_KEYS.EQUIPMENT_FAMILY]: `
Equipment families serve as logical groupings for [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}) resources that share common properties or characteristics. 
They provide an organisational framework for managing and categorizing equipment within the Galv ecosystem.
Each individual [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}) resource inherits the properties defined by the equipment family it belongs to. 
This inheritance mechanism ensures consistency and standardisation across related equipment resources.
However, if a specific property is explicitly declared at the individual equipment level, it takes precedence and overrides the inherited value from the family. 
This flexibility allows for customisation and accommodation of unique equipment characteristics or configurations when necessary.
    `,
    [LOOKUP_KEYS.EQUIPMENT]: `
Equipment resources in the Galv ecosystem encompass a comprehensive description of all pieces of equipment relevant to battery [cycler tests](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}). 
This includes not only the cycler itself but also any ancillary equipment utilized during the testing process, such as temperature chambers, power supplies, or other auxiliary devices.

These equipment resources are organized into [equipment families](${PATHS[LOOKUP_KEYS.EQUIPMENT_FAMILY]}), which define their shared properties and characteristics. 
Most properties of an individual equipment resource are inherited from its associated family, ensuring consistency and standardisation. 
However, if necessary, these inherited properties can be overridden or customized at the individual equipment level.

By maintaining a centralized repository of equipment resources and their associated families, researchers can efficiently manage and track the various components involved in their cycler tests. 
This organisational structure facilitates accurate documentation, reproducibility, and effective collaboration within the Galv platform.
    `,
    [LOOKUP_KEYS.SCHEDULE_FAMILY]: `
Schedule families are logical groupings of [schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}) that share common properties or characteristics. 
They serve as a organisational framework for managing and categorising schedules within the Galv ecosystem.

Each [schedule](${PATHS[LOOKUP_KEYS.SCHEDULE]}) inherits the properties defined by the schedule family it belongs to. 
However, if a specific property is explicitly declared at the individual schedule level, it takes precedence and overrides the inherited value from the family.

Schedule families define schedule templates that can contain variables. 
These variables are dynamically replaced with specific values when a schedule is created and applied to a cycler test. 
The values used to replace these variables can be derived from multiple sources, following a predefined order of priority:

1. Individual [cell](${PATHS[LOOKUP_KEYS.CELL]}) being tested (highest priority)
2. [Family](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}) of the cell being tested
3. Individual schedule (lowest priority)

This hierarchical variable replacement mechanism ensures that the most specific and relevant values are used for each cycler test, while maintaining a consistent and organised structure defined by the schedule families and templates.

By leveraging schedule families and their templates, researchers can efficiently manage and customize testing procedures, while ensuring standardisation and reproducibility across related experiments within the Galv platform.
    `,
    [LOOKUP_KEYS.SCHEDULE]: `
Schedules serve as the instructions that govern the execution of battery [cycler tests](${PATHS[LOOKUP_KEYS.CYCLER_TEST]}). 
They define the specific pattern of charging and discharging cycles, as well as the ambient temperature conditions under which the tests are conducted.

Schedules are organized into [schedule families](${PATHS[LOOKUP_KEYS.SCHEDULE_FAMILY]}), which define their shared properties and characteristics. 
Most properties of a schedule are inherited from its associated family, but they can be overridden or customized at the individual schedule level if necessary.

Additionally, schedules can specify values for variables defined within their families template. 
These variable values can be further overridden or superseded by values set in the [family](${PATHS[LOOKUP_KEYS.CELL_FAMILY]}) of the cell being tested or in the individual [cell](${PATHS[LOOKUP_KEYS.CELL]}) itself. 
This hierarchical overriding mechanism allows for flexibility and customization while maintaining a consistent and organized structure.

The ability to define and customize schedules, combined with the inheritance and overriding mechanisms, enables researchers to tailor testing procedures to specific experimental requirements or cell characteristics, while still maintaining a standardized and reproducible framework within the Galv ecosystem.
    `,
    [LOOKUP_KEYS.EXPERIMENT]: `
They serve as a logical grouping mechanism for related tests conducted under similar conditions or with shared objectives.

Typically, a single experiment is performed on a specific cell family, employing a variety of different [schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}) designed to characterise and evaluate different properties or aspects of the cells under investigation.

Within an experiment, the metadata associated with the constituent tests is consolidated. 
This includes information about the [authors](${PATHS[LOOKUP_KEYS.USER]}) involved, the specific [cells](${PATHS[LOOKUP_KEYS.CELL]}) tested, the [schedules](${PATHS[LOOKUP_KEYS.SCHEDULE]}) employed, and the [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}) utilised during the testing process. 
Additionally, the actual data produced by these tests, in the form of [files](${PATHS[LOOKUP_KEYS.FILE]}), is also organised and associated with the respective experiment.

By grouping related cycler tests into experiments, researchers can efficiently manage and analyze data from multiple tests conducted under similar conditions or with shared objectives. 
This organizational structure facilitates collaboration, data sharing, and comprehensive analysis within the Galv platform.
    `,
    [LOOKUP_KEYS.CYCLER_TEST]: `
Cycler tests represent the fundamental application of battery testing within the Galv ecosystem. 
Each test is conducted on a single [cell](${PATHS[LOOKUP_KEYS.CELL]}) and follows a specific [schedule](${PATHS[LOOKUP_KEYS.SCHEDULE]}) that outlines the testing parameters and procedures. 
Additionally, a cycler test may involve the use of multiple pieces of [equipment](${PATHS[LOOKUP_KEYS.EQUIPMENT]}, such as cyclers, temperature chambers, or other auxiliary devices.

The cycler test encapsulates the conditions under which the cell was tested, as well as the resulting data generated during the testing process. 
These tests provide a comprehensive record of the experimental setup, testing parameters, and the acquired data, ensuring traceability and reproducibility.

Furthermore, cycler tests can be logically grouped into [experiments](${PATHS[LOOKUP_KEYS.EXPERIMENT]}), allowing researchers to organise and manage related tests under a common umbrella. 
This hierarchical structure facilitates efficient data management, analysis, and collaboration within the Galv platform.
    `,
    [LOOKUP_KEYS.ARBITRARY_FILE]: `
Attachments are files that are related to the battery testing process but are not directly generated by the cycling equipment itself. 
These files can serve various purposes, such as storing experimental protocols, equipment datasheets, or any other supplementary information relevant to the testing procedures.

By incorporating attachments, researchers can maintain a comprehensive record of all pertinent details associated with their battery experiments. 
This includes detailed experimental protocols outlining the specific steps and parameters employed during the testing process, as well as technical specifications and datasheets for the equipment utilised.

The ability to attach these supplementary files within the Galv ecosystem promotes transparency, reproducibility, and effective collaboration. 
Researchers can easily share and access the necessary contextual information alongside the experimental data, facilitating a more comprehensive understanding of the testing conditions and methodologies employed.
    `,
    [LOOKUP_KEYS.VALIDATION_SCHEMA]: `
Validation schemas serve as powerful tools for ensuring the integrity and consistency of data within [files](${PATHS[LOOKUP_KEYS.FILE]}) and validating the metadata associated with other resources in the Galv ecosystem.

These validation schemas are defined using the JSON Schema specification, a widely adopted standard for describing and validating JSON data structures. 
This flexible format enables the creation of schemas capable of validating any JSON data, regardless of its complexity or structure.

By default, Galv applies a loose validation schema to all data, ensuring adherence to the fundamental requirement of being valid JSON. 
Additionally, this default schema checks for the presence of the minimal required columns: "time", "potential difference", and "current" – essential columns for most battery cycling experiments and analyses.

However, users have the flexibility to define and apply more stringent validation schemas tailored to their specific needs. 
These custom schemas can enforce additional constraints, such as data types, value ranges, and complex relationships between different fields. 
By applying these validation schemas, users can ensure that their data adheres to predefined standards and conventions, facilitating consistent and reliable analyses across different datasets.
    `,
    [LOOKUP_KEYS.LAB]: `
Labs are the top-level organizational units in Galv, composed of [teams](${PATHS[LOOKUP_KEYS.TEAM]}) that contain all resources. 
Your lab membership is determined by your affiliation with teams within that lab. 
Lab administrators can create new teams and manage existing team permissions, but cannot directly manage resources unless they are team members.

Labs house data from battery cycling experiments, which can be automatically collected by [harvesters](${PATHS[LOOKUP_KEYS.HARVESTER]}). 
The collected data are stored in Galv's systems or an [additional storage resource](${PATHS[LOOKUP_KEYS.ADDITIONAL_STORAGE]}) managed by the lab, allowing flexibility for large datasets or specific storage requirements.

While raw data files are stored in designated locations, associated metadata is stored in Galv's database and can be opened for collaboration within or between labs, facilitating data sharing and collaborative research efforts.
Proper management of lab structures, team memberships, and access permissions is crucial for maintaining a secure and efficient collaborative environment within the Galv ecosystem.
    `,
    [LOOKUP_KEYS.TEAM]: `
Teams are the fundamental organisational units within the Galv platform. 
They serve as collaborative spaces where [users](${PATHS[LOOKUP_KEYS.USER]}) can work together and manage shared resources.
Each team is composed of a collection of users, and they collectively own and have control over the resources within Galv. 
The team that owns a particular resource has the authority to alter its permissions and, if necessary, delete it.

**Members** have the ability to view and edit all resources owned by the team, unless specific restrictions have been applied to certain resources. 
This collaborative access allows team members to work seamlessly on shared projects and data.

**Administrators**, on the other hand, possess additional privileges beyond those of regular members. 
In addition to the viewing and editing capabilities, admins can also alter the team's permissions, granting or revoking access to resources as needed. 
This level of control enables administrators to manage the team's structure, membership, and resource access effectively.

It's important to note that team membership and roles should be carefully managed to ensure the appropriate level of access and collaboration within the Galv ecosystem. 
Best practices include periodically reviewing team memberships, assigning roles based on project needs, and implementing access controls to protect sensitive data when necessary.
    `,
    [LOOKUP_KEYS.USER]: `
Users are individuals who interact with and utilise the Galv platform. 
Each user is identified by a unique username, an associated email address, and a secure password.

One of the key features of Galv is its support for team-based collaboration. 
Users can be members of multiple [teams](${PATHS[LOOKUP_KEYS.TEAM]}), enabling them to work together on projects, share resources, and coordinate efforts effectively.

In this section, you can view and modify your own user details. 
This includes updating your personal information, such as your email address or password, as well as managing your team memberships. 

It's important to note that user accounts and associated information should be treated with care, as they grant access to sensitive data and resources within the Galv platform. 
Best practices include using strong and unique passwords, and regularly reviewing and updating your user details to maintain a secure and reliable user experience.
    `,
    [LOOKUP_KEYS.TOKEN]: `
Tokens can be created by users and are utilised for authenticating with Galv's API. 
This allows programmatic access and integration with Galv's services. 
Additionally, you'll see Browser session tokens, which are automatically generated when you log in to the Galv web interface, facilitating seamless authentication for your browser sessions.

If you plan to interact with Galv's API, either through custom applications or scripts, you'll need to create a dedicated token. 
These tokens act as secure credentials, granting authorized access to the API endpoints and enabling you to perform various operations programmatically.

It's important to note that tokens should be treated with care and kept confidential, as they grant access to your Galv account and associated resources. 
Best practices include generating tokens with appropriate scopes and permissions, and revoking or regenerating them periodically to maintain a high level of security.
    `,
    [LOOKUP_KEYS.GALV_STORAGE]: `
Storage in Galv is utilised for various purposes, including storing harvested data files, attachments, and generating image previews of datasets. 
This storage functionality is essential for efficient data management and collaboration within the platform.

Galv provides a default storage resource, referred to as Galv storage. 
This storage is hosted on the Galv server instance, and each lab is allocated a specific storage quota. 
This default storage option offers a convenient and centralized solution for managing data within the Galv ecosystem.

However, if you prefer not to store files on the Galv server, you have the option to disable Galv storage and set up an [additional storage resource](${PATHS[LOOKUP_KEYS.ADDITIONAL_STORAGE]}). 
This alternative storage resource can be hosted and managed according to your specific requirements, providing greater flexibility and control over data storage.

In scenarios where you are at risk of exceeding your allocated storage quota on the Galv server, you can proactively set up an [additional storage resource](${PATHS[LOOKUP_KEYS.ADDITIONAL_STORAGE]}) to accommodate the excess data. 
This approach ensures that you can seamlessly continue storing and managing your data without disruptions or limitations.

The priority setting determines the order in which the available storage resources are utilized for storing data. 
Higher priority numbers are used first, allowing you to define the preferred storage location based on your specific needs and preferences.
    `,
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: `
Storage is utilised for harvested data files, attachments, and image previews of datasets.

Additional storage resources can be used for data uploaded to Galv, with the location managed by the Lab. 
You may consider using additional storage if you have a large amount of data to store or if you prefer to store your data in a location you can administer directly.

You have the option to set a quota for the storage resource, ensuring that your teams do not accidentally exceed any storage limits you may have in place.

The priority setting determines the order in which the storage resources are utilised for storing data. Higher priority numbers are used first.
    `,
    DASHBOARD: `
The dashboard provides an overview of the resources pertinent to you and your teams. 

It displays the [files](${PATHS[LOOKUP_KEYS.FILE]}) gathered from the [monitored paths](${PATHS[LOOKUP_KEYS.PATH]}) 
set up by your [teams](${PATHS[LOOKUP_KEYS.TEAM]}), along with their respective upload and validation statuses.

Additionally, the dashboard lists the resources you have permission to edit, accompanied by their validation statuses.

In the event you encounter any issues on your dashboard, you can investigate the relevant resource for more detailed information.
    `,
    MAPPING: `
Mappings are utilised to map the columns in a [file](${PATHS[LOOKUP_KEYS.FILE]}) to recognised standard columns. 
This enables Galv to comprehend the data within the file and promotes homogeneity across datasets. 
When a set of files employs the same column names to represent the same type of data, analyses can be performed across all the files.

Mappings can be automatically applied to files during the harvesting process by a [harvester](${PATHS[LOOKUP_KEYS.HARVESTER]}). 
If there is a clear 'best mapping' for a file, it will be applied automatically. 
However, if there are multiple equally suitable mappings, the user will need to choose a mapping or define a more appropriate one.

Mappings are ranked based on the following criteria:
- Whether they define the three key columns: "ElapsedTime_s", "Voltage_V", and "Current_A".
- Whether all the columns in the mapping are present in the file.
- The number of columns in the file that are not included in the mapping. Fewer unmatched columns are preferred.

By applying the above criteria, the best mapping is selected. A mapping will never be considered 'best' if it does not define the three key columns.

When creating mappings, be cautious of potential conflicts where two mappings are equally suitable. In such cases, all affected files will require manual disambiguation to choose the correct mapping.
    `,
} as const
import {
    MdAddCircle,
    MdAssignment,
    MdAttachFile,
    MdBatchPrediction,
    MdBatteryFull,
    MdCancel,
    MdCheckCircle,
    MdCloudSync,
    MdCompareArrows,
    MdDatasetLinked,
    MdDelete,
    MdDownload,
    MdError,
    MdExpandLess,
    MdExpandMore,
    MdExtension,
    MdFolder,
    MdForkRight,
    MdHideSource,
    MdHolidayVillage,
    MdHome,
    MdInfo,
    MdLogout,
    MdManageAccounts,
    MdMultilineChart,
    MdPending,
    MdPeopleAlt,
    MdPerson,
    MdPoll,
    MdPrecisionManufacturing,
    MdSave,
    MdSchema,
    MdSdStorage,
    MdSplitscreen,
    MdSubscript,
    MdVpnKey,
    MdWarning,
} from 'react-icons/md'

import {
    AdditionalS3StorageType,
    AdditionalStorageApi,
    AdditionalStorageApiFp,
    ArbitraryFile,
    ArbitraryFilesApi,
    ArbitraryFilesApiFp,
    Cell,
    CellChemistriesApi,
    CellChemistriesApiFp,
    CellFamiliesApi,
    CellFamiliesApiFp,
    CellFamily,
    CellFormFactorsApi,
    CellFormFactorsApiFp,
    CellManufacturersApi,
    CellManufacturersApiFp,
    CellModelsApi,
    CellModelsApiFp,
    CellsApi,
    CellsApiFp,
    ColumnMapping,
    ColumnMappingsApi,
    ColumnMappingsApiFp,
    ColumnTypesApi,
    ColumnTypesApiFp,
    CyclerTest,
    CyclerTestsApi,
    CyclerTestsApiFp,
    DataColumnType,
    DataUnit,
    Equipment,
    EquipmentApi,
    EquipmentApiFp,
    EquipmentFamiliesApi,
    EquipmentFamiliesApiFp,
    EquipmentFamily,
    EquipmentManufacturersApi,
    EquipmentManufacturersApiFp,
    EquipmentModelsApi,
    EquipmentModelsApiFp,
    EquipmentTypesApi,
    EquipmentTypesApiFp,
    Experiment,
    ExperimentsApi,
    ExperimentsApiFp,
    FilesApi,
    FilesApiFp,
    GalvStorageApi,
    GalvStorageApiFp,
    Harvester,
    HarvestersApi,
    HarvestersApiFp,
    Lab,
    LabsApi,
    LabsApiFp,
    MonitoredPath,
    MonitoredPathsApi,
    MonitoredPathsApiFp,
    ObservedFile,
    ParquetPartitionsApi,
    ParquetPartitionsApiFp,
    Schedule,
    ScheduleFamiliesApi,
    ScheduleFamiliesApiFp,
    ScheduleFamily,
    ScheduleIdentifiersApi,
    ScheduleIdentifiersApiFp,
    SchedulesApi,
    SchedulesApiFp,
    Team,
    TeamsApi,
    TeamsApiFp,
    TokensApi,
    TokensApiFp,
    UnitsApi,
    UnitsApiFp,
    UsersApi,
    UsersApiFp,
    ValidationSchemasApi,
    ValidationSchemasApiFp,
} from '@galv/galv'
import {
    TypeChangerAutocompleteKey,
    TypeChangerLookupKey,
    TypeChangerSupportedTypeName,
} from './Components/prettify/TypeChanger'
import { TypeValueNotation } from './Components/TypeValueNotation'

export type ChildResource = Cell | Equipment | Schedule
export type FamilyResource = CellFamily | EquipmentFamily | ScheduleFamily
export type StandaloneResource =
    | ArbitraryFile
    | AdditionalS3StorageType
    | Harvester
    | Team
    | Lab
    | DataUnit
    | DataColumnType
    | MonitoredPath
    | ObservedFile
    | CyclerTest
    | Experiment
    | ColumnMapping
export type GalvResource = ChildResource | FamilyResource | StandaloneResource

/**
 * The basic unit of data passed around the frontend is a Serializable.
 * This is a type that can be serialized to JSON.
 */
export type Serializable =
    | GalvResource
    | string
    | number
    | boolean
    | TypeValueNotation
    | SerializableObject
    | Serializable[]
    | undefined
    | null
export type SerializableObject = GalvResource | { [key: string]: Serializable }
export type NonNullSerializable = Exclude<Serializable, null | undefined>

/**
 * Resources are identified by their lookup key.
 * When used as a TypeValueNotation type, they are prefixed with "galv_".
 * @param t - TypeValueNotation type name
 */
export const type_to_key = (
    t: TypeChangerSupportedTypeName,
): AutocompleteKey | LookupKey | undefined => {
    if (t.startsWith('galv_')) {
        const k = t.replace('galv_', '')
        if (is_autocomplete_key(k) || is_lookupKey(k)) return k
        console.error(
            `Type ${t} starts with galv_ but is not a LookupKey or AutocompleteKey`,
        )
    }
    return undefined
}

/**
 * Resources are identified by their lookup key.
 * When used as a TypeValueNotation type, they are prefixed with "galv_".
 *
 * @param k - AutocompleteKey or LookupKey
 */
export const key_to_type = (
    k: unknown,
): TypeChangerAutocompleteKey | TypeChangerLookupKey => {
    if (is_autocomplete_key(k) || is_lookupKey(k)) return `galv_${k}`
    throw new Error(`key_to_type: ${k} is not a valid key`)
}

export const DEFAULT_FETCH_LIMIT = 1
export const DEFAULT_PAGE_SIZE = 10

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
    Harvester: 'Harvester',
    Path: 'Path',
    ParquetPartition: 'ParquetPartition',
    File: 'File',
    ColumnMapping: 'ColumnMapping',
    CellFamily: 'CellFamily',
    Cell: 'Cell',
    EquipmentFamily: 'EquipmentFamily',
    Equipment: 'Equipment',
    ScheduleFamily: 'ScheduleFamily',
    Schedule: 'Schedule',
    Experiment: 'Experiment',
    CyclerTest: 'CyclerTest',
    ArbitraryFile: 'ArbitraryFile',
    ValidationSchema: 'ValidationSchema',
    Lab: 'Lab',
    Team: 'Team',
    User: 'User',
    Token: 'Token',
    Unit: 'Unit',
    ColumnFamily: 'ColumnFamily',
    GalvStorage: 'GalvStorage',
    AdditionalStorage: 'AdditionalStorage',
} as const

export const AUTOCOMPLETE_KEYS = {
    CellManufacturer: 'CellManufacturer',
    CellModel: 'CellModel',
    CellFormFactor: 'CellFormFactor',
    CellChemistry: 'CellChemistry',
    EquipmentType: 'EquipmentType',
    EquipmentManufacturer: 'EquipmentManufacturer',
    EquipmentModel: 'EquipmentModel',
    ScheduleIdentifier: 'ScheduleIdentifier',
} as const

export type LookupKey = keyof typeof LOOKUP_KEYS
export const is_lookupKey = (key: unknown): key is LookupKey =>
    typeof key === 'string' && Object.keys(LOOKUP_KEYS).includes(key)

export type AutocompleteKey = keyof typeof AUTOCOMPLETE_KEYS
export const is_autocomplete_key = (key: unknown): key is AutocompleteKey =>
    typeof key === 'string' && Object.keys(AUTOCOMPLETE_KEYS).includes(key)

/**
 * Icons for each resource type.
 * Currently all families share the same icon.
 */
export const ICONS = {
    [LOOKUP_KEYS.Harvester]: MdCloudSync,
    [LOOKUP_KEYS.Path]: MdFolder,
    [LOOKUP_KEYS.ParquetPartition]: MdExtension,
    [LOOKUP_KEYS.File]: MdPoll,
    [LOOKUP_KEYS.ColumnMapping]: MdCompareArrows,
    [LOOKUP_KEYS.Unit]: MdSubscript,
    [LOOKUP_KEYS.ColumnFamily]: MdSplitscreen,
    [LOOKUP_KEYS.CellFamily]: MdBatchPrediction,
    [LOOKUP_KEYS.EquipmentFamily]: MdBatchPrediction,
    [LOOKUP_KEYS.ScheduleFamily]: MdBatchPrediction,
    [LOOKUP_KEYS.Experiment]: MdDatasetLinked,
    [LOOKUP_KEYS.CyclerTest]: MdMultilineChart,
    [LOOKUP_KEYS.Cell]: MdBatteryFull,
    [LOOKUP_KEYS.Equipment]: MdPrecisionManufacturing,
    [LOOKUP_KEYS.Schedule]: MdAssignment,
    [LOOKUP_KEYS.ArbitraryFile]: MdAttachFile,
    [LOOKUP_KEYS.ValidationSchema]: MdSchema,
    [LOOKUP_KEYS.Lab]: MdHolidayVillage,
    [LOOKUP_KEYS.Team]: MdPeopleAlt,
    [LOOKUP_KEYS.User]: MdPerson,
    [LOOKUP_KEYS.Token]: MdVpnKey,
    STORAGE: MdSdStorage,
    [LOOKUP_KEYS.GalvStorage]: MdSdStorage,
    [LOOKUP_KEYS.AdditionalStorage]: MdSdStorage,
    DASHBOARD: MdHome,
    MANAGE_ACCOUNT: MdManageAccounts,
    LOGOUT: MdLogout,
    CREATE: MdAddCircle,
    DELETE: MdDelete,
    SAVE: MdSave,
    FORK: MdForkRight,
    CANCEL: MdCancel,
    CHECK: MdCheckCircle,
    EXPAND_MORE: MdExpandMore,
    EXPAND_LESS: MdExpandLess,
    DOWNLOAD: MdDownload,
    validation_status_ERROR: MdError,
    validation_status_UNCHECKED: MdPending,
    validation_status_INPUT_REQUIRED: MdPending,
    validation_status_VALID: MdCheckCircle,
    validation_status_INVALID: MdCancel,
    validation_status_SKIPPED: MdHideSource,
    SUCCESS: MdCheckCircle,
    INFO: MdInfo,
    WARNING: MdWarning,
    ERROR: MdError,
} as const

/**
 * Paths used by React Router to route to each resource type.
 * This deliberately mimics paths on the API because they are
 * used to determine resource types when parsing URLs that look
 * like they might be resource URLs.
 */
export const PATHS = {
    [LOOKUP_KEYS.Harvester]: '/harvesters',
    [LOOKUP_KEYS.Path]: '/paths',
    [LOOKUP_KEYS.ParquetPartition]: '/parquet_partitions',
    [LOOKUP_KEYS.File]: '/files',
    [LOOKUP_KEYS.ColumnFamily]: '/column_types',
    [LOOKUP_KEYS.Unit]: '/units',
    DASHBOARD: '/',
    [LOOKUP_KEYS.ColumnMapping]: '/mapping',
    [LOOKUP_KEYS.Experiment]: '/experiments',
    [LOOKUP_KEYS.CyclerTest]: '/cycler_tests',
    GRAPH: '/graphs',
    [LOOKUP_KEYS.Cell]: '/cells',
    [LOOKUP_KEYS.CellFamily]: '/cell_families',
    [LOOKUP_KEYS.Equipment]: '/equipment',
    [LOOKUP_KEYS.EquipmentFamily]: '/equipment_families',
    [LOOKUP_KEYS.Schedule]: '/schedules',
    [LOOKUP_KEYS.ScheduleFamily]: '/schedule_families',
    [LOOKUP_KEYS.ArbitraryFile]: '/arbitrary_files',
    [LOOKUP_KEYS.ValidationSchema]: '/validation_schemas',
    [LOOKUP_KEYS.Lab]: '/labs',
    [LOOKUP_KEYS.Team]: '/teams',
    [LOOKUP_KEYS.User]: '/users',
    [LOOKUP_KEYS.Token]: '/tokens',
    [LOOKUP_KEYS.GalvStorage]: '/galv_storage',
    [LOOKUP_KEYS.AdditionalStorage]: '/additional_storage',
    PROFILE: '/profile',
    [AUTOCOMPLETE_KEYS.CellManufacturer]: '/cell_manufacturers',
    [AUTOCOMPLETE_KEYS.CellModel]: '/cell_models',
    [AUTOCOMPLETE_KEYS.CellFormFactor]: '/cell_form_factors',
    [AUTOCOMPLETE_KEYS.CellChemistry]: '/cell_chemistries',
    [AUTOCOMPLETE_KEYS.EquipmentType]: '/equipment_types',
    [AUTOCOMPLETE_KEYS.EquipmentManufacturer]: '/equipment_manufacturers',
    [AUTOCOMPLETE_KEYS.EquipmentModel]: '/equipment_models',
    [AUTOCOMPLETE_KEYS.ScheduleIdentifier]: '/schedule_identifiers',
    UPLOAD: '/upload',
} as const

/**
 * Display names are in Title Case.
 */
export const DISPLAY_NAMES = {
    [LOOKUP_KEYS.Harvester]: 'Harvester',
    [LOOKUP_KEYS.Path]: 'Path',
    [LOOKUP_KEYS.ParquetPartition]: 'Parquet Partition',
    [LOOKUP_KEYS.File]: 'File',
    [LOOKUP_KEYS.ColumnMapping]: 'Mapping',
    [LOOKUP_KEYS.ColumnFamily]: 'Column Type',
    [LOOKUP_KEYS.Unit]: 'Unit',
    DASHBOARD: 'Dashboard',
    [LOOKUP_KEYS.Experiment]: 'Experiment',
    [LOOKUP_KEYS.CyclerTest]: 'Cycler Test',
    DATASET: 'Dataset',
    [LOOKUP_KEYS.Cell]: 'Cell',
    [LOOKUP_KEYS.CellFamily]: 'Cell Family',
    [LOOKUP_KEYS.Equipment]: 'Equipment',
    [LOOKUP_KEYS.EquipmentFamily]: 'Equipment Family',
    [LOOKUP_KEYS.Schedule]: 'Schedule',
    [LOOKUP_KEYS.ScheduleFamily]: 'Schedule Family',
    [LOOKUP_KEYS.ArbitraryFile]: 'Attachment',
    [LOOKUP_KEYS.ValidationSchema]: 'Validation Schema',
    [LOOKUP_KEYS.Lab]: 'Lab',
    [LOOKUP_KEYS.Team]: 'Team',
    [LOOKUP_KEYS.User]: 'User',
    [LOOKUP_KEYS.Token]: 'Token',
    [LOOKUP_KEYS.GalvStorage]: 'Galv Storage',
    [LOOKUP_KEYS.AdditionalStorage]: 'Additional Storage',
} as const

/**
 * Title Case, as with DISPLAY_NAMES. Plural.
 */
export const DISPLAY_NAMES_PLURAL = {
    [LOOKUP_KEYS.Harvester]: 'Harvesters',
    [LOOKUP_KEYS.Path]: 'Paths',
    [LOOKUP_KEYS.ParquetPartition]: 'Parquet Partitions',
    [LOOKUP_KEYS.File]: 'Files',
    [LOOKUP_KEYS.ColumnMapping]: 'Mappings',
    [LOOKUP_KEYS.ColumnFamily]: 'Column Type',
    [LOOKUP_KEYS.Unit]: 'Unit',
    DASHBOARD: 'Dashboard',
    [LOOKUP_KEYS.Experiment]: 'Experiments',
    [LOOKUP_KEYS.CyclerTest]: 'Cycler Tests',
    DATASET: 'Datasets',
    [LOOKUP_KEYS.Cell]: 'Cells',
    [LOOKUP_KEYS.CellFamily]: 'Cell Families',
    [LOOKUP_KEYS.Equipment]: 'Equipment',
    [LOOKUP_KEYS.EquipmentFamily]: 'Equipment Families',
    [LOOKUP_KEYS.Schedule]: 'Schedules',
    [LOOKUP_KEYS.ScheduleFamily]: 'Schedule Families',
    [LOOKUP_KEYS.ArbitraryFile]: 'Attachments',
    [LOOKUP_KEYS.ValidationSchema]: 'Validation Schemas',
    [LOOKUP_KEYS.Lab]: 'Labs',
    [LOOKUP_KEYS.Team]: 'Teams',
    [LOOKUP_KEYS.User]: 'Users',
    [LOOKUP_KEYS.Token]: 'Tokens',
    [LOOKUP_KEYS.GalvStorage]: 'Galv Storage',
    [LOOKUP_KEYS.AdditionalStorage]: 'Additional Storage',
} as const

/**
 * API slugs for each resource type.
 * Used to access the inner API functions.
 *
 * Casting is likely to be necessary when using this, e.g.:
 * ```
 * const target_get = target_api_handler[
 *         `${API_SLUGS[lookupKey]}Retrieve` as keyof typeof target_api_handler
 *         ] as (requestParams: {id: string}) => Promise<AxiosResponse<T>>
 * ```
 */
export const API_SLUGS = {
    [LOOKUP_KEYS.Harvester]: 'harvesters',
    [LOOKUP_KEYS.Path]: 'monitoredPaths',
    [LOOKUP_KEYS.ParquetPartition]: 'parquetPartitions',
    [LOOKUP_KEYS.File]: 'files',
    [LOOKUP_KEYS.ColumnMapping]: 'columnMappings',
    [LOOKUP_KEYS.ColumnFamily]: 'columnTypes',
    [LOOKUP_KEYS.Unit]: 'units',
    [LOOKUP_KEYS.Cell]: 'cells',
    [LOOKUP_KEYS.Equipment]: 'equipment',
    [LOOKUP_KEYS.Schedule]: 'schedules',
    [LOOKUP_KEYS.CellFamily]: 'cellFamilies',
    [LOOKUP_KEYS.EquipmentFamily]: 'equipmentFamilies',
    [LOOKUP_KEYS.ScheduleFamily]: 'scheduleFamilies',
    [LOOKUP_KEYS.Experiment]: 'experiments',
    [LOOKUP_KEYS.CyclerTest]: 'cyclerTests',
    [LOOKUP_KEYS.ArbitraryFile]: 'arbitraryFiles',
    [LOOKUP_KEYS.ValidationSchema]: 'validationSchemas',
    [LOOKUP_KEYS.Lab]: 'labs',
    [LOOKUP_KEYS.Team]: 'teams',
    [LOOKUP_KEYS.User]: 'users',
    [LOOKUP_KEYS.Token]: 'tokens',
    [LOOKUP_KEYS.GalvStorage]: 'galvStorage',
    [LOOKUP_KEYS.AdditionalStorage]: 'additionalStorage',
    [AUTOCOMPLETE_KEYS.CellManufacturer]: 'cellManufacturers',
    [AUTOCOMPLETE_KEYS.CellModel]: 'cellModels',
    [AUTOCOMPLETE_KEYS.CellFormFactor]: 'cellFormFactors',
    [AUTOCOMPLETE_KEYS.CellChemistry]: 'cellChemistries',
    [AUTOCOMPLETE_KEYS.EquipmentType]: 'equipmentTypes',
    [AUTOCOMPLETE_KEYS.EquipmentManufacturer]: 'equipmentManufacturers',
    [AUTOCOMPLETE_KEYS.EquipmentModel]: 'equipmentModels',
    [AUTOCOMPLETE_KEYS.ScheduleIdentifier]: 'scheduleIdentifiers',
} as const

/**
 * API handlers for each resource type.
 * Instantiated with new API_HANDLERS[lookupKey]().
 *
 * Used when we don't know the order of the arguments to the API function.
 */
export const API_HANDLERS = {
    [LOOKUP_KEYS.Harvester]: HarvestersApi,
    [LOOKUP_KEYS.Path]: MonitoredPathsApi,
    [LOOKUP_KEYS.ParquetPartition]: ParquetPartitionsApi,
    [LOOKUP_KEYS.File]: FilesApi,
    [LOOKUP_KEYS.ColumnMapping]: ColumnMappingsApi,
    [LOOKUP_KEYS.ColumnFamily]: ColumnTypesApi,
    [LOOKUP_KEYS.Unit]: UnitsApi,
    [LOOKUP_KEYS.CellFamily]: CellFamiliesApi,
    [LOOKUP_KEYS.EquipmentFamily]: EquipmentFamiliesApi,
    [LOOKUP_KEYS.ScheduleFamily]: ScheduleFamiliesApi,
    [LOOKUP_KEYS.Experiment]: ExperimentsApi,
    [LOOKUP_KEYS.CyclerTest]: CyclerTestsApi,
    [LOOKUP_KEYS.Cell]: CellsApi,
    [LOOKUP_KEYS.Equipment]: EquipmentApi,
    [LOOKUP_KEYS.Schedule]: SchedulesApi,
    [LOOKUP_KEYS.ArbitraryFile]: ArbitraryFilesApi,
    [LOOKUP_KEYS.ValidationSchema]: ValidationSchemasApi,
    [LOOKUP_KEYS.Lab]: LabsApi,
    [LOOKUP_KEYS.Team]: TeamsApi,
    [LOOKUP_KEYS.User]: UsersApi,
    [LOOKUP_KEYS.Token]: TokensApi,
    [LOOKUP_KEYS.GalvStorage]: GalvStorageApi,
    [LOOKUP_KEYS.AdditionalStorage]: AdditionalStorageApi,
    [AUTOCOMPLETE_KEYS.CellManufacturer]: CellManufacturersApi,
    [AUTOCOMPLETE_KEYS.CellModel]: CellModelsApi,
    [AUTOCOMPLETE_KEYS.CellFormFactor]: CellFormFactorsApi,
    [AUTOCOMPLETE_KEYS.CellChemistry]: CellChemistriesApi,
    [AUTOCOMPLETE_KEYS.EquipmentType]: EquipmentTypesApi,
    [AUTOCOMPLETE_KEYS.EquipmentManufacturer]: EquipmentManufacturersApi,
    [AUTOCOMPLETE_KEYS.EquipmentModel]: EquipmentModelsApi,
    [AUTOCOMPLETE_KEYS.ScheduleIdentifier]: ScheduleIdentifiersApi,
} as const

/**
 * API Functional Interface for each resource type.
 * Instantiated with new API_HANDLERS[lookupKey]().
 *
 * This is used when we don't know the name of the parameters we want to set.
 */
export const API_HANDLERS_FP = {
    [LOOKUP_KEYS.Harvester]: HarvestersApiFp,
    [LOOKUP_KEYS.Path]: MonitoredPathsApiFp,
    [LOOKUP_KEYS.ParquetPartition]: ParquetPartitionsApiFp,
    [LOOKUP_KEYS.File]: FilesApiFp,
    [LOOKUP_KEYS.ColumnMapping]: ColumnMappingsApiFp,
    [LOOKUP_KEYS.ColumnFamily]: ColumnTypesApiFp,
    [LOOKUP_KEYS.Unit]: UnitsApiFp,
    [LOOKUP_KEYS.CellFamily]: CellFamiliesApiFp,
    [LOOKUP_KEYS.EquipmentFamily]: EquipmentFamiliesApiFp,
    [LOOKUP_KEYS.ScheduleFamily]: ScheduleFamiliesApiFp,
    [LOOKUP_KEYS.Experiment]: ExperimentsApiFp,
    [LOOKUP_KEYS.CyclerTest]: CyclerTestsApiFp,
    [LOOKUP_KEYS.Cell]: CellsApiFp,
    [LOOKUP_KEYS.Equipment]: EquipmentApiFp,
    [LOOKUP_KEYS.Schedule]: SchedulesApiFp,
    [LOOKUP_KEYS.ArbitraryFile]: ArbitraryFilesApiFp,
    [LOOKUP_KEYS.ValidationSchema]: ValidationSchemasApiFp,
    [LOOKUP_KEYS.Lab]: LabsApiFp,
    [LOOKUP_KEYS.Team]: TeamsApiFp,
    [LOOKUP_KEYS.User]: UsersApiFp,
    [LOOKUP_KEYS.Token]: TokensApiFp,
    [LOOKUP_KEYS.GalvStorage]: GalvStorageApiFp,
    [LOOKUP_KEYS.AdditionalStorage]: AdditionalStorageApiFp,
    [AUTOCOMPLETE_KEYS.CellManufacturer]: CellManufacturersApiFp,
    [AUTOCOMPLETE_KEYS.CellModel]: CellModelsApiFp,
    [AUTOCOMPLETE_KEYS.CellFormFactor]: CellFormFactorsApiFp,
    [AUTOCOMPLETE_KEYS.CellChemistry]: CellChemistriesApiFp,
    [AUTOCOMPLETE_KEYS.EquipmentType]: EquipmentTypesApiFp,
    [AUTOCOMPLETE_KEYS.EquipmentManufacturer]: EquipmentManufacturersApiFp,
    [AUTOCOMPLETE_KEYS.EquipmentModel]: EquipmentModelsApiFp,
    [AUTOCOMPLETE_KEYS.ScheduleIdentifier]: ScheduleIdentifiersApiFp,
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
    IDENTITY: 3,
} as const

export type Field = {
    read_only: boolean
    type: TypeChangerSupportedTypeName
    many?: boolean
    priority?: number
    // create_only fields are required at create time, but otherwise read_only
    create_only?: boolean
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
const always_fields: { [key: string]: Field } = {
    url: { read_only: true, type: 'string' },
    permissions: { read_only: true, type: 'object' },
}
const team_fields: { [key: string]: Field } = {
    team: { read_only: true, type: 'galv_Team', create_only: true },
    validation_results: { read_only: true, type: 'object', many: true },
}
const generic_fields: { [key: string]: Field } = {
    id: { read_only: true, type: 'string' },
    ...always_fields,
}
const autocomplete_fields: { [key: string]: Field } = {
    url: { read_only: true, type: 'string' },
    id: { read_only: true, type: 'number' },
    value: { read_only: true, type: 'string' },
    ld_value: { read_only: true, type: 'string' },
}

const file_fields = {
    ...generic_fields,
    name: {
        read_only: false,
        type: 'string',
        priority: PRIORITY_LEVELS.IDENTITY,
    },
    team: { read_only: true, type: 'galv_Team', create_only: true },
    uploader: { create_only: true, type: key_to_type(LOOKUP_KEYS.User) },
    state: { read_only: true, type: 'string' },
    path: { read_only: true, type: 'string' },
    parser: { read_only: true, type: 'string' },
    harvester: {
        read_only: true,
        type: key_to_type(LOOKUP_KEYS.Harvester),
    },
    last_observed_size: { read_only: true, type: 'number' },
    last_observed_time: { read_only: true, type: 'datetime' },
    data_generation_date: { read_only: true, type: 'datetime' },
    inferred_format: { read_only: true, type: 'string' },
    num_rows: { read_only: true, type: 'number' },
    first_sample_no: { read_only: true, type: 'number' },
    last_sample_no: { read_only: true, type: 'number' },
    extra_metadata: {
        read_only: true,
        type: 'string',
        priority: PRIORITY_LEVELS.HIDDEN,
    },
    has_required_columns: { read_only: true, type: 'boolean' },
    upload_errors: { read_only: true, type: 'string', many: true },
    column_errors: { read_only: true, type: 'string', many: true },
    upload_info: { read_only: true, type: 'string' },
    parquet_partitions: {
        read_only: true,
        type: key_to_type(LOOKUP_KEYS.ParquetPartition),
        many: true,
    },
    applicable_mappings: {
        read_only: true,
        type: 'string',
        priority: PRIORITY_LEVELS.HIDDEN,
    },
    mapping: { read_only: true, type: key_to_type(LOOKUP_KEYS.ColumnMapping) },
    summary: {
        read_only: true,
        type: 'string',
        priority: PRIORITY_LEVELS.HIDDEN,
    },
}

/**
 * Lookup map to get the properties of the fields in each resource type.
 */
export const FIELDS = {
    [LOOKUP_KEYS.Harvester]: {
        ...generic_fields,
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        lab: {
            read_only: true,
            type: 'string',
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        last_check_in: { read_only: true, type: 'datetime' },
        last_check_in_job: { read_only: true, type: 'string' },
        sleep_time: { read_only: false, type: 'number' },
        environment_variables: { read_only: true, type: 'object' },
        active: {
            read_only: false,
            type: 'boolean',
            priority: PRIORITY_LEVELS.CONTEXT,
        },
    },
    [LOOKUP_KEYS.Path]: {
        ...generic_fields,
        path: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        regex: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        stable_time: { read_only: false, type: 'number' },
        active: { read_only: false, type: 'boolean' },
        maximum_partition_line_count: { read_only: false, type: 'number' },
        harvester: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Harvester),

            create_only: true,
            fetch_in_download: true,
        },
        files: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.File),
            many: true,
        },
        ...team_fields,
    },
    [LOOKUP_KEYS.ParquetPartition]: {
        ...generic_fields,
        observed_file: { read_only: true, type: key_to_type(LOOKUP_KEYS.File) },
        partition_number: {
            read_only: true,
            type: 'number',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        uploaded: { read_only: true, type: 'boolean' },
        upload_errors: { read_only: true, type: 'string', many: true },
        parquet_file: { read_only: true, type: 'attachment' },
    },
    [LOOKUP_KEYS.File]: { ...file_fields },
    FILE_CREATE: {
        ...file_fields,
        target_file_id: { read_only: true, type: 'string' },
        team: { read_only: false, type: 'galv_Team' },
        uploader: { create_only: true, type: key_to_type(LOOKUP_KEYS.User) },
        path: { read_only: false, type: 'string' },
        mapping: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.ColumnMapping),
        },
    },
    [LOOKUP_KEYS.ColumnMapping]: {
        ...generic_fields,
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        is_valid: { read_only: true, type: 'boolean' },
        map: { read_only: false, type: 'object' },
        missing: { read_only: true, type: 'number' }, // only appears as part of a FILE response
        ...team_fields,
    },
    [LOOKUP_KEYS.ColumnFamily]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        is_default: { read_only: true, type: 'boolean' },
        is_required: { read_only: true, type: 'boolean' },
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        data_type: { read_only: false, type: 'string' },
        unit: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.Unit),
            fetch_in_download: true,
        },
        ...team_fields,
    },
    [LOOKUP_KEYS.Unit]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        is_default: { read_only: true, type: 'boolean' },
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        symbol: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        ...team_fields,
    },
    [LOOKUP_KEYS.Experiment]: {
        title: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        authors: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.User),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
            fetch_in_download: true,
        },
        protocol: { read_only: false, type: 'string' },
        protocol_file: { read_only: false, type: 'string' },
        cycler_tests: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.CyclerTest),
            many: true,
            fetch_in_download: true,
        },
        ...team_fields,
    },
    [LOOKUP_KEYS.CyclerTest]: {
        ...generic_fields,
        cell: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.Cell),
            fetch_in_download: true,
        },
        schedule: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.Schedule),
            fetch_in_download: true,
        },
        equipment: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.Equipment),
            many: true,
            fetch_in_download: true,
        },
        files: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.File),
            many: true,
            fetch_in_download: true,
        },
        rendered_schedule: { read_only: true, type: 'string', many: true },
        ...team_fields,
    },
    [LOOKUP_KEYS.Cell]: {
        ...generic_fields,
        identifier: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        family: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.CellFamily),
            priority: PRIORITY_LEVELS.CONTEXT,
            fetch_in_download: true,
        },
        ...team_fields,
        cycler_tests: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.CyclerTest),
            many: true,
        },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.Equipment]: {
        ...generic_fields,
        identifier: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        family: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.EquipmentFamily),
            priority: PRIORITY_LEVELS.CONTEXT,
            fetch_in_download: true,
        },
        ...team_fields,
        calibration_date: { read_only: false, type: 'string' },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.Schedule]: {
        ...generic_fields,
        family: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.ScheduleFamily),
            priority: PRIORITY_LEVELS.CONTEXT,
            fetch_in_download: true,
        },
        ...team_fields,
        schedule_file: { read_only: false, type: 'string' },
        pybamm_schedule_variables: { read_only: false, type: 'object' },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.CellFamily]: {
        ...generic_fields,
        ...team_fields,
        manufacturer: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.CellManufacturer),
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        model: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.CellModel),
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        form_factor: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.CellFormFactor),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        chemistry: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.CellChemistry),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        cells: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Cell),
            many: true,
        },
        nominal_voltage_v: { read_only: false, type: 'number' },
        nominal_capacity: { read_only: false, type: 'number' },
        initial_ac_impedance: { read_only: false, type: 'number' },
        initial_dc_resistance: { read_only: false, type: 'number' },
        energy_density: { read_only: false, type: 'number' },
        power_density: { read_only: false, type: 'number' },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.EquipmentFamily]: {
        ...generic_fields,
        ...team_fields,
        manufacturer: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.EquipmentManufacturer),
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        model: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.EquipmentModel),
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        type: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.EquipmentType),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        equipment: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Equipment),
            many: true,
        },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.ScheduleFamily]: {
        ...generic_fields,
        ...team_fields,
        identifier: {
            read_only: false,
            type: key_to_type(AUTOCOMPLETE_KEYS.ScheduleIdentifier),
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        ambient_temperature: { read_only: false, type: 'number' },
        pybamm_template: { read_only: false, type: 'object' },
        schedules: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Schedule),
            many: true,
        },
        in_use: { read_only: true, type: 'boolean' },
    },
    [LOOKUP_KEYS.Team]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        lab: {
            read_only: true,
            create_only: true,
            type: key_to_type(LOOKUP_KEYS.Lab),
            priority: PRIORITY_LEVELS.CONTEXT,
            fetch_in_download: true,
        },
        member_group: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.User),
            many: true,

            fetch_in_download: true,
        },
        admin_group: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.User),
            many: true,

            fetch_in_download: true,
        },
        monitored_paths: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Path),
            many: true,
        },
        cellfamily_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.CellFamily),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        cell_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Cell),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        equipmentfamily_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.EquipmentFamily),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        equipment_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Equipment),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        schedulefamily_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.ScheduleFamily),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        schedule_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Schedule),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        cyclertest_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.CyclerTest),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        experiment_resources: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Experiment),
            many: true,
            priority: PRIORITY_LEVELS.CONTEXT,
        },
    },
    [LOOKUP_KEYS.ArbitraryFile]: {
        ...generic_fields,
        lab: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Lab),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        file: {
            read_only: true,
            create_only: true,
            type: 'attachment',
        },
        team: team_fields.team,
    },
    [LOOKUP_KEYS.ValidationSchema]: {
        ...generic_fields,
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        schema: { read_only: false, type: 'object' },
        ...team_fields,
    },
    [LOOKUP_KEYS.Lab]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        description: { read_only: false, type: 'string' },
        admin_group: {
            read_only: false,
            type: key_to_type(LOOKUP_KEYS.User),
            many: true,

            fetch_in_download: true,
        },
        storages: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.AdditionalStorage),
            many: true,
        },
        teams: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Team),
            many: true,
        },
        harvesters: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Harvester),
            many: true,
        },
    },
    [LOOKUP_KEYS.User]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        username: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        email: { read_only: false, type: 'string' },
        first_name: { read_only: false, type: 'string' },
        last_name: { read_only: false, type: 'string' },
        is_staff: {
            read_only: true,
            type: 'boolean',
            priority: PRIORITY_LEVELS.HIDDEN,
        },
        is_superuser: { read_only: true, type: 'boolean' },
        groups: {
            read_only: true,
            type: 'object',
            many: true,
            priority: PRIORITY_LEVELS.HIDDEN,
        },
    },
    [LOOKUP_KEYS.Token]: {
        ...always_fields,
        id: { read_only: true, type: 'number' },
        name: {
            read_only: true,
            type: 'string',
            create_only: true,
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        created: { read_only: true, type: 'string' },
        expiry: { read_only: true, type: 'datetime' },
    },
    [LOOKUP_KEYS.GalvStorage]: {
        ...generic_fields,
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        lab: {
            read_only: true,
            type: key_to_type(LOOKUP_KEYS.Lab),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        quota_bytes: { read_only: true, type: 'number' },
        bytes_used: { read_only: true, type: 'number' },
        priority: { read_only: false, type: 'number' },
        enabled: { read_only: false, type: 'boolean' },
    },
    [LOOKUP_KEYS.AdditionalStorage]: {
        ...generic_fields,
        name: {
            read_only: false,
            type: 'string',
            priority: PRIORITY_LEVELS.IDENTITY,
        },
        lab: {
            read_only: true,
            create_only: true,
            type: key_to_type(LOOKUP_KEYS.Lab),
            priority: PRIORITY_LEVELS.CONTEXT,
        },
        quota_bytes: { read_only: false, type: 'number' },
        bytes_used: { read_only: true, type: 'number' },
        priority: { read_only: false, type: 'number' },
        bucket_name: { read_only: false, type: 'string' },
        location: { read_only: false, type: 'string' },
        access_key: { read_only: false, type: 'string' },
        secret_key: { read_only: false, type: 'string' },
        region_name: { read_only: false, type: 'string' },
        custom_domain: { read_only: false, type: 'string' },
        enabled: { read_only: false, type: 'boolean' },
    },
    [AUTOCOMPLETE_KEYS.CellManufacturer]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CellModel]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CellFormFactor]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.CellChemistry]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EquipmentType]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EquipmentManufacturer]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.EquipmentModel]: autocomplete_fields,
    [AUTOCOMPLETE_KEYS.ScheduleIdentifier]: autocomplete_fields,
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
 [LOOKUP_KEYS.CellFamily]: "family_id",
 [LOOKUP_KEYS.EquipmentFamily]: "family_id",
 [LOOKUP_KEYS.ScheduleFamily]: "family_id",
 [LOOKUP_KEYS.Cell]: "cell_id",
 [LOOKUP_KEYS.Equipment]: "equipment_id",
 [LOOKUP_KEYS.Schedule]: "schedule_id",
 [LOOKUP_KEYS.Team]: "team_id",
 } as const
 */

/**
 * Lookup map to get the family lookup key for each resource type.
 */
export const FAMILY_LOOKUP_KEYS = {
    [LOOKUP_KEYS.Cell]: 'CellFamily',
    [LOOKUP_KEYS.Equipment]: 'EquipmentFamily',
    [LOOKUP_KEYS.Schedule]: 'ScheduleFamily',
} as const

export const get_has_family = (
    key: string | number,
): key is keyof typeof FAMILY_LOOKUP_KEYS =>
    Object.keys(FAMILY_LOOKUP_KEYS).includes(key as string)
/**
 * Lookup map to get the child lookup key for each resource family.
 */
export const CHILD_LOOKUP_KEYS = {
    [LOOKUP_KEYS.CellFamily]: 'Cell',
    [LOOKUP_KEYS.EquipmentFamily]: 'Equipment',
    [LOOKUP_KEYS.ScheduleFamily]: 'Schedule',
} as const

/**
 * Lookup map to get the child field name for each resource family.
 */
export const CHILD_PROPERTY_NAMES = {
    [LOOKUP_KEYS.CellFamily]: 'cells',
    [LOOKUP_KEYS.EquipmentFamily]: 'equipment',
    [LOOKUP_KEYS.ScheduleFamily]: 'schedules',
} as const

export const get_is_family = (
    key: string | number,
): key is keyof typeof CHILD_PROPERTY_NAMES =>
    Object.keys(CHILD_PROPERTY_NAMES).includes(key as string)

export const INTRODUCTIONS = {
    [LOOKUP_KEYS.Harvester]: `
Harvesters are specialized tools designed to gather data from external sources. 
Each harvester is associated with a [lab](${PATHS[LOOKUP_KEYS.Lab]}), 
and any team within that lab can configure a [monitored path](${PATHS[LOOKUP_KEYS.Path]}) for it.

To create a new harvester, you can utilize a Python script on a computer with access to the desired data source. 
Visit the [harvester repository](https://github.com/galv-team/galv-harvester) for detailed instructions on setting up and configuring harvesters. 
You will need the following information:

1. Server URL: \`${import.meta.env.VITE_GALV_API_BASE_URL}\`
2. API token: Generate a new token in the [token section](${PATHS[LOOKUP_KEYS.Token]})

Below, you can view all the harvesters that are associated with your [labs](${PATHS[LOOKUP_KEYS.Lab]}).
    `,
    [LOOKUP_KEYS.Path]: `
Monitored paths collect data from external sources via file paths on 
[harvester-running](${PATHS[LOOKUP_KEYS.Harvester]}) computers. Lab members can set up paths for their lab's 
harvesters. Matching files are added to the database when:

1. They match the path and specified regex
2. They're not hidden (don't start with a dot)
3. Their size remains stable for the specified duration

Harvesters continuously monitor paths, uploading new files as they appear.
You can see all the paths that have been set up by your team below.
    `,
    [LOOKUP_KEYS.ParquetPartition]: `
Parquet partitions are the individual partitions of a parquet file.
They are created when a [file](${PATHS[LOOKUP_KEYS.File]}) is uploaded to the database.
    `,
    [LOOKUP_KEYS.File]: `
Files are data files produced by battery cyclers, simulations, or any combination of them.
Files are collected when [harvesters](${PATHS[LOOKUP_KEYS.Harvester]}) crawl [monitored paths](${PATHS[LOOKUP_KEYS.Path]}).

The data in each file is parsed either automatically if it matches one of the predefined [mapping](${PATHS[LOOKUP_KEYS.ColumnMapping]}) or manually with a prompt if a mapping is not found.
Parsed files are then uploaded to the database, where metadata can be attached and the data can be downloaded.
Files are required to have, at minimum, columns for "ElapsedTime_s", "Voltage_V", and "Current_A".

You can see all the files that have been collected on [monitored paths](${PATHS[LOOKUP_KEYS.Path]}) created by your team.
    `,
    [LOOKUP_KEYS.ColumnFamily]: `
Column types serve as identifiers for the data type present in a specific column of a [file](${PATHS[LOOKUP_KEYS.File]}). 
They establish a connection between a column and its corresponding [unit](${PATHS[LOOKUP_KEYS.Unit]}), enabling accurate interpretation and analysis of the data.

When new column types are added or existing ones are modified, the mapping selection for columns in the associated [file](${PATHS[LOOKUP_KEYS.File]}) is automatically updated. 
This dynamic updating mechanism ensures that the column mappings remain aligned with the defined column types.
    `,
    [LOOKUP_KEYS.Unit]: `
Units represent the specific units of measurement employed to quantify and express the data contained within a [file](${PATHS[LOOKUP_KEYS.File]}). 
These units provide the necessary context and scale for interpreting and understanding the numerical values present in the data.
    `,
    [LOOKUP_KEYS.CellFamily]: `
Cell families are collections of [cells](${PATHS[LOOKUP_KEYS.Cell]}) that share some common properties.

A [cell](${PATHS[LOOKUP_KEYS.Cell]}) will have all the properties of the family it belongs to, but it can override them if the property is declared on the cell itself.
    `,
    [LOOKUP_KEYS.Cell]: `
Cells represent the fundamental instance of a battery within the Galv ecosystem. 
Each [cycler test](${PATHS[LOOKUP_KEYS.CyclerTest]}) is conducted on a single cell.

Cells are organised into [cell families](${PATHS[LOOKUP_KEYS.CellFamily]}), which define their shared properties and characteristics. 
Most properties of an individual cell are inherited from its associated family, promoting consistency and standardization across related cells. 
However, if necessary, these inherited properties can be overridden or customized at the individual cell level.

For the majority of cells, it is likely that only the identifier and family information will need to be specified. 
This streamlined approach simplifies the process of managing and tracking individual cells while leveraging the inherited properties defined by their respective cell families.
    `,
    [LOOKUP_KEYS.EquipmentFamily]: `
Equipment families serve as logical groupings for [equipment](${PATHS[LOOKUP_KEYS.Equipment]}) resources that share common properties or characteristics. 
They provide an organisational framework for managing and categorizing equipment within the Galv ecosystem.
Each individual [equipment](${PATHS[LOOKUP_KEYS.Equipment]}) resource inherits the properties defined by the equipment family it belongs to. 
This inheritance mechanism ensures consistency and standardisation across related equipment resources.
However, if a specific property is explicitly declared at the individual equipment level, it takes precedence and overrides the inherited value from the family. 
This flexibility allows for customisation and accommodation of unique equipment characteristics or configurations when necessary.
    `,
    [LOOKUP_KEYS.Equipment]: `
Equipment resources in the Galv ecosystem encompass a comprehensive description of all pieces of equipment relevant to battery [cycler tests](${PATHS[LOOKUP_KEYS.CyclerTest]}). 
This includes not only the cycler itself but also any ancillary equipment utilized during the testing process, such as temperature chambers, power supplies, or other auxiliary devices.

These equipment resources are organized into [equipment families](${PATHS[LOOKUP_KEYS.EquipmentFamily]}), which define their shared properties and characteristics. 
Most properties of an individual equipment resource are inherited from its associated family, ensuring consistency and standardisation. 
However, if necessary, these inherited properties can be overridden or customized at the individual equipment level.
    `,
    [LOOKUP_KEYS.ScheduleFamily]: `
Schedule families are logical groupings of [schedules](${PATHS[LOOKUP_KEYS.Schedule]}) that share common properties or characteristics. 
They serve as a organisational framework for managing and categorising schedules within the Galv ecosystem.

Each [schedule](${PATHS[LOOKUP_KEYS.Schedule]}) inherits the properties defined by the schedule family it belongs to. 
However, if a specific property is explicitly declared at the individual schedule level, it takes precedence and overrides the inherited value from the family.

Schedule families define schedule templates that can contain variables. 
These variables are dynamically replaced with specific values when a schedule is created and applied to a cycler test. 
The values used to replace these variables can be derived from multiple sources, following a predefined order of priority:

1. Individual [cell](${PATHS[LOOKUP_KEYS.Cell]}) being tested (highest priority)
2. [Family](${PATHS[LOOKUP_KEYS.CellFamily]}) of the cell being tested
3. Individual schedule (lowest priority)

This hierarchical variable replacement mechanism ensures that the most specific and relevant values are used for each cycler test, while maintaining a consistent and organised structure defined by the schedule families and templates.
    `,
    [LOOKUP_KEYS.Schedule]: `
Schedules serve as the instructions that govern the execution of battery [cycler tests](${PATHS[LOOKUP_KEYS.CyclerTest]}). 
They define the specific pattern of charging and discharging cycles, as well as the ambient temperature conditions under which the tests are conducted.

Schedules are organized into [schedule families](${PATHS[LOOKUP_KEYS.ScheduleFamily]}), which define their shared properties and characteristics. 
Most properties of a schedule are inherited from its associated family, but they can be overridden or customized at the individual schedule level if necessary.

Additionally, schedules can specify values for variables defined within their families template. 
These variable values can be further overridden or superseded by values set in the [family](${PATHS[LOOKUP_KEYS.CellFamily]}) of the cell being tested or in the individual [cell](${PATHS[LOOKUP_KEYS.Cell]}) itself. 
    `,
    [LOOKUP_KEYS.Experiment]: `
They serve as a logical grouping mechanism for related tests conducted under similar conditions or with shared objectives.

Typically, a single experiment is performed on a specific cell family, employing a variety of different [schedules](${PATHS[LOOKUP_KEYS.Schedule]}) designed to characterise and evaluate different properties or aspects of the cells under investigation.

Within an experiment, the metadata associated with the constituent tests is consolidated. 
This includes information about the [authors](${PATHS[LOOKUP_KEYS.User]}) involved, the specific [cells](${PATHS[LOOKUP_KEYS.Cell]}) tested, the [schedules](${PATHS[LOOKUP_KEYS.Schedule]}) employed, and the [equipment](${PATHS[LOOKUP_KEYS.Equipment]}) utilised during the testing process. 
Additionally, the actual data produced by these tests, in the form of [files](${PATHS[LOOKUP_KEYS.File]}), is also organised and associated with the respective experiment.
    `,
    [LOOKUP_KEYS.CyclerTest]: `
Cycler tests represent the fundamental application of battery testing within the Galv ecosystem. 
Each test is conducted on a single [cell](${PATHS[LOOKUP_KEYS.Cell]}) and follows a specific [schedule](${PATHS[LOOKUP_KEYS.Schedule]}) that outlines the testing parameters and procedures. 
Additionally, a cycler test may involve the use of multiple pieces of [equipment](${PATHS[LOOKUP_KEYS.Equipment]}, such as cyclers, temperature chambers, or other auxiliary devices.

The cycler test encapsulates the conditions under which the cell was tested, as well as the resulting data generated during the testing process. 
These tests provide a comprehensive record of the experimental setup, testing parameters, and the acquired data, ensuring traceability and reproducibility.

Furthermore, cycler tests can be logically grouped into [experiments](${PATHS[LOOKUP_KEYS.Experiment]}), allowing researchers to organise and manage related tests under a common umbrella. 
    `,
    [LOOKUP_KEYS.ArbitraryFile]: `
Attachments are files that are related to the battery testing process but are not directly generated by the cycling equipment itself. 
These files can serve various purposes, such as storing experimental protocols, equipment datasheets, or any other supplementary information relevant to the testing procedures.

By incorporating attachments, researchers can maintain a comprehensive record of all pertinent details associated with their battery experiments. 
This includes detailed experimental protocols outlining the specific steps and parameters employed during the testing process, as well as technical specifications and datasheets for the equipment utilised.
    `,
    [LOOKUP_KEYS.ValidationSchema]: `
Validation schemas serve as powerful tools for ensuring the integrity and consistency of data within [files](${PATHS[LOOKUP_KEYS.File]}) and validating the metadata associated with other resources in the Galv ecosystem.

These validation schemas are defined using the JSON Schema specification, a widely adopted standard for describing and validating JSON data structures. 
This flexible format enables the creation of schemas capable of validating any JSON data, regardless of its complexity or structure.

By default, Galv applies a loose validation schema to all data, ensuring adherence to the fundamental requirement of being valid JSON. 
Additionally, this default schema checks for the presence of the minimal required columns: "time", "potential difference", and "current" – essential columns for most battery cycling experiments and analyses.

However, users have the flexibility to define and apply more stringent validation schemas tailored to their specific needs. 
These custom schemas can enforce additional constraints, such as data types, value ranges, and complex relationships between different fields. 
    `,
    [LOOKUP_KEYS.Lab]: `
Labs are the top-level organizational units in Galv, composed of [teams](${PATHS[LOOKUP_KEYS.Team]}) that contain all resources. 
Your lab membership is determined by your affiliation with teams within that lab. 
Lab administrators can create new teams and manage existing team permissions, but cannot directly manage resources unless they are team members.

Labs house data from battery cycling experiments, which can be automatically collected by [harvesters](${PATHS[LOOKUP_KEYS.Harvester]}). 
The collected data are stored in Galv's systems or an [additional storage resource](${PATHS[LOOKUP_KEYS.AdditionalStorage]}) managed by the lab, allowing flexibility for large datasets or specific storage requirements.

While raw data files are stored in designated locations, associated metadata is stored in Galv's database and can be opened for collaboration within or between labs, facilitating data sharing and collaborative research efforts.
Proper management of lab structures, team memberships, and access permissions is crucial for maintaining a secure and efficient collaborative environment within the Galv ecosystem.
    `,
    [LOOKUP_KEYS.Team]: `
Teams are the fundamental organisational units within the Galv platform. 
They serve as collaborative spaces where [users](${PATHS[LOOKUP_KEYS.User]}) can work together and manage shared resources.
Each team is composed of a collection of users, and they collectively own and have control over the resources within Galv. 
The team that owns a particular resource has the authority to alter its permissions and, if necessary, delete it.

**Members** have the ability to view and edit all resources owned by the team, unless specific restrictions have been applied to certain resources. 
This collaborative access allows team members to work seamlessly on shared projects and data.

**Admins**, on the other hand, possess additional privileges beyond those of regular members. 
In addition to the viewing and editing capabilities, admins can also alter the team's permissions, granting or revoking access to resources as needed. 
This level of control enables administrators to manage the team's structure, membership, and resource access effectively.

It's important to note that team membership and roles should be carefully managed to ensure the appropriate level of access and collaboration within the Galv ecosystem. 
Best practices include periodically reviewing team memberships, assigning roles based on project needs, and implementing access controls to protect sensitive data when necessary.
    `,
    [LOOKUP_KEYS.User]: `
Users are individuals who interact with and utilise the Galv platform. 
Each user is identified by a unique username, an associated email address, and a secure password.

One of the key features of Galv is its support for team-based collaboration. 
Users can be members of multiple [teams](${PATHS[LOOKUP_KEYS.Team]}), enabling them to work together on projects, share resources, and coordinate efforts effectively.

In this section, you can view and modify your own user details. 
This includes updating your personal information, such as your email address or password, as well as managing your team memberships. 

It's important to note that user accounts and associated information should be treated with care, as they grant access to sensitive data and resources within the Galv platform. 
Best practices include using strong and unique passwords, and regularly reviewing and updating your user details to maintain a secure and reliable user experience.
    `,
    [LOOKUP_KEYS.Token]: `
Tokens can be created by users and are utilised for authenticating with Galv's API. 
This allows programmatic access and integration with Galv's services. 
Additionally, you'll see Browser session tokens, which are automatically generated when you log in to the Galv web interface, facilitating seamless authentication for your browser sessions.

If you plan to interact with Galv's API, either through custom applications or scripts, you'll need to create a dedicated token. 
These tokens act as secure credentials, granting authorized access to the API endpoints and enabling you to perform various operations programmatically.

It's important to note that tokens should be treated with care and kept confidential, as they grant access to your Galv account and associated resources. 
Best practices include generating tokens with appropriate scopes and permissions, and revoking or regenerating them periodically to maintain a high level of security.
    `,
    [LOOKUP_KEYS.GalvStorage]: `
Storage in Galv is utilised for various purposes, including storing harvested data files, attachments, and generating image previews of datasets. 
This storage functionality is essential for efficient data management and collaboration within the platform.

Galv provides a default storage resource, referred to as Galv storage. 
This storage is hosted on the Galv server instance, and each lab is allocated a specific storage quota. 
This default storage option offers a convenient and centralized solution for managing data within the Galv ecosystem.

However, if you prefer not to store files on the Galv server, you have the option to disable Galv storage and set up an [additional storage resource](${PATHS[LOOKUP_KEYS.AdditionalStorage]}). 
This alternative storage resource can be hosted and managed according to your specific requirements, providing greater flexibility and control over data storage.

In scenarios where you are at risk of exceeding your allocated storage quota on the Galv server, you can proactively set up an [additional storage resource](${PATHS[LOOKUP_KEYS.AdditionalStorage]}) to accommodate the excess data. 
This approach ensures that you can seamlessly continue storing and managing your data without disruptions or limitations.

The priority setting determines the order in which the available storage resources are utilized for storing data. 
Higher priority numbers are used first, allowing you to define the preferred storage location based on your specific needs and preferences.
    `,
    [LOOKUP_KEYS.AdditionalStorage]: `
Storage is utilised for harvested data files, attachments, and image previews of datasets.

Additional storage resources can be used for data uploaded to Galv, with the location managed by the Lab. 
You may consider using additional storage if you have a large amount of data to store or if you prefer to store your data in a location you can administer directly.

You have the option to set a quota for the storage resource, ensuring that your teams do not accidentally exceed any storage limits you may have in place.

The priority setting determines the order in which the storage resources are utilised for storing data. Storages with higher priority numbers are used first.
Storages are shown in the order of their priority, with the highest priority storage at the top of the list.
    `,
    DASHBOARD: `
The dashboard provides an overview of the resources pertinent to you and your teams. 

It displays the [files](${PATHS[LOOKUP_KEYS.File]}) gathered from the [monitored paths](${PATHS[LOOKUP_KEYS.Path]}) 
set up by your [teams](${PATHS[LOOKUP_KEYS.Team]}), along with their respective upload and validation statuses.

Additionally, the dashboard lists the resources you have permission to edit, accompanied by their validation statuses.

In the event you encounter any issues on your dashboard, you can investigate the relevant resource for more detailed information.
    `,
    ColumnMapping: `
Mappings are utilised to map the columns in a [file](${PATHS[LOOKUP_KEYS.File]}) to recognised standard columns. 
This enables Galv to comprehend the data within the file and promotes homogeneity across datasets. 
When a set of files employs the same column names to represent the same type of data, analyses can be performed across all the files.

Mappings can be automatically applied to files during the harvesting process by a [harvester](${PATHS[LOOKUP_KEYS.Harvester]}). 
If there is a clear 'best mapping' for a file, it will be applied automatically. 
However, if there are multiple equally suitable mappings, the user will need to choose a mapping or define a more appropriate one.

Mappings are ranked based on the following criteria:
- Whether they define the three key columns: "ElapsedTime_s", "Voltage_V", and "Current_A".
- Whether all the columns in the mapping are present in the file.
- The number of columns in the file that are not included in the mapping. Fewer unmatched columns are preferred.

By applying the above criteria, the best mapping is selected. A mapping will never be considered 'best' if it does not define the three key columns.

When creating mappings, be cautious of potential conflicts where two mappings are equally suitable. In such cases, all affected files will require manual disambiguation to choose the correct mapping.
    `,
} as const // Map API resources to their corresponding summaries

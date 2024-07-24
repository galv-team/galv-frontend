import {Cell, CellFamily, ColumnMapping, DataColumnType, ObservedFile, PermittedAccessLevels, Team} from "@galv/galv";

export const cells: Cell[] = [
    {
        url: "http://example.com/cells/0001-0001-0001-0001",
        id: "0001-0001-0001-0001",
        identifier: 'Test Cell 1',
        family: "http://example.com/cell_families/1000-1000-1000-1000",
        team: "http://example.com/teams/1",
        in_use: true,
        cycler_tests: [
            "http://example.com/cycler_tests/5001-0002-0003-0004",
            "http://example.com/cycler_tests/5005-0006-0007-0008"
        ],
        permissions: {
            read: true,
            write: true,
            create: false
        },
        read_access_level: 2,
        edit_access_level: 3,
        delete_access_level: 3,
        custom_properties: {
            exists: {_type: "boolean", _value: true},
            "key with space": {_type: "string", _value: "this works too!"},
            value: {_type: "string", _value: "custom"},
            PI: {_type: "number", _value: 3.14159},
            nested: {
                _type: "object",
                _value: {
                    exists: {_type: "boolean", _value: true},
                    str_key: {_type: "string", _value: "yes"},
                    value: {
                        _type: "array",
                        _value: [
                            {_type: "string", _value: "yes"},
                            {_type: "string", _value: "nested"},
                            {_type: "galv_TEAM", _value: "http://example.com/teams/1"}
                        ]
                    }
                }
            },
            str: {_type: "string", _value: "custom"},
            num: {_type: "number", _value: 3.14159},
            bool: {_type: "boolean", _value: true},
            date: {_type: "datetime", _value: "2024-04-10T15:43:20.522000Z"},
            arr: {
                _type: "array",
                _value: [
                    {_type: "string", _value: "element 1"},
                    {_type: "string", _value: "element 2"}
                ]
            },
            obj: {
                _type: "object",
                _value: {
                    key1: {_type: "string", _value: "value1"},
                    key2: {_type: "string", _value: "value2"}
                }
            },
            cf: {_type: "galv_CELL_FAMILY", _value: "http://example.com/cell_families/1000-1000-1000-1000"}
        }
    },
    {url: "http://example.com/cells/0002-0002-0002-0002", id: "0002-0002-0002-0002", identifier: 'Test Cell 2', family: "http://example.com/cell_families/1000-1000-1000-1000", in_use: false, cycler_tests: [], team: null, permissions: {read: true,write: true,create: false}},
    {url: "http://example.com/cells/0003-0003-0003-0003", id: "0003-0003-0003-0003", identifier: 'Test Cell 3', family: "http://example.com/cell_families/2000-2000-2000-2000", in_use: false, cycler_tests: [], team: null, permissions: {read: true,write: true,create: false}},
]

export const cell_families: CellFamily[] = [
    {
        url: "http://example.com/cell_families/1000-1000-1000-1000",
        id: "1000-1000-1000-1000",
        model: "Best Cell",
        manufacturer: "PowerCorp",
        team: "http://example.com/teams/1",
        chemistry: "",
        form_factor: "",
        cells: ["http://example.com/cells/0001-0001-0001-0001"],
        in_use: true,
        permissions: {
            read: true,
            write: true,
            create: false
        },
        nominal_voltage_v: 3.7
    },
    {
        url: "http://example.com/cell_families/1200-1200-1200-1200",
        id: "1200-1200-1200-1200",
        model: "Value Cell",
        manufacturer: "BudgetCorp",
        team: "http://example.com/teams/1",
        chemistry: "",
        form_factor: "",
        cells: [],
        in_use: false,
        permissions: {
            read: true,
            write: true,
            create: false
        },
        nominal_voltage_v: 3.1
    }
]

export const teams: Team[] = [
    {
        url: "http://example.com/teams/1",
        id: 1,
        name: "Test Team 1",
        lab: "http://example.com/labs/1",
        monitored_paths: [],
        cellfamily_resources: ["http://example.com/cell_families/1000-1000-1000-1000"],
        cell_resources: ["http://example.com/cells/0001-0001-0001-0001"],
        equipmentfamily_resources: [],
        equipment_resources: [],
        cyclertest_resources: [],
        permissions: {
            read: true,
            write: true,
            create: false
        },
        schedule_resources: [],
        schedulefamily_resources: [],
        experiment_resources: []
    }
]

export const access_levels: PermittedAccessLevels = {
    "read_access_level": {
        "Team Admin": 4,
        "Team Member": 3,
        "Lab Member": 2,
        "Registered User": 1,
        "Anonymous": 0
    },
    "edit_access_level": {
        "Team Admin": 4,
        "Team Member": 3,
        "Lab Member": 2,
        "Registered User": 1
    },
    "delete_access_level": {
        "Team Admin": 4,
        "Team Member": 3
    },
    "path.edit_access_level": {
        "Team Admin": 4,
        "Team Member": 3
    }
}

export const cell_models  = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"25R","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"HG2","ld_value":null,"include_in_autocomplete":true},
    {"id":1,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"VTC6","ld_value":null,"include_in_autocomplete":true}
]
export const cell_manufacturers = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Sony","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Samsung","ld_value":null,"include_in_autocomplete":true},
    {"id":1,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Toyota","ld_value":null,"include_in_autocomplete":true}
]
export const cell_form_factors = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Pocket","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Cyclindrical","ld_value":null,"include_in_autocomplete":true},
]
export const cell_chemistries = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"LiFe","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"CoFe","ld_value":null,"include_in_autocomplete":true}
]

export const equipment_types = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Thermal chamber","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Battery cycler","ld_value":null,"include_in_autocomplete":true},
]
export const equipment_manufacturers = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"LG","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Samsung","ld_value":null,"include_in_autocomplete":true},
    {"id":1,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Maccor","ld_value":null,"include_in_autocomplete":true}
]
export const equipment_models = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"PPQ","ld_value":null,"include_in_autocomplete":true},
    {"id":2,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Heatz0r","ld_value":null,"include_in_autocomplete":true},
    {"id":1,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Cycelator","ld_value":null,"include_in_autocomplete":true}
]

export const schedule_identifiers = [
    {"id":3,"created":"2023-12-06T15:10:05Z","modified":"2023-12-06T15:10:05Z","value":"Diary entries","ld_value":null,"include_in_autocomplete":true},
]

export const column_types: DataColumnType[] = [
    {"url":"http://localhost:8001/column_types/1/","id":1,"name":"Unknown","description":"unknown column type","is_default":true,"is_required":false,"unit":null,"data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/2/","id":2,"name":"SampleNumber","description":"The sample or record number. Is increased by one each time a test machine records a reading. Usually counts from 1 at the start of a test","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/1/","data_type":"int","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/3/","id":3,"name":"ElapsedTime_s","description":"The time in seconds since the test run began.","is_default":true,"is_required":true,"unit":"http://localhost:8001/units/2/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/4/","id":4,"name":"Voltage_V","description":"The voltage of the cell.","is_default":true,"is_required":true,"unit":"http://localhost:8001/units/3/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/5/","id":5,"name":"Current_A","description":"The current current.","is_default":true,"is_required":true,"unit":"http://localhost:8001/units/4/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/6/","id":6,"name":"EnergyCapacity_W.h","description":"The Energy Capacity.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/5/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/7/","id":7,"name":"ChargeCapacity_A.h","description":"The Charge Capacity.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/6/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/8/","id":8,"name":"Temperature_K","description":"The temperature.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/7/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/9/","id":9,"name":"StepTime_s","description":"The time in seconds since the current step began.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/8/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/10/","id":10,"name":"ImpedenceMagnitude","description":"The magnitude of the impedence (EIS).","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/9/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/11/","id":11,"name":"ImpedencePhase","description":"The phase of the impedence (EIS).","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/10/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/12/","id":12,"name":"Frequency_s-1","description":"The frequency of the input EIS voltage signal.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/11/","data_type":"float","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/13/","id":13,"name":"StepNumber","description":"The step number.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/1/","data_type":"int","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},
    {"url":"http://localhost:8001/column_types/14/","id":14,"name":"UnknownStr","description":"Unknown string datatype. DO NOT USE for columns with huge numbers of different values, e.g. dates/numbers. Use appropriate types for those columns.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/1/","data_type":"str","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3},{"url":"http://localhost:8001/column_types/15/","id":15,"name":"DateTime","description":"A date/time value.","is_default":true,"is_required":false,"unit":"http://localhost:8001/units/1/","data_type":"datetime64[ns]","team":null,"columns":[],"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":3,"delete_access_level":3}
]

export const files: ObservedFile[] = [
    {"url":"http://localhost:8001/files/15a9d735-0efa-4450-857b-0c218c5ac023/","id":"15a9d735-0efa-4450-857b-0c218c5ac023","harvester":"http://localhost:8001/harvesters/70691c9a-897a-43fa-8ec8-e3850183b858/","name":"TPG1+-+Cell+15+-+002","path":"/usr/harvester/.test-data/test-suite-small/TPG1+-+Cell+15+-+002.txt","state":"IMPORTED","parser":"MaccorInputFile","num_rows":401993,"first_sample_no":1,"last_sample_no":401994,"extra_metadata":{"ES":{"has_data":true,"is_numeric":true},"ACR":{"has_data":false,"is_numeric":true},"Amps":{"unit":"Amps","has_data":true,"is_numeric":true},"Cyc#":{"has_data":false,"is_numeric":true},"DCIR":{"has_data":false,"is_numeric":true},"Rec#":{"unit":"","has_data":true,"is_numeric":true},"Step":{"has_data":true,"is_numeric":true},"FLGx1":{"has_data":false,"is_numeric":true},"FLGx2":{"has_data":false,"is_numeric":true},"FLGx3":{"has_data":false,"is_numeric":true},"FLGx4":{"has_data":false,"is_numeric":true},"FLGx5":{"has_data":false,"is_numeric":true},"FLGx6":{"has_data":false,"is_numeric":true},"FLGx7":{"has_data":false,"is_numeric":true},"FLGx8":{"has_data":false,"is_numeric":true},"FLGx9":{"has_data":false,"is_numeric":true},"State":{"has_data":true,"is_numeric":false},"VARx1":{"has_data":true,"is_numeric":true},"VARx2":{"has_data":true,"is_numeric":true},"VARx3":{"has_data":false,"is_numeric":true},"VARx4":{"has_data":false,"is_numeric":true},"VARx5":{"has_data":false,"is_numeric":true},"VARx6":{"has_data":false,"is_numeric":true},"VARx7":{"has_data":false,"is_numeric":true},"VARx8":{"has_data":false,"is_numeric":true},"VARx9":{"has_data":false,"is_numeric":true},"Volts":{"unit":"Volts","has_data":true,"is_numeric":true},"Amp-hr":{"unit":"Amp-hr","has_data":true,"is_numeric":true},"EV Hum":{"has_data":false,"is_numeric":true},"FLGx10":{"has_data":false,"is_numeric":true},"FLGx11":{"has_data":false,"is_numeric":true},"FLGx12":{"has_data":false,"is_numeric":true},"FLGx13":{"has_data":false,"is_numeric":true},"FLGx14":{"has_data":false,"is_numeric":true},"FLGx15":{"has_data":false,"is_numeric":true},"FLGx16":{"has_data":false,"is_numeric":true},"FLGx17":{"has_data":false,"is_numeric":true},"FLGx18":{"has_data":false,"is_numeric":true},"FLGx19":{"has_data":false,"is_numeric":true},"FLGx20":{"has_data":false,"is_numeric":true},"FLGx21":{"has_data":false,"is_numeric":true},"FLGx22":{"has_data":false,"is_numeric":true},"FLGx23":{"has_data":false,"is_numeric":true},"FLGx24":{"has_data":false,"is_numeric":true},"FLGx25":{"has_data":false,"is_numeric":true},"FLGx26":{"has_data":false,"is_numeric":true},"FLGx27":{"has_data":false,"is_numeric":true},"FLGx28":{"has_data":false,"is_numeric":true},"FLGx29":{"has_data":false,"is_numeric":true},"FLGx30":{"has_data":false,"is_numeric":true},"FLGx31":{"has_data":false,"is_numeric":true},"FLGx32":{"has_data":false,"is_numeric":true},"Temp 1":{"unit":"celsius","has_data":true,"is_numeric":true},"VARx10":{"has_data":false,"is_numeric":true},"VARx11":{"has_data":false,"is_numeric":true},"VARx12":{"has_data":false,"is_numeric":true},"VARx13":{"has_data":false,"is_numeric":true},"VARx14":{"has_data":false,"is_numeric":true},"VARx15":{"has_data":false,"is_numeric":true},"EV Temp":{"has_data":false,"is_numeric":true},"Watt-hr":{"unit":"Watt-hr","has_data":true,"is_numeric":true},"DPt Time":{"has_data":true,"is_numeric":false},"StepTime":{"unit":"s","has_data":true,"is_numeric":true},"TestTime":{"unit":"s","has_data":true,"is_numeric":true}},"last_observed_time":"2024-04-15T11:51:12.620099Z","last_observed_size":140480746,"has_required_columns":true,"upload_errors":["http://localhost:8001/harvest_errors/9/","http://localhost:8001/harvest_errors/10/","http://localhost:8001/harvest_errors/11/","http://localhost:8001/harvest_errors/12/","http://localhost:8001/harvest_errors/13/","http://localhost:8001/harvest_errors/14/","http://localhost:8001/harvest_errors/15/","http://localhost:8001/harvest_errors/16/"],"summary": "http://localhost:8001/files/15a9d735-0efa-4450-857b-0c218c5ac023/summary/","applicable_mappings":"http://localhost:8001/files/15a9d735-0efa-4450-857b-0c218c5ac023/applicable_mappings/","parquet_partitions":["http://localhost:8001/parquet_partitions/b2f283bf-9ce1-409d-abd3-fbec2f5d6b10/","http://localhost:8001/parquet_partitions/1db991ef-af09-4c83-ab83-ba7c0c17ba96/","http://localhost:8001/parquet_partitions/18c54a95-e10a-4708-8461-5a3047f0a080/","http://localhost:8001/parquet_partitions/e7059153-ba0b-476b-9383-a268cc006a6a/","http://localhost:8001/parquet_partitions/3fd835d0-66e3-4c2e-959f-0b8d9036c31c/"],"upload_info":null,"permissions":{"write":true,"read":true},"mapping":"http://localhost:8001/column_mappings/589b482b-a1ba-478f-aa04-d6958caa252d/"}
] as const

export const file_applicable_mappings: {mapping: ColumnMapping, missing: number}[] = [
    {"mapping":{"url":"http://localhost:8001/column_mappings/589b482b-a1ba-478f-aa04-d6958caa252d/","id":"589b482b-a1ba-478f-aa04-d6958caa252d","name":"Maccor .txt","map":{"Amps":{"multiplier":0.001,"column_type":5},"Rec#":{"column_type":2},"Step":{"column_type":13},"State":{"new_name":"State","column_type":14},"Volts":{"column_type":4},"Temp 1":{"addition":273.15,"column_type":8},"DPt Time":{"column_type":15},"StepTime":{"column_type":9},"TestTime":{"column_type":3}},"rendered_map":{"Amps":{"new_name":"Current_A","data_type":"float","multiplier":0.001,"addition":0},"Rec#":{"new_name":"SampleNumber","data_type":"int","multiplier":1,"addition":0},"Step":{"new_name":"StepNumber","data_type":"int","multiplier":1,"addition":0},"State":{"new_name":"State","data_type":"str"},"Volts":{"new_name":"Voltage_V","data_type":"float","multiplier":1,"addition":0},"Temp 1":{"new_name":"Temperature_K","data_type":"float","multiplier":1,"addition":273.15},"DPt Time":{"new_name":"DateTime","data_type":"datetime64[ns]"},"StepTime":{"new_name":"StepTime_s","data_type":"float","multiplier":1,"addition":0},"TestTime":{"new_name":"ElapsedTime_s","data_type":"float","multiplier":1,"addition":0}},"is_valid":true,"missing_required_columns":[],"in_use":true,"team":null,"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":4,"delete_access_level":3},"missing":5},{"mapping":{"url":"http://localhost:8001/column_mappings/bc15cf45-9609-42a7-8b63-30404cf6d9ae/","id":"bc15cf45-9609-42a7-8b63-30404cf6d9ae","name":"X","map":{"Amps":{"addition":0,"multiplier":1,"column_type":5},"Rec#":{"addition":0,"multiplier":1,"column_type":2},"State":{"addition":0,"multiplier":1,"column_type":1},"Volts":{"addition":0,"multiplier":1,"column_type":4},"TestTime":{"addition":0,"multiplier":1,"column_type":3}},"rendered_map":{"Amps":{"new_name":"Current_A","data_type":"float","multiplier":1,"addition":0},"Rec#":{"new_name":"SampleNumber","data_type":"int","multiplier":1,"addition":0},"State":{"new_name":"Unknown","data_type":"float","multiplier":1,"addition":0},"Volts":{"new_name":"Voltage_V","data_type":"float","multiplier":1,"addition":0},"TestTime":{"new_name":"ElapsedTime_s","data_type":"float","multiplier":1,"addition":0}},"is_valid":true,"missing_required_columns":[],"in_use":false,"team":"http://localhost:8001/teams/1/","permissions":{"create":true,"destroy":true,"write":true,"read":true},"read_access_level":2,"edit_access_level":3,"delete_access_level":3},"missing":9},{"mapping":{"url":"http://localhost:8001/column_mappings/18c84b27-6be7-4af1-8fd6-8cce3d68bf24/","id":"18c84b27-6be7-4af1-8fd6-8cce3d68bf24","name":"sss","map":{"Amps":{"addition":0,"multiplier":1,"column_type":5}},"rendered_map":{"Amps":{"new_name":"Current_A","data_type":"float","multiplier":1,"addition":0}},"is_valid":false,"missing_required_columns":["ElapsedTime_s","Voltage_V"],"in_use":false,"team":"http://localhost:8001/teams/1/","permissions":{"create":true,"destroy":true,"write":true,"read":true},"read_access_level":2,"edit_access_level":3,"delete_access_level":3},"missing":13},
    {"mapping":{"url":"http://localhost:8001/column_mappings/8ba73561-bf79-46f6-951a-ccb752acb7cc/","id":"8ba73561-bf79-46f6-951a-ccb752acb7cc","name":"import as float","map":{},"rendered_map":{},"is_valid":false,"missing_required_columns":["Current_A","ElapsedTime_s","Voltage_V"],"in_use":true,"team":null,"permissions":{"create":true,"destroy":false,"write":false,"read":true},"read_access_level":0,"edit_access_level":4,"delete_access_level":3},"missing":14}
]

export const column_mappings = file_applicable_mappings.map(x => x.mapping)

export const file_summary = {"ES":{"0":"0","1":"1","2":"1","3":"1","4":"1","5":"129","6":"17","7":"192","8":"0","9":"1"},"Amps":{"0":"0.00","1":"0.00","2":"0.00","3":"0.00","4":"0.00","5":"0.00","6":"0.00","7":"0.00","8":"0.00","9":"0.00"},"Rec#":{"0":"1","1":"2","2":"3","3":"4","4":"5","5":"6","6":"7","7":"8","8":"9","9":"10"},"Step":{"0":"1","1":"1","2":"1","3":"1","4":"1","5":"1","6":"2","7":"2","8":"1","9":"1"},"State":{"0":"R","1":"R","2":"R","3":"R","4":"R","5":"R","6":"P","7":"S","8":"R","9":"R"},"VARx1":{"0":"0.00","1":"0.00","2":"0.00","3":"0.00","4":"0.00","5":"0.00","6":"0.00","7":"0.00","8":"0.00","9":"0.00"},"VARx2":{"0":"0.00","1":"0.00","2":"0.00","3":"0.00","4":"0.00","5":"0.00","6":"0.00","7":"0.00","8":"0.00","9":"0.00"},"Volts":{"0":"3.52","1":"3.52","2":"3.52","3":"3.52","4":"3.52","5":"3.52","6":"3.52","7":"3.52","8":"3.52","9":"3.52"},"Amp-hr":{"0":"0.00","1":"0.00","2":"0.00","3":"0.00","4":"0.00","5":"0.00","6":"0.00","7":"0.00","8":"0.00","9":"0.00"},"Temp 1":{"0":"24.63","1":"24.63","2":"24.63","3":"24.63","4":"24.63","5":"24.63","6":"24.63","7":"24.63","8":"24.63","9":"24.63"},"Watt-hr":{"0":"0.00","1":"0.00","2":"0.00","3":"0.00","4":"0.00","5":"0.00","6":"0.00","7":"0.00","8":"0.00","9":"0.00"},"DPt Time":{"0":"02/23/2018 8:42:16 AM","1":"02/23/2018 8:42:17 AM","2":"02/23/2018 8:42:18 AM","3":"02/23/2018 8:42:19 AM","4":"02/23/2018 8:42:20 AM","5":"02/23/2018 8:42:21 AM","6":"02/23/2018 8:42:21 AM","7":"02/23/2018 8:42:21 AM","8":"02/23/2018 8:42:22 AM","9":"02/23/2018 8:42:23 AM"},"StepTime":{"0":"0","1":"0.0166666666666667","2":"0.0333333333333333","3":"0.05","4":"0.0666666666666667","5":"0.0833333333333333","6":"0.0833333333333333","7":"0.0833333333333333","8":"0","9":"0.0166666666666667"},"TestTime":{"0":"0","1":"0.0166666666666667","2":"0.0333333333333333","3":"0.05","4":"0.0666666666666667","5":"0.0833333333333333","6":"0.0833333333333333","7":"0.0833333333333333","8":"0.0833333333333333","9":"0.1"}}

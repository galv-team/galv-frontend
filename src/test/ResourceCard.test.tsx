// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// @ts-expect-error - globalThis is not defined in Jest
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import {LOOKUP_KEYS} from "../constants";
import React from 'react';
import {render, screen, within, waitFor, cleanup} from '@testing-library/react';
import axios, {AxiosResponse, AxiosRequestConfig} from 'axios';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FilterContextProvider} from "../Components/filtering/FilterContext";
import {MemoryRouter} from "react-router-dom";
import FetchResourceContextProvider from "../Components/FetchResourceContext";
import {Cell, PermittedAccessLevels, CellFamily, Team} from "@battery-intelligence-lab/galv";
import SelectionManagementContextProvider from "../Components/SelectionManagementContext";
import access_levels_response from './fixtures/access_levels.json';
import {act} from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";

jest.mock('../Components/Representation')
jest.mock('../Components/ResourceChip')
jest.mock('../ClientCodeDemo')

// Mock jest and set the type
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ResourceCard = jest.requireActual('../Components/ResourceCard').default;

const api_data: {
    cell: Cell,
    cell_family: CellFamily,
    cell_family_2: CellFamily,
    team: Team,
    access_levels: PermittedAccessLevels
} = {
    cell: {
        url: "http://example.com/cells/0001-0001-0001-0001",
        uuid: "0001-0001-0001-0001",
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
    cell_family: {
        url: "http://example.com/cell_families/1000-1000-1000-1000",
        uuid: "1000-1000-1000-1000",
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
        nominal_voltage: 3.7
    },
    cell_family_2: {
        url: "http://example.com/cell_families/1200-1200-1200-1200",
        uuid: "1200-1200-1200-1200",
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
        nominal_voltage: 3.1
    },
    team: {
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
    },
    access_levels: access_levels_response
}

const make_axios_response = (data: object, etc: Partial<AxiosResponse>) => {
    return Promise.resolve({status: 200, statusText: "OK", ...etc, data} as AxiosResponse)
}
const make_paged_axios_response = (data: unknown[], etc: Partial<AxiosResponse>) => {
    return make_axios_response({count: data.length, next: null, previous: null, results: data}, etc)
}

const ContextStack = ({children}: {children: React.ReactNode}) => {
    const queryClient = new QueryClient();
    return (
        <MemoryRouter initialEntries={["/"]}>
            <SelectionManagementContextProvider>
                <QueryClientProvider client={queryClient}>
                    <FetchResourceContextProvider>
                        <FilterContextProvider>
                            {children}
                        </FilterContextProvider>
                    </FetchResourceContextProvider>
                </QueryClientProvider>
            </SelectionManagementContextProvider>
        </MemoryRouter>
    )
}

const do_render = async () => {
    jest.clearAllMocks()
    cleanup()

    // Set up a mini mock server to respond to axios requests
    mockedAxios.request.mockImplementation((config: AxiosRequestConfig) => {
        if (config.url) {
            const url = config.url.replace(/\/$/, "")
            if (url.endsWith(api_data.cell.uuid))
                return make_axios_response(api_data.cell, {config})
            if (url.endsWith(api_data.cell_family.uuid))
                return make_axios_response(api_data.cell_family, {config})
            if (url.endsWith(api_data.cell_family_2.uuid))
                return make_axios_response(api_data.cell_family_2, {config})
            if (/access_levels/.test(url))
                return make_axios_response(access_levels_response, {config})
            if (/cell_families$/.test(url))
                return make_paged_axios_response([api_data.cell_family, api_data.cell_family_2], {config})
            if (/teams$/.test(url))
                return make_paged_axios_response([api_data.team], {config})
            // handle cell_models etc
            let key = /cell_(\w+)$/.exec(url)?.[1]
            key = key?.replace(/ies$/, "y")
            key = key?.replace(/s$/, "")
            if (key && Object.keys(api_data.cell_family).includes(key))
                return make_paged_axios_response([api_data.cell_family[key as keyof CellFamily]], {config})
        }
        console.error(`Unexpected axios request`, config)
        throw new Error(`Unexpected axios request to ${config.url ?? "unspecified URL"}`)
    })

    render(
        <ContextStack>
            <ResourceCard<Cell>
                lookup_key={LOOKUP_KEYS.CELL}
                resource_id="0001-0001-0001-0001"
                expanded
            />
        </ContextStack>
    )

    await screen.findByRole('heading', { name: /^Read-only properties$/ });

    // console.log(mockedAxios.request.mock.calls)
    // screen.debug(undefined, 1000000)
}

/**
 * Wait for a certain amount of time
 *
 * Used to ensure that React has actually updated the DOM before we check it
 * @param ms
 */
function wait(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

jest.setTimeout(30000)

describe('ResourceCard', () => {
    beforeEach(async () => await do_render())

    describe('ResourceCard basic rendering', () => {
        it('renders', async () => {
            const read_only_heading = await screen.findByRole('heading', { name: /^Read-only properties$/ });
            const read_only_table = read_only_heading.parentElement!.parentElement!.nextElementSibling;
            expect(read_only_table).not.toBe(null);
            const uuid_heading = within(read_only_table as HTMLElement).getByText(/uuid/);
            within(uuid_heading.parentElement!.parentElement!.nextElementSibling as HTMLElement)
                .getByText(api_data.cell.uuid);

            const editable_heading = await screen.findByRole('heading', { name: /^Editable properties$/ });
            // Editable properties has a permissions table as its first sibling
            const editable_table = editable_heading.parentElement!.parentElement!.nextElementSibling!.nextElementSibling;
            expect(editable_table).not.toBe(null);
            const identifier_heading = within(editable_table as HTMLElement)
                .getByRole("rowheader", {name: /identifier/});
            within(identifier_heading.parentElement! as HTMLElement)
                .getByRole("cell", {name: api_data.cell.identifier});

            const custom_heading = await screen.findByRole('heading', { name: /^Custom properties$/ });
            const custom_table = custom_heading.parentElement!.parentElement!.nextElementSibling;
            expect(custom_table).not.toBe(null);
            const nested_heading = within(custom_table as HTMLElement)
                .getByRole("rowheader", {name: /key with space/});
            within(nested_heading.parentElement! as HTMLElement)
                .getByRole("cell", {name: api_data.cell.custom_properties!["key with space"]._value});

            const inherited_heading = await screen.findByRole('heading', { name: /^Inherited from / });
            const inherited_table = inherited_heading.parentElement!.parentElement!.nextElementSibling;
            expect(inherited_table).not.toBe(null);
            const nominal_voltage_heading = within(inherited_table as HTMLElement)
                .getByRole("rowheader", {name:/nominal_voltage/});
            within(nominal_voltage_heading.parentElement! as HTMLElement)
                .getByRole("cell", {name: api_data.cell_family.nominal_voltage!.toString()});
        })

        it('expands and collapses', () => {
            act(() => screen.getByRole('button', {name: /Hide details/i}).click());
            expect(screen.queryByRole('heading', {name: /^Read-only properties$/})).toBe(null);

            act(() => screen.getByRole('button', {name: /Show details/i}).click());
            expect(screen.queryByRole('heading', {name: /^Read-only properties$/})).not.toBe(null);
        })
    })

    describe('ResourceCard interactivity', () => {

        it('allows editing editable properties', async () => {
            const user = userEvent.setup();
            const new_value = "New Value";

            // Change the identifier
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /identifier/})
            const input = within(id_label.parentElement! as HTMLElement).getByRole('textbox');
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', {name: /Save/i}));
            await screen.findByRole('button', {name: /Edit this /i});
            const last_call = mockedAxios.request.mock.lastCall?
                mockedAxios.request.mock.lastCall[0] : undefined;
            expect(last_call).toHaveProperty("method", "PATCH");
            expect(JSON.parse(last_call?.data).identifier === new_value).toBeTruthy();
        })

        it('supports undo and redo', async () => {
            const user = userEvent.setup();

            // Change the identifier
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /identifier/});
            const input = within(id_label.parentElement! as HTMLElement).getByRole('textbox');
            const old_value = input.getAttribute('value');

            // Check undo and redo buttons are disabled
            const undo_button = within(screen.getByTitle(/Undo/i)).getByRole('button');
            const redo_button = within(screen.getByTitle(/Redo/i)).getByRole('button');
            expect(undo_button).toBeDisabled();
            expect(redo_button).toBeDisabled();

            await user.click(input)
            await user.clear(input)
            await user.keyboard("{Enter}")
            expect(input).toHaveValue("");

            // Click the undo button
            expect(undo_button).toBeEnabled();
            await user.click(undo_button);
            await waitFor(() => expect(input).toHaveValue(old_value), {timeout: 1000});

            expect(undo_button).toBeDisabled();
            expect(redo_button).toBeEnabled();

            await user.click(redo_button);
            await waitFor(() => expect(input).toHaveValue(""), {timeout: 1000});
            expect(undo_button).toBeEnabled();
            expect(redo_button).toBeDisabled();
        })

        it('supports resetting', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm');
            confirmSpy.mockImplementation(jest.fn(() => true));
            const user = userEvent.setup();

            // Change the identifier
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /identifier/});
            const input = within(id_label.parentElement! as HTMLElement)
                .getByRole('textbox');
            const old_value = input.getAttribute('value');

            await user.click(input)
            await user.clear(input)
            await user.keyboard("{Enter}")
            expect(input).toHaveValue("");

            // Click the reset button
            const reset_button = screen.getByRole('button', {name: /Discard/i});
            await user.click(reset_button);
            await waitFor(() => {
                // We should no longer be in edit mode - the button should be back and the input should have the old value
                expect(screen.queryByRole('button', {name: /Save/i})).toBe(null);
                expect(screen.queryByRole('button', {name: /Edit this /i})).not.toBe(null);
                within(id_label.parentElement! as HTMLElement).getByRole('cell', {name: old_value!});
            }, {timeout: 1000});
        })

        it('prevents editing non-editable properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /url/});
            expect(within(id_label).queryByRole('textarea')).toBeNull();
            const value = within(id_label.parentElement! as HTMLElement)
                .queryByRole('cell', {name: api_data.cell.url});
            expect(within(value!).queryByRole('textbox')).toBeNull();
        })

        it('allows editing custom properties', async () => {
            const user = userEvent.setup();
            const new_value = "New Value";

            // Change the identifier
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole('rowheader', {name: /key with space/})
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox')
                .filter(e => e instanceof HTMLInputElement && e.value === api_data.cell.custom_properties!["key with space"]._value)
                .pop()!;
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', {name: /Save/i}));
            await screen.findByRole('button', {name: /Edit this /i});
            const last_call = mockedAxios.request.mock.lastCall?
                mockedAxios.request.mock.lastCall[0] : undefined;
            expect(last_call).toHaveProperty("method", "PATCH");
            expect(JSON.parse(last_call?.data).custom_properties["key with space"]._value === new_value).toBeTruthy();
        })

        it('allows editing nested custom properties', async () => {
            const user = userEvent.setup();
            const new_value = "New Value";

            // Change the identifier
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const wrapper = screen.getByRole('rowheader', {name: /nested/})
            const id_label = within(wrapper.parentElement! as HTMLElement)
                .getByRole('rowheader', {name: /str_key/});
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox')
                .filter(e => e instanceof HTMLInputElement && e.value === api_data.cell.custom_properties!.nested._value.str_key._value)
                .pop()!;
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', {name: /Save/i}));
            await screen.findByRole('button', {name: /Edit this /i});
            const last_call = mockedAxios.request.mock.lastCall?
                mockedAxios.request.mock.lastCall[0] : undefined;
            expect(last_call).toHaveProperty("method", "PATCH");
            expect(JSON.parse(last_call?.data).custom_properties.nested._value.str_key._value === new_value).toBeTruthy();
        })

        it('prevents adding new properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));

            for (const heading_name of [
                /^Read-only properties$/i, /^Editable properties$/i, /^Inherited from /i
            ]) {
                const heading = await screen.findByRole('heading', { name: heading_name });
                const table = heading.parentElement!.parentElement!.nextElementSibling!;
                const adjusted_table = heading_name.test("Editable properties")? table.nextElementSibling! : table;
                const add_button = within(adjusted_table! as HTMLElement).queryByRole('rowheader', {name: /\+ KEY/i});
                expect(add_button).toBeNull();
            }
        })
        it('allows adding new custom_properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));

            const heading = await screen.findByRole('heading', { name: /^Custom properties$/ });
            const table = heading.parentElement!.parentElement!.nextElementSibling!;
            const add_button = within(table! as HTMLElement)
                .getAllByRole('rowheader', {name: /\+ KEY/i}).pop();

            // Try to add a new key
            const input = within(add_button!).getByRole('textbox');
            await user.click(input);
            await user.keyboard("x");
            await user.keyboard("{Enter}");

            // Save the changes
            await user.click(screen.getByRole('button', {name: /Save/i}));
            const last_call = mockedAxios.request.mock.lastCall?
                mockedAxios.request.mock.lastCall[0] : undefined;
            expect(last_call).toHaveProperty("method", "PATCH");
            expect(JSON.parse(last_call?.data).custom_properties.x).toStrictEqual({_type: "string", _value: ""});
        })
    })

    describe('ResourceCard advanced editing', () => {
        it('allows booleans to be changed', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /^key bool$/});
            const input = within(id_label.parentElement! as HTMLElement).getByRole('checkbox');
            expect(input).toBeChecked();
            await user.click(input)
            await wait()
            expect(input).not.toBeChecked();
        })
        it('allows strings to be changed', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /^key str$/});
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox').pop()!;
            expect(input).toHaveValue("custom");
            await user.click(input)
            await user.clear(input)
            await user.keyboard("X")
            await user.keyboard("{Enter}")
            await wait()
            expect(input).toHaveValue("X");
        })
        it('allows numbers to be changed', async () => {
            console.log("allows numbers to be changed")
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /^key num$/});
            const input = within(id_label.parentElement! as HTMLInputElement).getByRole('spinbutton');
            expect(input).toHaveValue(3.14159);
            await user.click(input)
            await user.clear(input)
            await user.keyboard("9");
            await user.click(id_label)
            await wait()
            expect(input).toHaveValue(9);
        })
        async function get_array() {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            return {user, row: screen.getByRole('rowheader', {name: /^key arr$/}).parentElement! as HTMLElement};
        }
        it('allows array elements to be changed', async () => {
            const {user, row} = await get_array();
            const input = within(row).getAllByRole('textbox').splice(1, 1)![0];
            expect(input).toHaveValue("element 1")
            await user.click(input)
            await user.clear(input)
            await user.keyboard("X")
            await user.keyboard("{Enter}")
            await wait()
            expect(input).toHaveValue("X");
        })
        it('allows adding new array elements', async () => {
            const {user, row} = await get_array();
            const old_element_count = within(row).getAllByRole('textbox').length;
            const last_input = within(row).getAllByRole('textbox').pop()!;
            expect(last_input).toHaveValue("");
            await user.click(last_input);
            await user.keyboard("Y");
            await user.keyboard("{Enter}");
            await wait();
            const new_element_count = within(row).getAllByRole('textbox').length;
            expect(new_element_count).toBe(old_element_count + 1);
        })
        it('allows removing array elements', async () => {
            const {user, row} = await get_array();
            const old_element_count = within(row).getAllByRole('textbox').length;
            console.log("allows removing array elements")
            screen.debug(row, 1000000)
            const first_remove_button = within(row).getAllByTestId('RemoveIcon').shift()!;
            await user.click(first_remove_button);
            await wait();
            const new_element_count = within(row).getAllByRole('textbox').length;
            expect(new_element_count).toBe(old_element_count - 1);
        })
        async function get_object() {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            return {user, row: screen.getByRole('rowheader', {name: /^key obj$/}).parentElement! as HTMLElement};
        }
        it('allows object keys to be changed', async () => {
            const {user, row} = await get_object();
            const input = within(row).getAllByRole('textbox', {name: "key"}).splice(1, 1)![0];
            expect(input).toHaveValue("key1");
            await user.click(input)
            await user.clear(input)
            await user.keyboard("X")
            await user.keyboard("{Enter}")
            await wait()
            expect(input).toHaveValue("X");
        })
        it('allows object values to be changed', async () => {
            const {user, row} = await get_object();
            const input = within(row).getAllByRole('textbox', {name: "value"}).shift()!;
            expect(input).toHaveValue("value1");
            await user.click(input)
            await user.clear(input)
            await user.keyboard("X")
            await user.keyboard("{Enter}")
            await wait()
            expect(input).toHaveValue("X");
        })
        it('allows adding new object keys', async () => {
            const {user, row} = await get_object();
            const old_element_count = within(row).getAllByRole('textbox').length;
            const input = within(row).getByRole('textbox', {name: /\+ KEY/i});
            expect(input).toHaveValue("");
            await user.click(input);
            await user.keyboard("X");
            await user.keyboard("{Enter}");
            await wait();
            const new_element_count = within(row).getAllByRole('textbox').length;
            expect(new_element_count).toBe(old_element_count + 2);  // 1 key, 1 value
        })
        it('allows removing object keys', async () => {
            const {user, row} = await get_object();
            const old_element_count = within(row).getAllByRole('textbox').length;
            const input = within(row).getAllByRole('textbox', {name: "key"}).splice(1, 1)![0];
            expect(input).toHaveValue("key1");
            await user.click(input)
            await user.clear(input)
            await user.keyboard("{Enter}")
            await wait()
            const new_element_count = within(row).getAllByRole('textbox').length;
            expect(new_element_count).toBe(old_element_count - 2);  // 1 key, 1 value
        })
        it('allows resources to be changed', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /^key cf$/});
            const input = within(id_label.parentElement! as HTMLElement).getByRole('combobox');
            expect(input).toHaveValue(`representation: CELL_FAMILY [${api_data.cell_family.uuid}]`);
            await user.click(input)
            console.log("allows resources to be changed")
            screen.debug(input, 1000000)
            await user.clear(input)
            await user.keyboard("2")  // should match the second cell family
            const autocomplete = await screen.findByRole('listbox');
            const option = within(autocomplete).getByText(`representation: CELL_FAMILY [${api_data.cell_family_2.uuid}]`);
            await user.click(option);
            await wait()
            expect(input).toHaveValue(`representation: CELL_FAMILY [${api_data.cell_family_2.uuid}]`);
        })
    })

    describe('ResourceCard type changing', () => {
        async function setup(
            rowheader_name: string,
            new_type: string
        ) {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const row = screen.getByRole("rowheader", {name: rowheader_name}).parentElement!;
            const changer = within(row as HTMLElement).getAllByRole('button').shift()!;
            await user.click(changer);
            await wait(300);

            if (new_type.startsWith("galv_")) {
                const dots = document.querySelector(`[title="Resource types"]`);
                expect(dots).not.toBeNull();
                await user.click(dots!);
                await wait(300);
            }

            const button = document.querySelector(`button[value="${new_type}"]`);
            expect(button).not.toBeNull();
            await user.click(button!);
            await wait();
            return row
        }

        it('forbids changing the type of properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /^identifier$/});
            const changer = within(id_label.parentElement! as HTMLElement).queryByRole('button');
            expect(changer).toBeDisabled();
        })
        // Mapping specific type changes
        it('allows changing the type of a string to a boolean', async () => {
            const row = await setup("key str", "boolean");
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a string to a number', async () => {
            const row = await setup("key str", "number");
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of a string to an array', async () => {
            const row = await setup("key str", "array");
            // Expect the length to be 3: key, value, and add new element
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of a string to an object', async () => {
            const row = await setup("key str", "object");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(4)
        })
        it('allows changing the type of a boolean to a string', async () => {
            const row = await setup("key bool", "string");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue("true");
        })
        it('allows changing the type of a boolean to a number', async () => {
            const row = await setup("key bool", "number");
            expect(within(row).getByRole('spinbutton')).toHaveValue(1)
        })
        it('allows changing the type of a boolean to an array', async () => {
            const row = await setup("key bool", "array");
            // Value and add new element are present as checkboxes
            expect(within(row).getAllByRole('checkbox').length).toBe(2)
        })
        it('allows changing the type of a boolean to an object', async () => {
            const row = await setup("key bool", "object");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of a number to a string', async () => {
            const row = await setup("key num", "string");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop())
                .toHaveValue(api_data.cell.custom_properties?.num._value.toString());
        })
        it('allows changing the type of a number to a boolean', async () => {
            const row = await setup("key num", "boolean");
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a number to an array', async () => {
            const row = await setup("key num", "array");
            // value, and add new element
            expect(within(row).getAllByRole('spinbutton').length).toBe(2)
        })
        it('allows changing the type of a number to an object', async () => {
            const row = await setup("key num", "object");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of an array to a string', async () => {
            const row = await setup("key arr", "string");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop())
                .toHaveValue(`["element 1","element 2"]`)
        })
        it('allows changing the type of an array to a boolean', async () => {
            const row = await setup("key arr", "boolean");
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of an array to a number', async () => {
            const row = await setup("key arr", "number");
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of an array to an object', async () => {
            const row = await setup("key arr", "object");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(6)
        })
        it('allows changing the type of an object to a string', async () => {
            const row = await setup("key obj", "string");
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop())
                .toHaveValue(`{"key1":"value1","key2":"value2"}`)
        })
        it('allows changing the type of an object to a boolean', async () => {
            const row = await setup("key obj", "boolean");
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of an object to a number', async () => {
            const row = await setup("key obj", "number");
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of an object to an array', async () => {
            const row = await setup("key obj", "array");
            // Expect the length to be 4: key, value, value, and add new element
            expect(within(row).getAllByRole('textbox').length).toBe(4)
        })

        /**
         * TODO: Fix the console error spam about wrapping updates in `act()`
         */
        it('allows changing the type of a resource to a string', async () => {
            const row = await setup("key cf", "string");
            expect(within(row).getAllByRole('textbox').pop())
                .toHaveValue(`http://example.com/cell_families/1000-1000-1000-1000`)
        })
        it('allows changing the type of a resource to a boolean', async () => {
            const row = await setup("key cf", "boolean");
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a resource to a number', async () => {
            const row = await setup("key cf", "number");
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of a resource to an array', async () => {
            const row = await setup("key cf", "array");
            // Expect the length to be 2: value, and add new element
            expect(within(row).getAllByRole('combobox').length).toBe(2)
        })
        it('allows changing the type of a resource to an object', async () => {
            const row = await setup("key cf", "object");
            // Expect the length to be 1: value
            expect(within(row).getAllByRole('combobox').length).toBe(1)
        })

        // TODO: Fix these tests - can't get them to actually change the type
        // The button registers as clicked, but the type update rerender doesn't seem to happen.
        // it('allows changing the type of a string to a resource', async () => {
        //     const row = await setup("key str", "galv_CELL");
        //     expect(within(row).getByRole('combobox')).toHaveValue("undefined/cells/custom")
        // })
        // it('allows changing the type of a boolean to a resource', async () => {
        //     const row = await setup("key bool", "galv_CELL");
        //     expect(within(row).getByRole('combobox')).toHaveValue("")
        // })
        // it('allows changing the type of a number to a resource', async () => {
        //     const row = await setup("key num", "galv_CELL");
        //     expect(within(row).getByRole('combobox')).toHaveValue("")
        // })
        // it('allows changing the type of an array to a resource', async () => {
        //     const row = await setup("key arr", "galv_CELL");
        //     expect(within(row).getByRole('combobox')).toHaveValue("")
        // })
        // it('allows changing the type of an object to a resource', async () => {
        //     const row = await setup("key obj", "galv_CELL");
        //     expect(within(row).getByRole('combobox')).toHaveValue("")
        // })
    })
})

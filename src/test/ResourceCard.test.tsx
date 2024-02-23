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
            }
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
            if (/access_levels/.test(url))
                return make_axios_response(access_levels_response, {config})
            if (/cell_families$/.test(url))
                return make_paged_axios_response([api_data.cell_family], {config})
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
        }, 30000)

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
        }, 30000)

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
        }, 30000)

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
        }, 30000)

        it('prevents editing non-editable properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));
            const id_label = screen.getByRole("rowheader", {name: /url/});
            expect(within(id_label).queryByRole('textarea')).toBeNull();
            const value = within(id_label.parentElement! as HTMLElement)
                .queryByRole('cell', {name: api_data.cell.url});
            expect(within(value!).queryByRole('textbox')).toBeNull();
        }, 30000)

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
        }, 30000)

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
        }, 30000)

        it('prevents adding new properties', async () => {
            const user = userEvent.setup();
            await user.click(screen.getByRole('button', {name: /^Edit this /i}));

            for (const heading_name of [
                /^Read-only properties$/i, /^Editable properties$/i, /^Inherited from /i
            ]) {
                const heading = await screen.findByRole('heading', { name: heading_name });
                const table = heading.parentElement!.parentElement!.nextElementSibling!;
                const adjusted_table = heading_name.test("Editable properties")? table?.nextElementSibling! : table;
                const add_button = within(adjusted_table! as HTMLElement).queryByRole('rowheader', {name: /\+ KEY/i});
                expect(add_button).toBeNull();
            }
        }, 30000)
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
        }, 30000)
    })

    describe('ResourceCard advanced editing', () => {
        it('allows strings to be changed', async () => {})
        it('allows booleans to be changed', async () => {})
        it('allows numbers to be changed', async () => {})
        it('allows array elements to be changed', async () => {})
        it('allows adding new array elements', async () => {})
        it('allows removing array elements', async () => {})
        it('allows array elements to be reordered', async () => {})
        it('allows object keys to be changed', async () => {})
        it('allows object values to be changed', async () => {})
        it('allows adding new object keys', async () => {})
        it('allows removing object keys', async () => {})
        it('allows resources to be changed', async () => {})
    })

    describe('ResourceCard type changing', () => {
        it('forbids changing the type of properties', async () => {})
        it('allows changing the type of custom properties', async () => {})
        // Mapping specific type changes
        it('allows changing the type of a string to a boolean', async () => {})
        it('allows changing the type of a string to a number', async () => {})
        it('allows changing the type of a string to an array', async () => {})
        it('allows changing the type of a string to an object', async () => {})
        it('allows changing the type of a string to a resource', async () => {})
        it('allows changing the type of a boolean to a string', async () => {})
        it('allows changing the type of a boolean to a number', async () => {})
        it('allows changing the type of a boolean to an array', async () => {})
        it('allows changing the type of a boolean to an object', async () => {})
        it('allows changing the type of a boolean to a resource', async () => {})
        it('allows changing the type of a number to a string', async () => {})
        it('allows changing the type of a number to a boolean', async () => {})
        it('allows changing the type of a number to an array', async () => {})
        it('allows changing the type of a number to an object', async () => {})
        it('allows changing the type of a number to a resource', async () => {})
        it('allows changing the type of an array to a string', async () => {})
        it('allows changing the type of an array to a boolean', async () => {})
        it('allows changing the type of an array to a number', async () => {})
        it('allows changing the type of an array to an object', async () => {})
        it('allows changing the type of an array to a resource', async () => {})
        it('allows changing the type of an object to a string', async () => {})
        it('allows changing the type of an object to a boolean', async () => {})
        it('allows changing the type of an object to a number', async () => {})
        it('allows changing the type of an object to an array', async () => {})
        it('allows changing the type of an object to a resource', async () => {})
        it('allows changing the type of a resource to a string', async () => {})
        it('allows changing the type of a resource to a boolean', async () => {})
        it('allows changing the type of a resource to a number', async () => {})
        it('allows changing the type of a resource to an array', async () => {})
        it('allows changing the type of a resource to an object', async () => {})
    })
})

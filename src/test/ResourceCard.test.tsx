// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import {LOOKUP_KEYS} from "../constants";
import React from 'react';
import {render, screen, within} from '@testing-library/react';
import axios, {AxiosResponse, AxiosRequestConfig} from 'axios';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {FilterContextProvider} from "../Components/filtering/FilterContext";
import {MemoryRouter} from "react-router-dom";
import FetchResourceContextProvider from "../Components/FetchResourceContext";
import {Cell} from "@battery-intelligence-lab/galv";
import SelectionManagementContextProvider from "../Components/SelectionManagementContext";
import access_levels_response from './fixtures/access_levels.json';

jest.mock('../Components/Representation')
jest.mock('../Components/ResourceChip')
jest.mock('../ClientCodeDemo')

// Mock jest and set the type
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ResourceCard = jest.requireActual('../Components/ResourceCard').default;

const data: Cell = {
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
                value: {
                    _type: "array",
                    _value: [
                        {_type: "string", _value: "yes"},
                        {_type: "string", _value: "nested"}
                    ]
                }
            }
        }
    }
}

const make_axios_implementation = (data: object, status: number = 200, statusText?: string) => {
    return (config: AxiosRequestConfig) => {
        // console.log("AxiosResponse", {config, data})
        return Promise.resolve({
            data,
            status,
            statusText: statusText ?? status < 300 ? "OK" : "NOT OK",
            config
        } as AxiosResponse)
    }
}

const family_data = {
    uuid: "1000-1000-1000-1000",
    identifier: 'Test Cell Family 1',
    team: "http://example.com/teams/1",
    nominal_voltage: 3.7
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

describe('ResourceCard basic rendering', () => {
    it('renders', async () => {
        mockedAxios.request
            // Fetch the cell
            .mockImplementationOnce(make_axios_implementation(data))
            // Fetch access levels
            .mockImplementationOnce(make_axios_implementation(access_levels_response))
            // Fetch the cell
            .mockImplementationOnce(make_axios_implementation(data))
            // Fetch the family
            .mockImplementationOnce(make_axios_implementation(family_data))
            // Fetch access levels
            .mockImplementationOnce(make_axios_implementation(access_levels_response))
            // Fetch access levels
            .mockImplementationOnce(make_axios_implementation(access_levels_response))
            // Fetch access levels
            .mockImplementationOnce(make_axios_implementation(access_levels_response))
            // Fetch the family
            .mockImplementationOnce(make_axios_implementation(family_data))
            // Fetch access levels
            .mockImplementationOnce(make_axios_implementation(access_levels_response))

        render(
            <ContextStack>
                <ResourceCard<Cell>
                    lookup_key={LOOKUP_KEYS.CELL}
                    resource_id="0001-0001-0001-0001"
                    expanded
                />
            </ContextStack>
        )

        const read_only_heading = await screen.findByRole('heading', { name: /^Read-only properties$/ });

        screen.debug(undefined, 1000000)
        console.log(mockedAxios.request.mock.calls)

        const read_only_table = read_only_heading.parentElement!.parentElement!.nextElementSibling;
        expect(read_only_table).not.toBe(null);
        const uuid_heading = await within(read_only_table as HTMLElement).getByText(/uuid/);
        await within(uuid_heading.parentElement!.parentElement!.nextElementSibling as HTMLElement).getByText(data.uuid);

        const editable_heading = await screen.findByRole('heading', { name: /^Editable properties$/ });
        // Editable properties has a permissions table as its first sibling
        const editable_table = editable_heading.parentElement!.parentElement!.nextElementSibling!.nextElementSibling;
        expect(editable_table).not.toBe(null);
        const identifier_heading = await within(editable_table as HTMLElement).getByText(/identifier/);
        await within(identifier_heading.parentElement!.parentElement!.nextElementSibling as HTMLElement).getByText(data.identifier);

        const custom_heading = await screen.findByRole('heading', { name: /^Custom properties$/ });
        const custom_table = custom_heading.parentElement!.parentElement!.nextElementSibling;
        expect(custom_table).not.toBe(null);
        console.log("editable_table", editable_table?.innerHTML)
        const nested_heading = await within(custom_table as HTMLElement)
            .getByText(/key with space/);
        await within(nested_heading.parentElement!.parentElement!.nextElementSibling as HTMLElement)
            .getByText(data.custom_properties!["key with space"]._value);

        const inherited_heading = await screen.findByRole('heading', { name: /^Inherited from / });
        const inherited_table = inherited_heading.parentElement!.parentElement!.nextElementSibling;
        expect(inherited_table).not.toBe(null);
        const nominal_voltage_heading = await within(inherited_table as HTMLElement).getByText(/nominal_voltage/);
        await within(nominal_voltage_heading.parentElement!.parentElement!.nextElementSibling as HTMLElement).getByText(family_data.nominal_voltage);
    })
})

describe('ResourceCard interactivity', () => {
    it('expands and collapses', async () => {

    })
    it('allows editing', async () => {

    })
    it('prevents editing non-editable properties', async () => {})
    it('allows editing editable properties', async () => {})
    it('allows editing custom properties', async () => {})
    it('allows editing nested custom properties', async () => {})
    it('prevents adding new properties', async () => {})
    it('allows adding new custom_properties', async () => {})
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
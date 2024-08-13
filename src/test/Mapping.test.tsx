// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import axios from 'axios'
import ApiResourceContextProvider from '../Components/ApiResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Mapping } from '../Components/Mapping'
import { expect, it, vi } from 'vitest'
import {
    column_mappings,
    file_summary,
    files,
    teams,
} from './fixtures/fixtures'

// Mock jest and set the type
const req = vi.spyOn(axios, 'request')

// Utility function for avoiding type errors when querySelecting from childNodes
const childQSA = (el: ChildNode, selector: string) =>
    Array.from((el as HTMLElement).querySelectorAll(selector))

// Utility function to work with MUI Select
const muiSelect = async (
    selectParentElement: HTMLElement,
    option: () => Promise<Element>,
) => {
    const user = userEvent.setup()
    await user.click(selectParentElement.firstElementChild!)
    await user.click(await option())
}

// Utility function to get an element by display value if it has the specified role
const getByDisplayValue = (role: string, value: string | RegExp) => {
    const candidate = screen.getByDisplayValue(value)
    const allRoleHolders = screen.getAllByRole(role)
    if (allRoleHolders.includes(candidate)) return candidate
}

const file = files[0]
// In the fixtures, all the column mappings are applicable to the file
const default_mapping = column_mappings.find((m) => m.url === file.mapping)

/**
 * Wait for a certain amount of time
 *
 * Used to ensure that React has actually updated the DOM before we check it
 * @param ms
 */
function wait(ms: number = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

it('renders', async () => {
    // Mock window.confirm and make it return false so we can check warnings
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockImplementation(vi.fn(() => false))

    if (!default_mapping)
        throw new Error('Unable to detect default mapping from file fixture.')

    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <ApiResourceContextProvider
                        resourceId={file.id}
                        lookupKey={LOOKUP_KEYS.FILE}
                    >
                        <Mapping />
                    </ApiResourceContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
    await screen.findByText((t) => t.includes(file.name!))
    const user = userEvent.setup()

    const button = screen.getByRole('button', { name: /^Apply mapping$/i })
    expect(button).toBeDisabled()

    // Check that the data are displayed
    const table = await screen.findByRole('table')
    expect(table).toBeInTheDocument()

    // Check table has all the parts: initial, recognise, rescale, rename, result
    const headings = screen.getAllByRole('heading')
    for (const heading of [
        'Initial data',
        'Recognise',
        'Rebase and Rescale',
        'Rename',
        'Result',
    ]) {
        expect(headings.map((h) => h.textContent)).toContain(heading)
    }

    // Check we can't edit stuff we shouldn't be able to edit
    const initial_data = screen
        .getByRole('heading', { name: /Rename/ })
        .closest('tr')!
        .nextElementSibling!.querySelectorAll('td')
    expect(initial_data[1]).toBeInTheDocument()
    await user.hover(initial_data[1])
    screen.getAllByLabelText(/You do not have permission/)
    expect(initial_data[1].firstElementChild?.nodeName).toBe('P')

    // Check we can load a mapping
    const load_mapping = screen.getByTestId('load-mapping-select')
    expect(load_mapping).toBeInTheDocument()
    const other_map = column_mappings.find((m) => m.url !== file.mapping)
    await muiSelect(load_mapping, () => screen.findByText(other_map!.name))
    expect(button).toBeEnabled()

    // Check we can create a new mapping
    await muiSelect(load_mapping, () => screen.findByText('Create new mapping'))
    expect(button).toBeDisabled()

    // Check we can recognise columns
    const select_cols = screen.getAllByTestId('column-type-select')
    expect(select_cols).toHaveLength(Object.keys(file_summary).length)

    await muiSelect(select_cols[1], () => screen.findByText('Current_A'))
    await muiSelect(select_cols[2], () => screen.findByText('SampleNumber'))
    await muiSelect(select_cols[4], () => screen.findByText('UnknownStr'))

    // Check we can rescale numeric columns
    const first_value_row = childQSA(
        screen.getByRole('heading', { name: /Result/ }).closest('tr')!
            .nextElementSibling!.nextElementSibling!,
        'td',
    )
    const initial_values = childQSA(
        screen.getByRole('heading', { name: /Initial data/ }).closest('tr')!
            .nextElementSibling!.nextElementSibling!,
        'td',
    )
    const rebase_inputs = screen.getAllByRole('spinbutton', {
        name: /Addition$/i,
    })
    const rescale_inputs = screen.getAllByRole('spinbutton', {
        name: /Multiplier$/i,
    })
    expect(rebase_inputs).toHaveLength(2)
    expect(rescale_inputs).toHaveLength(2)

    await user.clear(rebase_inputs[0])
    await user.type(rebase_inputs[0], '10')
    expect(first_value_row[1]).toHaveTextContent(
        String(10 + parseFloat(initial_values[1].textContent!)),
    )

    await user.clear(rescale_inputs[0])
    await user.type(rescale_inputs[0], '2')
    expect(first_value_row[1]).toHaveTextContent(
        String((10 + parseFloat(initial_values[1].textContent!)) * 2),
    )

    // Check we can't rename required columns
    const renames = childQSA(
        screen.getByRole('heading', { name: /Rename/ }).closest('tr')!
            .nextElementSibling!,
        'td',
    )
    expect(renames[1].firstElementChild!.nodeName).toBe('P')

    // Check we can rename columns
    const rename = getByDisplayValue('textbox', /SampleNumber/)!
    await user.type(rename, 'X')
    expect(rename).toHaveValue('SampleNumberX')
    expect(screen.getAllByRole('cell', { name: /SampleNumberX/ })).toHaveLength(
        2,
    )

    // Check we can provide mapping name and team
    const mapping_name = screen.getByLabelText(/Mapping name/)
    expect(mapping_name).toHaveValue('')
    const warning = screen.getByText(/Mappings must have a name/i)
    await user.type(mapping_name, 'M')
    expect(warning).not.toBeInTheDocument()

    // Check we can provide a team
    const team_warning = screen.getByText(/Mappings must belong to a team/i)
    const team = screen.getByLabelText(/Select Team/i)
    await user.click(team)
    await user.clear(team)
    await user.keyboard(teams[0].name[0]) // should autocomplete
    const autocomplete = await screen.findByRole('listbox')
    const option = within(autocomplete).getByText(teams[0].name)
    await user.click(option)
    expect(team).toBeInTheDocument()
    expect(team_warning).not.toBeInTheDocument()

    // Check advanced properties are hidden
    const advanced_button = screen.getByRole('button', {
        name: /Advanced Properties/i,
    })
    await user.click(advanced_button)
    // const delete_button = screen.queryByRole('button', {name: /Delete/i})
    const read_access_level_wrapper = screen
        .getByText(/read_access_level/i)
        .closest('tr')!
    const read_access_level = within(read_access_level_wrapper).queryByRole(
        'combobox',
    )
    // expect(delete_button).toBeVisible()
    // expect(delete_button).toBeDisabled()
    expect(read_access_level).toBeVisible()
    await user.click(advanced_button)
    await wait(1000)
    // expect(delete_button).not.toBeVisible()
    expect(read_access_level).not.toBeVisible()

    // Check we can save a new mapping with a warning if incomplete
    const col_warning = screen.getByText(
        /Mapping should include required columns/,
    )
    expect(col_warning).toBeInTheDocument()
    expect(button).toHaveTextContent(/Create/i)
    await user.click(button)
    await wait(1000)
    expect(confirmSpy).toHaveBeenCalled()

    // Check we can save a new mapping without a warning if complete
    await muiSelect(select_cols[7], () => screen.findByText('Voltage_V'))
    await muiSelect(select_cols[13], () => screen.findByText('ElapsedTime_s'))
    expect(col_warning).not.toBeInTheDocument()
    await user.click(button)

    // We should now have sent an API call
    const check_api_call = (call: { data: string }) => {
        const map = JSON.parse(call.data).map
        expect(map).toMatchObject({
            Amps: {
                addition: 10, // updated in rebase
                multiplier: 2, // updated in rescale
                column_type: 5,
            },
            'Rec#': {
                column_type: 2,
                name: 'SampleNumberX',
            },
            Volts: {
                column_type: 4,
            },
            TestTime: {
                column_type: 3,
            },
            State: {
                column_type: 14,
            },
        })
    }
    // Find the last POST API call
    check_api_call(
        req.mock.calls
            .reverse()
            .find((call) => call[0].method === 'POST')![0] as { data: string },
    )
}, 3600000)

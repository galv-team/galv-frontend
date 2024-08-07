// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// @ts-expect-error - globalThis is not defined in Jest
globalThis.IS_REACT_ACT_ENVIRONMENT = true

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import {
    render,
    screen,
    within,
    waitFor,
    cleanup,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterContextProvider } from '../Components/filtering/FilterContext'
import { MemoryRouter } from 'react-router-dom'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { Cell } from '@galv/galv'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import { act } from 'react-dom/test-utils'
import userEvent from '@testing-library/user-event'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import axios from 'axios'
import WrappedResourceCard from '../Components/ResourceCard'

import { cell_families, cells } from './fixtures/fixtures'

vi.mock('../Components/Representation')
vi.mock('../Components/ResourceChip')
vi.mock('../DatasetChart')

const req = vi.spyOn(axios, 'request')

const cell_resource = cells[0]
const cell_family = cell_families.find((cf) => cf.url === cell_resource.family)

if (!cell_family)
    throw new Error(`Could not find cell family for cell ${cell_resource.id}`)

const ContextStack = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient()
    return (
        <MemoryRouter initialEntries={['/']}>
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
    vi.clearAllMocks()
    cleanup()

    render(
        <ContextStack>
            <WrappedResourceCard<Cell>
                lookup_key={LOOKUP_KEYS.CELL}
                resource_id={cells[0].id}
                expanded
            />
        </ContextStack>,
    )

    await screen.findByRole('heading', { name: /^Read-only properties$/ })
}

/**
 * Wait for a certain amount of time
 *
 * Used to ensure that React has actually updated the DOM before we check it
 * @param ms
 */
function wait(ms: number = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('ResourceCard', () => {
    beforeEach(async () => await do_render())

    describe('ResourceCard basic rendering', () => {
        it('renders', async () => {
            const read_only_heading = await screen.findByRole('heading', {
                name: /^Read-only properties$/,
            })
            const read_only_table =
                read_only_heading.parentElement!.parentElement!
                    .nextElementSibling
            expect(read_only_table).not.toBe(null)
            const id_heading = await within(
                read_only_table as HTMLElement,
            ).findByText(/id/)
            within(
                id_heading.parentElement!.parentElement!
                    .nextElementSibling as HTMLElement,
            ).getByText(cell_resource.id)

            const editable_heading = await screen.findByRole('heading', {
                name: /^Editable properties$/,
            })
            // Editable properties has a permissions table as its first sibling
            const editable_table =
                editable_heading.parentElement!.parentElement!
                    .nextElementSibling!.nextElementSibling
            expect(editable_table).not.toBe(null)
            const identifier_heading = within(
                editable_table as HTMLElement,
            ).getByRole('rowheader', { name: /identifier/ })
            within(identifier_heading.parentElement! as HTMLElement).getByRole(
                'cell',
                { name: cell_resource.identifier },
            )

            const custom_heading = await screen.findByRole('heading', {
                name: /^Custom properties$/,
            })
            const custom_table =
                custom_heading.parentElement!.parentElement!.nextElementSibling
            expect(custom_table).not.toBe(null)
            const nested_heading = within(
                custom_table as HTMLElement,
            ).getByRole('rowheader', { name: /key with space/ })
            within(nested_heading.parentElement! as HTMLElement).getByRole(
                'cell',
                {
                    name: cell_resource.custom_properties!['key with space']
                        ._value,
                },
            )

            const inherited_heading = await screen.findByRole('heading', {
                name: /^Inherited from /,
            })
            const inherited_table =
                inherited_heading.parentElement!.parentElement!
                    .nextElementSibling
            expect(inherited_table).not.toBe(null)
            const nominal_voltage_v_heading = within(
                inherited_table as HTMLElement,
            ).getByRole('rowheader', { name: /nominal_voltage_v/ })
            within(
                nominal_voltage_v_heading.parentElement! as HTMLElement,
            ).getByRole('cell', {
                name: cell_family.nominal_voltage_v!.toString(),
            })
        })

        it('expands and collapses', () => {
            act(() =>
                screen.getByRole('button', { name: /Hide details/i }).click(),
            )
            expect(
                screen.queryByRole('heading', {
                    name: /^Read-only properties$/,
                }),
            ).toBe(null)

            act(() =>
                screen.getByRole('button', { name: /Show details/i }).click(),
            )
            expect(
                screen.queryByRole('heading', {
                    name: /^Read-only properties$/,
                }),
            ).not.toBe(null)
        })
    })

    describe('ResourceCard interactivity', () => {
        it('allows editing editable properties', async () => {
            const user = userEvent.setup()
            const new_value = 'Nv'

            // Change the identifier
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /identifier/,
            })
            const input = within(
                id_label.parentElement! as HTMLElement,
            ).getByRole('textbox')
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', { name: /Save/i }))
            await screen.findByRole('button', { name: /Edit this /i })
            const last_call = req.mock.lastCall
                ? req.mock.lastCall[0]
                : undefined
            expect(last_call).toHaveProperty('method', 'PATCH')
            expect(
                JSON.parse(last_call?.data).identifier === new_value,
            ).toBeTruthy()
        })

        it('supports undo and redo', async () => {
            const user = userEvent.setup()

            // Change the identifier
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /identifier/,
            })
            const input = within(
                id_label.parentElement! as HTMLElement,
            ).getByRole('textbox')
            const old_value = input.getAttribute('value')

            // Check undo and redo buttons are disabled
            const undo_button = within(screen.getByTitle(/Undo/i)).getByRole(
                'button',
            )
            const redo_button = within(screen.getByTitle(/Redo/i)).getByRole(
                'button',
            )
            expect(undo_button).toBeDisabled()
            expect(redo_button).toBeDisabled()

            await user.click(input)
            await user.clear(input)
            await user.keyboard('{Enter}')
            expect(input).toHaveValue('')

            // Click the undo button
            expect(undo_button).toBeEnabled()
            await user.click(undo_button)
            await waitFor(() => expect(input).toHaveValue(old_value), {
                timeout: 500,
            })

            expect(undo_button).toBeDisabled()
            expect(redo_button).toBeEnabled()

            await user.click(redo_button)
            await waitFor(() => expect(input).toHaveValue(''), { timeout: 500 })
            expect(undo_button).toBeEnabled()
            expect(redo_button).toBeDisabled()
        })

        it('supports resetting', async () => {
            const confirmSpy = vi.spyOn(window, 'confirm')
            confirmSpy.mockImplementation(vi.fn(() => true))
            const user = userEvent.setup()

            // Change the identifier
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /identifier/,
            })
            const input = within(
                id_label.parentElement! as HTMLElement,
            ).getByRole('textbox')
            const old_value = input.getAttribute('value')

            await user.click(input)
            await user.clear(input)
            await user.keyboard('{Enter}')
            expect(input).toHaveValue('')

            // Click the reset button
            const reset_button = screen.getByRole('button', {
                name: /Discard/i,
            })
            await user.click(reset_button)
            await waitFor(
                () => {
                    // We should no longer be in edit mode - the button should be back and the input should have the old value
                    expect(
                        screen.queryByRole('button', { name: /Save/i }),
                    ).toBe(null)
                    expect(
                        screen.queryByRole('button', { name: /Edit this /i }),
                    ).not.toBe(null)
                    within(id_label.parentElement! as HTMLElement).getByRole(
                        'cell',
                        { name: old_value! },
                    )
                },
                { timeout: 500 },
            )
        })

        it('prevents editing non-editable properties', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', { name: /url/ })
            expect(within(id_label).queryByRole('textarea')).toBeNull()
            const value = within(
                id_label.parentElement! as HTMLElement,
            ).queryByRole('cell', { name: cell_resource.url })
            expect(within(value!).queryByRole('textbox')).toBeNull()
        })

        it('allows editing custom properties', async () => {
            const user = userEvent.setup()
            const new_value = 'New Value'

            // Change the identifier
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /key with space/,
            })
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox')
                .filter(
                    (e) =>
                        e instanceof HTMLInputElement &&
                        e.value ===
                            cell_resource.custom_properties!['key with space']
                                ._value,
                )
                .pop()!
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', { name: /Save/i }))
            await screen.findByRole('button', { name: /Edit this /i })
            const last_call = req.mock.lastCall
                ? req.mock.lastCall[0]
                : undefined
            expect(last_call).toHaveProperty('method', 'PATCH')
            expect(
                JSON.parse(last_call?.data).custom_properties['key with space']
                    ._value === new_value,
            ).toBeTruthy()
        })

        it('allows editing nested custom properties', async () => {
            const user = userEvent.setup()
            const new_value = 'New Value'

            // Change the identifier
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const wrapper = screen.getByRole('rowheader', { name: /nested/ })
            const id_label = within(
                wrapper.parentElement! as HTMLElement,
            ).getByRole('rowheader', { name: /str_key/ })
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox')
                .filter(
                    (e) =>
                        e instanceof HTMLInputElement &&
                        e.value ===
                            cell_resource.custom_properties!.nested._value
                                .str_key._value,
                )
                .pop()!
            await user.click(input)
            await user.clear(input)
            await user.keyboard(new_value)

            // Save the changes
            await user.click(screen.getByRole('button', { name: /Save/i }))
            await screen.findByRole('button', { name: /Edit this /i })
            const last_call = req.mock.lastCall
                ? req.mock.lastCall[0]
                : undefined
            expect(last_call).toHaveProperty('method', 'PATCH')
            expect(
                JSON.parse(last_call?.data).custom_properties.nested._value
                    .str_key._value === new_value,
            ).toBeTruthy()
        })

        it('prevents adding new properties', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )

            for (const heading_name of [
                /^Read-only properties$/i,
                /^Editable properties$/i,
                /^Inherited from /i,
            ]) {
                const heading = await screen.findByRole('heading', {
                    name: heading_name,
                })
                const table =
                    heading.parentElement!.parentElement!.nextElementSibling!
                const adjusted_table = heading_name.test('Editable properties')
                    ? table.nextElementSibling!
                    : table
                const add_button = within(
                    adjusted_table! as HTMLElement,
                ).queryByRole('rowheader', { name: /\+ KEY/i })
                expect(add_button).toBeNull()
            }
        })

        it('allows adding new custom_properties', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )

            const heading = await screen.findByRole('heading', {
                name: /^Custom properties$/,
            })
            const table =
                heading.parentElement!.parentElement!.nextElementSibling!
            const add_button = within(table! as HTMLElement)
                .getAllByRole('rowheader', { name: /\+ KEY/i })
                .pop()

            // Try to add a new key
            const input = within(add_button!).getByRole('textbox')
            await user.click(input)
            await user.keyboard('x')
            await user.keyboard('{Enter}')

            // Save the changes
            await user.click(screen.getByRole('button', { name: /Save/i }))
            const last_call = req.mock.lastCall
                ? req.mock.lastCall[0]
                : undefined
            expect(last_call).toHaveProperty('method', 'PATCH')
            expect(
                JSON.parse(last_call?.data).custom_properties.x,
            ).toStrictEqual({ _type: 'string', _value: '' })
        })
    })

    describe('ResourceCard advanced editing', () => {
        it('allows booleans to be changed', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /^key bool$/,
            })
            const input = within(
                id_label.parentElement! as HTMLElement,
            ).getByRole('checkbox')
            expect(input).toBeChecked()
            await user.click(input)
            await wait()
            expect(input).not.toBeChecked()
        })
        it('allows strings to be changed', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /^key str$/,
            })
            const input = within(id_label.parentElement! as HTMLElement)
                .getAllByRole('textbox')
                .pop()!
            expect(input).toHaveValue('custom')
            await user.click(input)
            await user.clear(input)
            await user.keyboard('X')
            await user.keyboard('{Enter}')
            await wait()
            expect(input).toHaveValue('X')
        })
        it('allows numbers to be changed', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /^key num$/,
            })
            const input = within(
                id_label.parentElement! as HTMLInputElement,
            ).getByRole('spinbutton')
            expect(input).toHaveValue(3.14159)
            await user.click(input)
            await user.clear(input)
            await user.keyboard('9')
            await user.click(id_label)
            await wait()
            expect(input).toHaveValue(9)
        })
        async function get_array() {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            return {
                user,
                row: screen.getByRole('rowheader', { name: /^key arr$/ })
                    .parentElement! as HTMLElement,
            }
        }
        it('allows array elements to be changed', async () => {
            const { user, row } = await get_array()
            const input = within(row).getAllByRole('textbox').splice(1, 1)![0]
            expect(input).toHaveValue('element 1')
            await user.click(input)
            await user.clear(input)
            await user.keyboard('X')
            await user.keyboard('{Enter}')
            await wait()
            expect(input).toHaveValue('X')
        })
        it('allows adding new array elements', async () => {
            const { user, row } = await get_array()
            const old_element_count = within(row).getAllByRole('textbox').length
            const last_input = within(row).getAllByRole('textbox').pop()!
            expect(last_input).toHaveValue('')
            await user.click(last_input)
            await user.keyboard('Y')
            await user.keyboard('{Enter}')
            await wait()
            const new_element_count = within(row).getAllByRole('textbox').length
            expect(new_element_count).toBe(old_element_count + 1)
        })
        it('allows removing array elements', async () => {
            const { user, row } = await get_array()
            const old_element_count = within(row).getAllByRole('textbox').length
            screen.debug(row.querySelector('.smooth-dnd-draggable-wrapper')!)
            const first_remove_button = within(row)
                .getAllByRole('button', { name: /^Remove /i })
                .shift()!
            await user.click(first_remove_button)
            await wait()
            const new_element_count = within(row).getAllByRole('textbox').length
            expect(new_element_count).toBe(old_element_count - 1)
        })
        async function get_object() {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            return {
                user,
                row: screen.getByRole('rowheader', { name: /^key obj$/ })
                    .parentElement! as HTMLElement,
            }
        }
        it('allows object keys to be changed', async () => {
            const { user, row } = await get_object()
            const input = within(row)
                .getAllByRole('textbox', { name: 'key' })
                .splice(1, 1)![0]
            expect(input).toHaveValue('key1')
            await user.click(input)
            await user.clear(input)
            await user.keyboard('X')
            await user.keyboard('{Enter}')
            await wait()
            expect(input).toHaveValue('X')
        })
        it('allows object values to be changed', async () => {
            const { user, row } = await get_object()
            const input = within(row)
                .getAllByRole('textbox', { name: 'value' })
                .shift()!
            expect(input).toHaveValue('value1')
            await user.click(input)
            await user.clear(input)
            await user.keyboard('X')
            await user.keyboard('{Enter}')
            await wait()
            expect(input).toHaveValue('X')
        })
        it('allows adding new object keys', async () => {
            const { user, row } = await get_object()
            const old_element_count = within(row).getAllByRole('textbox').length
            const input = within(row).getByRole('textbox', { name: /\+ KEY/i })
            expect(input).toHaveValue('')
            await user.click(input)
            await user.keyboard('X')
            await user.keyboard('{Enter}')
            await wait()
            const new_element_count = within(row).getAllByRole('textbox').length
            expect(new_element_count).toBe(old_element_count + 2) // 1 key, 1 value
        })
        it('allows removing object keys', async () => {
            const { user, row } = await get_object()
            const old_element_count = within(row).getAllByRole('textbox').length
            const input = within(row)
                .getAllByRole('textbox', { name: 'key' })
                .splice(1, 1)![0]
            expect(input).toHaveValue('key1')
            await user.click(input)
            await user.clear(input)
            await user.keyboard('{Enter}')
            await wait()
            const new_element_count = within(row).getAllByRole('textbox').length
            expect(new_element_count).toBe(old_element_count - 2) // 1 key, 1 value
        })
        it('allows resources to be changed', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', { name: /^key cf$/ })
            const input = within(
                id_label.parentElement! as HTMLElement,
            ).getByRole('combobox')
            expect(input).toHaveValue(
                `representation: CELL_FAMILY [${cell_family.id}]`,
            )
            await user.click(input)
            await user.clear(input)
            await user.keyboard('2') // should match the second cell family
            const autocomplete = await screen.findByRole('listbox')
            const option = within(autocomplete).getByText(
                `representation: CELL_FAMILY [${cell_families[1].id}]`,
            )
            await user.click(option)
            await wait()
            expect(input).toHaveValue(
                `representation: CELL_FAMILY [${cell_families[1].id}]`,
            )
        })
    })

    describe('ResourceCard type changing', () => {
        async function setup(rowheader_name: string, new_type: string) {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const row = screen.getByRole('rowheader', {
                name: rowheader_name,
            }).parentElement!
            const changer = within(row as HTMLElement)
                .getAllByRole('button')
                .shift()!
            await user.click(changer)
            await wait(300)

            if (new_type.startsWith('galv_')) {
                const dots = document.querySelector(`[title="Resource types"]`)
                expect(dots).not.toBeNull()
                await user.click(dots!)
                await wait(300)
            }

            const button = document.querySelector(`button[value="${new_type}"]`)
            expect(button).not.toBeNull()
            await user.click(button!)
            await wait()
            return row
        }

        it('forbids changing the type of properties', async () => {
            const user = userEvent.setup()
            await user.click(
                screen.getByRole('button', { name: /^Edit this /i }),
            )
            const id_label = screen.getByRole('rowheader', {
                name: /^identifier$/,
            })
            const changer = within(
                id_label.parentElement! as HTMLElement,
            ).queryByRole('button')
            expect(changer).toBeDisabled()
        })
        // Mapping specific type changes
        it('allows changing the type of a string to a boolean', async () => {
            const row = await setup('key str', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a string to a number', async () => {
            const row = await setup('key str', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of a string to a datetime', async () => {
            const row = await setup('key str', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // Expect to have defaulted to the time when the conversion applied
            const date = new Date(value)
            const now = new Date()
            const diff = +now - +date // + coerces to number
            expect(diff).toBeLessThan(10000)
            expect(diff).toBeGreaterThan(0)
        })
        it('allows changing the type of a string to an array', async () => {
            const row = await setup('key str', 'array')
            // Expect the length to be 3: key, value, and add new element
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of a string to an object', async () => {
            const row = await setup('key str', 'object')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(4)
        })
        it('allows changing the type of a boolean to a string', async () => {
            const row = await setup('key bool', 'string')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                'true',
            )
        })
        it('allows changing the type of a boolean to a number', async () => {
            const row = await setup('key bool', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(1)
        })
        it('allows changing the type of a boolean to a datetime', async () => {
            const row = await setup('key bool', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // Expect to have defaulted to the time when the conversion applied
            const date = new Date(value)
            const now = new Date()
            const diff = +now - +date // + coerces to number
            expect(diff).toBeLessThan(10000)
            expect(diff).toBeGreaterThan(0)
        })
        it('allows changing the type of a boolean to an array', async () => {
            const row = await setup('key bool', 'array')
            // Value and add new element are present as checkboxes
            expect(within(row).getAllByRole('checkbox').length).toBe(2)
        })
        it('allows changing the type of a boolean to an object', async () => {
            const row = await setup('key bool', 'object')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of a number to a string', async () => {
            const row = await setup('key num', 'string')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                cell_resource.custom_properties?.num._value.toString(),
            )
        })
        it('allows changing the type of a number to a boolean', async () => {
            const row = await setup('key num', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a number to a datetime', async () => {
            const row = await setup('key num', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // Pi gets converted to the Unix epoch
            const date = new Date(value)
            const epoch = new Date(3.14159)
            expect(date.toISOString()).toEqual(epoch.toISOString())
        })
        it('allows changing the type of a number to an array', async () => {
            const row = await setup('key num', 'array')
            // value, and add new element
            expect(within(row).getAllByRole('spinbutton').length).toBe(2)
        })
        it('allows changing the type of a number to an object', async () => {
            const row = await setup('key num', 'object')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of an array to a string', async () => {
            const row = await setup('key arr', 'string')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                `["element 1","element 2"]`,
            )
        })
        it('allows changing the type of an array to a boolean', async () => {
            const row = await setup('key arr', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of an array to a number', async () => {
            const row = await setup('key arr', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of an array to a datetime', async () => {
            const row = await setup('key arr', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // "element 1" gets date-parsed as 2001-01-01T00:00:00.000Z
            const date = new Date(value)
            const jan_1_2001 = '2001-01-01T00:00:00.000Z'
            expect(date.toISOString()).toEqual(jan_1_2001)
        })
        it('allows changing the type of an array to an object', async () => {
            const row = await setup('key arr', 'object')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(6)
        })
        it('allows changing the type of an object to a string', async () => {
            const row = await setup('key obj', 'string')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                `{"key1":"value1","key2":"value2"}`,
            )
        })
        it('allows changing the type of an object to a boolean', async () => {
            const row = await setup('key obj', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of an object to a number', async () => {
            const row = await setup('key obj', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of an object to a datetime', async () => {
            const row = await setup('key obj', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // Expect to have defaulted to the time when the conversion applied
            const date = new Date(value)
            const now = new Date()
            const diff = +now - +date // + coerces to number
            expect(diff).toBeLessThan(10000)
            expect(diff).toBeGreaterThan(0)
        })
        it('allows changing the type of an object to an array', async () => {
            const row = await setup('key obj', 'array')
            // Expect the length to be 4: key, value, value, and add new element
            expect(within(row).getAllByRole('textbox').length).toBe(4)
        })
        it('allows changing the type of a datetime to a string', async () => {
            const row = await setup('key date', 'string')
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                cell_resource.custom_properties?.date._value,
            )
        })
        it('allows changing the type of a datetime to a boolean', async () => {
            const row = await setup('key date', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a datetime to a number', async () => {
            const row = await setup('key date', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of a datetime to an array', async () => {
            const row = await setup('key date', 'array')
            // Expect the length to be 3: key, value, and add new element
            expect(within(row).getAllByRole('textbox').length).toBe(3)
        })
        it('allows changing the type of a datetime to an object', async () => {
            const row = await setup('key date', 'object')
            // Expect the length to be 4: key, key, value, and add new key
            expect(within(row).getAllByRole('textbox').length).toBe(4)
        })

        /**
         * TODO: Fix the console error spam about wrapping updates in `act()`
         */
        it('allows changing the type of a resource to a string', async () => {
            const row = await setup('key cf', 'string')
            expect(within(row).getAllByRole('textbox').pop()).toHaveValue(
                `http://example.com/cell_families/1000-1000-1000-1000`,
            )
        })
        it('allows changing the type of a resource to a boolean', async () => {
            const row = await setup('key cf', 'boolean')
            expect(within(row).getByRole('checkbox')).toBeChecked()
        })
        it('allows changing the type of a resource to a number', async () => {
            const row = await setup('key cf', 'number')
            expect(within(row).getByRole('spinbutton')).toHaveValue(null)
        })
        it('allows changing the type of a resource to a datetime', async () => {
            const row = await setup('key cf', 'datetime')
            const value = (
                within(row).getAllByRole('textbox')[1] as HTMLInputElement
            ).value
            // Expect to have defaulted to the time when the conversion applied
            const date = new Date(value)
            const now = new Date()
            const diff = +now - +date // + coerces to number
            expect(diff).toBeLessThan(10000)
            expect(diff).toBeGreaterThan(0)
        })
        it('allows changing the type of a resource to an array', async () => {
            const row = await setup('key cf', 'array')
            // Expect the length to be 2: value, and add new element
            expect(within(row).getAllByRole('combobox').length).toBe(2)
        })
        it('allows changing the type of a resource to an object', async () => {
            const row = await setup('key cf', 'object')
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

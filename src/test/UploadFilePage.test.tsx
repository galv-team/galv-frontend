// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

import React, { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterContextProvider } from '../Components/filtering/FilterContext'
import { MemoryRouter } from 'react-router-dom'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import UploadFilePage from '../Components/upload/UploadFilePage'

import { column_mappings, files, teams } from './fixtures/fixtures'
import userEvent from '@testing-library/user-event'

// @ts-expect-error - globalThis is not defined in Jest
globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../Components/Representation')
vi.mock('../Components/ResourceChip')
vi.mock('../DatasetChart')

const req = vi.spyOn(axios, 'request')

const partial_file = files.find((f) => f.name === 'partial.csv')

if (!partial_file) throw new Error('Could not find partial file')

/**
 * https://www.npmjs.com/package/react-dropzone#testing
 */
function mockData(files: File[]) {
    return {
        dataTransfer: {
            files,
            items: files.map((file) => ({
                kind: 'file',
                type: file.type,
                getAsFile: () => file,
            })),
            types: ['Files'],
        },
    }
}

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

const do_render = async (file_id?: string) => {
    vi.clearAllMocks()
    cleanup()

    render(
        <ContextStack>
            <UploadFilePage />
        </ContextStack>,
    )
}

describe('UploadFilePage', () => {
    describe('UploadFilePage one-step', () => {
        beforeEach(async () => await do_render())
        it('renders', async () => {})

        it('happy path', async () => {
            const user = userEvent.setup()
            // Has upload button
            const upload_button = screen.getByRole('button', {
                name: /Upload/i,
            })
            // Upload button disabled until a file is selected
            expect(upload_button).toBeDisabled()

            // Allows file upload
            const file_select = screen.getByRole('button', {
                name: /Select file/i,
            })
            const input = file_select.querySelector('input')
            if (!input) throw new Error('No input found')
            const file = new File([''], 'test.csv', { type: 'text/csv' })
            const file_data = mockData([file])
            await act(() => fireEvent.drop(file_select, file_data))
            // Shows success
            expect(await screen.findByText(/test\.csv/)).toBeInTheDocument()
            // Allows replacement
            const new_file = new File([''], 'test2.csv', { type: 'text/csv' })
            const new_file_data = mockData([new_file])
            await act(() => fireEvent.drop(file_select, new_file_data))
            expect(await screen.findByText(/test2\.csv/)).toBeInTheDocument()
            expect(screen.queryByText(/test\.csv/)).not.toBeInTheDocument()

            // Shows an error if metadata is missing
            expect(screen.queryAllByText(/error/i)).toHaveLength(0)
            await user.click(upload_button)
            expect(screen.queryAllByText(/error/i).length).toBeGreaterThan(0)

            // Allows metadata entry
            screen.debug(undefined, 1000000)
            for (const key of ['name', 'path']) {
                const input = screen.getByLabelText(key)
                await user.type(input, key)
                expect(input).toHaveValue(key)
            }
            // Error cleared when metadata is entered
            expect(screen.queryAllByText(/error/i)).toHaveLength(0)
            const mapping_input = screen.getByLabelText('mapping')
            await user.click(mapping_input)
            const mapping = screen.getByText(column_mappings[0].id)
            await user.click(mapping)
            const team_input = screen.getByLabelText('team')
            await user.click(team_input)
            const team = screen.getByText(teams[0].id)
            await user.click(team)
            // Allows upload to the server
            await user.click(upload_button)
            // Should send a POST request
            expect(req).toHaveBeenLastCalledWith({
                data: {
                    file: expect.any(File),
                    metadata: {
                        name: 'name',
                        path: 'path',
                        mapping: column_mappings[0].id,
                    },
                },
            })
        })

        it('gracefully handles upload errors', async () => {
            // Shows error
            // Allows retry
        })

        it('allows cancelling an upload', async () => {
            // Shows cancel button while uploading
            // Cancels upload
            // Allows retry
        })

        it('allows uploading to server', async () => {
            // Shows upload button
            // Shows success
        })

        it('handles server upload errors from bad data', async () => {
            // Shows errored fields
            // Allows retry
        })

        it('handles server upload errors from server problems', async () => {
            // Shows error
            // Allows retry
        })
    })

    describe('UploadFilePage two-step', () => {
        beforeEach(async () => await do_render(partial_file.id))

        it('prepopulates metadata', async () => {
            // Shows metadata
            // Allows editing
        })

        it('allows upload without mapping', async () => {
            // Shows upload button
            // Shows success
        })

        it('shows mapping options for a partial file', async () => {
            // Does not show file upload dialogue
            // Shows mapping options
            // Shows link to create new mapping
            // Allows selection
            // Allows upload
            // Shows success
        })

        it('shows file upload dialogue for resume', async () => {
            // Shows file upload dialogue
            // Shows warning if mapping not selected
            // Warns if path doesn't match metadata
        })
    })
})

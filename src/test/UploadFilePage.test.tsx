// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

import React, { act } from 'react'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
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
import FileSummary from '../Components/card/summaries/FileSummary'
import ApiResourceContextProvider from '../Components/ApiResourceContext'
import { LOOKUP_KEYS } from '../constants'

// @ts-expect-error - globalThis is not defined in Jest
globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../Components/Representation')
vi.mock('../Components/ResourceChip')
vi.mock('../DatasetChart')
vi.mock('../Components/AuthImage')

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

describe('UploadFilePage', () => {
    describe('UploadFilePage one-step', () => {
        beforeEach(async () => {
            vi.clearAllMocks()
            cleanup()

            render(
                <ContextStack>
                    <UploadFilePage />
                </ContextStack>,
            )
        })

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
            for (const key of ['name', 'path']) {
                const input = within(
                    screen.getByRole('rowheader', { name: key }).parentElement!,
                ).getByRole('textbox')
                await user.type(input, key)
                expect(input).toHaveValue(key)
            }
            // Error cleared when metadata is entered
            expect(screen.queryAllByText(/error/i)).toHaveLength(0)
            const mapping_input = within(
                screen.getByRole('rowheader', { name: 'mapping' })
                    .parentElement!,
            ).getByRole('combobox')
            await user.click(mapping_input)
            const mapping = screen.getByRole('option', {
                name: (n) => n.endsWith(column_mappings[0].id + ']'), // match mocked representation
            })
            await user.click(mapping)
            const team_input = within(
                screen.getByRole('rowheader', {
                    name: (n) => n.endsWith('team'), // marked as *team because it's mandatory
                }).parentElement!,
            ).getByRole('combobox')
            await user.click(team_input)
            const team = screen.getByRole('option', {
                name: (n) => n.endsWith(teams[0].id + ']'), // match mocked representation
            })
            await user.click(team)
            // Allows upload to the server
            await user.click(upload_button)
            // Should send a POST request with specific content
            expect(req.mock.lastCall).not.toBeUndefined()
            const last_call = req.mock.lastCall![0]
            expect(last_call).toHaveProperty('method', 'POST')
            expect(last_call).toHaveProperty('headers')
            expect(last_call.headers).toHaveProperty(
                'Content-Type',
                'multipart/form-data',
            )
            expect(last_call).toHaveProperty('data')
            const data = last_call.data as FormData
            expect(data.get('path')).toBe('path')
            expect(data.get('name')).toBe('name')
            expect(data.has('uploader')).toBe(true) // uploader will be undefined in tests but must be there
            expect(data.get('mapping')).toBe(column_mappings[0].url)
            expect(data.get('team')).toBe(teams[0].url)
            expect(data.get('file')).toBeInstanceOf(File)
        })
    })

    describe('UploadFilePage two-step', () => {
        beforeEach(async () => {
            vi.clearAllMocks()
            cleanup()

            const f = files.find((f) => f.name === 'partial.csv')
            expect(f).not.toBeUndefined()

            render(
                <ContextStack>
                    <ApiResourceContextProvider
                        lookupKey={LOOKUP_KEYS.FILE}
                        resourceId={f!.id}
                    >
                        <FileSummary resource={f!} />
                    </ApiResourceContextProvider>
                </ContextStack>,
            )

            await screen.findByText(/partial\.csv/)
        })

        it('shows file upload dialogue for resume', async () => {
            const user = userEvent.setup()

            // Has upload button
            const upload_button = await screen.findByRole('button', {
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
            const file = new File([''], 'partial.csv', { type: 'text/csv' })
            const file_data = mockData([file])
            await act(() => fireEvent.drop(file_select, file_data))
            // Shows success
            expect(
                await within(file_select).findByText(/partial\.csv/),
            ).toBeInTheDocument()
            // Allows upload to the server
            expect(upload_button).not.toBeDisabled()
            await user.click(upload_button)
            // Should send a POST request with specific content
            expect(req.mock.lastCall).not.toBeUndefined()
            const last_call = req.mock.lastCall![0]
            expect(last_call).toHaveProperty('method', 'POST')
            expect(last_call).toHaveProperty('headers')
            expect(last_call.headers).toHaveProperty(
                'Content-Type',
                'multipart/form-data',
            )
            expect(last_call).toHaveProperty('data')
            const data = last_call.data as FormData
            expect(data.get('path')).toBe(partial_file.path)
            expect(data.has('uploader')).toBe(true) // uploader will be undefined in tests but must be there
            expect(data.get('team')).toBe(partial_file.team)
            expect(data.get('file')).toBeInstanceOf(File)
        })
    })
})

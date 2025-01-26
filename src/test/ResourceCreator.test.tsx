// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterContextProvider } from '../Components/filtering/FilterContext'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import AttachmentUploadContextProvider from '../Components/AttachmentUploadContext'
import { expect, it, vi } from 'vitest'
import WrappedResourceCreator from '../Components/ResourceCreator'

vi.mock('../Components/CardActionBar')
vi.mock('../Components/prettify/PrettyObject')

it('renders', async () => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <FilterContextProvider>
                        <AttachmentUploadContextProvider>
                            <WrappedResourceCreator
                                lookupKey={LOOKUP_KEYS.Cell}
                            />
                        </AttachmentUploadContextProvider>
                    </FilterContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
    await waitFor(async () => {
        const btn = screen.getByRole('button')
        expect(btn).toBeInTheDocument()
        await userEvent.click(btn)
    })
    await screen.findByText(/DummyPrettyObject/)
})

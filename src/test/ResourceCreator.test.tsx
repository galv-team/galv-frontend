// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterContextProvider } from '../Components/filtering/FilterContext'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import AttachmentUploadContextProvider from '../Components/AttachmentUploadContext'
import { vi, it } from 'vitest'
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
                                lookup_key={LOOKUP_KEYS.CELL}
                            />
                        </AttachmentUploadContextProvider>
                    </FilterContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button'))
    await screen.findByText(/DummyPrettyObject/)
})

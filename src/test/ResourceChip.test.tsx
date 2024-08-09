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
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { expect, it, vi } from 'vitest'
import { cells } from './fixtures/fixtures'
import { ResourceChip } from '../Components/ResourceChip'

vi.mock('../Components/Representation')

const cell = cells[0]

it('renders', async () => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <FilterContextProvider>
                        <ResourceChip
                            lookupKey={LOOKUP_KEYS.CELL}
                            resourceId={cell.id}
                        />
                    </FilterContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
    await screen.findByText(/DummyRepresentation/)
    expect(screen.getByText((t) => t.includes(cell.id))).toBeInTheDocument()
})

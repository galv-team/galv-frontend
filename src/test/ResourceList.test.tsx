// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { expect, it, vi } from 'vitest'
import { cells } from './fixtures/fixtures'
import WrappedResourceList from '../Components/ResourceList'
import { MemoryRouter } from 'react-router-dom'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'

vi.mock('../Components/IntroText')
vi.mock('../Components/card/ResourceCard')
vi.mock('../ClientCodeDemo')

it('renders', async () => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <SelectionManagementContextProvider>
                        <WrappedResourceList lookupKey={LOOKUP_KEYS.CELL} />
                    </SelectionManagementContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
    await screen.findByText((t) => t.includes(cells[0].id))

    expect(screen.getByRole('heading', { name: 'Cells' })).toBeInTheDocument()
    expect(screen.getAllByText(/ResourceCard/)).toHaveLength(cells.length)
    expect(
        screen.getAllByText(
            (c, e) => e instanceof HTMLElement && e.dataset.key === 'lookupKey',
        ),
    ).toHaveLength(cells.length)
})

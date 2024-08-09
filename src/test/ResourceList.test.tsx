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

vi.mock('../Components/IntroText')
vi.mock('../Components/ResourceCard')
vi.mock('../ClientCodeDemo')

it('renders', async () => {
    const queryClient = new QueryClient()

    render(
        <QueryClientProvider client={queryClient}>
            <FetchResourceContextProvider>
                <WrappedResourceList lookupKey={LOOKUP_KEYS.CELL} />
            </FetchResourceContextProvider>
        </QueryClientProvider>,
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

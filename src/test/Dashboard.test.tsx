// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from '../Dashboard'
import { MemoryRouter } from 'react-router-dom'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'

const doRender = async () => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <SelectionManagementContextProvider>
                        <Dashboard />
                    </SelectionManagementContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
}

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders', async () => {
        await doRender()
    })

    it('shows an upload files button', async () => {
        await doRender()

        expect(
            screen.getByRole('link', { name: /Upload/i }),
        ).toBeInTheDocument()
    })
})

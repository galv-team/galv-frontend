// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS, LookupKey } from '../constants'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cells, experiments, files, users } from './fixtures/fixtures'
import WrappedResourceList from '../Components/ResourceList'
import { MemoryRouter } from 'react-router-dom'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import CurrentUserContextProvider from '../Components/CurrentUserContext'

vi.mock('../Components/IntroText')
vi.mock('../Components/card/ResourceCard')
vi.mock('../ClientCodeDemo')

const doRender = async (key: LookupKey = LOOKUP_KEYS.Cell) => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <CurrentUserContextProvider
                    user_override={JSON.stringify(users[0])}
                >
                    <FetchResourceContextProvider>
                        <SelectionManagementContextProvider>
                            <WrappedResourceList lookupKey={key} />
                        </SelectionManagementContextProvider>
                    </FetchResourceContextProvider>
                </CurrentUserContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
}

describe('ResourceList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders', async () => {
        await doRender()

        await screen.findByText((t) => t.includes(cells[0].id))

        expect(
            screen.getByRole('heading', { name: 'Cells' }),
        ).toBeInTheDocument()
        expect(screen.getAllByText(/ResourceCard/)).toHaveLength(cells.length)
        expect(
            screen.getAllByText(
                (c, e) =>
                    e instanceof HTMLElement && e.dataset.key === 'lookupKey',
            ),
        ).toHaveLength(cells.length)
    })

    it('shows a create button', async () => {
        await doRender(LOOKUP_KEYS.Experiment)
        await screen.findByText((t) => t.includes(experiments[0].id))

        expect(
            screen.getByRole('button', { name: /Create/i }),
        ).toBeInTheDocument()
    })

    it('shows create and create family buttons', async () => {
        await doRender()

        await waitFor(async () => {
            expect(
                screen.getAllByRole('button', { name: /Create/i }),
            ).toHaveLength(2)
        })

        expect(
            screen.getByRole('button', { name: /Family/i }),
        ).toBeInTheDocument()
    })

    it('shows an upload button for files', async () => {
        await doRender(LOOKUP_KEYS.ObservedFile)
        await screen.findByText((t) => t.includes(files[0].id))

        await waitFor(async () => {
            expect(
                screen.getByRole('link', { name: /Upload/i }),
            ).toBeInTheDocument()
        })
    })
})

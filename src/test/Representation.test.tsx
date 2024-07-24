// // SPDX-License-Identifier: BSD-2-Clause
// // Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// // of Oxford, and the 'Galv' Developers. All rights reserved.

// globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { LOOKUP_KEYS } from '../constants'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FetchResourceContextProvider from '../Components/FetchResourceContext'
import { it, expect } from 'vitest'
import Representation from '../Components/Representation'
import { teams } from './fixtures/fixtures'

it('renders', async () => {
    const queryClient = new QueryClient()
    const team = teams[0]

    render(
        <QueryClientProvider client={queryClient}>
            <FetchResourceContextProvider>
                <Representation
                    lookup_key={LOOKUP_KEYS.TEAM}
                    resource_id={team.id}
                    prefix="T"
                    suffix="!"
                />
            </FetchResourceContextProvider>
        </QueryClientProvider>,
    )

    expect(screen.getByText(`T${team.id}!`)).toBeInTheDocument()
    const updated_name = await screen.findByText(`T${team.name}!`)
    expect(updated_name).toBeInTheDocument()
})

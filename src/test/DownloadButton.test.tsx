// src/Components/download/DownloadButton.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DownloadButton from '../Components/download/DownloadButton'
import { downloadResources } from '../Components/download/utils'
import { describe, expect, it, vi } from 'vitest'
import { files } from './fixtures/fixtures'
import SelectionManagementContextProvider from '../Components/SelectionManagementContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import FetchResourceContextProvider from '../Components/FetchResourceContext'

global.URL.createObjectURL = vi.fn()

vi.mock(import('../Components/download/utils'), async (importOriginal) => {
    const mod = await importOriginal() // type is inferred
    return {
        ...mod,
        // replace some exports
        downloadResources: vi
            .fn()
            .mockResolvedValue(
                Promise.resolve(
                    new Blob(['test content'], { type: 'text/plain' }),
                ),
            ),
    }
})

const doRender = async () => {
    const queryClient = new QueryClient()

    render(
        <MemoryRouter initialEntries={['/']}>
            <QueryClientProvider client={queryClient}>
                <FetchResourceContextProvider>
                    <SelectionManagementContextProvider>
                        <DownloadButton targetUUIDs={files[0].id} />
                    </SelectionManagementContextProvider>
                </FetchResourceContextProvider>
            </QueryClientProvider>
        </MemoryRouter>,
    )
}

describe('DownloadButton', () => {
    it('should render the button', async () => {
        await doRender()
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should trigger download on click', async () => {
        await doRender()
        const user = userEvent.setup()
        await user.click(screen.getByRole('button'))
        expect(downloadResources).toHaveBeenCalledWith({
            resourceIds: [files[0].id],
        })
    })
})

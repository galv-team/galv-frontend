// src/Components/download/utils.test.ts
import { Configuration, ObservedFile } from '@galv/galv'
import {
    downloadResources,
    getFileName,
    saveDownloadedFile,
} from '../Components/download/utils'
import { describe, expect, it, vi } from 'vitest'
import { experiments } from './fixtures/fixtures'
import { showSaveFilePicker } from 'native-file-system-adapter'

vi.mock('native-file-system-adapter', () => {
    return {
        showSaveFilePicker: vi.fn().mockImplementation(() => ({
            createWritable: () => ({
                write: vi
                    .fn()
                    .mockResolvedValue(
                        new Blob(['test content'], { type: 'text/plain' }),
                    ),
                close: vi.fn(),
            }),
        })),
    }
})

vi.mock('../Components/AuthFile', () => {
    return {
        fetchAuthFile: vi.fn().mockImplementation((url: string) => ({
            filename: `${url.split('/').pop()}.csv`,
            content: new Blob(['test content'], { type: 'text/plain' }),
        })),
    }
})

// Polyfill for Blob.arrayBuffer so jsdom can read the Blob
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = function () {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as ArrayBuffer)
            reader.onerror = reject
            reader.readAsArrayBuffer(this)
        })
    }
}

describe('getFileName', () => {
    it('should return the name of the file', () => {
        const file: ObservedFile = { id: '1', name: 'test.csv' } as ObservedFile
        expect(getFileName(file)).toBe('test.csv')
    })

    it('should return the basename of the path without extension', () => {
        const file: ObservedFile = {
            id: '1',
            path: '/path/to/test.csv',
        } as ObservedFile
        expect(getFileName(file)).toBe('test')
    })

    it('should return the id if name and path are not available', () => {
        const file: ObservedFile = { id: '1' } as ObservedFile
        expect(getFileName(file)).toBe('1')
    })
})

describe('downloadResources', () => {
    it('should download resources and related resources', async () => {
        const api_config = new Configuration({ accessToken: 'token' })
        const blob = await downloadResources({
            resourceIds: [experiments[0].id],
            api_config,
            include_data: false,
        })
        expect(blob.constructor.name).toEqual('Blob')
    })

    it('should download resources and zip related data', async () => {
        const api_config = new Configuration({ accessToken: 'token' })
        const blob = await downloadResources({
            resourceIds: [experiments[0].id],
            api_config,
            include_data: true,
        })
        expect(blob.constructor.name).toEqual('Blob')
    })
})

describe('saveDownloadedFile', () => {
    it("should save a Blob to the user's filesystem", async () => {
        const blob = new Blob(['test content'], { type: 'text/plain' })
        await saveDownloadedFile(blob, { suggestedName: 'test.txt' })
        expect(showSaveFilePicker).toHaveBeenCalled()
    })
})

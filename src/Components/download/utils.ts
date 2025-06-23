import { showSaveFilePicker } from 'native-file-system-adapter'
import { Configuration, DumpApi, ObservedFile } from '@galv/galv'
import { has } from '../misc'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'

/**
 * Non-hook utility functions for downloading resources
 */

// Regular expression to match the path separator in a file path
const pathSplitterRegEx = /[/\\]/

type ZipBlobsOptions = {
    file: ObservedFile
    api_config: Configuration
    in_directory?: string | boolean
}

/**
 * Get the filename of an ObservedFile, preferring name, then path, then id
 */
export const getFileName = ({ name, path, id }: ObservedFile) => {
    // Return name, or basename without extension, or id
    if (name) {
        return name
    }
    if (path) {
        const basename = path.split(pathSplitterRegEx).pop()
        if (basename) {
            return basename.split('.')[0]
        }
    }
    return id
}

type downloadResourceOptions = {
    resourceIds: string[]
    api_config: Configuration
    include_data?: boolean
}

/**
 * Grab Galv resources and all their related resources.
 *
 * @return A Promise<Blob> containing the resource data in JSON format (or a ZIP file if include_data is true)
 */
export const downloadResources = async ({
    resourceIds,
    api_config,
    include_data = false,
}: downloadResourceOptions): Promise<Blob> => {
    let json_data: Record<string, unknown> = {}
    const zipWriter = include_data
        ? new ZipWriter(new BlobWriter('application/zip'))
        : undefined
    const writtenFiles = new Set<string>()

    // Where we can get a dump from the API, we use that by preference
    const download_item = async (id: string) => {
        if (Object.keys(json_data).includes(id)) return

        try {
            console.log(await new DumpApi(api_config).dumpRetrieve({ id }))
        } catch (e) {
            console.error(e)
        }

        return await new DumpApi(api_config)
            .dumpRetrieve({ id })
            .then((r) => r.data)
            .then(async (d) => {
                json_data = {
                    ...json_data,
                    ...(d as unknown as Record<string, unknown>),
                }
                if (zipWriter) {
                    const files_to_fetch = []
                    for (const value of Object.values(
                        d as unknown as Record<
                            string,
                            unknown & { id: string }
                        >,
                    )) {
                        if (
                            writtenFiles.has(value.id) ||
                            !has(value, 'parquet_partitions')
                        )
                            continue
                        writtenFiles.add(value.id)
                        files_to_fetch.push(value)
                    }
                    await Promise.all(
                        files_to_fetch.map((value) =>
                            zipBlobs(
                                {
                                    file: value as unknown as ObservedFile,
                                    api_config,
                                },
                                zipWriter,
                            ),
                        ),
                    )
                }
            })
    }

    await Promise.all(resourceIds.map((id) => download_item(id)))

    // Make a blob for the JSON data
    const blob = new Blob([JSON.stringify(json_data, null, 2)], {
        type: 'application/json',
    })
    if (!zipWriter) return blob

    await zipWriter.add('galv_export.json', new BlobReader(blob))
    return zipWriter.close()
}

/**
 * Save a Blob to the user's filesystem
 */
export const saveDownloadedFile = async (
    f: Blob,
    showSaveFilePickerOptions: Parameters<typeof showSaveFilePicker>[0],
) => {
    // Use showSaveFilePicker to prompt user for a file save location
    try {
        const handle = await showSaveFilePicker(showSaveFilePickerOptions)

        const writableStream = await handle.createWritable()
        await writableStream.write(f)
        await writableStream.close()
    } catch (e: unknown) {
        if (!has(e, 'name') || e.name !== 'AbortError') {
            throw e
        }
    }
}

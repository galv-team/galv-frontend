import { showSaveFilePicker } from 'native-file-system-adapter'
import {
    Configuration,
    DumpApi,
    ObservedFile,
    ParquetPartitionsApi,
} from '@galv/galv'
import { assertFulfilled, has } from '../misc'
import { fetchAuthFile } from '../AuthFile'
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
 * Zip the ParquetPartitions of a file into a Blob for download
 *
 * @param options - The file to zip, the API configuration to use, and whether to include the directory name in the zip
 *
 * @returns A Promise<Blob> containing the zipped ParquetPartitions
 */
export async function zipBlobs({
    file,
    api_config,
    in_directory,
}: ZipBlobsOptions): Promise<Blob>
/**
 * Zip the ParquetPartitions of a file into a Blob for download
 *
 * @param options - The file to zip, the API configuration to use, and whether to include the directory name in the zip
 * @param zipWriter - A ZipWriter<Blob> to add the blobs to
 *
 * @returns A Promise<ZipWriter<Blob>> containing the zipWriter with ParquetPartitions added
 */
export async function zipBlobs(
    { file, api_config, in_directory }: ZipBlobsOptions,
    zipWriter: ZipWriter<Blob>,
): Promise<ZipWriter<Blob>>
export async function zipBlobs(
    { file, api_config, in_directory = true }: ZipBlobsOptions,
    zipWriter?: ZipWriter<Blob>,
): Promise<ZipWriter<Blob> | Blob> {
    const dir_name_raw =
        in_directory === true ? getFileName(file) : in_directory || ''
    const dir_name =
        dir_name_raw && !/\/$/.test(dir_name_raw)
            ? `${dir_name_raw}/`
            : dir_name_raw
    const partitions = await Promise.allSettled(
        file.parquet_partitions.map(async (partition_id) => {
            const response = await new ParquetPartitionsApi(
                api_config,
            ).parquetPartitionsRetrieve({ id: partition_id })
            // Second, fetch the ParquetPartition file via getAuthFile
            if (
                !has(response.data, 'parquet_file') ||
                response.data.parquet_file === null
            ) {
                return undefined
            }
            return fetchAuthFile({
                url: response.data.parquet_file,
                headers: {
                    authorization: `Bearer ${api_config.accessToken}`,
                    'Galv-Storage-No-Redirect': true,
                },
            })
        }),
    )
    const zW = zipWriter ?? new ZipWriter(new BlobWriter('application/zip'))
    await Promise.all(
        partitions
            .filter((p) => assertFulfilled(p))
            .map((p) => p.value)
            .filter((p) => p !== undefined)
            .map((p) => {
                return zW.add(
                    `${dir_name}${p.filename}`,
                    new BlobReader(p.content.data),
                )
            }),
    )
    return zipWriter ? zW : await zW.close()
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

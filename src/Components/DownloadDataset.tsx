import React, { useState } from 'react'
import { showSaveFilePicker } from 'native-file-system-adapter'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { useCurrentUser } from './CurrentUserContext'
import { Configuration, ObservedFile, ParquetPartitionsApi } from '@galv/galv'
import { get_url_components, has } from './misc'
import { fetchAuthFile } from './AuthFile'
import CircularProgress from '@mui/material/CircularProgress'
import { MdDownload } from 'react-icons/md'
import Button, { ButtonProps } from '@mui/material/Button'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'

// Don't use useQueries or useFetchResource here because we have a complex async flow

const pathSplitterRegEx = /[/\\]/

type ZipBlobOptions = {
    file: ObservedFile
    api_config: Configuration
    headers: Record<string, unknown>
    // if inDirectory is true use the file's name as the directory name
    in_directory?: string | boolean
}
const zipBlobs = async ({
    file,
    api_config,
    headers,
    in_directory = true,
}: ZipBlobOptions) => {
    const dname = in_directory === true ? getFileName(file) : in_directory || ''
    const dir_name = dname && !/\/$/.test(dname) ? `${dname}/` : dname
    const partitions = await Promise.all(
        file.parquet_partitions.map((partition_url) => {
            // First, look up the ParquetPartitions for the file and get their file URLs
            const components = get_url_components(partition_url)
            if (!components?.resourceId) {
                return Promise.resolve(undefined)
            }
            return new ParquetPartitionsApi(api_config)
                .parquetPartitionsRetrieve({ id: components.resourceId })
                .then((response) => {
                    // Second, fetch the ParquetPartition file via getAuthFile
                    if (
                        !has(response.data, 'parquet_file') ||
                        response.data.parquet_file === null
                    ) {
                        return undefined
                    }
                    return fetchAuthFile({
                        url: response.data.parquet_file,
                        headers,
                    })
                })
        }),
    )
    const zipWriter = new ZipWriter(new BlobWriter('application/zip'))
    await Promise.all(
        partitions
            .filter((p) => p !== undefined)
            .map((p) =>
                zipWriter.add(
                    `${dir_name}${p.filename}`,
                    new BlobReader(p.content.data),
                ),
            ),
    )
    return await zipWriter.close()
}

const getFileName = ({ name, path, id }: ObservedFile) => {
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

const downloadZip = async (zipBlob: Blob, filename: string) => {
    // Use showSaveFilePicker to prompt user for a file save location
    const handle = await showSaveFilePicker({
        suggestedName: `${filename}.zip`,
        types: [
            {
                description: 'ZIP Archive',
                accept: { 'application/zip': ['.zip'] },
            },
        ],
    })

    const writableStream = await handle.createWritable()
    await writableStream.write(zipBlob)
    await writableStream.close()
}

type DownloadDatasetProps<UseIconButton> = UseIconButton extends true
    ? { file: ObservedFile; iconButton: UseIconButton } & {
          buttonProps: Partial<Omit<IconButtonProps, 'onClick' | 'children'>>
      }
    : { file: ObservedFile; iconButton: UseIconButton } & {
          buttonProps: Partial<Omit<ButtonProps, 'onClick' | 'children'>>
      }

export default function DownloadDataset<UseIconButton>({
    file,
    iconButton,
    ...buttonProps
}: DownloadDatasetProps<UseIconButton>) {
    const { user, api_config } = useCurrentUser()
    const [loading, setLoading] = useState(false)
    const headers = {
        authorization: `Bearer ${user?.token}`,
        'Galv-Storage-No-Redirect': true,
    }

    const downloadZippedBlobs = async () => {
        setLoading(true)
        setTimeout(() => {
            zipBlobs({ file, api_config, headers })
                .then((zipBlob) => downloadZip(zipBlob, getFileName(file)))
                .finally(() => setLoading(false))
        })
    }

    if (!user) {
        return <Button disabled={true}>Log in to download files</Button>
    }

    if (iconButton)
        return (
            <IconButton
                disabled={loading}
                onClick={downloadZippedBlobs}
                {...buttonProps}
            >
                {loading ? <CircularProgress /> : <MdDownload />}
            </IconButton>
        )

    return (
        <Button
            startIcon={loading ? <CircularProgress /> : <MdDownload />}
            variant="contained"
            color="primary"
            onClick={downloadZippedBlobs}
            disabled={loading}
            sx={{ mt: 2 }}
            {...buttonProps}
        >
            Download Dataset
        </Button>
    )
}

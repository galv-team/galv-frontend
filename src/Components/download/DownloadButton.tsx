import Button, { ButtonProps } from '@mui/material/Button'
import { useState } from 'react'
import { useCurrentUser } from '../CurrentUserContext'
import { ICONS } from '../../constants'
import CircularProgress from '@mui/material/CircularProgress'
import { downloadResources, saveDownloadedFile } from './utils'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import SafeTooltip from '../SafeTooltip'

/**
 * Download a resource or resources as a JSON or ZIP file
 *
 * @param targetUUIDs The UUIDs of the resources to download
 * @param includeData Whether to include the data in the download
 * @param iconButton Whether to render as an IconButton
 */
export type DownloadButtonProps<UseIconButton> = UseIconButton extends true
    ? {
          targetUUIDs: string | string[]
          includeData?: boolean
          iconButton?: UseIconButton
      } & Omit<IconButtonProps, 'onClick' | 'children'>
    : {
          targetUUIDs: string | string[]
          includeData?: boolean
          iconButton?: UseIconButton
      } & Omit<ButtonProps, 'onClick' | 'children'>

export default function DownloadButton<UseIconButton>({
    targetUUIDs,
    includeData,
    iconButton,
    ...props
}: DownloadButtonProps<UseIconButton>) {
    const targets =
        typeof targetUUIDs === 'string' ? [targetUUIDs] : targetUUIDs
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const { api_config } = useCurrentUser()
    const yyyy_mm_dd = new Date().toISOString().split('T')[0]

    const start = async () => {
        setLoading(true)
        setError(false)
        setTimeout(download, 10)
    }
    const download = async () => {
        return downloadResources({
            resourceIds: targets,
            api_config,
            include_data: includeData,
        })
            .then((blob) =>
                saveDownloadedFile(blob, {
                    suggestedName: `${yyyy_mm_dd}_galv-export.${includeData ? 'zip' : 'json'}`,
                    types: [
                        {
                            description: includeData
                                ? 'ZIP Archive'
                                : 'JSON file',
                            accept: {
                                'application/zip': ['.zip'],
                                'application/json': ['.json'],
                            },
                        },
                    ],
                }),
            )
            .then(() => setLoading(false))
            .catch((e) => {
                console.error(`Error downloading ${targetUUIDs}`, e)
                setError(true)
                setLoading(false)
            })
    }

    if (iconButton) {
        return (
            <SafeTooltip
                title={
                    error
                        ? 'Error downloading'
                        : `Download${loading ? 'ing' : ''} ${includeData ? 'ZIP' : 'JSON'}`
                }
            >
                <span aria-disabled={loading}>
                    <IconButton
                        onClick={start}
                        disabled={loading}
                        {...props}
                    >
                        {loading ? (
                            <CircularProgress />
                        ) : error ? (
                            <ICONS.ERROR />
                        ) : (
                            <ICONS.DOWNLOAD />
                        )}
                    </IconButton>
                </span>
            </SafeTooltip>
        )
    }

    return (
        <Button
            onClick={start}
            startIcon={
                loading ? (
                    <CircularProgress size={'1em'} />
                ) : error ? (
                    <ICONS.ERROR />
                ) : (
                    <ICONS.DOWNLOAD />
                )
            }
            color={loading ? 'info' : error ? 'error' : 'primary'}
            variant="contained"
            disabled={loading}
            {...props}
        >
            {error
                ? 'Retry download?'
                : `Download ${includeData ? 'ZIP' : 'JSON'}`}
        </Button>
    )
}

/* Retrieve a file that requires API credentials to access it */
import React, { useEffect, useState } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'
import { Link } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import { ICONS } from '../constants'
import SafeTooltip from './SafeTooltip'

const clean_filename = (filename: string) => {
    return filename.replace(/\.parquet.*$/, '.parquet')
}

export async function fetchAuthFile({
    url,
    headers,
}: {
    url: string
    headers: Record<string, unknown>
}): Promise<{ filename: string; content: AxiosResponse<Blob> }> {
    let filename: string = 'file'
    const response = await axios.get(url, {
        headers,
        responseType: 'blob',
    })
    const redirect_url = response.headers['galv-storage-redirect-url']
    if (redirect_url) {
        filename = redirect_url.split('/').pop() ?? filename
    } else {
        const disposition = response.headers['content-disposition']
        if (disposition) {
            filename =
                disposition.split('filename=')[1].split('"')[0] ?? filename
        } else {
            // Extract UUID from URL and use it as filename
            filename =
                url
                    .split('/')
                    .find((x) => /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/.test(x)) ??
                filename
        }
    }
    return {
        filename: clean_filename(filename),
        content: redirect_url
            ? await axios.get(redirect_url, { responseType: 'blob' })
            : response,
    }
}

export default function AuthFile({ url }: { url: string }) {
    const [dataUrl, setDataUrl] = useState('')
    const [filename, setFilename] = useState('file')
    const [downloading, setDownloading] = useState(false)
    const headers = {
        authorization: `Bearer ${useCurrentUser().user?.token}`,
        'Galv-Storage-No-Redirect': true,
    }
    const query = useQuery({
        queryKey: [url],
        queryFn: async () => {
            const { filename, content } = await fetchAuthFile({ url, headers })
            setFilename(filename)
            return content
        },
        enabled: downloading,
    })

    useEffect(() => {
        if (query.data) {
            setDataUrl(URL.createObjectURL(query.data.data))
        }
    }, [query.data])

    if (dataUrl) {
        return (
            <Button
                component="a"
                href={dataUrl}
                download={clean_filename(filename) ?? 'file.parquet'}
                color="success"
                startIcon={<ICONS.SAVE />}
            >
                Save
            </Button>
        )
    }

    if (query.isLoading && query.isFetching) {
        return (
            <Button startIcon={<CircularProgress size="1em" />}>
                {' '}
                fetching
            </Button>
        )
    }

    if (query.isError) {
        return (
            <SafeTooltip title={`Click to visit ${url} directly.`}>
                <Button component={Link} to={url}>
                    Failed to download
                </Button>
            </SafeTooltip>
        )
    }

    return (
        <Button
            onClick={() => setDownloading(true)}
            startIcon={<ICONS.DOWNLOAD />}
        >
            Download
        </Button>
    )
}

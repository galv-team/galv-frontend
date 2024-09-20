/* Retrieve a file that requires API credentials to access it */
import React, { useEffect, useState } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import { ICONS } from '../constants'
import SafeTooltip from './SafeTooltip'

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
            const response = await axios.get(url, {
                headers,
                responseType: 'blob',
            })
            const redirect_url = response.headers['galv-storage-redirect-url']
            if (redirect_url) {
                setFilename(redirect_url.split('/').pop() ?? 'file')
            } else {
                const disposition = response.headers['content-disposition']
                if (disposition) {
                    setFilename(disposition.split('filename=')[1].split('"')[0])
                } else {
                    setFilename(url.split('/').pop() ?? 'file')
                }
            }
            return redirect_url
                ? axios.get(redirect_url, { responseType: 'blob' })
                : response
        },
        enabled: downloading,
    })

    const clean_filename = (filename: string) => {
        return filename.replace(/\.parquet.*$/, '.parquet')
    }

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

// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import useStyles from '../styles/UseStyles'
import { useSelectionManagement } from './SelectionManagementContext'
import { ResourceChip } from './ResourceChip'
import { get_url_components } from './misc'
import clsx from 'clsx'
import Grid from '@mui/material/Unstable_Grid2'
import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Button, { ButtonProps } from '@mui/material/Button'
import { ICONS } from '../constants'
import CircularProgress from '@mui/material/CircularProgress'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { DumpApi } from '@galv/galv'
import { useCurrentUser } from './CurrentUserContext'

export function DownloadButton({
    target_uuids,
    ...props
}: { target_uuids: string | string[] } & ButtonProps) {
    const targets =
        typeof target_uuids === 'string' ? [target_uuids] : target_uuids

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [downloadLink, setDownloadLink] = useState<string>()
    const { api_config } = useCurrentUser()

    const downloadButton = (
        <Button
            component="a"
            href={downloadLink}
            download={`galv-export-${new Date().toISOString()}.json`}
            startIcon={<ICONS.DOWNLOAD />}
            endIcon={<ICONS.CHECK />}
            color="success"
            variant="contained"
            {...{ props, children: undefined }}
        >
            Download ready
        </Button>
    )

    const do_download = async () => {
        try {
            setLoading(true)
            setDownloadLink(undefined)
            setError(false)
            let data: Record<string, unknown> = {}

            // Where we can get a dump from the API, we use that by preference
            const download_item = async (id: string) => {
                if (Object.keys(data).includes(id)) return

                return await new DumpApi(api_config)
                    .dumpRetrieve({ id })
                    .then((r) => r.data)
                    .then(
                        (d) =>
                            (data = {
                                ...data,
                                ...(d as unknown as Record<string, unknown>),
                            }),
                    )
            }

            await Promise.all(targets.map((t) => download_item(t)))

            // Make a blob and download it
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            })
            setDownloadLink(URL.createObjectURL(blob))
            setLoading(false)
        } catch (e) {
            console.error(`Error downloading ${target_uuids}`, e)
            setError(true)
            setLoading(false)
        }
    }

    return !loading && downloadLink ? (
        downloadButton
    ) : (
        <Button
            onClick={do_download}
            startIcon={
                loading ? <CircularProgress size={24} /> : <ICONS.DOWNLOAD />
            }
            disabled={loading || error}
            {...props}
        />
    )
}

export type SelectedResourcesPaneProps = Record<string, never>

export function SelectedResourcesPane() {
    const { classes } = useStyles()
    const { resource_urls, deselect, clearSelections } =
        useSelectionManagement()
    const [open, setOpen] = useState(false)

    const actions = (
        <Stack direction={'row'} spacing={1}>
            <Button onClick={clearSelections} startIcon={<ICONS.CANCEL />}>
                Clear
            </Button>
            <DownloadButton target_uuids={resource_urls}>JSON</DownloadButton>
            {/*<Button onClick={() => {}} startIcon={<ICONS.DOWNLOAD />}>JSON-LD</Button>*/}
        </Stack>
    )

    return resource_urls && resource_urls.length > 0 ? (
        <Card className={clsx(classes.selectedResources, classes.tool)}>
            <CardHeader
                title={`${resource_urls.length} resources selected`}
                subheader={open ? 'Hide details' : 'Show all'}
                action={actions}
                onClick={() => setOpen(!open)}
                sx={{ cursor: 'pointer' }}
            />
            {open && (
                <CardContent>
                    <Grid
                        container
                        className={clsx(classes.selectedResourcesList)}
                    >
                        {resource_urls
                            .sort((a, b) => a.localeCompare(b))
                            .map((s) => {
                                const components = get_url_components(s)
                                if (
                                    !components ||
                                    !components.resourceId ||
                                    !components.lookupKey
                                ) {
                                    console.error(
                                        `Could not parse resourceId or lookupKey from ${s}`,
                                        { components, s, resource_urls },
                                    )
                                    throw new Error(`Error loading ${s}`)
                                }
                                return (
                                    <ResourceChip
                                        resourceId={components.resourceId}
                                        lookupKey={components.lookupKey}
                                        key={s}
                                        onDelete={(e) => {
                                            e.preventDefault()
                                            deselect(s)
                                        }}
                                    />
                                )
                            })}
                    </Grid>
                </CardContent>
            )}
        </Card>
    ) : null
}

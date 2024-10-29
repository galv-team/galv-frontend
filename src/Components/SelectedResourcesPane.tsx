// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import useStyles from '../styles/UseStyles'
import { useSelectionManagement } from './SelectionManagementContext'
import ResourceChip from './ResourceChip'
import { get_url_components } from './misc'
import clsx from 'clsx'
import Grid from '@mui/material/Grid2'
import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { ICONS } from '../constants'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import DownloadButton from './download/DownloadButton'

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
            {/* Allow both JSON and ZIP downloads. JSON for just metadata */}
            <DownloadButton targetUUIDs={resource_urls} />
            <DownloadButton targetUUIDs={resource_urls} includeData={true} />
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

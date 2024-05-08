// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import useStyles from "../styles/UseStyles";
import {useSelectionManagement} from "./SelectionManagementContext";
import {ResourceChip} from "./ResourceChip";
import {get_url_components} from "./misc";
import clsx from "clsx";
import Grid from "@mui/material/Unstable_Grid2";
import {useState} from "react";
import Stack from "@mui/material/Stack";
import Button, {ButtonProps} from "@mui/material/Button";
import {API_HANDLERS, API_SLUGS, FIELDS, ICONS, SerializableObject} from "../constants";
import {useQueryClient} from "@tanstack/react-query";
import {AxiosResponse} from "axios";
import {BaseResource} from "./ResourceCard";
import CircularProgress from "@mui/material/CircularProgress";
import CardHeader from "@mui/material/CardHeader";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {Configuration} from "@battery-intelligence-lab/galv";
import {useCurrentUser} from "./CurrentUserContext";

export function DownloadButton({target_urls, ...props}: {target_urls: string|string[]} & ButtonProps) {
    const targets = typeof target_urls === 'string' ? [target_urls] : target_urls

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [downloadLink, setDownloadLink] = useState<string>()
    const queryClient = useQueryClient()
    const {user} = useCurrentUser()

    const downloadButton = <Button
        component="a"
        href={downloadLink}
        download={`galv-export-${new Date().toISOString()}.json`}
        startIcon={<ICONS.DOWNLOAD />}
        endIcon={<ICONS.CHECK />}
        color="success"
        variant="contained"
        {...{props, children: undefined}}
    >
        Download ready
    </Button>

    const do_download = async () => {
        try {
            setLoading(true)
            setDownloadLink(undefined)
            setError(false)
            const data: SerializableObject[] = []
            const to_id = (c: ReturnType<typeof get_url_components>) => `${c?.lookup_key}/${c?.resource_id}`
            const ids: string[] = []

            // Actually does the fetching of data - falls back to API if not in cache
            const fetch = async (url: string, raise: boolean = false) => {
                const components = get_url_components(url)
                if (!components || !components.resource_id || !components.lookup_key) {
                    if (raise)
                        throw new Error(`Could not parse resource_id or lookup_key from ${url}`)
                    return
                }
                const data = queryClient.getQueryData([components.lookup_key, components.resource_id])

                if (data) return data

                const {api_config} = useCurrentUser()
                const api_handler = new API_HANDLERS[components.lookup_key](api_config)
                const get = api_handler[
                    `${API_SLUGS[components.lookup_key]}Retrieve` as keyof typeof api_handler
                    ] as (id: string) => Promise<AxiosResponse<unknown>>

                return get.bind(api_handler)(components.resource_id)
            }
            // Parses response to a fetch and recursively fetches all linked resources
            const fetch_if_not_already_fetched = async (url: unknown): Promise<void> => {
                if (typeof url === 'string') {
                    const components = get_url_components(url)
                    const id = to_id(components)
                    if (id && !ids.includes(id)) {
                        ids.push(id)
                        await recursive_fetch(url)
                    }
                }
                if (url instanceof Array)
                    await Promise.all(url.map(fetch_if_not_already_fetched));
                return Promise.resolve()
            }
            // Recursively fetches all linked resources
            const recursive_fetch = async (url: string, raise: boolean = false) => {
                return fetch(url, raise)
                    .then(d => {
                        const r = d as AxiosResponse<BaseResource>
                        if (!r || !r.data) {
                            if (raise)
                                throw new Error(`Could not get data for ${url}`)
                            return
                        }
                        if (data.find(d => d.url === r.data.url)) return
                        data.push(r.data)
                        const components = get_url_components(url)
                        if (!components || !components.lookup_key || !components.resource_id) return
                        const fields = FIELDS[components.lookup_key]
                        const links = Object.fromEntries(Object.entries(r.data)
                            .filter(([k, v]) => {
                                const field = fields[k as keyof typeof fields] as {fetch_in_download?: boolean}
                                return field && field.fetch_in_download && (v instanceof Array || typeof v === 'string')
                            }))
                        return Promise.all(Object.values(links).map(fetch_if_not_already_fetched))
                    })
            }
            await Promise.all(targets.map(t => recursive_fetch(t, true)))

            // Make a blob and download it
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
            setDownloadLink(URL.createObjectURL(blob))
            setLoading(false)
        } catch (e) {
            console.error(`Error downloading ${target_urls}`, e)
            setError(true)
            setLoading(false)
        }
    }

    return (!loading && downloadLink)? downloadButton : <Button
        onClick={do_download}
        startIcon={loading ? <CircularProgress size={24} /> : <ICONS.DOWNLOAD />}
        disabled={loading || error}
        {...props}
    />
}

export type SelectedResourcesPaneProps = Record<string, never>

export function SelectedResourcesPane() {
    const { classes } = useStyles();
    const {resource_urls, deselect, clearSelections} = useSelectionManagement()
    const [open, setOpen] = useState(false);

    const actions = <Stack direction={"row"} spacing={1}>
        <Button onClick={clearSelections} startIcon={<ICONS.CANCEL />}>Clear</Button>
        <DownloadButton target_urls={resource_urls}>JSON</DownloadButton>
        {/*<Button onClick={() => {}} startIcon={<ICONS.DOWNLOAD />}>JSON-LD</Button>*/}
    </Stack>

    return resource_urls && resource_urls.length > 0?
        <Card className={clsx(classes.selectedResources, classes.tool)}>
            <CardHeader
                title={`${resource_urls.length} resources selected`}
                subheader={open? "Hide details" : "Show all"}
                action={actions}
                onClick={() => setOpen(!open)}
                sx={{cursor: 'pointer'}}
            />
            {open && <CardContent>
                <Grid container className={clsx(classes.selectedResourcesList)}>
                    {resource_urls.sort((a, b) => a.localeCompare(b))
                        .map(s => {
                            const components = get_url_components(s)
                            if (!components || !components.resource_id || !components.lookup_key) {
                                console.error(`Could not parse resource_id or lookup_key from ${s}`, {components, s, resource_urls})
                                throw new Error(`Error loading ${s}`)
                            }
                            return <ResourceChip
                                resource_id={components.resource_id}
                                lookup_key={components.lookup_key}
                                key={s}
                                onDelete={(e) => {
                                    e.preventDefault()
                                    deselect(s)
                                }}
                            />
                        })}
                </Grid>
            </CardContent>}
        </Card> : null
}

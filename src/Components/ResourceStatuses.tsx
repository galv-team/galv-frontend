import {ICONS, LOOKUP_KEYS, LookupKey, PATHS} from "../constants";
import React, {ReactNode} from "react";
import Stack from "@mui/material/Stack";
import {useApiResource} from "./ApiResourceContext";
import Alert, {AlertProps} from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import {Link} from "react-router-dom";
import List from "@mui/material/List";
import useStyles from "../styles/UseStyles";
import CardActions from "@mui/material/CardActions";
import {FilesApi, ObservedFile} from "@galv/galv";
import clsx from "clsx";
import {useCurrentUser} from "./CurrentUserContext";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {AxiosError, AxiosResponse} from "axios";
import {DB_MappingResource} from "./Mapping";
import Skeleton from "@mui/material/Skeleton";

export function StatusAlert(
    {message, fix_button, children, ...alertProps}:
        { message: ReactNode, fix_button: ReactNode } & AlertProps
) {
    const {classes} = useStyles()
    const [open, setOpen] = React.useState(false);
    const EXPAND_ICON = ICONS[open ? "EXPAND_LESS" : "EXPAND_MORE"]
    return <Alert {...alertProps} className={classes.statusAlert}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{width: "100%"}}>
            {message}
            <Stack direction="row" alignItems="center">
                {fix_button}
                {children && <EXPAND_ICON onClick={() => setOpen(!open)} sx={{cursor: "pointer"}} />}
            </Stack>
        </Stack>
        <Collapse in={open} unmountOnExit>
            {children}
        </Collapse>
    </Alert>
}

const fileStatuses = (file: ObservedFile, mappings: DB_MappingResource[]) => {
    const statuses: ReactNode[] = []
    const map = mappings.find(m => m.url === file.mapping)
    if (map) {
        if (map.is_valid) {
            statuses.push(<StatusAlert
                message={`File mapped using valid mapping '${map.name}'`}
                fix_button={
                    <Button component={Link} to={`${PATHS.MAPPING}/${file.id ?? file.id}`} size="small">
                        Edit mapping
                    </Button>
                }
                severity="success"
            >
                Data has the required columns. Preview and analysis tools are available.
            </StatusAlert>)
        } else {
            statuses.push(<StatusAlert
                message={`An invalid mapping '${map.name}' is applied to this file`}
                fix_button={
                    <Button component={Link} to={`${PATHS.MAPPING}/${file.id ?? file.id}`} size="small">
                        Edit mapping
                    </Button>
                }
                severity="warning"
            >
                All mappings must recognise 'ElapsedTime_s', 'Voltage_V', and 'Current_A' columns to be counted as valid.
                Data that do not have these columns cannot be previewed, and may not be suitable for analysis.
            </StatusAlert>)
        }
    } else {
        if (mappings.length > 0) {
            statuses.push(<StatusAlert
                message="There are mappings that can be applied to this file, but none have been selected"
                fix_button={
                    <Button component={Link} to={`${PATHS.MAPPING}/${file.id ?? file.id}`} size="small">
                        Choose mapping
                    </Button>
                }
                severity="warning"
            >

                Mappings are used to map the columns in a file to the columns in the database.
                When a suite of files use the same column names to represent the same kind of data,
                analyses can be performed across all the files.
                Galv requires that certain key columns are present in every file: 'ElapsedTime_s', 'Voltage_V', and
                'Current_A'.
            </StatusAlert>)
        } else {
            statuses.push(<StatusAlert
                message="There are no mappings that can be applied to this file"
                fix_button={
                    <Button component={Link} to={`${PATHS.MAPPING}/${file.id ?? file.id}`} size="small">
                        Create mapping
                    </Button>
                }
                severity="error"
            >
                Mappings are used to map the columns in a file to the columns in the database.
                When a suite of files use the same column names to represent the same kind of data,
                analyses can be performed across all the files.
                Galv requires that certain key columns are present in every file: 'ElapsedTime_s', 'Voltage_V', and 'Current_A'.
            </StatusAlert>)
        }
    }
    return statuses
}

export default function ResourceStatuses({lookup_key}: {lookup_key: LookupKey}) {
    const {classes} = useStyles()
    const {apiResource} = useApiResource()
    // look up mappings from file
    const fileApiHandler = new FilesApi(useCurrentUser().api_config)
    const queryClient = useQueryClient()
    const applicableMappingsQuery = useQuery<AxiosResponse<DB_MappingResource[]>, AxiosError>(
        ["applicable_mappings", apiResource?.id],
        async () => {
            const data = await fileApiHandler.filesApplicableMappingsRetrieve(
                {id: apiResource!.id as string}
            )
            queryClient.setQueryData(["applicable_mappings", apiResource!.id], data)
            const content = data.data as unknown as {mapping: DB_MappingResource, missing: number}[]
            return {
                ...data,
                data: content.map(m => {
                    return {...m.mapping, missing: m.missing}
                })
            } as unknown as AxiosResponse<DB_MappingResource[]>
        },
        {enabled: lookup_key === LOOKUP_KEYS.FILE && !!apiResource?.id}
    )
    const mappings = applicableMappingsQuery.data?.data ?? []
    if (!apiResource) return null
    const statuses: ReactNode[] = []
    switch(lookup_key) {
        case LOOKUP_KEYS.FILE:
            if (apiResource.state !== "GROWING") {
                if (applicableMappingsQuery.isFetching || applicableMappingsQuery.isLoading) {
                    statuses.push(<Skeleton variant="rounded" height="3em" />)
                } else
                    statuses.push(...fileStatuses(apiResource as unknown as ObservedFile, mappings))
            }
            break;
    }
    return statuses.length > 0?
        <CardActions className={clsx(classes.statusActions)}>
            <List>{...statuses}</List>
        </CardActions> : null
}
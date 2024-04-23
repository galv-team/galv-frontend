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

export default function ResourceStatuses({lookup_key}: {lookup_key: LookupKey}) {
    const {apiResource} = useApiResource()
    if (!apiResource) return null
    const statuses: ReactNode[] = []
    const get_prop = (prop: string) => apiResource[prop] ?? undefined
    switch(lookup_key) {
        case LOOKUP_KEYS.FILE:
            if (!get_prop("has_required_columns")) {
                statuses.push(<StatusAlert
                    message="This file does not have the required columns."
                    fix_button={
                        <Button component={Link} to={`${PATHS.MAPPING}/${apiResource.id ?? apiResource.id}`}>
                            Map columns
                        </Button>
                    }
                    severity="warning"
                >
                    All files are required to have 'ElapsedTime_s', 'Voltage_V', and 'Current_A' columns to be counted as valid.
                    Files that do not have these columns cannot be previewed, and may not be suitable for analysis.
                </StatusAlert>)
            }
            break;
    }
    return statuses.length > 0?
        <CardActions><List sx={{width: "100%"}}>{...statuses}</List></CardActions> : null
}
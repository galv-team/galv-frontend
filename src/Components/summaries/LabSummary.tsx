import {Lab} from "@galv/galv";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import Stack from "@mui/material/Stack";
import ChipList from "./ChipList";
import Typography from "@mui/material/Typography";

import {GalvResource} from "../../constants";


export default function LabSummary({ resource } : { resource: GalvResource}) {
    const {classes} = useStyles();
    const r = resource as unknown as Lab

    return <Stack className={clsx(classes.resourceSummary)} spacing={1}>
        <Typography variant="body2">{r.description}</Typography>
        <Stack direction="row">Admins: <ChipList chips={r.admin_group as unknown as string[]}/></Stack>
        <Stack direction="row">Teams: <ChipList chips={r.teams as unknown as string[]}/></Stack>
        <Stack direction="row">Harvesters: <ChipList chips={r.harvesters as unknown as string[]}/></Stack>
    </Stack>
}

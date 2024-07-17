import {BaseResource} from "../ResourceCard";
import {Experiment} from "@galv/galv";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import Stack from "@mui/material/Stack";
import ChipList from "./ChipList";

export default function CyclerTestSummary({ resource } : { resource: BaseResource}) {
    const {classes} = useStyles();
    const r = resource as unknown as Experiment

    return <Stack className={clsx(classes.resourceSummary)} spacing={1}>
        <Stack direction="row">Cycler Tests: <ChipList chips={r.cycler_tests as string[]} /></Stack>
    </Stack>
}

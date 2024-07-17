import {BaseResource} from "../ResourceCard";
import {DataColumnType} from "@galv/galv";
import useStyles from "../../styles/UseStyles";
import clsx from "clsx";
import Stack from "@mui/material/Stack";
import {get_url_components} from "../misc";
import {ResourceChip} from "../ResourceChip";
import Typography from "@mui/material/Typography";


export default function UnitSummary({ resource } : { resource: BaseResource}) {
    const {classes} = useStyles();
    const r = resource as unknown as DataColumnType

    const unit = r.unit? get_url_components(r.unit) : undefined

    return <Stack className={clsx(classes.resourceSummary)} spacing={1}>
        <Typography variant="body2">{r.description}</Typography>
        <Stack direction="row">
            {r.data_type} {unit && <ResourceChip resource_id={unit.resource_id} lookup_key={unit.lookup_key}/>}
        </Stack>
    </Stack>
}

import useStyles from "../../styles/UseStyles";
import {get_url_components} from "../misc";
import Stack from "@mui/material/Stack";
import clsx from "clsx";
import {ResourceChip} from "../ResourceChip";
import Typography from "@mui/material/Typography";

export default function ChipList({chips, max}: { chips: string[], max?: number }) {
    const max_items = max ?? 5

    const extra = chips.length - max_items

    const {classes} = useStyles();
    const components = chips.map(p => get_url_components(p))
        .filter((c, i) => i < max_items)
        .map((c) =>
            c?.resource_id && c?.lookup_key &&
            <ResourceChip key={c.resource_id} resource_id={c.resource_id} lookup_key={c.lookup_key}/>)

    return <Stack direction="row" className={clsx(classes.chipList)}>
        {components.length > 0? components : <em>None</em>}
        {extra > 0 && <Typography>... and {extra} more</Typography>}
    </Stack>
}
import useStyles from '../../../styles/UseStyles'
import { get_url_components } from '../../misc'
import Stack from '@mui/material/Stack'
import clsx from 'clsx'
import { ResourceChip } from '../../ResourceChip'
import Typography from '@mui/material/Typography'

export default function ChipList({
    chips,
    max,
}: {
    chips: string[]
    max?: number
}) {
    const max_items = max ?? 5

    const extra = chips.length - max_items

    const { classes } = useStyles()
    const components = chips
        .map((p) => get_url_components(p))
        .filter((c, i) => i < max_items)
        .map(
            (c) =>
                c?.resourceId &&
                c?.lookupKey && (
                    <ResourceChip
                        key={c.resourceId}
                        resourceId={c.resourceId}
                        lookupKey={c.lookupKey}
                    />
                ),
        )

    return (
        <Stack direction="row" className={clsx(classes.chipList)}>
            {components.length > 0 ? components : <em>None</em>}
            {extra > 0 && <Typography>... and {extra} more</Typography>}
        </Stack>
    )
}

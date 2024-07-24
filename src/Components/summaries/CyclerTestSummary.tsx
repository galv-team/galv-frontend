import { CyclerTest } from '@galv/galv'
import useStyles from '../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import ChipList from './ChipList'
import { get_url_components } from '../misc'
import { ResourceChip } from '../ResourceChip'
import { GalvResource } from '../../constants'

export default function CyclerTestSummary({
    resource,
}: {
    resource: GalvResource
}) {
    const { classes } = useStyles()
    const r = resource as unknown as CyclerTest

    const c = r.cell ? get_url_components(r.cell) : undefined
    const s = r.schedule ? get_url_components(r.schedule) : undefined

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            {c && (
                <ResourceChip
                    resource_id={c.resource_id}
                    lookup_key={c.lookup_key}
                />
            )}
            {s && (
                <ResourceChip
                    resource_id={s.resource_id}
                    lookup_key={s.lookup_key}
                />
            )}
            <Stack direction="row">
                Equipment: <ChipList chips={r.equipment as string[]} />
            </Stack>
            <Stack direction="row">
                Files: <ChipList chips={r.files as string[]} />
            </Stack>
        </Stack>
    )
}

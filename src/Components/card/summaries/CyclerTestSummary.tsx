import { CyclerTest } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import ChipList from './ChipList'
import { get_url_components } from '../../misc'
import ResourceChip from '../../ResourceChip'
import { GalvResource } from '../../../constants'

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
                    resourceId={c.resourceId}
                    lookupKey={c.lookupKey}
                />
            )}
            {s && (
                <ResourceChip
                    resourceId={s.resourceId}
                    lookupKey={s.lookupKey}
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

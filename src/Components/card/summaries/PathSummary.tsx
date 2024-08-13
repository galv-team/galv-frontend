import { MonitoredPath } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import ChipList from './ChipList'
import Alert from '@mui/material/Alert'
import { get_url_components } from '../../misc'
import ResourceChip from '../../ResourceChip'
import { GalvResource } from '../../../constants'

export default function PathSummary({ resource }: { resource: GalvResource }) {
    const { classes } = useStyles()
    const r = resource as unknown as MonitoredPath

    const h = r.harvester ? get_url_components(r.harvester) : undefined

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            {r.active ? (
                h && (
                    <ResourceChip
                        resourceId={h.resourceId}
                        lookupKey={h.lookupKey}
                    />
                )
            ) : (
                <Alert severity="info">This path is currently inactive</Alert>
            )}
            <Stack direction="row">
                Files:
                <ChipList
                    chips={r.files.map(
                        (s) => `${import.meta.env.VITE_GALV_API_BASE_URL}${s}`,
                    )}
                />
            </Stack>
        </Stack>
    )
}

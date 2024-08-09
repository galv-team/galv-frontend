import { AdditionalS3StorageType } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { humanize_bytes } from '../../misc'
import { ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import { GalvResource } from '../../../constants'

export default function AdditionalStorageSummary({
    resource,
}: {
    resource: GalvResource
}) {
    const { classes } = useStyles()
    const r = resource as unknown as AdditionalS3StorageType

    let usage: ReactNode
    const usage_text = `Used ${humanize_bytes(r.bytes_used)} of ${humanize_bytes(r.quota_bytes)}`
    if (r.bytes_used > r.quota_bytes) {
        usage = <Alert severity="error">{usage_text}</Alert>
    } else if (r.bytes_used > r.quota_bytes * 0.9) {
        usage = <Alert severity="warning">{usage_text}</Alert>
    } else {
        usage = <Typography>{usage_text}</Typography>
    }

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            {!r.enabled && (
                <Alert severity="warning">This storage is disabled</Alert>
            )}
            {usage}
        </Stack>
    )
}

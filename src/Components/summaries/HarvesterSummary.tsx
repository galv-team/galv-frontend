import { Harvester } from '@galv/galv'
import useStyles from '../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { GalvResource } from '../../constants'

dayjs.extend(relativeTime)

export default function HarvesterSummary({
    resource,
}: {
    resource: GalvResource
}) {
    const { classes } = useStyles()
    const r = resource as unknown as Harvester

    const one_day = 1000 * 60 * 60 * 24
    const last_check_in = r.last_check_in
        ? new Date(r.last_check_in)
        : undefined

    const last_check_text = (
        <Typography>
            Last report: <kbd>{r.last_check_in_job}</kbd>{' '}
            {dayjs(r.last_check_in).fromNow()}
        </Typography>
    )

    const checked_in =
        r.last_check_in_job !== null && r.last_check_in !== null

    if (r.last_check_in_job === null || r.last_check_in === null) {
        return
    }

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            {!checked_in ? (
                <Alert severity="info">
                    This harvester hasn't checked in to the server yet.
                </Alert>
            ) : new Date().getTime() - (last_check_in?.getTime() ?? 0) >
              one_day ? (
                <Alert severity="warning">{last_check_text}</Alert>
            ) : (
                last_check_text
            )}
        </Stack>
    )
}

import { DataUnit } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { GalvResource } from '../../../constants'

export default function UnitSummary({ resource }: { resource: GalvResource }) {
    const { classes } = useStyles()
    const r = resource as unknown as DataUnit

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            <Typography variant="body2">{r.description}</Typography>
        </Stack>
    )
}

import { ArbitraryFile } from '@galv/galv'
import useStyles from '../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import Prettify from '../prettify/Prettify'
import Typography from '@mui/material/Typography'

import { GalvResource } from '../../constants'

export default function ArbitraryFileSummary({
    resource,
}: {
    resource: GalvResource
}) {
    const { classes } = useStyles()
    const r = resource as unknown as ArbitraryFile
    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            <Typography variant="body2">{r.description}</Typography>
            <Prettify target={{ _type: 'attachment', _value: r.file }} />
        </Stack>
    )
}

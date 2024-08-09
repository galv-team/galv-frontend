import { Team } from '@galv/galv'
import useStyles from '../../../styles/UseStyles'
import clsx from 'clsx'
import Stack from '@mui/material/Stack'
import ChipList from './ChipList'

import { GalvResource } from '../../../constants'

export default function TeamSummary({ resource }: { resource: GalvResource }) {
    const { classes } = useStyles()
    const r = resource as unknown as Team

    return (
        <Stack className={clsx(classes.resourceSummary)} spacing={1}>
            <Stack direction="row">
                Admins:{' '}
                <ChipList chips={r.admin_group as unknown as string[]} />
            </Stack>
            <Stack direction="row">
                Members:{' '}
                <ChipList chips={r.member_group as unknown as string[]} />
            </Stack>
        </Stack>
    )
}

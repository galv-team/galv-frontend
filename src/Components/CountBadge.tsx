import { Link } from 'react-router-dom'
import Badge, { BadgeProps } from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import clsx from 'clsx'
import UseStyles from '../styles/UseStyles'
import { ReactNode } from 'react'
import SafeTooltip from './SafeTooltip'

export type CountBadgeProps = {
    icon: ReactNode
    url?: string
    tooltip?: ReactNode
} & BadgeProps

export default function CountBadge({
    icon,
    url,
    tooltip,
    ...props
}: CountBadgeProps) {
    const { classes } = UseStyles()
    let content = (
        <Badge
            overlap="circular"
            className={clsx(classes.countBadge)}
            {...(props as BadgeProps)}
        >
            <IconButton disabled={!url || props.badgeContent === 0}>
                {icon}
            </IconButton>
        </Badge>
    )
    if (tooltip) {
        content = (
            <SafeTooltip title={tooltip} describeChild={true}>
                {content}
            </SafeTooltip>
        )
    }
    return url && props.badgeContent !== 0 ? (
        <Link to={url}>{content}</Link>
    ) : (
        content
    )
}

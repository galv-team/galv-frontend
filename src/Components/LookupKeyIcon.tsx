import {
    DISPLAY_NAMES,
    DISPLAY_NAMES_PLURAL,
    ICONS,
    LookupKey,
} from '../constants'
import { SvgIconProps } from '@mui/material/SvgIcon'
import SafeTooltip, { SafeTooltipProps } from './SafeTooltip'

export type LookupKeyIconProps = {
    lookupKey: LookupKey
    tooltip?: boolean
    tooltipProps?: Partial<SafeTooltipProps>
    plural?: boolean
} & Partial<SvgIconProps>

export default function LookupKeyIcon({
    lookupKey,
    tooltip,
    tooltipProps,
    plural,
    ...iconProps
}: LookupKeyIconProps) {
    const ICON = ICONS[lookupKey]
    const title = plural
        ? DISPLAY_NAMES_PLURAL[lookupKey]
        : DISPLAY_NAMES[lookupKey]
    return tooltip ? (
        <SafeTooltip title={title} describeChild={true} {...tooltipProps}>
            <ICON {...iconProps} />
        </SafeTooltip>
    ) : (
        <ICON {...iconProps} />
    )
}

import Tooltip, {TooltipProps} from "@mui/material/Tooltip";
import {DISPLAY_NAMES, ICONS, LookupKey} from "../constants";
import {SvgIconProps} from "@mui/material/SvgIcon";

export type LookupKeyIconProps = {
    lookupKey: LookupKey,
    tooltip?: boolean,
    tooltipProps?: Partial<TooltipProps>
} & Partial<SvgIconProps>

export default function LookupKeyIcon (
    {lookupKey, tooltip, tooltipProps, ...iconProps}: LookupKeyIconProps
){
    const ICON = ICONS[lookupKey]
    return tooltip !== false?
        <Tooltip
            title={DISPLAY_NAMES[lookupKey]}
            describeChild={true}
            {...tooltipProps}
        >
            <ICON {...iconProps}/>
        </Tooltip> :
        <ICON {...iconProps}/>
}
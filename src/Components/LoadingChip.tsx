import Chip, {ChipProps} from "@mui/material/Chip";
import useStyles from "../styles/UseStyles";
import clsx from "clsx";
import CircularProgress from "@mui/material/CircularProgress";
import {Link} from "react-router-dom";
import {ReactNode} from "react";

export type LoadingChipProps = {
    url?: string,
    icon: ReactNode
} & ChipProps

export default function LoadingChip({url, icon, ...chipProps}: LoadingChipProps) {
    const { classes } = useStyles();
    return url? <Chip
        key={url}
        className={clsx(classes.itemChip)}
        variant="outlined"
        label={<CircularProgress size="1.5em" sx={{color: (t) => t.palette.text.disabled}}/>}
        component={Link}
        icon={icon}
        to={url}
        clickable={true}
        {...chipProps as ChipProps}
    /> : <Chip
        className={clsx(classes.itemChip)}
        disabled={true}
        variant="outlined"
        label={<CircularProgress size="1.5em" sx={{color: (t) => t.palette.text.disabled}}/>}
        icon={icon}
        {...chipProps as ChipProps}
    />
}

import Button from "@mui/material/Button";
import { ICONS } from "../../constants";
import {styled} from "@mui/system";
import {TypeValueNotation} from "../TypeValueNotation";
import Typography from "@mui/material/Typography";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function PrettyAttachment(target: TypeValueNotation & {_value: string | null}) {
    if (target._value)
        return <Typography variant="body2">{target._value}</Typography>
    return (
        <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<ICONS.ARBITRARY_FILE />}
        >
            Attach file
            <VisuallyHiddenInput type="file" onChange={console.log} />
        </Button>
    );
}

import Button from "@mui/material/Button";
import {ICONS, LOOKUP_KEYS} from "../../constants";
import {styled} from "@mui/system";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import {useAttachmentUpload} from "../AttachmentUploadContext";
import {PrettyComponentProps} from "./Prettify";
import {PrettyResourceSelect} from "./PrettyResource";
import AuthFile from "../AuthFile";

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

export default function PrettyAttachment(
    {target, onChange, edit_mode, creating}: PrettyComponentProps<string|null> & {creating?: boolean}
) {
    const {file, setFile} = useAttachmentUpload()

    if (creating && edit_mode) {
        if (file)
            return <>
                <Chip label={file.name} onDelete={() => setFile(null)} />
            </>
        return <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<ICONS.ARBITRARY_FILE />}
        >
            Attach file
            <VisuallyHiddenInput
                type="file"
                onChange={(e) => {
                    setFile(e.target.files?.item(0) ?? null)
                    // Fire the onChange event with a null value to indicate that the user has selected a file
                    onChange && onChange({_type: "string", _value: null})
                }}
                multiple={false}
            />
        </Button>
    }

    if (edit_mode)
        return <PrettyResourceSelect
            lookup_key={LOOKUP_KEYS.ARBITRARY_FILE}
            target={target}
            onChange={onChange}
            edit_mode={edit_mode}
        />

    if (target?._value)
        return <AuthFile url={target._value as string}/>

    return <Typography variant="body2" color="text.secondary">No file attached</Typography>
}

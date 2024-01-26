import {AutocompleteKey} from "../../constants";
import TextField from "@mui/material/TextField";
import {PrettyComponentProps, PrettyString} from "./Prettify";
import Autocomplete, {AutocompleteProps} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import {TypographyProps} from "@mui/material/Typography";
import {BaseResource} from "../ResourceCard";
import {useResourceList} from "../ResourceListContext";

export type AutcompleteEntry = BaseResource & {
    value: string
}

export default function PrettyAutocomplete(
    {value, onChange, edit_mode, autocomplete_key, ...childProps}:
        {autocomplete_key: AutocompleteKey} &
        PrettyComponentProps &
        Omit<Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>|TypographyProps>, "onChange">
) {

    const { useListQuery } = useResourceList();
    const query = useListQuery<AutcompleteEntry>(autocomplete_key)

    if (!edit_mode)
        return <PrettyString
            value={value}
            onChange={onChange}
            {...childProps as Partial<TypographyProps>}
            edit_mode={false}
        />

    return <Autocomplete
        value={value}
        freeSolo
        options={query.results? query.results.map(r => r.value) : []}
        onChange={(e, value) => onChange(value)}
        renderInput={(params) => (
            <TextField
                {...params}
                label="value"
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {query?.isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                        </>
                    ),
                }}
            />
        )}
        fullWidth={true}
        {...childProps as Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>>}
    />
}
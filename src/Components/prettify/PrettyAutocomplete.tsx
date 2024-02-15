import {AutocompleteKey} from "../../constants";
import TextField from "@mui/material/TextField";
import {PrettyComponentProps, PrettyString} from "./Prettify";
import Autocomplete, {AutocompleteProps} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import {TypographyProps} from "@mui/material/Typography";
import {BaseResource} from "../ResourceCard";
import {useFetchResource} from "../FetchResourceContext";

export type AutcompleteEntry = BaseResource & {
    value: string
}

export default function PrettyAutocomplete(
    {value, onChange, edit_mode, autocomplete_key, ...childProps}:
        {autocomplete_key: AutocompleteKey} &
        PrettyComponentProps<string> &
        Omit<Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>|TypographyProps>, "onChange">
) {

    const { useListQuery } = useFetchResource();
    const query = useListQuery<AutcompleteEntry>(autocomplete_key)

    if (!edit_mode)
        return <PrettyString
            value={value}
            onChange={onChange}
            {...childProps as Partial<Omit<TypographyProps, "onChange">>}
            edit_mode={false}
        />

    return <Autocomplete
        value={value}
        freeSolo
        options={query.results? query.results.map(r => r.value) : []}
        onChange={(e, value) => value instanceof Array? value.map(onChange) : onChange(value)}
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
        {...childProps as Partial<Omit<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>, "onChange">>}
    />
}
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
    {target, onChange, edit_mode, autocomplete_key, ...childProps}:
        {autocomplete_key: AutocompleteKey} &
        PrettyComponentProps<string|null> &
        Omit<Partial<AutocompleteProps<string, boolean|undefined, true, boolean|undefined>|TypographyProps>, "onChange">
) {

    const { useListQuery } = useFetchResource();
    const query = useListQuery<AutcompleteEntry>(autocomplete_key)

    if (!edit_mode)
        return <PrettyString
            target={target}
            onChange={onChange}
            {...childProps as Partial<Omit<TypographyProps, "onChange">>}
            edit_mode={false}
        />

    return <Autocomplete
        value={target._value ?? ""}
        freeSolo
        options={query.results? query.results.map(r => r.value) : []}
        onChange={(e, value) =>
            value instanceof Array?
                value.map(v => onChange({_type: target._type, _value: v})) :
                onChange({_type: target._type, _value: value})
        }
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
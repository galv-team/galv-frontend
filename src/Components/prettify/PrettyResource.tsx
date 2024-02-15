import {DISPLAY_NAMES, FAMILY_LOOKUP_KEYS, LookupKey} from "../../constants";
import {ChipProps} from "@mui/material/Chip";
import React, {useEffect, useState} from "react";
import useStyles from "../../styles/UseStyles";
import {build_placeholder_url, get_url_components, id_from_ref_props} from "../misc";
import TextField from "@mui/material/TextField";
import clsx from "clsx";
import ButtonBase from "@mui/material/ButtonBase";
import ResourceChip from "../ResourceChip";
import {PrettyComponentProps, PrettyString} from "./Prettify";
import Autocomplete, {createFilterOptions} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import {representation} from "../Representation";
import {useFetchResource} from "../FetchResourceContext";
import {BaseResource} from "../ResourceCard";

export type PrettyResourceSelectProps = {
    lookup_key: LookupKey
} & PrettyComponentProps<string> & Partial<Omit<ChipProps, "onChange">>

export const PrettyResourceSelect = <T extends BaseResource>(
    {value, onChange, lookup_key}: PrettyResourceSelectProps
) => {
    const { useListQuery } = useFetchResource();

    const query = useListQuery<T>(lookup_key)

    const family_lookup_key = Object.keys(FAMILY_LOOKUP_KEYS).includes(lookup_key)?
        FAMILY_LOOKUP_KEYS[lookup_key as keyof typeof FAMILY_LOOKUP_KEYS] : undefined
    const family_query = useListQuery<BaseResource>(family_lookup_key)

    const [url, setUrl] = useState<string>("")
    const [open, setOpen] = React.useState(false);
    const loading = open && query?.isLoading;

    useEffect(() => setUrl(value), [value])

    const url_to_query_result = (url: string) => query.results?.find(o => o.url === url)
    const represent = (url: string) => {
        const object = url_to_query_result(url)
        if (!object) return url
        return representation({data: object, lookup_key})
    }
    const url_to_value = (url: string) => represent(url)
    const value_to_url = (value: string) => {
        // console.log(`value_to_url`, {value, url, repr_value: represent(value), repr_url: represent(url)})
        const object = query.results?.find(o => represent(o.url) === value)
        return object?.url || value
    }

    const {classes} = useStyles()

    return <Autocomplete
        className={clsx(classes.prettySelect)}
        freeSolo={true}
        filterOptions={createFilterOptions({stringify: represent})}
        open={open}
        onOpen={() => setOpen(true)}
        onChange={(e, v) => {
            // console.log(`onChange`, {e, v, value, url})
            if (value_to_url(v || "") !== url) {
                const new_url = value_to_url(v || "")
                if (get_url_components(new_url))
                    onChange(new_url)
                else
                    onChange(build_placeholder_url(lookup_key, new_url||'new'))
            }
            setOpen(false)
        }}
        onClose={() => setOpen(false)}
        value={url_to_value(url)}
        options={query.results?.map(r => url_to_value(r.url)) || []}
        loading={loading}
        getOptionLabel={(option: string) => option}
        groupBy={family_lookup_key?
            (option) => {
                const o = url_to_query_result(value_to_url(option) ?? "")
                return o? o.family ?? "" : ""
            } : () => ""
        }
        renderInput={(params) => <TextField
            {...params}
            label={`Select ${DISPLAY_NAMES[lookup_key]}`}
            InputProps={{
                ...params.InputProps,
                endAdornment: (
                    <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20}/> : null}
                        {params.InputProps.endAdornment}
                    </React.Fragment>
                ),
            }}
        />
        }
        renderGroup={(params) => <li key={params.key}>
            <div>{
                family_query.results?
                    <ResourceChip
                        resource_id={id_from_ref_props<string>(family_query.results.find(f => f.url === params.group) ?? "")}
                        lookup_key={FAMILY_LOOKUP_KEYS[lookup_key as keyof typeof FAMILY_LOOKUP_KEYS]}
                        component={ButtonBase}
                        clickable={false}
                        disabled={true}
                    /> :
                    params.group
            }</div>
            <ul>{params.children}</ul>
        </li>
        }
    />
}

export type PrettyResourceProps = {
    lookup_key?: LookupKey
    resource_id?: string|number
} & PrettyComponentProps<string> & Partial<Omit<ChipProps, "onChange">>

export default function PrettyResource(
    {value, onChange, edit_mode, lookup_key, resource_id, ...childProps}: PrettyResourceProps
) {
    const url_components = get_url_components(value)
    lookup_key = lookup_key ?? url_components?.lookup_key
    resource_id = resource_id ?? url_components?.resource_id

    const str_representation = <PrettyString value={value} onChange={onChange} {...childProps} edit_mode={false}/>

    if (edit_mode) {
        if (!lookup_key)
            throw new Error(`PrettyResource: lookup_key is undefined and unobtainable from value ${value}`)
        return <PrettyResourceSelect
            {...childProps as ChipProps}
            lookup_key={lookup_key}
            onChange={onChange}
            value={value}
            edit_mode={edit_mode}
        />
    }
    if (lookup_key && resource_id)
        return <ResourceChip
            {...childProps as ChipProps}
            lookup_key={lookup_key}
            resource_id={resource_id}
            error={str_representation}
        />
    return str_representation
}
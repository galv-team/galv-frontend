import {
    DISPLAY_NAMES,
    FAMILY_LOOKUP_KEYS,
    FIELDS,
    GalvResource,
    LOOKUP_KEYS,
    LookupKey,
} from '../../constants'
import { ChipProps } from '@mui/material/Chip'
import React, { useEffect, useState } from 'react'
import useStyles from '../../styles/UseStyles'
import { get_url_components, id_from_ref_props } from '../misc'
import TextField from '@mui/material/TextField'
import clsx from 'clsx'
import ButtonBase from '@mui/material/ButtonBase'
import ResourceChip from '../ResourceChip'
import { PrettyComponentProps, PrettyString } from './Prettify'
import Autocomplete, {
    AutocompleteProps,
    createFilterOptions,
} from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import { representation } from '../Representation'
import { useFetchResource } from '../FetchResourceContext'
import { get_modal_title, ResourceCreator } from '../ResourceCreator'
import Modal from '@mui/material/Modal'
import UndoRedoProvider from '../UndoRedoContext'

export type PrettyResourceSelectProps = {
    lookup_key: LookupKey
    allow_new?: boolean // defaults to true if the lookup_key has a 'team' field
} & PrettyComponentProps<string | null> &
    Partial<Omit<ChipProps, 'onChange'>>

export const PrettyResourceSelect = <T extends GalvResource>({
    target,
    onChange,
    allow_new,
    lookup_key,
    edit_mode,
    ...autocompleteProps
}: PrettyResourceSelectProps &
    Partial<
        Omit<AutocompleteProps<string, false, false, true>, 'onChange'>
    >) => {
    const { useListQuery } = useFetchResource()
    const [modalOpen, setModalOpen] = useState(false)

    if (allow_new === undefined)
        allow_new = Object.keys(FIELDS[lookup_key]).includes('team')

    const query = useListQuery<T>(lookup_key)

    if (query?.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()

    const family_lookup_key = Object.keys(FAMILY_LOOKUP_KEYS).includes(
        lookup_key,
    )
        ? FAMILY_LOOKUP_KEYS[lookup_key as keyof typeof FAMILY_LOOKUP_KEYS]
        : undefined
    const family_query = useListQuery<GalvResource>(family_lookup_key)

    if (family_query?.hasNextPage && !family_query.isFetchingNextPage)
        family_query.fetchNextPage()

    const [url, setUrl] = useState<string>('')
    const [open, setOpen] = React.useState(false)
    const loading = open && query.isLoading && query.isFetching

    useEffect(() => setUrl(target._value ?? ''), [target])

    const url_to_query_result = (url: string) =>
        query.results?.find((o) => o.url === url)
    const represent = (url: string) => {
        const object = url_to_query_result(url)
        if (!object) return url
        return representation({ data: object, lookup_key })
    }
    const url_to_value = (url: string) => represent(url)
    const value_to_url = (value: string) => {
        // console.log(`value_to_url`, {value, url, repr_value: represent(value), repr_url: represent(url)})
        const object = query.results?.find((o) => represent(o.url) === value)
        return object?.url || value
    }

    const { classes } = useStyles()

    const new_item = `Create a new ${DISPLAY_NAMES[lookup_key]}`

    const options = [
        ...(allow_new ? [new_item] : []),
        ...(query.results?.map((r) => url_to_value(r.url)) || []),
    ]

    return (
        <>
            {allow_new && (
                <Modal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    aria-labelledby={get_modal_title(lookup_key, 'title')}
                    sx={{ padding: (t) => t.spacing(4) }}
                >
                    <>
                        <UndoRedoProvider>
                            <ResourceCreator<T>
                                onCreate={(new_resource_url) => {
                                    setModalOpen(false)
                                    onChange({
                                        _type: target._type,
                                        _value: new_resource_url ?? '',
                                    })
                                }}
                                onDiscard={() => setModalOpen(false)}
                                lookup_key={lookup_key}
                            />
                        </UndoRedoProvider>
                    </>
                </Modal>
            )}
            <Autocomplete
                className={clsx(classes.prettySelect)}
                disabled={!edit_mode}
                freeSolo={true}
                filterOptions={createFilterOptions({ stringify: represent })}
                open={open}
                onOpen={() => setOpen(true)}
                onChange={(e, v) => {
                    // console.log(`onChange`, {e, v, value, url})
                    if (v === new_item) {
                        return setModalOpen(true)
                    }
                    onChange({
                        _type: target._type,
                        _value: value_to_url(v ?? ''),
                    })
                    setOpen(false)
                }}
                onClose={() => setOpen(false)}
                options={options}
                value={url_to_value(url)}
                loading={query.isInitialLoading}
                getOptionLabel={(option: string) => option}
                groupBy={
                    family_lookup_key
                        ? (option) => {
                              if (option === new_item) return ''
                              const o = url_to_query_result(
                                  value_to_url(option) ?? '',
                              )
                              return o ? (o.family ?? '') : ''
                          }
                        : () => ''
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={`Select ${DISPLAY_NAMES[lookup_key]}`}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <React.Fragment>
                                    {loading ? (
                                        <CircularProgress
                                            color="inherit"
                                            size={20}
                                        />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </React.Fragment>
                            ),
                        }}
                    />
                )}
                renderGroup={(params) => {
                    const family = family_query.results?.find(
                        (f) => f.url === params.group,
                    )
                    return (
                        <li key={params.key}>
                            <div>
                                {family ? (
                                    <ResourceChip
                                        resource_id={id_from_ref_props<string>(
                                            family,
                                        )}
                                        lookup_key={
                                            FAMILY_LOOKUP_KEYS[
                                                lookup_key as keyof typeof FAMILY_LOOKUP_KEYS
                                            ]
                                        }
                                        component={ButtonBase}
                                        clickable={false}
                                        disabled={true}
                                    />
                                ) : (
                                    params.group
                                )}
                            </div>
                            <ul>{params.children}</ul>
                        </li>
                    )
                }}
                {...autocompleteProps}
            />
        </>
    )
}

export type PrettyResourceProps = {
    lookup_key?: LookupKey
    resource_id?: string | number
    allow_new?: boolean // defaults to true if the lookup_key has a 'team' field
} & PrettyComponentProps<string | null> &
    Partial<Omit<ChipProps, 'onChange'>>

export default function PrettyResource({
    target,
    onChange,
    edit_mode,
    lookup_key,
    resource_id,
    allow_new,
    ...childProps
}: PrettyResourceProps) {
    const url_components = get_url_components(target._value ?? '')
    if (lookup_key !== url_components?.lookup_key) {
        // Labs' Galv Storage is exposed under the Additional Storage lookup key because currently we
        // don't support multiple resource types in a single array.
        if (lookup_key === LOOKUP_KEYS.ADDITIONAL_STORAGE)
            lookup_key = url_components?.lookup_key ?? lookup_key
        else lookup_key = lookup_key ?? url_components?.lookup_key
    }
    resource_id = resource_id ?? url_components?.resource_id

    const str_representation = (
        <PrettyString
            target={target}
            onChange={onChange}
            {...childProps}
            edit_mode={false}
        />
    )

    if (edit_mode) {
        if (!lookup_key)
            throw new Error(
                `PrettyResource: lookup_key is undefined and unobtainable from value ${target._value}`,
            )
        return (
            <PrettyResourceSelect
                lookup_key={lookup_key}
                onChange={onChange}
                target={target}
                edit_mode={edit_mode}
                allow_new={allow_new}
            />
        )
    }
    if (lookup_key && resource_id)
        return (
            <ResourceChip
                {...(childProps as ChipProps)}
                lookup_key={lookup_key}
                resource_id={resource_id}
                error={str_representation}
            />
        )
    return str_representation
}

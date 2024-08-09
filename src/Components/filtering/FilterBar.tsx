import React, { Fragment, useContext, useState } from 'react'
import Stack from '@mui/material/Stack'
import Chip, { ChipProps } from '@mui/material/Chip'
import {
    FF_VS,
    Filter,
    FILTER_FUNCTIONS,
    FILTER_MODES,
    FilterContext,
    FilterFamily,
    FilterMode,
} from './FilterContext'
import {
    DISPLAY_NAMES_PLURAL,
    Field,
    FIELDS,
    ICONS,
    is_autocomplete_key,
    is_lookupKey,
    LOOKUP_KEYS,
    LookupKey,
} from '../../constants'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import clsx from 'clsx'
import useStyles from '../../styles/UseStyles'
import ButtonGroup from '@mui/material/ButtonGroup'
import Button from '@mui/material/Button'
import LookupKeyIcon from '../LookupKeyIcon'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import SafeTooltip from '../SafeTooltip'

type FilterChipProps = {
    filter: Filter<unknown>
}

function FilterChip({ filter, ...chipProps }: FilterChipProps & ChipProps) {
    return (
        <SafeTooltip
            title={filter.family.get_description(
                filter.key,
                filter.test_versus,
                false,
            )}
        >
            <Chip
                label={filter.family.get_description(
                    filter.key,
                    filter.test_versus,
                    true,
                )}
                {...chipProps}
            />
        </SafeTooltip>
    )
}

type FilterCreateFormProps = {
    onCreate: (lookupKey: LookupKey, filter: Filter<unknown>) => void
    onCancel?: () => void
}

const isFilterableField = (field: Field) =>
    ['string', 'number'].includes(field.type)

function FilterCreateForm({ onCreate, onCancel }: FilterCreateFormProps) {
    const { classes } = useStyles()
    const [value, setValue] = useState<FF_VS<typeof family>>('')
    const [key, setKey] = useState<string>('')
    const [lookupKey, setLookupKey] = useState<LookupKey>(
        Object.keys(LOOKUP_KEYS)[0] as LookupKey,
    )
    const [family, setFamily] = useState<
        (typeof FILTER_FUNCTIONS)[number] | ''
    >('')

    const reset = () => {
        setValue('')
        setKey('')
        setFamily('')
        setLookupKey(Object.keys(LOOKUP_KEYS)[0] as LookupKey)
    }

    const is_family_appropriate = (
        family: (typeof FILTER_FUNCTIONS)[number],
        key: string,
    ): boolean => {
        const field = FIELDS[lookupKey]
        const k = key as keyof typeof field
        if (!field || !field[k]) return true
        const field_info = field[k] as Field
        const type = is_autocomplete_key(field_info.type)
            ? 'string'
            : field_info.type

        return family.applies_to.includes(
            type as unknown as 'string' | 'number' | 'boolean' | 'array',
        )
    }

    return (
        <Stack spacing={0.5} className={clsx(classes.filterCreate)}>
            <Stack direction="row" spacing={0.5}>
                <Select
                    value={lookupKey}
                    onChange={(e) =>
                        is_lookupKey(e.target.value) &&
                        setLookupKey(e.target.value)
                    }
                    autoWidth
                    label="Filter"
                    size="small"
                >
                    <MenuItem key="none" value="" disabled />
                    {Object.keys(LOOKUP_KEYS).map((lookupKey) => {
                        const _key = lookupKey as LookupKey
                        return (
                            <MenuItem value={_key} key={_key}>
                                <LookupKeyIcon
                                    lookupKey={_key}
                                    tooltipProps={{ placement: 'left' }}
                                />
                            </MenuItem>
                        )
                    })}
                </Select>
                <Autocomplete
                    key="key"
                    freeSolo
                    options={Object.entries(FIELDS[lookupKey])
                        .map(
                            ([k, v]) =>
                                [
                                    k,
                                    {
                                        ...v,
                                        type: is_autocomplete_key(v.type)
                                            ? 'string'
                                            : v.type,
                                    },
                                ] as [string, Field],
                        )
                        .filter((e) => isFilterableField(e[1]))
                        .map((e) => e[0])}
                    renderInput={(params) => (
                        <TextField {...params} label="X" />
                    )}
                    onChange={(_, v) => setKey(v || '')}
                    size="small"
                    sx={{ minWidth: (t) => t.spacing(20) }}
                />
                <Select
                    key="family"
                    value={
                        family === ''
                            ? ''
                            : FILTER_FUNCTIONS.findIndex((f) => f === family)
                    }
                    onChange={(e) => {
                        try {
                            setFamily(FILTER_FUNCTIONS[Number(e.target.value)])
                        } catch {
                            setFamily('')
                        }
                    }}
                    autoWidth
                    label="Using"
                    size="small"
                    sx={{ minWidth: (t) => t.spacing(20) }}
                >
                    <MenuItem key="none" value="" disabled />
                    {FILTER_FUNCTIONS.map((family, i) => (
                        <MenuItem
                            key={i}
                            value={i}
                            disabled={!is_family_appropriate(family, key)}
                        >
                            {family.name}
                        </MenuItem>
                    ))}
                </Select>
                <TextField
                    size="small"
                    key="value"
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value || '')}
                    label="Y"
                />
                <ButtonGroup>
                    <Button
                        key="create"
                        onClick={() => {
                            if (
                                family === '' ||
                                value === '' ||
                                value === null ||
                                key === ''
                            )
                                return
                            onCreate(lookupKey, {
                                key,
                                family: family as FilterFamily<unknown>,
                                test_versus: value,
                            })
                            reset()
                        }}
                        disabled={family === '' || value === '' || key === ''}
                    >
                        Add filter
                    </Button>
                    <Button
                        key="cancel"
                        onClick={() => {
                            onCancel && onCancel()
                            reset()
                        }}
                    >
                        X
                    </Button>
                </ButtonGroup>
            </Stack>
            <Typography key="summary" className={clsx('summary-text')}>
                {family !== '' &&
                    value !== null &&
                    `View ${DISPLAY_NAMES_PLURAL[lookupKey]} where 
                ${family.get_description(key || 'X', (value as string) || 'Y', false)}`}
            </Typography>
        </Stack>
    )
}

export default function FilterBar() {
    const { activeFilters, setActiveFilters, clearActiveFilters } =
        useContext(FilterContext)
    const [creating, setCreating] = useState<boolean>(false)
    const [open, setOpen] = useState<boolean>(false)

    const { classes } = useStyles()

    const filter_count = Object.values(activeFilters)
        .map((f) => f.filters.length)
        .reduce((a, b) => a + b, 0)

    const actions = (
        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
            {creating ? (
                <FilterCreateForm
                    key="create_form"
                    onCreate={(lookupKey, filter) => {
                        console.log(`creating filter`, { lookupKey, filter })
                        setActiveFilters({
                            ...activeFilters,
                            [lookupKey]: {
                                mode:
                                    activeFilters[lookupKey].mode ??
                                    FILTER_MODES.ALL,
                                filters: [
                                    ...activeFilters[lookupKey].filters,
                                    filter,
                                ],
                            },
                        })
                        setCreating(false)
                        setOpen(true)
                    }}
                    onCancel={() => setCreating(false)}
                />
            ) : (
                <Button
                    key="new_filter"
                    className={clsx('new_filter')}
                    endIcon={<ICONS.CREATE fontSize="small" />}
                    onClick={() => setCreating(true)}
                >
                    New filter
                </Button>
            )}
            {filter_count > 0 && (
                <Button
                    key="clear"
                    className={clsx('clear')}
                    endIcon={<ICONS.CANCEL fontSize="small" />}
                    onClick={() => clearActiveFilters()}
                >
                    Clear
                </Button>
            )}
        </Stack>
    )

    return (
        <Card
            key="filter_bar_content"
            className={clsx(classes.filterBar, classes.tool)}
        >
            <CardHeader
                title={
                    filter_count > 0 ? `${filter_count} filters applied` : ''
                }
                subheader={
                    filter_count > 0 ? (open ? 'Hide details' : 'Show all') : ''
                }
                onClick={() => setOpen(!open)}
                action={actions}
                sx={{ cursor: filter_count > 0 ? 'pointer' : 'default' }}
            />
            {open && filter_count > 0 && (
                <CardContent>
                    <Stack
                        spacing={1}
                        key="existing_filters"
                        className={clsx('existing_filters')}
                    >
                        {Object.entries(activeFilters).map(
                            ([lookupKey, content]) => {
                                const _key = lookupKey as LookupKey
                                if (content.filters.length === 0)
                                    return <Fragment key={_key}></Fragment>
                                return (
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        key={_key}
                                        className={clsx('horizontal')}
                                    >
                                        <LookupKeyIcon
                                            key="icon"
                                            lookupKey={_key}
                                            fontSize="small"
                                        />
                                        <ToggleButtonGroup
                                            key="mode"
                                            value={content.mode}
                                            exclusive
                                            onChange={(_, v) =>
                                                setActiveFilters({
                                                    ...activeFilters,
                                                    [_key]: {
                                                        ...content,
                                                        mode: v as FilterMode,
                                                    },
                                                })
                                            }
                                            title="Filter mode"
                                            size="small"
                                        >
                                            <ToggleButton
                                                key={'any'}
                                                value={FILTER_MODES.ANY}
                                            >
                                                {FILTER_MODES.ANY}
                                            </ToggleButton>
                                            <ToggleButton
                                                key={'all'}
                                                value={FILTER_MODES.ALL}
                                            >
                                                {FILTER_MODES.ALL}
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                        {content.filters.map((filter, i) => (
                                            <FilterChip
                                                key={`filter_${_key}-${i}`}
                                                filter={filter}
                                                onDelete={() =>
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        [_key]: {
                                                            ...content,
                                                            filters:
                                                                content.filters.filter(
                                                                    (f) =>
                                                                        f !==
                                                                        filter,
                                                                ),
                                                        },
                                                    })
                                                }
                                            />
                                        ))}
                                    </Stack>
                                )
                            },
                        )}
                    </Stack>
                </CardContent>
            )}
        </Card>
    )
}

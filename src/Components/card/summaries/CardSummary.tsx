import {
    AutocompleteKey,
    CHILD_LOOKUP_KEYS,
    FIELDS,
    GalvResource,
    get_has_family,
    get_is_family,
    is_lookupKey,
    LOOKUP_KEYS,
    LookupKey,
    PRIORITY_LEVELS,
    Serializable,
    type_to_key,
} from '../../../constants'
import React, { ReactNode } from 'react'
import ArbitraryFileSummary from './ArbitraryFileSummary'
import AdditionalStorageSummary from './AdditionalStorageSummary'
import HarvesterSummary from './HarvesterSummary'
import TeamSummary from './TeamSummary'
import LabSummary from './LabSummary'
import UnitSummary from './UnitSummary'
import ColumnSummary from './ColumnSummary'
import PathSummary from './PathSummary'
import FileSummary from './FileSummary'
import CyclerTestSummary from './CyclerTestSummary'
import ExperimentSummary from './ExperimentSummary'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Unstable_Grid2'
import { id_from_ref_props } from '../../misc'
import Prettify from '../../prettify/Prettify'
import { to_type_value_notation } from '../../TypeValueNotation'
import { ObservedFile } from '@galv/galv'
import AuthImage from '../../AuthImage'
import ResourceChip from '../../ResourceChip'
import CardContent from '@mui/material/CardContent'

/**
 * Resources with custom summaries.
 */
const CUSTOM_SUMMARIES: Partial<
    Record<LookupKey, (resource: { resource: GalvResource }) => ReactNode>
> = {
    [LOOKUP_KEYS.ARBITRARY_FILE]: ArbitraryFileSummary,
    [LOOKUP_KEYS.ADDITIONAL_STORAGE]: AdditionalStorageSummary,
    [LOOKUP_KEYS.HARVESTER]: HarvesterSummary,
    [LOOKUP_KEYS.TEAM]: TeamSummary,
    [LOOKUP_KEYS.LAB]: LabSummary,
    [LOOKUP_KEYS.UNIT]: UnitSummary,
    [LOOKUP_KEYS.COLUMN_FAMILY]: ColumnSummary,
    [LOOKUP_KEYS.PATH]: PathSummary,
    [LOOKUP_KEYS.FILE]: FileSummary,
    [LOOKUP_KEYS.CYCLER_TEST]: CyclerTestSummary,
    [LOOKUP_KEYS.EXPERIMENT]: ExperimentSummary,
} as const

/**
 * Present summary information for a resource.
 * If there's a specific summary component, use that.
 * Otherwise, pull out fields with PRIORITY_LEVELS.SUMMARY and display them.
 */
export default function CardSummary<T extends GalvResource>({
    apiResource,
    lookupKey,
}: {
    apiResource?: T
    lookupKey: LookupKey
}) {
    if (apiResource === undefined) return null

    if (Object.keys(CUSTOM_SUMMARIES).includes(lookupKey)) {
        const COMPONENT =
            CUSTOM_SUMMARIES[lookupKey as keyof typeof CUSTOM_SUMMARIES]!
        return <COMPONENT resource={apiResource} />
    }

    const is_family_child = (child_key: LookupKey, family_key: LookupKey) => {
        if (!get_is_family(family_key)) return false
        if (!get_has_family(child_key)) return false
        return CHILD_LOOKUP_KEYS[family_key] === child_key
    }

    const summarise = (
        data: unknown,
        many: boolean,
        key: string,
        lookup?: LookupKey | AutocompleteKey,
    ): ReactNode => {
        if (!data || (data instanceof Array && data.length === 0))
            return <Typography variant="body2">None</Typography>
        if (many) {
            const preview_count = 3
            const items =
                data instanceof Array && data.length > preview_count
                    ? data.slice(0, preview_count)
                    : data
            return (
                <Grid container sx={{ alignItems: 'center' }}>
                    {items instanceof Array ? (
                        items.map((d, i) => (
                            <Grid key={i}>
                                {summarise(d, false, key, lookup)}
                            </Grid>
                        ))
                    ) : (
                        <Grid>{summarise(data, false, key, lookup)}</Grid>
                    )}
                    {data instanceof Array && data.length > preview_count && (
                        <Grid>+ {data.length - preview_count} more</Grid>
                    )}
                </Grid>
            )
        }
        const field = key ? FIELDS[lookupKey] : undefined
        const field_info = field ? field[key as keyof typeof field] : undefined
        return lookup && is_lookupKey(lookup) ? (
            <ResourceChip
                resourceId={id_from_ref_props<string>(data as string | number)}
                lookupKey={lookup}
                short_name={is_family_child(lookup, lookupKey)}
            />
        ) : (
            <Prettify
                target={to_type_value_notation(
                    data as Serializable,
                    field_info,
                )}
            />
        )
    }

    return (
        <CardContent>
            {apiResource && (
                <Grid container spacing={1}>
                    {Object.entries(FIELDS[lookupKey])
                        .filter(
                            (e) => e[1].priority === PRIORITY_LEVELS.SUMMARY,
                        )
                        .map(([k, v]) => (
                            <Grid
                                key={k}
                                container
                                xs={12}
                                sx={{ alignItems: 'center' }}
                            >
                                <Grid xs={2} lg={1}>
                                    <Typography variant="subtitle2">
                                        {k.replace(/_/g, ' ')}
                                    </Typography>
                                </Grid>
                                <Grid xs={10} lg={11}>
                                    {summarise(
                                        apiResource[
                                            k as keyof typeof apiResource
                                        ],
                                        v.many,
                                        k,
                                        type_to_key(v.type),
                                    )}
                                </Grid>
                            </Grid>
                        ))}
                </Grid>
            )}
        </CardContent>
    )
}

import Chip, { ChipProps } from '@mui/material/Chip'
import useStyles from '../styles/UseStyles'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import React, { useContext } from 'react'
import LoadingChip from './LoadingChip'
import QueryWrapper, { QueryWrapperProps } from './QueryWrapper'
import ErrorChip from './error/ErrorChip'
import {
    PATHS,
    FAMILY_LOOKUP_KEYS,
    LookupKey,
    GalvResource,
} from '../constants'
import ErrorBoundary from './ErrorBoundary'
import Representation from './Representation'
import { FilterContext } from './filtering/FilterContext'
import ApiResourceContextProvider, {
    useApiResource,
} from './ApiResourceContext'
import LookupKeyIcon from './LookupKeyIcon'

export type ResourceChipProps = {
    resource_id: string | number
    lookup_key: LookupKey
    short_name?: boolean
} & Partial<QueryWrapperProps> &
    ChipProps & { component?: React.ElementType }

export function ResourceChip<T extends GalvResource>({
    resource_id,
    lookup_key,
    loading,
    error,
    success,
    short_name,
    ...chipProps
}: ResourceChipProps) {
    // console.log(`ResourceChip`, {id, lookup_key, loading, error, success, chipProps})
    const { classes } = useStyles()

    const { passesFilters } = useContext(FilterContext)
    const { apiResource, family, apiQuery } = useApiResource<T>()

    const passes = passesFilters({ apiResource, family }, lookup_key)

    const icon = <LookupKeyIcon lookupKey={lookup_key} />

    const content =
        success || passes ? (
            <Chip
                key={resource_id}
                className={clsx(classes.itemChip, { filter_failed: !passes })}
                icon={icon}
                variant="outlined"
                label={
                    <Representation
                        resource_id={resource_id}
                        lookup_key={lookup_key}
                        prefix={
                            !short_name && family ? (
                                <Representation
                                    resource_id={family.id as string}
                                    lookup_key={
                                        FAMILY_LOOKUP_KEYS[
                                            lookup_key as keyof typeof FAMILY_LOOKUP_KEYS
                                        ]
                                    }
                                    suffix=" "
                                />
                            ) : undefined
                        }
                    />
                }
                clickable={true}
                component={Link}
                to={`${PATHS[lookup_key]}/${resource_id}`}
                {...(chipProps as ChipProps)}
            />
        ) : (
            <Chip
                key={resource_id}
                className={clsx(classes.itemChip, { filter_failed: !passes })}
                icon={icon}
                variant="outlined"
                label={
                    <Representation
                        resource_id={resource_id}
                        lookup_key={lookup_key}
                        prefix={
                            !short_name && family ? (
                                <Representation
                                    resource_id={family.id as string}
                                    lookup_key={
                                        FAMILY_LOOKUP_KEYS[
                                            lookup_key as keyof typeof FAMILY_LOOKUP_KEYS
                                        ]
                                    }
                                    suffix=" "
                                />
                            ) : undefined
                        }
                    />
                }
                clickable={true}
                {...(chipProps as ChipProps)}
            />
        )

    return (
        <QueryWrapper
            queries={apiQuery ? [apiQuery] : []}
            loading={
                loading || (
                    <LoadingChip
                        url={`/${PATHS[lookup_key]}/${resource_id}`}
                        icon={icon}
                        {...chipProps}
                    />
                )
            }
            error={
                error
                    ? error
                    : (queries) => (
                          <ErrorChip
                              status={queries[0].error?.response?.status}
                              target={`${PATHS[lookup_key]}/${resource_id}`}
                              detail={queries[0].error?.response?.data?.toString()}
                              key={resource_id}
                              icon={icon}
                              variant="outlined"
                              {...(chipProps as ChipProps)}
                          />
                      )
            }
            success={content}
        />
    )
}

export default function WrappedResourceChip<T extends GalvResource>(
    props: ResourceChipProps,
) {
    return (
        <ErrorBoundary
            fallback={(error: Error) => (
                <ErrorChip
                    target={`${props.lookup_key} ${props.resource_id}`}
                    detail={error.message}
                    key={props.resource_id}
                    icon={<LookupKeyIcon lookupKey={props.lookup_key} />}
                    variant="outlined"
                />
            )}
        >
            <ApiResourceContextProvider
                lookup_key={props.lookup_key}
                resource_id={props.resource_id}
            >
                <ResourceChip<T> {...props} />
            </ApiResourceContextProvider>
        </ErrorBoundary>
    )
}

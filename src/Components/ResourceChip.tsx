import Chip, { ChipProps } from '@mui/material/Chip'
import useStyles from '../styles/UseStyles'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import React, { useContext } from 'react'
import LoadingChip from './LoadingChip'
import QueryWrapper, { QueryWrapperProps } from './QueryWrapper'
import ErrorChip from './error/ErrorChip'
import { FAMILY_LOOKUP_KEYS, GalvResource, PATHS } from '../constants'
import ErrorBoundary from './ErrorBoundary'
import Representation from './Representation'
import { FilterContext } from './filtering/FilterContext'
import ApiResourceContextProvider, {
    ApiResourceContextProviderProps,
    useApiResource,
} from './ApiResourceContext'
import LookupKeyIcon from './LookupKeyIcon'

export type ResourceChipProps = {
    short_name?: boolean
} & Partial<QueryWrapperProps> &
    ChipProps & { component?: React.ElementType }

export function ResourceChip<T extends GalvResource>({
    loading,
    error,
    success,
    short_name,
    ...chipProps
}: ResourceChipProps) {
    // console.log(`ResourceChip`, {id, lookupKey, loading, error, success, chipProps})
    const { classes } = useStyles()

    const { passesFilters } = useContext(FilterContext)
    const { apiResource, resourceId, lookupKey, family, apiQuery } =
        useApiResource<T>()

    const passes = passesFilters({ apiResource, family }, lookupKey)

    const icon = <LookupKeyIcon lookupKey={lookupKey} />

    const content =
        success || passes ? (
            <Chip
                key={resourceId}
                className={clsx(classes.itemChip, { filter_failed: !passes })}
                icon={icon}
                variant="outlined"
                label={
                    <Representation
                        resourceId={resourceId}
                        lookupKey={lookupKey}
                        prefix={
                            !short_name && family ? (
                                <Representation
                                    resourceId={family.id as string}
                                    lookupKey={
                                        FAMILY_LOOKUP_KEYS[
                                            lookupKey as keyof typeof FAMILY_LOOKUP_KEYS
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
                to={`${PATHS[lookupKey]}/${resourceId}`}
                {...(chipProps as ChipProps)}
            />
        ) : (
            <Chip
                key={resourceId}
                className={clsx(classes.itemChip, { filter_failed: !passes })}
                icon={icon}
                variant="outlined"
                label={
                    <Representation
                        resourceId={resourceId}
                        lookupKey={lookupKey}
                        prefix={
                            !short_name && family ? (
                                <Representation
                                    resourceId={family.id as string}
                                    lookupKey={
                                        FAMILY_LOOKUP_KEYS[
                                            lookupKey as keyof typeof FAMILY_LOOKUP_KEYS
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
                        url={`/${PATHS[lookupKey]}/${resourceId}`}
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
                              target={`${PATHS[lookupKey]}/${resourceId}`}
                              detail={queries[0].error?.response?.data?.toString()}
                              key={resourceId}
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

export default function ResourceChipFromQuery<T extends GalvResource>({
    lookupKey,
    resourceId,
    ...props
}: ResourceChipProps & ApiResourceContextProviderProps) {
    return (
        <ErrorBoundary
            fallback={(error: Error) => (
                <ErrorChip
                    target={`${lookupKey} ${resourceId}`}
                    detail={error.message}
                    key={resourceId}
                    icon={<LookupKeyIcon lookupKey={lookupKey} />}
                    variant="outlined"
                />
            )}
        >
            <ApiResourceContextProvider
                lookupKey={lookupKey}
                resourceId={resourceId}
            >
                <ResourceChip<T> {...props} />
            </ApiResourceContextProvider>
        </ErrorBoundary>
    )
}

import React, {
    createContext,
    PropsWithChildren,
    useEffect,
    useState,
} from 'react'
import { TypeChangerSupportedTypeName } from '../prettify/TypeChanger'
import {
    FAMILY_LOOKUP_KEYS,
    FIELDS,
    get_has_family,
    LookupKey,
    Serializable,
} from '../../constants'
import { useImmer } from 'use-immer'
import { IApiResourceContext } from '../ApiResourceContext'

type FilterFunction<T, VS = T> = (
    value: Serializable,
    test_versus: VS,
) => boolean
export type Filter<T, VS = T> = {
    key: string
    family: FilterFamily<T>
    test_versus: VS
}

export type FilterableKeyType = TypeChangerSupportedTypeName &
    ('boolean' | 'string' | 'number' | 'array')

const value_to_string = (value: Serializable): string => {
    return (
        value instanceof Object && 'value' in value
            ? (value.value as string)
            : String(value)
    ).toLowerCase()
}

export class FilterFamily<T, VS = T> {
    public name: string
    public applies_to: readonly FilterableKeyType[]
    public get_description: (
        key: string,
        test_versus: VS | string,
        short: boolean,
    ) => string
    public fun: FilterFunction<T, VS>

    constructor({
        name,
        applies_to,
        get_description,
        fun,
    }: {
        name: string
        applies_to: readonly FilterableKeyType[]
        get_description: (
            key: string,
            test_versus: VS | string,
            short: boolean,
        ) => string
        fun: FilterFunction<T, VS>
    }) {
        this.name = name
        this.applies_to = applies_to
        this.get_description = get_description
        this.fun = fun
    }
}
export type FilterFromFamily<FF> =
    FF extends FilterFamily<infer T, infer VS> ? Filter<T, VS> : never
export type FF_T<FF> = FF extends FilterFamily<infer T, never> ? T : null
export type FF_VS<FF> = FF extends FilterFamily<never, infer VS> ? VS : null

export const FILTER_FUNCTIONS = [
    new FilterFamily<string | number | boolean>({
        name: 'is',
        applies_to: ['string', 'number', 'boolean'],
        get_description: (key, test_versus, short) =>
            short ? `${key} = ${test_versus}` : `${key} is ${test_versus}`,
        fun: (value, test_versus) => {
            switch (typeof value) {
                case 'string':
                    return (
                        value_to_string(value) === value_to_string(test_versus)
                    )
                case 'number':
                    return value === Number(test_versus)
                case 'boolean':
                    return value === Boolean(test_versus)
            }
            console.error(
                `Cannot compare ${typeof value} to ${typeof test_versus}`,
                value,
                test_versus,
            )
            throw new Error(
                `'is' filter can only be used for strings, numbers, and booleans`,
            )
        },
    }),
    new FilterFamily<(string | boolean | number)[], string | boolean | number>({
        name: 'includes',
        applies_to: ['array'],
        get_description: (key, test_versus, short) =>
            short
                ? `${test_versus} ∈ ${key}`
                : `${key} includes ${test_versus}`,
        fun: (value, test_versus) =>
            value instanceof Array &&
            value.includes(value_to_string(test_versus)),
    }),
    new FilterFamily<string>({
        name: 'starts with',
        applies_to: ['string'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} = ${test_versus}...`
                : `${key} starts with ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value_to_string(value) === 'string' &&
            value_to_string(value).startsWith(value_to_string(test_versus)),
    }),
    new FilterFamily<string>({
        name: 'has substring',
        applies_to: ['string'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} = ...${test_versus}...`
                : `${key} has substring ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value_to_string(value) === 'string' &&
            value_to_string(value).includes(value_to_string(test_versus)),
    }),
    new FilterFamily<string>({
        name: 'ends with',
        applies_to: ['string'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} = ...${test_versus}`
                : `${key} ends with ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value_to_string(value) === 'string' &&
            value_to_string(value).endsWith(value_to_string(test_versus)),
    }),
    new FilterFamily<number>({
        name: 'less than',
        applies_to: ['number'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} < ${test_versus}`
                : `${key} less than ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value === 'number' && value < test_versus,
    }),
    new FilterFamily<number>({
        name: 'greater than',
        applies_to: ['number'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} > ${test_versus}`
                : `${key} greater than ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value === 'number' && value > test_versus,
    }),
    new FilterFamily<number>({
        name: 'less than or equal to',
        applies_to: ['number'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} <= ${test_versus}`
                : `${key} less than or equal to ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value === 'number' && value <= test_versus,
    }),
    new FilterFamily<number>({
        name: 'greater than or equal to',
        applies_to: ['number'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} >= ${test_versus}`
                : `${key} greater than or equal to ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value === 'number' && value >= test_versus,
    }),
    new FilterFamily<number>({
        name: 'not equal to',
        applies_to: ['number'],
        get_description: (key, test_versus, short) =>
            short
                ? `${key} != ${test_versus}`
                : `${key} not equal to ${test_versus}`,
        fun: (value, test_versus) =>
            typeof value === 'number' && value !== test_versus,
    }),
] as const

export type FilterMode = 'ANY' | 'ALL'
export const FILTER_MODES = {
    ANY: 'ANY',
    ALL: 'ALL',
} as const

export type ActiveFilters = {
    [key in LookupKey]: { mode: FilterMode; filters: Filter<unknown>[] }
}

export interface IFilterContext {
    activeFilters: ActiveFilters
    setActiveFilters: (filters: ActiveFilters) => void
    clearActiveFilters: () => void
    passesFilters: (
        data: Pick<IApiResourceContext, 'apiResource' | 'family'>,
        lookupKey: LookupKey,
    ) => boolean
}

export const FilterContext = createContext<IFilterContext>({
    activeFilters: Object.fromEntries(
        Object.keys(FIELDS).map((k) => [
            k as LookupKey,
            { mode: FILTER_MODES.ALL, filters: [] as Filter<unknown>[] },
        ]),
    ) as ActiveFilters,
    setActiveFilters: () => {},
    clearActiveFilters: () => {},
    passesFilters: () => true,
})

export function FilterContextProvider(props: PropsWithChildren) {
    const emptyFilters = Object.fromEntries(
        Object.keys(FIELDS).map((k) => [
            k as LookupKey,
            { mode: FILTER_MODES.ALL, filters: [] as Filter<unknown>[] },
        ]),
    ) as ActiveFilters

    const [activeFilters, setActiveFilters] =
        useImmer<ActiveFilters>(emptyFilters)

    const [passesFilters, setPassesFilters] = useState<
        IFilterContext['passesFilters']
    >(() => () => true)

    useEffect(() => {
        setPassesFilters(
            () =>
                (
                    data: Pick<IApiResourceContext, 'apiResource' | 'family'>,
                    lookupKey: LookupKey,
                ) => {
                    if (data.apiResource === undefined) return true
                    const family_lookupKey = get_has_family(lookupKey)
                        ? FAMILY_LOOKUP_KEYS[lookupKey]
                        : undefined
                    const filter_mode =
                        activeFilters[lookupKey].mode === FILTER_MODES.ANY
                            ? 'some'
                            : 'every'
                    const family_filter_mode =
                        family_lookupKey &&
                        activeFilters[family_lookupKey].mode ===
                            FILTER_MODES.ANY
                            ? 'some'
                            : 'every'
                    // if there are no filters, everything passes
                    return (
                        (activeFilters[lookupKey].filters.length === 0 &&
                            (!family_lookupKey ||
                                activeFilters[family_lookupKey].filters
                                    .length === 0)) ||
                        // the resource has to pass its filters
                        (activeFilters[lookupKey].filters[filter_mode]((f) =>
                            f.family.fun(
                                data.apiResource?.[
                                    f.key as keyof (typeof data)['apiResource']
                                ],
                                f.test_versus,
                            ),
                        ) &&
                            // if the resource has a family, that has to pass its filters, too
                            (!family_lookupKey ||
                                activeFilters[family_lookupKey].filters[
                                    family_filter_mode
                                ]((f) =>
                                    f.family.fun(
                                        data.family?.[
                                            f.key as keyof (typeof data)['family']
                                        ],
                                        f.test_versus,
                                    ),
                                )))
                    )
                },
        )
    }, [activeFilters])

    return (
        <FilterContext.Provider
            value={{
                activeFilters,
                setActiveFilters,
                clearActiveFilters: () => setActiveFilters(emptyFilters),
                passesFilters,
            }}
        >
            {props.children}
        </FilterContext.Provider>
    )
}

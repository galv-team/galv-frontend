import { createContext, ReactNode, useContext } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import {
    API_HANDLERS,
    API_HANDLERS_FP,
    API_SLUGS,
    AutocompleteKey,
    DEFAULT_FETCH_LIMIT,
    DISPLAY_NAMES,
    GalvResource,
    is_lookupKey,
    LOOKUP_KEYS,
    LookupKey,
} from '../constants'
import axios, { AxiosError, AxiosResponse } from 'axios'
import {
    MutationFunction,
    QueryFunction,
    useInfiniteQuery,
    type UseInfiniteQueryResult,
    useMutation,
    UseMutationOptions,
    UseMutationResult,
    useQuery,
    useQueryClient,
    UseQueryOptions,
    UseQueryResult,
} from '@tanstack/react-query'
import { get_select_function } from './ApiResourceContext'
import { useSnackbarMessenger } from './SnackbarMessengerContext'
import { Configuration, ObservedFileCreate, ObservedFile } from '@galv/galv'
import { has } from './misc'

export type Axios = typeof axios

export type PaginatedAPIResponse<T extends GalvResource> = {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export type ListQueryResult<T> = UseInfiniteQueryResult & {
    results: T[] | null | undefined
}

export type FieldDescription = {
    type:
        | 'url'
        | 'number'
        | 'datetime'
        | 'boolean'
        | 'string'
        | 'choice'
        | 'json'
        | string
    many: boolean
    help_text: string
    required: boolean
    read_only: boolean
    write_only: boolean
    create_only: boolean
    allow_null: boolean
    default: string | number | null
    choices: Record<string, string | number> | null
}

export type SerializerDescriptionSerializer = Record<string, FieldDescription>

type RetrieveOptions<T extends GalvResource> = {
    extra_query_options?: Omit<
        UseQueryOptions<AxiosResponse<T>, AxiosError>,
        'queryKey'
    >
    with_result?: (result: AxiosResponse<T>) => AxiosResponse<T>
    on_error?: (error: AxiosError) => AxiosResponse<T> | undefined
}
type UpdateTVariables<T extends GalvResource> = Partial<T>

type UpdateOptions<T extends GalvResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<T>, AxiosError>
    before_cache?: (result: AxiosResponse<T>) => AxiosResponse<T>
    after_cache?: (
        result: AxiosResponse<T>,
        variables: UpdateTVariables<T>,
    ) => void
    on_error?: (
        error: AxiosError,
        variables: UpdateTVariables<T>,
    ) => AxiosResponse<T> | undefined
}
type CreateOptions<T extends GalvResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<T>, AxiosError>
    before_cache?: (result: AxiosResponse<T>) => AxiosResponse<T>
    after_cache?: (
        result: AxiosResponse<T>,
        variables: CreateMutationVariablesType<T>,
    ) => void
    on_error?: (
        error: AxiosError,
        variables: CreateMutationVariablesType<T>,
    ) => AxiosResponse<T> | undefined
}
type DeleteOptions<T extends GalvResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<null>, AxiosError>
    after?: () => void
    on_error?: (error: AxiosError, variables: T) => void
}

export type CreateMutationVariablesType<T> = T extends ObservedFile
    ? ObservedFileCreate
    : Partial<T>

export interface IFetchResourceContext {
    // Returns null when lookupKey is undefined. Otherwise, returns undefined until data are fetched, then T[]
    useListQuery: <T extends GalvResource>(
        lookupKey: LookupKey | AutocompleteKey | undefined,
        requestParams?: { limit?: number },
    ) => ListQueryResult<T>
    useRetrieveQuery: <T extends GalvResource>(
        lookupKey: LookupKey,
        resourceId: string | number,
        options?: RetrieveOptions<T>,
    ) => UseQueryResult<AxiosResponse<T>, AxiosError>
    useDescribeQuery: (
        lookupKey?: LookupKey,
    ) => UseQueryResult<
        AxiosResponse<SerializerDescriptionSerializer>,
        AxiosError
    >
    useUpdateQuery: <T extends GalvResource>(
        lookupKey: LookupKey,
        options?: UpdateOptions<T>,
    ) => UseMutationResult<AxiosResponse<T>, AxiosError, UpdateTVariables<T>>
    useCreateQuery: <T extends GalvResource>(
        lookupKey: LookupKey,
        options?: CreateOptions<T>,
    ) => UseMutationResult<
        AxiosResponse<T>,
        AxiosError,
        CreateMutationVariablesType<T>
    >
    useDeleteQuery: <T extends GalvResource>(
        lookupKey: LookupKey,
        options?: DeleteOptions<T>,
    ) => UseMutationResult<AxiosResponse<null>, AxiosError, T>
}

export const FetchResourceContext = createContext({} as IFetchResourceContext)

export const useFetchResource = () => useContext(FetchResourceContext)

const get_error_detail = (e: AxiosError) =>
    e.response?.data?.detail ??
    Object.entries(e.response?.data ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

export default function FetchResourceContextProvider({
    children,
}: {
    children: ReactNode
}) {
    const useListQuery: IFetchResourceContext['useListQuery'] = <
        T extends GalvResource,
    >(
        lookupKey: LookupKey | AutocompleteKey | undefined,
        requestParams?: { limit?: number },
    ) => {
        const limit = requestParams?.limit ?? DEFAULT_FETCH_LIMIT

        const page_param_to_offset = (param: unknown) => {
            if (typeof param !== 'number' || param < 0) return 0
            return param * limit
        }

        // API handler
        const { api_config } = useCurrentUser()
        const queryClient = useQueryClient()
        let queryFn: QueryFunction<
            AxiosResponse<PaginatedAPIResponse<T>> | null
        > = () => Promise.resolve(null)

        if (lookupKey !== undefined) {
            const api_handler = new API_HANDLERS[lookupKey](api_config)
            const get = api_handler[
                `${API_SLUGS[lookupKey]}List` as keyof typeof api_handler
            ] as (requestParams: {
                limit?: number
                offset?: number
            }) => Promise<AxiosResponse<PaginatedAPIResponse<T>>>
            // Queries
            queryFn = ({ pageParam }) =>
                get
                    .bind(api_handler)({
                        limit,
                        offset: page_param_to_offset(pageParam),
                    })
                    .then((r) => {
                        try {
                            // Update the cache for each resource
                            r.data.results.forEach((resource) => {
                                let data
                                if (is_lookupKey(lookupKey))
                                    data = get_select_function(lookupKey)({
                                        ...r,
                                        data: resource,
                                    })
                                else data = resource
                                queryClient.setQueryData(
                                    [
                                        lookupKey,
                                        resource.id ?? 'no id in List response',
                                    ],
                                    data,
                                )
                            })
                        } catch (e) {
                            console.error(
                                'Error updating cache from list data.',
                                e,
                            )
                        }
                        return r
                    })
        }

        // @ts-expect-error - TS isn't recognising the types of the *PageParam entries correctly
        const query = useInfiniteQuery({
            queryKey: [lookupKey, 'list'],
            queryFn,
            getNextPageParam: (lastPage, allPages, lastPageParam) =>
                lastPage?.data?.next ? lastPageParam + 1 : null,
            getPreviousPageParam: (firstPage, allPages, firstPageParam) =>
                firstPage?.data?.previous ? firstPageParam - 1 : null,
            initialPageParam: 0,
            enabled: useCurrentUser().user !== null,
        })
        const out: ListQueryResult<T> = { ...query, results: undefined }
        if (query.data === undefined) return out
        if (query.data?.pages?.length === 1 && query.data.pages[0] === null)
            out.results = null
        else
            out.results = query.data.pages.reduce(
                (p, c) => p.concat(c?.data?.results ?? []),
                [] as T[],
            )
        return out
    }

    const useRetrieveQuery: IFetchResourceContext['useRetrieveQuery'] = <
        T extends GalvResource,
    >(
        lookupKey: LookupKey,
        resourceId: string | number,
        options?: RetrieveOptions<T>,
    ) => {
        const { postSnackbarMessage } = useSnackbarMessenger()
        const { api_config } = useCurrentUser()
        const api_handler = new API_HANDLERS[lookupKey](api_config)
        const get = api_handler[
            `${API_SLUGS[lookupKey]}Retrieve` as keyof typeof api_handler
        ] as (requestParams: { id: string }) => Promise<AxiosResponse<T>>

        const after = options?.with_result
            ? options.with_result
            : (r: AxiosResponse<T>) => r
        const on_error_fn = options?.on_error
            ? options.on_error
            : (e: AxiosError) => {
                  if (e.response?.status === 401) return // handled in UserLogin interceptor
                  postSnackbarMessage({
                      message: `Error retrieving ${DISPLAY_NAMES[lookupKey]}/${resourceId}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                      severity: 'error',
                  })
              }

        const queryFn: QueryFunction<AxiosResponse<T>> = () => {
            return get
                .bind(api_handler)({ id: String(resourceId) })
                .then(after)
                .catch((e) => {
                    const result = on_error_fn(e as AxiosError)
                    if (result !== undefined) return result
                    return Promise.reject(e)
                })
        }

        const query_options: UseQueryOptions<AxiosResponse<T>, AxiosError> = {
            queryKey: [lookupKey, resourceId],
            queryFn,
            enabled: useCurrentUser().user !== null && resourceId !== '',
            ...options?.extra_query_options,
        }
        return useQuery<AxiosResponse<T>, AxiosError>(query_options)
    }

    const useDescribeQuery: IFetchResourceContext['useDescribeQuery'] = (
        lookupKey?: LookupKey,
    ) => {
        let queryFn = (() => Promise.resolve(null)) as unknown as QueryFunction<
            AxiosResponse<SerializerDescriptionSerializer>
        >
        if (lookupKey) {
            const api_handler = new API_HANDLERS[lookupKey]({
                basePath: import.meta.env.VITE_GALV_API_BASE_URL,
            } as Configuration)
            const describe = api_handler[
                `${API_SLUGS[lookupKey]}DescribeRetrieve` as keyof typeof api_handler
            ] as () => Promise<AxiosResponse<SerializerDescriptionSerializer>>

            queryFn = (() => describe.bind(api_handler)()) as QueryFunction<
                AxiosResponse<SerializerDescriptionSerializer>
            >
        }
        return useQuery<
            AxiosResponse<SerializerDescriptionSerializer>,
            AxiosError
        >({
            queryKey: [lookupKey, 'describe'],
            queryFn,
            enabled: !!lookupKey,
        })
    }

    const useUpdateQuery: IFetchResourceContext['useUpdateQuery'] = <
        T extends GalvResource,
    >(
        lookupKey: LookupKey,
        options?: UpdateOptions<T>,
    ) => {
        const queryClient = useQueryClient()
        const { postSnackbarMessage } = useSnackbarMessenger()
        const { api_config } = useCurrentUser()
        // used to get config in axios call
        const api_skeleton = new API_HANDLERS[lookupKey](
            api_config,
        ) as unknown as { axios: Axios; basePath: string }
        const api_handler = API_HANDLERS_FP[lookupKey](api_config)
        const partialUpdate = api_handler[
            `${API_SLUGS[lookupKey]}PartialUpdate` as keyof typeof api_handler
        ] as (
            id: string,
            data: Partial<T>,
        ) => Promise<
            (axios: Axios, basePath: string) => Promise<AxiosResponse<T>>
        >

        const pre_cache = options?.before_cache
            ? options.before_cache
            : (r: AxiosResponse<T>) => r
        // (r, v) => ({r, v}) does nothing except stop TS from complaining about unused variables
        const post_cache = options?.after_cache
            ? options.after_cache
            : (r: AxiosResponse<T>, v: UpdateTVariables<T>) => ({ r, v })
        // Need v so TS recognises the function as callable with 2 arguments

        const on_error_fn = options?.on_error
            ? options.on_error
            : (e: AxiosError, v: UpdateTVariables<T>) => {
                  postSnackbarMessage({
                      message: `Error updating ${DISPLAY_NAMES[lookupKey]}/${v.id ?? v.id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                      severity: 'error',
                  })
              }

        const mutationFn: MutationFunction<AxiosResponse<T>, Partial<T>> = (
            data: Partial<T>,
        ) =>
            partialUpdate(String(data.id), data)
                .then((request) =>
                    request(api_skeleton.axios, api_skeleton.basePath),
                )
                .then(pre_cache)

        const mutation_options: UseMutationOptions<
            AxiosResponse<T>,
            AxiosError,
            Partial<T>
        > = {
            mutationKey: [lookupKey, 'update'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (
                data: AxiosResponse<T>,
                variables: UpdateTVariables<T>,
            ) => {
                // Update cache
                const queryKey = [lookupKey, variables.id]
                queryClient.setQueryData(queryKey, data)
                // Invalidate list cache
                queryClient.invalidateQueries({
                    queryKey: [lookupKey, 'list'],
                })
                // Invalidate autocomplete cache
                queryClient.invalidateQueries({ queryKey: ['autocomplete'] })
                post_cache(data, variables)
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options,
        }
        return useMutation<AxiosResponse<T>, AxiosError, UpdateTVariables<T>>(
            mutation_options,
        )
    }

    const get_display_name = (r: Partial<GalvResource>) => {
        if (has(r, 'name')) return r.name
        if (has(r, 'title')) return r.title
        if (has(r, 'identifier')) return r.identifier
        if (has(r, 'model')) return r.model
        if (has(r, 'username')) return r.username
        return r.id
    }

    const useCreateQuery: IFetchResourceContext['useCreateQuery'] = <
        T extends GalvResource,
    >(
        lookupKey: LookupKey,
        options?: CreateOptions<T>,
    ) => {
        const queryClient = useQueryClient()
        const { postSnackbarMessage } = useSnackbarMessenger()
        const { api_config } = useCurrentUser()
        // used to get config in axios call
        const api_skeleton = new API_HANDLERS[lookupKey](
            api_config,
        ) as unknown as { axios: Axios; basePath: string }
        const api_handler = API_HANDLERS_FP[lookupKey](api_config)
        const create = api_handler[
            `${API_SLUGS[lookupKey]}Create` as keyof typeof api_handler
        ] as (
            data: CreateMutationVariablesType<T>,
        ) => Promise<
            (axios: Axios, basePath: string) => Promise<AxiosResponse<T>>
        >

        const pre_cache = options?.before_cache
            ? options.before_cache
            : (r: AxiosResponse<T>) => r
        // (r, v) => ({r, v}) does nothing except stop TS from complaining about unused variables
        const post_cache = options?.after_cache
            ? options.after_cache
            : (r: AxiosResponse<T>, v: CreateMutationVariablesType<T>) => ({
                  r,
                  v,
              })
        const on_error_fn = options?.on_error
            ? options.on_error
            : (e: AxiosError, v: CreateMutationVariablesType<T>) => {
                  postSnackbarMessage({
                      message: `Error creating ${DISPLAY_NAMES[lookupKey]} 
                ${get_display_name(v)}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                      severity: 'error',
                  })
              }

        const mutationFn: MutationFunction<
            AxiosResponse<T>,
            CreateMutationVariablesType<T>
        > = (data: CreateMutationVariablesType<T>) =>
            create(data)
                .then((request) =>
                    request(api_skeleton.axios, api_skeleton.basePath),
                )
                .then(pre_cache)

        const mutation_options: UseMutationOptions<
            AxiosResponse<T>,
            AxiosError,
            CreateMutationVariablesType<T>
        > = {
            mutationKey: [lookupKey, 'create'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (
                data: AxiosResponse<T>,
                variables: CreateMutationVariablesType<T>,
            ) => {
                // Update cache
                const queryKey = [
                    lookupKey,
                    data.data.id ?? 'no id in Create response',
                ]
                queryClient.setQueryData(queryKey, data)
                // Invalidate list cache
                queryClient.invalidateQueries({
                    queryKey: [lookupKey, 'list'],
                })
                // Invalidate autocomplete cache
                queryClient.invalidateQueries({ queryKey: ['autocomplete'] })
                post_cache(data, variables)
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options,
        }
        return useMutation<
            AxiosResponse<T>,
            AxiosError,
            CreateMutationVariablesType<T>
        >(mutation_options)
    }

    const useDeleteQuery: IFetchResourceContext['useDeleteQuery'] = <
        T extends GalvResource,
    >(
        lookupKey: LookupKey,
        options?: DeleteOptions<T>,
    ) => {
        const queryClient = useQueryClient()
        const { postSnackbarMessage } = useSnackbarMessenger()
        const { api_config, refresh_user } = useCurrentUser()
        const api_handler = new API_HANDLERS[lookupKey](api_config)
        const destroy = api_handler[
            `${API_SLUGS[lookupKey]}Destroy` as keyof typeof api_handler
        ] as (requestParameters: { id: string }) => Promise<AxiosResponse<null>>

        const on_error_fn = options?.on_error
            ? options.on_error
            : (e: AxiosError, v: T) => {
                  postSnackbarMessage({
                      message: `Error deleting ${DISPLAY_NAMES[lookupKey]}/${v.id ?? v.id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                      severity: 'error',
                  })
              }

        const mutationFn: MutationFunction<AxiosResponse<null>, T> = (
            data: T,
        ) => destroy.bind(api_handler)({ id: String(data.id) })

        const mutation_options: UseMutationOptions<
            AxiosResponse<null>,
            AxiosError,
            T
        > = {
            mutationKey: [lookupKey, 'delete'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (data: AxiosResponse<null>, variables: T) => {
                // Invalidate cache
                queryClient.removeQueries({
                    queryKey: [lookupKey, variables.id],
                })
                // Invalidate list cache
                queryClient.invalidateQueries({
                    queryKey: [lookupKey, 'list'],
                })
                if (lookupKey === LOOKUP_KEYS.LAB) {
                    refresh_user()
                }
                // Invalidate autocomplete cache
                queryClient.invalidateQueries({ queryKey: ['autocomplete'] })
                if (options?.after) options.after()
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options,
        }
        return useMutation<AxiosResponse<null>, AxiosError, T>(mutation_options)
    }

    return (
        <FetchResourceContext.Provider
            value={{
                useListQuery,
                useRetrieveQuery,
                useDescribeQuery,
                useUpdateQuery,
                useCreateQuery,
                useDeleteQuery,
            }}
        >
            {children}
        </FetchResourceContext.Provider>
    )
}

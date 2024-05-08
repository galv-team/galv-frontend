import {createContext, ReactNode, useContext} from "react";
import {useCurrentUser} from "./CurrentUserContext";
import {
    API_HANDLERS,
    API_SLUGS,
    AutocompleteKey,
    DISPLAY_NAMES,
    is_lookup_key,
    LookupKey
} from "../constants";
import {AxiosError, AxiosResponse} from "axios";
import {
    MutationFunction,
    QueryFunction,
    useInfiniteQuery,
    type UseInfiniteQueryResult, useMutation, UseMutationOptions, UseMutationResult, useQuery,
    useQueryClient, UseQueryOptions,
    UseQueryResult
} from "@tanstack/react-query";
import {get_select_function} from "./ApiResourceContext";
import {BaseResource} from "./ResourceCard";
import {useSnackbarMessenger} from "./SnackbarMessengerContext";

export type PaginatedAPIResponse<T extends BaseResource> = {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export type ListQueryResult<T> = UseInfiniteQueryResult & {
    results: T[] | null | undefined
}

type RetrieveOptions<T extends BaseResource> = {
    extra_query_options?: UseQueryOptions<AxiosResponse<T>, AxiosError>,
    with_result?: (result: AxiosResponse<T>) => AxiosResponse<T>,
    on_error?: (error: AxiosError) => AxiosResponse<T>|undefined
}
type UpdateTVariables<T extends BaseResource> = Partial<T> & {id: string|number}
type UpdateOptions<T extends BaseResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<T>, AxiosError>,
    before_cache?: (result: AxiosResponse<T>) => AxiosResponse<T>,
    after_cache?: (result: AxiosResponse<T>, variables: UpdateTVariables<T>) => void,
    on_error?: (error: AxiosError, variables: UpdateTVariables<T>) => AxiosResponse<T>|undefined
}
type CreateOptions<T extends BaseResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<T>, AxiosError>,
    before_cache?: (result: AxiosResponse<T>) => AxiosResponse<T>,
    after_cache?: (result: AxiosResponse<T>, variables: Partial<T>) => void,
    on_error?: (error: AxiosError, variables: Partial<T>) => AxiosResponse<T>|undefined
}
type DeleteOptions<T extends BaseResource> = {
    extra_query_options?: UseMutationOptions<AxiosResponse<null>, AxiosError>,
    after?: () => void,
    on_error?: (error: AxiosError, variables: T) => void
}

export interface IFetchResourceContext {
    // Returns null when lookup_key is undefined. Otherwise, returns undefined until data are fetched, then T[]
    useListQuery: <T extends BaseResource>(
        lookup_key: LookupKey|AutocompleteKey|undefined
    ) => ListQueryResult<T>
    useRetrieveQuery: <T extends BaseResource>(
        lookup_key: LookupKey,
        resource_id: string|number,
        options?: RetrieveOptions<T>
    ) => UseQueryResult<AxiosResponse<T>, AxiosError>
    useUpdateQuery: <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: UpdateOptions<T>
    ) => UseMutationResult<AxiosResponse<T>, AxiosError, UpdateTVariables<T>>
    useCreateQuery: <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: CreateOptions<T>
    ) => UseMutationResult<AxiosResponse<T>, AxiosError, Partial<T>>
    useDeleteQuery: <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: DeleteOptions<T>
    ) => UseMutationResult<AxiosResponse<null>, AxiosError, T>
}

export const FetchResourceContext = createContext({} as IFetchResourceContext)

export const useFetchResource = () => useContext(FetchResourceContext)

const get_error_detail = (e: AxiosError) => e.response?.data?.detail ??
    Object.entries(e.response?.data ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

export default function FetchResourceContextProvider({children}: {children: ReactNode}) {
    const extract_limit_offset = (url: string|null|undefined) => {
        const safe_number = (n: string | null) => n && !isNaN(parseInt(n))? parseInt(n) : undefined
        if (!url) return undefined
        const params = new URLSearchParams(url.split('?')[1])
        return {
            limit: safe_number(params.get('limit')),
            offset: safe_number(params.get('offset'))
        }
    }

    const useListQuery: IFetchResourceContext["useListQuery"] =
        <T extends BaseResource,>(lookup_key: LookupKey|AutocompleteKey|undefined) => {
            // API handler
            const {api_config} = useCurrentUser()
            const queryClient = useQueryClient()
            let queryFn: QueryFunction<AxiosResponse<PaginatedAPIResponse<T>>|null> = () => Promise.resolve(null)

            if (lookup_key !== undefined) {
                const api_handler = new API_HANDLERS[lookup_key](api_config)
                const get = api_handler[
                    `${API_SLUGS[lookup_key]}List` as keyof typeof api_handler
                    ] as (limit?: number, offset?: number) => Promise<AxiosResponse<PaginatedAPIResponse<T>>>
                // Queries
                queryFn = (ctx) => get.bind(api_handler)(ctx.pageParam?.limit, ctx.pageParam?.offset).then(r => {
                    try {
                        // Update the cache for each resource
                        r.data.results.forEach((resource) => {
                            let data;
                            if (is_lookup_key(lookup_key))
                                data = get_select_function(lookup_key)({...r, data: resource})
                            else
                                data = resource
                            queryClient.setQueryData(
                                [lookup_key, resource.id ?? "no id in List response"],
                                data
                            )
                        })
                    } catch (e) {
                        console.error("Error updating cache from list data.", e)
                    }
                    return r
                })
            }

            const query = useInfiniteQuery({
                queryKey: [lookup_key, 'list'],
                queryFn,
                getNextPageParam: (lastPage) => extract_limit_offset(lastPage?.data.next),
                getPreviousPageParam: (firstPage) => extract_limit_offset(firstPage?.data.previous),
                enabled: useCurrentUser().user !== null
            })
            const out: ListQueryResult<T> = {...query, results: undefined}
            if (query.data === undefined) return out
            if (query.data?.pages?.length === 1 && query.data.pages[0] === null)
                out.results = null
            else
                out.results = query.data.pages.reduce(
                    (p, c) => p.concat(c?.data?.results ?? []),
                    [] as T[]
                )
            return out
        }

    const useRetrieveQuery: IFetchResourceContext["useRetrieveQuery"] = <T extends BaseResource>(
        lookup_key: LookupKey,
        resource_id: string|number,
        options?: {
            extra_query_options?: UseQueryOptions<AxiosResponse<T>, AxiosError>,
            with_result?: (result: AxiosResponse<T>) => AxiosResponse<T>,
            on_error?: (error: AxiosError) => AxiosResponse<T>|undefined
        }
    ) => {
        const {postSnackbarMessage} = useSnackbarMessenger()
        const {api_config} = useCurrentUser()
        const api_handler = new API_HANDLERS[lookup_key](api_config)
        const get = api_handler[
            `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof api_handler
            ] as (id: string) => Promise<AxiosResponse<T>>

        const after = options?.with_result? options.with_result : (r: AxiosResponse<T>) => r
        const on_error_fn = options?.on_error? options.on_error : (e: AxiosError) => {
            postSnackbarMessage({
                message: `Error retrieving ${DISPLAY_NAMES[lookup_key]}/${resource_id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                severity: 'error'
            })
        }

        const queryFn: QueryFunction<AxiosResponse<T>> = () => {
            return get.bind(api_handler)(String(resource_id))
                .then(after)
                .catch((e) => {
                    const result = on_error_fn(e as AxiosError)
                    if (result !== undefined)
                        return result
                    return Promise.reject(e)
                })
        }

        const query_options: UseQueryOptions<AxiosResponse<T>, AxiosError> = {
            queryKey: [lookup_key, resource_id],
            queryFn,
            enabled: useCurrentUser().user !== null,
            ...options?.extra_query_options
        }
        return useQuery<AxiosResponse<T>, AxiosError>(query_options)
    }

    const useUpdateQuery: IFetchResourceContext["useUpdateQuery"] = <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: UpdateOptions<T>
    ) => {
        const queryClient = useQueryClient()
        const {postSnackbarMessage} = useSnackbarMessenger()
        const {api_config} = useCurrentUser()
        const api_handler = new API_HANDLERS[lookup_key](api_config)
        const partialUpdate = api_handler[
            `${API_SLUGS[lookup_key]}PartialUpdate` as keyof typeof api_handler
            ] as (id: string, data: Partial<T>) => Promise<AxiosResponse<T>>

        const pre_cache = options?.before_cache? options.before_cache : (r: AxiosResponse<T>) => r
        // (r, v) => ({r, v}) does nothing except stop TS from complaining about unused variables
        const post_cache = options?.after_cache?
            options.after_cache : (r: AxiosResponse<T>, v: UpdateTVariables<T>) => ({r, v})
        // Need v so TS recognises the function as callable with 2 arguments
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const on_error_fn = options?.on_error? options.on_error : (e: AxiosError, v: UpdateTVariables<T>) => {
            postSnackbarMessage({
                message: `Error updating ${DISPLAY_NAMES[lookup_key]}/${v.id ?? v.id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                severity: 'error'
            })
        }

        const mutationFn: MutationFunction<AxiosResponse<T>, Partial<T>> =
            (data: Partial<T>) => partialUpdate
                .bind(api_handler)(String(data.id ?? data.id), data)
                .then(pre_cache)

        const mutation_options: UseMutationOptions<AxiosResponse<T>, AxiosError, Partial<T>> = {
            mutationKey: [lookup_key, 'update'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (data: AxiosResponse<T>, variables: UpdateTVariables<T>) => {
                // Update cache
                const queryKey = [lookup_key, variables.id]
                queryClient.setQueryData(queryKey, data)
                // Invalidate list cache
                queryClient.invalidateQueries([lookup_key, 'list'])
                // Invalidate autocomplete cache
                queryClient.invalidateQueries(['autocomplete'])
                post_cache(data, variables)
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options
        }
        return useMutation<AxiosResponse<T>, AxiosError, UpdateTVariables<T>>(mutation_options)
    }

    const useCreateQuery: IFetchResourceContext["useCreateQuery"] = <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: CreateOptions<T>
    ) => {
        const queryClient = useQueryClient()
        const {postSnackbarMessage} = useSnackbarMessenger()
        const {api_config} = useCurrentUser()
        const api_handler = new API_HANDLERS[lookup_key](api_config)
        const create = api_handler[
            `${API_SLUGS[lookup_key]}Create` as keyof typeof api_handler
            ] as (data: Partial<T>) => Promise<AxiosResponse<T>>

        const pre_cache = options?.before_cache? options.before_cache : (r: AxiosResponse<T>) => r
        // (r, v) => ({r, v}) does nothing except stop TS from complaining about unused variables
        const post_cache = options?.after_cache?
            options.after_cache : (r: AxiosResponse<T>, v: Partial<T>) => ({r, v})
        const on_error_fn = options?.on_error? options.on_error : (e: AxiosError, v: Partial<T>) => {
            postSnackbarMessage({
                message: `Error creating ${DISPLAY_NAMES[lookup_key]} 
                ${v.name ?? v.title ?? v.identifier ?? v.model ?? v.username}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                severity: 'error'
            })
        }

        const mutationFn: MutationFunction<AxiosResponse<T>, Partial<T>> =
            (data: Partial<T>) => create.bind(api_handler)(data).then(pre_cache)

        const mutation_options: UseMutationOptions<AxiosResponse<T>, AxiosError, Partial<T>> = {
            mutationKey: [lookup_key, 'create'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (data: AxiosResponse<T>, variables: Partial<T>) => {
                // Update cache
                const queryKey = [lookup_key, data.data.id ?? "no id in Create response"]
                queryClient.setQueryData(queryKey, data)
                // Invalidate list cache
                queryClient.invalidateQueries([lookup_key, 'list'])
                // Invalidate autocomplete cache
                queryClient.invalidateQueries(['autocomplete'])
                post_cache(data, variables)
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options
        }
        return useMutation<AxiosResponse<T>, AxiosError, Partial<T>>(mutation_options)
    }

    const useDeleteQuery: IFetchResourceContext["useDeleteQuery"] = <T extends BaseResource>(
        lookup_key: LookupKey,
        options?: DeleteOptions<T>
    ) => {
        const queryClient = useQueryClient()
        const {postSnackbarMessage} = useSnackbarMessenger()
        const {api_config} = useCurrentUser()
        const api_handler = new API_HANDLERS[lookup_key](api_config)
        const destroy = api_handler[
            `${API_SLUGS[lookup_key]}Destroy` as keyof typeof api_handler
            ] as (id: string) => Promise<AxiosResponse<null>>

        const on_error_fn = options?.on_error? options.on_error : (e: AxiosError, v: T) => {
            postSnackbarMessage({
                message: `Error deleting ${DISPLAY_NAMES[lookup_key]}/${v.id ?? v.id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${get_error_detail(e)}`,
                severity: 'error'
            })
        }

        const mutationFn: MutationFunction<AxiosResponse<null>, T> =
            (data: T) => destroy.bind(api_handler)(String(data.id))

        const mutation_options: UseMutationOptions<AxiosResponse<null>, AxiosError, T> = {
            mutationKey: [lookup_key, 'delete'],
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            mutationFn: mutationFn,
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onSuccess: (data: AxiosResponse<null>, variables: T) => {
                // Invalidate cache
                queryClient.removeQueries([lookup_key, variables.id])
                // Invalidate list cache
                queryClient.invalidateQueries([lookup_key, 'list'])
                // Invalidate autocomplete cache
                queryClient.invalidateQueries(['autocomplete'])
                if (options?.after) options.after()
            },
            // @ts-expect-error - TS incorrectly infers that TVariables can be of type void
            onError: on_error_fn,
            ...options?.extra_query_options
        }
        return useMutation<AxiosResponse<null>, AxiosError, T>(mutation_options)
    }

    return <FetchResourceContext.Provider value={{
        useListQuery, useRetrieveQuery, useUpdateQuery, useCreateQuery, useDeleteQuery
    }}>
        {children}
    </FetchResourceContext.Provider>
}

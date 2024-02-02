import {createContext, useContext} from "react";
import {useCurrentUser} from "./CurrentUserContext";
import {API_HANDLERS, API_SLUGS, AutocompleteKey, DISPLAY_NAMES, is_lookup_key, LookupKey} from "../constants";
import {AxiosError, AxiosResponse} from "axios";
import {
    QueryFunction,
    useInfiniteQuery,
    type UseInfiniteQueryResult, useQuery,
    useQueryClient, UseQueryOptions,
    UseQueryResult
} from "@tanstack/react-query";
import {get_select_function} from "./ApiResourceContext";
import {Configuration} from "@battery-intelligence-lab/galv-backend"
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

export interface IFetchResourceContext {
    // Returns null when lookup_key is undefined. Otherwise, returns undefined until data are fetched, then T[]
    useListQuery: <T extends BaseResource>(
        lookup_key: LookupKey|AutocompleteKey|undefined
    ) => ListQueryResult<T>
    useRetrieveQuery: <T extends BaseResource>(
        lookup_key: LookupKey,
        resource_id: string|number,
        options?: {
            extra_query_options?: UseQueryOptions<AxiosResponse<T>, AxiosError>,
            with_result?: (r: AxiosResponse<T>) => AxiosResponse<T>,
            on_error?: (e: AxiosError) => AxiosResponse<T>|undefined
        }
    ) => UseQueryResult<AxiosResponse<T>, AxiosError>
}

export const FetchResourceContext = createContext({} as IFetchResourceContext)

export const useFetchResource = () => useContext(FetchResourceContext)

export default function FetchResourceContextProvider({children}: {children: React.ReactNode}) {
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
            const config = new Configuration({
                basePath: process.env.VITE_GALV_API_BASE_URL,
                accessToken: useCurrentUser().user?.token
            })
            const queryClient = useQueryClient()
            let queryFn: QueryFunction<AxiosResponse<PaginatedAPIResponse<T>>|null> = () => Promise.resolve(null)

            if (lookup_key !== undefined) {
                const api_handler = new API_HANDLERS[lookup_key](config)
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
                                [lookup_key, resource.uuid ?? resource.id ?? "no id in List response"],
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
        const config = new Configuration({
            basePath: process.env.VITE_GALV_API_BASE_URL,
            accessToken: useCurrentUser().user?.token
        })
        const api_handler = new API_HANDLERS[lookup_key](config)
        const get = api_handler[
            `${API_SLUGS[lookup_key]}Retrieve` as keyof typeof api_handler
            ] as (uuid: string) => Promise<AxiosResponse<T>>

        const after = options?.with_result? options.with_result : (r: AxiosResponse<T>) => r
        const on_error_fn = options?.on_error? options.on_error : (e: AxiosError) => {
            postSnackbarMessage({
                message: `Error retrieving ${DISPLAY_NAMES[lookup_key]}/${resource_id}  
                (HTTP ${e.response?.status} - ${e.response?.statusText}): ${e.response?.data?.detail}`,
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
            ...options?.extra_query_options
        }
        return useQuery<AxiosResponse<T>, AxiosError>(query_options)
    }

    return <FetchResourceContext.Provider value={{useListQuery, useRetrieveQuery}}>
        {children}
    </FetchResourceContext.Provider>
}

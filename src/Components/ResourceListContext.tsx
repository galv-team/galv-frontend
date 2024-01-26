import {createContext, useContext} from "react";
import {useCurrentUser} from "./CurrentUserContext";
import {API_HANDLERS, API_SLUGS, AutocompleteKey, is_lookup_key, LookupKey} from "../constants";
import {AxiosError, AxiosResponse} from "axios";
import {QueryFunction, useInfiniteQuery, type UseInfiniteQueryResult, useQueryClient} from "@tanstack/react-query";
import {get_select_function} from "./ApiResourceContext";
import {Configuration} from "@battery-intelligence-lab/galv-backend"
import {BaseResource} from "./ResourceCard";

export type PaginatedAPIResponse<T extends BaseResource> = {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export type ListQueryResult<T> = UseInfiniteQueryResult & {
    results: T[] | null | undefined
}

export interface IResourceListContext {
    // Returns null when lookup_key is undefined. Otherwise, returns undefined until data are fetched, then T[]
    useListQuery: <T extends BaseResource>(lookup_key: LookupKey|AutocompleteKey|undefined) => ListQueryResult<T>
}

export const ResourceListContext = createContext({} as IResourceListContext)

export const useResourceList = () => useContext(ResourceListContext)

export default function ResourceListContextProvider({children}: {children: React.ReactNode}) {
    const extract_limit_offset = (url: string|null|undefined) => {
        const safe_number = (n: string | null) => n && !isNaN(parseInt(n))? parseInt(n) : undefined
        if (!url) return undefined
        const params = new URLSearchParams(url.split('?')[1])
        return {
            limit: safe_number(params.get('limit')),
            offset: safe_number(params.get('offset'))
        }
    }

    const useListQuery: IResourceListContext["useListQuery"] =
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

    return <ResourceListContext.Provider value={{useListQuery}}>
        {children}
    </ResourceListContext.Provider>
}

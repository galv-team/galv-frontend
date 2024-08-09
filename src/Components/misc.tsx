import { is_lookupKey, LookupKey, PATHS, Serializable } from '../constants'
import { AxiosError } from 'axios'

export type ObjectReferenceProps =
    | { id: string }
    | { id: number }
    | { url: string }

export function id_from_ref_props<T extends number | string>(
    props: ObjectReferenceProps | string | number,
): T {
    if (props === undefined) throw new Error(`Cannot get id from undefined`)
    if (typeof props === 'number') return props as T
    if (typeof props === 'object') {
        if ('id' in props) return props.id as T
    }
    const url = typeof props === 'string' ? props : props?.url
    try {
        const id = url
            .split('/')
            .filter((x) => x)
            .pop()
        if (id !== undefined) return id as T
    } catch (error) {
        console.error(`Could not parse id from url`, { props, url, error })
        throw new Error(`Could not parse id from url.`)
    }
    console.error(`Could not parse id from props`, props)
    throw new Error(`Could not parse id from props ${props}`)
}

/**
 * If `url` looks like a valid url for a resource, return the lookup key and id.
 * @param url
 */
export function get_url_components(
    url: string,
): { lookupKey: LookupKey; resourceId: string } | undefined {
    url = url.toLowerCase()
    const parts = url.split(/[/|?]/).filter((x) => x)
    if (parts.length === 4) {
        const lookupKey = Object.keys(PATHS).find(
            (k) => PATHS[k as keyof typeof PATHS] === `/${parts[2]}`,
        )
        if (lookupKey === undefined) return undefined

        if (!is_lookupKey(lookupKey)) {
            console.warn(
                `${lookupKey} is a PATHS key but not an LOOKUP_KEY`,
                url,
            )
            return undefined
        }

        const resourceId = parts[3]
        return { lookupKey: lookupKey as LookupKey, resourceId: resourceId }
    }
    return undefined
}

export function deep_copy<T extends Serializable>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

export function is_axios_error(error: unknown): error is AxiosError {
    return (
        error instanceof Object &&
        'isAxiosError' in error &&
        error.isAxiosError === true
    )
}

export function humanize_bytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes <= 0) return '0 Bytes'
    if (bytes === 1) return '1 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Type guarded hasOwnProperty check
 */
export const has = <T, P extends string>(
    target: T,
    property: P,
): target is T & Record<P, P extends keyof T ? T[P] : any> => {
    return target instanceof Object && Object.keys(target).includes(property)
}

import {
    DISPLAY_NAMES,
    FIELDS,
    GalvResource,
    LookupKey,
    PRIORITY_LEVELS,
} from '../constants'
import { ReactNode } from 'react'
import { useFetchResource } from './FetchResourceContext'

export function representation({
    data,
    lookupKey,
}: {
    data: GalvResource
    lookupKey: LookupKey
}): string {
    try {
        const id_fields = Object.entries(FIELDS[lookupKey])
            .filter((e) => e[1].priority >= PRIORITY_LEVELS.IDENTITY)
            .map((e) => e[0])

        const s = Object.entries(data)
            .filter((e) => id_fields.includes(e[0]))
            .map((e) => e[1])
            .join(' ')

        return s.length
            ? s
            : `${DISPLAY_NAMES[lookupKey]} ${data.id ?? data.id}`
    } catch (error) {
        console.error(
            `Could not represent ${lookupKey} ${data?.id ?? data?.id}`,
            { args: { data, lookupKey }, error },
        )
    }
    return String(data.id ?? data.id ?? 'unknown')
}

export type RepresentationProps = {
    resourceId: string | number
    lookupKey: LookupKey
    prefix?: ReactNode
    suffix?: ReactNode
}

export default function Representation<T extends GalvResource>({
    resourceId,
    lookupKey,
    prefix,
    suffix,
}: RepresentationProps) {
    const { useRetrieveQuery } = useFetchResource()
    const query = useRetrieveQuery<T>(lookupKey, resourceId)

    return (
        <>
            {prefix ?? ''}
            {query.data
                ? representation({ data: query.data.data, lookupKey })
                : resourceId}
            {suffix ?? ''}
        </>
    )
}

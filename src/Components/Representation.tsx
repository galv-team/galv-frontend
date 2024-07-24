import {DISPLAY_NAMES, FIELDS, GalvResource, LookupKey, PRIORITY_LEVELS} from "../constants";
import {ReactNode} from "react";
import {useFetchResource} from "./FetchResourceContext";

export function representation({data, lookup_key}: {data: GalvResource, lookup_key: LookupKey}): string {
    try {
        const id_fields = Object.entries(FIELDS[lookup_key])
            .filter((e) => e[1].priority >= PRIORITY_LEVELS.IDENTITY)
            .map((e) => e[0])

        const s = Object.entries(data)
            .filter((e) => id_fields.includes(e[0]))
            .map((e) => e[1])
            .join(" ")

        return s.length? s : `${DISPLAY_NAMES[lookup_key]} ${data.id ?? data.id}`
    } catch (error) {
        console.error(`Could not represent ${lookup_key} ${data?.id ?? data?.id}`, {args: {data, lookup_key}, error})
    }
    return String(data.id ?? data.id ?? 'unknown')
}

export type RepresentationProps = {
    resource_id: string|number
    lookup_key: LookupKey
    prefix?: ReactNode
    suffix?: ReactNode
}

export default function Representation<T extends GalvResource>(
    {resource_id, lookup_key, prefix, suffix}: RepresentationProps
) {
    const {useRetrieveQuery} = useFetchResource()
    const query = useRetrieveQuery<T>(
        lookup_key,
        resource_id,
    )

    return <>
        {prefix ?? ""}
        {query.data? representation({data: query.data.data, lookup_key}) : resource_id}
        {suffix ?? ""}
    </>
}
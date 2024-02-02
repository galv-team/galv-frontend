import {DISPLAY_NAMES, FIELDS, LookupKey, PRIORITY_LEVELS} from "../constants";
import {BaseResource} from "./ResourceCard";
import {ReactNode} from "react";
import {useFetchResource} from "./FetchResourceContext";

export function representation({data, lookup_key}: {data: BaseResource, lookup_key: LookupKey}): string {
    try {
        const id_fields = Object.entries(FIELDS[lookup_key])
            .filter((e) => e[1].priority >= PRIORITY_LEVELS.IDENTITY)
            .map((e) => e[0])

        const s = Object.entries(data)
            .filter((e) => id_fields.includes(e[0]))
            .map((e) => e[1])
            .join(" ")

        return s.length? s : `${DISPLAY_NAMES[lookup_key]} ${data.uuid ?? data.id}`
    } catch (error) {
        console.error(`Could not represent ${lookup_key} ${data?.uuid ?? data?.id}`, {args: {data, lookup_key}, error})
    }
    return String(data.uuid ?? data.id ?? 'unknown')
}

export default function Representation<T extends BaseResource>({resource_id, lookup_key, prefix, suffix}: {
    resource_id: string|number
    lookup_key: LookupKey
    prefix?: ReactNode
    suffix?: ReactNode
}) {
    const {useRetrieveQuery} = useFetchResource()
    const query = useRetrieveQuery<T>(
        lookup_key,
        resource_id,
        {on_error: () => undefined}
    )

    return <>
        {prefix ?? ""}
        {query.data? representation({data: query.data.data, lookup_key}) : resource_id}
        {suffix ?? ""}
    </>
}
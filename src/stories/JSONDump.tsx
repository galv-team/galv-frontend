import axios from 'axios'
import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'

export default function JSONDump({
    initial_json,
    url,
}: {
    initial_json?: unknown
    url?: string
}) {
    const [json, setJson] = useState<unknown>(initial_json ?? null)
    return (
        <Stack>
            <Button
                onClick={() =>
                    axios
                        .get(url ?? 'http://example.com/json/')
                        .then((r) => setJson(r.data))
                }
            >
                Fetch data
            </Button>
            <pre>{JSON.stringify(json ?? 'JSON is blank', null, 2)}</pre>
        </Stack>
    )
}

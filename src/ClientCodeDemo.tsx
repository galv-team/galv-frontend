import React, {useState} from "react";
import {CopyBlock, a11yLight} from "react-code-blocks";
import {useCurrentUser} from "./Components/CurrentUserContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import FormControl from '@mui/material/FormControl';
import InputLabel from "@mui/material/InputLabel";

import python from "./client_templates/python.py?raw";
import matlab from "./client_templates/matlab.m?raw";
import julia from "./client_templates/julia.jl?raw";
import {useFetchResource} from "./Components/FetchResourceContext";
import {DEFAULT_FETCH_LIMIT, LOOKUP_KEYS} from "./constants";

export type ClientCodeSupportedLanguage =
    "python" |
    "matlab" |
    "julia"

const templates: Record<ClientCodeSupportedLanguage, string> = {
    "python": python,
    "matlab": matlab,
    "julia": julia
}

function DatasetSelector({selectedDatasetIds, setSelectedDatasetIds, fileQueryLimit}: {
    selectedDatasetIds: string[],
    setSelectedDatasetIds: (ids: string[]) => void,
    fileQueryLimit?: number
}) {
    const { useListQuery } = useFetchResource();
    const query = useListQuery(LOOKUP_KEYS.FILE, fileQueryLimit ?? DEFAULT_FETCH_LIMIT)

    if (query.isInitialLoading) {
        return <p>Loading...</p>
    } else if (query.results) {
        return (
            <FormControl fullWidth>
                <InputLabel id="dataset-select-label">Datasets</InputLabel>
                <Select
                    labelId="dataset-select-label"
                    multiple
                    value={selectedDatasetIds}
                    onChange={(e) => setSelectedDatasetIds(e.target.value as string[])}
                    renderValue={(selected) =>
                        query.results!.filter(f => selected.includes(String(f.id)))
                            .map(f => f.name as string)
                            .join(', ')
                    }
                >
                    {query.results.map((dataset) => (
                        <MenuItem value={String(dataset.id)} key={String(dataset.id)}>
                            {String(dataset.name ?? dataset.path ?? dataset.id)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        )
    } else {
        return <p>No datasets found.</p>
    }
}

export default function ClientCodeDemo(props: {fileQueryLimit?: number}) {
    const {user} = useCurrentUser()
    const [language, setLanguage] = useState<ClientCodeSupportedLanguage>("python")
    const [open, setOpen] = useState<boolean>(false)
    const [dataset_ids, setDatasetIds] = useState<string[]>([])

    const updateCode = (code: string) => code
        .replace(/GALV_API_HOST/g, process.env.VITE_GALV_API_BASE_URL ?? "API_url")
        .replace(/GALV_USER_TOKEN/g, user?.token ?? "your_token_here")
        .replace(/"?GALV_DATASET_IDS"?/g, dataset_ids.map(d => `"${d}"`).join(",\n"))

    return (
        <Card>
            <CardHeader
                title={<Typography variant="h5">Example code</Typography>}
                subheader={"Copy template code to download datasets using the Galv API"}
                onClick={() => setOpen(!open)}
                sx={{cursor: "pointer"}}
            />
            <CardContent hidden={!open}>
                <Stack spacing={1}>
                    <FormControl fullWidth>
                        <InputLabel id={`${dataset_ids.join()}-select-label`}>Language</InputLabel>
                        <Select
                            value={language}
                            label={"Language"}
                            labelId={`${dataset_ids.join()}-select-label`}
                            onChange={(e) => setLanguage(e.target.value as ClientCodeSupportedLanguage)}
                        >
                            {
                                ["Python", "Julia", "Matlab"].map((lang) => (
                                    <MenuItem value={lang.toLowerCase()} key={lang}>{lang}</MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                    <DatasetSelector
                        selectedDatasetIds={dataset_ids}
                        setSelectedDatasetIds={setDatasetIds}
                        fileQueryLimit={props.fileQueryLimit}
                    />
                    <CopyBlock
                        text={updateCode(templates[language])}
                        language={language}
                        theme={a11yLight}
                        showLineNumbers
                    />
                </Stack>
            </CardContent>
        </Card>
    )
}

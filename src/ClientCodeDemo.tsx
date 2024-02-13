import React, {useState} from "react";
import {CopyBlock, a11yDark} from "react-code-blocks";
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

export type ClientCodeSupportedLanguage =
    "python" |
    "matlab" |
    "julia"

export type ClientCodeDemoProps = {
    dataset_ids: string[]
}

const templates: Record<ClientCodeSupportedLanguage, string> = {
    "python": python,
    "matlab": matlab,
    "julia": julia
}

export default function ClientCodeDemo({dataset_ids}: ClientCodeDemoProps) {
    const {user} = useCurrentUser()
    const [language, setLanguage] = useState<ClientCodeSupportedLanguage>("python")
    const [open, setOpen] = useState<boolean>(false)

    const updateCode = (code: string) => code
        .replace(/GALV_API_HOST/g, process.env.VITE_GALV_API_BASE_URL ?? "API_url")
        .replace(/GALV_USER_TOKEN/g, user?.token ?? "your_token_here")
        .replace(/"?GALV_DATASET_IDS"?/g, dataset_ids.map(d => `"${d}",\n`).join())

    return (
        <Card>
            <CardHeader
                title={<Typography variant="h5">Example code</Typography>}
                subheader={"See an example of how to get this dataset with the Galv API"}
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
                    <CopyBlock
                        text={updateCode(templates[language])}
                        language={language}
                        theme={a11yDark}
                        showLineNumbers
                    />
                </Stack>
            </CardContent>
        </Card>
    )
}

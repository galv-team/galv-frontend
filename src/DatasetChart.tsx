// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {ReactNode, useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CardHeader from "@mui/material/CardHeader";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import CanvasJSReact from "@canvasjs/react-charts";
import {useCurrentUser} from "./Components/CurrentUserContext";
import {Table, tableFromIPC } from "apache-arrow";
import Paper from "@mui/material/Paper";
import MobileStepper from "@mui/material/MobileStepper";
import Button from "@mui/material/Button";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import * as wasm from "parquet-wasm/bundler/arrow1"

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const COLORS = [
    "#de6565",
    "#5d5dab"
]

/*
Take a parquet file and render a chart of the data.
 */
export function DatasetChartPanel({table}: {table: Table}) {
    const [chartKey, setChartKey] = useState<number[]>([])
    const COL_KEYS = ["Current_A", "Voltage_V"]

    // Check metadata for key columns.
    // If key columns are not present, show an error and suggest the user re-map the column types.

    // TODO: Backend can keep track of column names in file <-> column names in data,
    //  but the original datafile won't update column names just because user binds them to a known type.
    //  We need to signal which columns are the key ones we care about so we know which ones to read here.
    //  We should also consider how we'll enable better data sharing via the API.
    //  Perhaps the API can have a utility function to rewrite the names of official columns
    //  to match the expected names.
    //  Don't know how we'd specify that function given the APIs are built automatically from the schema.

    const bytes_to_values = (bytes: Uint8Array) => Array.from(bytes)
    const col_to_values = (col: string) => bytes_to_values(
        table?.select([col]).batches[0].data.children[0].values
    )
    const x_values = table && col_to_values('Elapsed_time_s')
    const chart_data = table && COL_KEYS
        .map((key, i) => {
            if (!chartKey.includes(i)) setChartKey(prevState => [...prevState, i])
            const values = col_to_values(key)
            const dataPoints: {x: number, y: number|null}[] = []
            x_values.forEach((t, n) => {
                dataPoints.push({
                    x: t,
                    y: values[n] ?? null
                })
            })
            return {
                type: "line",
                name: key,
                showInLegend: true,
                xValueFormatString: "#,##0.0000 s",
                yValueFormatString: `#,##0.0000 ${key.split('/')[1]}`,
                axisYType: i? "secondary" : "primary",
                color: COLORS[i],
                dataPoints
            }
        }, {})

    return <CanvasJSChart
        key={chartKey.reduce((a, b) => a + b, 0)}
        options={{
            theme: "light2",
            animationEnabled: true,
            title:{
                text: "Cycler data summary"
            },
            axisX: {
                title: "Time (s)",
            },
            axisY: {
                title: "Current (A)",
                titleFontColor: COLORS[0],
                lineColor: COLORS[0],
                labelFontColor: COLORS[0],
                tickColor: COLORS[0]
            },
            axisY2: {
                title: "Potential Difference (V)",
                titleFontColor: COLORS[1],
                lineColor: COLORS[1],
                labelFontColor: COLORS[1],
                tickColor: COLORS[1]
            },
            toolTip: {
                shared: true
            },
            data: chart_data
        }}
    />
}

/**
 * TODO: handle incoming data stream and render in response to new data chunks
 */
export function DatasetChart({parquet_partitions}: {parquet_partitions: string[]}) {
    const [fetching, setFetching] = useState(false)
    const [tables, setTables] = useState<ReactNode[]>([])
    const [currentTableIndex, setCurrentTableIndex] = useState(0)
    const [parquetModuleInitalized, setParquetModuleInitialized] = useState(false)
    const token = useCurrentUser().user?.token
    const headers = {Authorization: `Bearer ${token}`}

    useEffect(() => {
        // React advises to declare the async function directly inside useEffect
        async function getParquetModule() {
            // const parquetModule = await import(
            //     "https://unpkg.com/parquet-wasm@0.4.0-beta.5/esm/arrow2.js"
            //     );
            // // Need to await the default export first to initialize the WebAssembly code
            // const {memory} = await parquetModule.default();
            // setParquetModule(parquetModule);
            // return [parquetModule, memory];
            await wasm
            setParquetModuleInitialized(true)
        }

        if (!parquetModuleInitalized) {
            getParquetModule()
        }
    }, []);

    if (!fetching && tables.length < parquet_partitions.length && parquetModuleInitalized) {
        setFetching(true)
        fetch(parquet_partitions[tables.length], {method: "GET", headers})
            .then(r => r.json())
            .then(r => fetch(r.parquet_file, {headers}))
            .then(r => r.arrayBuffer())
            .then(ab => new Uint8Array(ab))
            .then(async arr => wasm.readParquet(arr))
            .then(pq => pq.intoIPCStream())
            .then(ipc => new tableFromIPC(ipc))
            .then(t => setTables([...tables, <DatasetChartPanel table={t} />]))
            .then(() => setFetching(false))
            .catch(e => console.error("Error fetching S3 file", e))
    }

    return <CardContent>
        <Stack spacing={1}>
            <Box sx={{ maxWidth: 400, flexGrow: 1 }}>
                <Paper
                    square
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 50,
                        pl: 2,
                        bgcolor: 'background.default',
                    }}
                >
                    <Typography>Part {currentTableIndex}/{parquet_partitions.length - 1}</Typography>
                </Paper>
                <Box sx={{ height: 255, maxWidth: 400, width: '100%', p: 2 }}>
                    {
                        !tables.length ?
                            <Skeleton variant="rounded" height="300px"/> : tables[currentTableIndex]
                    }
                </Box>
                <MobileStepper
                    variant="text"
                    steps={parquet_partitions.length}
                    position="static"
                    activeStep={currentTableIndex}
                    nextButton={
                    currentTableIndex === tables.length - 1 && fetching?
                        <Button size="small" disabled>
                            Loading...
                        </Button> :
                        <Button
                            size="small"
                            onClick={() => setCurrentTableIndex(currentTableIndex + 1)}
                            disabled={(
                                currentTableIndex === parquet_partitions.length - 1 ||
                                    currentTableIndex >= tables.length - 1
                            )}
                        >
                            Next
                            <KeyboardArrowRight />
                        </Button>
                    }
                    backButton={
                        <Button
                            size="small"
                            onClick={() => setCurrentTableIndex(currentTableIndex - 1)}
                            disabled={currentTableIndex === 0}
                        >
                            <KeyboardArrowLeft />
                            Back
                        </Button>
                    }
                />
            </Box>
        </Stack>
    </CardContent>
}

export default function DatasetChartWrapper(
    {parquet_partitions, has_required_columns}: {parquet_partitions: string[], has_required_columns: boolean}
) {
    const [open, setOpen] = useState<boolean>(false)

    if (!has_required_columns) return <Card>
        <CardHeader
            title={<Typography variant="h5">Required columns missing</Typography>}
            subheader={<Typography variant="body1">
                Link data columns to their correct Type for Time, Voltage, and Current to be able to see a plot of the data
        </Typography>}
        />
    </Card>

    return <Card>
        <CardHeader
            title={<Typography variant="h5">Dataset Preview</Typography>}
            subheader={<Typography variant="body1">View a graph of Voltage and Current by Time</Typography>}
            onClick={() => setOpen(!open)}
            sx={{cursor: "pointer"}}
        />
        {open && <DatasetChart parquet_partitions={parquet_partitions} />}
    </Card>
}
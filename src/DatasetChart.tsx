// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CardHeader from "@mui/material/CardHeader";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {ColumnsApi, Configuration}from "@battery-intelligence-lab/galv";
import {useQueries, useQuery} from "@tanstack/react-query";
import useStyles from "./styles/UseStyles";
import clsx from "clsx";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import CanvasJSReact from "@canvasjs/react-charts";
import {useCurrentUser} from "./Components/CurrentUserContext";
import { tableFromIPC } from "apache-arrow";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const COLORS = [
    "#de6565",
    "#5d5dab"
]

/**
 * TODO: handle incoming data stream and render in response to new data chunks
 */
export function DatasetChart({parquet_urls}: {parquet_urls: string[]}) {
    const {classes} = useStyles()
    const [chartKey, setChartKey] = useState<number[]>([])
    const s3_url = "https://galv.s3.eu-west-2.amazonaws.com/data/test-large.parquet/part.0.parquet"
    const [fetching, setFetching] = useState(false)
    const [wasmArrowTable, set_wasmArrowTable] = useState()
    const [parquetModule, setParquetModule] = useState()

    useEffect(() => {
        // React advises to declare the async function directly inside useEffect
        async function getParquetModule() {
            const parquetModule = await import(
                "https://unpkg.com/parquet-wasm@0.4.0-beta.5/esm/arrow2.js"
                );
            // Need to await the default export first to initialize the WebAssembly code
            const {memory} = await parquetModule.default();
            setParquetModule(parquetModule);
            return [parquetModule, memory];
        }

        if (!parquetModule) {
            getParquetModule()
        }
    }, []);

    if (!fetching && wasmArrowTable === undefined && parquetModule !== undefined) {
        setFetching(true)
        fetch(s3_url, {method: "GET"})
            .then(r => r.arrayBuffer())
            .then(ab => new Uint8Array(ab))
            .then(async arr => parquetModule.readParquet(arr))
            .then(pq => new tableFromIPC(pq))
            .then(set_wasmArrowTable)
            .catch(e => console.error("Error fetching S3 file", e))
    }
    const COL_KEYS = ["I/mA", "Ewe/V"]
    const col_to_values = (col: string) => wasmArrowTable?.select([col]).batches[0].data.children[0].values
    const x_values = wasmArrowTable && col_to_values('time/s')
    const chart_data = wasmArrowTable && COL_KEYS
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

    return <CardContent>
        <Stack spacing={1}>
            <Box className={clsx(classes.chart)}>
                {
                    !wasmArrowTable?
                        <Skeleton variant="rounded" height="300px"/> :
                        <CanvasJSChart
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
                        />}
            </Box>
        </Stack>
    </CardContent>
}

export default function DatasetChartWrapper({parquet_urls}: {parquet_urls: string[]}) {
    const [open, setOpen] = useState<boolean>(false)

    return <Card>
        <CardHeader
            title={<Typography variant="h5">Dataset Chart</Typography>}
            subheader={<Typography variant="body1">View a chart of a dataset</Typography>}
            onClick={() => setOpen(!open)}
            sx={{cursor: "pointer"}}
        />
        {open && <DatasetChart parquet_urls={parquet_urls} />}
    </Card>
}
// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, { ReactNode, useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import CanvasJSReact from '@canvasjs/react-charts'
import { useCurrentUser } from './Components/CurrentUserContext'
import Paper from '@mui/material/Paper'
import MobileStepper from '@mui/material/MobileStepper'
import Button from '@mui/material/Button'
import { KeyboardArrowRight } from 'react-icons/md'
import { KeyboardArrowLeft } from 'react-icons/md'
import { ZipReader, BlobReader, BlobWriter } from '@zip.js/zip.js'
import Papa from 'papaparse'

const CanvasJSChart = CanvasJSReact.CanvasJSChart

const COLORS = ['#de6565', '#5d5dab']

/*
Take a parquet file and render a chart of the data.
 */
type DatasetRow = Record<string, number>

export function DatasetChartPanel({ rows }: { rows: DatasetRow[] }) {
    const [chartKey, setChartKey] = useState<number[]>([])
    const COL_KEYS = ['Current_A', 'Voltage_V']

    // Check metadata for key columns.
    // If key columns are not present, show an error and suggest the user re-map the column types.

    const x_values = rows.map((r) => r.ElapsedTime_s)
    const chart_data =
        COL_KEYS.map((key, i) => {
            if (!chartKey.includes(i))
                setChartKey((prevState) => [...prevState, i])
            const dataPoints: { x: number; y: number | null }[] = []
            x_values.forEach((t, n) => {
                dataPoints.push({
                    x: t,
                    y: rows[n] && rows[n][key] !== undefined ? rows[n][key] : null,
                })
            })
            return {
                type: 'line',
                name: key,
                showInLegend: true,
                xValueFormatString: '#,##0.0000 s',
                yValueFormatString: `#,##0.0000000 ${key.split('_')[1]}`,
                axisYType: i ? 'secondary' : 'primary',
                color: COLORS[i],
                dataPoints,
            }
        }, {})

    return (
        <CanvasJSChart
            key={chartKey.reduce((a, b) => a + b, 0)}
            options={{
                theme: 'light2',
                animationEnabled: true,
                title: {
                    text: 'Cycler data summary',
                },
                axisX: {
                    title: 'Time (s)',
                },
                axisY: {
                    title: 'Current (A)',
                    titleFontColor: COLORS[0],
                    lineColor: COLORS[0],
                    labelFontColor: COLORS[0],
                    tickColor: COLORS[0],
                },
                axisY2: {
                    title: 'Potential Difference (V)',
                    titleFontColor: COLORS[1],
                    lineColor: COLORS[1],
                    labelFontColor: COLORS[1],
                    tickColor: COLORS[1],
                },
                toolTip: {
                    shared: true,
                },
                zoomEnabled: true,
                data: chart_data,
            }}
        />
    )
}

export function DatasetChart({ zip_file }: { zip_file: string }) {
    const [fetching, setFetching] = useState(false)
    const [tables, setTables] = useState<ReactNode[]>([])
    const [currentTableIndex, setCurrentTableIndex] = useState(0)
    const token = useCurrentUser().user?.token
    const headers = token? { Authorization: `Bearer ${token}` } : {}

    if (!fetching && tables.length === 0) {
        setFetching(true)
        fetch(zip_file, { method: 'GET', headers })
            .then((r) => r.arrayBuffer())
            .then(async (ab) => {
                const reader = new ZipReader(new BlobReader(new Blob([ab])))
                const entries = await reader.getEntries()
                const first = entries[0]
                if (!first) throw new Error('No file in zip')
                const blob = await first.getData(new BlobWriter())
                await reader.close()
                return await blob.text()
            })
            .then((text) =>
                Papa.parse<DatasetRow>(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                }).data,
            )
            .then((rows) =>
                setTables([...tables, <DatasetChartPanel rows={rows} />]),
            )
            .then(() => setFetching(false))
            .catch((e) => console.error('Error fetching S3 file', e))
    }

    return (
        <CardContent>
            <Stack spacing={1}>
                <Box>
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
                        <Typography>
                            Part {currentTableIndex}/0
                        </Typography>
                    </Paper>
                    <Box sx={{ width: '100%', p: 2 }}>
                        {!tables.length ? (
                            <Skeleton variant="rounded" height="300px" />
                        ) : (
                            tables[currentTableIndex]
                        )}
                    </Box>
                    <Typography variant="body1">
                        Click and drag to zoom in on the chart
                    </Typography>
                    <MobileStepper
                        variant="text"
                        steps={1}
                        position="static"
                        activeStep={currentTableIndex}
                        nextButton={
                            currentTableIndex === tables.length - 1 &&
                            fetching ? (
                                <Button size="small" disabled>
                                    Loading...
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    onClick={() =>
                                        setCurrentTableIndex(
                                            currentTableIndex + 1,
                                        )
                                    }
                                    disabled={
                                        currentTableIndex >= tables.length - 1
                                        currentTableIndex >= tables.length - 1
                                    }
                                >
                                    Next
                                    <KeyboardArrowRight />
                                </Button>
                            )
                        }
                        backButton={
                            <Button
                                size="small"
                                onClick={() =>
                                    setCurrentTableIndex(currentTableIndex - 1)
                                }
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
    )
}

export default function DatasetChartWrapper({ zip_file }: { zip_file: string }) {
    const [open, setOpen] = useState<boolean>(false)

    return (
        <Card>
            <CardHeader
                title={<Typography variant="h5">Dataset Preview</Typography>}
                subheader={
                    <Typography variant="body1">
                        View a graph of Voltage and Current by Time
                    </Typography>
                }
                onClick={() => setOpen(!open)}
                sx={{ cursor: 'pointer' }}
            />
            {open && <DatasetChart zip_file={zip_file} />}
        </Card>
    )
}

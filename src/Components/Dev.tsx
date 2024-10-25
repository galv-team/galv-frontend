import React from 'react'
import DownloadDataset from './DownloadDataset'

export function Dev() {
    if (!import.meta.env.DEV) {
        return <></>
    }
    return (
        <>
            <DownloadDataset
                file={{
                    id: '72eb4cd4-65f2-4128-b822-694207cb5454',
                    parquet_partitions: [
                        'http://localhost:8080/parquet_partitions/5bc4ac7b-661e-485a-9eb0-87a112159ddf/',
                    ],
                }}
            />
        </>
    )
}

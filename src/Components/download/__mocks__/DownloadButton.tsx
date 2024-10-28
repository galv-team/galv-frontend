// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import { DownloadButtonProps } from '../DownloadButton'

export default function DownloadButton<X>(params: DownloadButtonProps<X>) {
    return (
        <div
            {...Object.fromEntries(
                Object.entries(params).map(([k, v]) => [`data-params-${k}`, v]),
            )}
        >
            Download
        </div>
    )
}

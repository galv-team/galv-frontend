// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.
import {ReactNode} from "react";

const dummy = <T,>(
    name: string,
    params?: T & {children?: ReactNode}
) => <div>
    <p>Dummy{name}</p>
    <ul>{params && Object.entries(params).map(([k, v]) => {
        try {
            return <li data-key={k} key={k}>{JSON.stringify(v)}</li>
        } catch (e) {
            return <li data-key={k} key={k}>[{typeof(v)}]</li>
        }
    })}</ul>
    {params?.children}
</div>

export default dummy

// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from '../../__mocks__/DummyComponent'
import { ReactNode } from 'react'

const f =
    <T extends { children?: ReactNode }>(v: string) =>
    (props: T) =>
        dummy(v, props)

export const PrettyString = f('PrettyString')
export const PrettyNumber = f('PrettyNumber')
export const PrettyBoolean = f('PrettyBoolean')
export const Pretty = f('Pretty')
export const Prettify = f('Prettify')

export default Prettify

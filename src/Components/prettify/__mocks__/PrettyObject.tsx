// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from "../../__mocks__/DummyComponent"
import {PrettyObjectFromQueryProps, PrettyObjectProps} from "../PrettyObject";

export function PrettyObjectFromQuery(props: PrettyObjectFromQueryProps) {
    return dummy('PrettyObjectFromQuery', props)
}

export default function PrettyObject(props: PrettyObjectProps) {
    return dummy('PrettyObject', props)
}
// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from '../../__mocks__/DummyComponent'
import { RepresentationProps } from '../GenericRepresentation'
import { GalvResource, LookupKey } from '../../../constants'

export function genericRepresentation(params: {
    data: GalvResource
    lookupKey: LookupKey
}): string {
    console.log('genericRepresentation', params)
    return `representation: ${params.lookupKey} [${params.data.id}]`
}

export default function GenericRepresentation(params: RepresentationProps) {
    return dummy('GenericRepresentation', params)
}

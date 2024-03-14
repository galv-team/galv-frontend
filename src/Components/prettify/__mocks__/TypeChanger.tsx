// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from "../../__mocks__/DummyComponent"
import {TypeChangerPopoverProps, TypeChangerProps} from "../TypeChanger";

export default function TypeChanger(params: TypeChangerProps & Partial<TypeChangerPopoverProps>) {
	return dummy("TypeChanger", params)
}
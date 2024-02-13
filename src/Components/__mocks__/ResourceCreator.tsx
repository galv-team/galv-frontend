// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from "./DummyComponent"
import {ResourceCreatorProps} from "../ResourceCreator";

export default function ResourceCreator(params: ResourceCreatorProps) {
	return dummy("ResourceCreator", params)
}
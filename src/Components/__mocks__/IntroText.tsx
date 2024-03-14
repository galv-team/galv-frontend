// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import dummy from "./DummyComponent"
import {INTRODUCTIONS} from "../../constants";

export default function LoadingChip(params: {k: keyof typeof INTRODUCTIONS}) {
	return dummy("IntroText", params)
}
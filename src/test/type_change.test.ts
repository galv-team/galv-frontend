// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import {convert} from "../Components/TypeChanger";

const cases = [
    {
        input: {_type: "string", _value: "1"},
        outputs: {
            number: {_type: "number", _value: 1},
            boolean: {_type: "boolean", _value: true},
            array: {_type: "array", _value: [{_type: "string", _value: "1"}]},
            object: {_type: "object", _value: {0: {_type: "string", _value: "1"}}},
            galv_CELL: {_type: "galv_CELL", _value: "undefined/cells/1"}
        }
    },
    {
        input: {_type: "string", _value: "true"},
        outputs: {
            number: {_type: "number", _value: 0},
            boolean: {_type: "boolean", _value: true},
            array: {_type: "array", _value: [{_type: "string", _value: "true"}]},
            object: {
                _type: "object", _value: {0: {_type: "string", _value: "true"}}
            }
        }
    },
    {
        input: {_type: "string", _value: "false"},
        outputs: {
            number: {_type: "number", _value: 0},
            boolean: {_type: "boolean", _value: true},
            array: {_type: "array", _value: [{_type: "string", _value: "false"}]},
            object: {
                _type: "object", _value: {0: {_type: "string", _value: "false"}}
            }
        }
    },
    {
        input: {_type: "number", _value: 1},
        outputs: {
            string: {_type: "string", _value: "1"},
            boolean: {_type: "boolean", _value: true},
            array: {_type: "array", _value: [{_type: "number", _value: 1}]},
            object: {_type: "object", _value: {0: {_type: "number", _value: 1}}}
        }
    },
    {
        input: {_type: "boolean", _value: true},
        outputs: {
            string: {_type: "string", _value: "true"},
            number: {_type: "number", _value: 1},
            array: {_type: "array", _value: [{_type: "boolean", _value: true}]},
            object: {
                _type: "object", _value: {0: {_type: "boolean", _value: true}}
            }
        }
    },
    {
        input: {_type: "array", _value: [{_type: "string", _value: "1"}]},
        outputs: {
            string: {_type: "string", _value: "[\"1\"]"},
            number: {_type: "number", _value: 0},
            boolean: {_type: "boolean", _value: true},
            object: {
                _type: "object", _value: {0: {_type: "string", _value: "1"}}
            }
        }
    },
    {
        input: {_type: "object", _value: {0: {_type: "string", _value: "1"}}},
        outputs: {
            string: {_type: "string", _value: "{\"0\":\"1\"}"},
            number: {_type: "number", _value: 0},
            boolean: {_type: "boolean", _value: true},
            array: {_type: "array", _value: [{_type: "string", _value: "1"}]}
        }
    },
    {
        input: {_type: "galv_CELL", _value: "https://example.com/cells/1"},
        outputs: {
            string: {_type: "string", _value: "https://example.com/cells/1"}
        }
    }
]

const expanded_cases = cases.map(({input, outputs}) => {
    return Object.entries(outputs).map(([outputType, expected]) => {
        return [input, outputType, expected];
    });
})
    .flat();

describe('Type conversion', () => {
    test.each(expanded_cases)('%#: %o to %s gives %o', (input, outputType, expected) => {
        expect(convert(input, outputType)).toStrictEqual(expected);
    });
});

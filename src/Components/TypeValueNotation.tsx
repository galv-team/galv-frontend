import {
    Field,
    FIELDS,
    is_autocomplete_key,
    is_lookup_key,
    LookupKey,
    Serializable,
    SerializableObject
} from "../constants";
import {TypeChangerAutocompleteKey, TypeChangerLookupKey} from "./prettify/TypeChanger";

/**
 * TypeValueNotation (TVN) is a way to represent a value in a way that makes explicit the type of the value.
 * This is useful for representing values that have a type that is not immediately obvious from the value itself.
 * For example, resources are represented as strings, but the string is a URL that points to the resource.
 *
 * Representing values in this way provides flexibility for adding new types of values without changing
 * the structure of the data.
 *
 * TypeValueNotation is a recursive structure that can represent any value that can be represented in JSON.
 *
 * Because of its verbosity, TypeValueNotation is not very suitable for long lists of values of the same type.
 */
export type TypeValueNotation = {
    _type: "string" | "number" | "boolean" | "null" | "attachment" | "object" | "array" |
        TypeChangerLookupKey | TypeChangerAutocompleteKey
    _value: string | number | boolean | null | TypeValueNotation[] | TypeValueNotationWrapper
}

/**
 * TypeValueNotationWrapper maps keys to TypeValueNotation objects.
 *
 * The `_value` of an "object" in TypeValueNotation is a TypeValueNotationWrapper, and ultimately the root of
 * any data in TypeValueNotation is a TypeValueNotationWrapper.
 */
export type TypeValueNotationWrapper = Record<string, TypeValueNotation>

export function is_resource_type(v: unknown): v is TypeChangerLookupKey | TypeChangerAutocompleteKey {
    if (typeof v === 'string') {
        if (v.startsWith('galv_')) {
            const k = v.replace('galv_', '')
            return is_lookup_key(k) || is_autocomplete_key(k)
        }
    }
    return false
}

/**
 * Check if a value is a TypeValueNotationWrapper
 * @param v
 * @param strict - if true, _value must be the type declared by _type
 * @param verbose - if true, explain why the value is not a TypeValueNotationWrapper
 * @param context - additional contextual information to include in the verbose output
 */
export function is_tvn_wrapper(
    v: unknown,
    strict = false,
    verbose = false,
    context?: unknown
): v is TypeValueNotationWrapper {
    if (v instanceof Object)
        return Object.entries(v).every(([k, v]) => is_tvn(v, strict, verbose, {key: k, context}))
    if (verbose) console.warn(`TypeValueNotationWrapper check found non-object`, v)
    return false
}

/**
 * Check if a value is a TypeValueNotation object
 * @param v
 * @param strict - if true, _value must be the type declared by _type
 * @param verbose - if true, explain why the value is not a TypeValueNotation object
 * @param context - additional contextual information to include in the verbose output
 */
export function is_tvn(
    v: unknown,
    strict = false,
    verbose = false,
    context?: unknown
): v is TypeValueNotation {
    if (v instanceof Object) {
        const keys = Object.keys(v)
        if (keys.length === 2 && keys.includes('_type') && keys.includes('_value')) {
            const unknown = v as { _type: unknown, _value: unknown }
            if (typeof unknown._type !== 'string' || unknown._type.length === 0) {
                if (verbose)
                    console.warn(
                        `TypeValueNotation check found {_type, _value} but _type is not a string`,
                        {candidate: unknown, context}
                    )
                return false
            }
            const _v = unknown as { _type: string, _value: unknown }
            if (_v._value instanceof Array) {
                if (strict && _v._type !== 'array') {
                    if (verbose)
                        console.warn(
                            `TypeValueNotation check found {_type, _value} array but _type is not 'array'`,
                            {candidate: _v, context}
                        )
                    return false
                }
                const arr = _v as { _type: string, _value: unknown[] }
                return arr._value.every((x, i) => is_tvn(x, strict, verbose, {index: i, context}))
            }
            if (_v._value instanceof Object) {
                if (strict && _v._type !== 'object') {
                    if (verbose)
                        console.warn(
                            `TypeValueNotation check found {_type, _value} object but _type is not 'object'`,
                            {candidate: _v, context}
                        )
                    return false
                }
                const obj = _v as { _type: string, _value: Record<string, unknown> }
                return is_tvn_wrapper(obj._value, strict, verbose, context)
            }
            if (is_resource_type(_v._type)) {
                if (typeof _v._value !== 'string') {
                    if (verbose)
                        console.warn(
                            `TypeValueNotation check found {_type, _value} but _type is a resource type (${_v._type}) and _value is not a string`,
                            {candidate: _v, context}
                        )
                    return false
                }
                return true
            }
            if (strict) {
                if (['string', 'number', 'boolean'].includes(_v._type)) {
                    if (typeof _v._value !== _v._type) {
                        if (verbose)
                            console.warn(
                                `TypeValueNotation check found {_type, _value} but _value is not of type ${_v._type}`,
                                {candidate: _v, context}
                            )
                        return false
                    }
                    return true
                }
                if (verbose)
                    console.warn(
                        `TypeValueNotation check found {_type, _value} but _type is not a known type`,
                        {candidate: _v, context}
                    )
                return false
            }
            if (!['string', 'number', 'boolean'].includes(typeof _v._value) && _v._value !== null) {
                if (verbose)
                    console.warn(
                        `TypeValueNotation check found {_type, _value} but _value is not a known type`,
                        {candidate: _v, context}
                    )
                return false
            }
            return true
        }
    }
    if (verbose)
        console.warn(
            `TypeValueNotation check found non-object`,
            {candidate: v, context}
        )
    return false
}

export const validate_type_value_notation = (v: unknown, allow_wrappers = true): TypeValueNotation | TypeValueNotationWrapper => {
    if (is_tvn(v, true) || (allow_wrappers && is_tvn_wrapper(v, true)))
        return v
    throw new Error(`Invalid TypeValueNotation: ${v}`)
}
export const to_type_value_notation = (v: Serializable, field_info?: Field): TypeValueNotation => {
    if (is_tvn(v)) return v
    // Where field_info is provided, it's a hint to the type of the value
    if (field_info?.type) {
        // Arrays use the field_info.type property to determine the type of their elements
        if (field_info.many)
            return {
                _type: 'array',
                _value: (v as Serializable[]).map(x => to_type_value_notation(x, {...field_info, many: false}))
            }
        // Objects resume automatic type detection
        if (field_info.type === 'object')
            return to_type_value_notation(v)
        // Other types use the field_info.type property to determine the type of the value
        return {_type: field_info.type, _value: v as TypeValueNotation["_value"]}
    }
    if (v instanceof Array) {
        return {
            _type: 'array',
            _value: v.map(x => to_type_value_notation(x))
        }
    }
    if (v instanceof Object) {
        return {
            _type: 'object',
            _value: Object.fromEntries(Object.entries(v).map(([k, v]) => [k, to_type_value_notation(v)]))
        }
    }
    if (["string", "number", "boolean"].includes(typeof v)) {
        return {
            _type: typeof v as "string" | "number" | "boolean",
            _value: v as string | number | boolean
        }
    }
    return {
        _type: "string",
        _value: String(v)
    }
}
export const to_type_value_notation_wrapper = (v: SerializableObject, lookup_key?: LookupKey): TypeValueNotationWrapper => {
    if (is_tvn_wrapper(v)) return v
    if (lookup_key) {
        const fields = FIELDS[lookup_key]
        return Object.fromEntries(Object.entries(v).map(([k, v]) =>
            [k, to_type_value_notation(v, fields[k as keyof typeof fields])]
        ))
    }
    return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, to_type_value_notation(v)]))
}
export const from_type_value_notation =
    (v: TypeValueNotation | TypeValueNotationWrapper): typeof v extends TypeValueNotationWrapper ? SerializableObject : Serializable => {
        const wrapper = is_tvn_wrapper(v)
        if (!wrapper && !is_tvn(v)) {
            console.error(`from_type_value_notation`, v)
            throw new Error(`from_type_value_notation: input is not in TypeValue notation`)
        }
        if (wrapper)
            return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, from_type_value_notation(v)]))
        if (v._type === "object" && v._value instanceof Object)
            return Object.fromEntries(Object.entries(v._value).map(([k, v]) => [k, from_type_value_notation(v)]))
        if (v._type === "array" && v._value instanceof Array)
            return v._value.map(from_type_value_notation)
        return v._value
    }
import CardContent, { CardContentProps } from '@mui/material/CardContent'
import { Theme } from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import PrettyObject, {
    PrettyObjectFromQuery,
} from '../../prettify/PrettyObject'
import { deep_copy, has } from '../../misc'
import {
    CHILD_PROPERTY_NAMES,
    FAMILY_LOOKUP_KEYS,
    FIELDS,
    GalvResource,
    get_is_family,
    ICONS,
    LookupKey,
    Serializable,
    SerializableObject,
} from '../../../constants'
import {
    from_type_value_notation,
    to_type_value_notation_wrapper,
    TypeValueNotation,
    TypeValueNotationWrapper,
} from '../../TypeValueNotation'
import LoadingChip from '../../LoadingChip'
import React, { useEffect, useRef } from 'react'
import { useApiResource } from '../../ApiResourceContext'
import PropertiesDivider from '../utils/PropertiesDivider'
import { useUndoRedoContext } from '../../UndoRedoContext'
import ResourceChip from '../../ResourceChip'
import { IconType } from 'react-icons'

const CUSTOM_BODIES: Partial<Record<LookupKey, typeof CardBody>> = {} as const

export type CardBodyProps = {
    isEditMode?: boolean
    fieldErrors: Record<string, string>
} & Omit<CardContentProps, 'children'>

export default function CardBody<T extends GalvResource>({
    isEditMode,
    fieldErrors,
    ...props
}: CardBodyProps) {
    const {
        apiResource,
        apiResourceDescription,
        resourceId,
        lookupKey,
        family,
    } = useApiResource<T>()

    const familyKey: LookupKey | undefined = has(FAMILY_LOOKUP_KEYS, lookupKey)
        ? FAMILY_LOOKUP_KEYS[lookupKey]
        : undefined
    const FAMILY_ICON: IconType | undefined = familyKey
        ? ICONS[familyKey]
        : undefined

    // useContext is wrapped in useRef because we update the context in our useEffect API data hook
    const UndoRedo = useUndoRedoContext<T>()
    const UndoRedoRef = useRef(UndoRedo)

    useEffect(() => {
        if (apiResource) {
            const data = deep_copy(apiResource)
            Object.entries(FIELDS[lookupKey]).forEach(([k, v]) => {
                if (v.read_only) {
                    delete data[k as keyof typeof data]
                }
            })
            apiResourceDescription &&
                Object.entries(apiResourceDescription).forEach(([k, v]) => {
                    if (
                        v.read_only &&
                        data[k as keyof typeof data] !== undefined
                    ) {
                        delete data[k as keyof typeof data]
                    }
                })
            UndoRedoRef.current.set(data)
        }
    }, [apiResource, lookupKey])

    if (has(CUSTOM_BODIES, lookupKey)) {
        // This must exist because of has() check
        const CustomBody = CUSTOM_BODIES[lookupKey]!
        return <CustomBody fieldErrors={fieldErrors} {...props} />
    }

    return (
        <CardContent
            sx={{
                maxHeight: isEditMode ? '80vh' : 'unset',
                overflowY: 'auto',
                '& li': isEditMode
                    ? { marginTop: (t: Theme) => t.spacing(0.5) }
                    : undefined,
                '& table': isEditMode
                    ? {
                          borderCollapse: 'separate',
                          borderSpacing: (t: Theme) => t.spacing(0.5),
                      }
                    : undefined,
            }}
            {...props}
        >
            <Stack spacing={1}>
                <PropertiesDivider>Read-only properties</PropertiesDivider>
                {apiResource && (
                    <PrettyObjectFromQuery
                        resourceId={resourceId}
                        lookupKey={lookupKey}
                        key="read-props"
                        filter={(d, lookupKey) => {
                            const data = deep_copy(d)
                            Object.entries(FIELDS[lookupKey]).forEach(
                                ([k, v]) => {
                                    if (!v.read_only)
                                        delete data[k as keyof typeof data]
                                },
                            )
                            apiResourceDescription &&
                                Object.entries(apiResourceDescription).forEach(
                                    ([k, v]) => {
                                        if (
                                            !v.read_only &&
                                            data[k as keyof typeof data] !==
                                                undefined
                                        )
                                            delete data[k as keyof typeof data]
                                    },
                                )
                            // Unrecognised fields are always editable
                            Object.keys(data).forEach((k) => {
                                const in_description =
                                    apiResourceDescription &&
                                    Object.keys(
                                        apiResourceDescription,
                                    ).includes(k)
                                if (
                                    !Object.keys(FIELDS[lookupKey]).includes(
                                        k,
                                    ) &&
                                    !in_description
                                )
                                    delete data[k as keyof typeof data]
                            })
                            return data
                        }}
                    />
                )}
                <PropertiesDivider>Editable properties</PropertiesDivider>
                {UndoRedo.current && (
                    <PrettyObject<TypeValueNotationWrapper>
                        key="write-props"
                        target={
                            // All Pretty* components expect a TypeValue notated target
                            to_type_value_notation_wrapper(
                                // Drop custom_properties from the target (custom properties are handled below)
                                Object.fromEntries(
                                    Object.entries(UndoRedo.current).filter(
                                        (e) => e[0] !== 'custom_properties',
                                    ),
                                ) as SerializableObject,
                                lookupKey,
                            )
                        }
                        fieldErrors={fieldErrors}
                        edit_mode={isEditMode}
                        lookupKey={lookupKey}
                        onEdit={(
                            v: TypeValueNotation | TypeValueNotationWrapper,
                        ) => {
                            const core_properties = from_type_value_notation(
                                v,
                            ) as T
                            if (has(UndoRedo.current, 'custom_properties')) {
                                UndoRedo.update({
                                    ...core_properties,
                                    custom_properties:
                                        UndoRedo.current.custom_properties,
                                })
                            } else {
                                UndoRedo.update(core_properties)
                            }
                        }}
                    />
                )}
                {has(apiResource, 'custom_properties') && (
                    <PropertiesDivider>Custom properties</PropertiesDivider>
                )}
                {has(apiResource, 'custom_properties') &&
                    has(UndoRedo.current, 'custom_properties') &&
                    UndoRedo.current && (
                        <PrettyObject<TypeValueNotationWrapper>
                            key="custom-props"
                            // custom_properties are already TypeValue notated
                            target={{
                                ...(UndoRedo.current
                                    .custom_properties as TypeValueNotationWrapper),
                            }}
                            edit_mode={isEditMode}
                            lookupKey={lookupKey}
                            onEdit={(v: Serializable) =>
                                UndoRedo.update({
                                    ...UndoRedo.current,
                                    custom_properties: v,
                                })
                            }
                            canEditKeys
                        />
                    )}
                {family && (
                    <PropertiesDivider>
                        Inherited from
                        {family && familyKey ? (
                            <ResourceChip
                                resourceId={family.id as string}
                                lookupKey={familyKey}
                            />
                        ) : (
                            FAMILY_ICON && (
                                <LoadingChip icon={<FAMILY_ICON />} />
                            )
                        )}
                    </PropertiesDivider>
                )}
                {family && familyKey && (
                    <PrettyObjectFromQuery
                        resourceId={family.id as string}
                        lookupKey={familyKey}
                        filter={(d, lookupKey) => {
                            const data = deep_copy(d) as T
                            if (
                                get_is_family(lookupKey) &&
                                has(data, CHILD_PROPERTY_NAMES[lookupKey])
                            )
                                delete data[CHILD_PROPERTY_NAMES[lookupKey]]
                            // Keys child has are not inherited
                            Object.keys(d).forEach(
                                (k) =>
                                    apiResource?.[k as keyof T] !== undefined &&
                                    delete data[k as keyof T],
                            )
                            return data
                        }}
                    />
                )}
            </Stack>
        </CardContent>
    )
}

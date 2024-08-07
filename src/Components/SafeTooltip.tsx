import Tooltip, { TooltipProps } from '@mui/material/Tooltip'
import React, { AriaRole } from 'react'
import { has } from './misc'

export type SafeTooltipProps = TooltipProps & { disabledRole?: AriaRole }

/**
 * The `Tooltip` component from MUI has a difficult history with disabled children.
 * If you have a disabled child, the tooltip will not show up.
 * The common solution is to wrap the child in a `span`, but if you do so, the tooltip will
 * add the `aria-label` tag to the `span` instead of the child.
 * This means that storybook-a11y will complain `<span>` is not permitted to have an `aria-label` attribute.
 *
 * Our solution in this component is to use a `SafeTooltip` component that will wrap the child in a `span`
 * if it is disabled, but will otherwise just return the child.
 */
export default function SafeTooltip({
    children,
    disabledRole,
    ...props
}: SafeTooltipProps) {
    if (
        React.isValidElement(children) &&
        has(children, 'props') &&
        has(children.props, 'disabled') &&
        children?.props?.disabled
    ) {
        // Inject an aria-label into the child as well as the span.
        const child = React.cloneElement(children, {
            // @ts-expect-error aria-label may not exist on child, which is fine
            'aria-label': children.props['aria-label'] ?? props.title,
            // @ts-expect-error aria-disabled may not exist on child, which is fine
            'aria-disabled': children.props['aria-disabled'] ?? true,
            // @ts-expect-error aria-hidden may not exist on child, which is fine
            'aria-hidden': children.props['aria-hidden'] ?? true,
        })
        return (
            <Tooltip {...props}>
                <span role={disabledRole ?? 'button'} aria-disabled={true}>
                    {child}
                </span>
            </Tooltip>
        )
    }
    return <Tooltip {...props}>{children}</Tooltip>
}

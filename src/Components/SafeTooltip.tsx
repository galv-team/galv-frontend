import Tooltip, { TooltipProps } from '@mui/material/Tooltip'
import React, { AriaRole, forwardRef } from 'react'
import { has } from './misc'

export type SafeTooltipProps = TooltipProps & {
    disabledRole?: AriaRole
    forceWrap?: boolean
}

/**
 * ## Usage
 * SafeTooltip is a wrapper around the MUI Tooltip component that ensures that the tooltip
 * will show up even if the child is disabled.
 * Elements that will _never_ be disabled can simply use the MUI Tooltip component.
 *
 * The SafeTooltip component can have difficulty with non-interactive children.
 * In the disabled condition, this is solved by wrapping the child in a `span`.
 * In the enabled condition, you can solve this by setting `forceWrap` to `true`.
 *
 * So while you might call a button like this:
 * ```tsx
 * <SafeTooltip title="This is a button"><Button>Click me</Button></SafeTooltip>
 * ```
 * You might call a non-interactive element like this:
 * ```tsx
 * <SafeTooltip title="This is a paragraph" forceWrap={true}><p>Some text</p></SafeTooltip>
 * ```
 *
 * In the former case, the child will inherit the `aria-label` from the tooltip.
 * In the latter case, the child will be wrapped in a `span` and the `aria-label` will be added to that `span` wrapper.
 *
 * ## Background
 * The `Tooltip` component from MUI has a difficult history with disabled children.
 * If you have a disabled child, the tooltip will not show up.
 * The common solution is to wrap the child in a `span`, but if you do so, the tooltip will
 * add the `aria-label` tag to the `span` instead of the child.
 * This means that storybook-a11y will complain `<span>` is not permitted to have an `aria-label` attribute.
 *
 * Our solution in this component is to use a `SafeTooltip` component that will wrap the child in a `span`
 * if it is disabled, but will otherwise just return the child.
 */
const SafeTooltip = forwardRef(function SafeTooltip(
    { children, disabledRole, forceWrap, ...props }: SafeTooltipProps,
    ref,
) {
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
            <Tooltip {...props} ref={ref}>
                <span role={disabledRole ?? 'button'} aria-disabled={true}>
                    {child}
                </span>
            </Tooltip>
        )
    }
    // Wrap in a fragment to avoid warnings about Expected an element that can hold a ref.
    if (forceWrap)
        return (
            <Tooltip {...props} ref={ref}>
                <span>{children}</span>
            </Tooltip>
        )
    // Allow the child to stand on its own.
    return (
        <Tooltip {...props} ref={ref}>
            {children}
        </Tooltip>
    )
})

export default SafeTooltip

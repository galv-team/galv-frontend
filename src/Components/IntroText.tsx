import React from 'react'
import Markdown, { ExtraProps } from 'react-markdown'
import { Link } from 'react-router-dom'
import { INTRODUCTIONS } from '../constants'

function RouterLink(
    props: React.ClassAttributes<HTMLAnchorElement> &
        React.AnchorHTMLAttributes<HTMLAnchorElement> &
        ExtraProps,
) {
    if (props.href === undefined) return <a {...props} />
    return props.href.match(/^((https?|mailto):)?\/\//) ? (
        <a href={props.href}>{props.children}</a>
    ) : (
        <Link to={props.href}>{props.children}</Link>
    )
}

export default function IntroText({ k }: { k: keyof typeof INTRODUCTIONS }) {
    return (
        <Markdown
            components={{
                // Map `a` (`[label](url)`) to use `Link`s.
                a(props) {
                    return <RouterLink {...props} />
                },
            }}
        >
            {INTRODUCTIONS[k]}
        </Markdown>
    )
}

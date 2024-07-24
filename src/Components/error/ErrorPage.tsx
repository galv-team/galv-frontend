import { CardProps } from '@mui/material/Card'
import React from 'react'
import ErrorCard, { ErrorCardProps } from './ErrorCard'

export type ErrorProps = {
    status?: number | null | undefined
    message?: string
    detail?: string
    target?: string | number
}

export default function ErrorPage(props: ErrorCardProps & CardProps) {
    return <ErrorCard elevation={0} {...(props as CardProps)} />
}

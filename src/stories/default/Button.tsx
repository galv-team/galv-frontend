// button.component.tsx

import React from 'react'
import {
    ButtonProps as MuiButtonProps,
    default as MuiButton,
} from '@mui/material/Button'

export interface ButtonProps extends MuiButtonProps {
    label?: string
}

export const Button = ({ label, ...rest }: ButtonProps) => (
    <MuiButton {...rest}>{label ?? 'Button'}</MuiButton>
)

export default Button

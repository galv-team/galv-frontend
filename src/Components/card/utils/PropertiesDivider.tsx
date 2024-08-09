import React, {PropsWithChildren} from 'react'
import Divider, {DividerProps} from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

export default function PropertiesDivider({children, ...props}: PropsWithChildren<DividerProps>) {
    return (
        <Divider component="div" role="presentation" {...props}>
            <Typography variant="h5">{children}</Typography>
        </Divider>
    )
}
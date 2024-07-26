import { AxiosError } from 'axios'
import Alert, { AlertProps } from '@mui/material/Alert'
import ListItem from '@mui/material/ListItem'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import { ReactNode, useState } from 'react'
import AlertTitle from '@mui/material/AlertTitle'

export type AxiosErrorAlertProps = {
    error: AxiosError
    maxErrors: number
}

export function AxiosErrorAlertBox({
    title,
    error,
    action,
    ...props
}: { title: string; error: string; action?: ReactNode } & AlertProps) {
    return (
        <Alert severity="error" {...props} action={action}>
            {!/^_/.test(title) && <AlertTitle>{title}</AlertTitle>}
            {error}
        </Alert>
    )
}

export default function AxiosErrorAlert({
    error,
    maxErrors,
}: AxiosErrorAlertProps) {
    const [expanded, setExpanded] = useState(false)
    const error_object =
        (error.response?.data || {
            non_field_errors: 'An unknown error occurred.',
        }) instanceof Array
            ? Object.fromEntries(
                  error.response?.data.map((e: string, i: number) => [
                      `_${i}`,
                      e,
                  ]),
              )
            : error.response?.data

    if ('non_field_errors' in error_object) {
        error_object._ = error_object.non_field_errors
        delete error_object.non_field_errors
    }
    const errors = Object.entries(error_object).sort(([key1], [key2]) =>
        key2.localeCompare(key1),
    )
    // We now have an array of [key, value] pairs sorted by key (in reverse order so field errors come first)

    const display_errors = errors.slice(0, maxErrors)
    const hidden_errors = errors.slice(maxErrors)

    return (
        <List>
            {display_errors.map(([title, error], index) => {
                if (index === maxErrors - 1 && hidden_errors.length > 0) {
                    return (
                        <ListItem key={index}>
                            <AxiosErrorAlertBox
                                title={title}
                                error={String(error)}
                                action={
                                    <Button
                                        color="inherit"
                                        size="small"
                                        onClick={() => {
                                            setExpanded(!expanded)
                                        }}
                                    >
                                        {expanded ? 'Hide' : 'Show'}{' '}
                                        {hidden_errors.length} more
                                    </Button>
                                }
                            />
                        </ListItem>
                    )
                }
                return (
                    <ListItem key={index}>
                        <AxiosErrorAlertBox
                            title={title}
                            error={String(error)}
                        />
                    </ListItem>
                )
            })}
            {expanded &&
                hidden_errors.map(([title, error], index) => (
                    <ListItem key={index}>
                        <AxiosErrorAlertBox
                            title={title}
                            error={String(error)}
                        />
                    </ListItem>
                ))}
        </List>
    )
}
